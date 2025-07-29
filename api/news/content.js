// API路由: /api/news/content
// 获取新闻文章内容并翻译

import { JSDOM } from 'jsdom';

// 翻译API调用频率控制
let lastTranslationCall = 0;
const TRANSLATION_DELAY = 2000; // 2秒间隔

export default async function handler(req, res) {
  const { url, lang } = req.query;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  if (!url) {
    res.status(400).json({ error: 'URL parameter is required' });
    return;
  }
  
  try {
    // 获取文章内容
    const articleData = await fetchArticleContent(url);
    
    // 如果需要中文翻译
    if (lang === 'zh' && articleData.content) {
      try {
        // 控制翻译API调用频率
        const now = Date.now();
        if (now - lastTranslationCall < TRANSLATION_DELAY) {
          const waitTime = TRANSLATION_DELAY - (now - lastTranslationCall);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        lastTranslationCall = Date.now();
        
        const translatedContent = await translateToChineseWithVolcano(articleData.content);
        const translatedTitle = await translateToChineseWithVolcano(articleData.title);
        
        articleData.title = translatedTitle || articleData.title;
        articleData.content = translatedContent || articleData.content;
      } catch (translateError) {
        console.warn('Translation failed, using original content:', translateError);
      }
    }
    
    res.status(200).json(articleData);
    
  } catch (error) {
    console.error('News content API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch article content',
      message: error.message 
    });
  }
}

// 获取文章内容
async function fetchArticleContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // 提取标题
    let title = document.querySelector('title')?.textContent ||
                document.querySelector('h1')?.textContent ||
                'Article Title';
    
    // 提取内容
    let content = '';
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      'main',
      '.main-content'
    ];
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // 移除脚本和样式标签
        element.querySelectorAll('script, style, nav, header, footer, .advertisement, .ads').forEach(el => el.remove());
        content = element.innerHTML;
        break;
      }
    }
    
    // 如果没有找到内容，尝试获取所有段落
    if (!content) {
      const paragraphs = document.querySelectorAll('p');
      content = Array.from(paragraphs)
        .map(p => p.outerHTML)
        .join('');
    }
    
    // 清理内容
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
                    .trim();
    
    return {
      title: title.trim(),
      content: content || '<p>Unable to extract article content</p>',
      author: document.querySelector('[rel="author"], .author, .byline')?.textContent?.trim() || 'Unknown',
      siteName: document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 
                new URL(url).hostname
    };
    
  } catch (error) {
    console.error('Article fetch error:', error);
    return {
      title: 'Error Loading Article',
      content: '<p>Failed to load article content. Please try again later.</p>',
      author: 'Unknown',
      siteName: 'News Source'
    };
  }
}

// 火山引擎翻译函数
async function translateToChineseWithVolcano(text) {
  try {
    // 移除HTML标签进行翻译
    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!plainText || plainText.length < 3) {
      return text;
    }
    
    // 检查是否已经是中文
    if (/[\u4e00-\u9fff]/.test(plainText)) {
      return text;
    }
    
    // 火山引擎翻译API配置
    const volcanoApiKey = process.env.VOLCANO_API_KEY;
    const volcanoApiSecret = process.env.VOLCANO_API_SECRET;
    
    if (!volcanoApiKey || !volcanoApiSecret) {
      console.warn('Volcano translation API credentials not configured');
      return await fallbackTranslation(text);
    }
    
    // 调用火山引擎翻译API
    const translationResponse = await fetch('https://translate.volcengineapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${volcanoApiKey}`
      },
      body: JSON.stringify({
        SourceLanguage: 'en',
        TargetLanguage: 'zh',
        TextList: [plainText.substring(0, 5000)] // 限制长度
      })
    });
    
    if (translationResponse.ok) {
      const result = await translationResponse.json();
      const translatedText = result.TranslationList?.[0]?.Translation;
      
      if (translatedText) {
        // 保持原有的HTML结构，替换文本内容
        return text.replace(/>([^<]+)</g, (match, content) => {
          if (content.trim()) {
            return `>${translatedText}<`;
          }
          return match;
        });
      }
    }
    
    return await fallbackTranslation(text);
    
  } catch (error) {
    console.error('Volcano translation error:', error);
    return await fallbackTranslation(text);
  }
}

// 备用翻译方案
async function fallbackTranslation(text) {
  // 简单的关键词翻译映射
  const translations = {
    'Stock': '股票',
    'Market': '市场',
    'Price': '价格',
    'Trading': '交易',
    'Investment': '投资',
    'Financial': '财务',
    'Company': '公司',
    'Revenue': '营收',
    'Profit': '利润',
    'Earnings': '收益',
    'Analysis': '分析',
    'Report': '报告',
    'News': '新闻',
    'Update': '更新',
    'Growth': '增长',
    'Performance': '表现'
  };
  
  let translatedText = text;
  for (const [en, zh] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translatedText = translatedText.replace(regex, zh);
  }
  
  return translatedText;
}