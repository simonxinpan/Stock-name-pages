// /api/stock/quote.js
export default async function handler(request, response) {
  const { symbol } = request.query;
  if (!symbol) {
    return response.status(400).json({ error: 'Stock symbol is required' });
  }

  const API_KEY = process.env.FINNHUB_API_KEY;
  if (!API_KEY) {
    return response.status(500).json({ error: 'API key is not configured on Vercel' });
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    }
    const data = await apiResponse.json();
    
    // 检查Finnhub是否返回了有效数据 (c=0, d=0等表示可能无数据)
    if (data.c === 0 && data.d === 0) {
      return response.status(404).json({ error: `No quote data found for symbol: ${symbol}` });
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(data);
  } catch (error) {
    console.error('API /stock/quote Error:', error);
    response.status(500).json({ error: 'Failed to fetch stock quote.' });
  }
}