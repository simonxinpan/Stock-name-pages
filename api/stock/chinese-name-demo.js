// /api/stock/chinese-name.js
// 获取股票的中文名称 - 自动同步版本
// 最后更新: 2025-09-13T11:41:53.657Z
// 总计: 40 个股票

import { Pool } from 'pg';

let pool;

// 初始化数据库连接池
function getPool() {
  if (!pool) {
    const connectionString = process.env.NEON_DATABASE_URL || 
                            process.env.POSTGRES_URL || 
                            process.env.DATABASE_URL;
    
    console.log('🔍 [Chinese Name API] Environment variables check:');
    console.log('- NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? '✅ Found' : '❌ Not found');
    console.log('- POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Found' : '❌ Not found');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Not found');
    
    if (!connectionString) {
      console.error('❌ [Chinese Name API] No database connection string found!');
      throw new Error('Database connection string not found');
    }
    
    console.log('✅ [Chinese Name API] Using connection string:', connectionString.substring(0, 20) + '...');
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    pool.on('error', (err) => {
      console.error('❌ [Chinese Name API] Database pool error:', err);
    });
  }
  return pool;
}

// 从Neon数据库同步的中文名称字典 (40 个股票)
const localChineseNames = {
  'AAPL': '苹果公司',
  'ADBE': '奥多比公司',
  'AMZN': '亚马逊公司',
  'BABA': '阿里巴巴集团',
  'BAC': '美国银行',
  'BEKE': '贝壳找房',
  'BIDU': '百度公司',
  'BILI': '哔哩哔哩',
  'CRM': 'Salesforce公司',
  'DIDI': '滴滴出行',
  'DIS': '迪士尼公司',
  'EDU': '新东方教育',
  'GOOGL': '谷歌公司',
  'HD': '家得宝公司',
  'IQ': '爱奇艺',
  'JD': '京东集团',
  'JNJ': '强生公司',
  'JPM': '摩根大通银行',
  'LI': '理想汽车',
  'MA': '万事达卡公司',
  'META': 'Meta平台公司',
  'MSFT': '微软公司',
  'NFLX': '奈飞公司',
  'NIO': '蔚来汽车',
  'NTES': '网易公司',
  'NVDA': '英伟达公司',
  'PDD': '拼多多',
  'PG': '宝洁公司',
  'SINA': '新浪公司',
  'TAL': '好未来教育',
  'TME': '腾讯音乐',
  'TSLA': '特斯拉公司',
  'UNH': '联合健康集团',
  'V': '维萨公司',
  'VIPS': '唯品会',
  'WB': '微博',
  'XOM': '埃克森美孚公司',
  'XPEV': '小鹏汽车',
  'YMM': '满帮集团',
  'ZTO': '中通快递',
};

export default async function handler(request, response) {
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end();
    return;
  }
  
  if (request.method !== 'GET') {
    response.writeHead(405, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const { symbol } = request.query;
  if (!symbol) {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Stock symbol is required' }));
  }

  const upperSymbol = symbol.toUpperCase();
  
  try {
    console.log(`🔍 [Chinese Name API] Querying for symbol: ${upperSymbol}`);
    
    // 首先检查本地字典
    if (localChineseNames[upperSymbol]) {
      console.log(`✅ [Chinese Name API] Found in local dictionary: ${localChineseNames[upperSymbol]}`);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({
        symbol: upperSymbol,
        chineseName: localChineseNames[upperSymbol],
        source: 'local_dictionary',
        lastUpdated: '2025-09-13T11:41:53.657Z'
      }));
    }
    
    // 如果本地字典没有，尝试数据库查询
    const dbPool = getPool();
    const queries = [
      'SELECT ticker, company_name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, company_name, name_zh FROM stocks WHERE ticker = $1',
      'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, company_name, name_zh FROM stocks WHERE symbol = $1'
    ];
    
    let result = null;
    for (const query of queries) {
      try {
        result = await dbPool.query(query, [upperSymbol]);
        if (result.rows.length > 0) break;
      } catch (queryError) {
        continue;
      }
    }
    
    if (result && result.rows.length > 0) {
      const stock = result.rows[0];
      const chineseName = stock.chinese_name || stock.name_zh || stock.company_name;
      
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: stock.ticker || stock.symbol,
        chineseName: chineseName,
        source: 'database',
        lastUpdated: new Date().toISOString()
      }));
    } else {
      console.log(`⚠️ [Chinese Name API] No Chinese name found for: ${upperSymbol}`);
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: upperSymbol,
        error: 'Chinese name not found',
        source: 'not_found'
      }));
    }
    
  } catch (error) {
    console.error(`❌ [Chinese Name API] Error for ${upperSymbol}:`, error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      symbol: upperSymbol,
      error: 'Internal server error',
      details: error.message
    }));
  }
}