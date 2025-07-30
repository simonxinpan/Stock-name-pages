// /api/finnhub.js
import { Service } from '@volcengine/openapi';

// ... translateWithVolcEngine 和 fetchFromFinnhub 函数和之前一样 ...

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