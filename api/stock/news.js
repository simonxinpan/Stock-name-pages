// /api/stock/news.js (使用内部翻译API)

// --- 火山引擎翻译引擎 ---
async function translateWithVolcEngine(text) {
  try {
    const response = await fetch('/api/translate', {
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
    console.warn("Volcengine translator failed:", error.message || error);
    return text; // 返回原文
  }
}

// --- 并行翻译所有新闻标题 ---
async function translateNewsHeadlines(news) {
  if (!news || news.length === 0) return [];
  
  const translationPromises = news.map(async (article) => {
    let translatedHeadline = article.headline;
    try {
      translatedHeadline = await translateWithVolcEngine(article.headline);
    } catch (e) {
      console.error(`Translation failed for "${article.headline.substring(0, 20)}...":`, e.message);
    }
    return { ...article, headline: translatedHeadline };
  });
  return await Promise.all(translationPromises);
}

// --- API 主处理函数 ---
export default async function handler(request, response) {
  const { symbol, lang } = request.query;
  if (!symbol) return response.status(400).json({ error: 'Stock symbol is required' });

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
  const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;

  if (!FINNHUB_API_KEY) return response.status(500).json({ error: 'Finnhub API key is not configured' });
  
  const today = new Date(), priorDate = new Date(new Date().setDate(today.getDate() - 30));
  const from = priorDate.toISOString().split('T')[0], to = today.toISOString().split('T')[0];
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    
    let newsData = await apiResponse.json();
    
    if (lang === 'zh' && VOLC_AK && VOLC_SK && newsData && newsData.length > 0) {
      newsData = await translateNewsHeadlines(newsData);
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    response.status(200).json(newsData);
  } catch (error) {
    console.error('API /stock/news Error:', error.message);
    response.status(500).json({ error: 'Failed to fetch or process company news.' });
  }
}