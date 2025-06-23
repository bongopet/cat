// 测试权限检查功能

import { getAppropriatePermission } from './chainOperations.js';

/**
 * 测试不同钱包权限配置
 */
export function testPermissionLogic() {
  console.log('=== 测试权限检查逻辑 ===');
  
  // 测试1: 模拟owner权限钱包
  const ownerWallet = {
    authority: 'owner',
    name: 'bongocatgame'
  };
  
  const ownerPermission = getAppropriatePermission(ownerWallet, 'contract');
  console.log('Owner钱包权限:', ownerPermission); // 应该返回 'owner'
  
  // 测试2: 模拟active权限钱包
  const activeWallet = {
    authority: 'active',
    name: 'bongocatgame'
  };
  
  const activePermission = getAppropriatePermission(activeWallet, 'contract');
  console.log('Active钱包权限:', activePermission); // 应该返回 'active'
  
  // 测试3: 模拟没有权限信息的钱包
  const unknownWallet = {
    name: 'bongocatgame'
  };
  
  const unknownPermission = getAppropriatePermission(unknownWallet, 'contract');
  console.log('未知钱包权限:', unknownPermission); // 应该返回 'active' (默认)
  
  // 测试4: 权限管理操作
  const permissionOpOwner = getAppropriatePermission(ownerWallet, 'permission');
  console.log('Owner权限管理操作:', permissionOpOwner); // 应该返回 'owner'
  
  const permissionOpActive = getAppropriatePermission(activeWallet, 'permission');
  console.log('Active权限管理操作:', permissionOpActive); // 应该返回 'active'
  
  console.log('=== 权限测试完成 ===');
}

/**
 * 模拟DFSAPP钱包登录信息
 */
export function simulateDFSWalletLogin() {
  return {
    channel: "dfswallet",
    authority: "owner",
    name: "bongocatgame",
    publicKey: "PUB_K1_568odSyWiEqVX83YErs2rnuAQzcyvYY6Z1K8qBzbKKKa4bpY9S"
  };
}

/**
 * 获取当前用户应该使用的权限
 */
export function getCurrentUserPermission(wallet) {
  const permission = getAppropriatePermission(wallet, 'contract');
  console.log(`当前用户权限: ${permission}`);
  return permission;
}
