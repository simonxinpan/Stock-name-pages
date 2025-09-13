// /api/stock/chinese-name.js
// 获取股票的中文名称

import { Pool } from 'pg';

let pool;

// 初始化数据库连接池
function getPool() {
  if (!pool) {
    // 尝试多个可能的环境变量名
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
      // 添加连接池配置
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // 测试连接
    pool.on('error', (err) => {
      console.error('❌ [Chinese Name API] Database pool error:', err);
    });
  }
  return pool;
}

// 本地中文名称字典 (作为数据库的备用方案)
const localChineseNames = {
  'A': '安捷伦科技',
  'AAL': '美国航空',
  'AAPL': '苹果公司',
  'ABBV': '艾伯维',
  'ABNB': '爱彼迎',
  'ABT': '雅培',
  'ACGL': 'Arch Capital Group',
  'ACN': '埃森哲',
  'ADBE': '奥多比',
  'ADI': '亚德诺半导体',
  'ADM': '阿彻丹尼尔斯米德兰',
  'ADP': '自动数据处理公司',
  'ADSK': '欧特克',
  'AEE': 'Ameren',
  'AEP': '美国电力',
  'AES': '爱依斯电力',
  'AFL': '美国家庭人寿保险',
  'AIG': '美国国际集团',
  'AIZ': 'Assurant',
  'AJG': '亚瑟加拉格尔',
  'AKAM': '阿卡迈科技',
  'ALB': '雅宝',
  'ALGN': '隐适美科技',
  'ALK': '阿拉斯加航空',
  'ALL': '好事达',
  'ALLE': 'Allegion',
  'AMAT': '应用材料',
  'AMCR': 'Amcor',
  'AMD': '超威半导体',
  'AME': '阿美德克',
  'AMGN': '安进',
  'AMP': '美盛安斯泰来',
  'AMT': '美国电塔',
  'AMZN': '亚马逊',
  'ANET': '阿里斯塔网络',
  'ANSS': '安世',
  'AON': '怡安',
  'AOS': 'A.O.史密斯',
  'APA': '阿帕奇',
  'APD': '空气化工产品',
  'APH': '安费诺',
  'APTV': '安波福',
  'ARE': '亚历山大房地产',
  'ATO': 'Atmos Energy',
  'AVB': 'AvalonBay Communities',
  'AVGO': '博通',
  'AVY': '艾利丹尼森',
  'AWK': '美国水务',
  'AXP': '美国运通',
  'AZO': 'AutoZone',
  'BA': '波音',
  'BAC': '美国银行',
  'BALL': '波尔',
  'BAX': '百特国际',
  'BBWI': 'Bath & Body Works',
  'BBY': '百思买',
  'BDX': '贝克顿',
  'BEN': '富兰克林资源',
  'BF.B': '布朗福曼',
  'BG': '邦吉',
  'BIIB': '百健',
  'BIO': 'Bio-Rad实验室',
  'BK': '纽约梅隆银行',
  'BKNG': 'Booking Holdings',
  'BKR': '贝克休斯',
  'BLK': '贝莱德',
  'BMY': '百时美施贵宝',
  'BR': '博通',
  'BRK.B': '伯克希尔哈撒韦B',
  'BRO': '布朗布朗',
  'BSX': '波士顿科学',
  'BWA': '博格华纳',
  'BX': '黑石集团',
  'BXP': '波士顿地产',
  'C': '花旗集团',
  'CAG': '康尼格拉',
  'CAH': '卡地纳健康',
  'CAT': '卡特彼勒',
  'CB': '丘博保险',
  'CBOE': '芝加哥期权交易所',
  'CBRE': '世邦魏理仕',
  'CCI': '冠城国际',
  'CCL': '嘉年华邮轮',
  'CDNS': '铿腾电子',
  'CDW': 'CDW Corporation',
  'CE': '赛拉尼斯',
  'CEG': '星座能源',
  'CF': 'CF实业',
  'CFG': '公民金融',
  'CHD': '丘奇德怀特',
  'CHRW': '罗宾逊全球物流',
  'CHTR': '特许通讯',
  'CI': '信诺',
  'CINF': '辛辛那提金融',
  'CL': '高露洁',
  'CLX': '高乐氏',
  'CMA': '联信银行',
  'CMCSA': '康卡斯特',
  'CME': '芝加哥商品交易所',
  'CMG': '墨式烧烤',
  'CMI': '康明斯',
  'CMS': 'CMS能源',
  'CNA': 'CNA保险',
  'CNP': '中点能源',
  'CNX': 'CONSOL Energy',
  'COF': '第一资本',
  'COO': '库珀医疗',
  'COP': '康菲石油',
  'COST': '好市多',
  'CPB': '金宝汤',
  'CPRT': 'Copart',
  'CPT': 'Camden Property Trust',
  'CRL': '查尔斯河实验室',
  'CRM': '赛富时',
  'CSCO': '思科',
  'CSGP': 'CoStar Group',
  'CSX': 'CSX铁路',
  'CTAS': '仕达屋',
  'CTLT': 'Catalent',
  'CTRA': 'Coterra Energy',
  'CTSH': '高知特',
  'CVS': 'CVS健康',
  'CVX': '雪佛龙',
  'CZR': '凯撒娱乐',
  'D': '多米尼克能源',
  'DAL': '达美航空',
  'DAY': 'Dayforce',
  'DD': '杜邦',
  'DE': '迪尔',
  'DECK': '德克斯户外',
  'DFS': '发现金融服务',
  'DG': '美元通用',
  'DGX': '奎斯特诊断',
  'DHI': '霍顿房屋',
  'DHR': '丹纳赫',
  'DIS': '迪士尼',
  'DLR': 'Digital Realty',
  'DLTR': '美元树',
  'DOV': '多佛',
  'DOW': '陶氏化学',
  'DPZ': '达美乐比萨',
  'DRI': '达顿餐厅',
  'DTE': 'DTE能源',
  'DUK': '杜克能源',
  'DVA': '达维塔医疗',
  'DVN': '德文能源',
  'DXCM': '德康医疗',
  'EA': '艺电',
  'EBAY': '易贝',
  'ECL': '艺康',
  'ED': '爱迪生联合电气',
  'EEM': 'iShares MSCI新兴市场ETF',
  'EFX': 'Equifax',
  'EIX': '爱迪生国际',
  'EL': '雅诗兰黛',
  'ELV': 'Elevance Health',
  'EMN': '伊士曼化工',
  'EMR': '艾默生电气',
  'ENPH': 'Enphase Energy',
  'EOG': 'EOG能源',
  'EPAM': 'EPAM Systems',
  'EQIX': 'Equinix',
  'EQR': 'Equity Residential',
  'EQT': 'EQT能源',
  'ES': 'Eversource Energy',
  'ESS': 'Essex Property Trust',
  'ETN': '伊顿',
  'ETR': '安特吉',
  'ETSY': 'Etsy',
  'EVRG': 'Evergy',
  'EW': '爱德华兹生命科学',
  'EXC': '爱克斯龙',
  'EXPD': '康捷国际物流',
  'EXPE': 'Expedia',
  'EXR': 'Extra Space Storage',
  'F': '福特汽车',
  'FANG': '钻石岩能源',
  'FAST': '快扣',
  'FCX': '自由港麦克莫兰',
  'FDC': '第一数据',
  'FDS': 'FactSet研究系统',
  'FDX': '联邦快递',
  'FE': '第一能源',
  'FFIV': 'F5网络',
  'FI': 'Fidelity National Information Services',
  'FICO': '费埃哲',
  'FIS': '富达国家信息服务',
  'FISV': 'Fiserv',
  'FITB': '第五三银行',
  'FLT': 'FleetCor',
  'FMC': 'FMC公司',
  'FOX': '福克斯广播公司A',
  'FOXA': '福克斯广播公司B',
  'FRT': 'Federal Realty Investment Trust',
  'FSLR': '第一太阳能',
  'FTNT': '飞塔',
  'FTV': 'Fortive',
  'GD': '通用动力',
  'GE': '通用电气',
  'GEHC': 'GE医疗',
  'GEV': 'GE Vernova',
  'GILD': '吉利德科学',
  'GIS': '通用磨坊',
  'GL': 'Globe Life',
  'GOOG': '谷歌 Class C',
  'GOOGL': '谷歌 Class A',
  'GPN': 'Global Payments',
  'GS': '高盛',
  'HAL': '哈里伯顿',
  'HBI': 'Hanesbrands',
  'HCA': 'HCA医疗',
  'HD': '家得宝',
  'HES': 'Hess Corporation',
  'HIG': 'The Hartford Financial Services Group',
  'HII': 'Huntington Ingalls Industries',
  'HLT': '希尔顿',
  'HOLX': 'Hologic',
  'HON': '霍尼韦尔',
  'HPE': '慧与',
  'HPQ': '惠普',
  'HRL': '荷美尔',
  'HSIC': 'Henry Schein',
  'HST': 'Host Hotels & Resorts',
  'HSY': '好时',
  'HUM': 'Humana',
  'HWM': 'Howmet Aerospace',
  'IBM': 'IBM',
  'ICE': '洲际交易所',
  'IDXX': 'IDEXX实验室',
  'IEX': 'IDEX Corporation',
  'IFF': 'International Flavors & Fragrances',
  'ILMN': 'Illumina',
  'INCY': 'Incyte Corporation',
  'INFO': 'IHS Markit',
  'INTC': '英特尔',
  'INTU': 'Intuit',
  'IP': '国际纸业',
  'IPG': 'The Interpublic Group',
  'IPGP': 'IPG Photonics',
  'IQV': 'IQVIA Holdings',
  'IR': 'Ingersoll Rand',
  'IRM': 'Iron Mountain',
  'ISRG': 'Intuitive Surgical',
  'IT': 'Gartner',
  'ITW': '伊利诺伊工具',
  'IVZ': 'Invesco',
  'J': 'Jacobs Engineering Group',
  'JBHT': 'J.B. Hunt Transport Services',
  'JCI': '江森自控',
  'JKHY': 'Jack Henry & Associates',
  'JNJ': '强生',
  'JNPR': 'Juniper Networks',
  'JPM': '摩根大通',
  'K': '家乐氏',
  'KEY': 'KeyCorp',
  'KEYS': 'Keysight Technologies',
  'KHC': '卡夫亨氏',
  'KIM': 'Kimco Realty',
  'KLAC': 'KLA',
  'KMB': '金佰利',
  'KMI': 'Kinder Morgan',
  'KMX': 'CarMax',
  'KO': '可口可乐',
  'KR': '克罗格',
  'L': 'Loews Corporation',
  'LDOS': 'Leidos Holdings',
  'LEN': 'Lennar Corporation',
  'LH': 'Laboratory Corporation of America Holdings',
  'LHX': 'L3Harris Technologies',
  'LIN': '林德集团',
  'LKQ': 'LKQ Corporation',
  'LLY': '礼来',
  'LMT': '洛克希德马丁',
  'LNC': 'Lincoln National',
  'LNT': 'Alliant Energy Corporation',
  'LOW': '劳氏',
  'LRCX': '泛林集团',
  'LUMN': 'Lumen Technologies',
  'LUV': '西南航空',
  'LYB': 'LyondellBasell Industries',
  'LYV': 'Live Nation Entertainment',
  'MA': '万事达卡',
  'MAA': 'Mid-America Apartment Communities',
  'MAR': '万豪国际',
  'MAS': 'Masco Corporation',
  'MCD': '麦当劳',
  'MCHP': 'Microchip Technology',
  'MCK': 'McKesson',
  'MCO': '穆迪',
  'MDLZ': '亿滋国际',
  'MDT': '美敦力',
  'MET': '大都会人寿',
  'META': 'Meta Platforms',
  'MGM': 'MGM Resorts International',
  'MHK': 'Mohawk Industries',
  'MKC': 'McCormick & Company',
  'MKTX': 'MarketAxess Holdings',
  'MLM': 'Martin Marietta Materials',
  'MMC': '威达信集团',
  'MMM': '3M公司',
  'MNST': '怪物饮料',
  'MO': 'Altria Group',
  'MOS': 'The Mosaic Company',
  'MPC': 'Marathon Petroleum',
  'MPWR': 'Monolithic Power Systems',
  'MRK': '默克',
  'MRO': 'Marathon Oil',
  'MRNA': 'Moderna',
  'MS': '摩根士丹利',
  'MSCI': 'MSCI',
  'MSFT': '微软公司',
  'MSI': '摩托罗拉解决方案',
  'MTB': 'M&T Bank',
  'MTCH': 'Match Group',
  'MTD': 'Mettler-Toledo International',
  'MU': '美光科技',
  'NCLH': '挪威邮轮',
  'NDAQ': '纳斯达克',
  'NEE': 'NextEra Energy',
  'NEM': '纽蒙特',
  'NFLX': '奈飞',
  'NI': 'NiSource',
  'NKE': '耐克',
  'NLOK': 'NortonLifeLock',
  'NLSN': 'Nielsen Holdings',
  'NOC': '诺斯罗普格鲁曼',
  'NOW': 'ServiceNow',
  'NRG': 'NRG Energy',
  'NSC': '诺福克南方',
  'NTAP': 'NetApp',
  'NTRS': 'Northern Trust',
  'NUE': 'Nucor',
  'NVDA': '英伟达',
  'NVR': 'NVR',
  'NWL': 'Newell Brands',
  'NWS': '新闻集团 Class B',
  'NWSA': '新闻集团 Class A',
  'NXPI': '恩智浦',
  'O': 'Realty Income',
  'ODFL': 'Old Dominion Freight Line',
  'OGN': 'Organon & Co.',
  'OKE': 'ONEOK',
  'OMC': '宏盟集团',
  'ORCL': '甲骨文公司',
  'ORLY': "O'Reilly汽车",
  'OTIS': '奥的斯',
  'OXY': '西方石油',
  'PCAR': 'PACCAR',
  'PAYC': 'Paycom Software',
  'PAYX': 'Paychex',
  'PBCT': 'People\'s United Financial',
  'PEAK': 'Healthpeak Properties',
  'PEG': 'Public Service Enterprise Group',
  'PENN': 'PENN Entertainment',
  'PEP': '百事可乐',
  'PFE': '辉瑞',
  'PFG': 'Principal Financial Group',
  'PG': '宝洁',
  'PGR': 'Progressive Corporation',
  'PH': 'Parker-Hannifin',
  'PHM': 'PulteGroup',
  'PKG': 'Packaging Corporation of America',
  'PKI': 'PerkinElmer',
  'PLD': '普洛斯',
  'PM': '菲利普莫里斯国际',
  'PNC': 'PNC金融',
  'PNR': 'Pentair',
  'PNW': 'Pinnacle West Capital',
  'POOL': 'Pool Corporation',
  'PPG': 'PPG工业',
  'PPL': 'PPL Corporation',
  'PRU': '保德信金融',
  'PSA': 'Public Storage',
  'PSX': 'Phillips 66',
  'PTC': 'PTC',
  'PVH': 'PVH Corp.',
  'PWR': 'Quanta Services',
  'PXD': 'Pioneer Natural Resources',
  'PYPL': 'PayPal',
  'QCOM': '高通',
  'QRVO': 'Qorvo',
  'RCL': '皇家加勒比邮轮',
  'RE': 'Everest Re Group',
  'REG': 'Regency Centers',
  'REGN': 'Regeneron制药',
  'RF': 'Regions Financial',
  'RHI': 'Robert Half',
  'RJF': 'Raymond James Financial',
  'RL': 'Ralph Lauren Corporation',
  'RMD': 'ResMed',
  'ROK': 'Rockwell Automation',
  'ROL': 'Rollins',
  'ROP': 'Roper Technologies',
  'ROST': 'Ross Stores',
  'RSG': 'Republic Services',
  'RTX': '雷神技术',
  'SBAC': 'SBA Communications',
  'SBUX': '星巴克',
  'SCHW': 'Charles Schwab',
  'SEE': 'Sealed Air',
  'SHW': '宣伟',
  'SIVB': 'SVB Financial Group',
  'SJM': 'The J.M. Smucker Company',
  'SLB': 'SLB',
  'SNA': 'Snap-on',
  'SNPS': '新思科技',
  'SO': '南方公司',
  'SPGI': '标普全球',
  'SPG': 'Simon Property',
  'SRE': 'Sempra Energy',
  'STE': 'STERIS',
  'STT': 'State Street',
  'STX': '希捷科技',
  'STZ': 'Constellation Brands',
  'SWK': 'Stanley Black & Decker',
  'SWKS': 'Skyworks Solutions',
  'SYF': 'Synchrony Financial',
  'SYK': '史赛克',
  'SYY': 'Sysco',
  'T': 'AT&T',
  'TAP': 'Molson Coors Beverage',
  'TDG': 'TransDigm',
  'TDY': 'Teledyne Technologies',
  'TEL': 'TE Connectivity',
  'TER': 'Teradyne',
  'TFC': 'Truist Financial',
  'TFX': 'Teleflex',
  'TGT': '塔吉特',
  'TJX': 'TJX公司',
  'TMO': '赛默飞世尔',
  'TMUS': 'T-Mobile',
  'TROW': 'T. Rowe Price',
  'TRV': '旅行者保险',
  'TSCO': 'Tractor Supply',
  'TSLA': '特斯拉',
  'TSN': '泰森食品',
  'TT': '特灵科技',
  'TTWO': 'Take-Two Interactive',
  'TWTR': '推特',
  'TXN': '德州仪器',
  'TXT': 'Textron',
  'TYL': 'Tyler Technologies',
  'UAL': '联合大陆航空',
  'UDR': 'UDR',
  'UHS': 'Universal Health Services',
  'ULTA': 'Ulta Beauty',
  'UNH': '联合健康',
  'UNP': '联合太平洋',
  'UPS': '联合包裹',
  'URI': 'United Rentals',
  'USB': '美国合众银行',
  'V': 'Visa',
  'VFC': 'VF Corporation',
  'VIAC': 'ViacomCBS',
  'VLO': 'Valero Energy',
  'VMC': 'Vulcan Materials',
  'VNO': 'Vornado Realty Trust',
  'VRSK': 'Verisk Analytics',
  'VRSN': 'VeriSign',
  'VRTX': 'Vertex制药',
  'VTRS': 'Viatris',
  'VTR': 'Ventas',
  'VZ': '威瑞森',
  'WAB': 'Wabtec',
  'WAT': 'Waters Corporation',
  'WBA': '沃博联',
  'WDC': '西部数据',
  'WEC': 'WEC Energy Group',
  'WELL': 'Welltower',
  'WFC': '富国银行',
  'WHR': '惠而浦',
  'WM': '废物管理',
  'WMB': 'Williams Companies',
  'WMT': '沃尔玛',
  'WRB': 'W. R. Berkley',
  'WRK': 'WestRock',
  'WST': 'West Pharmaceutical Services',
  'WU': '西联汇款',
  'WY': 'Weyerhaeuser',
  'WYNN': '永利度假村',
  'XEL': 'Xcel Energy',
  'XLNX': '赛灵思',
  'XOM': '埃克森美孚',
  'XRAY': 'DENTSPLY SIRONA',
  'XYL': 'Xylem',
  'YUM': '百胜餐饮',
  'ZBRA': 'Zebra Technologies',
  'ZBH': 'Zimmer Biomet',
  'ZION': 'Zions Bancorporation',
  'ZTS': 'Zoetis',
  // ETF
  'SPY': '标普500ETF',
  'QQQ': '纳斯达克100ETF',
  'IWM': '罗素2000ETF',
  'VTI': '全市场ETF',
  'VOO': '标普500ETF',
  // 中概股
  'BABA': '阿里巴巴集团',
  'BRK-B': '伯克希尔哈撒韦公司'
,
  'STLD': 'Steel Dynamics',
  'STZ': '星座品牌',
  'T': '美国电话电报',
  'TECH': 'Bio-Techne',
  'TPR': '泰佩思琪',
  'TRGP': 'Targa Resources',
  'VEEV': 'Veeva Systems',
  'VER': 'Verisk Analytics',
  'VICI': 'VICI Properties',
  'VRT': 'Vertiv Holdings',
  'WBD': '华纳兄弟探索',
  'WCN': 'Waste Connections',
  'WTW': '韦莱韬悦',
  'XOM': '埃克森美孚',
  'XRAY': '登士柏西诺德'};

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
    console.log(`🔍 [Chinese Name API] Querying database for symbol: ${upperSymbol}`);
    
    // 首先尝试数据库查询
    const dbPool = getPool();
    
    // 尝试多个可能的表名和列名组合
    const queries = [
      'SELECT ticker, company_name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, company_name, name_zh FROM stocks WHERE ticker = $1',
      'SELECT ticker, name, chinese_name FROM stocks WHERE ticker = $1',
      'SELECT ticker, name, name_zh FROM stocks WHERE ticker = $1',
      // 备用查询，以防列名确实是symbol
      'SELECT symbol, company_name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, company_name, name_zh FROM stocks WHERE symbol = $1',
      'SELECT symbol, name, chinese_name FROM stocks WHERE symbol = $1',
      'SELECT symbol, name, name_zh FROM stocks WHERE symbol = $1'
    ];
    
    let result = null;
    let usedQuery = '';
    
    for (const query of queries) {
      try {
        console.log(`🔍 [Chinese Name API] Trying query: ${query}`);
        result = await dbPool.query(query, [upperSymbol]);
        usedQuery = query;
        console.log(`✅ [Chinese Name API] Query successful, found ${result.rows.length} rows`);
        break;
      } catch (queryError) {
        console.log(`❌ [Chinese Name API] Query failed: ${queryError.message}`);
        continue;
      }
    }
    
    if (result && result.rows.length > 0) {
      const stock = result.rows[0];
      console.log(`✅ [Chinese Name API] Found stock data:`, stock);
      
      // 智能获取中文名称字段
      const chineseName = stock.chinese_name || stock.name_zh || stock.company_name || stock.name;
      
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        symbol: stock.ticker || stock.symbol,
        company_name: stock.company_name || stock.name,
        chinese_name: chineseName,
        success: true,
        source: 'database',
        query_used: usedQuery
      }));
      return;
    } else {
      console.log(`❌ [Chinese Name API] No data found in database for symbol: ${upperSymbol}`);
    }
  } catch (error) {
    console.error(`❌ [Chinese Name API] Database error for ${upperSymbol}:`, error.message);
    console.error('Full error:', error);
  }
  
  // 数据库查询失败或无结果时，使用本地字典
  console.log(`🔄 [Chinese Name API] Falling back to local dictionary for: ${upperSymbol}`);
  const chineseName = localChineseNames[upperSymbol];
  
  if (chineseName) {
    console.log(`✅ [Chinese Name API] Found in local dictionary: ${upperSymbol} -> ${chineseName}`);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      symbol: upperSymbol,
      company_name: null,
      chinese_name: chineseName,
      success: true,
      source: 'local'
    }));
  } else {
    console.log(`❌ [Chinese Name API] Not found in local dictionary: ${upperSymbol}`);
    console.log(`📝 [Chinese Name API] Available symbols in local dictionary:`, Object.keys(localChineseNames));
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ 
      error: `No Chinese name found for symbol: ${symbol}`,
      symbol: upperSymbol,
      chinese_name: null,
      company_name: null,
      success: false
    }));
  }
}