/**
 * 时间处理工具函数
 */

/**
 * 格式化时间戳为本地时间
 * @param {string|number} timestamp - 时间戳，可以是ISO字符串或Unix时间戳
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (timestamp, options = {}) => {
  if (!timestamp) return '未知';

  let date;

  // 如果是ISO格式字符串，需要处理UTC时间
  if (typeof timestamp === 'string') {
    // 强制将时间字符串当作UTC时间处理，添加Z后缀
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    date = new Date(utcTimestamp);
    
    // 手动添加8小时（北京时间UTC+8）
    date.setHours(date.getHours());
  } else {
    // 如果是Unix时间戳，乘以1000
    date = new Date(timestamp * 1000);
  }

  // 默认格式化选项
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  // 合并选项
  const formatOptions = { ...defaultOptions, ...options };

  // 格式化显示
  return date.toLocaleString('zh-CN', formatOptions);
};

/**
 * 格式化时间为简短格式（只显示日期）
 * @param {string|number} timestamp - 时间戳
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (timestamp) => {
  return formatTime(timestamp, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * 格式化时间为相对时间（如：2小时前）
 * @param {string|number} timestamp - 时间戳
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '未知';

  let date;
  
  if (typeof timestamp === 'string') {
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    date = new Date(utcTimestamp);
    date.setHours(date.getHours() + 8);
  } else {
    date = new Date(timestamp * 1000);
  }

  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else {
    return formatDate(timestamp);
  }
};

/**
 * 检查时间是否为今天
 * @param {string|number} timestamp - 时间戳
 * @returns {boolean} 是否为今天
 */
export const isToday = (timestamp) => {
  if (!timestamp) return false;

  let date;
  
  if (typeof timestamp === 'string') {
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    date = new Date(utcTimestamp);
    date.setHours(date.getHours() + 8);
  } else {
    date = new Date(timestamp * 1000);
  }

  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * 获取时间戳的年龄（天数）
 * @param {string|number} timestamp - 时间戳
 * @returns {number} 天数
 */
export const getAgeInDays = (timestamp) => {
  if (!timestamp) return 0;

  let date;
  
  if (typeof timestamp === 'string') {
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    date = new Date(utcTimestamp);
    date.setHours(date.getHours() + 8);
  } else {
    date = new Date(timestamp * 1000);
  }

  const now = new Date();
  const diffMs = now - date;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * 将本地时间转换为UTC时间字符串
 * @param {Date} localDate - 本地时间
 * @returns {string} UTC时间字符串
 */
export const toUTCString = (localDate) => {
  if (!localDate) return '';
  
  // 减去8小时转换为UTC时间
  const utcDate = new Date(localDate.getTime() - 8 * 60 * 60 * 1000);
  return utcDate.toISOString().slice(0, 19); // 移除毫秒和Z后缀
};
