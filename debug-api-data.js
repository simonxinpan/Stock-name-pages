// 调试API数据格式和单位的测试脚本
// 用于验证Finnhub API返回的marketCapitalization字段的实际单位

const testStocks = [
    { symbol: 'AAPL', name: '苹果公司', expectedMarketCap: '约3.5万亿美元' },
    { symbol: 'MSFT', name: '微软', expectedMarketCap: '约3万亿美元' },
    { symbol: 'BABA', name: '阿里巴巴', expectedMarketCap: '约2000亿美元' },
    { symbol: 'TSLA', name: '特斯拉', expectedMarketCap: '约8000亿美元' },
    { symbol: 'BEKE', name: '贝壳', expectedMarketCap: '约150亿美元' }
];

// 模拟API响应数据（基于实际观察到的数值）
const mockApiResponses = {
    'AAPL': { marketCapitalization: 3500000 }, // 如果单位是百万美元，这代表3.5万亿
    'MSFT': { marketCapitalization: 3000000 }, // 如果单位是百万美元，这代表3万亿
    'BABA': { marketCapitalization: 200000 },  // 如果单位是百万美元，这代表2000亿
    'TSLA': { marketCapitalization: 800000 },  // 如果单位是百万美元，这代表8000亿
    'BEKE': { marketCapitalization: 15000 }    // 如果单位是百万美元，这代表150亿
};

// 当前的formatMarketCap函数（修复后版本）
function formatMarketCap(capInMillions) {
    if (!capInMillions || capInMillions === 0) {
        return '暂无数据';
    }
    
    const language = 'zh'; // 假设中文环境
    
    if (language === 'zh') {
        // 中文显示逻辑
        if (capInMillions >= 1000000) {
            // 大于等于1万亿（1,000,000百万）
            return (capInMillions / 1000000).toFixed(2) + '万亿';
        } else if (capInMillions >= 10000) {
            // 大于等于100亿（10,000百万）
            return (capInMillions / 10000).toFixed(2) + '千亿';
        } else if (capInMillions >= 100) {
            // 大于等于1亿（100百万）
            return (capInMillions / 100).toFixed(2) + '亿';
        } else if (capInMillions >= 10) {
            // 大于等于1000万（10百万）
            return (capInMillions / 10).toFixed(2) + '千万';
        } else {
            // 小于1000万
            return capInMillions.toFixed(2) + '百万';
        }
    } else {
        // 英文显示逻辑
        if (capInMillions >= 1000000) {
            return '$' + (capInMillions / 1000000).toFixed(2) + 'T';
        } else if (capInMillions >= 1000) {
            return '$' + (capInMillions / 1000).toFixed(2) + 'B';
        } else {
            return '$' + capInMillions.toFixed(2) + 'M';
        }
    }
}

// 测试不同的单位假设
function testDifferentUnits() {
    console.log('=== API数据单位分析测试 ===\n');
    
    testStocks.forEach(stock => {
        const apiValue = mockApiResponses[stock.symbol]?.marketCapitalization;
        if (!apiValue) return;
        
        console.log(`${stock.name} (${stock.symbol})`);
        console.log(`预期市值: ${stock.expectedMarketCap}`);
        console.log(`API返回值: ${apiValue}`);
        
        // 假设1: API返回的是百万美元
        const assumption1 = formatMarketCap(apiValue);
        console.log(`假设单位为百万美元: ${assumption1}`);
        
        // 假设2: API返回的是美元（需要除以1,000,000转换为百万美元）
        const assumption2 = formatMarketCap(apiValue / 1000000);
        console.log(`假设单位为美元: ${assumption2}`);
        
        // 假设3: API返回的是千美元（需要除以1,000转换为百万美元）
        const assumption3 = formatMarketCap(apiValue / 1000);
        console.log(`假设单位为千美元: ${assumption3}`);
        
        console.log('---');
    });
}

// 分析当前问题
function analyzeCurrentIssue() {
    console.log('\n=== 当前问题分析 ===\n');
    
    const problematicStocks = [
        { symbol: 'BEKE', name: '贝壳', currentDisplay: '150.00亿', expectedDisplay: '约150亿美元' },
        { symbol: 'LI', name: '理想汽车', currentDisplay: '约XXX', expectedDisplay: '约XXX' }
    ];
    
    console.log('问题股票分析:');
    problematicStocks.forEach(stock => {
        console.log(`${stock.name}: 当前显示 ${stock.currentDisplay}, 预期 ${stock.expectedDisplay}`);
    });
    
    console.log('\n可能的原因:');
    console.log('1. API数据单位理解错误');
    console.log('2. 格式化函数逻辑错误');
    console.log('3. API数据本身不准确或过时');
    console.log('4. 汇率转换问题（如果涉及）');
}

// 运行测试
testDifferentUnits();
analyzeCurrentIssue();

console.log('\n=== 建议的解决方案 ===');
console.log('1. 检查Finnhub API官方文档确认marketCapitalization字段的确切单位');
console.log('2. 使用实际API调用测试几个已知市值的股票');
console.log('3. 对比其他可靠的财经数据源验证数值准确性');
console.log('4. 考虑添加数据更新时间戳显示');