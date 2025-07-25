// Finnhub股票报价API代理
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
  
  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }
  
  try {
    // 使用缓存API获取数据
    const cacheApiUrl = `${req.headers.origin || 'http://localhost:3000'}/api/cache/stock-data?symbol=${symbol}&type=quote`;
    
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
    console.error('Quote API error:', error);
    
    // 如果缓存API失败，返回模拟数据作为降级方案
    const mockData = {
      c: 150.00 + (Math.random() - 0.5) * 10, // 当前价格
      d: (Math.random() - 0.5) * 5, // 变化
      dp: (Math.random() - 0.5) * 3, // 变化百分比
      h: 155.00, // 最高价
      l: 145.00, // 最低价
      o: 148.00, // 开盘价
      pc: 149.50, // 前收盘价
      v: Math.floor(Math.random() * 10000000) + 1000000, // 成交量
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      cached: false,
      source: 'fallback',
      warning: 'Using fallback data due to API error'
    };
    
    return res.status(200).json(mockData);
  }
}