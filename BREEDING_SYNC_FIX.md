# 繁殖数据同步问题修复

## 问题描述
繁殖后猫咪#50和#55被销毁了，但是繁殖页面的缓存数据没有及时更新，所以还显示着已经不存在的猫咪。

## 问题原因
1. **时序问题**：合约操作完成后，前端立即刷新数据，但区块链状态可能还没有完全更新
2. **缓存问题**：繁殖伙伴列表基于旧的猫咪数据计算，没有及时清除无效选择
3. **状态同步**：繁殖模态框中的选择状态没有与最新的猫咪列表同步

## 修复方案

### 1. 延迟刷新机制
在所有合约操作成功后，添加1秒延迟再刷新数据，确保区块链状态已更新：

```javascript
// 繁殖成功后的清理工作
setBreedModalVisible(false);
setSelectedPartner(null);

// 延迟刷新猫咪列表，确保合约状态已更新
setTimeout(() => {
  refreshCats();
}, 1000);
```

### 2. 智能伙伴列表管理
使用 `useMemo` 重新计算繁殖伙伴，确保列表始终基于最新的猫咪数据：

```javascript
const breedingPartners = useMemo(() => {
  if (!selectedCat || !allCats) {
    return [];
  }

  const oppositeGender = selectedCat.gender === 0 ? 1 : 0;
  const partners = allCats.filter(cat =>
    cat.id !== selectedCat.id &&
    cat.gender === oppositeGender &&
    cat.owner === userInfo?.name
  );

  return partners;
}, [selectedCat, allCats, userInfo?.name]);
```

### 3. 自动清除无效选择
监听繁殖伙伴列表变化，自动清除已不存在的选择：

```javascript
useEffect(() => {
  if (selectedPartner && breedingPartners.length > 0) {
    const isPartnerValid = breedingPartners.find(p => p.id === selectedPartner);
    if (!isPartnerValid) {
      console.log('breedingPartners 变化，清除无效的伙伴选择:', selectedPartner);
      setSelectedPartner(null);
    }
  } else if (selectedPartner && breedingPartners.length === 0) {
    console.log('没有可用伙伴，清除选择:', selectedPartner);
    setSelectedPartner(null);
  }
}, [breedingPartners, selectedPartner]);
```

### 4. 繁殖前验证
在执行繁殖操作前，再次验证选择的伙伴是否仍然存在：

```javascript
// 再次检查繁殖伙伴是否仍然存在
const partnerCat = allCats.find(cat => cat.id === selectedPartner);
if (!partnerCat) {
  message.error('选择的繁殖伙伴已不存在，请重新选择');
  setSelectedPartner(null);
  return;
}
```

### 5. 模态框状态管理
- 添加 `destroyOnClose={true}` 确保模态框关闭时重置状态
- 使用 `afterOpenChange` 在模态框打开时验证选择的有效性
- 动态计算确认按钮的禁用状态

## 修复的操作
以下操作都添加了延迟刷新机制：

1. **繁殖猫咪** (`handleBreedCats`)
2. **检查活动** (`handleCheckAction`)
3. **喂养猫咪** (`handleFeedCat`)
4. **升级猫咪** (`handleUpgradeCat`)
5. **DFS喂养** (`handleFeedWithDFS`)
6. **检查交易** (`handleCheckSwap`)
7. **抢图操作** (`handleGrabImage`)

## 测试验证
1. 繁殖两只猫咪，确认父母猫咪被销毁后，繁殖伙伴列表立即更新
2. 在繁殖模态框打开时，验证选择列表只包含有效的猫咪
3. 确认繁殖成功后，页面数据与合约状态一致

## 预期效果
- 繁殖后立即清除已销毁猫咪的选择
- 繁殖伙伴列表实时反映最新的猫咪状态
- 防止用户选择已不存在的猫咪进行繁殖
- 提供更好的用户体验和数据一致性
