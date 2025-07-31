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
                timeout: 15000
            });
            
            if (newsResponse.ok) {
                const html = await newsResponse.text();
                
                // 更智能的内容提取策略
                let extractedContent = '';
                
                // 尝试提取文章主体内容
                const articleSelectors = [
                    /<article[^>]*>([\s\S]*?)<\/article>/gi,
                    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<div[^>]*class="[^"]*story[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
                ];
                
                for (const selector of articleSelectors) {
                    const match = html.match(selector);
                    if (match && match[0]) {
                        extractedContent = match[0];
                        break;
                    }
                }
                
                // 如果没有找到文章容器，提取所有段落
                if (!extractedContent) {
                    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
                    if (paragraphs && paragraphs.length > 0) {
                        // 取前10个段落，确保获取足够的内容
                        extractedContent = paragraphs.slice(0, 10).join(' ');
                    }
                }
                
                // 清理HTML标签并提取纯文本
                if (extractedContent) {
                    content = extractedContent
                        .replace(/<script[\s\S]*?<\/script>/gi, '') // 移除脚本
                        .replace(/<style[\s\S]*?<\/style>/gi, '') // 移除样式
                        .replace(/<[^>]*>/g, '') // 移除所有HTML标签
                        .replace(/\s+/g, ' ') // 合并多个空格
                        .replace(/&nbsp;/g, ' ') // 替换HTML实体
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .trim();
                    
                    // 限制内容长度，避免翻译API超时
                    if (content.length > 3000) {
                        content = content.substring(0, 3000) + '...';
                    }
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