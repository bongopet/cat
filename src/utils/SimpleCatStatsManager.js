// SimpleCatStatsManager.js - 简化版本，避免复杂依赖
import CryptoJS from 'crypto-js';

class SimpleCatStatsManager {
    constructor(rpcEndpoint, contractAccount) {
        this.rpcEndpoint = rpcEndpoint;
        this.contractAccount = contractAccount;
        this.statsCache = new Map(); // 缓存属性数据
        this.signatureCache = new Map(); // 缓存签名
    }

    /**
     * 模拟获取用户所有猫咪的属性（演示版本）
     */
    async getAllMyCatStats(ownerAccount) {
        try {
            // 检查缓存
            const cacheKey = `${ownerAccount}_all_stats`;
            const cached = this.statsCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < 60000) { // 1分钟缓存
                console.log('使用缓存的属性数据');
                return cached.data;
            }

            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 生成模拟数据
            const mockStats = this.generateMockStats(ownerAccount);
            
            // 缓存结果
            this.statsCache.set(cacheKey, {
                data: mockStats,
                timestamp: Date.now()
            });
            
            return mockStats;

        } catch (error) {
            console.error('获取所有猫咪属性失败:', error);
            throw new Error(`获取猫咪属性失败: ${error.message}`);
        }
    }

    /**
     * 生成模拟的猫咪属性数据
     */
    generateMockStats(ownerAccount) {
        // 基于用户账户生成确定性的随机数种子
        const seed = this.hashCode(ownerAccount);
        const random = this.seededRandom(seed);
        
        // 生成1-5只猫咪
        const catCount = Math.floor(random() * 5) + 1;
        const catsStats = [];

        for (let i = 0; i < catCount; i++) {
            const catId = i + 1;
            const level = Math.floor(random() * 10) + 1;
            
            // 基于等级生成属性
            const baseAttack = Math.floor(random() * 200) + level * 10;
            const baseDefense = Math.floor(random() * 200) + level * 8;
            const baseHealth = Math.floor(random() * 500) + level * 20;
            const baseCritical = Math.floor(random() * 100) + level * 3;
            const baseDodge = Math.floor(random() * 100) + level * 3;
            const baseLuck = Math.floor(random() * 100) + level * 2;

            // 计算总战斗力
            const totalPower = this.calculateBattlePower(
                baseAttack, baseDefense, baseHealth, 
                baseCritical, baseDodge, baseLuck, level
            );

            catsStats.push({
                catId: catId,
                attack: baseAttack,
                defense: baseDefense,
                health: baseHealth,
                critical: baseCritical,
                dodge: baseDodge,
                luck: baseLuck,
                totalPower: totalPower,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }

        return {
            requestId: Date.now(),
            owner: ownerAccount,
            catsStats: catsStats
        };
    }

    /**
     * 获取单只猫咪的属性
     */
    async getSingleCatStats(catId, ownerAccount) {
        try {
            // 先尝试从批量数据中获取
            const allStats = await this.getAllMyCatStats(ownerAccount);
            const catStats = allStats.catsStats.find(stat => stat.catId === catId);
            
            if (catStats) {
                return catStats;
            }
            
            throw new Error(`Cat ${catId} not found in user's collection`);

        } catch (error) {
            console.error('获取单只猫咪属性失败:', error);
            throw error;
        }
    }

    /**
     * 模拟签名消息
     */
    async signMessage(message, account) {
        try {
            // 检查签名缓存
            const signCacheKey = `${account}_${Math.floor(Date.now() / 60000)}`; // 1分钟缓存
            if (this.signatureCache.has(signCacheKey)) {
                const cached = this.signatureCache.get(signCacheKey);
                if (message.startsWith(cached.prefix)) {
                    return cached.signature;
                }
            }

            // 模拟签名过程
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 生成模拟签名
            const signature = this.generateMockSignature(message, account);
            
            // 缓存签名
            this.signatureCache.set(signCacheKey, {
                signature: signature,
                prefix: message.substring(0, message.lastIndexOf('_') + 1),
                timestamp: Date.now()
            });

            return signature;

        } catch (error) {
            console.error('签名失败:', error);
            throw new Error(`签名失败: ${error.message}`);
        }
    }

    /**
     * 生成模拟签名
     */
    generateMockSignature(message, account) {
        const hash = CryptoJS.SHA256(message + account).toString();
        return `SIG_K1_${hash.substring(0, 50)}`;
    }

    /**
     * 清理本地缓存
     */
    clearCache() {
        this.statsCache.clear();
        this.signatureCache.clear();
    }

    /**
     * 获取缓存统计信息
     */
    getCacheStats() {
        return {
            statsCache: this.statsCache.size,
            signatureCache: this.signatureCache.size,
            totalMemory: JSON.stringify([...this.statsCache.values(), ...this.signatureCache.values()]).length
        };
    }

    /**
     * 计算战斗力
     */
    calculateBattlePower(attack, defense, health, critical, dodge, luck, level) {
        // 基础战斗力计算
        const basePower = (attack * 3) + (defense * 3) + (health / 2) + 
                         (critical * 2) + (dodge * 2) + luck;
        
        // 等级加成
        const levelBonus = level * 15;
        
        return Math.floor(basePower + levelBonus);
    }

    /**
     * 计算属性等级
     */
    getAttributeRank(value, type) {
        const thresholds = {
            attack: [50, 100, 200, 350, 500, 700, 900, 1000],
            defense: [50, 100, 200, 350, 500, 700, 900, 1000],
            health: [100, 200, 500, 800, 1200, 1800, 2500, 3000],
            critical: [20, 40, 70, 100, 140, 180, 220, 250],
            dodge: [20, 40, 70, 100, 140, 180, 220, 250],
            luck: [20, 40, 70, 100, 140, 180, 220, 250]
        };

        const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];
        const typeThresholds = thresholds[type] || thresholds.attack;

        for (let i = 0; i < typeThresholds.length; i++) {
            if (value <= typeThresholds[i]) {
                return ranks[i];
            }
        }
        return ranks[ranks.length - 1];
    }

    /**
     * 获取等级颜色
     */
    getAttributeColor(rank) {
        const colors = {
            'F': '#d9d9d9',
            'E': '#52c41a',
            'D': '#1890ff',
            'C': '#722ed1',
            'B': '#eb2f96',
            'A': '#fa8c16',
            'S': '#f5222d',
            'SS': '#fadb14'
        };
        return colors[rank] || colors['F'];
    }

    /**
     * 辅助函数：字符串哈希
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash);
    }

    /**
     * 辅助函数：种子随机数生成器
     */
    seededRandom(seed) {
        let currentSeed = seed;
        return function() {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    }

    /**
     * 模拟清理过期请求
     */
    async cleanExpiredRequests(ownerAccount) {
        try {
            console.log(`模拟清理 ${ownerAccount} 的过期请求`);
            await new Promise(resolve => setTimeout(resolve, 200));
            return true;
        } catch (error) {
            console.error('清理过期请求失败:', error);
            return false;
        }
    }
}

export default SimpleCatStatsManager;
