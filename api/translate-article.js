// /api/translate-article.js
import fetch from 'node-fetch';
import { load } from 'cheerio';
import { TranslateText } from '@volcengine/vert-sdk';

// --- 火山引擎翻译引擎 (和 news.js 里的类似) ---
async function translateWithVolcEngine(text, accessKeyId, secretAccessKey) {
  if (!text || text.trim() === '') return '';
  const client = new TranslateText({ accessKeyId, secretAccessKey });
  try {
    const res = await client.translate({
      TargetLanguage: 'zh',
      TextList: [text],
    });
    if (res.TranslationList?.[0]?.Translation) {
      return res.TranslationList[0].Translation;
    }
    throw new Error("Volcengine API returned invalid format");
  } catch (error) {
    console.error("Volcengine translator failed:", error);
    return text; // 翻译失败则返回原文
  }
}

// --- API 主处理函数 ---
export default async function handler(request, response) {
  // 我们使用 POST 方法来接收 URL，更标准
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { articleUrl } = request.body;
  if (!articleUrl) {
    return response.status(400).json({ error: 'articleUrl is required' });
  }
  
  const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
  const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;
  if (!VOLC_AK || !VOLC_SK) {
    return response.status(500).json({ error: 'Translation service is not configured.' });
  }

  try {
    // 1. 在服务器端抓取文章 HTML
    const articleResponse = await fetch(articleUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    if (!articleResponse.ok) {
      throw new Error(`Failed to fetch article: ${articleResponse.statusText}`);
    }
    const html = await articleResponse.text();

    // 2. 使用 Cheerio 解析 HTML 并提取正文
    const $ = load(html);
    // 这是一个针对 Yahoo Finance 的选择器，可能需要为其他新闻网站进行调整
    const articleBody = $('div.caas-body').text(); 
    
    if (!articleBody || articleBody.trim() === '') {
        throw new Error('Could not extract article content.');
    }

    // 3. 调用火山引擎翻译提取出的正文
    const translatedText = await translateWithVolcEngine(articleBody, VOLC_AK, VOLC_SK);

    // 4. 返回翻译结果
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json({ translatedText });

  } catch (error) {
    console.error('Article translation API error:', error);
    response.status(500).json({ error: `Failed to translate article: ${error.message}` });
  }
}