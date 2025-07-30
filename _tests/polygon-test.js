// 测试 Polygon API 连接
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const API_KEY = process.env.POLYGON_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'POLYGON_API_KEY not configured in Vercel environment variables',
      envCheck: {
        hasPolygonKey: !!API_KEY,
        keyLength: API_KEY ? API_KEY.length : 0
      }
    });
  }

  try {
    // 测试简单的API调用
    const testSymbol = 'AAPL';
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const fromDate = yesterday.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${testSymbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=5&apikey=${API_KEY}`;
    
    console.log('Testing Polygon API with URL:', url.replace(API_KEY, 'HIDDEN_KEY'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.status(200).json({
      success: true,
      apiKeyConfigured: true,
      testSymbol,
      responseStatus: response.status,
      responseOk: response.ok,
      dataReceived: !!data,
      resultsCount: data.results ? data.results.length : 0,
      polygonStatus: data.status,
      sampleData: data.results ? data.results.slice(0, 2) : null,
      error: data.error || null
    });
    
  } catch (error) {
    console.error('Polygon API test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      apiKeyConfigured: !!API_KEY
    });
  }
}