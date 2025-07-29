const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 加载环境变量
require('dotenv').config();

const PORT = process.env.PORT || 3001;

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // 处理API请求
  if (pathname.startsWith('/api/')) {
    // 解析API路径，例如 /api/stock/quote -> stock/quote
    const apiPath = pathname.replace('/api/', '');
    const apiFile = path.join(__dirname, 'api', apiPath + '.js');
    
    console.log(`API Request: ${pathname} -> ${apiFile}`);
    
    if (fs.existsSync(apiFile)) {
      try {
        // 清除require缓存以支持热重载
        delete require.cache[require.resolve(apiFile)];
        const handler = require(apiFile);
        
        // 创建模拟的req对象，添加query参数
        req.query = {};
        if (parsedUrl.query) {
          const queryParams = new URLSearchParams(parsedUrl.query);
          for (const [key, value] of queryParams) {
            req.query[key] = value;
          }
        }
        
        // 添加headers属性
        req.headers = req.headers || {};
        req.headers.origin = `http://localhost:${PORT}`;
        
        if (handler.default) {
          handler.default(req, res);
        } else if (typeof handler === 'function') {
          handler(req, res);
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid API handler' }));
        }
        return;
      } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message, stack: error.stack }));
        return;
      }
    } else {
      console.log(`API file not found: ${apiFile}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found', path: apiPath }));
      return;
    }
  }
  
  // 处理静态文件
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, 'public', pathname);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code + ' ..');
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🚀 服务器启动成功!`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Finnhub API: ${process.env.FINNHUB_API_KEY ? '已配置' : '未配置'}`);
  console.log(`=================================\n`);
});

server.on('error', (err) => {
  console.error('❌ 服务器启动失败:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请尝试其他端口`);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});