// /api/stock-data.js - 统一的股票数据API端点
// 合并了 quote、profile、metrics 功能，减少API文件数量

export default async function handler(request, response) {
  const { symbol, type } = request.query;
  
  if (!symbol) {
    return response.status(400).json({ error: 'Stock symbol is required' });
  }
  
  if (!type || !['quote', 'profile', 'metrics', 'all'].includes(type)) {
    return response.status(400).json({ error: 'Type must be one of: quote, profile, metrics, all' });
  }

  const API_KEY = process.env.FINNHUB_API_KEY;
  if (!API_KEY) {
    return response.status(500).json({ error: 'Finnhub API key is not configured' });
  }

  try {
    let result = {};
    
    if (type === 'all') {
      // 并行获取所有数据
      const [quoteData, profileData, metricsData] = await Promise.all([
        fetchQuote(symbol, API_KEY),
        fetchProfile(symbol, API_KEY),
        fetchMetrics(symbol, API_KEY)
      ]);
      
      result = {
        quote: quoteData,
        profile: profileData,
        metrics: metricsData
      };
    } else {
      // 获取单个数据类型
      switch (type) {
        case 'quote':
          result = await fetchQuote(symbol, API_KEY);
          break;
        case 'profile':
          result = await fetchProfile(symbol, API_KEY);
          break;
        case 'metrics':
          result = await fetchMetrics(symbol, API_KEY);
          break;
      }
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    
    // 根据数据类型设置不同的缓存策略
    if (type === 'quote') {
      response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    } else {
      response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    }
    
    response.status(200).json(result);
  } catch (error) {
    console.error(`API /stock-data Error (${type}):`, error);
    response.status(500).json({ error: `Failed to fetch ${type} data.` });
  }
}

// 获取股票报价
async function fetchQuote(symbol, apiKey) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Quote API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 检查是否有有效数据
  if (data.c === 0 && data.d === 0) {
    throw new Error(`No quote data found for symbol: ${symbol}`);
  }
  
  return data;
}

// 获取公司资料
async function fetchProfile(symbol, apiKey) {
  const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Profile API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 检查是否有有效数据
  if (Object.keys(data).length === 0) {
    throw new Error(`No profile found for symbol: ${symbol}`);
  }
  
  return data;
}

// 获取财务指标
async function fetchMetrics(symbol, apiKey) {
  const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol.toUpperCase()}&metric=all&token=${apiKey}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Metrics API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 检查是否有有效数据
  if (!data || !data.metric || Object.keys(data.metric).length === 0) {
    throw new Error(`No metrics found for symbol: ${symbol}`);
  }
  
  return data.metric;
}