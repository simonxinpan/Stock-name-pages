// Finnhub公司资料API代理
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
    const cacheApiUrl = `${req.headers.origin || 'http://localhost:3000'}/api/cache/stock-data?symbol=${symbol}&type=profile`;
    
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
    console.error('Profile API error:', error);
    
    // 如果缓存API失败，返回模拟数据作为降级方案
    const mockProfiles = {
      AAPL: {
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        finnhubIndustry: 'Technology',
        country: 'US',
        currency: 'USD',
        employeeTotal: 164000,
        marketCapitalization: 2800000,
        weburl: 'https://www.apple.com',
        logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png'
      },
      TSLA: {
        name: 'Tesla, Inc.',
        exchange: 'NASDAQ',
        finnhubIndustry: 'Automotive',
        country: 'US',
        currency: 'USD',
        employeeTotal: 127855,
        marketCapitalization: 790000,
        weburl: 'https://www.tesla.com',
        logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/TSLA.png'
      }
    };
    
    const mockData = mockProfiles[symbol.toUpperCase()] || {
      name: `${symbol.toUpperCase()} Company`,
      exchange: 'NASDAQ',
      finnhubIndustry: 'Technology',
      country: 'US',
      currency: 'USD',
      employeeTotal: 50000,
      marketCapitalization: 100000,
      weburl: `https://www.${symbol.toLowerCase()}.com`,
      logo: ''
    };
    
    const finalMockData = {
      ...mockData,
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      cached: false,
      source: 'fallback',
      warning: 'Using fallback data due to API error'
    };
    
    return res.status(200).json(finalMockData);
  }
}