// 批量更新中文股票名称脚本
const fs = require('fs');
const path = require('path');

// 新的中文名称映射数据
const newChineseNames = {
  'SPG': '西蒙地产',
  'SPGI': '标普全球',
  'SRE': '桑普拉能源',
  'STE': '斯特瑞斯',
  'STLD': 'Steel Dynamics',
  'STT': '道富银行',
  'STX': '希捷科技',
  'STZ': '星座品牌',
  'SWK': '史丹利百得',
  'SWKS': '思佳讯',
  'SYF': '同步金融',
  'SYK': '史赛克',
  'SYY': '西斯科',
  'T': '美国电话电报',
  'TAP': '摩森康胜',
  'TDG': 'TransDigm',
  'TDY': '泰瑞达',
  'TECH': 'Bio-Techne',
  'TEL': '泰科电子',
  'TER': '泰瑞达',
  'TFC': 'Truist Financial',
  'TFX': '泰利福',
  'TGT': '塔吉特',
  'TJX': 'TJX公司',
  'TMO': '赛默飞世尔',
  'TMUS': 'T-Mobile US',
  'TPR': '泰佩思琪',
  'TRGP': 'Targa Resources',
  'TRMB': '天宝',
  'TROW': '普信集团',
  'TRV': '旅行者保险',
  'TSCO': '拖拉机供应',
  'TSLA': '特斯拉',
  'TSN': '泰森食品',
  'TT': '天纳克',
  'TTWO': 'Take-Two',
  'TXN': '德州仪器',
  'TXT': '德事隆',
  'TYL': '泰勒科技',
  'UAL': '联合航空',
  'UDR': 'UDR',
  'UHS': '联合健康服务',
  'ULTA': 'Ulta美容',
  'UNH': '联合健康',
  'UNP': '联合太平洋',
  'UPS': '联合包裹',
  'URI': '联合租赁',
  'USB': '美国合众银行',
  'V': 'Visa',
  'VEEV': 'Veeva Systems',
  'VER': 'Verisk Analytics',
  'VFC': '威富公司',
  'VICI': 'VICI Properties',
  'VLO': '瓦莱罗能源',
  'VMC': '火神材料',
  'VRSK': 'Verisk Analytics',
  'VRSN': '威瑞信',
  'VRT': 'Vertiv Holdings',
  'VTR': 'Ventas',
  'VTRS': '辉瑞',
  'VZ': '威瑞森',
  'WAB': '威伯科',
  'WAT': '沃特世',
  'WBD': '华纳兄弟探索',
  'WCN': 'Waste Connections',
  'WDC': '西部数据',
  'WEC': 'WEC能源集团',
  'WELL': 'Welltower',
  'WFC': '富国银行',
  'WHR': '惠而浦',
  'WM': '废物管理',
  'WMB': '威廉姆斯',
  'WMT': '沃尔玛',
  'WRB': 'W. R. Berkley',
  'WRK': 'WestRock',
  'WST': '西部制药',
  'WTW': '韦莱韬悦',
  'WY': '惠好',
  'WYNN': '永利度假村',
  'XEL': '斯塞尔能源',
  'XOM': '埃克森美孚',
  'XRAY': '登士柏西诺德',
  'XYL': '赛莱默',
  'YUM': '百胜餐饮',
  'ZBH': '捷迈邦美',
  'ZBRA': '斑马技术',
  'ZTS': '硕腾'
};

async function updateChineseNames() {
  try {
    console.log('开始批量更新中文股票名称...');
    
    const apiFilePath = path.join(__dirname, 'api', 'stock', 'chinese-name.js');
    
    // 读取现有API文件
    let content = fs.readFileSync(apiFilePath, 'utf8');
    
    // 统计更新数量
    let updateCount = 0;
    let newCount = 0;
    
    // 遍历新的中文名称映射
    for (const [symbol, chineseName] of Object.entries(newChineseNames)) {
      const oldPattern = new RegExp(`'${symbol}':\s*'[^']*'`, 'g');
      const newMapping = `'${symbol}': '${chineseName}'`;
      
      if (content.includes(`'${symbol}':`)) {
        // 更新现有映射
        content = content.replace(oldPattern, newMapping);
        updateCount++;
        console.log(`更新: ${symbol} -> ${chineseName}`);
      } else {
        // 添加新映射（在localChineseNames对象末尾添加）
        const insertPosition = content.lastIndexOf('};');
        if (insertPosition !== -1) {
          const beforeClosing = content.substring(0, insertPosition);
          const afterClosing = content.substring(insertPosition);
          content = beforeClosing + `,\n  ${newMapping}` + afterClosing;
          newCount++;
          console.log(`新增: ${symbol} -> ${chineseName}`);
        }
      }
    }
    
    // 写回文件
    fs.writeFileSync(apiFilePath, content, 'utf8');
    
    console.log(`\n批量更新完成!`);
    console.log(`更新现有映射: ${updateCount} 个`);
    console.log(`新增映射: ${newCount} 个`);
    console.log(`总计处理: ${updateCount + newCount} 个股票代码`);
    
    // 验证更新结果
    console.log('\n验证更新结果...');
    const updatedContent = fs.readFileSync(apiFilePath, 'utf8');
    const chineseNameMatches = updatedContent.match(/'[A-Z]+[A-Z0-9]*':\s*'[^']+'/g);
    console.log(`当前API文件中包含 ${chineseNameMatches ? chineseNameMatches.length : 0} 个中文名称映射`);
    
  } catch (error) {
    console.error('更新过程中出现错误:', error);
  }
}

// 执行更新
updateChineseNames();