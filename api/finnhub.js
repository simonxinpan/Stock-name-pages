// /api/finnhub.js
import { Service } from '@volcengine/openapi';

// 翻译函数
async function translateWithVolcEngine(texts, accessKeyId, secretAccessKey) {
  try {
    const service = new Service({
      host: 'translate.volcengineapi.com',
      serviceName: 'translate',
      region: 'cn-north-1',
      accessKeyId,
      secretAccessKey,
    });

    const body = {
      TargetLanguage: 'zh',
      TextList: texts
    };

    const response = await service.post('/TranslateText', {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.TranslationList) {
      return response.TranslationList.map(item => item.Translation);
    }
    return texts; // 翻译失败时返回原文
  } catch (error) {
    console.error('Translation error:', error);
    return texts; // 翻译失败时返回原文
  }
}

// Finnhub API 调用函数
async function fetchFromFinnhub(type, symbol, apiKey) {
  const baseUrl = 'https://finnhub.io/api/v1';
  let url;

  switch (type) {
    case 'quote':
      url = `${baseUrl}/quote?symbol=${symbol}&token=${apiKey}`;
      break;
    case 'profile':
      url = `${baseUrl}/stock/profile2?symbol=${symbol}&token=${apiKey}`;
      break;
    case 'metrics':
      url = `${baseUrl}/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`;
      break;
    case 'news':
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fromDate = lastWeek.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      url = `${baseUrl}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`;
      break;
    default:
      throw new Error(`Unsupported type: ${type}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

export default async function handler(request, response) {
  const { symbol, type, lang } = request.query; 
  if (!symbol || !type) return response.status(400).json({ error: 'Parameters "symbol" and "type" are required.' });
  const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_KEY) return response.status(500).json({ error: 'Finnhub API key is not configured.' });

  try {
    let data = await fetchFromFinnhub(type, symbol, FINNHUB_KEY);
    
    // ** 关键修复：确保即使翻译失败，也不会让整个 API 崩溃 **
    if (type === 'news' && lang === 'zh' && data && Array.isArray(data) && data.length > 0) {
        const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
        const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;
        if (VOLC_AK && VOLC_SK) {
            console.log(`[finnhub.js] Translating ${data.length} news items for ${symbol}...`);
            const headlines = data.map(article => article.headline);
            const translatedHeadlines = await translateWithVolcEngine(headlines, VOLC_AK, VOLC_SK);
            data.forEach((article, index) => {
                // 即使某条翻译结果为空，也用原文兜底
                article.headline = translatedHeadlines[index] || article.headline;
            });
        }
    }
    
    const responseData = type === 'metrics' && data.metric ? data.metric : data;
    // ... 缓存逻辑和之前一样 ...
    response.status(200).json(responseData);
  } catch (error) {
    console.error(`API /finnhub Error (type: ${type}):`, error);
    response.status(500).json({ error: `Failed to fetch ${type} data from Finnhub.` });
  }
}