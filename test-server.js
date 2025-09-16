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
  
  // 公司资料API
  if (pathname === '/api/stock/profile') {
    const symbol = parsedUrl.query.symbol || 'AAPL';
    
    const mockProfile = {
      country: "US",
      currency: "USD",
      exchange: "NASDAQ NMS - GLOBAL MARKET",
      ipo: "1980-12-12",
      marketCapitalization: 2500000,
      name: "Apple Inc",
      phone: "14089961010",
      shareOutstanding: 15550.061,
      ticker: symbol,
      weburl: "https://www.apple.com/",
      logo: "https://static.finnhub.io/logo/87cb30d8-80df-11ea-8951-00155d64f2e7.png",
      finnhubIndustry: "Technology"
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockProfile));
    return;
  }
  
  // K线数据API
  if (pathname === '/api/stock/candles') {
    const symbol = parsedUrl.query.symbol || 'AAPL';
    const resolution = parsedUrl.query.resolution || 'D';
    
    // 生成模拟K线数据
    const now = Math.floor(Date.now() / 1000);
    const daySeconds = 24 * 60 * 60;
    const mockCandles = {
      c: [], // 收盘价
      h: [], // 最高价
      l: [], // 最低价
      o: [], // 开盘价
      t: [], // 时间戳
      v: [], // 成交量
      s: "ok"
    };
    
    // 生成30天的数据
    for (let i = 29; i >= 0; i--) {
      const timestamp = now - (i * daySeconds);
      const basePrice = 150 + Math.sin(i * 0.1) * 10;
      const open = basePrice + (Math.random() - 0.5) * 2;
      const close = open + (Math.random() - 0.5) * 4;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = Math.floor(Math.random() * 100000000) + 50000000;
      
      mockCandles.t.push(timestamp);
      mockCandles.o.push(Number(open.toFixed(2)));
      mockCandles.h.push(Number(high.toFixed(2)));
      mockCandles.l.push(Number(low.toFixed(2)));
      mockCandles.c.push(Number(close.toFixed(2)));
      mockCandles.v.push(volume);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockCandles));
    return;
  }
  
  // 新闻API
  if (pathname === '/api/stock/news') {
    const symbol = parsedUrl.query.symbol || 'AAPL';
    
    const mockNews = [
      {
        category: "technology",
        datetime: Math.floor(Date.now() / 1000) - 3600,
        headline: "Apple Reports Strong Q4 Earnings",
        id: 1,
        image: "https://via.placeholder.com/300x200",
        related: symbol,
        source: "Reuters",
        summary: "Apple Inc reported better-than-expected quarterly earnings...",
        url: "https://example.com/news1"
      },
      {
        category: "technology",
        datetime: Math.floor(Date.now() / 1000) - 7200,
        headline: "New iPhone Features Announced",
        id: 2,
        image: "https://via.placeholder.com/300x200",
        related: symbol,
        source: "TechCrunch",
        summary: "Apple unveiled new features for the upcoming iPhone series...",
        url: "https://example.com/news2"
      }
    ];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockNews));
    return;
  }
  
  // 中文名称API
  if (pathname === '/api/stock/chinese-name') {
    const symbol = parsedUrl.query.symbol || 'AAPL';
    
    const chineseNames = {
      'AAPL': '苹果公司',
      'MSFT': '微软公司',
      'GOOGL': '谷歌公司',
      'AMZN': '亚马逊公司',
      'TSLA': '特斯拉公司',
      'BABA': '阿里巴巴集团',
      'JD': '京东集团',
      'PDD': '拼多多'
    };
    
    const chineseName = chineseNames[symbol] || symbol;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      symbol: symbol,
      chineseName: chineseName,
      source: "local_dictionary",
      lastUpdated: new Date().toISOString()
    }));
    return;
  }
  
  // 股票指标API
  if (pathname === '/api/stock/metrics') {
    const symbol = parsedUrl.query.symbol || 'AAPL';
    
    const mockMetrics = {
      "10DayAverageTradingVolume": 75000000,
      "52WeekHigh": 182.94,
      "52WeekLow": 124.17,
      "52WeekLowDate": "2024-04-19",
      "52WeekPriceReturnDaily": 15.2,
      "beta": 1.25,
      "marketCapitalization": 2500000,
      "peBasicExclExtraTTM": 28.5,
      "peTTM": 28.5,
      "pbQuarterly": 45.2,
      "psQuarterly": 7.8,
      "dividendYieldIndicatedAnnual": 0.44
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockMetrics));
    return;
  }
  
  // 翻译API
  if (pathname === '/api/translate') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const text = data.text || '';
        
        // 简单的模拟翻译
        const mockTranslation = {
          translatedText: `[翻译] ${text}`,
          originalText: text,
          targetLanguage: data.targetLanguage || 'zh',
          confidence: 0.95
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockTranslation));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // SP500公司列表API
  if (pathname === '/api/sp500-companies') {
    const symbol = parsedUrl.query.symbol;
    
    if (symbol) {
      // 返回特定公司信息
      const mockCompany = {
        symbol: symbol,
        name: symbol === 'AAPL' ? 'Apple Inc.' : `${symbol} Company`,
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 2500000000000,
        chineseName: symbol === 'AAPL' ? '苹果公司' : symbol
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockCompany));
    } else {
      // 返回公司列表
      const mockCompanies = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockCompanies));
    }
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