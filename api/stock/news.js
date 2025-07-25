// Finnhub公司新闻API代理
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
  
  const { symbol, from, to } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }
  
  // 设置默认日期范围（如果未提供）
  const toDate = to || new Date().toISOString().split('T')[0];
  const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    // 使用缓存API获取数据
    const cacheApiUrl = `${req.headers.origin || 'http://localhost:3000'}/api/cache/stock-data?symbol=${symbol}&type=news&from=${fromDate}&to=${toDate}`;
    
    const response = await fetch(cacheApiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cache API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 处理新闻数据格式
    let newsData = result.data;
    if (Array.isArray(newsData)) {
      // 如果直接是数组，包装成对象
      newsData = { news: newsData };
    }
    
    // 过滤和限制新闻数量
    const filteredNews = (newsData.news || newsData || [])
      .filter(article => article && article.headline && article.url)
      .slice(0, 10) // 限制为10条新闻
      .map(article => ({
        ...article,
        symbol: symbol.toUpperCase()
      }));
    
    const finalResult = {
      news: filteredNews,
      symbol: symbol.toUpperCase(),
      from: fromDate,
      to: toDate,
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
    console.error('News API error:', error);
    
    // 如果缓存API失败，返回模拟新闻数据作为降级方案
    const mockNews = generateMockNews(symbol);
    
    const finalMockData = {
      news: mockNews,
      symbol: symbol.toUpperCase(),
      from: fromDate,
      to: toDate,
      timestamp: new Date().toISOString(),
      cached: false,
      source: 'fallback',
      warning: 'Using fallback data due to API error'
    };
    
    return res.status(200).json(finalMockData);
  }
}

// 生成模拟新闻数据
function generateMockNews(symbol) {
  const mockNewsTemplates = {
    AAPL: [
      {
        id: 1,
        headline: 'Apple发布新款iPhone 15系列，销量超预期',
        datetime: Math.floor(Date.now() / 1000) - 3600,
        source: 'Apple Newsroom',
        url: '#',
        summary: 'Apple公司今日发布了备受期待的iPhone 15系列，市场反应热烈。'
      },
      {
        id: 2,
        headline: 'Apple Q4财报超预期，服务业务增长强劲',
        datetime: Math.floor(Date.now() / 1000) - 7200,
        source: 'Reuters',
        url: '#',
        summary: 'Apple第四季度财报显示，服务业务收入同比增长16%。'
      },
      {
        id: 3,
        headline: 'Apple在AI领域的新投资引发市场关注',
        datetime: Math.floor(Date.now() / 1000) - 10800,
        source: 'TechCrunch',
        url: '#',
        summary: 'Apple宣布在人工智能领域进行重大投资，推动创新发展。'
      }
    ],
    TSLA: [
      {
        id: 1,
        headline: 'Tesla Cybertruck开始量产，预订量创纪录',
        datetime: Math.floor(Date.now() / 1000) - 1800,
        source: 'Tesla',
        url: '#',
        summary: 'Tesla Cybertruck正式开始量产，预订量已超过200万辆。'
      },
      {
        id: 2,
        headline: 'Tesla在中国市场表现强劲，销量持续增长',
        datetime: Math.floor(Date.now() / 1000) - 5400,
        source: 'Bloomberg',
        url: '#',
        summary: 'Tesla在中国市场的销量连续三个月实现双位数增长。'
      }
    ],
    MSFT: [
      {
        id: 1,
        headline: 'Microsoft Azure云服务增长强劲，市场份额扩大',
        datetime: Math.floor(Date.now() / 1000) - 2700,
        source: 'Microsoft',
        url: '#',
        summary: 'Microsoft Azure云服务在本季度实现了30%的增长。'
      },
      {
        id: 2,
        headline: 'Microsoft Copilot AI助手功能重大更新',
        datetime: Math.floor(Date.now() / 1000) - 6300,
        source: 'The Verge',
        url: '#',
        summary: 'Microsoft为Copilot AI助手推出了多项新功能和改进。'
      }
    ]
  };
  
  const symbolNews = mockNewsTemplates[symbol.toUpperCase()];
  if (symbolNews) {
    return symbolNews;
  }
  
  // 通用模拟新闻
  return [
    {
      id: 1,
      headline: `${symbol.toUpperCase()}公司发布最新季度财报`,
      datetime: Math.floor(Date.now() / 1000) - 3600,
      source: 'Financial News',
      url: '#',
      summary: `${symbol.toUpperCase()}公司公布了最新的季度财务业绩。`
    },
    {
      id: 2,
      headline: `${symbol.toUpperCase()}股价表现分析`,
      datetime: Math.floor(Date.now() / 1000) - 7200,
      source: 'Market Watch',
      url: '#',
      summary: `分析师对${symbol.toUpperCase()}近期股价表现进行深度解读。`
    }
  ];
}