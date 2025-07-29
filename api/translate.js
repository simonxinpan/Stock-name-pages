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
    const translatedText = await translateWithVolcEngine(text, VOLC_AK, VOLC_SK, targetLang);
    
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