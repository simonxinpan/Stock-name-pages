// /api/content.js
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Service } from '@volcengine/openapi';

async function translateWithVolcEngine(texts, ak, sk) {
    if (!texts || texts.length === 0) return [];
    const client = new Service({ host: 'open.volcengineapi.com', serviceName: 'translate', region: 'cn-north-1', accessKeyId: ak, secretAccessKey: sk });
    const fetchApi = client.fetchApi();
    try {
        const res = await fetchApi({ Action: 'TranslateText', Version: '2020-06-01' }, { TargetLanguage: 'zh', TextList: texts });
        if (res.ResponseMetadata?.Error) throw new Error(res.ResponseMetadata.Error.Message);
        return res.TranslationList?.map(item => item.Translation) || texts;
    } catch (error) {
        console.error("Volcengine translation failed:", error);
        return texts;
    }
}

export default async function handler(request, response) {
    const { url, lang } = request.query;
    if (!url) return response.status(400).json({ error: 'URL parameter is required.' });

    const VOLC_AK = process.env.VOLC_ACCESS_KEY_ID;
    const VOLC_SK = process.env.VOLC_SECRET_ACCESS_KEY;

    try {
        const articleResponse = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!articleResponse.ok) throw new Error(`Failed to fetch article with status: ${articleResponse.status}`);
        const html = await articleResponse.text();

        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();
        if (!article || !article.content) throw new Error("Could not extract article content.");

        let finalTitle = article.title;
        let finalContent = article.content;

        if (lang === 'zh' && VOLC_AK && VOLC_SK) {
            finalTitle = await translateWithVolcEngine([article.title], VOLC_AK, VOLC_SK).then(arr => arr[0]);
            const contentDom = new JSDOM(`<div>${article.content}</div>`);
            const walker = contentDom.window.document.createTreeWalker(contentDom.window.document.body, contentDom.window.NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            let node;
            while(node = walker.nextNode()) { if(node.textContent.trim().length > 0) textNodes.push(node); }
            const originalTexts = textNodes.map(node => node.textContent);
            if (originalTexts.length > 0) {
                const translatedTexts = await translateWithVolcEngine(originalTexts, VOLC_AK, VOLC_SK);
                textNodes.forEach((node, i) => { node.textContent = translatedTexts[i] || originalTexts[i]; });
                finalContent = contentDom.window.document.body.innerHTML;
            }
        }
        response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.status(200).json({ title: finalTitle, content: finalContent, author: article.byline, siteName: article.siteName });
    } catch (error) {
        console.error("API /content Error:", error);
        response.status(500).json({ error: 'Failed to process article.' });
    }
}