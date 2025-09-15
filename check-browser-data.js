// 在浏览器控制台中运行此脚本来检查实际的API数据
// 复制此代码到浏览器开发者工具的控制台中执行

console.log('=== 检查浏览器中的实际API数据 ===');

// 检查当前页面的股票数据
if (typeof window !== 'undefined' && window.stockApp) {
    const app = window.stockApp;
    
    console.log('当前股票代码:', app.symbol);
    console.log('公司资料数据:', app.companyProfile);
    
    if (app.companyProfile && app.companyProfile.marketCapitalization) {
        const marketCap = app.companyProfile.marketCapitalization;
        console.log('原始marketCapitalization值:', marketCap);
        console.log('数据类型:', typeof marketCap);
        
        // 测试不同单位假设
        console.log('\n=== 单位假设测试 ===');
        console.log('假设单位为百万美元:', marketCap, '-> 实际价值:', marketCap, '百万美元');
        console.log('假设单位为美元:', marketCap, '-> 实际价值:', (marketCap / 1000000).toFixed(2), '百万美元');
        console.log('假设单位为千美元:', marketCap, '-> 实际价值:', (marketCap / 1000).toFixed(2), '百万美元');
        
        // 显示当前格式化结果
        if (typeof formatMarketCap === 'function') {
            console.log('\n当前格式化结果:', formatMarketCap(marketCap));
        }
        
        // 根据已知的市值范围进行分析
        const symbol = app.symbol;
        const knownMarketCaps = {
            'AAPL': { range: '3.0-3.8万亿美元', millionUSD: 3500000 },
            'MSFT': { range: '2.8-3.2万亿美元', millionUSD: 3000000 },
            'BABA': { range: '1800-2200亿美元', millionUSD: 200000 },
            'TSLA': { range: '700-900亿美元', millionUSD: 800000 },
            'BEKE': { range: '120-180亿美元', millionUSD: 15000 }
        };
        
        if (knownMarketCaps[symbol]) {
            const expected = knownMarketCaps[symbol];
            console.log(`\n=== ${symbol} 市值分析 ===`);
            console.log('预期范围:', expected.range);
            console.log('API返回值:', marketCap);
            console.log('预期百万美元值:', expected.millionUSD);
            
            // 计算最接近的单位
            const ratios = {
                '百万美元': Math.abs(marketCap - expected.millionUSD) / expected.millionUSD,
                '美元': Math.abs((marketCap / 1000000) - expected.millionUSD) / expected.millionUSD,
                '千美元': Math.abs((marketCap / 1000) - expected.millionUSD) / expected.millionUSD
            };
            
            console.log('\n误差分析:');
            Object.entries(ratios).forEach(([unit, ratio]) => {
                console.log(`${unit}: ${(ratio * 100).toFixed(2)}% 误差`);
            });
            
            const bestMatch = Object.entries(ratios).reduce((a, b) => a[1] < b[1] ? a : b);
            console.log(`\n最佳匹配单位: ${bestMatch[0]} (误差: ${(bestMatch[1] * 100).toFixed(2)}%)`);
        }
    } else {
        console.log('❌ 未找到marketCapitalization数据');
    }
} else {
    console.log('❌ 未找到stockApp对象，请确保在股票详情页面运行此脚本');
}

console.log('\n=== 使用说明 ===');
console.log('1. 打开股票详情页面 (如 http://localhost:8000/?symbol=AAPL)');
console.log('2. 按F12打开开发者工具');
console.log('3. 切换到Console标签页');
console.log('4. 复制并粘贴此脚本内容到控制台');
console.log('5. 按Enter执行脚本');
console.log('6. 查看输出结果分析API数据单位');