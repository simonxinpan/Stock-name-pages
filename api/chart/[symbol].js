// API路由: /api/chart/[symbol]?period=1D&from=timestamp&to=timestamp
// 获取指定股票的K线图数据

export default async function handler(req, res) {
  const { symbol } = req.query;
  const { period = '1D', from, to } = req.query;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    // 验证时间周期
    const validPeriods = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];
    if (!validPeriods.includes(period)) {
      res.status(400).json({ error: 'Invalid period. Valid periods: ' + validPeriods.join(', ') });
      return;
    }
    
    // 计算时间范围
    const timeRange = calculateTimeRange(period, from, to);
    
    // 首先尝试从数据库获取缓存数据
    let chartData = await getChartDataFromDatabase(symbol.toUpperCase(), period, timeRange);
    
    if (!chartData || chartData.length === 0) {
      // 如果没有缓存数据，从Polygon获取
      chartData = await fetchChartDataFromPolygon(symbol, timeRange);
      
      // 保存到数据库
      if (chartData && chartData.length > 0) {
        await saveChartDataToDatabase(symbol, period, chartData);
      }
    }
    
    res.status(200).json({
      symbol: symbol.toUpperCase(),
      period,
      data: chartData || [],
      count: chartData ? chartData.length : 0,
      timeRange
    });
    
  } catch (error) {
    console.error('Chart API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// 计算时间范围
function calculateTimeRange(period, from, to) {
  const now = Math.floor(Date.now() / 1000);
  let fromTimestamp, toTimestamp, resolution;
  
  if (from && to) {
    fromTimestamp = parseInt(from);
    toTimestamp = parseInt(to);
  } else {
    toTimestamp = now;
    
    switch (period) {
      case '1D':
        fromTimestamp = now - (24 * 60 * 60); // 1天
        resolution = '5'; // 5分钟
        break;
      case '1W':
        fromTimestamp = now - (7 * 24 * 60 * 60); // 1周
        resolution = '15'; // 15分钟
        break;
      case '1M':
        fromTimestamp = now - (30 * 24 * 60 * 60); // 1月
        resolution = '60'; // 1小时
        break;
      case '3M':
        fromTimestamp = now - (90 * 24 * 60 * 60); // 3月
        resolution = 'D'; // 日线
        break;
      case '6M':
        fromTimestamp = now - (180 * 24 * 60 * 60); // 6月
        resolution = 'D'; // 日线
        break;
      case '1Y':
        fromTimestamp = now - (365 * 24 * 60 * 60); // 1年
        resolution = 'D'; // 日线
        break;
      case '5Y':
        fromTimestamp = now - (5 * 365 * 24 * 60 * 60); // 5年
        resolution = 'W'; // 周线
        break;
      default:
        fromTimestamp = now - (24 * 60 * 60);
        resolution = '5';
    }
  }
  
  return {
    from: fromTimestamp,
    to: toTimestamp,
    resolution: resolution || 'D'
  };
}

// 从数据库获取K线数据
async function getChartDataFromDatabase(symbol, period, timeRange) {
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
        timestamp,
        open_price,
        high_price,
        low_price,
        close_price,
        volume
      FROM stock_candles 
      WHERE symbol = $1 
        AND period = $2
        AND timestamp >= $3 
        AND timestamp <= $4
        AND updated_at > NOW() - INTERVAL '10 minutes'
      ORDER BY timestamp ASC
    `;
    
    const result = await pool.query(query, [
      symbol, 
      period, 
      timeRange.from, 
      timeRange.to
    ]);
    
    return result.rows.map(row => ({
      timestamp: parseInt(row.timestamp),
      open: parseFloat(row.open_price),
      high: parseFloat(row.high_price),
      low: parseFloat(row.low_price),
      close: parseFloat(row.close_price),
      volume: parseInt(row.volume)
    }));
    
  } catch (error) {
    console.error('Database chart data error:', error);
    return null;
  } finally {
    await pool.end();
  }
}

// 从Polygon获取K线数据
async function fetchChartDataFromPolygon(symbol, timeRange) {
  const apiKey = process.env.POLYGON_API_KEY;
  
  if (!apiKey) {
    throw new Error('Polygon API key not configured');
  }
  
  // 转换时间戳为日期格式
  const fromDate = new Date(timeRange.from * 1000).toISOString().split('T')[0];
  const toDate = new Date(timeRange.to * 1000).toISOString().split('T')[0];
  
  // 根据分辨率确定时间跨度
  let timespan = 'day';
  let multiplier = 1;
  
  switch (timeRange.resolution) {
    case '5':
      timespan = 'minute';
      multiplier = 5;
      break;
    case '15':
      timespan = 'minute';
      multiplier = 15;
      break;
    case '60':
      timespan = 'hour';
      multiplier = 1;
      break;
    case 'D':
      timespan = 'day';
      multiplier = 1;
      break;
    case 'W':
      timespan = 'week';
      multiplier = 1;
      break;
    default:
      timespan = 'day';
      multiplier = 1;
  }
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error('No data available for this symbol and time range');
  }
  
  // 转换Polygon数据格式
  const chartData = data.results.map(candle => ({
    timestamp: Math.floor(candle.t / 1000), // 转换为秒级时间戳
    open: candle.o,
    high: candle.h,
    low: candle.l,
    close: candle.c,
    volume: candle.v
  }));
  
  return chartData;
}

// 保存K线数据到数据库
async function saveChartDataToDatabase(symbol, period, chartData) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // 批量插入数据
    const values = chartData.map(candle => 
      `('${symbol}', '${period}', ${candle.timestamp}, ${candle.open}, ${candle.high}, ${candle.low}, ${candle.close}, ${candle.volume}, NOW())`
    ).join(',');
    
    const query = `
      INSERT INTO stock_candles (
        symbol, period, timestamp, open_price, high_price, low_price, close_price, volume, updated_at
      ) VALUES ${values}
      ON CONFLICT (symbol, period, timestamp) 
      DO UPDATE SET
        open_price = EXCLUDED.open_price,
        high_price = EXCLUDED.high_price,
        low_price = EXCLUDED.low_price,
        close_price = EXCLUDED.close_price,
        volume = EXCLUDED.volume,
        updated_at = NOW()
    `;
    
    await pool.query(query);
    
  } catch (error) {
    console.error('Save chart data error:', error);
  } finally {
    await pool.end();
  }
}