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
    console.log(`🔍 [Simple Server] API called: ${req.url}`);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const symbol = url.searchParams.get('symbol');
    console.log(`📋 [Simple Server] Symbol parameter: ${symbol}`);
    
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
      'BABA': '阿里巴巴集团',
      'JPM': '摩根大通',
      'JNJ': '强生公司',
      'V': 'Visa公司',
      'PG': '宝洁公司',
      'UNH': '联合健康集团',
      'HD': '家得宝',
      'MA': '万事达卡',
      'BAC': '美国银行',
      'PFE': '辉瑞公司',
      'XOM': '埃克森美孚'
    };
    
    if (!symbol) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Stock symbol is required' }));
      return;
    }
    
    const upperSymbol = symbol.toUpperCase();
    const chineseName = localChineseNames[upperSymbol];
    
    if (chineseName) {
      console.log(`✅ [Simple Server] Found Chinese name: ${upperSymbol} -> ${chineseName}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        symbol: upperSymbol,
        company_name: null,
        chinese_name: chineseName,
        success: true,
        source: 'local'
      }));
    } else {
      console.log(`❌ [Simple Server] No Chinese name found for: ${upperSymbol}`);
      console.log(`📝 [Simple Server] Available symbols:`, Object.keys(localChineseNames));
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
  } else if (req.url.startsWith('/api/sp500-companies')) {
    // 处理标普500公司翻译API
    console.log(`🔍 [Simple Server] S&P 500 API called: ${req.url}`);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const symbol = url.searchParams.get('symbol');
    console.log(`📋 [Simple Server] S&P 500 Symbol parameter: ${symbol}`);
    
    // 扩展的标普500公司中文名称字典
    const sp500ChineseNames = {
      'AAPL': '苹果公司',
      'MSFT': '微软公司', 
      'GOOGL': '谷歌公司',
      'GOOG': '谷歌公司',
      'TSLA': '特斯拉公司',
      'NVDA': '英伟达公司',
      'AMZN': '亚马逊公司',
      'BRK.B': '伯克希尔哈撒韦公司',
      'META': 'Meta公司',
      'NFLX': '奈飞公司',
      'JPM': '摩根大通',
      'JNJ': '强生公司',
      'V': '维萨公司',
      'PG': '宝洁公司',
      'UNH': '联合健康集团',
      'HD': '家得宝公司',
      'MA': '万事达公司',
      'BAC': '美国银行',
      'ABBV': '艾伯维公司',
      'PFE': '辉瑞公司',
      'KO': '可口可乐公司',
      'AVGO': '博通公司',
      'PEP': '百事公司',
      'TMO': '赛默飞世尔科技',
      'COST': '好市多公司',
      'MRK': '默克公司',
      'WMT': '沃尔玛公司',
      'ABT': '雅培公司',
      'CSCO': '思科公司',
      'ACN': '埃森哲公司',
      'LIN': '林德公司',
      'DHR': '丹纳赫公司',
      'VZ': '威瑞森通信',
      'TXN': '德州仪器',
      'WFC': '富国银行',
      'ADBE': '奥多比公司',
      'ORCL': '甲骨文公司',
      'CRM': 'Salesforce公司',
      'XOM': '埃克森美孚',
      'CMCSA': '康卡斯特公司',
      'PM': '菲利普莫里斯国际',
      'INTC': '英特尔公司',
      'CVX': '雪佛龙公司',
      'DIS': '迪士尼公司',
      'IBM': 'IBM公司',
      'GE': '通用电气',
      'CAT': '卡特彼勒公司',
      'BA': '波音公司',
      'GS': '高盛集团',
      'MMM': '3M公司',
      'NKE': '耐克公司',
      'MCD': '麦当劳公司',
      'HON': '霍尼韦尔国际',
      'AXP': '美国运通',
      'UPS': '联合包裹服务',
      'LOW': '劳氏公司',
      'QCOM': '高通公司',
      'RTX': '雷神技术公司',
      'SPGI': '标普全球',
      'INTU': 'Intuit公司',
      'ISRG': '直觉外科公司',
      'BKNG': 'Booking Holdings',
      'AMD': '超威半导体',
      'TJX': 'TJX公司',
      'AMAT': '应用材料公司',
      'PLD': '普洛斯公司',
      'DE': '迪尔公司',
      'MDT': '美敦力公司',
      'GD': '通用动力',
      'SYK': '史赛克公司',
      'CI': '信诺公司',
      'C': '花旗集团',
      'SO': '南方公司',
      'SCHW': '嘉信理财',
      'ZTS': '硕腾公司',
      'USB': '美国合众银行',
      'MO': '奥驰亚集团',
      'BLK': '贝莱德公司',
      'CVS': 'CVS Health',
      'LMT': '洛克希德马丁',
      'TGT': '塔吉特公司',
      'BSX': '波士顿科学',
      'BMY': '百时美施贵宝',
      'GILD': '吉利德科学',
      'MU': '美光科技',
      'ADI': '亚德诺半导体',
      'LRCX': '拉姆研究',
      'SLB': '斯伦贝谢',
      'ELV': 'Elevance Health',
      'REGN': '再生元制药',
      'PYPL': 'PayPal Holdings',
      'CB': '安达保险集团',
      'MDLZ': '亿滋国际',
      'VRTX': '福泰制药',
      'KLAC': '科磊半导体',
      'DUK': '杜克能源',
      'EOG': 'EOG资源公司',
      'EQIX': 'Equinix公司',
      'NSC': '诺福克南方铁路',
      'SHW': '宣伟公司',
      'ICE': '洲际交易所',
      'PNC': 'PNC金融服务集团',
      'AON': '怡安集团',
      'CL': '高露洁棕榄',
      'ITW': '伊利诺伊工具',
      'CME': '芝加哥商品交易所',
      'FCX': '自由港麦克莫兰',
      'EMR': '艾默生电气',
      'F': '福特汽车',
      'APD': '空气化工产品',
      'WELL': 'Welltower公司',
      'NOC': '诺斯罗普格鲁曼',
      'WM': '废物管理公司',
      'COP': '康菲石油',
      'GM': '通用汽车',
      'MCO': '穆迪公司',
      'FDX': '联邦快递',
      'ECL': '艺康集团',
      'NEE': 'NextEra Energy',
      'ROP': '罗珀科技',
      'CARR': '开利公司',
      'AJG': '亚瑟加拉格尔',
      'TFC': 'Truist Financial',
      'AIG': '美国国际集团',
      'NXPI': '恩智浦半导体',
      'PSA': 'Public Storage',
      'AFL': 'Aflac公司',
      'ALL': '好事达保险',
      'HUM': 'Humana公司',
      'TRV': '旅行者集团',
      'AEP': '美国电力公司',
      'SRE': 'Sempra Energy',
      'PRU': '保德信金融',
      'PCG': '太平洋燃气电力',
      'D': '道明尼资源',
      'RSG': 'Republic Services',
      'KMB': '金佰利公司',
      'O': 'Realty Income',
      'EXC': 'Exelon公司',
      'PAYX': 'Paychex公司',
      'OXY': '西方石油',
      'ROST': 'Ross Stores',
      'A': '安捷伦科技',
      'CTSH': '高知特公司',
      'MSI': '摩托罗拉解决方案',
      'GWW': 'W.W. Grainger',
      'OTIS': '奥的斯电梯',
      'CTAS': 'Cintas公司',
      'FAST': 'Fastenal公司',
      'EA': '艺电公司',
      'CMG': 'Chipotle Mexican Grill',
      'BDX': '贝克顿迪金森',
      'KR': '克罗格公司',
      'VRSK': 'Verisk Analytics',
      'EW': '爱德华兹生命科学',
      'ACGL': 'Arch Capital Group',
      'PCAR': 'PACCAR公司',
      'IQV': 'IQVIA Holdings',
      'ODFL': 'Old Dominion Freight Line',
      'KMI': 'Kinder Morgan',
      'SPG': '西蒙地产集团',
      'MNST': '怪物饮料公司',
      'ROK': '罗克韦尔自动化',
      'FITB': '第五三银行',
      'RMD': 'ResMed公司',
      'CPRT': 'Copart公司',
      'MLM': 'Martin Marietta Materials',
      'IDXX': 'IDEXX Laboratories',
      'FANG': 'Diamondback Energy',
      'AZO': 'AutoZone公司',
      'MCHP': '微芯科技',
      'DXCM': 'DexCom公司',
      'XEL': 'Xcel Energy',
      'CSGP': 'CoStar Group',
      'ANSS': 'ANSYS公司',
      'TROW': 'T. Rowe Price',
      'FTNT': 'Fortinet公司',
      'YUM': '百胜餐饮集团',
      'RCL': '皇家加勒比邮轮',
      'CHTR': 'Charter Communications',
      'EXR': 'Extended Stay America',
      'MPWR': 'Monolithic Power Systems',
      'KEYS': 'Keysight Technologies',
      'NUE': 'Nucor公司',
      'BIIB': '百健公司',
      'WEC': 'WEC Energy Group',
      'SBUX': '星巴克公司',
      'HCA': 'HCA Healthcare',
      'IEX': 'IDEX公司',
      'GEHC': 'GE HealthCare',
      'EFX': 'Equifax公司',
      'VICI': 'VICI Properties',
      'WBD': 'Warner Bros. Discovery',
      'DLTR': 'Dollar Tree',
      'AWK': 'American Water Works',
      'CDNS': 'Cadence Design Systems',
      'SNPS': 'Synopsys公司',
      'GPN': 'Global Payments',
      'LHX': 'L3Harris Technologies',
      'WTW': 'Willis Towers Watson',
      'CBRE': 'CBRE Group',
      'ORLY': "O'Reilly Automotive",
      'IT': 'Gartner公司',
      'AMP': 'Ameriprise Financial',
      'VMC': 'Vulcan Materials',
      'NDAQ': '纳斯达克公司',
      'GLW': '康宁公司',
      'ALGN': 'Align Technology',
      'LYV': 'Live Nation Entertainment',
      'CTVA': 'Corteva公司',
      'DOW': '陶氏公司',
      'HPQ': '惠普公司',
      'BK': '纽约梅隆银行',
      'EBAY': 'eBay公司',
      'STZ': 'Constellation Brands',
      'TSCO': 'Tractor Supply',
      'ED': 'Consolidated Edison',
      'AVB': 'AvalonBay Communities',
      'ILMN': 'Illumina公司',
      'WY': 'Weyerhaeuser公司',
      'EQR': 'Equity Residential',
      'FTV': 'Fortive公司',
      'ETN': '伊顿公司',
      'ZBRA': 'Zebra Technologies',
      'HPE': '慧与公司',
      'HUBB': 'Hubbell公司',
      'PPG': 'PPG工业',
      'STLD': 'Steel Dynamics',
      'GRMN': '佳明公司',
      'WST': 'West Pharmaceutical Services',
      'MTB': 'M&T Bank',
      'HBAN': 'Huntington Bancshares',
      'K': '家乐氏公司',
      'RF': 'Regions Financial',
      'NTRS': '北方信托',
      'CLX': '高乐氏公司',
      'CAH': 'Cardinal Health',
      'EXPD': 'Expeditors International',
      'CINF': 'Cincinnati Financial',
      'CFG': 'Citizens Financial Group',
      'WRB': 'W. R. Berkley',
      'NTAP': 'NetApp公司',
      'LDOS': 'Leidos Holdings',
      'ULTA': 'Ulta Beauty',
      'PODD': 'Insulet公司',
      'GIS': '通用磨坊',
      'JBHT': 'J.B. Hunt Transport Services',
      'LUV': '西南航空',
      'AMGN': '安进公司',
      'POOL': 'Pool公司',
      'CHRW': 'C.H. Robinson Worldwide',
      'J': 'Jacobs Solutions',
      'PKG': 'Packaging Corporation of America',
      'BALL': 'Ball公司',
      'TYL': 'Tyler Technologies',
      'JKHY': 'Jack Henry & Associates',
      'AKAM': 'Akamai Technologies',
      'SYF': 'Synchrony Financial',
      'LVS': '拉斯维加斯金沙集团',
      'TECH': 'Bio-Techne公司',
      'SWKS': 'Skyworks Solutions',
      'INCY': 'Incyte公司',
      'MTCH': 'Match Group',
      'ARE': 'Alexandria Real Estate Equities',
      'PAYC': 'Paycom Software',
      'DFS': 'Discover Financial Services',
      'LW': 'Lamb Weston Holdings',
      'ENPH': 'Enphase Energy',
      'HOLX': 'Hologic公司',
      'FIS': 'Fidelity National Information Services',
      'COO': 'The Cooper Companies',
      'ES': 'Eversource Energy',
      'FICO': 'Fair Isaac公司',
      'VTRS': 'Viatris公司',
      'CTLT': 'Catalent公司',
      'TRMB': 'Trimble公司',
      'MRNA': 'Moderna公司',
      'HSY': '好时公司',
      'TTWO': 'Take-Two Interactive',
      'CTRA': 'Coterra Energy',
      'SMCI': 'Super Micro Computer',
      'TPG': 'TPG公司',
      'SOLV': 'Solventum公司',
      'KKR': 'KKR & Co.',
      'KVUE': 'Kenvue公司',
      'TMUS': 'T-Mobile US',
      'LULU': 'Lululemon Athletica',
      'DECK': 'Deckers Outdoor',
      'ABNB': 'Airbnb公司',
      'PANW': 'Palo Alto Networks',
      'CRWD': 'CrowdStrike Holdings',
      'NOW': 'ServiceNow公司',
      'WDAY': 'Workday公司',
      'SNOW': 'Snowflake公司',
      'ZS': 'Zscaler公司',
      'DDOG': 'Datadog公司',
      'NET': 'Cloudflare公司',
      'OKTA': 'Okta公司',
      'PLTR': 'Palantir Technologies',
      'UBER': '优步公司',
      'LYFT': 'Lyft公司',
      'DOCU': 'DocuSign公司',
      'ZM': 'Zoom Video Communications',
      'ROKU': 'Roku公司',
      'PINS': 'Pinterest公司',
      'SNAP': 'Snap公司',
      'TWTR': '推特公司',
      'SQ': 'Block公司',
      'SHOP': 'Shopify公司',
      'SPOT': 'Spotify Technology',
      'RBLX': 'Roblox公司',
      'U': 'Unity Software',
      'PATH': 'UiPath公司',
      'COIN': 'Coinbase Global',
      'HOOD': 'Robinhood Markets',
      'AFRM': 'Affirm Holdings',
      'UPST': 'Upstart Holdings',
      'SOFI': 'SoFi Technologies',
      'LC': 'LendingClub公司',
      'OPEN': 'Opendoor Technologies',
      'RKT': 'Rocket Companies',
      'WISH': 'ContextLogic公司',
      'CLOV': 'Clover Health',
      'SPCE': 'Virgin Galactic Holdings',
      'NKLA': 'Nikola公司',
      'LCID': 'Lucid Group',
      'RIVN': 'Rivian Automotive',
      'F': '福特汽车',
      'GM': '通用汽车',
      'TSLA': '特斯拉公司'
    };
    
    if (!symbol) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Stock symbol is required' }));
      return;
    }
    
    const upperSymbol = symbol.toUpperCase();
    const chineseName = sp500ChineseNames[upperSymbol];
    
    if (chineseName) {
      console.log(`✅ [Simple Server] Found S&P 500 Chinese name: ${upperSymbol} -> ${chineseName}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        symbol: upperSymbol,
        company_name: null,
        chinese_name: chineseName,
        success: true,
        source: 'sp500_local'
      }));
    } else {
      console.log(`❌ [Simple Server] No S&P 500 Chinese name found for: ${upperSymbol}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: `No S&P 500 Chinese name found for symbol: ${symbol}`,
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