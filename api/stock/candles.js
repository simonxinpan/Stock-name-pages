// /api/stock/candles.js
export default async function handler(request, response) {
  const { symbol, resolution, from, to } = request.query;

  if (!symbol || !resolution || !from || !to) {
    return response.status(400).json({ error: 'Parameters symbol, resolution, from, to are required' });
  }

  const API_KEY = process.env.FINNHUB_API_KEY;
  if (!API_KEY) {
    return response.status(500).json({ error: 'API key is not configured on Vercel' });
  }
  
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    }
    const data = await apiResponse.json();

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(data);
  } catch (error) {
    console.error('API /stock/candles Error:', error);
    response.status(500).json({ error: 'Failed to fetch candle data.' });
  }
}