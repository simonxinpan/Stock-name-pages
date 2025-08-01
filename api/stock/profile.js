// /api/stock/profile.js
export default async function handler(request, response) {
  const { symbol } = request.query;
  if (!symbol) {
    return response.status(400).json({ error: 'Stock symbol is required' });
  }

  const API_KEY = process.env.FINNHUB_API_KEY;
  if (!API_KEY) {
    return response.status(500).json({ error: 'API key is not configured on Vercel' });
  }
  
  // Finnhub 使用 /stock/profile2 接口
  const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    }
    const data = await apiResponse.json();
    
    // 如果返回的是空对象，说明没找到该公司
    if (Object.keys(data).length === 0) {
      return response.status(404).json({ error: `No profile found for symbol: ${symbol}` });
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(data);
  } catch (error) {
    console.error('API /stock/profile Error:', error);
    response.status(500).json({ error: 'Failed to fetch company profile.' });
  }
}