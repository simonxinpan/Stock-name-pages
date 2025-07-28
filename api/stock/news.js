// /api/stock/news.js
export default async function handler(request, response) {
  const { symbol } = request.query;
  if (!symbol) {
    return response.status(400).json({ error: 'Stock symbol is required' });
  }

  const API_KEY = process.env.FINNHUB_API_KEY;
  if (!API_KEY) {
    return response.status(500).json({ error: 'API key is not configured on Vercel' });
  }

  // 获取今天的日期和30天前的日期
  const today = new Date();
  const priorDate = new Date(new Date().setDate(today.getDate() - 30));
  const from = priorDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const to = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol.toUpperCase()}&from=${from}&to=${to}&token=${API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    }
    const data = await apiResponse.json();
    
    // 过滤掉Seeking Alpha的内容，避免弹窗影响用户体验
    const filteredData = data.filter(article => {
      const source = article.source || '';
      const url = article.url || '';
      return !source.toLowerCase().includes('seeking alpha') && 
             !url.toLowerCase().includes('seekingalpha');
    });
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(filteredData);
  } catch (error) {
    console.error('API /stock/news Error:', error);
    response.status(500).json({ error: 'Failed to fetch company news.' });
  }
}