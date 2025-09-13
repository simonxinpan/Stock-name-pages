// 从Neon数据库同步中文股票名称脚本
// 连接标普500和中概股两个数据库，提取name_zh字段

console.log('🚀 脚本开始执行...');

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

console.log('📦 模块导入完成');

// 检查环境变量
console.log('\n🔍 检查环境变量:');
console.log('- NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? '✅ 已设置' : '❌ 未设置');
console.log('- CHINESE_STOCKS_DATABASE_URL:', process.env.CHINESE_STOCKS_DATABASE_URL ? '✅ 已设置' : '❌ 未设置');

// 数据库连接配置
let sp500Pool, chineseStocksPool;

if (process.env.NEON_DATABASE_URL) {
  sp500Pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('✅ 标普500数据库连接池已创建');
} else {
  console.log('❌ 无法创建标普500数据库连接池 - 缺少环境变量');
}

if (process.env.CHINESE_STOCKS_DATABASE_URL) {
  chineseStocksPool = new Pool({
    connectionString: process.env.CHINESE_STOCKS_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('✅ 中概股数据库连接池已创建');
} else {
  console.log('❌ 无法创建中概股数据库连接池 - 缺少环境变量');
}

// 测试数据库连接
async function testConnections() {
  console.log('🔍 测试数据库连接...');
  
  try {
    // 测试标普500数据库
    const sp500Test = await sp500Pool.query('SELECT 1 as test');
    console.log('✅ 标普500数据库连接成功');
    
    // 测试中概股数据库
    const chineseTest = await chineseStocksPool.query('SELECT 1 as test');
    console.log('✅ 中概股数据库连接成功');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 获取标普500股票的中文名称
async function getSP500ChineseNames() {
  console.log('\n📊 获取标普500股票中文名称...');
  
  const queries = [
    'SELECT symbol, name_zh FROM stocks WHERE name_zh IS NOT NULL AND name_zh != \'\'',
    'SELECT ticker, name_zh FROM stocks WHERE name_zh IS NOT NULL AND name_zh != \'\'',
    'SELECT symbol, chinese_name FROM stocks WHERE chinese_name IS NOT NULL AND chinese_name != \'\'',
    'SELECT ticker, chinese_name FROM stocks WHERE chinese_name IS NOT NULL AND chinese_name != \'\''  
  ];
  
  for (const query of queries) {
    try {
      console.log(`🔍 尝试查询: ${query}`);
      const result = await sp500Pool.query(query);
      
      if (result.rows.length > 0) {
        console.log(`✅ 标普500数据库查询成功，找到 ${result.rows.length} 条记录`);
        
        const chineseNames = {};
        result.rows.forEach(row => {
          const symbol = row.symbol || row.ticker;
          const chineseName = row.name_zh || row.chinese_name;
          if (symbol && chineseName) {
            chineseNames[symbol.toUpperCase()] = chineseName;
          }
        });
        
        console.log(`📝 提取到 ${Object.keys(chineseNames).length} 个有效的中文名称`);
        return chineseNames;
      }
    } catch (error) {
      console.log(`❌ 查询失败: ${error.message}`);
      continue;
    }
  }
  
  console.log('⚠️ 未能从标普500数据库获取数据');
  return {};
}

// 获取中概股的中文名称
async function getChineseStocksNames() {
  console.log('\n🇨🇳 获取中概股中文名称...');
  
  const queries = [
    'SELECT symbol, name_zh FROM stocks WHERE name_zh IS NOT NULL AND name_zh != \'\'',
    'SELECT ticker, name_zh FROM stocks WHERE name_zh IS NOT NULL AND name_zh != \'\'',
    'SELECT symbol, chinese_name FROM stocks WHERE chinese_name IS NOT NULL AND chinese_name != \'\'',
    'SELECT ticker, chinese_name FROM stocks WHERE chinese_name IS NOT NULL AND chinese_name != \'\''  
  ];
  
  for (const query of queries) {
    try {
      console.log(`🔍 尝试查询: ${query}`);
      const result = await chineseStocksPool.query(query);
      
      if (result.rows.length > 0) {
        console.log(`✅ 中概股数据库查询成功，找到 ${result.rows.length} 条记录`);
        
        const chineseNames = {};
        result.rows.forEach(row => {
          const symbol = row.symbol || row.ticker;
          const chineseName = row.name_zh || row.chinese_name;
          if (symbol && chineseName) {
            chineseNames[symbol.toUpperCase()] = chineseName;
          }
        });
        
        console.log(`📝 提取到 ${Object.keys(chineseNames).length} 个有效的中文名称`);
        return chineseNames;
      }
    } catch (error) {
      console.log(`❌ 查询失败: ${error.message}`);
      continue;
    }
  }
  
  console.log('⚠️ 未能从中概股数据库获取数据');
  return {};
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
async function saveSyncResults(chineseNames) {
  console.log('\n💾 保存同步结果...');
  
  // 保存为JSON文件
  const jsonPath = path.join(process.cwd(), 'chinese-names-sync.json');
  const syncData = {
    lastSync: new Date().toISOString(),
    totalCount: Object.keys(chineseNames).length,
    chineseNames: chineseNames
  };
  
  fs.writeFileSync(jsonPath, JSON.stringify(syncData, null, 2), 'utf8');
  console.log(`✅ 同步结果已保存到: ${jsonPath}`);
  
  // 生成新的API文件
  const apiContent = generateAPIContent(chineseNames);
  const apiPath = path.join(process.cwd(), 'api', 'stock', 'chinese-name-updated.js');
  
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log(`✅ 更新的API文件已保存到: ${apiPath}`);
  
  return { jsonPath, apiPath };
}

// 主函数
async function main() {
  console.log('🚀 开始同步中文股票名称...');
  console.log('=' .repeat(50));
  
  if (!process.env.NEON_DATABASE_URL && !process.env.CHINESE_STOCKS_DATABASE_URL) {
    console.error('❌ 缺少数据库环境变量');
    console.log('💡 请在Vercel项目设置中配置 NEON_DATABASE_URL 和 CHINESE_STOCKS_DATABASE_URL');
    console.log('💡 或者创建 .env 文件进行本地测试');
    return;
  }
  
  try {
    // 测试连接
    const connected = await testConnections();
    if (!connected) {
      throw new Error('数据库连接失败');
    }
    
    // 获取数据
    const sp500Names = await getSP500ChineseNames();
    const chineseStockNames = await getChineseStocksNames();
    
    // 合并数据
    const mergedNames = mergeChineseNames(sp500Names, chineseStockNames);
    
    if (Object.keys(mergedNames).length === 0) {
      throw new Error('未获取到任何中文名称数据');
    }
    
    // 保存结果
    const { jsonPath, apiPath } = await saveSyncResults(mergedNames);
    
    console.log('\n🎉 同步完成!');
    console.log('=' .repeat(50));
    console.log(`📊 总计同步 ${Object.keys(mergedNames).length} 个股票的中文名称`);
    console.log(`📁 JSON文件: ${jsonPath}`);
    console.log(`📁 API文件: ${apiPath}`);
    
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (sp500Pool) {
      await sp500Pool.end();
      console.log('🔒 标普500数据库连接已关闭');
    }
    if (chineseStocksPool) {
      await chineseStocksPool.end();
      console.log('🔒 中概股数据库连接已关闭');
    }
  }
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, getSP500ChineseNames, getChineseStocksNames };