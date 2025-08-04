// /api/get-chinese-name.js - 从Neon数据库获取股票中文名称
import { Pool } from 'pg';

// 创建数据库连接池
let pool;

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.NEON_DATABASE_URL || 
                       process.env.POSTGRES_URL || 
                       process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ [get-chinese-name] No database URL found in environment variables');
      throw new Error('Database configuration missing');
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    console.log('✅ [get-chinese-name] Database connection pool created');
  }
  return pool;
}

export default async function handler(request, response) {
  const { symbol } = request.query;
  
  if (!symbol) {
    console.log('❌ [get-chinese-name] No symbol provided');
    return response.status(400).json({ 
      error: 'Stock symbol is required',
      success: false 
    });
  }

  const upperSymbol = symbol.toUpperCase();
  console.log(`🔍 [get-chinese-name] Fetching Chinese name for symbol: ${upperSymbol}`);

  try {
    const pool = getPool();
    
    // 尝试多种可能的查询方式
    const queries = [
      'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, company_name, name_zh FROM stocks WHERE symbol = $1',
      'SELECT symbol, name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, name, name_zh FROM stocks WHERE symbol = $1',
      'SELECT ticker, company_name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, company_name, name_zh FROM stocks WHERE ticker = $1'
    ];

    for (const query of queries) {
      try {
        console.log(`🔄 [get-chinese-name] Trying query: ${query}`);
        const result = await pool.query(query, [upperSymbol]);
        
        if (result.rows.length > 0) {
          const stock = result.rows[0];
          console.log(`✅ [get-chinese-name] Found stock data:`, stock);
          
          // 智能获取中文名称字段
          const chineseName = stock.chinese_name || stock.name_zh || stock.company_name || stock.name;
          
          if (chineseName) {
            console.log(`✅ [get-chinese-name] Chinese name found: ${upperSymbol} -> ${chineseName}`);
            response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
            return response.status(200).json({
              symbol: upperSymbol,
              chinese_name: chineseName,
              success: true,
              source: 'database'
            });
          }
        }
      } catch (queryError) {
        console.warn(`⚠️ [get-chinese-name] Query failed: ${query}`, queryError.message);
        continue;
      }
    }
    
    console.log(`❌ [get-chinese-name] No Chinese name found in database for: ${upperSymbol}`);
    return response.status(404).json({ 
      error: `No Chinese name found for symbol: ${symbol}`,
      symbol: upperSymbol,
      success: false,
      source: 'database'
    });
    
  } catch (error) {
    console.error(`❌ [get-chinese-name] Database error for ${upperSymbol}:`, error);
    return response.status(500).json({ 
      error: 'Database query failed',
      message: error.message,
      symbol: upperSymbol,
      success: false
    });
  }
}