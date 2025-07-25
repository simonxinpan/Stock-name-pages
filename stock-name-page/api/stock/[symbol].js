// API路由: /api/stock/[symbol]
// 获取指定股票代码的详细信息

export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  if (!symbol) {
    res.status(400).json({ error: 'Stock symbol is required' });
    return;
  }
  
  try {
    // 这里后端工程师可以连接真实数据库
    // 示例：从Neon数据库获取股票数据
    const stockData = await getStockFromDatabase(symbol.toUpperCase());
    
    if (!stockData) {
      // 如果数据库中没有数据，从Finnhub API获取
      const finnhubData = await fetchFromFinnhub(symbol);
      
      // 保存到数据库供下次使用
      await saveStockToDatabase(symbol, finnhubData);
      
      res.status(200).json(finnhubData);
    } else {
      res.status(200).json(stockData);
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// 从数据库获取股票数据的函数
async function getStockFromDatabase(symbol) {
  // 后端工程师在这里实现数据库连接逻辑
  // 示例使用Neon PostgreSQL
  
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    const query = `
      SELECT 
        symbol,
        company_name,
        current_price,
        change,
        change_percent,
        volume,
        market_cap,
        pe_ratio,
        eps,
        dividend_yield,
        beta,
        week_52_high,
        week_52_low,
        updated_at
      FROM stocks 
      WHERE symbol = $1 
      AND updated_at > NOW() - INTERVAL '5 minutes'
    `;
    
    const result = await pool.query(query, [symbol]);
    
    if (result.rows.length > 0) {
      return formatStockData(result.rows[0]);
    }
    
    return null;
    
  } catch (error) {
    console.error('Database error:', error);
    return null;
  } finally {
    await pool.end();
  }
}

// 从Finnhub API获取数据
async function fetchFromFinnhub(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY;
  
  if (!apiKey) {
    throw new Error('Finnhub API key not configured');
  }
  
  const baseUrl = 'https://finnhub.io/api/v1';
  
  // 并行获取多个数据源
  const [quote, profile, metrics] = await Promise.all([
    fetch(`${baseUrl}/quote?symbol=${symbol}&token=${apiKey}`).then(r => r.json()),
    fetch(`${baseUrl}/stock/profile2?symbol=${symbol}&token=${apiKey}`).then(r => r.json()),
    fetch(`${baseUrl}/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`).then(r => r.json())
  ]);
  
  return {
    symbol: symbol.toUpperCase(),
    companyName: profile.name || 'N/A',
    currentPrice: quote.c || 0,
    change: quote.d || 0,
    changePercent: quote.dp || 0,
    volume: quote.v || 0,
    marketCap: profile.marketCapitalization || 0,
    peRatio: metrics.metric?.peBasicExclExtraTTM || 0,
    eps: metrics.metric?.epsBasicExclExtraAnnual || 0,
    dividendYield: metrics.metric?.dividendYieldIndicatedAnnual || 0,
    beta: metrics.metric?.beta || 0,
    week52High: metrics.metric?.['52WeekHigh'] || 0,
    week52Low: metrics.metric?.['52WeekLow'] || 0,
    industry: profile.finnhubIndustry || 'N/A',
    country: profile.country || 'N/A',
    currency: profile.currency || 'USD',
    exchange: profile.exchange || 'N/A',
    ipo: profile.ipo || 'N/A',
    logo: profile.logo || '',
    phone: profile.phone || '',
    weburl: profile.weburl || '',
    updatedAt: new Date().toISOString()
  };
}

// 保存股票数据到数据库
async function saveStockToDatabase(symbol, data) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    const query = `
      INSERT INTO stocks (
        symbol, company_name, current_price, change, change_percent,
        volume, market_cap, pe_ratio, eps, dividend_yield, beta,
        week_52_high, week_52_low, industry, country, currency,
        exchange, ipo, logo, phone, weburl, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
      )
      ON CONFLICT (symbol) 
      DO UPDATE SET
        company_name = EXCLUDED.company_name,
        current_price = EXCLUDED.current_price,
        change = EXCLUDED.change,
        change_percent = EXCLUDED.change_percent,
        volume = EXCLUDED.volume,
        market_cap = EXCLUDED.market_cap,
        pe_ratio = EXCLUDED.pe_ratio,
        eps = EXCLUDED.eps,
        dividend_yield = EXCLUDED.dividend_yield,
        beta = EXCLUDED.beta,
        week_52_high = EXCLUDED.week_52_high,
        week_52_low = EXCLUDED.week_52_low,
        updated_at = NOW()
    `;
    
    await pool.query(query, [
      data.symbol, data.companyName, data.currentPrice, data.change, data.changePercent,
      data.volume, data.marketCap, data.peRatio, data.eps, data.dividendYield, data.beta,
      data.week52High, data.week52Low, data.industry, data.country, data.currency,
      data.exchange, data.ipo, data.logo, data.phone, data.weburl
    ]);
    
  } catch (error) {
    console.error('Save to database error:', error);
  } finally {
    await pool.end();
  }
}

// 格式化数据库返回的数据
function formatStockData(row) {
  return {
    symbol: row.symbol,
    companyName: row.company_name,
    currentPrice: parseFloat(row.current_price),
    change: parseFloat(row.change),
    changePercent: parseFloat(row.change_percent),
    volume: parseInt(row.volume),
    marketCap: parseInt(row.market_cap),
    peRatio: parseFloat(row.pe_ratio),
    eps: parseFloat(row.eps),
    dividendYield: parseFloat(row.dividend_yield),
    beta: parseFloat(row.beta),
    week52High: parseFloat(row.week_52_high),
    week52Low: parseFloat(row.week_52_low),
    updatedAt: row.updated_at
  };
}