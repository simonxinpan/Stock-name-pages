// 测试市值格式化函数修复效果

// 模拟formatMarketCap函数（修复后的版本）
function formatMarketCap(capInMillions, language = 'zh') {
    if (!capInMillions) return 'N/A';
    if (language === 'zh') {
        // capInMillions是以百万美元为单位的市值
        // 1万亿 = 1,000,000百万 = 1,000,000 * 1,000,000美元
        if (capInMillions >= 1000000) return (capInMillions / 1000000).toFixed(2) + '万亿';
        // 1亿 = 100百万 = 100 * 1,000,000美元  
        if (capInMillions >= 100) return (capInMillions / 100).toFixed(2) + '亿';
        // 1万 = 10百万 = 10 * 1,000,000美元
        return (capInMillions / 10).toFixed(2) + '万';
    } else {
        if (capInMillions >= 1000000) return '$' + (capInMillions / 1000000).toFixed(2) + 'T';
        return '$' + (capInMillions / 1000).toFixed(2) + 'B';
    }
}

// 模拟旧版本的formatMarketCap函数（有问题的版本）
function formatMarketCapOld(capInMillions, language = 'zh') {
    if (!capInMillions) return 'N/A';
    if (language === 'zh') {
        if (capInMillions >= 1000000) return (capInMillions / 1000000).toFixed(2) + '万亿';
        return (capInMillions / 100).toFixed(2) + '亿';  // 这里有问题！
    } else {
        if (capInMillions >= 1000000) return '$' + (capInMillions / 1000000).toFixed(2) + 'T';
        return '$' + (capInMillions / 1000).toFixed(2) + 'B';
    }
}

// 测试数据：一些中概股的大概市值（以百万美元为单位）
const testCases = [
    { symbol: 'BABA', name: '阿里巴巴', capInMillions: 200000 }, // 约2000亿美元
    { symbol: 'BEKE', name: '贝壳', capInMillions: 15000 },     // 约150亿美元
    { symbol: 'LI', name: '理想汽车', capInMillions: 25000 },   // 约250亿美元
    { symbol: 'TME', name: '腾讯音乐', capInMillions: 8000 },   // 约80亿美元
    { symbol: 'NIO', name: '蔚来汽车', capInMillions: 12000 },  // 约120亿美元
    { symbol: 'MNSO', name: '名创优品', capInMillions: 3000 },  // 约30亿美元
    { symbol: 'WB', name: '微博', capInMillions: 2500 },       // 约25亿美元
];

console.log('=== 中概股市值格式化测试 ===\n');
console.log('股票代码\t公司名称\t\t修复前\t\t修复后\t\t英文显示');
console.log('--------\t--------\t\t------\t\t------\t\t--------');

testCases.forEach(stock => {
    const oldFormat = formatMarketCapOld(stock.capInMillions, 'zh');
    const newFormat = formatMarketCap(stock.capInMillions, 'zh');
    const enFormat = formatMarketCap(stock.capInMillions, 'en');
    
    console.log(`${stock.symbol}\t\t${stock.name}\t\t${oldFormat}\t\t${newFormat}\t\t${enFormat}`);
});

console.log('\n=== 分析 ===');
console.log('修复前的问题：所有小于万亿的市值都除以100，导致数值偏大10倍');
console.log('修复后的改进：');
console.log('- 大于等于1万亿：除以1,000,000显示为万亿');
console.log('- 大于等于1亿：除以100显示为亿');
console.log('- 小于1亿：除以10显示为万');
console.log('\n这样可以更准确地反映真实的市值规模。');