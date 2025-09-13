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
  'GPN': 'Global Payments',
  'GS': '高盛',
  'HAL': '哈里伯顿',
  'HBI': 'Hanesbrands',
  'HIG': 'The Hartford Financial Services Group',
  'HAS': '孩之宝',
  'HCA': 'HCA医疗',
  'PEAK': 'Healthpeak Properties',
  'HSIC': 'Henry Schein',
  'HSY': '好时',
  'HES': 'Hess Corporation',
  'HPE': '慧与',
  'HLT': '希尔顿',
  'HOLX': 'Hologic',
  'HD': '家得宝',
  'HON': '霍尼韦尔',
  'HRL': '荷美尔',
  'HST': 'Host Hotels & Resorts',
  'HWM': 'Howmet Aerospace',
  'HPQ': '惠普',
  'HUM': 'Humana',
  'HBAN': 'Huntington Bancshares',
  'HII': 'Huntington Ingalls Industries',
  'IBM': 'IBM',
  'IEX': 'IDEX Corporation',
  'IDXX': 'IDEXX实验室',
  'INFO': 'IHS Markit',
  'ITW': '伊利诺伊工具',
  'ILMN': 'Illumina',
  'INCY': 'Incyte Corporation',
  'IR': 'Ingersoll Rand',
  'INTC': '英特尔',
  'ICE': '洲际交易所',
  'IFF': 'International Flavors & Fragrances',
  'IP': '国际纸业',
  'IPG': 'The Interpublic Group',
  'INTU': 'Intuit',
  'ISRG': 'Intuitive Surgical',
  'IVZ': 'Invesco',
  'IPGP': 'IPG Photonics',
  'IQV': 'IQVIA Holdings',
  'IRM': 'Iron Mountain',
  'JBHT': 'J.B. Hunt Transport Services',
  'JKHY': 'Jack Henry & Associates',
  'J': 'Jacobs Engineering Group',
  'SJM': 'The J.M. Smucker Company',
  'JNJ': '强生',
  'JCI': '江森自控',
  'JPM': '摩根大通',
  'JNPR': 'Juniper Networks',
  'K': '家乐氏',
  'KEY': 'KeyCorp',
  'KEYS': 'Keysight Technologies',
  'KMB': '金佰利',
  'KIM': 'Kimco Realty',
  'KMI': 'Kinder Morgan',
  'KLAC': 'KLA',
  'KHC': '卡夫亨氏',
  'KR': '克罗格',
  'LHX': 'L3Harris Technologies',
  'LH': 'Laboratory Corporation of America Holdings',
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
  'PBCT': 'People\'s United Financial',
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