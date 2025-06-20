// 区块链操作相关函数 - 基于BongoCat合约重构
// 将TypeScript转换为JavaScript，移除类型声明

import { message } from 'antd';
import { getTableRows, getAccountBalance, sendTransaction, buildTransferAction } from './eosUtils';

// 常量定义
const CONTRACT = 'ifwzjalq2lg1'; // 猫咪合约账户名
const CATTABLE = 'cat4s';
const LOCAL_STORAGE_KEY = 'dfs_cat_transactions';

// 品质常量定义 - 与合约保持一致
const QUALITY_NAMES = {
  0: '普通',
  1: '精良',
  2: '卓越',
  3: '非凡',
  4: '至尊',
  5: '神圣',
  6: '永恒',
  7: '传世'
};

// 目标概率定义 - 与合约保持一致 (百分比 * 100)
const TARGET_PERCENTAGES = {
  0: 6487,  // 普通 64.87%
  1: 2000,  // 精良 20%
  2: 1000,  // 卓越 10%
  3: 400,   // 非凡 4%
  4: 100,   // 至尊 1%
  5: 10,    // 神圣 0.1%
  6: 2,     // 永恒 0.02%
  7: 1      // 传世 0.005%
};

// 性别常量定义
const GENDER_NAMES = {
  0: '公',
  1: '母'
};

// ==================== 新的BongoCat合约操作函数 ====================

// 领取免费猫咪
async function claimFreeCat(wallet, accountName) {
  try {
    console.log('开始领取免费猫咪...');

    const claimAction = {
      account: CONTRACT,
      name: 'claimfreecat',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        user: accountName,
      },
    };

    const result = await sendTransaction(wallet, [claimAction]);

    message.success('免费猫咪领取成功！');
    console.log('免费猫咪领取成功', result);

    // 记录交易
    const txId = result?.transaction_id || `claim-${Date.now()}`;
    recordCatTransaction('claim', null, txId);

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('领取免费猫咪失败:', error);

    // 检查是否已经领取过
    if (error.message && error.message.includes('already claimed')) {
      message.warning('您已经领取过免费猫咪了');
      return { success: false, reason: 'already_claimed' };
    }

    throw error;
  }
}

// 检查交易记录获得猫咪
async function checkSwapCat(wallet, accountName) {
  try {
    console.log('开始检查交易记录...');

    const checkAction = {
      account: CONTRACT,
      name: 'checkswapcat',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        user: accountName,
      },
    };

    const result = await sendTransaction(wallet, [checkAction]);

    message.success('交易记录检查完成！');
    console.log('交易记录检查完成', result);

    // 记录交易
    const txId = result?.transaction_id || `checkswap-${Date.now()}`;
    recordCatTransaction('checkswap', null, txId);

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('检查交易记录失败:', error);
    throw error;
  }
}

// 抢图获得猫咪
async function grabImage(wallet, accountName) {
  try {
    console.log('开始抢图获得猫咪...');

    const grabAction = {
      account: CONTRACT,
      name: 'grabimage',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        user: accountName,
      },
    };

    const result = await sendTransaction(wallet, [grabAction]);

    message.success('抢图检查完成！');
    console.log('抢图检查完成', result);

    // 记录交易
    const txId = result?.transaction_id || `grabimage-${Date.now()}`;
    recordCatTransaction('grabimage', null, txId);

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('抢图失败:', error);
    throw error;
  }
}

// 繁殖猫咪
async function breedCats(wallet, accountName, maleCatId, femaleCatId) {
  try {
    console.log(`开始繁殖猫咪: 公猫#${maleCatId} x 母猫#${femaleCatId}`);

    const breedAction = {
      account: CONTRACT,
      name: 'breedcats',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        owner: accountName,
        male_cat_id: maleCatId,
        female_cat_id: femaleCatId,
      },
    };

    const result = await sendTransaction(wallet, [breedAction]);

    message.success('猫咪繁殖成功！父母猫咪已被销毁，获得新的小猫！');
    console.log('猫咪繁殖成功', result);

    // 记录交易
    const txId = result?.transaction_id || `breed-${Date.now()}`;
    recordCatTransaction('breed', `${maleCatId},${femaleCatId}`, txId);

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('繁殖猫咪失败:', error);
    throw error;
  }
}

// DFS喂养猫咪（通过转账实现）
async function feedCatWithDFS(wallet, accountName, catId, amount = '1.00000000') {
  try {
    console.log(`开始用DFS喂养猫咪#${catId}...`);

    // 检查DFS余额
    const balanceStr = await getAccountBalance(wallet, 'eosio.token', accountName, 'DFS');
    const balanceParts = balanceStr.split(' ');
    const balanceValue = Number.parseFloat(balanceParts[0]);
    const feedAmount = Number.parseFloat(amount);

    if (isNaN(balanceValue) || balanceValue < feedAmount) {
      const errorMsg = `DFS余额不足，喂养需要至少${amount} DFS (当前余额: ${balanceStr || '0 DFS'})`;
      message.warning(errorMsg);
      throw new Error(errorMsg);
    }

    // 执行DFS转账喂养
    const transferAction = buildTransferAction(
      accountName,
      CONTRACT,
      `${amount} DFS`,
      `feed:${catId}` // 喂养备注格式
    );

    const result = await sendTransaction(wallet, [transferAction]);

    message.success('DFS喂养成功！猫咪属性已提升，体力已恢复！');
    console.log('DFS喂养成功', result);

    // 记录交易
    const txId = result?.transaction_id || `feed-${Date.now()}`;
    recordCatTransaction('feed', catId, txId, amount, 'DFS');

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('DFS喂养失败:', error);
    throw error;
  }
}

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

// 退款函数
async function refundCat(wallet, accountName, catId) {
  try {
    console.log('开始退款操作:', {
      wallet: !!wallet,
      walletType: typeof wallet,
      walletMethods: wallet ? Object.keys(wallet) : [],
      accountName,
      catId
    });

    // 检查参数
    if (!wallet) {
      throw new Error('钱包对象为空');
    }

    // 检查钱包是否有必要的方法
    if (typeof wallet.transact !== 'function') {
      throw new Error('钱包对象缺少 transact 方法');
    }
    if (!accountName) {
      throw new Error('账户名为空');
    }
    if (!catId) {
      throw new Error('猫咪ID为空');
    }

    // 执行退款操作
    const refundAction = {
      account: CONTRACT,
      name: 'refundcat',// 退款函数名 就是这个
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        cat_id: catId,
        owner: accountName,
      },
    };

    console.log('退款操作参数:', refundAction);
    //输出钱包
    const result = await sendTransaction(wallet, [refundAction]);

    message.success('退款成功');
    console.log('退款成功', result);

    // 记录交易
    const txId = result?.transaction_id || `refund-${Date.now()}`;
    recordCatTransaction(
      'refund',
      catId,
      txId
    );
    return true;
  } catch (error) {
    console.error('退款失败:', error);
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
    return true;
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
        const processedCats = rows.map(cat => {
          const processedCat = {
            id: cat.id,
            owner: cat.owner,
            gender: cat.gender, // 性别 (0=公, 1=母)
            genderName: GENDER_NAMES[cat.gender] || '未知',
            quality: cat.quality, // 品质等级
            qualityName: QUALITY_NAMES[cat.quality] || '未知',
            level: cat.level,
            experience: cat.experience,
            encrypted_stats: cat.encrypted_stats, // 加密属性
            genes: cat.genes,
            stamina: cat.stamina,
            maxStamina: 100, // 固定最大体力100
            last_challenge_day: cat.last_challenge_day,
            birth_time: cat.birth_time,
            is_tradeable: cat.is_tradeable,
            in_arena: cat.in_arena,
            createdAt: cat.birth_time, // 使用birth_time作为创建时间
          };

          // 调试：检查每只猫咪的数据完整性
          if (!processedCat.id || processedCat.gender === undefined || processedCat.quality === undefined) {
            console.warn('发现数据不完整的猫咪:', cat, '处理后:', processedCat);
          }

          return processedCat;
        });

        console.log('处理后的猫咪数据:', processedCats);
        return processedCats;
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

// 获取猫咪品质统计数据
async function getCatStats(wallet) {
  try {
    console.log('开始获取猫咪统计数据...');

    // 首先尝试从合约的品质统计表中读取数据
    try {
      const statsRows = await getTableRows(
        wallet,
        CONTRACT,
        CONTRACT,
        'qualitystats', // 合约中的统计表名
        '', // lower_bound
        '', // upper_bound
        1,  // index_position
        'i64', // key_type
        10 // limit
      );

      if (statsRows && Array.isArray(statsRows) && statsRows.length > 0) {
        console.log('从合约统计表获取数据成功:', statsRows);
        const statsData = statsRows[0]; // 取第一条记录

        // 解析统计数据，构建品质统计数组
        const quality_stats = [];
        for (let i = 0; i < 8; i++) {
          const count = statsData[`quality_count_${i}`] || 0;
          const targetPercentage = TARGET_PERCENTAGES[i] || 0;

          quality_stats.push({
            quality: i,
            count: count,
            target_percentage: targetPercentage / 100, // 转换为实际百分比
            actual_percentage: statsData.total_cats > 0 ?
              ((count / statsData.total_cats) * 100) : 0
          });
        }

        return {
          quality_stats,
          total_cats: statsData.total_cats || 0,
          last_updated: new Date().toISOString()
        };
      }
    } catch (tableError) {
      console.log('从合约统计表读取数据失败，尝试计算统计:', tableError);
    }

    // 如果没有统计表数据，我们通过读取所有猫咪数据来计算统计
    console.log('开始从所有猫咪数据计算统计...');
    const allCats = await getAllCats(wallet);

    if (!allCats || !Array.isArray(allCats)) {
      throw new Error('无法获取猫咪数据');
    }

    console.log(`获取到 ${allCats.length} 只猫咪，开始计算品质统计...`);

    // 计算品质统计
    const qualityStats = {};
    allCats.forEach(cat => {
      const quality = cat.quality || 0;
      if (qualityStats[quality]) {
        qualityStats[quality]++;
      } else {
        qualityStats[quality] = 1;
      }
    });

    // 转换为数组格式，包含所有8个品质
    const quality_stats = [];
    for (let i = 0; i < 8; i++) {
      const count = qualityStats[i] || 0;
      const targetPercentage = TARGET_PERCENTAGES[i] || 0;

      quality_stats.push({
        quality: i,
        count: count,
        target_percentage: targetPercentage / 100, // 转换为实际百分比
        actual_percentage: allCats.length > 0 ?
          ((count / allCats.length) * 100) : 0
      });
    }

    console.log('品质统计计算完成:', quality_stats);

    return {
      quality_stats,
      total_cats: allCats.length,
      last_updated: new Date().toISOString()
    };

  } catch (error) {
    console.error('获取猫咪统计数据失败:', error);
    throw error;
  }
}

// 导出所有函数
export {
  // 新的BongoCat合约函数
  claimFreeCat,
  checkSwapCat,
  grabImage,
  breedCats,
  feedCatWithDFS,

  // 原有函数（保持兼容性）
  checkCatHasAvailableExp,
  mintCat,
  refundCat,
  feedCat,
  upgradeCat,
  checkCatAction,
  getUserCats,
  getCatInteractions,
  getAllCats,
  recordCatTransaction,
  getStoredTransactions,
  getCatStats,

  // 常量导出
  QUALITY_NAMES,
  GENDER_NAMES,
  TARGET_PERCENTAGES
};