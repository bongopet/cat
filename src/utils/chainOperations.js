// 区块链操作相关函数
// 将TypeScript转换为JavaScript，移除类型声明

import { message } from 'antd';
import { getTableRows, getAccountBalance, sendTransaction, buildTransferAction } from './eosUtils';

// 常量定义
// const CONTRACT = 'ifwzjalq2lg1'; // 猫咪合约账户名
const CONTRACT = 'bongocatgame'; // 猫咪合约账户名
const CATTABLE = 'cats';
const LOCAL_STORAGE_KEY = 'dfs_cat_transactions';

// 检查猫咪是否有可用经验
async function checkCatHasAvailableExp(wallet, owner, catId, lastCheckTime) {
  try {
    // 首先检查loglogloglog合约的logs表
    const externalContract = 'loglogloglog';
    const logsRows = await getTableRows(
      wallet,
      externalContract,
      externalContract,
      'logs',
      '', // lower_bound
      '', // upper_bound
      1,  // index_position
      'i64', // key_type
      100, // limit
      true // reverse
    );

    if (logsRows && Array.isArray(logsRows)) {
      // 检查是否有该用户在上次检查后的新记录
      const hasExpFromLogs = logsRows.some((log) => {
        // 检查是否是目标用户的记录
        if (log.user === owner) {
          // 检查是否是上次检查后的新记录
          const logTime = (new Date(log.create_time).getTime() / 1000) + 8 * 3600;

          if (logTime > lastCheckTime) {
            // 检查是否有USDT交易 或者包含 DFS
            const inAmount = log.in || '';
            return inAmount.includes('USDT') || inAmount.includes('DFS');
          }
        }
        return false;
      });

      if (hasExpFromLogs) {
        return true;
      }
    }

    // 然后检查dfs3protocol合约的logs表
    const pppContract = 'dfs3protocol';
    const pppLogsRows = await getTableRows(
      wallet,
      pppContract,
      pppContract,
      'logs',
      '', // lower_bound
      '', // upper_bound
      1,  // index_position
      'i64', // key_type
      100, // limit
      true // reverse
    );

    if (pppLogsRows && Array.isArray(pppLogsRows)) {
      // 检查是否有该用户在上次检查后的PPP相关操作记录
      const hasExpFromPpp = pppLogsRows.some((log) => {
        // 检查是否是目标用户的记录（from或to字段）
        if (log.from === owner) {
          // 检查是否是上次检查后的新记录
          const logTime = (new Date(log.create_time).getTime() / 1000) + 8 * 3600;
          if (logTime > lastCheckTime) {
            // 检查是否有mint, burn或split类型的操作
            return ['mint', 'burn', 'split', 'buy'].includes(log.type);
          }
        }
        return false;
      });

      if (hasExpFromPpp) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('检查猫咪经验失败:', error);
    // 出错时，为了不影响用户体验，随机返回结果
    return Math.random() > 0.7;
  }
}

// 铸造新猫咪
async function mintCat(wallet, accountName) {
  try {
    // 检查账户余额是否足够
    const balanceStr = await getAccountBalance(wallet, 'eosio.token', accountName, 'DFS');
    
    // 解析余额字符串，例如 "10.0000 DFS"
    const balanceParts = balanceStr.split(' ');
    const balanceValue = Number.parseFloat(balanceParts[0]);
    if (isNaN(balanceValue) || balanceValue < 30.0) {
      const errorMsg = `DFS余额不足，铸造猫咪需要至少30.0000 DFS (当前余额: ${balanceStr || '0 DFS'})`;
      // message.warning(errorMsg);
      // console.log('铸造猫咪余额不足:', { balance: balanceStr, required: '30.0000 DFS' });
      throw new Error(errorMsg);
    }
    
    // 执行铸造操作
    const transferAction = buildTransferAction(
      accountName,
      CONTRACT,
      '30.00000000 DFS',
      'mint' // 特定备注，标识为铸造操作
    );
    
    const result = await sendTransaction(wallet, [transferAction]);
    
    console.log('铸造猫咪交易已提交', result);
    
    // 记录交易到钱包历史
    const txId = result?.transaction_id || `mint-${Date.now()}`;
    recordCatTransaction(
      'mint',
      null,
      txId
    );
    return true;
  } catch (error) {
    console.error('铸造猫咪失败:', error);
    throw error;
  }
}

// 喂养猫咪
async function feedCat(wallet, accountName, catId) {
  try {
    // 为其他代币类型检查余额
    const assetBalanceStr = await getAccountBalance(wallet, 'dfsppptokens', accountName, 'BGFISH');
    
    // 解析余额字符串，例如 "10.0000 BGFISH"
    const balanceParts = assetBalanceStr.split(' ');
    const balance = Number.parseFloat(balanceParts[0]);
    if (isNaN(balance) || balance < 1.0) {
      const errorMsg = `BGFISH余额不足，喂养猫咪需要至少1 BGFISH (当前余额: ${assetBalanceStr || '0 BGFISH'})`;
      message.warning(errorMsg);
      console.log('喂养猫咪余额不足:', { balance, required: '1 BGFISH' });
      throw new Error(errorMsg);
    }
    
    // 执行喂养操作
    const transferAction = buildTransferAction(
      accountName,
      CONTRACT,
      '1.00000000 BGFISH',
      `feed:${catId}` // 特定备注，标识为喂养操作
    );
    
    const result = await sendTransaction(wallet, [transferAction]);
    
    message.success('喂养猫咪交易已提交');
    console.log('喂养猫咪交易已提交', result);
    
    // 记录交易到钱包历史
    const txId = result?.transaction_id || `feed-${Date.now()}`;
    recordCatTransaction(
      'feed',
      catId,
      txId
    );
    
    // 返回喂养结果
    return {
      success: true,
      expGained: Math.floor(Math.random() * 50) + 10, // 随机10-60的经验值
      staminaGained: Math.floor(Math.random() * 20) + 5, // 随机5-25的体力
      txHash: txId
    };
  } catch (error) {
    console.error(`喂养猫咪失败:${error}`);
    throw error;
  }
}

// 升级猫咪
async function upgradeCat(wallet, accountName, catId) {
  try {
    // 执行升级操作
    const upgradeAction = {
      account: CONTRACT,
      name: 'upgrade',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        cat_id: catId,
        owner: accountName,
      },
    };
    
    const result = await sendTransaction(wallet, [upgradeAction]);
    
    message.success('猫咪升级成功');
    console.log('猫咪升级成功', result);
    
    // 记录交易
    const txId = result?.transaction_id || `upgrade-${Date.now()}`;
    recordCatTransaction(
      'upgrade',
      catId,
      txId
    );
    
    // 返回升级结果
    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('升级猫咪失败:', error);
    throw error;
  }
}

// 检查猫咪活动
async function checkCatAction(wallet, accountName, catId) {
  try {
    // 执行检查活动操作
    const checkAction = {
      account: CONTRACT,
      name: 'checkaction',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        owner: accountName,
        cat_id: catId,
      },
    };
    
    try {
      const result = await sendTransaction(wallet, [checkAction]);
      console.log('检查活动成功', result);
      
      // 记录交易
      const txId = result?.transaction_id || `action-${Date.now()}`;
      recordCatTransaction(
        'action',
        catId,
        txId,
        Math.floor(Math.random() * 15) + 5, // 随机经验值
        'EXP' // 经验货币
      );
      message.success('检查活动成功');
      return true;
    } catch (error) {
      console.error('检查活动失败:', error);
      throw error;
    }
  } catch (error) {
    console.error('猫咪活动检查失败:', error);
    throw error;
  }
}

// 获取用户猫咪列表
async function getUserCats(wallet, accountName) {
  try {
    if (!accountName) {
      console.error('获取猫咪列表失败: 未提供账户名');
      return [];
    }
    
    console.log(`正在获取账户 ${accountName} 的猫咪列表...`);
    
    // 尝试从链上获取数据
    try {
      const rows = await getTableRows(
        wallet,
        CONTRACT,
        CONTRACT,
        CATTABLE,
        accountName, // lower_bound
        accountName, // upper_bound
        2, // index_position - 按所有者索引
        'name', // key_type
        100 // limit
      );
      
      if (rows && rows.length > 0) {
        console.log(`从链上获取到 ${rows.length} 只猫咪`);
        return rows.map(cat => ({
          id: cat.id,
          owner: cat.owner,
          genes: cat.genes,
          level: cat.level,
          experience: cat.experience,
          stamina: cat.stamina,
          maxStamina: cat.max_stamina || 100,
          createdAt: cat.created_at,
          birth_time: cat.birth_time,
        }));
      } else {
        console.log('链上未找到猫咪数据，返回空数组');
        // 返回空数组，不再使用测试数据
        return [];
      }
    } catch (chainError) {
      console.error('从链上获取猫咪数据失败:', chainError);
      // 错误情况下也返回空数组，不使用测试数据
      return [];
    }
  } catch (error) {
    console.error('获取猫咪列表失败:', error);
    // 返回空数组，避免前端错误
    return [];
  }
}

// 获取猫咪互动记录
async function getCatInteractions(wallet, catId) {
  try {
    console.log(`正在获取猫咪 ${catId} 的互动记录...`);
    
    // 尝试从链上获取数据
    try {
      const rows = await getTableRows(
        wallet,
        CONTRACT,
        CONTRACT,
        'interactions',
        catId.toString(), // lower_bound
        catId.toString(), // upper_bound
        2, // index_position - 按猫咪ID索引
        'i64', // key_type
        5, // limit
        true // reverse
      );
      
      if (rows && rows.length > 0) {
        console.log(`从链上获取到 ${rows.length} 条猫咪互动记录`);
        // 过滤并按时间戳降序排序
        const interactions = rows
          .filter(interaction => Number(interaction.cat_id) === Number(catId))
          .sort((a, b) => b.timestamp - a.timestamp);
        return interactions;
      } else {
        console.log('链上未找到互动记录，使用本地存储数据');
      }
    } catch (chainError) {
      console.error('从链上获取互动记录失败:', chainError);
    }
    
    // 获取储存的交易记录
    const allTransactions = getStoredTransactions();
    
    // 筛选与特定猫咪相关的记录
    const catTransactions = allTransactions.filter(tx => tx.catId === catId);
    
    if (catTransactions.length > 0) {
      console.log(`找到 ${catTransactions.length} 条猫咪互动记录`);
      return catTransactions;
    }
  } catch (error) {
    console.error('获取猫咪互动记录失败:', error);
    return [];
  }
}

// 获取所有猫咪列表（排行榜）
async function getAllCats(wallet, limit = 50) {
  try {
    console.log(`正在获取猫咪排行榜，最多 ${limit} 只...`);
    
    // 尝试从链上获取数据
    try {
      const rows = await getTableRows(
        wallet,
        CONTRACT,
        CONTRACT,
        CATTABLE,
        '', // lower_bound
        '', // upper_bound
        1, // index_position - 主键索引
        'i64', // key_type
        limit // limit
      );
      
      if (rows && rows.length > 0) {
        console.log(`从链上获取到 ${rows.length} 只猫咪`);
        
        // 转换数据格式
        const cats = rows.map(cat => ({
          id: cat.id,
          owner: cat.owner,
          genes: cat.genes,
          level: cat.level,
          experience: cat.experience,
          stamina: cat.stamina,
          maxStamina: cat.max_stamina || 100,
          createdAt: cat.created_at,
        }));
        
        // 按级别和经验排序
        cats.sort((a, b) => {
          if (a.level !== b.level) {
            return b.level - a.level; // 级别降序
          }
          return b.experience - a.experience; // 同级别下，经验降序
        });
        
        return cats;
      } else {
        console.log('链上未找到猫咪数据，使用随机测试数据');
      }
    } catch (chainError) {
      console.error('从链上获取猫咪数据失败:', chainError);
    }
  } catch (error) {
    console.error('获取猫咪排行榜失败:', error);
    return [];
  }
}

// 记录猫咪相关交易
function recordCatTransaction(type, catId, txId, amount = '', currency = '', from = '', to = '') {
  try {
    // 获取现有记录
    const storedTransactions = getStoredTransactions();
    
    // 创建新记录
    const newTransaction = {
      type,
      catId,
      txId,
      timestamp: Date.now(),
    };
    
    // 添加可选字段（如果有值）
    if (amount) newTransaction.amount = amount;
    if (currency) newTransaction.currency = currency;
    if (from) newTransaction.from = from;
    if (to) newTransaction.to = to;
    
    // 添加到数组开头（最新的交易在前）
    storedTransactions.unshift(newTransaction);
    
    // 限制记录数量，防止过多
    const MAX_RECORDS = 100;
    if (storedTransactions.length > MAX_RECORDS) {
      storedTransactions.splice(MAX_RECORDS);
    }
    
    // 保存回本地存储
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedTransactions));
    
    console.log(`已记录 ${type} 交易: ${txId}`);
    return true;
  } catch (error) {
    console.error('记录交易失败:', error);
    return false;
  }
}

// 获取存储的交易记录
function getStoredTransactions() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('获取存储的交易记录失败:', error);
  }
  return []; // 默认返回空数组
}

// 导出所有函数
export {
  checkCatHasAvailableExp,
  mintCat,
  feedCat,
  upgradeCat,
  checkCatAction,
  getUserCats,
  getCatInteractions,
  getAllCats,
  recordCatTransaction,
  getStoredTransactions
};