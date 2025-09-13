// /api/translate.js - 火山引擎翻译API
import crypto from 'crypto';

// 火山引擎翻译函数
async function translateWithVolcEngine(text, accessKeyId, secretAccessKey, targetLang = 'zh') {
  const host = 'translate.volcengineapi.com';
  const service = 'translate';
  const region = 'cn-north-1';
  const action = 'TranslateText';
  const version = '2020-06-01';
  
  // 构建请求体
  const body = JSON.stringify({
    TargetLanguage: targetLang,
    TextList: [text]
  });
  
  // 生成时间戳 - 使用正确的AWS V4格式
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000);
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const dateTime = now.toISOString().replace(/[:\-]|\..*/g, '').slice(0, 15) + 'Z';
  
  // 构建请求头
  const headers = {
    'Content-Type': 'application/json',
    'Host': host,
    'X-Date': dateTime,
    'X-Content-Sha256': crypto.createHash('sha256').update(body).digest('hex')
  };
  
  // 构建签名
  const credentialScope = `${date}/${region}/${service}/request`;
  const algorithm = 'HMAC-SHA256';
  
  // 构建规范请求
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n');
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
  
  const canonicalRequest = [
    'POST',
    '/',
    `Action=${action}&Version=${version}`,
    canonicalHeaders,
    '',
    signedHeaders,
    headers['X-Content-Sha256']
  ].join('\n');
  
  // 构建待签名字符串
  const stringToSign = [
    algorithm,
    dateTime,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  // 计算签名 - 使用正确的AWS V4签名算法
  const kDate = crypto.createHmac('sha256', secretAccessKey).update(date).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  
  console.log('Debug - Date:', date);
  console.log('Debug - DateTime:', dateTime);
  console.log('Debug - StringToSign:', stringToSign);
  
  // 构建授权头
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  headers['Authorization'] = authorization;
  
  try {
    const response = await fetch(`https://${host}/?Action=${action}&Version=${version}`, {
      method: 'POST',
      headers,
      body
    });
    
    const responseText = await response.text();
    console.log('Volcengine API Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
    }
    
    const result = JSON.parse(responseText);
    
    if (result.ResponseMetadata?.Error) {
      throw new Error(`Volcengine API Error: ${result.ResponseMetadata.Error.Message}`);
    }
    
    if (result.TranslationList && result.TranslationList[0] && result.TranslationList[0].Translation) {
      return result.TranslationList[0].Translation;
    }
    
    throw new Error("Volcengine API returned an unexpected format");
  } catch (error) {
    console.error("Volcengine translator failed:", error.message || error);
    throw error;
  }
}

// 标普500公司中文名称映射（与sp500-companies.js保持一致）
const SP500_CHINESE_NAMES = {
  'AAPL': '苹果公司',
  'MSFT': '微软公司',
  'GOOGL': '谷歌',
  'GOOG': '谷歌',
  'AMZN': '亚马逊',
  'TSLA': '特斯拉',
  'META': 'Meta Platforms',
  'NVDA': '英伟达',
  'BRK.B': '伯克希尔·哈撒韦',
  'JPM': '摩根大通',
  'JNJ': '强生',
  'V': 'Visa',
  'PG': '宝洁',
  'UNH': '联合健康',
  'HD': '家得宝',
  'MA': '万事达卡',
  'BAC': '美国银行',
  'ABBV': '艾伯维公司',
  'PFE': '辉瑞',
  'KO': '可口可乐',
  'AVGO': '博通',
  'PEP': '百事可乐',
  'TMO': '赛默飞世尔',
  'COST': '好市多',
  'DIS': '迪士尼',
  'ABT': '雅培公司',
  'ACN': '埃森哲',
  'ADBE': 'Adobe',
  'MRK': '默克',
  'LLY': '礼来公司',
  'NFLX': '奈飞',
  'VZ': '威瑞森',
  'CRM': 'Salesforce',
  'NKE': '耐克',
  'CMCSA': '康卡斯特',
  'INTC': '英特尔',
  'T': 'AT&T',
  'AMD': '超威半导体',
  'TXN': '德州仪器',
  'QCOM': '高通',
  'HON': '霍尼韦尔',
  'UPS': '联合包裹',
  'LOW': '劳氏',
  'SBUX': '星巴克',
  'LMT': '洛克希德马丁',
  'AXP': '美国运通',
  'SPGI': '标普全球',
  'BLK': '贝莱德',
  'CAT': '卡特彼勒',
  'GE': '通用电气',
  'MDT': '美敦力',
  'ADP': 'ADP',
  'GILD': '吉利德科学',
  'CVS': 'CVS Health',
  'MMM': '3M公司',
  'MO': '奥驰亚集团',
  'USB': '美国合众银行',
  'BA': '波音公司',
  'PYPL': 'PayPal',
  'TGT': '塔吉特',
  'MDLZ': '亿滋国际',
  'ISRG': 'Intuitive Surgical',
  'SO': '南方公司',
  'ZTS': 'Zoetis',
  'CI': '信诺',
  'NOW': 'ServiceNow',
  'REGN': 'Regeneron制药',
  'DUK': '杜克能源',
  'PLD': '普洛斯',
  'SYK': '史赛克',
  'CL': '高露洁',
  'BSX': '波士顿科学',
  'ITW': '伊利诺伊工具',
  'MMC': '威达信集团',
  'EOG': 'EOG Resources',
  'CSX': 'CSX',
  'FCX': '自由港',
  'NSC': '诺福克南方',
  'GM': '通用汽车',
  'WM': '废物管理',
  'TJX': 'TJX公司',
  'PNC': 'PNC金融',
  'EMR': '艾默生电气',
  'AON': '怡安',
  'SLB': 'SLB',
  'GD': '通用动力',
  'HUM': 'Humana',
  'ORLY': "O'Reilly汽车",
  'APD': '空气化工产品',
  'COP': '康菲石油',
  'MRK': '默克公司',
  'ABBV': '艾伯维公司',
  'LLY': '礼来公司',
  'TMO': '赛默飞世尔',
  'ABT': '雅培公司',
  'MDT': '美敦力公司',
  'DHR': '丹纳赫公司',
  'BMY': '百时美施贵宝',
  'AMGN': '安进公司',
  'GILD': '吉利德科学',
  'COST': '好市多',
  'TGT': '塔吉特公司',
  'LOW': '劳氏公司',
  'SBUX': '星巴克公司',
  'MCD': '麦当劳公司',
  'NKE': '耐克公司',
  'UPS': '联合包裹',
  'FDX': '联邦快递',
  'HON': '霍尼韦尔',
  'LMT': '洛克希德马丁',
  'RTX': '雷神技术',
  'NOC': '诺斯罗普格鲁曼'
};

// 关键词替换函数 - 确保翻译后的文本中公司名称与页首显示一致
function replaceCompanyNamesInTranslation(translatedText) {
  if (!translatedText) return translatedText;
  
  let result = translatedText;
  
  // 替换公司名称的各种可能翻译
  const replacements = {
    // 苹果相关
    '苹果': '苹果公司',
    'Apple': '苹果公司',
    '苹果Inc': '苹果公司',
    '苹果公司Inc': '苹果公司',
    
    // 微软相关
    '微软': '微软公司',
    'Microsoft': '微软公司',
    '微软Inc': '微软公司',
    '微软公司Inc': '微软公司',
    
    // 谷歌相关
    'Google': '谷歌',
    'Alphabet': '谷歌',
    '字母表': '谷歌',
    '谷歌公司': '谷歌',
    
    // 亚马逊相关
    'Amazon': '亚马逊',
    '亚马逊公司': '亚马逊',
    
    // 特斯拉相关
    'Tesla': '特斯拉',
    '特斯拉公司': '特斯拉',
    
    // Meta相关
    'Facebook': 'Meta Platforms',
    '脸书': 'Meta Platforms',
    'Meta': 'Meta Platforms',
    
    // 英伟达相关
    'Nvidia': '英伟达',
    'NVIDIA': '英伟达',
    '英伟达公司': '英伟达',
    
    // 其他主要公司
    'JPMorgan': '摩根大通',
    'JP摩根': '摩根大通',
    '摩根大通银行': '摩根大通',
    'Johnson & Johnson': '强生',
    '强生公司': '强生',
    'Visa Inc': 'Visa',
    'Mastercard': '万事达卡',
    '万事达': '万事达卡',
    'Berkshire Hathaway': '伯克希尔·哈撒韦',
    '伯克希尔哈撒韦': '伯克希尔·哈撒韦',
    'UnitedHealth': '联合健康',
    '联合健康集团': '联合健康',
    'Home Depot': '家得宝',
    '家得宝公司': '家得宝',
    'Procter & Gamble': '宝洁',
    '宝洁公司': '宝洁',
    'Bank of America': '美国银行',
    '美国银行公司': '美国银行',
    'AbbVie': '艾伯维公司',
    '艾伯维': '艾伯维公司',
    'Pfizer': '辉瑞',
    '辉瑞公司': '辉瑞',
    'Coca-Cola': '可口可乐',
    '可口可乐公司': '可口可乐',
    'PepsiCo': '百事可乐',
    '百事公司': '百事可乐',
    'Costco': '好市多',
    '好市多公司': '好市多',
    'Disney': '迪士尼',
    '迪斯尼': '迪士尼',
    '华特迪士尼': '迪士尼',
    'Abbott': '雅培公司',
    '雅培': '雅培公司',
    'Accenture': '埃森哲',
    '埃森哲公司': '埃森哲',
    'Merck': '默克',
    '默沙东': '默克',
    '默克公司': '默克',
    'Eli Lilly': '礼来公司',
    '礼来': '礼来公司',
    'Netflix': '奈飞',
    '网飞': '奈飞',
    'Verizon': '威瑞森',
    '威瑞森通信': '威瑞森',
    'Nike': '耐克',
    '耐克公司': '耐克',
    'Comcast': '康卡斯特',
    '康卡斯特公司': '康卡斯特',
    'Intel': '英特尔',
    '英特尔公司': '英特尔',
    'AMD': '超威半导体',
    '超微半导体': '超威半导体',
    'Advanced Micro Devices': '超威半导体',
    'Texas Instruments': '德州仪器',
    '德仪': '德州仪器',
    'Qualcomm': '高通',
    '高通公司': '高通',
    'Honeywell': '霍尼韦尔',
    '霍尼韦尔公司': '霍尼韦尔',
    'UPS': '联合包裹',
    '联合包裹服务': '联合包裹',
    "Lowe's": '劳氏',
    '劳氏公司': '劳氏',
    'Starbucks': '星巴克',
    '星巴克公司': '星巴克',
    'Lockheed Martin': '洛克希德马丁',
    '洛克希德·马丁': '洛克希德马丁',
    'American Express': '美国运通',
    '美国运通公司': '美国运通',
    'S&P Global': '标普全球',
    '标准普尔全球': '标普全球',
    'BlackRock': '贝莱德',
    '贝莱德公司': '贝莱德',
    'Caterpillar': '卡特彼勒',
    '卡特彼勒公司': '卡特彼勒',
    'General Electric': '通用电气',
    'GE': '通用电气',
    'Medtronic': '美敦力',
    '美敦力公司': '美敦力'
  };
  
  // 执行替换
  Object.entries(replacements).forEach(([original, replacement]) => {
    const regex = new RegExp(original, 'gi');
    result = result.replace(regex, replacement);
  });
  
  return result;
}

// API 主处理函数
export default async function handler(request, response) {
  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { text, targetLang = 'zh' } = request.body;
  
  if (!text || text.trim() === '') {
    return response.status(400).json({ error: 'Text is required' });
  }

  // 获取火山引擎环境变量
  const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
  const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;

  if (!VOLC_AK || !VOLC_SK) {
    return response.status(500).json({ error: 'Volcengine credentials are not configured' });
  }

  try {
    let translatedText = await translateWithVolcEngine(text, VOLC_AK, VOLC_SK, targetLang);
    
    // 如果是中文翻译，进行关键词替换以确保公司名称一致性
    if (targetLang === 'zh' && translatedText) {
      translatedText = replaceCompanyNamesInTranslation(translatedText);
    }
    
    // 设置响应头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    
    response.status(200).json({ 
      translatedText,
      originalText: text,
      targetLanguage: targetLang,
      success: true
    });
  } catch (error) {
    console.error('Translation API Error:', error.message);
    response.status(500).json({ 
      error: 'Translation failed',
      message: error.message,
      success: false
    });
  }
}