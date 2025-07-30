// 测试Finnhub API连接的端点
// 路径: /api/test/finnhub-api

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
  
  const { symbol = 'AAPL' } = req.query;
  
  try {
    // 检查API密钥
    if (!process.env.FINNHUB_API_KEY) {
      return res.status(500).json({ 
        error: 'Finnhub API key not configured',
        env_check: {
          FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
          DATABASE_URL: !!process.env.DATABASE_URL
        }
      });
    }
    
    const apiKey = process.env.FINNHUB_API_KEY;
    const baseUrl = 'https://finnhub.io/api/v1';
    
    // 测试多个API端点
    const tests = [
      {
        name: 'Quote API',
        url: `${baseUrl}/quote?symbol=${symbol}&token=${apiKey}`,
        description: '获取股票报价'
      },
      {
        name: 'Profile API', 
        url: `${baseUrl}/stock/profile2?symbol=${symbol}&token=${apiKey}`,
        description: '获取公司资料'
      },
      {
        name: 'News API',
        url: `${baseUrl}/company-news?symbol=${symbol}&from=2024-01-01&to=2024-12-31&token=${apiKey}`,
        description: '获取公司新闻'
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await fetch(test.url);
        const endTime = Date.now();
        
        const data = await response.json();
        
        results.push({
          name: test.name,
          description: test.description,
          status: response.ok ? 'success' : 'error',
          status_code: response.status,
          response_time: `${endTime - startTime}ms`,
          data_preview: JSON.stringify(data).substring(0, 200) + '...',
          has_error: !!data.error,
          error_message: data.error || null
        });
        
      } catch (error) {
        results.push({
          name: test.name,
          description: test.description,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // 计算成功率
    const successCount = results.filter(r => r.status === 'success').length;
    const successRate = (successCount / results.length * 100).toFixed(1);
    
    return res.status(200).json({
      status: 'completed',
      message: 'Finnhub API test completed',
      test_symbol: symbol,
      success_rate: `${successRate}%`,
      total_tests: results.length,
      successful_tests: successCount,
      results: results,
      environment: {
        FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Finnhub API test failed:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Finnhub API test failed',
      error: error.message,
      environment: {
        FINNHUB_API_KEY: !!process.env.FINNHUB_API_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });
  }
}