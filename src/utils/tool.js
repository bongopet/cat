// 获取基础路径
const getBasePath = () => {
    // 检查是否为生产环境
    if (import.meta.env.PROD) {
      // 使用 vite.config.js 中配置的 base 路径
      return '/cat/';
    }
    // 开发环境使用根路径
    return '/';
  };

  export { getBasePath };