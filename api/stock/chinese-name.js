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

  try {
    const dbPool = getPool();
    
    // 查询股票的中文名称
    const query = 'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1';
    const result = await dbPool.query(query, [symbol.toUpperCase()]);
    
    if (result.rows.length === 0) {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ 
        error: `No stock found for symbol: ${symbol}`,
        symbol: symbol.toUpperCase(),
        chinese_name: null,
        company_name: null
      }));
    }
    
    const stock = result.rows[0];
    
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      symbol: stock.symbol,
      company_name: stock.company_name,
      chinese_name: stock.chinese_name || stock.company_name, // 如果没有中文名称，返回英文名称
      success: true
    }));
    
  } catch (error) {
    console.error('Database error:', error);
    
    // 如果数据库连接失败，返回降级响应
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ 
      error: 'Database connection failed',
      symbol: symbol.toUpperCase(),
      chinese_name: null,
      company_name: null,
      fallback: true
    }));
  }
}