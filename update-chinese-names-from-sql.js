// 从SQL脚本更新中文股票名称的工具
// 将用户提供的SQL INSERT语句中的中文名称提取并更新到API文件中

const fs = require('fs');
const path = require('path');

// 用户提供的SQL INSERT数据
const sqlData = `
('A', '安捷伦科技', '医疗保健'),
('AAL', '美国航空', '工业'),
('AAPL', '苹果公司', '信息技术'),
('ABBV', '艾伯维', '医疗保健'),
('ABNB', '爱彼迎', '非必需消费品'),
('ABT', '雅培', '医疗保健'),
('ACGL', 'Arch Capital Group', '金融'),
('ACN', '埃森哲', '信息技术'),
('ADBE', '奥多比', '信息技术'),
('ADI', '亚德诺半导体', '半导体'),
('ADM', '阿彻丹尼尔斯米德兰', '日常消费品'),
('ADP', '自动数据处理公司', '信息技术'),
('ADSK', '欧特克', '信息技术'),
('AEE', 'Ameren', '公用事业'),
('AEP', '美国电力', '公用事业'),
('AES', '爱依斯电力', '公用事业'),
('AFL', '美国家庭人寿保险', '金融'),
('AIG', '美国国际集团', '金融'),
('AIZ', 'Assurant', '金融'),
('AJG', '亚瑟加拉格尔', '金融'),
('AKAM', '阿卡迈科技', '信息技术'),
('ALB', '雅宝', '原材料'),
('ALGN', '隐适美科技', '医疗保健'),
('ALK', '阿拉斯加航空', '工业'),
('ALL', '好事达', '金融'),
('ALLE', 'Allegion', '工业'),
('AMAT', '应用材料', '半导体'),
('AMCR', 'Amcor', '原材料'),
('AMD', '超威半导体', '半导体'),
('AME', '阿美德克', '工业'),
('AMGN', '安进', '医疗保健'),
('AMP', '美盛安斯泰来', '金融'),
('AMT', '美国电塔', '房地产'),
('AMZN', '亚马逊', '非必需消费品'),
('ANET', '阿里斯塔网络', '信息技术'),
('ANSS', '安世', '信息技术'),
('AON', '怡安', '金融'),
('AOS', 'A.O.史密斯', '工业'),
('APA', '阿帕奇', '能源'),
('APD', '空气化工产品', '原材料'),
('APH', '安费诺', '信息技术'),
('APTV', '安波福', '非必需消费品'),
('ARE', '亚历山大房地产', '房地产'),
('ATO', 'Atmos Energy', '公用事业'),
('AVB', 'AvalonBay Communities', '房地产'),
('AVGO', '博通', '半导体'),
('AVY', '艾利丹尼森', '原材料'),
('AWK', '美国水务', '公用事业'),
('AXP', '美国运通', '金融'),
('AZO', 'AutoZone', '非必需消费品'),
('BA', '波音', '工业'),
('BAC', '美国银行', '金融'),
('BALL', '波尔', '原材料'),
('BAX', '百特国际', '医疗保健'),
('BBWI', 'Bath & Body Works', '非必需消费品'),
('BBY', '百思买', '非必需消费品'),
('BDX', '贝克顿', '医疗保健'),
('BEN', '富兰克林资源', '金融'),
('BF.B', '布朗福曼', '日常消费品'),
('BG', '邦吉', '日常消费品'),
('BIIB', '百健', '医疗保健'),
('BIO', 'Bio-Rad实验室', '医疗保健'),
('BK', '纽约梅隆银行', '金融'),
('BKNG', 'Booking Holdings', '非必需消费品'),
('BKR', '贝克休斯', '能源'),
('BLK', '贝莱德', '金融'),
('BMY', '百时美施贵宝', '医疗保健'),
('BR', '博通', '信息技术'),
('BRK.B', '伯克希尔哈撒韦B', '金融'),
('BRO', '布朗布朗', '金融'),
('BSX', '波士顿科学', '医疗保健'),
('BWA', '博格华纳', '非必需消费品'),
('BX', '黑石集团', '金融'),
('BXP', '波士顿地产', '房地产'),
('C', '花旗集团', '金融'),
('CAG', '康尼格拉', '日常消费品'),
('CAH', '卡地纳健康', '医疗保健'),
('CAT', '卡特彼勒', '工业'),
('CB', '丘博保险', '金融'),
('CBOE', '芝加哥期权交易所', '金融'),
('CBRE', '世邦魏理仕', '房地产'),
('CCI', '冠城国际', '房地产'),
('CCL', '嘉年华邮轮', '非必需消费品'),
('CDNS', '铿腾电子', '信息技术'),
('CDW', 'CDW Corporation', '信息技术'),
('CE', '赛拉尼斯', '原材料'),
('CEG', '星座能源', '公用事业'),
('CF', 'CF实业', '原材料'),
('CFG', '公民金融', '金融'),
('CHD', '丘奇德怀特', '日常消费品'),
('CHRW', '罗宾逊全球物流', '工业'),
('CHTR', '特许通讯', '通讯服务'),
('CI', '信诺', '医疗保健'),
('CINF', '辛辛那提金融', '金融'),
('CL', '高露洁', '日常消费品'),
('CLX', '高乐氏', '日常消费品'),
('CMA', '联信银行', '金融'),
('CMCSA', '康卡斯特', '媒体娱乐'),
('CME', '芝加哥商品交易所', '金融'),
('CMG', '墨式烧烤', '非必需消费品'),
('CMI', '康明斯', '工业'),
('CMS', 'CMS能源', '公用事业'),
('CNA', 'CNA保险', '金融'),
('CNP', '中点能源', '公用事业'),
('CNX', 'CONSOL Energy', '能源'),
('COF', '第一资本', '金融'),
('COO', '库珀医疗', '医疗保健'),
('COP', '康菲石油', '能源'),
('COST', '好市多', '日常消费品'),
('CPB', '金宝汤', '日常消费品'),
('CPRT', 'Copart', '工业'),
('CPT', 'Camden Property Trust', '房地产'),
('CRL', '查尔斯河实验室', '医疗保健'),
('CRM', '赛富时', '信息技术'),
('CSCO', '思科', '信息技术'),
('CSGP', 'CoStar Group', '房地产'),
('CSX', 'CSX铁路', '工业'),
('CTAS', '仕达屋', '工业'),
('CTLT', 'Catalent', '医疗保健'),
('CTRA', 'Coterra Energy', '能源'),
('CTSH', '高知特', '信息技术'),
('CVS', 'CVS健康', '医疗保健'),
('CVX', '雪佛龙', '能源'),
('CZR', '凯撒娱乐', '非必需消费品'),
('D', '多米尼克能源', '公用事业'),
('DAL', '达美航空', '工业'),
('DAY', 'Dayforce', '信息技术'),
('DD', '杜邦', '原材料'),
('DE', '迪尔', '工业'),
('DECK', '德克斯户外', '非必需消费品'),
('DFS', '发现金融服务', '金融'),
('DG', '美元通用', '日常消费品'),
('DGX', '奎斯特诊断', '医疗保健'),
('DHI', '霍顿房屋', '非必需消费品'),
('DHR', '丹纳赫', '医疗保健'),
('DIS', '迪士尼', '媒体娱乐'),
('DLR', 'Digital Realty', '房地产'),
('DLTR', '美元树', '非必需消费品'),
('DOV', '多佛', '工业'),
('DOW', '陶氏化学', '原材料'),
('DPZ', '达美乐比萨', '非必需消费品'),
('DRI', '达顿餐厅', '非必需消费品'),
('DTE', 'DTE能源', '公用事业'),
('DUK', '杜克能源', '公用事业'),
('DVA', '达维塔医疗', '医疗保健'),
('DVN', '德文能源', '能源'),
('DXCM', '德康医疗', '医疗保健'),
('EA', '艺电', '媒体娱乐'),
('EBAY', '易贝', '非必需消费品'),
('ECL', '艺康', '原材料'),
('ED', '爱迪生联合电气', '公用事业'),
('EEM', 'iShares MSCI新兴市场ETF', '金融'),
('EFX', 'Equifax', '金融'),
('EIX', '爱迪生国际', '公用事业'),
('EL', '雅诗兰黛', '日常消费品'),
('ELV', 'Elevance Health', '医疗保健'),
('EMN', '伊士曼化工', '原材料'),
('EMR', '艾默生电气', '工业'),
('ENPH', 'Enphase Energy', '信息技术'),
('EOG', 'EOG能源', '能源'),
('EPAM', 'EPAM Systems', '信息技术'),
('EQIX', 'Equinix', '房地产'),
('EQR', 'Equity Residential', '房地产'),
('EQT', 'EQT能源', '能源'),
('ES', 'Eversource Energy', '公用事业'),
('ESS', 'Essex Property Trust', '房地产'),
('ETN', '伊顿', '工业'),
('ETR', '安特吉', '公用事业'),
('ETSY', 'Etsy', '非必需消费品'),
('EVRG', 'Evergy', '公用事业'),
('EW', '爱德华兹生命科学', '医疗保健'),
('EXC', '爱克斯龙', '公用事业'),
('EXPD', '康捷国际物流', '工业'),
('EXPE', 'Expedia', '非必需消费品'),
('EXR', 'Extra Space Storage', '房地产'),
('F', '福特汽车', '非必需消费品'),
('FANG', '钻石岩能源', '能源'),
('FAST', '快扣', '工业'),
('FCX', '自由港麦克莫兰', '原材料'),
('FDC', '第一数据', '信息技术'),
('FDS', 'FactSet研究系统', '金融'),
('FDX', '联邦快递', '工业'),
('FE', '第一能源', '公用事业'),
('FFIV', 'F5网络', '信息技术'),
('FI', 'Fidelity National Information Services', '信息技术'),
('FICO', '费埃哲', '信息技术'),
('FIS', '富达国家信息服务', '信息技术'),
('FISV', 'Fiserv', '信息技术'),
('FITB', '第五三银行', '金融'),
('FLT', 'FleetCor', '信息技术'),
('FMC', 'FMC公司', '原材料'),
('FOX', '福克斯广播公司A', '媒体娱乐'),
('FOXA', '福克斯广播公司B', '媒体娱乐'),
('FRT', 'Federal Realty Investment Trust', '房地产'),
('FSLR', '第一太阳能', '信息技术'),
('FTNT', '飞塔', '信息技术'),
('FTV', 'Fortive', '工业'),
('GD', '通用动力', '工业'),
('GE', '通用电气', '工业'),
('GEHC', 'GE医疗', '医疗保健'),
('GEV', 'GE Vernova', '工业'),
('GILD', '吉利德科学', '医疗保健'),
('GIS', '通用磨坊', '日常消费品'),
('GL', 'Globe Life', '金融')
`;

function parseChineseNamesFromSQL(sqlData) {
    const chineseNames = {};
    
    // 匹配SQL INSERT语句中的数据
    const regex = /\('([^']+)',\s*'([^']+)',\s*'[^']+'/g;
    let match;
    
    while ((match = regex.exec(sqlData)) !== null) {
        const symbol = match[1];
        const chineseName = match[2];
        
        // 只保留包含中文字符的名称
        if (/[\u4e00-\u9fff]/.test(chineseName)) {
            chineseNames[symbol] = chineseName;
        }
    }
    
    return chineseNames;
}

function updateAPIFile() {
    console.log('开始从SQL数据提取中文名称...');
    
    // 解析SQL数据中的中文名称
    const newChineseNames = parseChineseNamesFromSQL(sqlData);
    console.log(`从SQL数据中提取到 ${Object.keys(newChineseNames).length} 个中文名称`);
    
    // 读取现有API文件
    const apiFilePath = path.join(__dirname, 'api', 'stock', 'chinese-name.js');
    let apiContent = fs.readFileSync(apiFilePath, 'utf8');
    
    // 找到localChineseNames对象的开始和结束位置
    const startMarker = 'const localChineseNames = {';
    const endMarker = '};';
    
    const startIndex = apiContent.indexOf(startMarker);
    const endIndex = apiContent.indexOf(endMarker, startIndex);
    
    if (startIndex === -1 || endIndex === -1) {
        console.error('无法找到localChineseNames对象');
        return;
    }
    
    // 读取现有的中文名称映射
    const existingContent = apiContent.substring(startIndex + startMarker.length, endIndex);
    const existingNames = {};
    
    // 解析现有映射
    const existingRegex = /'([^']+)':\s*'([^']+)'/g;
    let existingMatch;
    while ((existingMatch = existingRegex.exec(existingContent)) !== null) {
        existingNames[existingMatch[1]] = existingMatch[2];
    }
    
    console.log(`现有API文件中包含 ${Object.keys(existingNames).length} 个映射`);
    
    // 合并新旧映射，新的覆盖旧的
    const mergedNames = { ...existingNames, ...newChineseNames };
    
    // 生成新的映射内容
    const newMappingContent = Object.entries(mergedNames)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([symbol, name]) => `  '${symbol}': '${name}'`)
        .join(',\n');
    
    // 构建新的API文件内容
    const newApiContent = apiContent.substring(0, startIndex + startMarker.length) + 
        '\n' + newMappingContent + '\n' + 
        apiContent.substring(endIndex);
    
    // 写入更新后的文件
    fs.writeFileSync(apiFilePath, newApiContent, 'utf8');
    
    console.log(`\n更新完成！`);
    console.log(`- 新增/更新了 ${Object.keys(newChineseNames).length} 个中文名称`);
    console.log(`- 总计包含 ${Object.keys(mergedNames).length} 个中文名称映射`);
    
    // 显示更新的条目
    console.log('\n更新的中文名称包括:');
    Object.entries(newChineseNames).slice(0, 20).forEach(([symbol, name]) => {
        console.log(`  ${symbol}: ${name}`);
    });
    if (Object.keys(newChineseNames).length > 20) {
        console.log(`  ... 还有 ${Object.keys(newChineseNames).length - 20} 个`);
    }
}

// 执行更新
try {
    updateAPIFile();
} catch (error) {
    console.error('更新过程中发生错误:', error);
}