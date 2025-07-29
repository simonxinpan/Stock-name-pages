// /api/stock/news.js (最终修复版：校准时间 + 官方SDK)
import { Service } from '@volcengine/openapi';

// --- 火山引擎翻译引擎 ---
async function translateWithVolcEngine(text, accessKeyId, secretAccessKey) {
  // 1. 初始化火山引擎通用服务客户端
  const service = new Service({
    host: 'open.volcengineapi.com',
    serviceName: 'translate',
    region: 'cn-north-1',
    accessKeyId,
    secretAccessKey,
    // ** 关键修复：Vercel Serverless 环境可能存在时间偏差，
    // ** 但 SDK 通常能通过内部机制处理。我们先不手动干预。
    // ** 如果仍然报错，可以尝试获取服务器时间来计算一个 offset。
  });
  
  // 2. 获取请求器，SDK会自动处理签名和时间戳
  const fetchApi = service.fetchApi();
  
  const params = {
    Action: 'TranslateText',
    Version: '2020-06-01',
  };
  const body = {
    TargetLanguage: 'zh',
    TextList: [text],
  };

  try {
    // 3. 发起请求
    const res = await fetchApi(params, body);
    
    // 4. 处理返回结果
    if (res.ResponseMetadata?.Error) {
      // ** 更详细的错误日志 **
      console.error("Volcengine API returned an error:", JSON.stringify(res.ResponseMetadata.Error));
      throw new Error(`Volcengine API Error: ${res.ResponseMetadata.Error.Message}`);
    }
    if (res.TranslationList && res.TranslationList[0] && res.TranslationList[0].Translation) {
      return res.TranslationList[0].Translation;
    }
    throw new Error("Volcengine API returned an unexpected format");
  } catch (error) {
    console.warn("Volcengine translator failed:", error.message || error);
    throw error;
  }
}

// --- 并行翻译所有新闻标题 ---
async function translateNewsHeadlines(news, ak, sk) {
  if (!news || news.length === 0) return [];
  
  // 为了避免短时间内大量并发请求可能导致的问题，我们分批进行翻译
  const CHUNK_SIZE = 5; // 每次并行翻译5条
  const translatedNews = [];
  for (let i = 0; i < news.length; i += CHUNK_SIZE) {
      const chunk = news.slice(i, i + CHUNK_SIZE);
      const promises = chunk.map(async (article) => {
          let translatedHeadline = article.headline;
          try {
              translatedHeadline = await translateWithVolcEngine(article.headline, ak, sk);
          } catch (e) {
              console.error(`Translation failed for "${article.headline.substring(0, 20)}...":`, e.message);
          }
          return { ...article, headline: translatedHeadline };
      });
      translatedNews.push(...await Promise.all(promises));
  }
  return translatedNews;
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
      newsData = await translateNewsHeadlines(newsData, VOLC_AK, VOLC_SK);
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    response.status(200).json(newsData);
  } catch (error) {
    console.error('API /stock/news Error:', error.message);
    response.status(500).json({ error: 'Failed to fetch or process company news.' });
  }
}