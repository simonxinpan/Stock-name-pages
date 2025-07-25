// 个股详情页主要JavaScript文件

// 全局配置
const CONFIG = {
  API_BASE_URL: '/api',
  REFRESH_INTERVAL: 30000, // 30秒
  CHART_COLORS: {
    primary: '#3b82f6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4'
  }
};

// 工具函数
const Utils = {
  // 格式化数字
  formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return '--';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  // 格式化百分比
  formatPercentage(num, decimals = 2) {
    if (num === null || num === undefined) return '--';
    const formatted = this.formatNumber(num, decimals);
    return `${formatted}%`;
  },

  // 格式化货币
  formatCurrency(num, currency = 'USD') {
    if (num === null || num === undefined) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(num);
  },

  // 格式化日期
  formatDate(timestamp, format = 'short') {
    if (!timestamp) return '--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric'
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 获取变化状态类名
  getChangeClass(change) {
    if (change > 0) return 'status-positive';
    if (change < 0) return 'status-negative';
    return 'status-neutral';
  },

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// API调用类
class StockAPI {
  constructor(baseUrl = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, params = {}) {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 获取股票报价
  async getQuote(symbol) {
    return this.request('/stock/quote', { symbol });
  }

  // 获取公司资料
  async getProfile(symbol) {
    return this.request('/stock/profile', { symbol });
  }

  // 获取K线数据
  async getCandles(symbol, resolution = 'D', from, to) {
    return this.request('/stock/candles', {
      symbol,
      resolution,
      from,
      to
    });
  }

  // 获取新闻
  async getNews(symbol, from, to) {
    return this.request('/stock/news', {
      symbol,
      from,
      to
    });
  }
}

// 图表管理类
class ChartManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
  }

  // 创建K线图
  createCandlestickChart(data, options = {}) {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: options.label || 'Price',
          data: data.values,
          borderColor: CONFIG.CHART_COLORS.primary,
          backgroundColor: CONFIG.CHART_COLORS.primary + '20',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false
          }
        },
        plugins: {
          legend: {
            display: false
          }
        },
        ...options
      }
    });
  }

  // 更新图表数据
  updateChart(data) {
    if (this.chart) {
      this.chart.data.labels = data.labels;
      this.chart.data.datasets[0].data = data.values;
      this.chart.update();
    }
  }

  // 销毁图表
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

// 加载状态管理
class LoadingManager {
  static show(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '<div class="loading"></div> 加载中...';
    }
  }

  static hide(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '';
    }
  }

  static error(elementId, message = '加载失败') {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `<span class="status-negative">${message}</span>`;
    }
  }
}

// 导出全局对象
window.StockApp = {
  CONFIG,
  Utils,
  StockAPI,
  ChartManager,
  LoadingManager
};

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('Stock Detail Page Loaded');
  
  // 初始化全局API实例
  window.stockAPI = new StockAPI();
  
  // 添加全局错误处理
  window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
  });
  
  // 添加未处理的Promise拒绝处理
  window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
  });
});