# 实时股票数据页面部署指南

## 📋 项目概述

本项目是一个连接Finnhub API的实时股票详情页面，支持：
- 📈 实时股票报价和价格变动
- 📊 交互式K线图表（多时间周期）
- 🏢 公司基本信息和财务指标
- 📰 相关新闻资讯
- 🌐 中英文双语支持
- 📱 响应式设计

## 🚀 快速部署

### 1. 获取Finnhub API密钥

1. 访问 [Finnhub.io](https://finnhub.io)
2. 点击 "Get free API key" 注册账户
3. 登录后在Dashboard中复制您的API密钥
4. 免费账户限制：每分钟60次请求

### 2. 部署到Vercel

#### 方法一：通过Vercel CLI（推荐）

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 在项目目录中部署
vercel

# 4. 设置环境变量
vercel env add FINNHUB_API_KEY
# 输入您的Finnhub API密钥

# 5. 重新部署以应用环境变量
vercel --prod
```

#### 方法二：通过Vercel网站

1. 访问 [vercel.com](https://vercel.com)
2. 连接您的GitHub仓库
3. 在项目设置中添加环境变量：
   - `FINNHUB_API_KEY`: 您的Finnhub API密钥
4. 触发重新部署

### 3. 访问页面

部署成功后，您可以通过以下路径访问：

- **实时数据页面**: `https://your-app.vercel.app/live`
- **演示页面**: `https://your-app.vercel.app/demo`
- **静态版本**: `https://your-app.vercel.app/static-demo.html`

## 📁 项目结构

```
个股详情页/
├── api/                     # Vercel Serverless Functions
│   ├── cache/
│   │   └── stock-data.js   # 缓存API服务
│   └── stock/
│       ├── quote.js        # 股票报价API
│       ├── profile.js      # 公司资料API
│       ├── candles.js      # K线数据API
│       └── news.js         # 新闻数据API
├── public/                  # 静态文件目录
│   ├── index.html          # 主页面（本地演示）
│   ├── dynamic-detail.html # 动态数据页面
│   ├── live-stock-detail.html # 实时数据页面
│   ├── demo-stock-detail.html # 静态演示页面
│   ├── prototype.html      # 原型页面
│   ├── static-demo.html    # 静态演示
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       └── main.js         # 主要JavaScript文件
├── database/
│   └── init.sql            # 数据库初始化脚本
├── vercel.json             # Vercel配置文件
├── package.json            # 项目依赖
├── .gitignore              # Git忽略文件
└── .env.example            # 环境变量示例
```

## 🔧 API端点说明

### 股票报价
```
GET /api/stock/quote?symbol=AAPL
```

### 公司资料
```
GET /api/stock/profile?symbol=AAPL
```

### K线数据
```
GET /api/stock/candles?symbol=AAPL&resolution=D&from=1609459200&to=1640995200
```

### 公司新闻
```
GET /api/stock/news?symbol=AAPL&from=2024-01-01&to=2024-01-07
```

## ⚙️ 环境变量配置

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `FINNHUB_API_KEY` | Finnhub API密钥 | `ctbq7j1r01qnhqjqhqb0` |

### 强烈推荐变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | Neon PostgreSQL数据库连接 | `postgresql://username:password@hostname:port/database` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |

### Neon数据库缓存配置

为了避免Finnhub API频率限制并提升性能，强烈建议配置Neon数据库：

1. **获取Neon数据库**
   - 访问 [Neon.tech](https://neon.tech) 注册免费账户
   - 创建新的PostgreSQL数据库
   - 复制数据库连接字符串

2. **配置DATABASE_URL**
   - 在Vercel环境变量中添加 `DATABASE_URL`
   - 格式：`postgresql://username:password@hostname:port/database`
   - 系统将自动创建缓存表并管理数据

3. **缓存优势**
   - 减少90%以上的API调用
   - 提升页面加载速度
   - 避免API频率限制问题
   - 支持离线数据展示

## 🎯 功能特性

### 实时数据
- ✅ 实时股票价格和变动
- ✅ 开盘价、最高价、最低价、收盘价
- ✅ 成交量和市值信息
- ✅ 自动30秒刷新

### 图表功能
- ✅ 交互式K线图
- ✅ 多时间周期（日内、1周、1月、3月、1年）
- ✅ 悬停提示信息
- ✅ 响应式图表大小

### 公司信息
- ✅ 公司基本资料
- ✅ 行业分类和国家信息
- ✅ 员工数量和官网链接
- ✅ 财务指标展示

### 新闻资讯
- ✅ 相关公司新闻
- ✅ 新闻时间和来源
- ✅ 外部链接跳转

## 🔍 使用说明

### 搜索股票
1. 在顶部搜索框输入股票代码（如：AAPL、TSLA、MSFT）
2. 点击搜索按钮或按回车键
3. 页面将自动加载该股票的实时数据

### 查看图表
1. 点击时间周期按钮切换不同时间范围
2. 鼠标悬停在图表上查看详细信息
3. 图表会根据股票涨跌自动调整颜色

### 语言切换
- 点击右上角的语言按钮在中英文之间切换
- 语言设置会自动保存到本地存储

## 🚨 故障排除

### 常见问题

**1. API调用失败**
- 检查Finnhub API密钥是否正确设置
- 确认API密钥有效且未超出使用限制
- 查看浏览器控制台的错误信息

**2. 数据不显示**
- 确认股票代码输入正确
- 检查网络连接
- 尝试刷新页面

**3. 图表不显示**
- 确认Chart.js库正确加载
- 检查浏览器兼容性
- 查看控制台JavaScript错误

### 调试方法

1. **查看API响应**
   ```javascript
   // 在浏览器控制台中测试API
   fetch('/api/stock/quote?symbol=AAPL')
     .then(res => res.json())
     .then(data => console.log(data));
   ```

2. **检查环境变量**
   - 在Vercel Dashboard中确认环境变量已正确设置
   - 重新部署以应用新的环境变量

3. **查看日志**
   - 在Vercel Dashboard的Functions标签页查看API调用日志
   - 检查错误信息和响应时间

## 🏗️ 技术架构

### 前端技术栈
- **Alpine.js**: 轻量级响应式框架
- **Chart.js**: 专业图表库
- **Tailwind CSS**: 现代CSS框架
- **原生JavaScript**: 高性能数据处理

### 后端API设计
- **Vercel Serverless Functions**: 无服务器API
- **CORS处理**: 跨域资源共享
- **参数验证**: 输入数据校验
- **环境变量**: 安全配置管理
- **数据格式化**: 统一响应格式

### 缓存系统架构
- **Neon PostgreSQL**: 云端数据库缓存
- **智能缓存策略**: 不同数据类型的缓存时长
  - 股票报价：30秒缓存
  - 公司资料：24小时缓存
  - K线数据：5分钟缓存
  - 新闻数据：30分钟缓存
- **API频率控制**: 防止超出Finnhub限制
- **降级方案**: 缓存失败时提供模拟数据
- **数据清理**: 自动清理过期缓存数据

## 📈 性能优化

### API调用优化
- 实现了30秒自动刷新，避免过频繁请求
- 使用Vercel Edge Functions提供低延迟响应
- 添加了错误处理和重试机制

### 前端优化
- 使用CDN加载外部库（Tailwind CSS、Alpine.js、Chart.js）
- 实现了加载状态和骨架屏
- 响应式设计适配各种设备

### 缓存策略
- 静态资源使用长期缓存
- API响应包含时间戳用于数据新鲜度判断

## 🔒 安全配置

### API安全
- API密钥存储在服务器端环境变量中
- 实现了CORS头部配置
- 添加了请求方法和参数验证

### 数据保护
- 不在前端暴露API密钥
- 使用代理API避免跨域问题
- 实现了错误信息过滤

## 📞 技术支持

如果您在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查Vercel部署日志
3. 确认Finnhub API配额和限制
4. 验证环境变量配置

## 🎉 部署成功

部署成功后，您将拥有一个功能完整的实时股票详情页面，支持：

- 🔴 **实时数据**: 连接Finnhub API获取真实股票数据
- 📊 **专业图表**: 交互式K线图和多时间周期
- 🌍 **国际化**: 中英文双语支持
- 📱 **响应式**: 完美适配桌面和移动设备
- ⚡ **高性能**: Vercel Edge Network全球加速

立即访问您的实时股票详情页面，体验专业级的金融数据展示！