// /api/stock/candles.js
export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-cache');

  const { symbol, resolution, from, to } = request.query;

  if (!symbol || !resolution || !from || !to) {
    return response.status(400).json({ error: 'Parameters symbol, resolution, from, and to are required.' });
  }

  const API_KEY = process.env.POLYGON_API_KEY;
  if (!API_KEY) {
    console.error("Vercel Env Error: POLYGON_API_KEY is not set.");
    return response.status(500).json({ error: 'Polygon API key is not configured.' });
  }

  let multiplier = 1;
  let timespan = 'day';
  if (resolution.toUpperCase() === 'W') timespan = 'week';
  if (resolution.toUpperCase() === 'M') timespan = 'month';

  const fromDate = new Date(parseInt(from, 10) * 1000).toISOString().split('T')[0];
  const toDate = new Date(parseInt(to, 10) * 1000).toISOString().split('T')[0];

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/${multiplier}/${timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=5000&apiKey=${API_KEY}`;
  
  try {
    const apiResponse = await fetch(url);
    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const errorMessage = data.error || data.message || `Polygon API returned status ${apiResponse.status}`;
      console.error(`Polygon API Error for ${symbol}: ${errorMessage}`);
      return response.status(apiResponse.status).json({ error: errorMessage });
    }
    
    if (!data.results || data.results.length === 0) {
      console.log(`No data returned from Polygon for ${symbol}.`);
      return response.status(200).json({ s: 'no_data' });
    }

    const chartData = {
      s: 'ok',
      t: data.results.map(item => item.t / 1000),
      c: data.results.map(item => item.c),
      o: data.results.map(item => item.o),
      h: data.results.map(item => item.h),
      l: data.results.map(item => item.l),
      v: data.results.map(item => item.v),
    };

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(chartData);
    
  } catch (error) {
    console.error(`Unhandled error in /api/stock/candles.js for ${symbol}:`, error);
    response.status(500).json({ error: 'An unexpected error occurred.' });
  }
}