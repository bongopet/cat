// SecureCatStatsManager.js
// 浏览器环境polyfill
if (typeof global === 'undefined') {
    window.global = window;
}

import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import CryptoJS from 'crypto-js';

class SecureCatStatsManager {
    constructor(rpcEndpoint, contractAccount) {
        this.rpc = new JsonRpc(rpcEndpoint);
        this.contractAccount = contractAccount;
        this.statsCache = new Map(); // 缓存属性数据
        this.signatureCache = new Map(); // 缓存签名
    }

    /**
     * 初始化API实例
     */
    initializeApi(privateKeys) {
        const signatureProvider = new JsSignatureProvider(privateKeys);
        this.api = new Api({
            rpc: this.rpc,
            signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder(),
        });
    }

    /**
     * 获取用户所有猫咪的属性
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

            // 生成签名消息
            const timestamp = Math.floor(Date.now() / 1000);
            const message = `decrypt_cats_${ownerAccount}_${timestamp}`;
            
            // 获取用户签名
            const signature = await this.signMessage(message, ownerAccount);

            // 调用合约获取属性
            const result = await this.api.transact({
                actions: [{
                    account: this.contractAccount,
                    name: 'getallmystats',
                    authorization: [{
                        actor: ownerAccount,
                        permission: 'active',
                    }],
                    data: {
                        owner: ownerAccount,
                        user_signature: signature,
                        signed_message: message
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30,
            });

            // 解析返回的属性数据
            const allStats = this.parseAllStatsFromTransaction(result);
            
            // 缓存结果
            this.statsCache.set(cacheKey, {
                data: allStats,
                timestamp: Date.now()
            });
            
            return allStats;

        } catch (error) {
            console.error('获取所有猫咪属性失败:', error);
            throw new Error(`获取猫咪属性失败: ${error.message}`);
        }
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
     * 签名消息
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

            // 计算消息哈希
            const messageHash = this.sha256(message);
            
            // 使用EOS签名
            const signatureProvider = this.api.signatureProvider;
            const chainId = await this.getChainId();
            const requiredKeys = await this.getRequiredKeys(account);
            
            const signatures = await signatureProvider.sign({
                chainId: chainId,
                requiredKeys: requiredKeys,
                serializedTransaction: messageHash,
                abis: []
            });

            const signature = signatures[0];
            
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
     * 从交易结果中解析所有属性数据
     */
    parseAllStatsFromTransaction(transactionResult) {
        try {
            const traces = transactionResult.processed.action_traces;
            
            // 查找allstatsresult action
            for (const trace of traces) {
                if (trace.act.name === 'allstatsresult' && trace.act.account === this.contractAccount) {
                    const data = trace.act.data;
                    return {
                        requestId: data.request_id,
                        owner: data.owner,
                        catsStats: data.all_stats.map(stat => ({
                            catId: stat[0],
                            attack: stat[1],
                            defense: stat[2],
                            health: stat[3],
                            critical: stat[4],
                            dodge: stat[5],
                            luck: stat[6],
                            totalPower: stat[7],
                            timestamp: Math.floor(Date.now() / 1000)
                        }))
                    };
                }
            }
            
            throw new Error('未找到属性数据');

        } catch (error) {
            console.error('解析交易结果失败:', error);
            throw new Error(`解析交易结果失败: ${error.message}`);
        }
    }

    /**
     * 批量获取多个用户的猫咪属性（管理员功能）
     */
    async getBatchUsersStats(userAccounts) {
        const results = [];
        const batchSize = 2; // 限制并发数量
        
        for (let i = 0; i < userAccounts.length; i += batchSize) {
            const batch = userAccounts.slice(i, i + batchSize);
            const batchPromises = batch.map(account => 
                this.getAllMyCatStats(account).catch(error => ({
                    account,
                    error: error.message
                }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // 批次间延迟，避免过于频繁的请求
            if (i + batchSize < userAccounts.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        return results;
    }

    /**
     * 清理过期的查询请求
     */
    async cleanExpiredRequests(ownerAccount) {
        try {
            await this.api.transact({
                actions: [{
                    account: this.contractAccount,
                    name: 'cleanreqs',
                    authorization: [{
                        actor: ownerAccount,
                        permission: 'active',
                    }],
                    data: {
                        owner: ownerAccount
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30,
            });

        } catch (error) {
            console.error('清理过期请求失败:', error);
        }
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
     * 辅助函数
     */
    sha256(message) {
        return CryptoJS.SHA256(message).toString();
    }

    async getChainId() {
        const info = await this.rpc.get_info();
        return info.chain_id;
    }

    async getRequiredKeys(account) {
        const accountInfo = await this.rpc.get_account(account);
        return accountInfo.permissions
            .filter(perm => perm.perm_name === 'active')
            .map(perm => perm.required_auth.keys[0].key);
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
}

export default SecureCatStatsManager;
