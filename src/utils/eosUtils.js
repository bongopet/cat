/**
 * EOS区块链工具函数
 * 提供与EOSJS相关的辅助功能
 */
import { JsonRpc } from 'eosjs';
import axios from 'axios';

// 获取所有可用的API节点
const getAllApiNodes = () => {
  return [
    'https://api.dfs.land/'
  ];
};

// 创建JsonRpc实例
const createRpc = (nodeUrl) => {
  return new JsonRpc(nodeUrl, { fetch });
};

// 尝试所有节点直到成功
export async function tryAllNodes(rpcCallFunction) {
  const nodes = getAllApiNodes();
  let lastError = null;
  
  // 尝试从本地存储获取最后成功的节点，并将其放在列表的最前面
  const lastSuccessfulNode = localStorage.getItem('dfs-last-successful-node');
  if (lastSuccessfulNode && nodes.includes(lastSuccessfulNode)) {
    // 将最后成功的节点移到列表最前面
    const nodeIndex = nodes.indexOf(lastSuccessfulNode);
    nodes.splice(nodeIndex, 1);
    nodes.unshift(lastSuccessfulNode);
  }
  
  for (const nodeUrl of nodes) {
    try {
      // console.log(`尝试使用RPC节点: ${nodeUrl}`);
      
      // 创建JsonRpc实例
      const rpc = createRpc(nodeUrl);
      
      // 调用RPC函数
      const result = await rpcCallFunction(rpc);
      
      // 如果成功，保存此节点
      localStorage.setItem('dfs-last-successful-node', nodeUrl);
      // console.log(`节点 ${nodeUrl} 调用成功`);
      
      return result;
    } catch (error) {
      console.error(`节点 ${nodeUrl} 调用失败:`, error);
      lastError = error;
    }
  }
  
  // 所有节点都失败了
  throw lastError || new Error('所有RPC节点都无法访问');
}

/**
 * 获取表格数据的工具函数
 * 
 * @param {Object} wallet - 钱包实例(可选，不再使用)
 * @param {string} code - 合约账户名
 * @param {string} scope - 表的作用域
 * @param {string} table - 表名
 * @param {string} lower_bound - 查询范围下限
 * @param {string} upper_bound - 查询范围上限
 * @param {number} index_position - 索引位置
 * @param {string} key_type - 键类型
 * @param {number} limit - 查询限制数量
 * @param {boolean} reverse - 是否反向查询（默认为false）
 * @returns {Array} 表格数据行 
 */
export async function getTableRows(
  wallet,
  code, 
  scope, 
  table, 
  lower_bound = '', 
  upper_bound = '', 
  index_position = 1, 
  key_type = 'i64', 
  limit = 10, 
  reverse = false
) {
  try {
    // 使用tryAllNodes尝试所有节点
    return await tryAllNodes(async (rpc) => {
      // console.log(`使用JsonRpc获取表数据: ${table} from ${code}`);
      
      const result = await rpc.get_table_rows({
        json: true,
        code,
        scope,
        table,
        lower_bound,
        upper_bound,
        index_position,
        key_type,
        limit,
        reverse
      });
      
      console.log(`JsonRpc获取表数据成功, 返回 ${result.rows ? result.rows.length : 0} 行`);
     
      return result.rows || [];
    });
  } catch (error) {
    console.error('获取表数据失败:', error);
    // 返回空数组，避免前端错误
    return [];
  }
}

/**
 * 获取表格数据的工具函数
 * 
 * @param {Object} wallet - 钱包实例(可选，不再使用)
 * @param {string} code - 合约账户名
 * @param {string} scope - 表的作用域
 * @param {string} table - 表名
 * @param {string} lower_bound - 查询范围下限
 * @param {string} upper_bound - 查询范围上限
 * @param {number} index_position - 索引位置
 * @param {string} key_type - 键类型
 * @param {number} limit - 查询限制数量
 * @param {boolean} reverse - 是否反向查询（默认为false）
 * @returns {Array} 表格数据行  
 */
export async function getTableRowsmore(
  wallet,
  code, 
  scope, 
  table, 
  lower_bound = '', 
  upper_bound = '', 
  index_position = 1, 
  key_type = 'i64', 
  limit = 10, 
  reverse = false
) {
  try {
    // 使用tryAllNodes尝试所有节点
    return await tryAllNodes(async (rpc) => {
      // console.log(`使用JsonRpc获取表数据: ${table} from ${code}`);
      
      const result = await rpc.get_table_rows({
        json: true,
        code,
        scope,
        table,
        lower_bound,
        upper_bound,
        index_position,
        key_type,
        limit,
        reverse
      });
      
      console.log(`JsonRpc获取表数据成功, 返回 ${result.rows ? result.rows.length : 0} 行`);
      return {
        rows: result.rows || [],
        more: result.more || false,
        next_key: result.next_key || ''
      }
    });
  } catch (error) {
    console.error('获取表数据失败:', error);
    // 返回空数组，避免前端错误
    return [];
  }
}

/**
 * 获取账户余额
 * 
 * @param {Object} wallet - 钱包实例(可选，不再使用)
 * @param {string} tokenContract - 代币合约账户
 * @param {string} account - 要查询的账户
 * @param {string} symbol - 代币符号
 * @returns {string} 余额字符串（例如 "10.0000 DFS"）
 */
export async function getAccountBalance(wallet, tokenContract, account, symbol) {
  try {
    // 使用tryAllNodes尝试所有节点
    return await tryAllNodes(async (rpc) => {
      console.log(`使用JsonRpc获取余额: ${account} @ ${tokenContract} (${symbol})`);
      
      const result = await rpc.get_currency_balance(tokenContract, account, symbol);
      
      console.log('JsonRpc获取余额成功:', result);
      return result.length > 0 ? result[0] : `0.0000 ${symbol}`;
    });
  } catch (error) {
    console.error('获取余额失败:', error);
    // 返回默认值
    console.log('获取余额失败，返回零余额');
    return `0.0000 ${symbol}`;
  }
}

/**
 * 获取账户信息
 * 
 * @param {Object} wallet - 钱包实例(可选，不再使用)
 * @param {string} accountName - 账户名
 * @returns {Object} 账户信息
 */
export async function getAccount(wallet, accountName) {
  try {
    return await tryAllNodes(async (rpc) => {
      console.log(`使用JsonRpc获取账户信息: ${accountName}`);
      
      const result = await rpc.get_account(accountName);
      
      console.log('JsonRpc获取账户信息成功');
      return result;
    });
  } catch (error) {
    console.error('获取账户信息失败:', error);
    throw error;
  }
}

/**
 * 获取链信息
 * 
 * @param {Object} wallet - 钱包实例(可选，不再使用)
 * @returns {Object} 链信息
 */
export async function getChainInfo(wallet) {
  try {
    return await tryAllNodes(async (rpc) => {
      console.log('使用JsonRpc获取链信息');
      
      const result = await rpc.get_info();
      
      console.log('JsonRpc获取链信息成功');
      return result;
    });
  } catch (error) {
    console.error('获取链信息失败:', error);
    throw error;
  }
}

/**
 * 构建并发送交易
 * 
 * @param {Object} wallet - 钱包实例
 * @param {Array} actions - 交易动作数组
 * @param {Object} options - 交易选项
 * @returns {Object} 交易结果
 */
export async function sendTransaction(wallet, actions, options = {}) {
  console.log('sendTransaction 调用:', {
    wallet: !!wallet,
    walletType: typeof wallet,
    hasTransact: wallet && typeof wallet.transact === 'function',
    actions,
    options
  });

  if (!wallet) {
    throw new Error('钱包未初始化');
  }

  if (typeof wallet.transact !== 'function') {
    throw new Error('钱包对象缺少 transact 方法');
  }

  try {
    const transaction = { actions };
    const transactionOptions = {
      blocksBehind: 3,
      expireSeconds: 30,
      useFreeCpu: true,
      ...options
    };
    console.log('准备发送交易:', transaction, '选项:', transactionOptions);
    const result = await wallet.transact(transaction, transactionOptions);
    console.log('交易发送成功:', result);
    return result;
  } catch (error) {
    console.error('发送交易失败:', error);
    throw error;
  }
}

/**
 * 构建转账交易动作
 * 
 * @param {string} from - 发送账户
 * @param {string} to - 接收账户
 * @param {string} quantity - 金额（例如 "1.0000 DFS"）
 * @param {string} memo - 备注
 * @param {string} permission - 权限（默认为 "active"）
 * @returns {Object} 转账交易动作对象
 */
export function buildTransferAction(from, to, quantity, memo = '', permission = 'active') {
  // 从quantity中提取代币符号
  const symbolMatch = quantity.match(/[A-Z]+$/);
  const symbol = symbolMatch ? symbolMatch[0] : 'DFS';
  
  // 根据代币符号确定合约账户
  let contractAccount = 'eosio.token'; // 默认EOS代币合约
  if (symbol === 'DFS') {
    contractAccount = 'eosio.token';  // DFS代币合约
  } else if (symbol === 'BGCAT') {
    contractAccount = 'dfsppptokens'; // BGCAT代币合约
  }
  
  return {
    account: contractAccount,
    name: 'transfer',
    authorization: [
      {
        actor: from,
        permission,
      },
    ],
    data: {
      from,
      to,
      quantity,
      memo,
    },
  };
}
