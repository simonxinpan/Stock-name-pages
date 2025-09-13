// 测试股票代码可访问性脚本
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// 从SQL查询中提取的所有股票代码
const stockCodes = {
  // 纽约证券交易所 (NYSE)
  nyse: [
    'BABA', 'BEKE', 'BZ', 'CAN', 'CHNR', 'DADA', 'DDI', 'DL', 'DNK', 'HUYA',
    'IQ', 'JKS', 'LFC', 'MOGU', 'NIO', 'QD', 'RLX', 'SNP', 'STG', 'VIPS',
    'XIN', 'XPEV', 'YALA', 'ZTO'
  ],
  
  // 纳斯达克 (NASDAQ)
  nasdaq: [
    'APM', 'BIDU', 'BILI', 'BZUN', 'CCNC', 'CD', 'CMCM', 'CNEY', 'CREG', 'CTK',
    'CXDC', 'DUO', 'EH', 'ETAO', 'FAMI', 'FFIE', 'FINV', 'FUTU', 'GDS', 'GGE',
    'GLG', 'GOTU', 'HOLO', 'HUDI', 'IMAB', 'JFIN', 'JG', 'KNDI', 'LI', 'LIZI',
    'LX', 'LXEH', 'MNSO', 'NAAS', 'NIU', 'NTES', 'PDD', 'PT', 'QTT', 'SOHU',
    'TCOM', 'TIGR', 'TME', 'TOUR', 'TSM', 'UXIN', 'VNET', 'WB', 'WISH', 'XNET',
    'YSG', 'ZEPP', 'ZJYL', 'ZKIN', 'ZLAB', 'ZNH'
  ],
  
  // 额外保留的主流中概股
  additional: ['JD', 'TAL', 'EDU']
};

// 测试单个股票代码
async function testStockCode(symbol) {
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    `/api/stock/quote?symbol=${symbol}`,
    `/api/stock/profile?symbol=${symbol}`,
    `/api/stock/metrics?symbol=${symbol}`
  ];
  
  const results = {
    symbol,
    quote: false,
    profile: false,
    metrics: false,
    accessible: false,
    errors: []
  };
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      const endpointName = endpoint.split('/')[3].split('?')[0];
      
      if (response.ok) {
        const data = await response.json();
        // 检查是否返回有效数据
        if (data && Object.keys(data).length > 0 && !data.error) {
          results[endpointName] = true;
        } else {
          results.errors.push(`${endpointName}: 返回空数据或错误`);
        }
      } else {
        results.errors.push(`${endpointName}: HTTP ${response.status}`);
      }
    } catch (error) {
      results.errors.push(`${endpoint}: ${error.message}`);
    }
    
    // 添加延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // 如果至少有一个API返回成功，认为股票代码可访问
  results.accessible = results.quote || results.profile || results.metrics;
  
  return results;
}

// 批量测试股票代码
async function testStockCodes(codes, category) {
  console.log(`\n🔍 开始测试 ${category} 股票代码 (${codes.length}只)...`);
  const results = [];
  const failedStocks = [];
  
  for (let i = 0; i < codes.length; i++) {
    const symbol = codes[i];
    console.log(`[${i + 1}/${codes.length}] 测试 ${symbol}...`);
    
    const result = await testStockCode(symbol);
    results.push(result);
    
    if (!result.accessible) {
      failedStocks.push({
        symbol,
        errors: result.errors
      });
      console.log(`❌ ${symbol} - 无法访问`);
    } else {
      console.log(`✅ ${symbol} - 可访问`);
    }
  }
  
  return { results, failedStocks };
}

// 主函数
async function main() {
  console.log('📊 开始测试所有中概股代码可访问性...');
  
  const allFailedStocks = [];
  const summary = {
    total: 0,
    accessible: 0,
    failed: 0
  };
  
  // 测试NYSE股票
  const nyseResults = await testStockCodes(stockCodes.nyse, 'NYSE');
  allFailedStocks.push(...nyseResults.failedStocks.map(s => ({...s, exchange: 'NYSE'})));
  
  // 测试NASDAQ股票
  const nasdaqResults = await testStockCodes(stockCodes.nasdaq, 'NASDAQ');
  allFailedStocks.push(...nasdaqResults.failedStocks.map(s => ({...s, exchange: 'NASDAQ'})));
  
  // 测试额外股票
  const additionalResults = await testStockCodes(stockCodes.additional, '额外保留');
  allFailedStocks.push(...additionalResults.failedStocks.map(s => ({...s, exchange: '额外'})));
  
  // 计算总结
  const totalStocks = stockCodes.nyse.length + stockCodes.nasdaq.length + stockCodes.additional.length;
  summary.total = totalStocks;
  summary.failed = allFailedStocks.length;
  summary.accessible = totalStocks - summary.failed;
  
  // 输出结果
  console.log('\n📋 测试结果总结:');
  console.log(`总计股票: ${summary.total}只`);
  console.log(`可访问: ${summary.accessible}只`);
  console.log(`无法访问: ${summary.failed}只`);
  
  if (allFailedStocks.length > 0) {
    console.log('\n❌ 无法访问的股票清单:');
    allFailedStocks.forEach(stock => {
      console.log(`- ${stock.symbol} (${stock.exchange}): ${stock.errors.join(', ')}`);
    });
  }
  
  // 保存详细结果到文件
  const fs = require('fs');
  const detailedResults = {
    summary,
    failedStocks: allFailedStocks,
    nyseResults: nyseResults.results,
    nasdaqResults: nasdaqResults.results,
    additionalResults: additionalResults.results
  };
  
  fs.writeFileSync('stock-test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n💾 详细结果已保存到 stock-test-results.json');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testStockCode, testStockCodes, stockCodes };