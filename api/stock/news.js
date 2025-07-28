// /api/stock/news.js (智能聚合翻译，带超时和降级)

// --- 翻译服务引擎 ---

const TRANSLATION_TIMEOUT = 2500; // 设置每个翻译请求的超时时间为 2.5 秒

// 翻译源 1: Google Translate (公共接口，质量高，首选)
async function translateWithGoogle(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Translate proxy failed with status ${response.status}`);
  const data = await response.json();
  if (data && data[0] && data[0][0] && data[0][0][0]) {
    return data[0][0][0];
  }
  throw new Error("Google Translate proxy returned invalid format");
}

// 翻译源 2: MyMemory (备用方案)
async function translateWithMyMemory(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`MyMemory API failed with status ${response.status}`);
  const data = await response.json();
  if (data && data.responseData && data.responseData.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error("MyMemory returned invalid format");
}

// 定义我们的翻译服务列表，按优先级排序
const translators = [
  { name: 'Google', func: translateWithGoogle },
  { name: 'MyMemory', func: translateWithMyMemory },
];

// --- 智能翻译调度器 ---
async function smartTranslate(text) {
  for (const translator of translators) {
    try {
      // 使用 Promise.race 实现超时控制
      const result = await Promise.race([
        translator.func(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TRANSLATION_TIMEOUT))
      ]);
      // 如果成功，立即返回结果
      console.log(`Successfully translated with ${translator.name}`);
      return result;
    } catch (error) {
      // 如果失败或超时，记录日志并继续尝试下一个
      console.warn(`${translator.name} translator failed for "${text.substring(0, 20)}...":`, error.message);
    }
  }
  // 如果所有翻译器都失败，返回原文
  console.error(`All translators failed for "${text.substring(0, 20)}...". Returning original text.`);
  return text;
}

// --- 并行翻译所有新闻标题 ---
async function translateNewsHeadlines(news) {
  if (!news || news.length === 0) return [];
  
  const translationPromises = news.map(article => 
    smartTranslate(article.headline).then(translatedHeadline => ({
      ...article,
      headline: translatedHeadline,
    }))
  );
  return await Promise.all(translationPromises);
}

// --- API 主处理函数 ---
export default async function handler(request, response) {
  const { symbol, lang } = request.query;
  if (!symbol) return response.status(400).json({ error: 'Stock symbol is required' });

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_API_KEY) return response.status(500).json({ error: 'Finnhub API key is not configured' });
  
  const today = new Date(), priorDate = new Date(new Date().setDate(today.getDate() - 30));
  const from = priorDate.toISOString().split('T')[0], to = today.toISOString().split('T')[0];
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    
    let newsData = await apiResponse.json();
    
    // 如果请求的是中文，则启动智能翻译
    if (lang === 'zh') {
        newsData = await translateNewsHeadlines(newsData);
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // 缓存1小时
    response.status(200).json(newsData);
  } catch (error) {
    console.error('API /stock/news Error:', error.message);
    response.status(500).json({ error: 'Failed to fetch company news.' });
  }
}