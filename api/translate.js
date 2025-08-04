// /api/translate.js
import { Service } from '@volcengine/openapi';

export default async function handler(request, response) {
  // 我们期望前端通过 POST 请求发送要翻译的文本
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, target_lang } = request.body;
  if (!text) {
    return response.status(400).json({ error: 'Parameter "text" is required.' });
  }
  
  const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
  const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;
  if (!VOLC_AK || !VOLC_SK) {
    return response.status(500).json({ error: 'Volcengine API keys are not configured.' });
  }

  try {
    const client = new Service({
      host: 'open.volcengineapi.com',
      serviceName: 'translate',
      region: 'cn-north-1',
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
    });
    const fetchApi = client.fetchApi();
    
    const res = await fetchApi(
        { Action: 'TranslateText', Version: '2020-06-01' }, 
        { TargetLanguage: target_lang || 'zh', TextList: [text] }
    );

    if (res.ResponseMetadata?.Error) {
      throw new Error(`Volcengine API Error: ${res.ResponseMetadata.Error.Message}`);
    }
    
    if (res.TranslationList && res.TranslationList[0] && res.TranslationList[0].Translation) {
      const translatedText = res.TranslationList[0].Translation;
      console.log(`Successfully translated "${text}" to "${translatedText}"`);
      response.status(200).json({ translated_text: translatedText });
    } else {
      throw new Error("Volcengine API returned an unexpected format");
    }

  } catch (error) {
    console.error("API /translate Error:", error);
    response.status(500).json({ error: 'Translation failed.' });
  }
}