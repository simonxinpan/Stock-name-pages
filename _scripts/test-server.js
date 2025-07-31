const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 加载环境变量
require('dotenv').config();

const PORT = 8080;

console.log('Starting test server...');
console.log(`Finnhub API Key: ${process.env.FINNHUB_API_KEY ? 'Configured' : 'Not configured'}`);

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // 简单的API测试端点
  if (pathname === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'API is working',
      timestamp: new Date().toISOString(),
      finnhub_configured: !!process.env.FINNHUB_API_KEY
    }));
    return;
  }
  
  // 股票报价测试
  if (pathname === '/api/stock/quote') {
    const symbol = parsedUrl.query.symbol || 'AAPL';
    
    // 模拟数据
    const mockData = {
      c: 150.25,  // 当前价格
      d: 2.15,    // 变化
      dp: 1.45,   // 变化百分比
      h: 152.30,  // 最高价
      l: 148.90,  // 最低价
      o: 149.50,  // 开盘价
      pc: 148.10, // 前收盘价
      t: Math.floor(Date.now() / 1000)
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockData));
    return;
  }
  
  // 处理静态文件
  let filePath;
  if (pathname === '/') {
    filePath = path.join(__dirname, 'public', 'index.html');
  } else {
    filePath = path.join(__dirname, 'public', pathname);
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>File: ' + pathname + '</p>');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
      };
      const mimeType = mimeTypes[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}/`);
  console.log('API test endpoint: http://localhost:' + PORT + '/api/test');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down test server...');
  server.close(() => {
    console.log('Test server closed.');
    process.exit(0);
  });
});