// 测试线上K线数据API
const https = require('https');
const url = require('url');

// 计算时间范围（最近30天）
const to = Math.floor(Date.now() / 1000);
const from = to - (30 * 24 * 60 * 60);

const testUrl = `https://stock-name-pages-10-git-v2-simon-pans-projects.vercel.app/api/stock/candles?symbol=AAPL&resolution=D&from=${from}&to=${to}`;

console.log('Testing URL:', testUrl);
console.log('Time range:', {
    from: new Date(from * 1000).toISOString(),
    to: new Date(to * 1000).toISOString()
});

const parsedUrl = url.parse(testUrl);

const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'GET',
    headers: {
        'User-Agent': 'Node.js Test Client'
    }
};

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('\nResponse Body:');
        try {
            const jsonData = JSON.parse(data);
            console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('Raw response (not JSON):', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.setTimeout(10000, () => {
    console.error('Request timeout');
    req.destroy();
});

req.end();