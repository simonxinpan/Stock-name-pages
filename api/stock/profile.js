// /api/stock/profile.js

// 新增：获取汇率函数
async function getExchangeRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    if (data && data.rates) {
      return {
        HKD: data.rates.HKD, // 1美元 = X港币
        TWD: data.rates.TWD  // 1美元 = X新台币
      };
    }
    throw new Error('Invalid rate API response');
  } catch (error) {
    console.error("❌ Failed to fetch exchange rates, using fallback.", error);
    // 提供备用汇率
    return { HKD: 7.8, TWD: 32.0 };
  }
}

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
    // 1. 在处理请求的开始，先获取汇率
    const rates = await getExchangeRates();

    // 2. 调用Finnhub API获取股票的详细数据
    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      throw new Error(`Finnhub API error: ${apiResponse.statusText}`);
    }
    const data = await apiResponse.json();
    
    // 如果返回的是空对象，说明没找到该公司
    if (Object.keys(data).length === 0) {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ error: `No profile found for symbol: ${symbol}` }));
    }

    // 3. 从返回的数据中，提取关键信息
    let originalMarketCap = data.marketCapitalization;
    let currency = data.currency || 'USD';
    let exchange = data.exchange || '';
    let marketCapUSD = originalMarketCap; // 默认美元市值等于原始市值

    // 4. 关键的智能转换逻辑
    if (exchange && exchange.toUpperCase().includes('HONG KONG')) {
      currency = 'HKD';
      marketCapUSD = originalMarketCap / rates.HKD; // 港币 -> 美元
    } else if (exchange && (exchange.toUpperCase().includes('TAIWAN') || exchange.toUpperCase().includes('TPE'))) {
      currency = 'TWD';
      marketCapUSD = originalMarketCap / rates.TWD; // 新台币 -> 美元
    }

    // 5. 构建并返回一个包含所有标准化信息的、全新的JSON对象
    const responsePayload = {
      ...data, // 保留原始数据
      // 增强的市值信息
      market_cap_usd: marketCapUSD, // 标准化的美元市值
      market_cap_original: originalMarketCap, // 原始市值
      market_cap_currency: currency, // 识别出的原始货币
      exchange_rates: rates // 当前汇率信息
    };

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(responsePayload));
  } catch (error) {
    console.error('API /stock/profile Error:', error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Failed to fetch company profile.' }));
  }
}