// 测试真实的Finnhub API数据
// 用于验证marketCapitalization字段的实际单位和数值

const https = require('https');
const url = require('url');

// 从环境变量获取API密钥
require('dotenv').config();
const API_KEY = process.env.FINNHUB_API_KEY;

if (!API_KEY) {
    console.error('❌ 错误: 未找到FINNHUB_API_KEY环境变量');
    console.log('请确保.env文件中包含FINNHUB_API_KEY=your_api_key');
    process.exit(1);
}

// 测试股票列表
const testStocks = [
    { symbol: 'AAPL', name: '苹果公司', expectedMarketCap: '约3.5万亿美元' },
    { symbol: 'MSFT', name: '微软', expectedMarketCap: '约3万亿美元' },
    { symbol: 'BABA', name: '阿里巴巴', expectedMarketCap: '约2000亿美元' },
    { symbol: 'TSLA', name: '特斯拉', expectedMarketCap: '约8000亿美元' },
    { symbol: 'BEKE', name: '贝壳', expectedMarketCap: '约150亿美元' }
];

// 调用Finnhub API获取公司资料
function fetchCompanyProfile(symbol) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY}`;
        const parsedUrl = url.parse(apiUrl);
        
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`解析JSON失败: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

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

// 分析API数据单位
function analyzeMarketCapUnit(apiValue, expectedRange) {
    console.log(`  API原始值: ${apiValue}`);
    
    // 测试不同单位假设
    const scenarios = [
        {
            name: '假设单位为百万美元',
            value: apiValue,
            formatted: formatMarketCap(apiValue)
        },
        {
            name: '假设单位为美元',
            value: apiValue / 1000000,
            formatted: formatMarketCap(apiValue / 1000000)
        },
        {
            name: '假设单位为千美元',
            value: apiValue / 1000,
            formatted: formatMarketCap(apiValue / 1000)
        }
    ];
    
    scenarios.forEach(scenario => {
        console.log(`  ${scenario.name}: ${scenario.formatted}`);
    });
    
    console.log(`  预期范围: ${expectedRange}`);
}

// 主测试函数
async function testRealApiData() {
    console.log('=== 真实Finnhub API数据测试 ===\n');
    console.log(`使用API密钥: ${API_KEY.substring(0, 8)}...\n`);
    
    for (const stock of testStocks) {
        try {
            console.log(`📊 测试 ${stock.name} (${stock.symbol})`);
            
            const profileData = await fetchCompanyProfile(stock.symbol);
            
            if (Object.keys(profileData).length === 0) {
                console.log(`  ❌ 未找到${stock.symbol}的公司资料`);
                continue;
            }
            
            console.log(`  公司名称: ${profileData.name || 'N/A'}`);
            console.log(`  交易所: ${profileData.exchange || 'N/A'}`);
            console.log(`  国家: ${profileData.country || 'N/A'}`);
            console.log(`  行业: ${profileData.finnhubIndustry || 'N/A'}`);
            
            if (profileData.marketCapitalization) {
                analyzeMarketCapUnit(profileData.marketCapitalization, stock.expectedMarketCap);
            } else {
                console.log(`  ❌ 未找到marketCapitalization字段`);
            }
            
            console.log('  ---');
            
            // 添加延迟避免API限制
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`  ❌ 获取${stock.symbol}数据失败:`, error.message);
        }
    }
    
    console.log('\n=== 分析结论 ===');
    console.log('根据上述真实API数据，我们可以确定:');
    console.log('1. marketCapitalization字段的确切单位');
    console.log('2. 当前formatMarketCap函数是否需要调整');
    console.log('3. 显示异常的根本原因');
}

// 运行测试
testRealApiData().catch(error => {
    console.error('测试失败:', error);
});