// /api/news/content.js
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Service } from '@volcengine/openapi';

// --- 火山引擎翻译引擎 ---
async function translateWithVolcEngine(text, accessKeyId, secretAccessKey) {
    if (!text || text.trim() === '') return { title: '', content: '' };
    // (这里的翻译逻辑和 news.js 里的一样，但为了独立，我们复制过来)
    const client = new Service({ host: 'open.volcengineapi.com', serviceName: 'translate', region: 'cn-north-1', accessKeyId, secretAccessKey });
    const fetchApi = client.fetchApi();
    const body = { TargetLanguage: 'zh', TextList: [text] };
    const params = { Action: 'TranslateText', Version: '2020-06-01' };
    
    try {
        const res = await fetchApi(params, body);
        if (res.ResponseMetadata?.Error) throw new Error(res.ResponseMetadata.Error.Message);
        return res.TranslationList?.[0]?.Translation || text;
    } catch (error) {
        console.error("Volcengine translation failed:", error);
        return text; // 翻译失败则返回原文
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
        // 1. 抓取目标网页的 HTML
        const articleResponse = await fetch(url);
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

        let translatedTitle = article.title;
        let translatedContent = article.content; // 包含 HTML 标签的内容

        // 3. 如果请求中文，则进行翻译
        if (lang === 'zh' && VOLC_AK && VOLC_SK) {
            console.log("Translating full article content...");
            // 为避免翻译 HTML 标签，我们只翻译文本内容
            // 创建一个新的 DOM 来操作，只翻译文本节点
            const contentDom = new JSDOM(`<div>${article.content}</div>`);
            const allTextNodes = [];
            
            function getTextNodes(node) {
                if (node.nodeType === 3 && node.textContent.trim() !== '') { // Node.TEXT_NODE
                    allTextNodes.push(node);
                } else {
                    for (const child of node.childNodes) {
                        getTextNodes(child);
                    }
                }
            }
            getTextNodes(contentDom.window.document.querySelector('div'));
            
            // 批量翻译所有文本节点的内容
            const originalTexts = allTextNodes.map(node => node.textContent);
            const translatedTexts = await translateWithVolcEngine(originalTexts.join('\n\n'), VOLC_AK, VOLC_SK).then(t => t.split('\n\n'));
            
            // 将翻译后的文本替换回 DOM
            if (originalTexts.length === translatedTexts.length) {
                allTextNodes.forEach((node, i) => {
                    node.textContent = translatedTexts[i];
                });
            }

            translatedContent = contentDom.window.document.querySelector('div').innerHTML;
            translatedTitle = await translateWithVolcEngine(article.title, VOLC_AK, VOLC_SK);
        }

        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        response.status(200).json({ 
            title: translatedTitle, 
            content: translatedContent,
            author: article.byline,
            siteName: article.siteName
        });

    } catch (error) {
        console.error("API /news/content Error:", error);
        response.status(500).json({ error: 'Failed to process article.' });
    }
}