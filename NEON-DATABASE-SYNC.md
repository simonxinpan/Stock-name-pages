# Neon数据库中文股票名称同步说明

## 概述

本文档说明如何从Neon数据库的两个表格中同步中文股票名称（name_zh字段），以提升个股详情页的中文名称覆盖率。

## 背景

- **当前状态**: 594个标普股票中仅有299个有中文名称（50%覆盖率）
- **Neon数据库**: 高达90%的覆盖率
- **目标**: 从Neon数据库同步中文名称，提升覆盖率

## 环境变量配置

在Vercel项目设置中需要配置以下环境变量：

```bash
# 标普500数据库连接
NEON_DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/database?sslmode=require

# 中概股数据库连接
CHINESE_STOCKS_DATABASE_URL=postgresql://username:password@ep-yyy.us-east-1.aws.neon.tech/database?sslmode=require
```

## 文件说明

### 1. 同步脚本

- **`sync-chinese-names.js`**: 生产环境同步脚本
- **`sync-chinese-names-demo.js`**: 演示脚本（使用模拟数据）

### 2. 生成文件

- **`chinese-names-sync.json`**: 同步结果JSON文件
- **`api/stock/chinese-name-updated.js`**: 更新后的API文件

## 使用步骤

### 步骤1: 配置环境变量

在Vercel项目设置中添加两个数据库连接字符串：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 → Settings → Environment Variables
3. 添加 `NEON_DATABASE_URL` 和 `CHINESE_STOCKS_DATABASE_URL`

### 步骤2: 运行同步脚本

```bash
# 本地测试（需要.env文件）
node sync-chinese-names.js

# 或者先运行演示版本
node sync-chinese-names-demo.js
```

### 步骤3: 检查同步结果

脚本会生成以下文件：

```
chinese-names-sync.json          # 同步数据JSON
api/stock/chinese-name-updated.js   # 更新的API文件
```

### 步骤4: 部署更新

```bash
# 备份原文件
cp api/stock/chinese-name.js api/stock/chinese-name.backup.js

# 替换为新文件
cp api/stock/chinese-name-updated.js api/stock/chinese-name.js

# 提交更改
git add .
git commit -m "Update: Sync Chinese stock names from Neon database"
git push
```

## 数据库表结构

脚本会尝试以下查询来获取中文名称：

```sql
-- 标普500数据库
SELECT symbol, name_zh FROM stocks WHERE name_zh IS NOT NULL;
SELECT ticker, name_zh FROM stocks WHERE name_zh IS NOT NULL;
SELECT symbol, chinese_name FROM stocks WHERE chinese_name IS NOT NULL;
SELECT ticker, chinese_name FROM stocks WHERE chinese_name IS NOT NULL;

-- 中概股数据库
SELECT symbol, name_zh FROM stocks WHERE name_zh IS NOT NULL;
SELECT ticker, name_zh FROM stocks WHERE name_zh IS NOT NULL;
SELECT symbol, chinese_name FROM stocks WHERE chinese_name IS NOT NULL;
SELECT ticker, chinese_name FROM stocks WHERE chinese_name IS NOT NULL;
```

## 演示结果

运行演示脚本的结果：

```
📊 数据统计:
- 标普500中文名称: 20 个
- 中概股中文名称: 20 个
- 合并后总计: 40 个

📋 部分同步结果预览:
  AAPL: 苹果公司
  MSFT: 微软公司
  GOOGL: 谷歌公司
  AMZN: 亚马逊公司
  TSLA: 特斯拉公司
  BABA: 阿里巴巴集团
  JD: 京东集团
  PDD: 拼多多
  ...
```

## API使用方式

更新后的API支持以下功能：

### 1. 本地字典查询（优先）

```javascript
// GET /api/stock/chinese-name?symbol=AAPL
{
  "symbol": "AAPL",
  "chineseName": "苹果公司",
  "source": "local_dictionary",
  "lastUpdated": "2025-09-13T11:41:53.657Z"
}
```

### 2. 数据库查询（备用）

如果本地字典没有，会查询数据库：

```javascript
{
  "symbol": "UNKNOWN",
  "chineseName": "从数据库获取的名称",
  "source": "database",
  "lastUpdated": "2025-09-13T11:41:53.657Z"
}
```

### 3. 错误处理

```javascript
// 404 - 未找到
{
  "symbol": "UNKNOWN",
  "error": "Chinese name not found",
  "source": "not_found"
}

// 500 - 服务器错误
{
  "symbol": "AAPL",
  "error": "Internal server error",
  "details": "具体错误信息"
}
```

## 监控和维护

### 1. 定期同步

建议每月运行一次同步脚本，以获取最新的中文名称数据。

### 2. 日志监控

API会输出详细的日志信息：

```
🔍 [Chinese Name API] Querying for symbol: AAPL
✅ [Chinese Name API] Found in local dictionary: 苹果公司
```

### 3. 性能优化

- 本地字典查询优先，减少数据库查询
- 连接池配置优化
- 错误处理和重试机制

## 故障排除

### 1. 环境变量未设置

```
❌ 缺少数据库环境变量
💡 请在Vercel项目设置中配置 NEON_DATABASE_URL 和 CHINESE_STOCKS_DATABASE_URL
```

### 2. 数据库连接失败

```
❌ 数据库连接失败: connection timeout
```

检查：
- 数据库连接字符串格式
- 网络连接
- 数据库服务状态

### 3. 查询失败

```
❌ 查询失败: relation "stocks" does not exist
```

检查：
- 表名是否正确
- 字段名是否存在
- 数据库权限

## 技术细节

### 1. 模块系统

项目使用ES模块，需要在`package.json`中设置：

```json
{
  "type": "module"
}
```

### 2. 数据库连接

使用`pg`库连接PostgreSQL数据库：

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

### 3. 错误处理

脚本包含完整的错误处理机制：
- 连接失败重试
- 查询失败回退
- 资源清理

## 预期效果

同步完成后，预期达到以下效果：

- **覆盖率提升**: 从50%提升到90%+
- **用户体验**: 更多股票显示中文名称
- **维护性**: 自动化同步流程
- **性能**: 本地字典优先查询

## 联系支持

如有问题，请联系开发团队或查看：
- 项目文档
- Vercel部署日志
- Neon数据库控制台