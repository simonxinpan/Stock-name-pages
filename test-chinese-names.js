// 测试中文名称API功能
import fs from 'fs';

console.log('🧪 测试中文名称API...');

// 读取API文件内容并统计
const apiContent = fs.readFileSync('./api/stock/chinese-name.js', 'utf8');
const matches = apiContent.match(/'[A-Z\.\-]+': '[^']+',/g);

console.log('📊 当前API文件统计:');
console.log(`总数量: ${matches ? matches.length : 0}`);

if (matches && matches.length > 0) {
  console.log('\n📋 前20个中文名称示例:');
  matches.slice(0, 20).forEach((match, index) => {
    const [symbol, name] = match.replace(/'/g, '').replace(',', '').split(': ');
    console.log(`${(index + 1).toString().padStart(2, '0')}. ${symbol.padEnd(8)} -> ${name}`);
  });
  
  console.log('\n🔍 重点股票检查:');
  const importantStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BABA', 'JD', 'PDD'];
  
  importantStocks.forEach(symbol => {
    const found = matches.find(match => match.startsWith(`'${symbol}':`) || match.startsWith(`'${symbol.replace('.', '\\.')}':`) );
    if (found) {
      const name = found.split(': ')[1].replace(/'/g, '').replace(',', '');
      console.log(`✅ ${symbol.padEnd(8)} -> ${name}`);
    } else {
      console.log(`❌ ${symbol.padEnd(8)} -> 未找到`);
    }
  });
  
  console.log('\n📈 数据对比:');
  console.log(`- 原始数量: 299个`);
  console.log(`- 用户目标: 400+个`);
  console.log(`- 当前数量: ${matches.length}个`);
  console.log(`- 增长幅度: +${matches.length - 299}个 (${((matches.length - 299) / 299 * 100).toFixed(1)}%)`);
  
  if (matches.length >= 400) {
    console.log('\n🎉 成功达成目标！中文名称数量已超过400个');
  } else {
    console.log('\n⚠️ 距离400个目标还差:', 400 - matches.length, '个');
  }
} else {
  console.log('❌ 未找到中文名称数据');
}

console.log('\n✅ 测试完成');