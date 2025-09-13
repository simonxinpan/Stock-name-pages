// 本地中文股票名称同步脚本
// 使用完整的标普500中文名称字典直接更新API文件

console.log('🚀 本地同步脚本开始执行...');

import fs from 'fs';
import path from 'path';

console.log('📦 模块导入完成');

// 完整的标普500中文名称字典 (400+个股票)
const SP500_CHINESE_NAMES = {
  'MMM': '3M公司',
  'ABNB': 'Airbnb',
  'ABT': '雅培',
  'ABBV': '艾伯维',
  'ACN': '埃森哲',
  'ADBE': 'Adobe',
  'AMD': 'AMD',
  'AES': 'AES公司',
  'AFL': 'Aflac',
  'A': '安捷伦科技',
  'APD': '空气化工产品',
  'AKAM': 'Akamai',
  'ALB': 'Albemarle',
  'ARE': 'Alexandria房地产',
  'ALGN': 'Align Technology',
  'ALLE': 'Allegion',
  'LNT': 'Alliant Energy',
  'ALL': '好事达保险',
  'GOOGL': '谷歌 Class A',
  'GOOG': '谷歌 Class C',
  'MO': '奥驰亚集团',
  'AMZN': '亚马逊',
  'AMCR': 'Amcor',
  'AEE': 'Ameren',
  'AAL': '美国航空',
  'AEP': '美国电力',
  'AXP': '美国运通',
  'AIG': '美国国际集团',
  'AMT': '美国电塔',
  'AWK': '美国水务',
  'AMP': 'Ameriprise Financial',
  'ABC': 'AmerisourceBergen',
  'AME': 'AMETEK',
  'AMGN': '安进',
  'APH': 'Amphenol',
  'ADI': '亚德诺',
  'ANSS': 'ANSYS',
  'AON': '怡安',
  'AOS': 'A. O. Smith',
  'APA': 'APA Corporation',
  'AAPL': '苹果公司',
  'AMAT': '应用材料',
  'APTV': 'Aptiv',
  'ACGL': 'Arch Capital Group',
  'ADM': 'ADM',
  'ANET': 'Arista Networks',
  'AJG': 'Arthur J. Gallagher',
  'AIZ': 'Assurant',
  'T': 'AT&T',
  'ATO': 'Atmos Energy',
  'ADSK': '欧特克',
  'ADP': 'ADP',
  'AZO': 'AutoZone',
  'AVB': 'AvalonBay Communities',
  'AVY': 'Avery Dennison',
  'AXON': 'Axon Enterprise',
  'BKR': 'Baker Hughes',
  'BLL': 'Ball Corporation',
  'BAC': '美国银行',
  'BBWI': 'Bath & Body Works',
  'BAX': '百特',
  'BDX': 'BD',
  'BRK.B': '伯克希尔哈撒韦 B',
  'BBY': '百思买',
  'BG': 'Bunge',
  'BIO': 'Bio-Rad Laboratories',
  'BIIB': '百健',
  'BLK': '贝莱德',
  'BK': '纽约梅隆银行',
  'BA': '波音',
  'BKNG': 'Booking Holdings',
  'BWA': 'BorgWarner',
  'BXP': 'Boston Properties',
  'BSX': '波士顿科学',
  'BMY': '百时美施贵宝',
  'AVGO': '博通',
  'BR': 'Broadridge Financial',
  'BRO': 'Brown & Brown',
  'BF.B': 'Brown-Forman',
  'CHRW': 'C.H. Robinson',
  'CDNS': 'Cadence',
  'CZR': 'Caesars Entertainment',
  'CPT': 'Camden Property Trust',
  'CPB': '金宝汤',
  'COF': '第一资本',
  'CAH': 'Cardinal Health',
  'KMX': 'CarMax',
  'CCL': '嘉年华邮轮',
  'CARR': '开利',
  'CTLT': 'Catalent',
  'CAT': '卡特彼勒',
  'CBOE': 'Cboe Global Markets',
  'CBRE': 'CBRE Group',
  'CDW': 'CDW',
  'CE': 'Celanese',
  'CNC': 'Centene',
  'CNP': 'CenterPoint Energy',
  'CDAY': 'Ceridian',
  'CF': 'CF Industries',
  'CRL': 'Charles River Laboratories',
  'SCHW': '嘉信理财',
  'CHTR': '特许通讯',
  'CVX': '雪佛龙',
  'CMG': 'Chipotle',
  'CB': 'Chubb',
  'CHD': 'Church & Dwight',
  'CI': 'Cigna',
  'CINF': 'Cincinnati Financial',
  'CTAS': 'Cintas',
  'CSCO': '思科',
  'C': '花旗集团',
  'CFG': 'Citizens Financial',
  'CLX': '高乐氏',
  'CME': 'CME集团',
  'CMS': 'CMS Energy',
  'KO': '可口可乐',
  'CTSH': '高知特',
  'CL': '高露洁',
  'CMCSA': '康卡斯特',
  'CMA': 'Comerica',
  'CAG': 'Conagra Brands',
  'COP': '康菲石油',
  'ED': 'Consolidated Edison',
  'STZ': 'Constellation Brands',
  'COO': 'The Cooper Companies',
  'CPRT': 'Copart',
  'GLW': '康宁',
  'CSGP': 'CoStar Group',
  'COST': '好市多',
  'CTRA': 'Coterra Energy',
  'CCI': 'Crown Castle',
  'CSX': 'CSX',
  'CMI': '康明斯',
  'CVS': 'CVS Health',
  'DHI': 'D.R. Horton',
  'DHR': '丹纳赫',
  'DRI': 'Darden Restaurants',
  'DVA': 'DaVita',
  'DE': '迪尔',
  'DAL': '达美航空',
  'XRAY': 'DENTSPLY SIRONA',
  'DVN': 'Devon Energy',
  'DXCM': 'DexCom',
  'FANG': 'Diamondback Energy',
  'DLR': 'Digital Realty Trust',
  'DFS': 'Discover Financial',
  'DISCA': '探索频道 Class A',
  'DISCK': '探索频道 Class C',
  'DISH': 'DISH Network',
  'DIS': '迪士尼',
  'DG': 'Dollar General',
  'DLTR': 'Dollar Tree',
  'D': 'Dominion Energy',
  'DPZ': '达美乐',
  'DOV': 'Dover',
  'DOW': '陶氏',
  'DTE': 'DTE Energy',
  'DUK': '杜克能源',
  'DRE': 'Duke Realty',
  'DD': '杜邦',
  'DXC': 'DXC Technology',
  'EMN': 'Eastman Chemical',
  'ETN': '伊顿',
  'EBAY': 'eBay',
  'ECL': '艺康',
  'EIX': 'Edison International',
  'EW': 'Edwards Lifesciences',
  'EA': '艺电',
  'EMR': '艾默生电气',
  'ENPH': 'Enphase Energy',
  'ETR': 'Entergy',
  'EOG': 'EOG Resources',
  'EFX': 'Equifax',
  'EQIX': 'Equinix',
  'EQR': 'Equity Residential',
  'ESS': 'Essex Property Trust',
  'EL': '雅诗兰黛',
  'ETSY': 'Etsy',
  'RE': 'Everest Re',
  'EVRG': 'Evergy',
  'ES': 'Eversource Energy',
  'EXC': 'Exelon',
  'EXPE': 'Expedia',
  'EXPD': 'Expeditors',
  'EXR': 'Extended Stay America',
  'XOM': '埃克森美孚',
  'FFIV': 'F5 Networks',
  'FB': 'Facebook',
  'FAST': 'Fastenal',
  'FRT': 'Federal Realty',
  'FDX': '联邦快递',
  'FIS': 'Fidelity National Information Services',
  'FITB': 'Fifth Third Bancorp',
  'FE': 'FirstEnergy',
  'FRC': 'First Republic Bank',
  'FISV': 'Fiserv',
  'FLT': 'FleetCor',
  'FMC': 'FMC Corporation',
  'F': '福特汽车',
  'FTNT': 'Fortinet',
  'FTV': 'Fortive',
  'FBHS': 'Fortune Brands',
  'FOXA': '福克斯 Class A',
  'FOX': '福克斯 Class B',
  'BEN': 'Franklin Resources',
  'FCX': '自由港',
  'GPS': 'Gap',
  'GRMN': 'Garmin',
  'IT': 'Gartner',
  'GNRC': 'Generac',
  'GD': '通用动力',
  'GE': '通用电气',
  'GIS': '通用磨坊',
  'GM': '通用汽车',
  'GPC': 'Genuine Parts',
  'GILD': '吉利德科学',
  'GL': 'Globe Life',
  'GPN': 'Global Payments',
  'GS': '高盛',
  'GWW': 'W.W. Grainger',
  'HAL': '哈里伯顿',
  'HBI': 'Hanesbrands',
  'HIG': 'Hartford Financial',
  'HAS': '孩之宝',
  'HCA': 'HCA Healthcare',
  'PEAK': 'Healthpeak Properties',
  'HSIC': 'Henry Schein',
  'HSY': '好时',
  'HES': '赫斯',
  'HPE': '慧与',
  'HLT': '希尔顿',
  'HOLX': 'Hologic',
  'HD': '家得宝',
  'HON': '霍尼韦尔',
  'HRL': 'Hormel Foods',
  'HST': 'Host Hotels & Resorts',
  'HWM': 'Howmet Aerospace',
  'HPQ': '惠普',
  'HUM': 'Humana',
  'HBAN': 'Huntington Bancshares',
  'HII': 'Huntington Ingalls',
  'IEX': 'IDEX Corporation',
  'IDXX': 'IDEXX Laboratories',
  'INFO': 'IHS Markit',
  'ITW': 'Illinois Tool Works',
  'ILMN': 'Illumina',
  'INCY': 'Incyte',
  'IR': '英格索兰',
  'INTC': '英特尔',
  'ICE': '洲际交易所',
  'IBM': 'IBM',
  'IP': 'International Paper',
  'IPG': 'Interpublic Group',
  'IFF': 'International Flavors & Fragrances',
  'INTU': 'Intuit',
  'ISRG': '直觉外科',
  'IVZ': 'Invesco',
  'IPGP': 'IPG Photonics',
  'IQV': 'IQVIA',
  'IRM': 'Iron Mountain',
  'JKHY': 'Jack Henry & Associates',
  'J': 'Jacobs Engineering',
  'JBHT': 'J.B. Hunt',
  'SJM': 'J.M. Smucker',
  'JNJ': '强生',
  'JCI': 'Johnson Controls',
  'JPM': '摩根大通',
  'JNPR': 'Juniper Networks',
  'KSU': 'Kansas City Southern',
  'K': '家乐氏',
  'KEY': 'KeyCorp',
  'KEYS': 'Keysight Technologies',
  'KMB': '金佰利',
  'KIM': 'Kimco Realty',
  'KMI': 'Kinder Morgan',
  'KLAC': 'KLA',
  'KHC': '卡夫亨氏',
  'KR': '克罗格',
  'LB': 'L Brands',
  'LHX': 'L3Harris Technologies',
  'LH': 'LabCorp',
  'LRCX': '泛林集团',
  'LDOS': 'Leidos Holdings',
  'LEN': 'Lennar Corporation',
  'LNC': 'Lincoln National',
  'LIN': '林德集团',
  'LYV': 'Live Nation Entertainment',
  'LKQ': 'LKQ Corporation',
  'LMT': '洛克希德马丁',
  'L': 'Loews Corporation',
  'LOW': '劳氏',
  'LUMN': 'Lumen Technologies',
  'LYB': 'LyondellBasell Industries',
  'MTB': 'M&T Bank',
  'MRO': 'Marathon Oil',
  'MPC': 'Marathon Petroleum',
  'MKTX': 'MarketAxess Holdings',
  'MAR': '万豪国际',
  'MMC': '威达信集团',
  'MLM': 'Martin Marietta Materials',
  'MAS': 'Masco Corporation',
  'MA': '万事达卡',
  'MTCH': 'Match Group',
  'MKC': 'McCormick & Company',
  'MCD': '麦当劳',
  'MCK': 'McKesson',
  'MDT': '美敦力',
  'MRK': '默克',
  'MET': '大都会人寿',
  'MTD': 'Mettler-Toledo International',
  'MGM': 'MGM Resorts International',
  'MCHP': 'Microchip Technology',
  'MU': '美光科技',
  'MSFT': '微软公司',
  'MAA': 'Mid-America Apartment Communities',
  'MRNA': 'Moderna',
  'MHK': 'Mohawk Industries',
  'TAP': 'Molson Coors Beverage',
  'MDLZ': '亿滋国际',
  'MNST': '怪物饮料',
  'MCO': '穆迪',
  'MS': '摩根士丹利',
  'MOS': 'The Mosaic Company',
  'MSI': '摩托罗拉解决方案',
  'MSCI': 'MSCI',
  'NDAQ': '纳斯达克',
  'NTAP': 'NetApp',
  'NFLX': '奈飞',
  'NWL': 'Newell Brands',
  'NEM': '纽蒙特',
  'NWSA': '新闻集团 Class A',
  'NWS': '新闻集团 Class B',
  'NEE': 'NextEra Energy',
  'NLSN': 'Nielsen Holdings',
  'NKE': '耐克',
  'NI': 'NiSource',
  'NSC': '诺福克南方',
  'NTRS': 'Northern Trust',
  'NOC': '诺斯罗普格鲁曼',
  'NLOK': 'NortonLifeLock',
  'NCLH': '挪威邮轮',
  'NRG': 'NRG Energy',
  'NUE': 'Nucor',
  'NVDA': '英伟达',
  'NVR': 'NVR',
  'NXPI': '恩智浦',
  'ORLY': "O'Reilly汽车",
  'OXY': '西方石油',
  'ODFL': 'Old Dominion Freight Line',
  'OMC': '宏盟集团',
  'OKE': 'ONEOK',
  'ORCL': '甲骨文公司',
  'OGN': 'Organon & Co.',
  'OTIS': '奥的斯',
  'PCAR': 'PACCAR',
  'PKG': 'Packaging Corporation of America',
  'PH': 'Parker-Hannifin',
  'PAYX': 'Paychex',
  'PAYC': 'Paycom Software',
  'PYPL': 'PayPal',
  'PENN': 'PENN Entertainment',
  'PNR': 'Pentair',
  'PBCT': "People's United Financial",
  'PEP': '百事可乐',
  'PKI': 'PerkinElmer',
  'PFE': '辉瑞',
  'PM': '菲利普莫里斯国际',
  'PSX': 'Phillips 66',
  'PNW': 'Pinnacle West Capital',
  'PXD': 'Pioneer Natural Resources',
  'PNC': 'PNC金融',
  'POOL': 'Pool Corporation',
  'PPG': 'PPG工业',
  'PPL': 'PPL Corporation',
  'PFG': 'Principal Financial Group',
  'PG': '宝洁',
  'PGR': 'Progressive Corporation',
  'PLD': '普洛斯',
  'PRU': '保德信金融',
  'PTC': 'PTC',
  'PEG': 'Public Service Enterprise Group',
  'PSA': 'Public Storage',
  'PHM': 'PulteGroup',
  'PVH': 'PVH Corp.',
  'QRVO': 'Qorvo',
  'QCOM': '高通',
  'PWR': 'Quanta Services',
  'DGX': 'Quest Diagnostics',
  'RL': 'Ralph Lauren Corporation',
  'RJF': 'Raymond James Financial',
  'RTX': '雷神技术',
  'O': 'Realty Income',
  'REG': 'Regency Centers',
  'REGN': 'Regeneron制药',
  'RF': 'Regions Financial',
  'RSG': 'Republic Services',
  'RMD': 'ResMed',
  'RHI': 'Robert Half',
  'ROK': 'Rockwell Automation',
  'ROL': 'Rollins',
  'ROP': 'Roper Technologies',
  'ROST': 'Ross Stores',
  'RCL': '皇家加勒比邮轮',
  'SPGI': '标普全球',
  'CRM': 'Salesforce',
  'SBAC': 'SBA Communications',
  'SLB': 'SLB',
  'STX': '希捷科技',
  'SEE': 'Sealed Air',
  'SRE': 'Sempra Energy',
  'NOW': 'ServiceNow',
  'SHW': '宣伟',
  'SPG': 'Simon Property',
  'SWKS': 'Skyworks Solutions',
  'SNA': 'Snap-on',
  'SO': '南方公司',
  'LUV': '西南航空',
  'SWK': 'Stanley Black & Decker',
  'SBUX': '星巴克',
  'STT': 'State Street',
  'STE': 'STERIS',
  'SYK': '史赛克',
  'SIVB': 'SVB Financial Group',
  'SYF': 'Synchrony Financial',
  'SNPS': '新思科技',
  'SYY': 'Sysco',
  'TMUS': 'T-Mobile',
  'TROW': 'T. Rowe Price',
  'TTWO': 'Take-Two Interactive',
  'TPG': 'TPG',
  'TGT': '塔吉特',
  'TEL': 'TE Connectivity',
  'TDY': 'Teledyne Technologies',
  'TFX': 'Teleflex',
  'TER': 'Teradyne',
  'TSLA': '特斯拉',
  'TXN': '德州仪器',
  'TXT': 'Textron',
  'TMO': '赛默飞世尔',
  'TJX': 'TJX公司',
  'TSCO': 'Tractor Supply',
  'TT': '特灵科技',
  'TDG': 'TransDigm',
  'TRV': '旅行者保险',
  'TRMB': 'Trimble',
  'TFC': 'Truist Financial',
  'TWTR': '推特',
  'TYL': 'Tyler Technologies',
  'TSN': '泰森食品',
  'USB': '美国合众银行',
  'UDR': 'UDR',
  'ULTA': 'Ulta Beauty',
  'UNP': '联合太平洋',
  'UAL': '联合大陆航空',
  'UPS': '联合包裹',
  'URI': 'United Rentals',
  'UNH': '联合健康',
  'UHS': 'Universal Health Services',
  'VLO': 'Valero Energy',
  'VTR': 'Ventas',
  'VRSN': 'VeriSign',
  'VRSK': 'Verisk Analytics',
  'VZ': '威瑞森',
  'VRTX': 'Vertex制药',
  'VFC': 'VF Corporation',
  'VIAC': 'ViacomCBS',
  'VTRS': 'Viatris',
  'V': 'Visa',
  'VNO': 'Vornado Realty Trust',
  'VMC': 'Vulcan Materials',
  'WRB': 'W. R. Berkley',
  'GWW': 'W.W. Grainger',
  'WAB': 'Wabtec',
  'WBA': '沃博联',
  'WMT': '沃尔玛',
  'WM': '废物管理',
  'WAT': 'Waters Corporation',
  'WEC': 'WEC Energy Group',
  'WFC': '富国银行',
  'WELL': 'Welltower',
  'WST': 'West Pharmaceutical Services',
  'WDC': '西部数据',
  'WU': '西联汇款',
  'WRK': 'WestRock',
  'WY': 'Weyerhaeuser',
  'WHR': '惠而浦',
  'WMB': 'Williams Companies',
  'WLTW': 'Willis Towers Watson',
  'WYNN': '永利度假村',
  'XEL': 'Xcel Energy',
  'XLNX': '赛灵思',
  'XYL': 'Xylem',
  'YUM': '百胜餐饮',
  'ZBRA': 'Zebra Technologies',
  'ZBH': 'Zimmer Biomet',
  'ZION': 'Zions Bancorporation',
  'ZTS': 'Zoetis'
};

// 中概股中文名称字典
const CHINESE_STOCKS_NAMES = {
  'BABA': '阿里巴巴',
  'JD': '京东',
  'PDD': '拼多多',
  'BIDU': '百度',
  'NTES': '网易',
  'TME': '腾讯音乐',
  'BILI': '哔哩哔哩',
  'IQ': '爱奇艺',
  'VIPS': '唯品会',
  'WB': '微博',
  'DIDI': '滴滴出行',
  'TAL': '好未来',
  'EDU': '新东方',
  'YMM': '满帮',
  'DOYU': '斗鱼',
  'HUYA': '虎牙',
  'LI': '理想汽车',
  'NIO': '蔚来',
  'XPEV': '小鹏汽车',
  'BEKE': '贝壳找房'
};

// 生成API文件内容
function generateAPIContent(chineseNames) {
  console.log('\n📝 生成新的API文件内容...');
  
  const sortedSymbols = Object.keys(chineseNames).sort();
  
  let apiContent = `// /api/stock/chinese-name.js
// 获取股票的中文名称 - 本地完整字典版本
// 最后更新: ${new Date().toISOString()}
// 数据来源: 标普500完整字典 + 中概股字典

import { Pool } from 'pg';

let pool;

// 初始化数据库连接池
function getPool() {
  if (!pool) {
    const connectionString = process.env.NEON_DATABASE_URL || 
                            process.env.POSTGRES_URL || 
                            process.env.DATABASE_URL;
    
    console.log('🔍 [Chinese Name API] Environment variables check:');
    console.log('- NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? '✅ Found' : '❌ Not found');
    console.log('- POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Found' : '❌ Not found');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Not found');
    
    if (!connectionString) {
      console.error('❌ [Chinese Name API] No database connection string found!');
      throw new Error('Database connection string not found');
    }
    
    console.log('✅ [Chinese Name API] Using connection string:', connectionString.substring(0, 20) + '...');
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    pool.on('error', (err) => {
      console.error('❌ [Chinese Name API] Database pool error:', err);
    });
  }
  return pool;
}

// 完整的中文名称字典 (${Object.keys(chineseNames).length} 个股票)
const localChineseNames = {\n`;

  // 添加所有中文名称
  sortedSymbols.forEach(symbol => {
    apiContent += `  '${symbol}': '${chineseNames[symbol]}',\n`;
  });
  
  apiContent += `};

export default async function handler(request, response) {
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end();
    return;
  }
  
  if (request.method !== 'GET') {
    response.writeHead(405, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const { symbol } = request.query;
  if (!symbol) {
    response.writeHead(400, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Stock symbol is required' }));
  }

  const upperSymbol = symbol.toUpperCase();
  
  try {
    console.log(\`🔍 [Chinese Name API] Querying for symbol: \${upperSymbol}\`);
    
    // 首先检查本地字典
    if (localChineseNames[upperSymbol]) {
      console.log(\`✅ [Chinese Name API] Found in local dictionary: \${localChineseNames[upperSymbol]}\`);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({
        symbol: upperSymbol,
        chineseName: localChineseNames[upperSymbol],
        source: 'local_dictionary',
        lastUpdated: '${new Date().toISOString()}'
      }));
    }
    
    // 如果本地字典没有，尝试数据库查询
    const dbPool = getPool();
    const queries = [
      'SELECT ticker, company_name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, company_name, name_zh FROM stocks WHERE ticker = $1',
      'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, company_name, name_zh FROM stocks WHERE symbol = $1'
    ];
    
    let result = null;
    for (const query of queries) {
      try {
        result = await dbPool.query(query, [upperSymbol]);
        if (result.rows.length > 0) break;
      } catch (queryError) {
        continue;
      }
    }
    
    if (result && result.rows.length > 0) {
      const stock = result.rows[0];
      const chineseName = stock.chinese_name || stock.name_zh || stock.company_name;
      
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: stock.ticker || stock.symbol,
        chineseName: chineseName,
        source: 'database',
        lastUpdated: new Date().toISOString()
      }));
    } else {
      console.log(\`⚠️ [Chinese Name API] No Chinese name found for: \${upperSymbol}\`);
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: upperSymbol,
        error: 'Chinese name not found',
        source: 'not_found'
      }));
    }
    
  } catch (error) {
    console.error(\`❌ [Chinese Name API] Error for \${upperSymbol}:\`, error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      symbol: upperSymbol,
      error: 'Internal server error',
      details: error.message
    }));
  }
}`;

  return apiContent;
}

// 合并所有中文名称
function mergeAllChineseNames() {
  console.log('\n🔄 合并所有中文名称字典...');
  
  const mergedNames = {
    ...SP500_CHINESE_NAMES,
    ...CHINESE_STOCKS_NAMES
  };
  
  console.log(`📊 合并结果统计:`);
  console.log(`- 标普500股票: ${Object.keys(SP500_CHINESE_NAMES).length} 个`);
  console.log(`- 中概股: ${Object.keys(CHINESE_STOCKS_NAMES).length} 个`);
  console.log(`- 总计: ${Object.keys(mergedNames).length} 个`);
  
  return mergedNames;
}

// 保存同步结果
async function saveSyncResults(chineseNames) {
  console.log('\n💾 保存同步结果...');
  
  const syncData = {
    syncTime: new Date().toISOString(),
    totalCount: Object.keys(chineseNames).length,
    source: 'local_complete_dictionary',
    sp500Count: Object.keys(SP500_CHINESE_NAMES).length,
    chineseStocksCount: Object.keys(CHINESE_STOCKS_NAMES).length,
    data: chineseNames
  };
  
  try {
    const syncFilePath = path.join(process.cwd(), 'chinese-names-sync-complete.json');
    await fs.promises.writeFile(syncFilePath, JSON.stringify(syncData, null, 2), 'utf8');
    console.log(`✅ 同步结果已保存到: ${syncFilePath}`);
  } catch (error) {
    console.error('❌ 保存同步结果失败:', error.message);
  }
}

// 主函数
async function main() {
  try {
    console.log('\n🎯 开始本地中文名称同步...');
    
    // 合并所有中文名称
    const allChineseNames = mergeAllChineseNames();
    
    // 生成新的API文件内容
    const apiContent = generateAPIContent(allChineseNames);
    
    // 写入API文件
    const apiFilePath = path.join(process.cwd(), 'api', 'stock', 'chinese-name.js');
    await fs.promises.writeFile(apiFilePath, apiContent, 'utf8');
    console.log(`✅ API文件已更新: ${apiFilePath}`);
    
    // 保存同步结果
    await saveSyncResults(allChineseNames);
    
    console.log('\n🎉 本地同步完成!');
    console.log(`📈 总共同步了 ${Object.keys(allChineseNames).length} 个股票的中文名称`);
    console.log('📋 详细统计:');
    console.log(`   - 标普500: ${Object.keys(SP500_CHINESE_NAMES).length} 个`);
    console.log(`   - 中概股: ${Object.keys(CHINESE_STOCKS_NAMES).length} 个`);
    
  } catch (error) {
    console.error('❌ 同步过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, SP500_CHINESE_NAMES, CHINESE_STOCKS_NAMES };