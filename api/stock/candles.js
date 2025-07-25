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
  
  const { symbol, resolution = 'D', from, to } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }
  
  // 设置默认时间范围（如果未提供）
  const toTime = to || Math.floor(Date.now() / 1000);
  const fromTime = from || (toTime - 30 * 24 * 60 * 60); // 默认30天
  
  try {
    // 使用缓存API获取数据
    const cacheApiUrl = `${req.headers.origin || 'http://localhost:3000'}/api/cache/stock-data?symbol=${symbol}&type=candles&resolution=${resolution}&from=${fromTime}&to=${toTime}`;
    
    const response = await fetch(cacheApiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cache API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 添加额外信息
    const finalResult = {
      ...result.data,
      symbol: symbol.toUpperCase(),
      resolution,
      from: fromTime,
      to: toTime,
      timestamp: result.timestamp,
      cached: result.cached,
      source: result.source
    };
    
    // 如果是过期缓存，添加警告
    if (result.stale) {
      finalResult.warning = result.warning;
    }
    
    return res.status(200).json(finalResult);
    
  } catch (error) {
    console.error('Candles API error:', error);
    
    // 如果缓存API失败，生成模拟K线数据作为降级方案
    const mockCandles = generateMockCandles(symbol, resolution, fromTime, toTime);
    
    const finalMockData = {
      ...mockCandles,
      symbol: symbol.toUpperCase(),
      resolution,
      from: fromTime,
      to: toTime,
      timestamp: new Date().toISOString(),
      cached: false,
      source: 'fallback',
      warning: 'Using fallback data due to API error'
    };
    
    return res.status(200).json(finalMockData);
  }
}

// 生成模拟K线数据
function generateMockCandles(symbol, resolution, from, to) {
  const periods = {
    '1': 60, // 1分钟
    '5': 300, // 5分钟
    '15': 900, // 15分钟
    '30': 1800, // 30分钟
    '60': 3600, // 1小时
    'D': 86400, // 1天
    'W': 604800, // 1周
    'M': 2592000 // 1月（30天）
  };
  
  const interval = periods[resolution] || 86400;
  const points = Math.min(Math.floor((to - from) / interval), 1000); // 最多1000个点
  
  const timestamps = [];
  const opens = [];
  const highs = [];
  const lows = [];
  const closes = [];
  const volumes = [];
  
  let basePrice = 150; // 基础价格
  let currentPrice = basePrice;
  
  for (let i = 0; i < points; i++) {
    const timestamp = from + (i * interval);
    timestamps.push(timestamp);
    
    // 生成价格波动
    const volatility = 0.02; // 2%波动率
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    opens.push(open);
    highs.push(high);
    lows.push(low);
    closes.push(close);
    volumes.push(volume);
    
    currentPrice = close;
  }
  
  return {
    s: 'ok',
    t: timestamps,
    o: opens,
    h: highs,
    l: lows,
    c: closes,
    v: volumes
  };
}