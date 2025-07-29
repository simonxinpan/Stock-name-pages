// /api/translate.js - 火山引擎翻译API
import { Service } from '@volcengine/openapi';

// 火山引擎翻译函数
async function translateWithVolcEngine(text, accessKeyId, secretAccessKey, targetLang = 'zh') {
  // 初始化火山引擎通用服务客户端
  const service = new Service({
    host: 'open.volcengineapi.com',
    serviceName: 'translate',
    region: 'cn-north-1',
    accessKeyId,
    secretAccessKey,
  });
  
  // 获取请求器，SDK会自动处理签名
  const fetchApi = service.fetchApi();
  
  const params = {
    Action: 'TranslateText',
    Version: '2020-06-01',
  };
  
  const body = {
    TargetLanguage: targetLang,
    TextList: [text],
  };

  try {
    // 发起请求
    const res = await fetchApi(params, body);
    
    // 处理返回结果
    if (res.ResponseMetadata?.Error) {
      throw new Error(`Volcengine API Error: ${res.ResponseMetadata.Error.Message}`);
    }
    
    if (res.TranslationList && res.TranslationList[0] && res.TranslationList[0].Translation) {
      return res.TranslationList[0].Translation;
    }
    
    throw new Error("Volcengine API returned an unexpected format");
  } catch (error) {
    console.warn("Volcengine translator failed:", error.message || error);
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