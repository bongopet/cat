// 测试升级成本计算
function calculateCatCoinRequirement(quality, level) {
  if (quality < 0 || quality >= 8) {
    throw new Error("Invalid quality");
  }
  if (level <= 0 || level > 100) {
    throw new Error("Invalid level");
  }

  // 品质基础猫币需求 (实际猫币数量)
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

// 测试普通品质猫咪的升级成本
console.log("=== 普通品质猫咪升级成本测试 ===");
for (let level = 1; level <= 10; level++) {
  const cost = calculateCatCoinRequirement(0, level);
  console.log(`升到${level}级需要: ${cost.toFixed(8)} BGCAT`);
}

console.log("\n=== 测试猫咪#1989 (假设为普通品质1级) ===");
const testCat = { id: 1989, level: 1, quality: 0 };
const nextLevelCost = calculateNextLevelCatCoinCost(testCat);
console.log(`猫咪#${testCat.id} 从${testCat.level}级升到${testCat.level + 1}级需要: ${nextLevelCost.toFixed(8)} BGCAT`);

console.log("\n=== 各品质升级到2级的成本 ===");
const qualityNames = ['普通', '精良', '卓越', '非凡', '至尊', '神圣', '永恒', '传世'];
for (let quality = 0; quality < 8; quality++) {
  const cost = calculateCatCoinRequirement(quality, 2);
  console.log(`${qualityNames[quality]}品质升到2级需要: ${cost.toFixed(8)} BGCAT`);
}
