// /api/stock/candles.js

export default async function handler(request, response) {
  // 1. 从前端请求中解析参数
  const { symbol, resolution, from, to } = request.query;

  // 2. 验证参数是否齐全
  if (!symbol || !resolution || !from || !to) {
    return response.status(400).json({ error: 'Parameters symbol, resolution, from, and to are required.' });
  }

  // 3. 从Vercel环境变量中安全地获取Polygon API Key
  const API_KEY = process.env.POLYGON_API_KEY;
  if (!API_KEY) {
    return response.status(500).json({ error: 'Polygon API key is not configured on Vercel. Please set POLYGON_API_KEY.' });
  }

  // 4. 将我们前端的 D, W, M 时间周期转换为 Polygon API 需要的格式
  // Polygon API 格式: /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}
  let multiplier = 1;
  let timespan = 'day'; // 默认为日线

  if (resolution.toUpperCase() === 'W') {
    timespan = 'week';
  } else if (resolution.toUpperCase() === 'M') {
    timespan = 'month';
  }

  // 5. 将前端传入的秒级时间戳转换为 Polygon API 需要的 YYYY-MM-DD 日期格式
  const fromDate = new Date(parseInt(from, 10) * 1000).toISOString().split('T')[0];
  const toDate = new Date(parseInt(to, 10) * 1000).toISOString().split('T')[0];

  // 6. 构建最终的 Polygon API 请求 URL
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/range/${multiplier}/${timespan}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=5000&apiKey=${API_KEY}`;
  
  try {
    // 7. 发起对 Polygon.io 的请求
    const apiResponse = await fetch(url);

    // 8. 处理 Polygon.io 可能返回的错误
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      // 将 Polygon 返回的错误信息更清晰地传递给前端
      const errorMessage = errorData.error || errorData.message || apiResponse.statusText;
      console.error(`Polygon API Error for ${symbol}:`, errorMessage);
      throw new Error(`Polygon API error: ${errorMessage}`);
    }

    const data = await apiResponse.json();

    // 9. *** 关键的数据格式转换 ***
    // 将 Polygon 的返回格式 { results: [{ t, o, h, l, c, v }, ...] }
    // 转换为前端图表库期望的格式 { s, t, c, o, h, l, v }
    
    if (!data.results) {
        // 如果 Polygon 返回了成功状态但没有 results 数组，说明没有数据
        return response.status(200).json({ s: 'no_data' });
    }

    const chartData = {
      s: 'ok',
      // Polygon 的时间戳 t 是毫秒级的，需要转换为秒级
      t: data.results.map(item => item.t / 1000), 
      c: data.results.map(item => item.c),
      o: data.results.map(item => item.o),
h: data.results.map(item => item.h),
      l: data.results.map(item => item.l),
      v: data.results.map(item => item.v),
    };

    // 10. 设置缓存策略并成功返回转换后的数据
    // 建议对历史数据设置一定的缓存，例如1小时，避免每次都重复请求
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(chartData);
    
  } catch (error) {
    // 11. 捕获所有可能的错误，并在Vercel日志中清晰地打印出来
    console.error(`API /stock/candles.js (Polygon) unhandled error for symbol ${symbol}:`, error);
    response.status(500).json({ error: 'Failed to fetch candle data from Polygon.io.' });
  }
}