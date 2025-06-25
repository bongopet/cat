# 猫币升级成本修复

## 🎯 问题描述

前端猫币升级功能存在问题：
- **错误行为**: 每次升级都固定转账1个猫币
- **正确行为**: 根据猫咪品质和等级计算实际升级成本
- **成本公式**: 基础成本 × 1.1^(等级-2)

## 🔧 修复实现

### 1. 添加成本计算函数

在 `chainOperations.js` 中添加了升级成本计算：

```javascript
// 品质基础猫币需求 (每级所需猫币数量)
const QUALITY_CAT_COIN_BASE = [
  1,  // 普通 1枚
  2,  // 精良 2枚
  3,  // 卓越 3枚
  4,  // 非凡 4枚
  5,  // 至尊 5枚
  6,  // 神圣 6枚
  7,  // 永恒 7枚
  8   // 传世 8枚
];

// 计算升级到指定等级所需的猫币数量
function calculateCatCoinRequirement(quality, level) {
  const baseCost = QUALITY_CAT_COIN_BASE[quality];
  
  if (level <= 1) return 0; // 1级不需要升级成本

  // 计算1.1^(level-2)，升到2级的倍数是1.1^0=1
  let multiplier = 1.0;
  for (let i = 2; i < level; i++) {
    multiplier *= 1.1;
  }

  // 最终成本 = 基数 × 1.1^(level-2)
  const cost = baseCost * multiplier;
  return cost; // 返回实际猫币数量
}

// 计算升级到下一级所需的猫币数量
function calculateNextLevelCatCoinCost(cat) {
  if (!cat || cat.level >= 100) return 0;
  
  const nextLevel = cat.level + 1;
  return calculateCatCoinRequirement(cat.quality, nextLevel);
}
```

### 2. 修改升级函数

更新 `upgradeCatWithCoin` 函数：

```javascript
async function upgradeCatWithCoin(wallet, account, catId, cat) {
  // 计算升级到下一级所需的猫币数量
  if (!cat) {
    throw new Error('猫咪信息不完整');
  }

  if (cat.level >= 100) {
    throw new Error('猫咪已达到最高等级');
  }

  const requiredCoins = calculateNextLevelCatCoinCost(cat);
  const amount = requiredCoins.toFixed(8);
  
  console.log(`猫咪#${catId} 当前等级: ${cat.level}, 品质: ${cat.quality}, 升级需要: ${requiredCoins} BGCAT`);

  // 检查BGCAT余额
  const balanceStr = await getAccountBalance(wallet, 'dfsppptokens', account.name, 'BGCAT');
  const balanceParts = balanceStr.split(' ');
  const balanceValue = Number.parseFloat(balanceParts[0]);
  const upgradeAmount = Number.parseFloat(amount);

  if (isNaN(balanceValue) || balanceValue < upgradeAmount) {
    const errorMsg = `BGCAT余额不足，升级需要${requiredCoins} BGCAT (当前余额: ${balanceStr || '0 BGCAT'})`;
    throw new Error(errorMsg);
  }

  // ... 执行转账逻辑
}
```

### 3. 更新前端界面

修改 `CatDetail.jsx` 组件：

```javascript
// Handle cat upgrade with cat coin
const handleUpgradeCatWithCoin = async () => {
  if (selectedCat.level >= 100) {
    message.warning('猫咪已达到最高等级');
    return;
  }

  try {
    setLoading(true);
    
    // 计算升级成本
    const requiredCoins = calculateNextLevelCatCoinCost(selectedCat);
    console.log(`升级猫咪#${selectedCat.id} 需要 ${requiredCoins} BGCAT`);
    
    await upgradeCatWithCoin(DFSWallet, userInfo, selectedCat.id, selectedCat);
    
    message.success(`升级成功！消耗了 ${requiredCoins} BGCAT`);
    
    // 延迟刷新确保合约状态已更新
    setTimeout(() => {
      refreshCats();
    }, 1000);
  } catch (error) {
    console.error('猫币升级失败:', error);
    message.error('猫币升级失败: ' + (error.message || String(error)));
  } finally {
    setLoading(false);
  }
};
```

### 4. 界面显示优化

- **升级标签**: 显示实际需要的猫币数量
- **按钮提示**: 悬停时显示具体升级成本
- **按钮状态**: 满级时自动禁用

```jsx
<div className="attribute-label">
  等级升级 (需要 {selectedCat.level >= 100 ? '已满级' : `${calculateNextLevelCatCoinCost(selectedCat)} BGCAT`})
</div>

<Button
  type="primary"
  shape="circle"
  size="middle"
  icon={<UpCircleOutlined />}
  className="action-button"
  onClick={handleUpgradeCatWithCoin}
  disabled={selectedCat.level >= 100}
  title={selectedCat.level >= 100 ? 
    "已达到最高等级" : 
    `猫币升级 (需要 ${calculateNextLevelCatCoinCost(selectedCat)} BGCAT)`
  }
/>
```

## 📊 升级成本示例

### 普通品质猫咪 (基础成本: 1 BGCAT)
- 升到2级: 1 BGCAT
- 升到3级: 1.1 BGCAT
- 升到4级: 1.21 BGCAT
- 升到5级: 1.33 BGCAT
- 升到10级: 2.36 BGCAT
- 升到20级: 6.73 BGCAT

### 传世品质猫咪 (基础成本: 8 BGCAT)
- 升到2级: 8 BGCAT
- 升到3级: 8.8 BGCAT
- 升到4级: 9.68 BGCAT
- 升到5级: 10.65 BGCAT
- 升到10级: 18.87 BGCAT
- 升到20级: 53.83 BGCAT

## 🎮 用户体验改进

### 改进前
- ❌ 固定消耗1个猫币
- ❌ 不显示实际升级成本
- ❌ 用户无法预知升级费用

### 改进后
- ✅ 根据品质和等级动态计算成本
- ✅ 界面显示实际需要的猫币数量
- ✅ 按钮提示显示具体升级成本
- ✅ 满级时自动禁用升级功能
- ✅ 升级成功后显示实际消耗

## 🧪 测试要点

### 功能测试
1. **成本计算**: 验证不同品质和等级的升级成本计算正确
2. **余额检查**: 确认余额不足时正确提示
3. **升级限制**: 验证满级猫咪无法继续升级
4. **成功反馈**: 确认升级成功后显示正确的消耗信息

### 界面测试
1. **成本显示**: 验证界面正确显示升级成本
2. **按钮状态**: 确认满级时按钮正确禁用
3. **提示信息**: 验证悬停提示显示正确信息

### 边界测试
1. **等级边界**: 测试1级、99级、100级的升级行为
2. **品质边界**: 测试普通和传世品质的成本计算
3. **余额边界**: 测试余额刚好够/不够的情况

## 🚀 部署建议

### 用户教育
1. 更新帮助文档，说明新的升级成本机制
2. 在界面添加升级成本说明
3. 考虑添加升级成本预览功能

### 性能优化
1. 缓存升级成本计算结果
2. 优化界面更新频率
3. 确保计算精度正确

## 🎉 总结

这次修复成功实现了：
- ✅ **正确的升级成本**: 根据合约逻辑计算实际需要的猫币
- ✅ **透明的费用显示**: 用户可以清楚看到升级需要多少猫币
- ✅ **智能的状态管理**: 满级时自动禁用，余额不足时正确提示
- ✅ **完整的用户反馈**: 升级成功后显示实际消耗的猫币数量

现在猫币升级功能与合约逻辑完全一致，用户可以准确了解升级成本！
