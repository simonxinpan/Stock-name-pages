const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const port = 8000;

// Finnhub API configuration
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'your_finnhub_api_key_here';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Handle stock API routes
async function handleStockAPI(req, res, pathname, query) {
  const params = querystring.parse(query);
  const symbol = params.symbol;
  
  if (!symbol) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Stock symbol is required' }));
    return;
  }
  
  try {
    let apiUrl;
    let data;
    
    if (pathname === '/api/stock/quote') {
      apiUrl = `${FINNHUB_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`;
      data = await makeRequest(apiUrl);
      
      // Check if data is valid
      if (data.c === 0 && data.d === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `No quote data found for symbol: ${symbol}` }));
        return;
      }
    } else if (pathname === '/api/stock/profile') {
      apiUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`;
      data = await makeRequest(apiUrl);
    } else if (pathname === '/api/stock/metrics') {
      apiUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${symbol.toUpperCase()}&metric=all&token=${FINNHUB_API_KEY}`;
      data = await makeRequest(apiUrl);
    } else if (pathname === '/api/stock/candles') {
      const { resolution = 'D', from, to } = params;
      apiUrl = `${FINNHUB_BASE_URL}/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
      data = await makeRequest(apiUrl);
    } else if (pathname === '/api/stock/news') {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fromDate = lastWeek.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      apiUrl = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
      data = await makeRequest(apiUrl);
    } else if (pathname === '/api/stock/chinese-name') {
      // For Chinese names, return a simple response for now
      const chineseNames = {
        'AAPL': '苹果公司',
        'TSLA': '特斯拉',
        'MSFT': '微软',
        'GOOGL': '谷歌',
        'AMZN': '亚马逊',
        'META': 'Meta平台',
        'NVDA': '英伟达',
        'NFLX': '奈飞'
      };
      data = {
        success: true,
        chinese_name: chineseNames[symbol.toUpperCase()] || symbol.toUpperCase()
      };
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch data from API' }));
  }
}

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

const server = http.createServer(async (req, res) => {
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
    
    // Proxy API routes to real APIs
    if (pathname.startsWith('/api/stock/')) {
      await handleStockAPI(req, res, pathname, parsedUrl.query);
      return;
    }
    
    // For other API routes, serve a simple message
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'API route not implemented in local development.',
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
  console.log(`✅ Real API data enabled - using Finnhub API`);
  console.log(`📊 Access mobile version: http://localhost:${port}/mobile.html?symbol=AAPL`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Please stop other services or use a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
});