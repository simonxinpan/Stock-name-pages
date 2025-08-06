// /api/stock/chinese-name.js
// 获取股票的中文名称

import { Pool } from 'pg';

let pool;

// 初始化数据库连接池
function getPool() {
  if (!pool) {
    // 尝试多个可能的环境变量名
    const connectionString = process.env.NEON_DATABASE_URL || 
                            process.env.POSTGRES_URL || 
                            process.env.DATABASE_URL;
    
    console.log('🔍 [Chinese Name API] Environment variables check:');
    console.log('- NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? '✅ Found' : '❌ Not found');
    console.log('- POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Found' : '❌ Not found');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Not found');
    
    if (!connectionString) {
      console.error('❌ [Chinese Name API] No database connection string found!');
      throw new Error('Database connection string not found');
    }
    
    console.log('✅ [Chinese Name API] Using connection string:', connectionString.substring(0, 20) + '...');
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      // 添加连接池配置
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // 测试连接
    pool.on('error', (err) => {
      console.error('❌ [Chinese Name API] Database pool error:', err);
    });
  }
  return pool;
}

// 本地中文名称字典 (作为数据库的备用方案)
const localChineseNames = {
  'AAPL': '苹果公司',
  'MSFT': '微软公司',
  'GOOGL': '谷歌公司',
  'GOOG': '谷歌公司',
  'TSLA': '特斯拉公司',
  'NVDA': '英伟达公司',
  'AMZN': '亚马逊公司',
  'BRK.B': '伯克希尔哈撒韦公司',
  'BRK-B': '伯克希尔哈撒韦公司',
  'META': 'Meta公司',
  'NFLX': '奈飞公司',
  'BABA': '阿里巴巴集团',
  'JPM': '摩根大通',
  'JNJ': '强生公司',
  'V': 'Visa公司',
  'PG': '宝洁公司',
  'UNH': '联合健康集团',
  'HD': '家得宝',
  'MA': '万事达卡',
  'BAC': '美国银行',
  'PFE': '辉瑞公司',
  'XOM': '埃克森美孚',
  // 新增热门股票
  'BLK': '贝莱德集团',
  'AXP': '美国运通',
  'ORCL': '甲骨文公司',
  'WMT': '沃尔玛',
  'KO': '可口可乐公司',
  'DIS': '迪士尼公司',
  'ADBE': '奥多比公司',
  'CRM': 'Salesforce公司',
  'NFLX': '奈飞公司',
  'PYPL': 'PayPal公司',
  'INTC': '英特尔公司',
  'AMD': '超威半导体',
  'QCOM': '高通公司',
  'IBM': 'IBM公司',
  'GS': '高盛集团',
  'MS': '摩根士丹利',
  'WFC': '富国银行',
  'C': '花旗集团',
  'USB': '美国合众银行',
  'TRV': '旅行者集团',
  'MMM': '3M公司',
  'CAT': '卡特彼勒公司',
  'BA': '波音公司',
  'GE': '通用电气',
  'F': '福特汽车',
  'GM': '通用汽车',
  'T': 'AT&T公司',
  'VZ': '威瑞森通信',
  'CVX': '雪佛龙公司',
  'COP': '康菲石油',
  'MRK': '默克公司',
  'ABBV': '艾伯维公司',
  'LLY': '礼来公司',
  'TMO': '赛默飞世尔',
  'ABT': '雅培公司',
  'MDT': '美敦力公司',
  'DHR': '丹纳赫公司',
  'BMY': '百时美施贵宝',
  'AMGN': '安进公司',
  'GILD': '吉利德科学',
  'COST': '好市多',
  'TGT': '塔吉特公司',
  'LOW': '劳氏公司',
  'SBUX': '星巴克公司',
  'MCD': '麦当劳公司',
  'NKE': '耐克公司',
  'UPS': '联合包裹',
  'FDX': '联邦快递',
  'HON': '霍尼韦尔',
  'LMT': '洛克希德马丁',
  'RTX': '雷神技术',
  'NOC': '诺斯罗普格鲁曼',
  'SPY': '标普500ETF',
  'QQQ': '纳斯达克100ETF',
  'IWM': '罗素2000ETF',
  'VTI': '全市场ETF',
  'VOO': '标普500ETF'
};

export default async function handler(request, response) {
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end();
    return;
  }
  
  if (request.method !== 'GET') {
    response.writeHead(405, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const { symbol } = request.query;
  if (!symbol) {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Stock symbol is required' }));
  }

  const upperSymbol = symbol.toUpperCase();
  
  try {
    console.log(`🔍 [Chinese Name API] Querying database for symbol: ${upperSymbol}`);
    
    // 首先尝试数据库查询
    const dbPool = getPool();
    
    // 尝试多个可能的表名和列名组合
    const queries = [
      'SELECT ticker, company_name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, company_name, name_zh FROM stocks WHERE ticker = $1',
      'SELECT ticker, name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, name, name_zh FROM stocks WHERE ticker = $1',
      // 备用查询，以防列名确实是symbol
      'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, company_name, name_zh FROM stocks WHERE symbol = $1',
      'SELECT symbol, name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, name, name_zh FROM stocks WHERE symbol = $1'
    ];
    
    let result = null;
    let usedQuery = '';
    
    for (const query of queries) {
      try {
        console.log(`🔍 [Chinese Name API] Trying query: ${query}`);
        result = await dbPool.query(query, [upperSymbol]);
        usedQuery = query;
        console.log(`✅ [Chinese Name API] Query successful, found ${result.rows.length} rows`);
        break;
      } catch (queryError) {
        console.log(`❌ [Chinese Name API] Query failed: ${queryError.message}`);
        continue;
      }
    }
    
    if (result && result.rows.length > 0) {
      const stock = result.rows[0];
      console.log(`✅ [Chinese Name API] Found stock data:`, stock);
      
      // 智能获取中文名称字段
      const chineseName = stock.chinese_name || stock.name_zh || stock.company_name || stock.name;
      
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: stock.ticker || stock.symbol,
        company_name: stock.company_name || stock.name,
        chinese_name: chineseName,
        success: true,
        source: 'database',
        query_used: usedQuery
      }));
      return;
    } else {
      console.log(`❌ [Chinese Name API] No data found in database for symbol: ${upperSymbol}`);
    }
  } catch (error) {
    console.error(`❌ [Chinese Name API] Database error for ${upperSymbol}:`, error.message);
    console.error('Full error:', error);
  }
  
  // 数据库查询失败或无结果时，使用本地字典
  console.log(`🔄 [Chinese Name API] Falling back to local dictionary for: ${upperSymbol}`);
  const chineseName = localChineseNames[upperSymbol];
  
  if (chineseName) {
    console.log(`✅ [Chinese Name API] Found in local dictionary: ${upperSymbol} -> ${chineseName}`);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      symbol: upperSymbol,
      company_name: null,
      chinese_name: chineseName,
      success: true,
      source: 'local'
    }));
  } else {
    console.log(`❌ [Chinese Name API] Not found in local dictionary: ${upperSymbol}`);
    console.log(`📝 [Chinese Name API] Available symbols in local dictionary:`, Object.keys(localChineseNames));
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ 
      error: `No Chinese name found for symbol: ${symbol}`,
      symbol: upperSymbol,
      chinese_name: null,
      company_name: null,
      success: false
    }));
  }
}