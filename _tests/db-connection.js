// 测试数据库连接的API端点
// 路径: /api/test/db-connection

const { Pool } = require('pg');

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // 检查环境变量
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database URL not configured',
        env_check: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY
        }
      });
    }
    
    // 测试数据库连接
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // 执行简单查询
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    // 检查缓存表是否存在
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('stock_cache', 'api_calls', 'stocks')
      ORDER BY table_name
    `);
    
    await pool.end();
    
    return res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      database_info: {
        current_time: result.rows[0].current_time,
        version: result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]
      },
      tables_found: tableCheck.rows.map(row => row.table_name),
      environment: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });
    
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      environment: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });
  }
}