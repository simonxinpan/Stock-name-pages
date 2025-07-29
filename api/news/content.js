// API路由: /api/news/content
// 获取新闻文章内容并翻译

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
    // 简化实现：返回基本的文章信息
    const articleData = {
      title: 'Article Content',
      content: '<p>This is a simplified news content API. Full article parsing and translation functionality can be implemented here.</p>',
      author: 'News Source',
      siteName: 'Financial News'
    };
    
    // 如果需要中文翻译
    if (lang === 'zh') {
      articleData.title = '文章内容';
      articleData.content = '<p>这是一个简化的新闻内容API。完整的文章解析和翻译功能可以在这里实现。</p>';
      articleData.author = '新闻来源';
      articleData.siteName = '财经新闻';
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