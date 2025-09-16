const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// 加载环境变量
require('dotenv').config();

const PORT = 8000;

console.log('🚀 启动开发服务器...');
console.log(`📊 Finnhub API Key: ${process.env.FINNHUB_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);

// MIME types
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

// API路由处理函数
async function handleApiRoute(req, res, pathname, query) {
  try {
    // 动态导入API模块
    let apiPath;
    
    if (pathname === '/api/stock/quote') {
      apiPath = './api/stock/quote.js';
    } else if (pathname === '/api/stock/profile') {
      apiPath = './api/stock/profile.js';
    } else if (pathname === '/api/stock/metrics') {
      apiPath = './api/stock/metrics.js';
    } else if (pathname === '/api/stock/news') {
      apiPath = './api/stock/news.js';
    } else if (pathname === '/api/stock/candles') {
      apiPath = './api/stock/candles.js';
    } else if (pathname === '/api/stock/chinese-name') {
      apiPath = './api/stock/chinese-name.js';
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
      return;
    }
    
    // 检查API文件是否存在
    if (!fs.existsSync(apiPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API handler not found' }));
      return;
    }
    
    // 清除require缓存以支持热重载
    delete require.cache[require.resolve(apiPath)];
    
    // 导入API处理器
    const apiHandler = require(apiPath);
    
    // 创建模拟的Vercel请求/响应对象
    const mockReq = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: query,
      body: null
    };
    
    const mockRes = {
      status: (code) => {
        res.statusCode = code;
        return mockRes;
      },
      json: (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      },
      send: (data) => {
        res.end(data);
      },
      setHeader: (key, value) => {
        res.setHeader(key, value);
      },
      writeHead: (statusCode, headers) => {
        res.writeHead(statusCode, headers);
      },
      end: (data) => {
        res.end(data);
      }
    };
    
    // 调用API处理器
    if (typeof apiHandler.default === 'function') {
      await apiHandler.default(mockReq, mockRes);
    } else if (typeof apiHandler === 'function') {
      await apiHandler(mockReq, mockRes);
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API handler' }));
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }));
  }
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
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
  let pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
  
  // 处理API路由
  if (pathname.startsWith('/api/')) {
    await handleApiRoute(req, res, pathname, query);
    return;
  }
  
  // 处理静态文件
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, 'public', pathname);
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 开发服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 静态文件目录: ${path.join(__dirname, 'public')}`);
  console.log(`✅ API路由已启用 - 使用真实Finnhub数据`);
  console.log(`📊 移动版访问地址: http://localhost:${PORT}/mobile.html?symbol=AAPL`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请先停止其他服务或使用其他端口`);
  } else {
    console.error('❌ 服务器错误:', err);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});