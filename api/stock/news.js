// /api/stock/news.js (优化版：使用内部翻译API + 智能新闻筛选)

// --- 火山引擎翻译引擎 (通过内部API) ---
async function translateWithVolcEngine(text) {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        targetLang: 'zh'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.translatedText || data.translation || text;
  } catch (error) {
    console.warn("Internal translate API failed:", error.message);
    return text; // 返回原文作为降级
  }
}

// --- 智能新闻筛选：优先选择与股票相关的新闻 ---
function filterRelevantNews(news, symbol) {
  if (!news || news.length === 0) return [];
  
  const symbolLower = symbol.toLowerCase();
  const companyKeywords = {
    'aapl': ['apple', 'iphone', 'ipad', 'mac', 'ios', 'tim cook'],
    'tsla': ['tesla', 'elon musk', 'electric vehicle', 'ev', 'model', 'cybertruck'],
    'msft': ['microsoft', 'windows', 'azure', 'office', 'xbox', 'satya nadella'],
    'googl': ['google', 'alphabet', 'search', 'android', 'youtube', 'sundar pichai'],
    'amzn': ['amazon', 'aws', 'prime', 'alexa', 'jeff bezos', 'andy jassy'],
    'nvda': ['nvidia', 'gpu', 'ai', 'gaming', 'data center', 'jensen huang'],
    'meta': ['meta', 'facebook', 'instagram', 'whatsapp', 'metaverse', 'mark zuckerberg']
  };
  
  const keywords = companyKeywords[symbolLower] || [symbolLower];
  
  // 按相关性评分排序
  const scoredNews = news.map(article => {
    let score = 0;
    const title = (article.headline || '').toLowerCase();
    const summary = (article.summary || '').toLowerCase();
    
    // 标题中包含关键词得分更高
    keywords.forEach(keyword => {
      if (title.includes(keyword)) score += 10;
      if (summary.includes(keyword)) score += 5;
    });
    
    // 股票代码匹配得分最高
    if (title.includes(symbolLower) || title.includes(symbol.toUpperCase())) score += 20;
    if (summary.includes(symbolLower) || summary.includes(symbol.toUpperCase())) score += 10;
    
    return { ...article, relevanceScore: score };
  });
  
  // 按相关性排序，取前20条最相关的新闻
  return scoredNews
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 20);
}

// --- 高效并行翻译新闻标题和摘要 ---
async function translateNewsContent(news) {
  if (!news || news.length === 0) return [];
  
  // 增加并发数，减少批次间等待时间
  const CHUNK_SIZE = 10; // 每次并行翻译10条
  const translatedNews = [];
  
  for (let i = 0; i < news.length; i += CHUNK_SIZE) {
    const chunk = news.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map(async (article) => {
      const translatedArticle = { ...article };
      
      try {
        // 并行翻译标题和摘要
        const [translatedHeadline, translatedSummary] = await Promise.all([
          article.headline ? translateWithVolcEngine(article.headline) : Promise.resolve(''),
          article.summary ? translateWithVolcEngine(article.summary) : Promise.resolve('')
        ]);
        
        if (translatedHeadline && translatedHeadline !== article.headline) {
          translatedArticle.headline = translatedHeadline;
        }
        if (translatedSummary && translatedSummary !== article.summary) {
          translatedArticle.summary = translatedSummary;
        }
      } catch (e) {
        console.error(`Translation failed for article "${article.headline?.substring(0, 30)}...":`, e.message);
      }
      
      return translatedArticle;
    });
    
    const chunkResults = await Promise.all(promises);
    translatedNews.push(...chunkResults);
    
    // 减少批次间等待时间到300ms
    if (i + CHUNK_SIZE < news.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return translatedNews;
}

// --- API 主处理函数 ---
export default async function handler(request, response) {
  const { symbol, lang } = request.query;
  if (!symbol) return response.status(400).json({ error: 'Stock symbol is required' });

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_API_KEY) return response.status(500).json({ error: 'Finnhub API key is not configured' });
  
  // 扩大时间范围到60天，获取更多新闻用于筛选
  const today = new Date(), priorDate = new Date(new Date().setDate(today.getDate() - 60));
  const from = priorDate.toISOString().split('T')[0], to = today.toISOString().split('T')[0];
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    
    let newsData = await apiResponse.json();
    
    // 智能筛选相关新闻
    newsData = filterRelevantNews(newsData, symbol);
    
    // 如果需要中文翻译，进行高效翻译
    if (lang === 'zh' && newsData && newsData.length > 0) {
      console.log(`🔄 开始翻译 ${newsData.length} 条相关新闻...`);
      newsData = await translateNewsContent(newsData);
      console.log(`✅ 新闻翻译完成`);
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate'); // 减少缓存时间到30分钟
    response.status(200).json(newsData);
  } catch (error) {
    console.error('API /stock/news Error:', error.message);
    response.status(500).json({ error: 'Failed to fetch or process company news.' });
  }
}