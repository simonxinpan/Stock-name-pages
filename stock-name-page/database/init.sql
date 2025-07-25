-- 智能个股详情页数据库初始化脚本
-- 适用于 PostgreSQL (Neon Database)

-- 创建股票基本信息表
CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    current_price DECIMAL(12, 4) DEFAULT 0,
    change DECIMAL(12, 4) DEFAULT 0,
    change_percent DECIMAL(8, 4) DEFAULT 0,
    volume BIGINT DEFAULT 0,
    market_cap BIGINT DEFAULT 0,
    pe_ratio DECIMAL(8, 4) DEFAULT 0,
    eps DECIMAL(8, 4) DEFAULT 0,
    dividend_yield DECIMAL(8, 4) DEFAULT 0,
    beta DECIMAL(8, 4) DEFAULT 0,
    week_52_high DECIMAL(12, 4) DEFAULT 0,
    week_52_low DECIMAL(12, 4) DEFAULT 0,
    industry VARCHAR(100),
    country VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'USD',
    exchange VARCHAR(50),
    ipo DATE,
    logo TEXT,
    phone VARCHAR(50),
    weburl TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建K线数据表
CREATE TABLE IF NOT EXISTS stock_candles (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    period VARCHAR(10) NOT NULL, -- 1D, 1W, 1M, 3M, 6M, 1Y, 5Y
    timestamp INTEGER NOT NULL,
    open_price DECIMAL(12, 4) NOT NULL,
    high_price DECIMAL(12, 4) NOT NULL,
    low_price DECIMAL(12, 4) NOT NULL,
    close_price DECIMAL(12, 4) NOT NULL,
    volume BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, period, timestamp)
);

-- 创建财务指标表
CREATE TABLE IF NOT EXISTS financial_metrics (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER, -- 1, 2, 3, 4 (NULL for annual data)
    revenue BIGINT,
    net_income BIGINT,
    gross_profit BIGINT,
    operating_income BIGINT,
    total_assets BIGINT,
    total_debt BIGINT,
    shareholders_equity BIGINT,
    free_cash_flow BIGINT,
    return_on_equity DECIMAL(8, 4),
    return_on_assets DECIMAL(8, 4),
    debt_to_equity DECIMAL(8, 4),
    current_ratio DECIMAL(8, 4),
    gross_margin DECIMAL(8, 4),
    operating_margin DECIMAL(8, 4),
    net_margin DECIMAL(8, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, fiscal_year, fiscal_quarter)
);

-- 创建公司新闻表
CREATE TABLE IF NOT EXISTS company_news (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT,
    url TEXT NOT NULL,
    source VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sentiment VARCHAR(20), -- positive, negative, neutral
    category VARCHAR(50), -- earnings, merger, dividend, etc.
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户关注表
CREATE TABLE IF NOT EXISTS user_watchlist (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- 创建价格提醒表
CREATE TABLE IF NOT EXISTS price_alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    alert_type VARCHAR(20) NOT NULL, -- above, below, change_percent
    target_price DECIMAL(12, 4),
    target_percent DECIMAL(8, 4),
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_updated_at ON stocks(updated_at);

CREATE INDEX IF NOT EXISTS idx_candles_symbol_period ON stock_candles(symbol, period);
CREATE INDEX IF NOT EXISTS idx_candles_timestamp ON stock_candles(timestamp);
CREATE INDEX IF NOT EXISTS idx_candles_updated_at ON stock_candles(updated_at);

CREATE INDEX IF NOT EXISTS idx_financial_symbol_year ON financial_metrics(symbol, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_financial_updated_at ON financial_metrics(updated_at);

CREATE INDEX IF NOT EXISTS idx_news_symbol ON company_news(symbol);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON company_news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_category ON company_news(category);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON user_watchlist(symbol);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(is_active);

-- 插入示例数据
INSERT INTO stocks (
    symbol, company_name, current_price, change, change_percent, volume, market_cap,
    pe_ratio, eps, dividend_yield, beta, week_52_high, week_52_low,
    industry, country, exchange
) VALUES 
('AAPL', 'Apple Inc.', 175.43, 2.15, 1.24, 45678900, 2800000000000, 28.5, 6.16, 0.52, 1.2, 198.23, 124.17, 'Technology', 'US', 'NASDAQ'),
('MSFT', 'Microsoft Corporation', 378.85, -1.23, -0.32, 23456789, 2820000000000, 32.1, 11.79, 0.68, 0.9, 384.52, 213.43, 'Technology', 'US', 'NASDAQ'),
('GOOGL', 'Alphabet Inc.', 138.21, 0.87, 0.63, 34567890, 1750000000000, 25.4, 5.44, 0.0, 1.1, 151.55, 83.34, 'Technology', 'US', 'NASDAQ'),
('TSLA', 'Tesla, Inc.', 248.42, 12.34, 5.23, 67890123, 790000000000, 65.2, 3.81, 0.0, 2.1, 414.50, 101.81, 'Automotive', 'US', 'NASDAQ'),
('NVDA', 'NVIDIA Corporation', 875.28, 15.67, 1.82, 45123678, 2150000000000, 71.3, 12.28, 0.09, 1.7, 974.27, 180.96, 'Technology', 'US', 'NASDAQ')
ON CONFLICT (symbol) DO NOTHING;

-- 插入示例财务数据
INSERT INTO financial_metrics (
    symbol, fiscal_year, revenue, net_income, gross_profit, total_assets,
    shareholders_equity, return_on_equity, gross_margin, net_margin
) VALUES 
('AAPL', 2023, 383285000000, 96995000000, 169148000000, 352755000000, 62146000000, 156.0, 44.1, 25.3),
('MSFT', 2023, 211915000000, 72361000000, 146052000000, 411976000000, 206223000000, 35.1, 68.9, 34.1),
('GOOGL', 2023, 307394000000, 73795000000, 181084000000, 402392000000, 283893000000, 26.0, 58.9, 24.0),
('TSLA', 2023, 96773000000, 14997000000, 19653000000, 106618000000, 62634000000, 23.9, 20.3, 15.5),
('NVDA', 2023, 60922000000, 29761000000, 45068000000, 85981000000, 42978000000, 69.2, 74.0, 48.8)
ON CONFLICT (symbol, fiscal_year, fiscal_quarter) DO NOTHING;

-- 插入示例新闻数据
INSERT INTO company_news (
    symbol, headline, summary, url, source, published_at, sentiment, category
) VALUES 
('AAPL', 'Apple Reports Strong Q4 Earnings', 'Apple Inc. reported better-than-expected quarterly earnings...', 'https://example.com/news/1', 'Reuters', NOW() - INTERVAL '2 hours', 'positive', 'earnings'),
('MSFT', 'Microsoft Azure Growth Continues', 'Microsoft\'s cloud computing division shows robust growth...', 'https://example.com/news/2', 'Bloomberg', NOW() - INTERVAL '4 hours', 'positive', 'business'),
('GOOGL', 'Google Announces New AI Features', 'Alphabet\'s Google division unveils advanced AI capabilities...', 'https://example.com/news/3', 'TechCrunch', NOW() - INTERVAL '6 hours', 'positive', 'technology'),
('TSLA', 'Tesla Delivers Record Vehicles', 'Tesla Inc. delivered a record number of vehicles this quarter...', 'https://example.com/news/4', 'CNBC', NOW() - INTERVAL '8 hours', 'positive', 'delivery'),
('NVDA', 'NVIDIA Leads AI Chip Market', 'NVIDIA Corporation maintains its leadership in AI semiconductors...', 'https://example.com/news/5', 'Wall Street Journal', NOW() - INTERVAL '10 hours', 'positive', 'technology');

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建更新时间戳触发器
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candles_updated_at BEFORE UPDATE ON stock_candles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_updated_at BEFORE UPDATE ON financial_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON company_news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON price_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图以简化常用查询
CREATE OR REPLACE VIEW stock_summary AS
SELECT 
    s.symbol,
    s.company_name,
    s.current_price,
    s.change,
    s.change_percent,
    s.volume,
    s.market_cap,
    s.pe_ratio,
    s.industry,
    s.exchange,
    COUNT(n.id) as news_count,
    MAX(n.published_at) as latest_news_date
FROM stocks s
LEFT JOIN company_news n ON s.symbol = n.symbol AND n.published_at > NOW() - INTERVAL '7 days'
GROUP BY s.symbol, s.company_name, s.current_price, s.change, s.change_percent, 
         s.volume, s.market_cap, s.pe_ratio, s.industry, s.exchange;

-- 股票数据缓存表（优化版）
CREATE TABLE IF NOT EXISTS stock_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(100) UNIQUE NOT NULL, -- 缓存键，包含symbol、type和参数
    symbol VARCHAR(10) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API调用记录表（用于频率限制）
CREATE TABLE IF NOT EXISTS api_calls (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 缓存统计表
CREATE TABLE IF NOT EXISTS cache_stats (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_stock_cache_key ON stock_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_stock_cache_symbol ON stock_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_cache_type ON stock_cache(data_type);
CREATE INDEX IF NOT EXISTS idx_stock_cache_updated ON stock_cache(updated_at);
CREATE INDEX IF NOT EXISTS idx_api_calls_created ON api_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_cache_stats_date ON cache_stats(date);

-- 自动清理过期数据的函数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除7天前的缓存数据
    DELETE FROM stock_cache 
    WHERE updated_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 删除30天前的API调用记录
    DELETE FROM api_calls 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- 删除90天前的统计数据
    DELETE FROM cache_stats 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 更新缓存统计的函数
CREATE OR REPLACE FUNCTION update_cache_stats(hit BOOLEAN, api_call BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO cache_stats (date, cache_hits, cache_misses, api_calls)
    VALUES (
        CURRENT_DATE,
        CASE WHEN hit THEN 1 ELSE 0 END,
        CASE WHEN NOT hit THEN 1 ELSE 0 END,
        CASE WHEN api_call THEN 1 ELSE 0 END
    )
    ON CONFLICT (date) DO UPDATE SET
        cache_hits = cache_stats.cache_hits + CASE WHEN hit THEN 1 ELSE 0 END,
        cache_misses = cache_stats.cache_misses + CASE WHEN NOT hit THEN 1 ELSE 0 END,
        api_calls = cache_stats.api_calls + CASE WHEN api_call THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- 授权说明
-- 确保应用程序用户有适当的权限：
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;