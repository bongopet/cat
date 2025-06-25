#!/usr/bin/env node

/**
 * 测试属性解密函数
 */

// 解密猫咪属性 (基于合约的加密逻辑)
function decryptCatStats(encryptedStats, catId) {
  console.log('输入参数:', { encryptedStats, catId });
  
  // 将字符串转换为BigInt进行64位运算
  const encrypted = BigInt(encryptedStats);
  const id = BigInt(catId);
  
  console.log('转换后:', { encrypted: encrypted.toString(), id: id.toString() });
  
  // 使用与合约相同的密钥
  const key = id ^ BigInt('0x123456789ABCDEF0');
  console.log('密钥:', key.toString(16));
  
  const stats = encrypted ^ key;
  console.log('解密后的stats:', stats.toString(16));
  
  // 按照合约的位运算提取各属性
  const attack = Number((stats >> BigInt(54)) & BigInt(0x3FF));    // 10位攻击
  const defense = Number((stats >> BigInt(44)) & BigInt(0x3FF));   // 10位防御
  const health = Number((stats >> BigInt(32)) & BigInt(0xFFF));    // 12位血量
  const critical = Number((stats >> BigInt(24)) & BigInt(0xFF));   // 8位暴击
  const dodge = Number((stats >> BigInt(16)) & BigInt(0xFF));      // 8位闪避
  const luck = Number((stats >> BigInt(8)) & BigInt(0xFF));        // 8位幸运
  
  console.log('提取的属性:', { attack, defense, health, critical, dodge, luck });
  
  return {
    attack,
    defense,
    health,
    critical,
    dodge,
    luck
  };
}

// 测试用例 - 使用猫咪#1989的数据
const testCat = {
  id: 1989,
  encrypted_stats: "2139885574208804149"
};

console.log('=== 测试猫咪属性解密 ===');
console.log(`猫咪ID: ${testCat.id}`);
console.log(`加密属性: ${testCat.encrypted_stats}`);

const decryptedStats = decryptCatStats(testCat.encrypted_stats, testCat.id);

console.log('\n=== 解密结果 ===');
console.log(`攻击力: ${decryptedStats.attack}`);
console.log(`防御力: ${decryptedStats.defense}`);
console.log(`生命值: ${decryptedStats.health}`);
console.log(`暴击率: ${decryptedStats.critical}`);
console.log(`闪避率: ${decryptedStats.dodge}`);
console.log(`幸运值: ${decryptedStats.luck}`);

const totalPower = decryptedStats.attack + decryptedStats.defense + decryptedStats.health + 
                  decryptedStats.critical + decryptedStats.dodge + decryptedStats.luck;
console.log(`总战力: ${totalPower}`);

// 验证合理性
console.log('\n=== 合理性检查 ===');
console.log(`攻击力范围 (0-1023): ${decryptedStats.attack >= 0 && decryptedStats.attack <= 1023 ? '✅' : '❌'}`);
console.log(`防御力范围 (0-1023): ${decryptedStats.defense >= 0 && decryptedStats.defense <= 1023 ? '✅' : '❌'}`);
console.log(`生命值范围 (0-4095): ${decryptedStats.health >= 0 && decryptedStats.health <= 4095 ? '✅' : '❌'}`);
console.log(`暴击率范围 (0-255): ${decryptedStats.critical >= 0 && decryptedStats.critical <= 255 ? '✅' : '❌'}`);
console.log(`闪避率范围 (0-255): ${decryptedStats.dodge >= 0 && decryptedStats.dodge <= 255 ? '✅' : '❌'}`);
console.log(`幸运值范围 (0-255): ${decryptedStats.luck >= 0 && decryptedStats.luck <= 255 ? '✅' : '❌'}`);

// 测试不同的解密方法
console.log('\n=== 尝试不同的解密方法 ===');

// 方法2: 不使用密钥
console.log('方法2: 直接解析 (无密钥)');
const stats2 = BigInt(testCat.encrypted_stats);
const attack2 = Number((stats2 >> BigInt(54)) & BigInt(0x3FF));
const defense2 = Number((stats2 >> BigInt(44)) & BigInt(0x3FF));
const health2 = Number((stats2 >> BigInt(32)) & BigInt(0xFFF));
console.log(`无密钥解密: 攻击=${attack2}, 防御=${defense2}, 血量=${health2}`);

// 方法3: 简单XOR
console.log('方法3: 简单XOR');
const simpleKey = BigInt(testCat.id);
const stats3 = BigInt(testCat.encrypted_stats) ^ simpleKey;
const attack3 = Number((stats3 >> BigInt(54)) & BigInt(0x3FF));
const defense3 = Number((stats3 >> BigInt(44)) & BigInt(0x3FF));
const health3 = Number((stats3 >> BigInt(32)) & BigInt(0xFFF));
console.log(`简单XOR解密: 攻击=${attack3}, 防御=${defense3}, 血量=${health3}`);

console.log('\n=== 测试完成 ===');
