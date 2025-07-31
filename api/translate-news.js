export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, title, summary } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // 获取新闻原文内容
        let content = '';
        try {
            const newsResponse = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });
            
            if (newsResponse.ok) {
                const html = await newsResponse.text();
                // 简单的内容提取（实际项目中可能需要更复杂的解析）
                const textMatch = html.match(/<p[^>]*>([^<]+)</p>/gi);
                if (textMatch) {
                    content = textMatch.slice(0, 5).map(p => p.replace(/<[^>]*>/g, '')).join(' ');
                }
            }
        } catch (fetchError) {
            console.log('获取新闻内容失败，使用摘要作为内容:', fetchError.message);
            content = summary || '';
        }

        // 如果没有获取到内容，使用摘要
        if (!content && summary) {
            content = summary;
        }

        // 准备翻译内容
        const textsToTranslate = [];
        if (title) textsToTranslate.push(title);
        if (content) textsToTranslate.push(content);

        if (textsToTranslate.length === 0) {
            return res.status(400).json({ error: 'No content to translate' });
        }

        // 调用火山引擎翻译
        const translateResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                texts: textsToTranslate,
                source: 'en',
                target: 'zh'
            })
        });

        if (!translateResponse.ok) {
            throw new Error(`Translation service error: ${translateResponse.status}`);
        }

        const translateData = await translateResponse.json();
        const translations = translateData.translations || [];

        const result = {
            translatedTitle: title && translations[0] ? translations[0] : title,
            translatedContent: content && translations[title ? 1 : 0] ? translations[title ? 1 : 0] : content,
            originalUrl: url
        };

        res.status(200).json(result);

    } catch (error) {
        console.error('新闻翻译API错误:', error);
        res.status(500).json({ 
            error: 'Translation failed',
            message: error.message 
        });
    }
}