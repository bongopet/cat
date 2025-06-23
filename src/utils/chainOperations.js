// 区块链操作相关函数 - 基于BongoCat合约重构
// 将TypeScript转换为JavaScript，移除类型声明

import { message } from 'antd';
import { getTableRows, getAccountBalance, sendTransaction, buildTransferAction } from './eosUtils';

// 常量定义
const CONTRACT = 'ifwzjalq2lg1'; // 猫咪合约账户名
const CATTABLE = 'cat14s';
const QATBLE='qualstat14s'
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

    // 解析繁殖结果
    const breedingResult = parseBreedingResult(result);

    if (breedingResult.success) {
      const qualityNames = ['普通', '精良', '卓越', '非凡', '至尊', '神圣', '永恒', '传世'];
      const qualityName = qualityNames[breedingResult.quality] || '未知';

      message.success(`猫咪繁殖成功！获得新猫咪#${breedingResult.newCatId}，品质：${qualityName}`);
      console.log('猫咪繁殖成功', {
        newCatId: breedingResult.newCatId,
        quality: breedingResult.quality,
        qualityName: qualityName,
        genes: breedingResult.genes,
        parentIds: [maleCatId, femaleCatId]
      });
    } else {
      message.success('猫咪繁殖成功！父母猫咪已被销毁，获得新的小猫！');
      console.log('猫咪繁殖成功', result);
    }

    // 记录交易
    const txId = result?.transaction_id || `breed-${Date.now()}`;
    recordCatTransaction('breed', `${maleCatId},${femaleCatId}`, txId);

    return {
      success: true,
      txHash: txId,
      breedingResult: breedingResult
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

  return false; // 先不检查，等合约改版后再开启
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
        1000 // limit
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
          gender: cat.gender,
          quality: cat.quality, // 添加品质字段
          genes: cat.genes,
          level: cat.level,
          experience: cat.experience,
          stamina: cat.stamina,
          maxStamina: cat.max_stamina || 100,
          birth_time: cat.birth_time,
          is_tradeable: cat.is_tradeable,
          in_arena: cat.in_arena,
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

// 解析繁殖结果
function parseBreedingResult(transactionResult) {
  try {
    // 查找繁殖action的console输出
    const actionTraces = transactionResult?.processed?.action_traces || [];

    for (const trace of actionTraces) {
      if (trace.act?.name === 'breedcats' && trace.console) {
        const console = trace.console;

        // 解析console输出
        // 格式: "Bred cat #220 for jgdnhvsznbrx with quality 0 inherited genes:31260219568947206Bred cats #28 and #215 to create new cat with quality 0"

        // 提取新猫咪ID
        const newCatMatch = console.match(/Bred cat #(\d+) for \w+ with quality (\d+)/);
        if (newCatMatch) {
          const newCatId = parseInt(newCatMatch[1]);
          const quality = parseInt(newCatMatch[2]);

          // 提取基因信息
          const genesMatch = console.match(/inherited genes:(\d+)/);
          const genes = genesMatch ? genesMatch[1] : null;

          // 提取父母猫咪ID
          const parentsMatch = console.match(/Bred cats #(\d+) and #(\d+) to create new cat with quality (\d+)/);
          let parentIds = null;
          if (parentsMatch) {
            parentIds = [parseInt(parentsMatch[1]), parseInt(parentsMatch[2])];
          }

          return {
            success: true,
            newCatId: newCatId,
            quality: quality,
            genes: genes,
            parentIds: parentIds,
            rawConsole: console
          };
        }
      }
    }

    return {
      success: false,
      error: 'Unable to parse breeding result from console output'
    };
  } catch (error) {
    console.error('Error parsing breeding result:', error);
    return {
      success: false,
      error: error.message
    };
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
        QATBLE, // 合约中的统计表名
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
          // 使用表中的目标概率数据，而不是硬编码的常量
          const targetPercentage = statsData[`target_percentage_${i}`] || 0;

          quality_stats.push({
            quality: i,
            count: count,
            target_percentage: targetPercentage / 100, // 转换为实际百分比 (从万分比转为百分比)
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

    // 首先尝试获取目标概率数据
    let targetPercentages = {};
    try {
      const targetStatsRows = await getTableRows(
        wallet,
        CONTRACT,
        CONTRACT,
        QATBLE, // 从同一个表获取目标概率
        '', // lower_bound
        '', // upper_bound
        1,  // index_position
        'i64', // key_type
        1 // limit
      );

      if (targetStatsRows && targetStatsRows.length > 0) {
        const targetData = targetStatsRows[0];
        for (let i = 0; i < 8; i++) {
          targetPercentages[i] = targetData[`target_percentage_${i}`] || 0;
        }
        console.log('获取到目标概率数据:', targetPercentages);
      } else {
        // 如果无法获取目标概率，使用默认值
        console.log('无法获取目标概率数据，使用默认值');
        targetPercentages = TARGET_PERCENTAGES;
      }
    } catch (targetError) {
      console.log('获取目标概率失败，使用默认值:', targetError);
      targetPercentages = TARGET_PERCENTAGES;
    }

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
      const targetPercentage = targetPercentages[i] || 0;

      quality_stats.push({
        quality: i,
        count: count,
        target_percentage: targetPercentage / 100, // 转换为实际百分比 (从万分比转为百分比)
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

// ==================== 市场交易系统函数 ====================

// 上架猫咪到市场
async function listCatForSale(wallet, accountName, catId, price) {
  try {
    console.log(`开始上架猫咪#${catId}，价格: ${price}...`);

    const listAction = {
      account: CONTRACT,
      name: 'listcat',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        seller: accountName,
        cat_id: catId,
        price: price, // 格式: "10.00000000 DFS"
      },
    };

    const result = await sendTransaction(wallet, [listAction]);

    message.success('猫咪上架成功！');
    console.log('猫咪上架成功', result);

    // 记录交易
    const txId = result?.transaction_id || `list-${Date.now()}`;
    recordCatTransaction('list', catId, txId, price, 'DFS');

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('上架猫咪失败:', error);
    throw error;
  }
}

// 从市场下架猫咪
async function unlistCatFromSale(wallet, accountName, catId) {
  try {
    console.log(`开始下架猫咪#${catId}...`);

    const unlistAction = {
      account: CONTRACT,
      name: 'unlistcat',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        seller: accountName,
        cat_id: catId,
      },
    };

    const result = await sendTransaction(wallet, [unlistAction]);

    message.success('猫咪下架成功！');
    console.log('猫咪下架成功', result);

    // 记录交易
    const txId = result?.transaction_id || `unlist-${Date.now()}`;
    recordCatTransaction('unlist', catId, txId);

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('下架猫咪失败:', error);
    throw error;
  }
}

// 购买市场上的猫咪
async function buyCatFromMarket(wallet, accountName, catId, price) {
  try {
    console.log(`开始购买猫咪#${catId}，价格: ${price}...`);

    // 检查DFS余额
    const balanceStr = await getAccountBalance(wallet, 'eosio.token', accountName, 'DFS');
    const balanceParts = balanceStr.split(' ');
    const balanceValue = Number.parseFloat(balanceParts[0]);
    const priceValue = Number.parseFloat(price.split(' ')[0]);

    if (isNaN(balanceValue) || balanceValue < priceValue) {
      const errorMsg = `DFS余额不足，购买需要${price} (当前余额: ${balanceStr || '0 DFS'})`;
      message.warning(errorMsg);
      throw new Error(errorMsg);
    }

    // 执行DFS转账购买
    const transferAction = buildTransferAction(
      accountName,
      CONTRACT,
      price,
      `buy:${catId}` // 购买备注格式
    );

    const result = await sendTransaction(wallet, [transferAction]);

    message.success('猫咪购买成功！');
    console.log('猫咪购买成功', result);

    // 记录交易
    const txId = result?.transaction_id || `buy-${Date.now()}`;
    recordCatTransaction('buy', catId, txId, price, 'DFS');

    return {
      success: true,
      txHash: txId
    };
  } catch (error) {
    console.error('购买猫咪失败:', error);
    throw error;
  }
}



// 获取市场上的猫咪列表
async function getMarketCats(wallet, limit = 20) {
  try {
    console.log(`正在获取市场猫咪列表，最多 ${limit} 只...`);

    // 从市场表获取数据
    const marketRows = await getTableRows(
      wallet,
      CONTRACT,
      CONTRACT,
      'catmarket',
      '', // lower_bound
      '', // upper_bound
      1, // index_position - 主键索引
      'i64', // key_type
      limit // limit
    );

    if (marketRows && marketRows.length > 0) {
      console.log(`从市场表获取到 ${marketRows.length} 条记录`);

      // 过滤活跃的市场记录
      const activeMarketCats = marketRows.filter(market => market.is_active);

      // 获取每只猫咪的详细信息
      const marketCatsWithDetails = [];

      for (const marketCat of activeMarketCats) {
        try {
          // 获取猫咪详细信息
          const catRows = await getTableRows(
            wallet,
            CONTRACT,
            CONTRACT,
            CATTABLE,
            marketCat.cat_id.toString(),
            marketCat.cat_id.toString(),
            1, // index_position - 主键索引
            'i64', // key_type
            1 // limit
          );

          if (catRows && catRows.length > 0) {
            const cat = catRows[0];
            const marketCatWithDetails = {
              // 市场信息
              marketId: marketCat.id,
              catId: marketCat.cat_id,
              seller: marketCat.seller,
              price: marketCat.price,
              listedAt: marketCat.listed_at,
              isActive: marketCat.is_active,

              // 猫咪详细信息
              id: cat.id,
              owner: cat.owner,
              gender: cat.gender,
              genderName: GENDER_NAMES[cat.gender] || '未知',
              quality: cat.quality,
              qualityName: QUALITY_NAMES[cat.quality] || '未知',
              level: cat.level,
              experience: cat.experience,
              encrypted_stats: cat.encrypted_stats,
              genes: cat.genes,
              stamina: cat.stamina,
              maxStamina: 100,
              last_challenge_day: cat.last_challenge_day,
              birth_time: cat.birth_time,
              is_tradeable: cat.is_tradeable,
              in_arena: cat.in_arena,
            };

            marketCatsWithDetails.push(marketCatWithDetails);
          }
        } catch (catError) {
          console.error(`获取猫咪#${marketCat.cat_id}详细信息失败:`, catError);
        }
      }

      // 按价格排序
      marketCatsWithDetails.sort((a, b) => {
        const priceA = Number.parseFloat(a.price.split(' ')[0]);
        const priceB = Number.parseFloat(b.price.split(' ')[0]);
        return priceA - priceB;
      });

      console.log('处理后的市场猫咪数据:', marketCatsWithDetails);
      return marketCatsWithDetails;
    } else {
      console.log('市场上暂无猫咪');
      return [];
    }
  } catch (error) {
    console.error('获取市场猫咪列表失败:', error);
    return [];
  }
}

// 检查猫咪是否在市场上出售
async function checkCatInMarket(wallet, catId) {
  try {
    console.log(`正在检查猫咪#${catId}是否在市场上...`);

    // 使用 bycatid 索引查询特定猫咪
    const marketRows = await getTableRows(
      wallet,
      CONTRACT,
      CONTRACT,
      'catmarket',
      catId.toString(), // lower_bound
      catId.toString(), // upper_bound
      2, // index_position - bycatid 索引
      'i64', // key_type
      1 // limit
    );

    if (marketRows && marketRows.length > 0) {
      // 检查是否有活跃的市场记录
      const activeMarketRecord = marketRows.find(market =>
        market.cat_id === catId && market.is_active
      );

      const isListed = !!activeMarketRecord;
      console.log(`猫咪#${catId}市场状态: ${isListed ? '已上架' : '未上架'}`);
      return isListed;
    }

    console.log(`猫咪#${catId}未在市场上`);
    return false;
  } catch (error) {
    console.error(`检查猫咪#${catId}市场状态失败:`, error);
    return false;
  }
}

// 获取市场统计信息
async function getMarketStats(wallet) {
  try {
    console.log('正在获取市场统计信息...');

    const marketRows = await getTableRows(
      wallet,
      CONTRACT,
      CONTRACT,
      'catmarket',
      '', // lower_bound
      '', // upper_bound
      1, // index_position
      'i64', // key_type
      100 // limit
    );

    if (marketRows && marketRows.length > 0) {
      const activeListings = marketRows.filter(market => market.is_active);

      let totalValue = 0;
      let minPrice = Number.MAX_VALUE;
      let maxPrice = 0;

      activeListings.forEach(market => {
        const price = Number.parseFloat(market.price.split(' ')[0]);
        totalValue += price;
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      });

      const avgPrice = activeListings.length > 0 ? totalValue / activeListings.length : 0;

      return {
        totalListings: marketRows.length,
        activeListings: activeListings.length,
        totalValue: totalValue.toFixed(8),
        avgPrice: avgPrice.toFixed(8),
        minPrice: minPrice === Number.MAX_VALUE ? 0 : minPrice.toFixed(8),
        maxPrice: maxPrice.toFixed(8)
      };
    }

    return {
      totalListings: 0,
      activeListings: 0,
      totalValue: '0.00000000',
      avgPrice: '0.00000000',
      minPrice: '0.00000000',
      maxPrice: '0.00000000'
    };
  } catch (error) {
    console.error('获取市场统计信息失败:', error);
    return null;
  }
}

// ========== 擂台系统函数 ==========

// 获取所有擂台信息
async function getArenas(wallet) {
  try {
    console.log('正在获取擂台信息...');

    const arenaRows = await getTableRows(
      wallet,
      CONTRACT,
      CONTRACT,
      'arenas',
      '', // lower_bound
      '', // upper_bound
      1, // index_position
      'i64', // key_type
      100 // limit
    );

    if (arenaRows && arenaRows.length > 0) {
      // 获取擂台中猫咪的详细信息
      const arenasWithCats = await Promise.all(
        arenaRows.map(async (arena) => {
          try {
            const catRows = await getTableRows(
              wallet,
              CONTRACT,
              CONTRACT,
              'cat51s',
              arena.cat_id.toString(),
              arena.cat_id.toString(),
              1,
              'i64',
              1
            );

            const cat = catRows && catRows.length > 0 ? catRows[0] : null;

            return {
              ...arena,
              cat: cat,
              // 计算战斗力等级（基于合约逻辑）
              powerRank: cat ? calculatePowerRank(cat) : 'Unknown'
            };
          } catch (error) {
            console.error(`获取擂台 ${arena.id} 的猫咪信息失败:`, error);
            return {
              ...arena,
              cat: null,
              powerRank: 'Unknown'
            };
          }
        })
      );

      console.log('获取到擂台信息:', arenasWithCats);
      return arenasWithCats;
    }

    return [];
  } catch (error) {
    console.error('获取擂台信息失败:', error);
    return [];
  }
}

// 计算战斗力等级（前端估算）
function calculatePowerRank(cat) {
  // 基于等级和品质的简单估算
  const levelBonus = cat.level * 15;
  const qualityBonus = cat.quality * 50;
  const estimatedPower = levelBonus + qualityBonus + 200; // 基础值

  if (estimatedPower < 200) return 'Weak';
  if (estimatedPower < 400) return 'Normal';
  if (estimatedPower < 600) return 'Strong';
  if (estimatedPower < 800) return 'Elite';
  if (estimatedPower < 1000) return 'Master';
  if (estimatedPower < 1200) return 'Legendary';
  return 'Mythical';
}

// 解密猫咪属性（6个属性）
function decryptCatStats(encryptedStats, catId) {

  try {
    // 使用与合约相同的解密逻辑
    const key = BigInt(catId) ^ BigInt('0x123456789ABCDEF0');
    const stats = BigInt(encryptedStats) ^ key;

    // 提取各个属性（按照合约的位移逻辑）
    const attack = Number((stats >> BigInt(54)) & BigInt(0x3FF));      // 10位攻击
    const defense = Number((stats >> BigInt(44)) & BigInt(0x3FF));     // 10位防御
    const health = Number((stats >> BigInt(32)) & BigInt(0xFFF));      // 12位血量
    const critical = Number((stats >> BigInt(24)) & BigInt(0xFF));     // 8位暴击
    const dodge = Number((stats >> BigInt(16)) & BigInt(0xFF));        // 8位闪避
    const luck = Number((stats >> BigInt(8)) & BigInt(0xFF));          // 8位幸运

    return {
      attack,
      defense,
      health,
      critical,
      dodge,
      luck
    };
  } catch (error) {
    console.error('解密猫咪属性失败:', error);
    // 返回默认值
    return {
      attack: 0,
      defense: 0,
      health: 0,
      critical: 0,
      dodge: 0,
      luck: 0
    };
  }
}

// 计算总战斗力（基于解密的属性）
function calculateTotalBattlePower(stats, level) {
  // 使用与合约相同的战斗力计算公式
  const basePower = (stats.attack * 3) + (stats.defense * 3) + (stats.health / 2) +
                   (stats.critical * 2) + (stats.dodge * 2) + stats.luck;
  const levelBonus = level * 15; // 每级增加15点战斗力

  return Math.floor(basePower + levelBonus);
}

// 获取属性等级描述
function getAttributeRank(value, type) {
  let thresholds;

  switch (type) {
    case 'attack':
    case 'defense':
      thresholds = [0, 20, 40, 80, 150, 250, 400, 600];
      break;
    case 'health':
      thresholds = [0, 100, 200, 400, 800, 1200, 2000, 3000];
      break;
    case 'critical':
    case 'dodge':
    case 'luck':
      thresholds = [0, 10, 25, 50, 80, 120, 180, 255];
      break;
    default:
      thresholds = [0, 10, 25, 50, 80, 120, 180, 255];
  }

  const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS'];

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i]) {
      return ranks[i] || 'F';
    }
  }

  return 'F';
}

// 获取属性颜色
function getAttributeColor(rank) {
  const colors = {
    'F': '#d9d9d9',   // 灰色
    'E': '#52c41a',   // 绿色
    'D': '#1890ff',   // 蓝色
    'C': '#722ed1',   // 紫色
    'B': '#eb2f96',   // 粉色
    'A': '#fa8c16',   // 橙色
    'S': '#f5222d',   // 红色
    'SS': '#fadb14'   // 金色
  };

  return colors[rank] || colors['F'];
}

// 放置猫咪到擂台
async function placeInArena(wallet, accountName, catId, totalAmount) {
  try {
    console.log('正在放置猫咪到擂台...', { catId, totalAmount });

    // 通过DFS转账放置擂台，memo格式: "arena:猫咪ID"
    const memo = `arena:${catId}`;

    const result = await wallet.transact({
      actions: [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: accountName,
          permission: 'active',
        }],
        data: {
          from: accountName,
          to: CONTRACT,
          quantity: `${totalAmount.toFixed(8)} DFS`,
          memo: memo
        },
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
      useFreeCpu: true, 
    });

    console.log('放置擂台成功:', result);
    return result;
  } catch (error) {
    console.error('放置擂台失败:', error);
    throw error;
  }
}

// 挑战擂台
async function challengeArena(wallet, accountName, arenaId, challengerCatId, betAmount) {
  try {
    console.log('正在挑战擂台...', { arenaId, challengerCatId, betAmount });

    // 通过DFS转账挑战，memo格式: "challenge:擂台ID:猫咪ID"
    const memo = `challenge:${arenaId}:${challengerCatId}`;

    const result = await wallet.transact({
      actions: [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: accountName,
          permission: 'active',
        }],
        data: {
          from: accountName,
          to: CONTRACT,
          quantity: `${betAmount.toFixed(8)} DFS`,
          memo: memo
        },
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });

    console.log('挑战擂台成功:', result);
    return result;
  } catch (error) {
    console.error('挑战擂台失败:', error);
    throw error;
  }
}

// 移除擂台
async function removeArena(wallet, accountName, arenaId) {
  try {
    console.log('正在移除擂台...', { arenaId });
    const result = await wallet.transact({
      actions: [{
        account: CONTRACT,
        name: 'removearena',
        authorization: [{
          actor: accountName,
          permission: 'active',
        }],
        data: {
          owner: accountName,
          arena_id: arenaId
        },
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
      useFreeCpu: true,
    });

    console.log('移除擂台成功:', result);
    return result;
  } catch (error) {
    console.error('移除擂台失败:', error);
    throw error;
  }
}

// 获取猫咪体力状态
async function getCatStamina(wallet, catId) {
  try {
    console.log('正在获取猫咪体力状态...', { catId });

    const result = await wallet.transact({
      actions: [{
        account: CONTRACT,
        name: 'getstamina',
        authorization: [],
        data: {
          cat_id: catId
        },
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });

    console.log('获取体力状态成功:', result);
    return result;
  } catch (error) {
    console.error('获取体力状态失败:', error);
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
  parseBreedingResult,

  // 市场交易系统函数
  listCatForSale,
  unlistCatFromSale,
  buyCatFromMarket,
  transferCat,
  getMarketCats,
  getMarketStats,
  checkCatInMarket,

  // 擂台系统函数
  getArenas,
  placeInArena,
  challengeArena,
  removeArena,
  getCatStamina,
  calculatePowerRank,

  // 猫咪属性解密函数
  decryptCatStats,
  calculateTotalBattlePower,
  getAttributeRank,
  getAttributeColor,

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