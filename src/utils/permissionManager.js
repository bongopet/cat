// 全局权限管理器

// 全局权限状态
let globalUserPermission = 'active'; // 默认权限

/**
 * 设置用户权限
 * @param {string} permission - 用户权限 ('active' 或 'owner')
 */
export function setUserPermission(permission) {
  globalUserPermission = permission;
  console.log('全局权限已设置为:', permission);
}

/**
 * 获取用户权限
 * @param {string} actionType - 操作类型 ('transfer', 'contract', 'permission')
 * @returns {string} - 返回合适的权限级别
 */
export function getUserPermission(actionType = 'contract') {
  console.log(`获取权限: ${globalUserPermission}, 操作类型: ${actionType}`);
  
  // 根据操作类型选择权限
  switch (actionType) {
    case 'permission':
    case 'updateauth':
      // 权限相关操作需要owner权限
      return globalUserPermission === 'owner' ? 'owner' : 'active';
      
    case 'transfer':
    case 'contract':
    default:
      // 使用用户登录时的权限
      return globalUserPermission;
  }
}

/**
 * 重置权限为默认值
 */
export function resetUserPermission() {
  globalUserPermission = 'active';
  console.log('权限已重置为默认值: active');
}

/**
 * 检查是否有owner权限
 * @returns {boolean}
 */
export function hasOwnerPermission() {
  return globalUserPermission === 'owner';
}

/**
 * 获取当前权限状态
 * @returns {string}
 */
export function getCurrentPermission() {
  return globalUserPermission;
}
