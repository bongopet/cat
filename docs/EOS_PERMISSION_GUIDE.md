# EOS权限使用指南

## 权限层级结构

```
owner (最高权限)
  └── active (日常操作权限)
      └── 其他自定义权限
```

## 权限使用规则

### 1. `owner`权限
- **用途**: 账户管理和权限修改
- **操作**: 
  - 修改账户权限 (`updateauth`)
  - 恢复账户控制
  - 设置代理投票
  - 删除权限

### 2. `active`权限
- **用途**: 日常操作
- **操作**:
  - 转账 (`transfer`)
  - 调用合约action
  - 大部分交易操作

## 如何正确选择权限

### 自动权限检查函数

```javascript
// 检查账户权限并返回合适的权限级别
async function getAppropriatePermission(accountName, actionType = 'contract') {
  try {
    const { rpc } = await import('./eosUtils');
    const accountInfo = await rpc.get_account(accountName);
    
    const hasActive = accountInfo.permissions.some(p => p.perm_name === 'active');
    const hasOwner = accountInfo.permissions.some(p => p.perm_name === 'owner');
    
    // 根据操作类型选择权限
    switch (actionType) {
      case 'permission':
      case 'updateauth':
        return hasOwner ? 'owner' : 'active';
        
      case 'transfer':
      case 'contract':
      default:
        return hasActive ? 'active' : 'owner';
    }
  } catch (error) {
    console.warn('获取账户权限失败，使用默认active权限:', error);
    return 'active';
  }
}
```

### 使用示例

```javascript
// 动态权限使用示例
async function breedCats(wallet, accountName, maleCatId, femaleCatId) {
  // 动态获取合适的权限
  const permission = await getAppropriatePermission(accountName, 'contract');
  console.log(`使用权限: ${permission}`);

  const breedAction = {
    account: CONTRACT,
    name: 'breedcats',
    authorization: [{
      actor: accountName,
      permission: permission, // 动态权限
    }],
    data: {
      owner: accountName,
      male_cat_id: maleCatId,
      female_cat_id: femaleCatId,
    },
  };

  return await sendTransaction(wallet, [breedAction]);
}
```

## 常见权限问题

### 1. `eosio.code`权限问题

**问题**: `inline action's authorizations include a non-existent permission`

**原因**: 合约账户缺少`eosio.code`权限

**解决方案**:
```bash
# 方法1: 使用cleos添加权限
cleos set account permission 合约账户 active --add-code

# 方法2: 完整权限设置
cleos set account permission 合约账户 active '{"threshold":1,"keys":[{"key":"公钥","weight":1}],"accounts":[{"permission":{"actor":"合约账户","permission":"eosio.code"},"weight":1}]}' owner
```

### 2. 权限不足问题

**问题**: `missing required authority`

**原因**: 使用了错误的权限级别

**解决方案**: 使用动态权限检查函数

## 最佳实践

1. **优先使用`active`权限**: 除非明确需要`owner`权限
2. **动态权限检查**: 使用函数自动选择合适的权限
3. **权限验证**: 在执行操作前检查账户是否有所需权限
4. **错误处理**: 权限检查失败时提供友好的错误信息

## 权限检查工具

```javascript
// 检查账户是否有特定权限
async function hasPermission(accountName, permission) {
  try {
    const { rpc } = await import('./eosUtils');
    const accountInfo = await rpc.get_account(accountName);
    return accountInfo.permissions.some(p => p.perm_name === permission);
  } catch (error) {
    return false;
  }
}

// 获取账户完整权限信息
async function getAccountPermissions(accountName) {
  try {
    const { rpc } = await import('./eosUtils');
    const accountInfo = await rpc.get_account(accountName);
    
    const permissions = {};
    accountInfo.permissions.forEach(perm => {
      permissions[perm.perm_name] = {
        threshold: perm.required_auth.threshold,
        keys: perm.required_auth.keys,
        accounts: perm.required_auth.accounts,
        waits: perm.required_auth.waits
      };
    });
    
    return {
      accountName,
      permissions,
      hasActive: !!permissions.active,
      hasOwner: !!permissions.owner,
      hasEosioCode: permissions.active?.accounts?.some(
        a => a.permission.actor === accountName && a.permission.permission === 'eosio.code'
      ) || false
    };
  } catch (error) {
    console.error('获取权限信息失败:', error);
    return null;
  }
}
```

## 总结

- **日常操作**: 使用`active`权限
- **权限管理**: 使用`owner`权限  
- **合约内部**: 需要`eosio.code`权限
- **动态选择**: 使用权限检查函数自动选择
- **错误处理**: 提供友好的权限错误提示
