// Neon数据库缓存API - 股票数据缓存服务
// 用于避免频繁调用Finnhub API，提高性能和稳定性

import { Pool } from '@neondatabase/serverless';

// 缓存配置
const CACHE_DURATION = {
  quote: 60, // 股票报价缓存60秒
  profile: 3600, // 公司资料缓存1小时
  candles: 300, // K线数据缓存5分钟
  news: 1800 // 新闻缓存30分钟
};

// API调用频率限制配置
const API_LIMITS = {
  maxCallsPerMinute: 60, // Finnhub免费版每分钟60次
  maxCallsPerDay: 1000 // 每日限制
};

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { symbol, type, resolution, from, to } = req.query;
  
  if (!symbol || !type) {
    return res.status(400).json({ error: 'Missing required parameters: symbol, type' });
  }
  
  try {
    // 初始化数据库连接
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // 检查缓存
    const cachedData = await getCachedData(pool, symbol, type, { resolution, from, to });
    
    if (cachedData && !isCacheExpired(cachedData.updated_at, type)) {
      console.log(`Cache hit for ${symbol} ${type}`);
      return res.status(200).json({
        data: cachedData.data,
        cached: true,
        timestamp: cachedData.updated_at,
        source: 'cache'
      });
    }
    
    // 检查API调用频率限制
    const canCallAPI = await checkAPILimits(pool);
    if (!canCallAPI) {
      console.log('API rate limit exceeded, returning stale cache if available');
      if (cachedData) {
        return res.status(200).json({
          data: cachedData.data,
          cached: true,
          stale: true,
          timestamp: cachedData.updated_at,
          source: 'stale_cache',
          warning: 'API rate limit exceeded, returning cached data'
        });
      } else {
        return res.status(429).json({ 
          error: 'API rate limit exceeded and no cached data available',
          retryAfter: 60
        });
      }
    }
    
    // 调用Finnhub API获取新数据
    const freshData = await fetchFromFinnhub(symbol, type, { resolution, from, to });
    
    // 更新缓存
    await updateCache(pool, symbol, type, freshData, { resolution, from, to });
    
    // 记录API调用
    await recordAPICall(pool);
    
    console.log(`Fresh data fetched for ${symbol} ${type}`);
    return res.status(200).json({
      data: freshData,
      cached: false,
      timestamp: new Date().toISOString(),
      source: 'api'
    });
    
  } catch (error) {
    console.error('Cache API error:', error);
    
    // 如果API调用失败，尝试返回缓存数据
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const cachedData = await getCachedData(pool, symbol, type, { resolution, from, to });
      
      if (cachedData) {
        return res.status(200).json({
          data: cachedData.data,
          cached: true,
          stale: true,
          timestamp: cachedData.updated_at,
          source: 'fallback_cache',
          warning: 'API error, returning cached data'
        });
      }
    } catch (cacheError) {
      console.error('Cache fallback error:', cacheError);
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch data',
      details: error.message 
    });
  }
}

// 获取缓存数据
async function getCachedData(pool, symbol, type, params = {}) {
  const cacheKey = generateCacheKey(symbol, type, params);
  
  const query = `
    SELECT data, updated_at 
    FROM stock_cache 
    WHERE cache_key = $1 
    ORDER BY updated_at DESC 
    LIMIT 1
  `;
  
  const result = await pool.query(query, [cacheKey]);
  return result.rows[0] || null;
}

// 检查缓存是否过期
function isCacheExpired(updatedAt, type) {
  const now = new Date();
  const cacheTime = new Date(updatedAt);
  const diffSeconds = (now - cacheTime) / 1000;
  
  return diffSeconds > CACHE_DURATION[type];
}

// 检查API调用频率限制
async function checkAPILimits(pool) {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // 检查每分钟限制
  const minuteQuery = `
    SELECT COUNT(*) as count 
    FROM api_calls 
    WHERE created_at > $1
  `;
  
  const minuteResult = await pool.query(minuteQuery, [oneMinuteAgo]);
  const callsPerMinute = parseInt(minuteResult.rows[0].count);
  
  if (callsPerMinute >= API_LIMITS.maxCallsPerMinute) {
    return false;
  }
  
  // 检查每日限制
  const dayQuery = `
    SELECT COUNT(*) as count 
    FROM api_calls 
    WHERE created_at > $1
  `;
  
  const dayResult = await pool.query(dayQuery, [oneDayAgo]);
  const callsPerDay = parseInt(dayResult.rows[0].count);
  
  return callsPerDay < API_LIMITS.maxCallsPerDay;
}

// 从Finnhub API获取数据
async function fetchFromFinnhub(symbol, type, params = {}) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error('Finnhub API key not configured');
  }
  
  let url;
  
  switch (type) {
    case 'quote':
      url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      break;
    case 'profile':
      url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
      break;
    case 'candles':
      const { resolution = 'D', from, to } = params;
      const toTime = to || Math.floor(Date.now() / 1000);
      const fromTime = from || (toTime - 30 * 24 * 60 * 60); // 默认30天
      url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromTime}&to=${toTime}&token=${apiKey}`;
      break;
    case 'news':
      const newsFrom = params.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newsTo = params.to || new Date().toISOString().split('T')[0];
      url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${newsFrom}&to=${newsTo}&token=${apiKey}`;
      break;
    default:
      throw new Error(`Unsupported data type: ${type}`);
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 检查API错误响应
  if (data.error) {
    throw new Error(`Finnhub API error: ${data.error}`);
  }
  
  return data;
}

// 更新缓存
async function updateCache(pool, symbol, type, data, params = {}) {
  const cacheKey = generateCacheKey(symbol, type, params);
  const now = new Date();
  
  const query = `
    INSERT INTO stock_cache (cache_key, symbol, data_type, data, updated_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (cache_key) 
    DO UPDATE SET 
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  `;
  
  await pool.query(query, [
    cacheKey,
    symbol,
    type,
    JSON.stringify(data),
    now
  ]);
}

// 记录API调用
async function recordAPICall(pool) {
  const query = `
    INSERT INTO api_calls (created_at)
    VALUES ($1)
  `;
  
  await pool.query(query, [new Date()]);
}

// 生成缓存键
function generateCacheKey(symbol, type, params = {}) {
  const baseKey = `${symbol}_${type}`;
  
  if (type === 'candles') {
    const { resolution = 'D', from, to } = params;
    return `${baseKey}_${resolution}_${from || 'default'}_${to || 'default'}`;
  }
  
  return baseKey;
}

// 清理过期缓存（可以通过定时任务调用）
export async function cleanupExpiredCache() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const query = `
    DELETE FROM stock_cache 
    WHERE updated_at < $1
  `;
  
  // 删除7天前的缓存
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const result = await pool.query(query, [sevenDaysAgo]);
  console.log(`Cleaned up ${result.rowCount} expired cache entries`);
  
  return result.rowCount;
}