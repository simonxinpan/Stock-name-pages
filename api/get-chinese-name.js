// /api/get-chinese-name.js (最终精准版)
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

export default async function handler(request, response) {
  const { symbol } = request.query;
  if (!symbol) {
    return response.status(400).json({ error: 'Stock symbol is required.' });
  }

  console.log(`[API /get-chinese-name] Received request for symbol: ${symbol.toUpperCase()}`);

  const client = await pool.connect();
  try {
    // *** 唯一的、核心的修改在这里！查询 stock_list 表！ ***
    const query = {
      text: 'SELECT name_zh FROM stock_list WHERE ticker = $1',
      values: [symbol.toUpperCase()],
    };
    
    const { rows } = await client.query(query);

    if (rows.length > 0) {
      console.log(`[API /get-chinese-name] SUCCESS: Found name "${rows[0].name_zh}" in stock_list for symbol: ${symbol}`);
      response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // 静态数据，可以大胆缓存
      response.status(200).json({ chinese_name: rows[0].name_zh });
    } else {
      console.warn(`[API /get-chinese-name] NOT FOUND: Chinese name not found in stock_list for symbol: ${symbol}`);
      response.status(404).json({ error: 'Chinese name not found for this symbol.' });
    }
  } catch (error) {
    console.error(`[API /get-chinese-name] Database query failed for symbol ${symbol}:`, error);
    response.status(500).json({ error: 'Database query failed.' });
  } finally {
      client.release();
  }
}