// 从Neon数据库同步中文股票名称脚本 - 演示版本
// 使用模拟数据展示同步流程

console.log('🚀 演示脚本开始执行...');

import fs from 'fs';
import path from 'path';

console.log('📦 模块导入完成');

// 模拟的标普500中文名称数据
const mockSP500Data = {
  'AAPL': '苹果公司',
  'MSFT': '微软公司', 
  'GOOGL': '谷歌公司',
  'AMZN': '亚马逊公司',
  'TSLA': '特斯拉公司',
  'META': 'Meta平台公司',
  'NVDA': '英伟达公司',
  'JPM': '摩根大通银行',
  'JNJ': '强生公司',
  'V': '维萨公司',
  'PG': '宝洁公司',
  'UNH': '联合健康集团',
  'HD': '家得宝公司',
  'MA': '万事达卡公司',
  'BAC': '美国银行',
  'XOM': '埃克森美孚公司',
  'DIS': '迪士尼公司',
  'ADBE': '奥多比公司',
  'CRM': 'Salesforce公司',
  'NFLX': '奈飞公司'
};

// 模拟的中概股中文名称数据
const mockChineseStocksData = {
  'BABA': '阿里巴巴集团',
  'JD': '京东集团',
  'PDD': '拼多多',
  'BIDU': '百度公司',
  'BILI': '哔哩哔哩',
  'NIO': '蔚来汽车',
  'XPEV': '小鹏汽车',
  'LI': '理想汽车',
  'TME': '腾讯音乐',
  'BEKE': '贝壳找房',
  'TAL': '好未来教育',
  'EDU': '新东方教育',
  'YMM': '满帮集团',
  'DIDI': '滴滴出行',
  'IQ': '爱奇艺',
  'VIPS': '唯品会',
  'WB': '微博',
  'SINA': '新浪公司',
  'NTES': '网易公司',
  'ZTO': '中通快递'
};

// 模拟获取标普500股票的中文名称
function getSP500ChineseNames() {
  console.log('\n📊 模拟获取标普500股票中文名称...');
  console.log(`✅ 模拟查询成功，找到 ${Object.keys(mockSP500Data).length} 条记录`);
  console.log(`📝 提取到 ${Object.keys(mockSP500Data).length} 个有效的中文名称`);
  return mockSP500Data;
}

// 模拟获取中概股的中文名称
function getChineseStocksNames() {
  console.log('\n🇨🇳 模拟获取中概股中文名称...');
  console.log(`✅ 模拟查询成功，找到 ${Object.keys(mockChineseStocksData).length} 条记录`);
  console.log(`📝 提取到 ${Object.keys(mockChineseStocksData).length} 个有效的中文名称`);
  return mockChineseStocksData;
}

// 合并并生成新的中文名称字典
function mergeChineseNames(sp500Names, chineseStockNames) {
  console.log('\n🔄 合并中文名称数据...');
  
  const mergedNames = { ...sp500Names, ...chineseStockNames };
  
  console.log(`📊 数据统计:`);
  console.log(`- 标普500中文名称: ${Object.keys(sp500Names).length} 个`);
  console.log(`- 中概股中文名称: ${Object.keys(chineseStockNames).length} 个`);
  console.log(`- 合并后总计: ${Object.keys(mergedNames).length} 个`);
  
  return mergedNames;
}

// 生成新的API文件内容
function generateAPIContent(chineseNames) {
  console.log('\n📝 生成新的API文件内容...');
  
  const sortedSymbols = Object.keys(chineseNames).sort();
  
  let apiContent = `// /api/stock/chinese-name.js
// 获取股票的中文名称 - 自动同步版本
// 最后更新: ${new Date().toISOString()}
// 总计: ${Object.keys(chineseNames).length} 个股票

import { Pool } from 'pg';

let pool;

// 初始化数据库连接池
function getPool() {
  if (!pool) {
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
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    pool.on('error', (err) => {
      console.error('❌ [Chinese Name API] Database pool error:', err);
    });
  }
  return pool;
}

// 从Neon数据库同步的中文名称字典 (${Object.keys(chineseNames).length} 个股票)
const localChineseNames = {\n`;

  // 添加所有中文名称
  sortedSymbols.forEach(symbol => {
    apiContent += `  '${symbol}': '${chineseNames[symbol]}',\n`;
  });
  
  apiContent += `};

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
    console.log(\`🔍 [Chinese Name API] Querying for symbol: \${upperSymbol}\`);
    
    // 首先检查本地字典
    if (localChineseNames[upperSymbol]) {
      console.log(\`✅ [Chinese Name API] Found in local dictionary: \${localChineseNames[upperSymbol]}\`);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({
        symbol: upperSymbol,
        chineseName: localChineseNames[upperSymbol],
        source: 'local_dictionary',
        lastUpdated: '${new Date().toISOString()}'
      }));
    }
    
    // 如果本地字典没有，尝试数据库查询
    const dbPool = getPool();
    const queries = [
      'SELECT ticker, company_name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, company_name, name_zh FROM stocks WHERE ticker = $1',
      'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, company_name, name_zh FROM stocks WHERE symbol = $1'
    ];
    
    let result = null;
    for (const query of queries) {
      try {
        result = await dbPool.query(query, [upperSymbol]);
        if (result.rows.length > 0) break;
      } catch (queryError) {
        continue;
      }
    }
    
    if (result && result.rows.length > 0) {
      const stock = result.rows[0];
      const chineseName = stock.chinese_name || stock.name_zh || stock.company_name;
      
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: stock.ticker || stock.symbol,
        chineseName: chineseName,
        source: 'database',
        lastUpdated: new Date().toISOString()
      }));
    } else {
      console.log(\`⚠️ [Chinese Name API] No Chinese name found for: \${upperSymbol}\`);
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: upperSymbol,
        error: 'Chinese name not found',
        source: 'not_found'
      }));
    }
    
  } catch (error) {
    console.error(\`❌ [Chinese Name API] Error for \${upperSymbol}:\`, error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      symbol: upperSymbol,
      error: 'Internal server error',
      details: error.message
    }));
  }
}`;

  return apiContent;
}

// 保存同步结果
function saveSyncResults(chineseNames) {
  console.log('\n💾 保存同步结果...');
  
  // 保存为JSON文件
  const jsonPath = path.join(process.cwd(), 'chinese-names-sync-demo.json');
  const syncData = {
    lastSync: new Date().toISOString(),
    totalCount: Object.keys(chineseNames).length,
    source: 'demo_data',
    sp500Count: Object.keys(mockSP500Data).length,
    chineseStocksCount: Object.keys(mockChineseStocksData).length,
    chineseNames: chineseNames
  };
  
  fs.writeFileSync(jsonPath, JSON.stringify(syncData, null, 2), 'utf8');
  console.log(`✅ 同步结果已保存到: ${jsonPath}`);
  
  // 生成新的API文件
  const apiContent = generateAPIContent(chineseNames);
  const apiPath = path.join(process.cwd(), 'api', 'stock', 'chinese-name-demo.js');
  
  // 确保目录存在
  const apiDir = path.dirname(apiPath);
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log(`✅ 演示API文件已保存到: ${apiPath}`);
  
  return { jsonPath, apiPath };
}

// 主函数
function main() {
  console.log('\n🚀 开始演示中文股票名称同步...');
  console.log('=' .repeat(50));
  
  try {
    console.log('💡 使用模拟数据演示同步流程');
    
    // 获取数据
    const sp500Names = getSP500ChineseNames();
    const chineseStockNames = getChineseStocksNames();
    
    // 合并数据
    const mergedNames = mergeChineseNames(sp500Names, chineseStockNames);
    
    // 保存结果
    const { jsonPath, apiPath } = saveSyncResults(mergedNames);
    
    console.log('\n🎉 演示同步完成!');
    console.log('=' .repeat(50));
    console.log(`📊 总计演示 ${Object.keys(mergedNames).length} 个股票的中文名称`);
    console.log(`📁 JSON文件: ${jsonPath}`);
    console.log(`📁 API文件: ${apiPath}`);
    
    console.log('\n📋 部分同步结果预览:');
    const previewSymbols = Object.keys(mergedNames).slice(0, 10);
    previewSymbols.forEach(symbol => {
      console.log(`  ${symbol}: ${mergedNames[symbol]}`);
    });
    
    console.log('\n💡 实际使用时:');
    console.log('1. 在Vercel项目设置中配置 NEON_DATABASE_URL 和 CHINESE_STOCKS_DATABASE_URL');
    console.log('2. 运行 node sync-chinese-names.js 进行真实数据同步');
    console.log('3. 将生成的 chinese-name-updated.js 替换现有的 chinese-name.js');
    
  } catch (error) {
    console.error('❌ 演示失败:', error.message);
  }
}

// 运行演示
main();

export { main, getSP500ChineseNames, getChineseStocksNames };