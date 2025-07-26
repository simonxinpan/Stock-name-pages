const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>测试服务器</title>
        <meta charset="utf-8">
    </head>
    <body>
        <h1>🎉 服务器运行成功！</h1>
        <p>当前时间: ${new Date().toLocaleString('zh-CN')}</p>
        <p>服务器端口: 4000</p>
        <p>网络状态: 正常</p>
        <script>
            console.log('页面加载成功');
            document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            document.body.style.color = 'white';
            document.body.style.fontFamily = 'Arial, sans-serif';
            document.body.style.textAlign = 'center';
            document.body.style.padding = '50px';
        </script>
    </body>
    </html>
  `);
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================`);
  console.log(`🚀 测试服务器启动成功!`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`=================================\n`);
});

server.on('error', (err) => {
  console.error('服务器错误:', err);
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});