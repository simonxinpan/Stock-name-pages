// /api/finnhub.js
import { Service } from '@volcengine/openapi';

async function translateWithVolcEngine(texts, ak, sk) {
    if (!texts || texts.length === 0) return [];
    const client = new Service({ host: 'open.volcengineapi.com', serviceName: 'translate', region: 'cn-north-1', accessKeyId: ak, secretAccessKey: sk });
    const fetchApi = client.fetchApi();
    try {
        const res = await fetchApi({ Action: 'TranslateText', Version: '2020-06-01' }, { TargetLanguage: 'zh', TextList: texts });
        if (res.ResponseMetadata?.Error) throw new Error(res.ResponseMetadata.Error.Message);
        return res.TranslationList?.map(item => item.Translation) || texts;
    } catch (error) {
        console.error("Volcengine translation failed:", error);
        return texts;
    }
}

async function fetchFromFinnhub(endpoint, symbol, apiKey) {
  let url = '';
  switch (endpoint) {
    case 'quote': url = `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`; break;
    case 'profile': url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${apiKey}`; break;
    case 'metrics': url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol.toUpperCase()}&metric=all&token=${apiKey}`; break;
    case 'news':
      const today = new Date(), priorDate = new Date(new Date().setDate(today.getDate() - 30));
      const from = priorDate.toISOString().split('T')[0], to = today.toISOString().split('T')[0];
      url = `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}&token=${apiKey}`;
      break;
    default: throw new Error('Invalid Finnhub endpoint requested.');
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Finnhub API error for ${endpoint}: ${response.statusText}`);
  return response.json();
}

export default async function handler(request, response) {
  const { symbol, type, lang } = request.query; 
  if (!symbol || !type) return response.status(400).json({ error: 'Parameters "symbol" and "type" are required.' });
  const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_KEY) return response.status(500).json({ error: 'Finnhub API key is not configured.' });

  try {
    let data = await fetchFromFinnhub(type, symbol, FINNHUB_KEY);
    if (type === 'news' && lang === 'zh' && data && data.length > 0) {
        const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
        const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;
        if (VOLC_AK && VOLC_SK) {
            const headlines = data.map(article => article.headline);
            const translatedHeadlines = await translateWithVolcEngine(headlines, VOLC_AK, VOLC_SK);
            data.forEach((article, index) => { article.headline = translatedHeadlines[index]; });
        }
    }
    const responseData = type === 'metrics' && data.metric ? data.metric : data;
    let cacheControl = 's-maxage=60, stale-while-revalidate';
    if (['profile', 'metrics'].includes(type)) cacheControl = 's-maxage=86400, stale-while-revalidate';
    if (type === 'news') cacheControl = 's-maxage=3600, stale-while-revalidate';
    response.setHeader('Cache-Control', cacheControl);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(responseData);
  } catch (error) {
    console.error(`API /finnhub Error (type: ${type}):`, error);
    response.status(500).json({ error: `Failed to fetch ${type} data from Finnhub.` });
  }
}