// /api/stock/candles.js (最终加固版)

export default async function handler(request, response) {
  const { symbol, resolution, from, to } = request.query;

  if (!symbol || !resolution || !from || !to) {
    return response.status(400).json({ error: 'Parameters symbol, resolution, from, and to are required.' });
  }

  const API_KEY = process.env.POLYGON_API_KEY;
  if (!API_KEY) {
    console.error("Vercel Environment Error: POLYGON_API_KEY is not set.");
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
    const responseBody = await apiResponse.text(); // 先以文本形式读取响应体，方便调试

    if (!apiResponse.ok) {
      // 如果请求失败，记录下 Polygon 返回的原始错误信息
      console.error(`Polygon API Error for ${symbol}. Status: ${apiResponse.status}. Body: ${responseBody}`);
      let errorData = {};
      try {
        errorData = JSON.parse(responseBody);
      } catch (e) {
        // 如果返回的不是JSON，就用状态文本
        errorData = { error: apiResponse.statusText };
      }
      const errorMessage = errorData.error || errorData.message || `Polygon API returned status ${apiResponse.status}`;
      return response.status(500).json({ error: errorMessage });
    }
    
    // 如果请求成功，再将文本解析为JSON
    const data = JSON.parse(responseBody);

    // *** 关键的数据有效性检查 ***
    if (data.queryCount === 0 || !data.results || data.results.length === 0) {
      console.log(`No data returned from Polygon for ${symbol}.`);
      // 即使没有数据，也返回一个前端能安全处理的“空”数据结构
      return response.status(200).json({ s: 'no_data', t: [], c: [], o: [], h: [], l: [], v: [] });
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

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(chartData);
    
  } catch (error) {
    console.error(`Unhandled error in /api/stock/candles.js for ${symbol}:`, error);
    response.status(500).json({ error: 'An unexpected error occurred while fetching candle data.' });
  }
}