// /api/stock/chinese-name.js
// 获取股票的中文名称

import { Pool } from 'pg';

let pool;

// 初始化数据库连接池
function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Database connection string not found');
    }
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

// 本地中文名称字典 (作为数据库的备用方案)
const localChineseNames = {
  'AAPL': '苹果公司',
  'MSFT': '微软公司', 
  'GOOGL': '谷歌公司',
  'TSLA': '特斯拉公司',
  'NVDA': '英伟达公司',
  'AMZN': '亚马逊公司',
  'BRK.B': '伯克希尔哈撒韦公司',
  'META': 'Meta公司',
  'NFLX': '奈飞公司',
  'BABA': '阿里巴巴集团'
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
    // 首先尝试数据库查询
    const dbPool = getPool();
    const query = 'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1';
    const result = await dbPool.query(query, [upperSymbol]);
    
    if (result.rows.length > 0) {
      const stock = result.rows[0];
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: stock.symbol,
        company_name: stock.company_name,
        chinese_name: stock.chinese_name || stock.company_name,
        success: true,
        source: 'database'
      }));
      return;
    }
  } catch (error) {
    console.warn('Database query failed, using local fallback:', error.message);
  }
  
  // 数据库查询失败或无结果时，使用本地字典
  const chineseName = localChineseNames[upperSymbol];
  
  if (chineseName) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      symbol: upperSymbol,
      company_name: null,
      chinese_name: chineseName,
      success: true,
      source: 'local'
    }));
  } else {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ 
      error: `No Chinese name found for symbol: ${symbol}`,
      symbol: upperSymbol,
      chinese_name: null,
      company_name: null,
      success: false
    }));
  }
}