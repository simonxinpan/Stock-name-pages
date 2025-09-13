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
                
                // 更智能的内容提取策略 - 针对雅虎财经优化
                let extractedContent = '';
                
                // 雅虎财经特定选择器
                const yahooSelectors = [
                    // 雅虎财经文章主体
                    /<div[^>]*class="[^"]*caas-body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<div[^>]*class="[^"]*ArticleBody[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<div[^>]*data-module="ArticleBody"[^>]*>([\s\S]*?)<\/div>/gi,
                    // 通用文章选择器
                    /<article[^>]*>([\s\S]*?)<\/article>/gi,
                    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<div[^>]*class="[^"]*story[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
                    /<main[^>]*>([\s\S]*?)<\/main>/gi
                ];
                
                // 尝试使用雅虎财经特定选择器
                for (const selector of yahooSelectors) {
                    const matches = html.match(selector);
                    if (matches && matches.length > 0) {
                        // 取最长的匹配内容
                        extractedContent = matches.reduce((longest, current) => 
                            current.length > longest.length ? current : longest, '');
                        if (extractedContent.length > 200) { // 确保内容足够长
                            break;
                        }
                    }
                }
                
                // 如果没有找到文章容器，智能提取段落
                if (!extractedContent || extractedContent.length < 200) {
                    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
                    if (paragraphs && paragraphs.length > 0) {
                        // 过滤掉太短的段落，取前15个有意义的段落
                        const meaningfulParagraphs = paragraphs
                            .filter(p => {
                                const text = p.replace(/<[^>]*>/g, '').trim();
                                return text.length > 20; // 过滤掉太短的段落
                            })
                            .slice(0, 15);
                        extractedContent = meaningfulParagraphs.join(' ');
                    }
                }
                
                // 清理HTML标签并提取纯文本 - 优化版
                if (extractedContent) {
                    content = extractedContent
                        // 移除不需要的元素
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
                        .replace(/<header[\s\S]*?<\/header>/gi, '')
                        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
                        .replace(/<aside[\s\S]*?<\/aside>/gi, '')
                        .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                        .replace(/<div[^>]*class="[^"]*advertisement[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                        // 保留段落结构，将某些标签转换为换行
                        .replace(/<\/p>/gi, '\n\n')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<\/div>/gi, '\n')
                        .replace(/<\/h[1-6]>/gi, '\n\n')
                        .replace(/<\/li>/gi, '\n')
                        // 移除所有剩余的HTML标签
                        .replace(/<[^>]*>/g, '')
                        // 处理HTML实体
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/&ldquo;/g, '"')
                        .replace(/&rdquo;/g, '"')
                        .replace(/&lsquo;/g, "'")
                        .replace(/&rsquo;/g, "'")
                        .replace(/&mdash;/g, '—')
                        .replace(/&ndash;/g, '–')
                        // 清理多余的空白字符
                        .replace(/\n\s*\n\s*\n/g, '\n\n') // 合并多个换行
                        .replace(/[ \t]+/g, ' ') // 合并多个空格和制表符
                        .replace(/^\s+|\s+$/gm, '') // 移除每行首尾空格
                        .trim();
                    
                    // 移除过短的行（可能是导航或广告文本）
                    const lines = content.split('\n').filter(line => {
                        const trimmed = line.trim();
                        return trimmed.length > 10 && 
                               !trimmed.match(/^(Home|News|Sports|Finance|Entertainment|More|Subscribe|Sign in|Log in|Menu|Search)$/i);
                    });
                    content = lines.join('\n');
                    
                    // 限制内容长度，避免翻译API超时
                    if (content.length > 4000) {
                        // 按段落截取，保持完整性
                        const paragraphs = content.split('\n\n');
                        let truncatedContent = '';
                        for (const paragraph of paragraphs) {
                            if ((truncatedContent + paragraph).length > 4000) break;
                            truncatedContent += paragraph + '\n\n';
                        }
                        content = truncatedContent.trim() + '\n\n[文章内容较长，已截取主要部分进行翻译]';
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

        // 调用火山引擎翻译 - 逐个翻译以确保关键词替换正确应用
        const translations = [];
        
        for (const text of textsToTranslate) {
            const translateResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    targetLang: 'zh'
                })
            });

            if (!translateResponse.ok) {
                throw new Error(`Translation service error: ${translateResponse.status}`);
            }

            const translateData = await translateResponse.json();
            translations.push(translateData.translatedText || text);
        }

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