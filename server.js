const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8000;

// 模拟翻译功能（本地开发用）
async function simulateTranslation(text, target) {
  // 简单的模拟翻译，实际部署时会使用火山引擎API
  if (target === 'zh') {
    // 模拟一些常见的英文到中文翻译
    const translations = {
      'Apple': '苹果',
      'Tesla': '特斯拉',
      'Microsoft': '微软',
      'Amazon': '亚马逊',
      'Google': '谷歌',
      'stock': '股票',
      'price': '价格',
      'market': '市场',
      'earnings': '收益',
      'revenue': '营收',
      'shares': '股份',
      'dividend': '股息',
      'growth': '增长',
      'analyst': '分析师',
      'report': '报告',
      'quarter': '季度',
      'billion': '十亿',
      'million': '百万',
      'percent': '百分比',
      'increase': '增加',
      'decrease': '减少'
    };
    
    let translated = text;
    for (const [en, zh] of Object.entries(translations)) {
      const regex = new RegExp(en, 'gi');
      translated = translated.replace(regex, zh);
    }
    
    // 如果没有匹配的翻译，返回原文加上[模拟翻译]标记
    if (translated === text) {
      translated = `[模拟翻译] ${text}`;
    }
    
    return translated;
  }
  return text;
}

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

const server = http.createServer((req, res) => {
  // Enable CORS
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
  
  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Handle translate API
    if (pathname === '/api/translate' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { text, target } = JSON.parse(body);
          // 模拟翻译API响应（实际部署时会使用火山引擎）
          const translatedText = await simulateTranslation(text, target);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true,
            translatedText: translatedText
          }));
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false,
            error: error.message
          }));
        }
      });
      return;
    }
    
    // For other API routes, serve a simple message
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'API routes not available in local development. Please use Vercel deployment for full functionality.',
      path: pathname 
    }));
    return;
  }
  
  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Remove leading slash and resolve file path
  const filePath = path.join(__dirname, pathname.substring(1));
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1>');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`⚠️  Note: API routes will not work in local development. Use Vercel deployment for full functionality.`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Please stop other services or use a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
});