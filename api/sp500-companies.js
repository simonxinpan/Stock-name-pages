import crypto from 'crypto';

// 标普500公司列表（精简版，包含真正的标普500成分股）
const SP500_COMPANIES = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'GOOG', name: 'Alphabet Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'LLY', name: 'Eli Lilly and Company' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'MA', name: 'Mastercard Incorporated' },
  { symbol: 'PG', name: 'The Procter & Gamble Company' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'HD', name: 'The Home Depot Inc.' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation' },
  { symbol: 'ABBV', name: 'AbbVie Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'BAC', name: 'Bank of America Corporation' },
  { symbol: 'CVX', name: 'Chevron Corporation' },
  { symbol: 'KO', name: 'The Coca-Cola Company' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
  { symbol: 'PEP', name: 'PepsiCo Inc.' },
  { symbol: 'LIN', name: 'Linde plc' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'ACN', name: 'Accenture plc' },
  { symbol: 'NOW', name: 'ServiceNow Inc.' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'IBM', name: 'International Business Machines Corporation' },
  { symbol: 'GE', name: 'General Electric Company' },
  { symbol: 'CAT', name: 'Caterpillar Inc.' },
  { symbol: 'INTU', name: 'Intuit Inc.' },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated' },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.' },
  { symbol: 'CMCSA', name: 'Comcast Corporation' },
  { symbol: 'AMAT', name: 'Applied Materials Inc.' },
  { symbol: 'HON', name: 'Honeywell International Inc.' },
  { symbol: 'AMGN', name: 'Amgen Inc.' },
  { symbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.' },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.' },
  { symbol: 'AXP', name: 'American Express Company' },
  { symbol: 'SPGI', name: 'S&P Global Inc.' },
  { symbol: 'LRCX', name: 'Lam Research Corporation' },
  { symbol: 'DE', name: 'Deere & Company' },
  { symbol: 'GS', name: 'The Goldman Sachs Group Inc.' },
  { symbol: 'SYK', name: 'Stryker Corporation' },
  { symbol: 'MDT', name: 'Medtronic plc' },
  { symbol: 'TJX', name: 'The TJX Companies Inc.' },
  { symbol: 'VRTX', name: 'Vertex Pharmaceuticals Incorporated' },
  { symbol: 'BLK', name: 'BlackRock Inc.' },
  { symbol: 'SCHW', name: 'The Charles Schwab Corporation' },
  { symbol: 'PLD', name: 'Prologis Inc.' },
  { symbol: 'ADI', name: 'Analog Devices Inc.' },
  { symbol: 'PANW', name: 'Palo Alto Networks Inc.' },
  { symbol: 'ANET', name: 'Arista Networks Inc.' },
  { symbol: 'C', name: 'Citigroup Inc.' },
  { symbol: 'MU', name: 'Micron Technology Inc.' },
  { symbol: 'CB', name: 'Chubb Limited' },
  { symbol: 'FI', name: 'Fiserv Inc.' },
  { symbol: 'GILD', name: 'Gilead Sciences Inc.' },
  { symbol: 'SO', name: 'The Southern Company' },
  { symbol: 'KLAC', name: 'KLA Corporation' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'CME', name: 'CME Group Inc.' },
  { symbol: 'EQIX', name: 'Equinix Inc.' },
  { symbol: 'SNPS', name: 'Synopsys Inc.' },
  { symbol: 'CDNS', name: 'Cadence Design Systems Inc.' },
  { symbol: 'USB', name: 'U.S. Bancorp' },
  { symbol: 'REGN', name: 'Regeneron Pharmaceuticals Inc.' },
  { symbol: 'PNC', name: 'The PNC Financial Services Group Inc.' },
  { symbol: 'AON', name: 'Aon plc' },
  { symbol: 'APH', name: 'Amphenol Corporation' },
  { symbol: 'CL', name: 'Colgate-Palmolive Company' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings Inc.' },
  { symbol: 'MMC', name: 'Marsh & McLennan Companies Inc.' },
  { symbol: 'CSX', name: 'CSX Corporation' },
  { symbol: 'FTNT', name: 'Fortinet Inc.' },
  { symbol: 'ECL', name: 'Ecolab Inc.' },
  { symbol: 'WM', name: 'Waste Management Inc.' },
  { symbol: 'ITW', name: 'Illinois Tool Works Inc.' },
  { symbol: 'WELL', name: 'Welltower Inc.' },
  { symbol: 'SHW', name: 'The Sherwin-Williams Company' },
  { symbol: 'FCX', name: 'Freeport-McMoRan Inc.' },
  { symbol: 'BSX', name: 'Boston Scientific Corporation' },
  { symbol: 'MCO', name: 'Moody\'s Corporation' },
  { symbol: 'CARR', name: 'Carrier Global Corporation' },
  { symbol: 'ICE', name: 'Intercontinental Exchange Inc.' },
  { symbol: 'CMG', name: 'Chipotle Mexican Grill Inc.' },
  { symbol: 'PCAR', name: 'PACCAR Inc' },
  { symbol: 'MSI', name: 'Motorola Solutions Inc.' },
  { symbol: 'DUK', name: 'Duke Energy Corporation' },
  { symbol: 'TDG', name: 'TransDigm Group Incorporated' },
  { symbol: 'TT', name: 'Trane Technologies plc' },
  { symbol: 'EMR', name: 'Emerson Electric Co.' },
  { symbol: 'COF', name: 'Capital One Financial Corporation' },
  { symbol: 'NSC', name: 'Norfolk Southern Corporation' },
  { symbol: 'SLB', name: 'SLB' },
  { symbol: 'GD', name: 'General Dynamics Corporation' },
  { symbol: 'CPRT', name: 'Copart Inc.' },
  { symbol: 'ORLY', name: 'O\'Reilly Automotive Inc.' },
  { symbol: 'EOG', name: 'EOG Resources Inc.' },
  { symbol: 'WFC', name: 'Wells Fargo & Company' },
  { symbol: 'NOC', name: 'Northrop Grumman Corporation' },
  { symbol: 'RSG', name: 'Republic Services Inc.' },
  { symbol: 'FAST', name: 'Fastenal Company' },
  { symbol: 'FICO', name: 'Fair Isaac Corporation' },
  { symbol: 'ROP', name: 'Roper Technologies Inc.' },
  { symbol: 'KMB', name: 'Kimberly-Clark Corporation' },
  { symbol: 'DHR', name: 'Danaher Corporation' },
  { symbol: 'PAYX', name: 'Paychex Inc.' },
  { symbol: 'CTAS', name: 'Cintas Corporation' },
  { symbol: 'ODFL', name: 'Old Dominion Freight Line Inc.' },
  { symbol: 'EA', name: 'Electronic Arts Inc.' },
  { symbol: 'URI', name: 'United Rentals Inc.' },
  { symbol: 'MLM', name: 'Martin Marietta Materials Inc.' },
  { symbol: 'VMC', name: 'Vulcan Materials Company' },
  { symbol: 'CTSH', name: 'Cognizant Technology Solutions Corporation' },
  { symbol: 'LULU', name: 'Lululemon Athletica Inc.' },
  { symbol: 'NXPI', name: 'NXP Semiconductors N.V.' },
  { symbol: 'DXCM', name: 'DexCom Inc.' },
  { symbol: 'HCA', name: 'HCA Healthcare Inc.' },
  { symbol: 'VRSK', name: 'Verisk Analytics Inc.' },
  { symbol: 'EXC', name: 'Exelon Corporation' },
  { symbol: 'IDXX', name: 'IDEXX Laboratories Inc.' },
  { symbol: 'A', name: 'Agilent Technologies Inc.' },
  { symbol: 'IQV', name: 'IQVIA Holdings Inc.' },
  { symbol: 'KHC', name: 'The Kraft Heinz Company' },
  { symbol: 'GWW', name: 'W.W. Grainger Inc.' },
  { symbol: 'MPWR', name: 'Monolithic Power Systems Inc.' },
  { symbol: 'TTWO', name: 'Take-Two Interactive Software Inc.' },
  { symbol: 'XEL', name: 'Xcel Energy Inc.' },
  { symbol: 'AEP', name: 'American Electric Power Company Inc.' },
  { symbol: 'ADSK', name: 'Autodesk Inc.' },
  { symbol: 'MNST', name: 'Monster Beverage Corporation' },
  { symbol: 'EW', name: 'Edwards Lifesciences Corporation' },
  { symbol: 'PSA', name: 'Public Storage' },
  { symbol: 'FANG', name: 'Diamondback Energy Inc.' },
  { symbol: 'ROST', name: 'Ross Stores Inc.' },
  { symbol: 'YUM', name: 'Yum! Brands Inc.' },
  { symbol: 'CTVA', name: 'Corteva Inc.' },
  { symbol: 'DOW', name: 'Dow Inc.' },
  { symbol: 'GEHC', name: 'GE HealthCare Technologies Inc.' },
  { symbol: 'KMI', name: 'Kinder Morgan Inc.' },
  { symbol: 'HLT', name: 'Hilton Worldwide Holdings Inc.' },
  { symbol: 'CSGP', name: 'CoStar Group Inc.' },
  { symbol: 'AMP', name: 'Ameriprise Financial Inc.' },
  { symbol: 'BDX', name: 'Becton Dickinson and Company' },
  { symbol: 'ALL', name: 'The Allstate Corporation' },
  { symbol: 'MCHP', name: 'Microchip Technology Incorporated' },
  { symbol: 'CCI', name: 'Crown Castle Inc.' },
  { symbol: 'TEAM', name: 'Atlassian Corporation' },
  { symbol: 'AJG', name: 'Arthur J. Gallagher & Co.' },
  { symbol: 'BIIB', name: 'Biogen Inc.' },
  { symbol: 'CMI', name: 'Cummins Inc.' },
  { symbol: 'TEL', name: 'TE Connectivity Ltd.' },
  { symbol: 'TROW', name: 'T. Rowe Price Group Inc.' },
  { symbol: 'SBUX', name: 'Starbucks Corporation' },
  { symbol: 'AFL', name: 'Aflac Incorporated' },
  { symbol: 'AZO', name: 'AutoZone Inc.' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation' },
  { symbol: 'GRMN', name: 'Garmin Ltd.' },
  { symbol: 'TRV', name: 'The Travelers Companies Inc.' },
  { symbol: 'AIG', name: 'American International Group Inc.' },
  { symbol: 'BK', name: 'The Bank of New York Mellon Corporation' },
  { symbol: 'WDAY', name: 'Workday Inc.' },
  { symbol: 'ZTS', name: 'Zoetis Inc.' },
  { symbol: 'MSCI', name: 'MSCI Inc.' },
  { symbol: 'EL', name: 'The Estée Lauder Companies Inc.' },
  { symbol: 'KVUE', name: 'Kenvue Inc.' },
  { symbol: 'ANSS', name: 'ANSYS Inc.' },
  { symbol: 'MAR', name: 'Marriott International Inc.' },
  { symbol: 'MCK', name: 'McKesson Corporation' },
  { symbol: 'CVS', name: 'CVS Health Corporation' },
  { symbol: 'OTIS', name: 'Otis Worldwide Corporation' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.' },
  { symbol: 'O', name: 'Realty Income Corporation' },
  { symbol: 'SPG', name: 'Simon Property Group Inc.' },
  { symbol: 'CHTR', name: 'Charter Communications Inc.' },
  { symbol: 'NKE', name: 'NIKE Inc.' }
];

// 本地中文名称字典
const localChineseNames = {
  'AAPL': '苹果公司',
  'MSFT': '微软公司',
  'GOOGL': '谷歌',
  'GOOG': '谷歌',
  'TSLA': '特斯拉',
  'NVDA': '英伟达',
  'AMZN': '亚马逊',
  'BRK.B': '伯克希尔哈撒韦',
  'META': 'Meta',
  'NFLX': '奈飞',
  'JPM': '摩根大通',
  'JNJ': '强生',
  'V': 'Visa',
  'PG': '宝洁',
  'UNH': '联合健康',
  'HD': '家得宝',
  'MA': '万事达卡',
  'BAC': '美国银行',
  'XOM': '埃克森美孚',
  'BLK': '贝莱德公司',
  'AXP': '美国运通',
  'ORCL': '甲骨文公司',
  'WMT': '沃尔玛',
  'KO': '可口可乐',
  'ADBE': 'Adobe',
  'DIS': '迪士尼',
  'CRM': 'Salesforce',
  'COST': '好市多',
  'ABBV': '艾伯维',
  'CVX': '雪佛龙',
  'LIN': '林德集团',
  'TMO': '赛默飞世尔',
  'PEP': '百事可乐',
  'MRK': '默克',
  'ACN': '埃森哲',
  'NOW': 'ServiceNow',
  'CSCO': '思科',
  'IBM': 'IBM',
  'GE': '通用电气',
  'CAT': '卡特彼勒',
  'INTU': 'Intuit',
  'TXN': '德州仪器',
  'QCOM': '高通',
  'VZ': '威瑞森',
  'CMCSA': '康卡斯特',
  'AMAT': '应用材料',
  'HON': '霍尼韦尔',
  'AMGN': '安进',
  'T': 'AT&T',
  'LOW': '劳氏',
  'BKNG': 'Booking Holdings',
  'UPS': '联合包裹',
  'SPGI': '标普全球',
  'LRCX': '泛林集团',
  'DE': '迪尔公司',
  'GS': '高盛',
  'SYK': '史赛克',
  'MDT': '美敦力',
  'TJX': 'TJX公司',
  'VRTX': 'Vertex制药',
  'SCHW': '嘉信理财',
  'PLD': '普洛斯',
  'ADI': '亚德诺',
  'PANW': 'Palo Alto Networks',
  'ANET': 'Arista Networks',
  'C': '花旗集团',
  'MU': '美光科技',
  'CB': '安达保险',
  'FI': 'Fiserv',
  'GILD': '吉利德科学',
  'SO': '南方公司',
  'KLAC': 'KLA',
  'PYPL': 'PayPal',
  'CME': '芝商所',
  'EQIX': 'Equinix',
  'SNPS': '新思科技',
  'CDNS': 'Cadence',
  'USB': '美国合众银行',
  'REGN': 'Regeneron制药',
  'PNC': 'PNC金融',
  'AON': '怡安集团',
  'APH': '安费诺',
  'CL': '高露洁',
  'CRWD': 'CrowdStrike',
  'MMC': '威达信集团',
  'CSX': 'CSX运输',
  'FTNT': 'Fortinet',
  'ECL': '艺康',
  'WM': '废物管理',
  'ITW': '伊利诺伊工具',
  'WELL': 'Welltower',
  'SHW': '宣伟',
  'FCX': '自由港',
  'BSX': '波士顿科学',
  'MCO': '穆迪',
  'CARR': '开利',
  'ICE': '洲际交易所',
  'CMG': 'Chipotle',
  'PCAR': 'PACCAR',
  'MSI': '摩托罗拉解决方案',
  'DUK': '杜克能源',
  'TDG': 'TransDigm',
  'TT': '特灵科技',
  'EMR': '艾默生电气',
  'COF': '第一资本',
  'NSC': '诺福克南方',
  'SLB': 'SLB',
  'GD': '通用动力',
  'CPRT': 'Copart',
  'ORLY': "O'Reilly汽车",
  'EOG': 'EOG资源',
  'WFC': '富国银行',
  'NOC': '诺斯罗普格鲁曼',
  'RSG': 'Republic Services',
  'FAST': 'Fastenal',
  'FICO': 'Fair Isaac',
  'ROP': 'Roper Technologies',
  'KMB': '金佰利',
  'DHR': '丹纳赫',
  'PAYX': 'Paychex',
  'CTAS': 'Cintas',
  'ODFL': 'Old Dominion',
  'EA': '艺电',
  'URI': 'United Rentals',
  'MLM': 'Martin Marietta',
  'VMC': 'Vulcan Materials',
  'CTSH': '高知特',
  'LULU': 'Lululemon',
  'NXPI': '恩智浦',
  'DXCM': 'DexCom',
  'HCA': 'HCA医疗',
  'VRSK': 'Verisk Analytics',
  'EXC': 'Exelon',
  'IDXX': 'IDEXX实验室',
  'A': '安捷伦',
  'IQV': 'IQVIA',
  'KHC': '卡夫亨氏',
  'GWW': 'W.W. Grainger',
  'MPWR': 'Monolithic Power',
  'TTWO': 'Take-Two Interactive',
  'XEL': 'Xcel Energy',
  'AEP': '美国电力',
  'ADSK': 'Autodesk',
  'MNST': '怪物饮料',
  'EW': 'Edwards Lifesciences',
  'PSA': 'Public Storage',
  'FANG': 'Diamondback Energy',
  'ROST': 'Ross Stores',
  'YUM': '百胜餐饮',
  'CTVA': 'Corteva',
  'DOW': '陶氏',
  'GEHC': 'GE医疗',
  'KMI': 'Kinder Morgan',
  'HLT': '希尔顿',
  'CSGP': 'CoStar Group',
  'AMP': 'Ameriprise Financial',
  'BDX': 'BD',
  'ALL': 'Allstate',
  'MCHP': 'Microchip Technology',
  'CCI': 'Crown Castle',
  'TEAM': 'Atlassian',
  'AJG': 'Arthur J. Gallagher',
  'BIIB': '百健',
  'CMI': '康明斯',
  'TEL': 'TE Connectivity',
  'TROW': 'T. Rowe Price',
  'SBUX': '星巴克',
  'AFL': 'Aflac',
  'AZO': 'AutoZone',
  'MCD': '麦当劳',
  'GRMN': 'Garmin',
  'TRV': '旅行者保险',
  'AIG': '美国国际集团',
  'BK': '纽约梅隆银行',
  'WDAY': 'Workday',
  'ZTS': 'Zoetis',
  'MSCI': 'MSCI',
  'EL': '雅诗兰黛',
  'KVUE': 'Kenvue',
  'ANSS': 'ANSYS',
  'MAR': '万豪国际',
  'MCK': 'McKesson',
  'CVS': 'CVS Health',
  'OTIS': '奥的斯',
  'TMUS': 'T-Mobile',
  'O': 'Realty Income',
  'SPG': 'Simon Property',
  'CHTR': 'Charter Communications',
  'NKE': '耐克'
};

// 火山引擎翻译函数
async function translateWithVolcEngine(text, accessKeyId, secretAccessKey, targetLang = 'zh') {
  const service = 'translate';
  const version = '2020-06-01';
  const action = 'TranslateText';
  const region = 'cn-north-1';
  const host = 'translate.volcengineapi.com';
  
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10).replace(/-/g, '');
  
  const payload = JSON.stringify({
    TargetLanguage: targetLang,
    TextList: [text]
  });
  
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = [
    'POST',
    '/',
    '',
    `content-type:application/json`,
    `host:${host}`,
    `x-date:${new Date(timestamp * 1000).toISOString().replace(/[:\-]|\..*/g, '')}`,
    '',
    'content-type;host;x-date',
    payloadHash
  ].join('\n');
  
  const credentialScope = `${date}/${region}/${service}/request`;
  const stringToSign = [
    'HMAC-SHA256',
    timestamp,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  const kDate = crypto.createHmac('sha256', secretAccessKey).update(date).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  
  const authorization = `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=content-type;host;x-date, Signature=${signature}`;
  
  const response = await fetch(`https://${host}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': host,
      'X-Date': new Date(timestamp * 1000).toISOString().replace(/[:\-]|\..*/g, ''),
      'Authorization': authorization
    },
    body: payload
  });
  
  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }
  
  const result = await response.json();
  return result.TranslationList?.[0]?.Translation || text;
}

export default async function handler(request, response) {
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    const { method, query } = request;
    
    if (method === 'GET') {
      const { symbol, with_chinese } = query;
      
      if (symbol) {
        // 查询单个股票的中文名称
        const company = SP500_COMPANIES.find(c => c.symbol === symbol.toUpperCase());
        
        if (company) {
          // 首先检查本地字典
          const chineseName = localChineseNames[symbol.toUpperCase()];
          
          if (chineseName) {
            return response.status(200).json({
              success: true,
              symbol: symbol.toUpperCase(),
              chinese_name: chineseName,
              source: 'sp500_local'
            });
          }
          
          // 如果本地字典没有，返回英文名称
          return response.status(200).json({
            success: true,
            symbol: symbol.toUpperCase(),
            chinese_name: company.name,
            source: 'sp500_english'
          });
        } else {
          return response.status(404).json({
            success: false,
            error: 'Stock not found in S&P 500'
          });
        }
      } else {
        // 返回所有公司列表
        if (with_chinese === 'true') {
          // 返回包含中文名称的完整列表
          const companiesWithChinese = SP500_COMPANIES.map(company => ({
            ...company,
            chinese_name: localChineseNames[company.symbol] || company.name
          }));
          return response.status(200).json(companiesWithChinese);
        } else {
          // 返回基本列表
          return response.status(200).json(SP500_COMPANIES);
        }
      }
    }
    
    if (method === 'POST') {
      // 处理翻译请求
      const { company_name } = request.body;
      
      if (!company_name) {
        return response.status(400).json({
          success: false,
          error: 'Company name is required'
        });
      }
      
      try {
        const accessKeyId = process.env.VOLC_ACCESS_KEY_ID;
        const secretAccessKey = process.env.VOLC_SECRET_ACCESS_KEY;
        
        if (!accessKeyId || !secretAccessKey) {
          throw new Error('Translation service not configured');
        }
        
        const translatedName = await translateWithVolcEngine(
          company_name,
          accessKeyId,
          secretAccessKey,
          'zh'
        );
        
        return response.status(200).json({
          success: true,
          original_name: company_name,
          chinese_name: translatedName,
          source: 'volc_translate'
        });
      } catch (error) {
        console.error('Translation error:', error);
        return response.status(200).json({
          success: true,
          original_name: company_name,
          chinese_name: company_name,
          source: 'fallback'
        });
      }
    }
    
    return response.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}