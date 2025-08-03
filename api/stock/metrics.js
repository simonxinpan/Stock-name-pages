// 文件路径: /api/stock/metrics.js

export default async function handler(request, response) {
  const { symbol } = request.query;
  if (!symbol) {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Stock symbol is required' }));
  }

  const API_KEY = process.env.FINNHUB_API_KEY;
  if (!API_KEY) {
    response.writeHead(500, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Finnhub API key is not configured on Vercel' }));
  }

  // 使用 /stock/metric 端点获取所有计算好的财务指标，包含52周最高最低价
  const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol.toUpperCase()}&metric=all&token=${API_KEY}`;

  try {
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    }
    const data = await apiResponse.json();
    
    // Finnhub 在找不到指标时会返回空的 data 对象
    if (!data || Object.keys(data.metric).length === 0) {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ error: `No metrics found for symbol: ${symbol}` }));
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    // 对这些不常变动的数据设置更长的缓存
    response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); 
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(data.metric)); // 直接返回 metric 对象
  } catch (error) {
    console.error('API /stock/metrics Error:', error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Failed to fetch financial metrics.' }));
  }
}