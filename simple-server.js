const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 7000;

// 简单的MIME类型映射
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

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './public/index.html';
  } else if (req.url.startsWith('/api/stock/chinese-name')) {
    // 处理中文名称API
    const url = new URL(req.url, `http://${req.headers.host}`);
    const symbol = url.searchParams.get('symbol');
    
    // 本地中文名称字典
    const localChineseNames = {
      'AAPL': '苹果公司',
      'MSFT': '微软公司', 
      'GOOGL': '谷歌公司',
      'TSLA': '特斯拉公司',
      'NVDA': '英伟达公司',
      'AMZN': '亚马逊公司',
      'BRK.B': '伯克希尔哈撒韦公司',
      'META': 'Meta公司',
      'NFLX': '奈飞公司',
      'BABA': '阿里巴巴集团'
    };
    
    if (!symbol) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Stock symbol is required' }));
      return;
    }
    
    const upperSymbol = symbol.toUpperCase();
    const chineseName = localChineseNames[upperSymbol];
    
    if (chineseName) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        symbol: upperSymbol,
        company_name: null,
        chinese_name: chineseName,
        success: true,
        source: 'local'
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: `No Chinese name found for symbol: ${symbol}`,
        symbol: upperSymbol,
        chinese_name: null,
        company_name: null,
        success: false
      }));
    }
    return;
  } else if (req.url.startsWith('/api/')) {
    // 其他API响应
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'API endpoint working', url: req.url }));
    return;
  } else if (!filePath.includes('.')) {
    filePath = './public' + req.url + '.html';
  } else {
    filePath = './public' + req.url;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - 文件未找到</h1><p>请求的文件: ' + filePath + '</p>');
      } else {
        res.writeHead(500);
        res.end('服务器内部错误: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🚀 简化服务器启动成功!`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`=================================\n`);
});

server.on('error', (err) => {
  console.error('❌ 服务器启动失败:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请尝试其他端口`);
  }
});