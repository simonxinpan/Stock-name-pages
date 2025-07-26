# 智能个股详情页 - 部署指南

## 🚀 快速部署指南

### 当前状态
✅ **项目已完成开发，可直接部署到Vercel**
- 前端界面：完整的股票详情页面
- API接口：完整的Finnhub数据集成
- 降级机制：API失败时自动使用模拟数据
- 环境配置：已配置Finnhub API密钥

### 1. 环境准备

确保您的系统已安装：
- Node.js (版本 >= 16)
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 环境变量配置

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下环境变量：

#### 3.1 Finnhub API 配置（已配置）

- ✅ 当前使用密钥：`ctbr9k9r01qnc8qhvqpgctbr9k9r01qnc8qhvqq0`
- 如需更换，访问 [Finnhub.io](https://finnhub.io) 获取新密钥
- 在 `.env` 文件中设置：

```env
FINNHUB_API_KEY=ctbr9k9r01qnc8qhvqpgctbr9k9r01qnc8qhvqq0
```

#### 3.2 数据库配置 (可选)

如果需要数据缓存功能：

1. 访问 [Neon.tech](https://neon.tech) 创建免费 PostgreSQL 数据库
2. 获取连接字符串
3. 在 `.env` 文件中设置：

```env
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### 4. 数据库初始化 (可选)

如果配置了数据库，运行初始化脚本：

```sql
-- 在您的 PostgreSQL 数据库中执行 database/init.sql 文件
```

### 5. 启动应用

#### 开发模式

```bash
# 使用内置服务器
node server.js

# 或使用 npm 脚本
npm run dev
```

#### 生产模式

```bash
npm run start
```

应用将在 `http://localhost:3000` 启动。

## 🌐 部署到云平台

### Vercel 部署

1. **连接GitHub仓库**
   ```bash
   # 推送代码到GitHub
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **在Vercel中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择GitHub仓库
   - 配置构建设置（通常自动检测）

3. **配置环境变量**
   在Vercel项目设置 → Environment Variables 中添加：
   ```
   FINNHUB_API_KEY=ctbr9k9r01qnc8qhvqpgctbr9k9r01qnc8qhvqq0
   NODE_ENV=production
   ```
   
   可选数据库配置：
   ```
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
   ```

4. **部署**
   - Vercel会自动部署
   - 每次推送到main分支都会触发重新部署
   - 部署完成后可通过提供的URL访问应用

### Netlify 部署

1. 将代码推送到 GitHub
2. 在 Netlify 控制台连接 GitHub 仓库
3. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `public`
4. 配置环境变量

## 🔧 功能测试

### API 连接测试

访问以下端点测试 API 连接：

- 数据库连接测试：`http://localhost:3000/api/test/db-connection`
- Finnhub API 测试：`http://localhost:3000/api/test/finnhub-api`

### 前端测试

1. 打开应用主页
2. 点击右上角的"测试连接"按钮
3. 查看连接状态和测试结果

## 📊 功能特性

### ✅ 已实现功能

- 📈 实时股票报价显示
- 📊 交互式K线图表
- 🏢 公司基本信息
- 📰 相关新闻资讯
- 🌐 中英文双语支持
- 📱 响应式设计
- 🔄 自动数据刷新
- 💾 数据缓存机制
- 🔌 API 连接测试
- 🎨 现代化 UI 设计

### 🔄 降级机制

- API 请求失败时自动切换到模拟数据
- 数据库不可用时使用内存缓存
- 网络异常时显示离线状态

## 🛠️ 故障排除

### 常见问题

1. **API 请求失败**
   - 检查 `FINNHUB_API_KEY` 是否正确配置
   - 确认 API 密钥有效且未超出限额

2. **数据库连接失败**
   - 检查 `DATABASE_URL` 格式是否正确
   - 确认数据库服务可访问
   - 验证数据库表是否已创建

3. **页面无法加载**
   - 检查端口 3000 是否被占用
   - 确认所有依赖已正确安装

### 日志查看

```bash
# 查看服务器日志
node server.js

# 查看详细错误信息
NODE_ENV=development node server.js
```

## 📞 技术支持

如遇到问题，请检查：

1. 环境变量配置是否正确
2. 网络连接是否正常
3. API 密钥是否有效
4. 数据库连接是否可用

---

**注意**：首次运行时，如果未配置 API 密钥，应用将使用模拟数据运行，这是正常的降级行为。