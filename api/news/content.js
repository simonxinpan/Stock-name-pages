// /api/news/content.js
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Service } from '@volcengine/openapi';

// --- 火山引擎翻译引擎 ---
async function translateWithVolcEngine(texts, accessKeyId, secretAccessKey) {
    if (!texts || texts.length === 0) return [];
    const client = new Service({ host: 'open.volcengineapi.com', serviceName: 'translate', region: 'cn-north-1', accessKeyId, secretAccessKey });
    const fetchApi = client.fetchApi();
    const body = { TargetLanguage: 'zh', TextList: texts };
    const params = { Action: 'TranslateText', Version: '2020-06-01' };
    
    try {
        const res = await fetchApi(params, body);
        if (res.ResponseMetadata?.Error) throw new Error(res.ResponseMetadata.Error.Message);
        return res.TranslationList?.map(item => item.Translation) || texts;
    } catch (error) {
        console.error("Volcengine translation failed:", error);
        return texts; // 翻译失败则返回原文
    }
}

// --- API 主处理函数 ---
export default async function handler(request, response) {
    const { url, lang } = request.query;
    if (!url) {
        return response.status(400).json({ error: 'URL parameter is required.' });
    }

    const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
    const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;

    try {
        // 1. 抓取目标网页 HTML
        const articleResponse = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }); // 添加 User-Agent 避免被屏蔽
        if (!articleResponse.ok) {
            throw new Error(`Failed to fetch article with status: ${articleResponse.status}`);
        }
        const html = await articleResponse.text();

        // 2. 使用 JSDOM 和 Readability 提取正文
        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();

        if (!article || !article.content) {
            throw new Error("Could not extract article content.");
        }

        let finalTitle = article.title;
        let finalContent = article.content;

        // 3. 如果请求中文，则进行翻译
        if (lang === 'zh' && VOLC_AK && VOLC_SK) {
            // 翻译标题
            finalTitle = await translateWithVolcEngine([article.title], VOLC_AK, VOLC_SK).then(arr => arr[0]);

            // 提取所有文本节点进行批量翻译，以保留HTML结构
            const contentDom = new JSDOM(`<div>${article.content}</div>`);
            const walker = contentDom.window.document.createTreeWalker(contentDom.window.document.body, contentDom.window.NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            let node;
            while(node = walker.nextNode()) {
                if(node.textContent.trim().length > 0) textNodes.push(node);
            }
            
            const originalTexts = textNodes.map(node => node.textContent);
            if (originalTexts.length > 0) {
                const translatedTexts = await translateWithVolcEngine(originalTexts, VOLC_AK, VOLC_SK);
                textNodes.forEach((node, i) => {
                    node.textContent = translatedTexts[i] || originalTexts[i];
                });
                finalContent = contentDom.window.document.body.innerHTML;
            }
        }

        response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // 缓存一天
        response.status(200).json({ 
            title: finalTitle, 
            content: finalContent,
            author: article.byline,
            siteName: article.siteName
        });

    } catch (error) {
        console.error("API /news/content Error:", error);
        response.status(500).json({ error: 'Failed to process article.' });
    }
}