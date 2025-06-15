/**
 * 区块链操作工具
 * 用于处理与区块链交互的各种操作
 */

import { message } from 'ant-design-vue'
import { CONTRACT } from '@/constants'

/**
 * 检查猫咪是否有可获取的经验
 * @param wallet 钱包实例
 * @param owner 所有者账号名
 * @param catId 猫咪ID
 * @param lastCheckTime 上次检查时间
 * @param debugLog 调试日志函数
 * @returns 是否有可获取的经验
 */
export async function checkCatHasAvailableExp(wallet: any, owner: string, catId: number, lastCheckTime: number, debugLog?: (message: string, data?: any) => void): Promise<boolean> {
  try {
    // 首先检查loglogloglog合约的logs表
    const externalContract = 'loglogloglog'
    const logs = await wallet.getTableRows(
      externalContract,
      externalContract,
      'logs',
      '',
      '',
      1, // index_position: 1表示主键索引
      'i64',
      100, // 限制查询数量
      true, // 反向查询，获取最新记录
    )

    if (logs && Array.isArray(logs)) {
      // 检查是否有该用户在上次检查后的新记录
      const hasExpFromLogs = logs.some((log) => {
        // 检查是否是目标用户的记录
        if (log.user === owner) {
          // 检查是否是上次检查后的新记录
          const logTime = (new Date(log.create_time).getTime() / 1000) + 8 * 3600

          if (logTime > lastCheckTime) {
            // 检查是否有USDT交易 或者包含 DFS
            const inAmount = log.in || ''
            return inAmount.includes('USDT') || inAmount.includes('DFS')
          }
        }
        return false
      })

      if (hasExpFromLogs) {
        return true
      }
    }

    // 然后检查dfs3protocol合约的logs表
    const pppContract = 'dfs3protocol'
    const pppLogs = await wallet.getTableRows(
      pppContract,
      pppContract,
      'logs',
      '',
      '',
      1, // index_position: 1表示主键索引
      'i64',
      100, // 限制查询数量
      true, // 反向查询，获取最新记录
    )

    if (pppLogs && Array.isArray(pppLogs)) {
      // 检查是否有该用户在上次检查后的PPP相关操作记录
      const hasExpFromPpp = pppLogs.some((log) => {
        // 检查是否是目标用户的记录（from或to字段）
        if (log.from === owner) {
          // 检查是否是上次检查后的新记录
          const logTime = (new Date(log.create_time).getTime() / 1000) + 8 * 3600
          if (logTime > lastCheckTime) {
            // 检查是否有mint, burn或split类型的操作
            return ['mint', 'burn', 'split', 'buy'].includes(log.type)
          }
        }
        return false
      })

      if (hasExpFromPpp) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('检查可获取经验失败:', error)
    debugLog?.(`检查可获取经验失败: ${error}`)
    return false
  }
}

/**
 * 执行铸造猫咪操作
 * @param wallet 钱包实例
 * @param accountName 账户名
 * @param debugLog 调试日志函数
 * @returns 交易结果
 */
export async function mintCat(wallet: any, accountName: string, debugLog?: (message: string, data?: any) => void): Promise<any> {
  try {
    // 查询用户余额，确保有足够的DFS
    const balance = await wallet.dfsWallet.getbalance('eosio.token', accountName, 'DFS')

    // 解析余额字符串，例如 "10.0000 DFS"
    const balanceValue = Number.parseFloat(balance)
    if (isNaN(balanceValue) || balanceValue < 1.0) {
      const errorMsg = `DFS余额不足，铸造猫咪需要至少30.0000 DFS (当前余额: ${balance || '30.0000 DFS'})`
      message.warning(errorMsg)
      debugLog?.('铸造猫咪余额不足:', { balance, required: '30.0000 DFS' })
      throw new Error(errorMsg)
    }

    // 执行铸造操作
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
          to: CONTRACT, // 合约账户
          quantity: '30.00000000 DFS', // 固定费用
          memo: 'mint', // 特定备注，标识为铸造操作
        },
      }],
    }, { useFreeCpu: true })

    message.success('铸造猫咪交易已提交')
    debugLog?.('铸造猫咪交易已提交', result)

    // 记录交易到钱包历史
    const txId = result?.transaction_id || `mint-${Date.now()}`
    recordCatTransaction(
      wallet,
      txId,
      'mint',
      '30.0000000',
      'DFS',
      accountName,
      CONTRACT,
      undefined,
      debugLog,
    )

    return result
  } catch (error) {
    debugLog?.('铸造猫咪失败:', error)
    throw error
  }
}

/**
 * 执行喂养猫咪操作
 * @param wallet 钱包实例
 * @param accountName 账户名
 * @param catId 猫咪ID
 * @param debugLog 调试日志函数
 * @returns 交易结果
 */
export async function feedCat(wallet: any, accountName: string, catId: number, debugLog?: (message: string, data?: any) => void): Promise<any> {
  try {
    // 为其他代币类型检查余额
    const assetBalance = await wallet.dfsWallet.get_currency_balance('dfsppptokens', accountName, 'BGFISH')

    // 解析余额字符串，例如 "10.0000 BGFISH"
    const balance = Number.parseFloat(assetBalance)
    if (isNaN(balance) || balance < 0.01) {
      const errorMsg = `BGFISH余额不足，喂养猫咪需要至少1 BGFISH (当前余额: ${balance || '1 BGFISH'})`
      message.warning(errorMsg)
      debugLog?.('喂养猫咪余额不足:', { balance, required: '1 BGFISH' })
      throw new Error(errorMsg)
    }

    // 执行喂养操作
    const result = await wallet.transact({
      actions: [{
        account: 'dfsppptokens',
        name: 'transfer',
        authorization: [{
          actor: accountName,
          permission: 'active',
        }],
        data: {
          from: accountName,
          to: CONTRACT, // 合约账户
          quantity: '1.00000000 BGFISH', // 固定费用
          memo: `feed:${catId}`, // 特定备注，标识为喂养操作
        },
      }],
    }, { useFreeCpu: true })

    message.success('喂养猫咪交易已提交')
    debugLog?.('喂养猫咪交易已提交', result)

    // 记录交易到钱包历史
    const txId = result?.transaction_id || `feed-${Date.now()}`
    recordCatTransaction(
      wallet,
      txId,
      'feed',
      '1.00000000',
      'BGFISH',
      accountName,
      CONTRACT,
      catId,
      debugLog,
    )

    return result
  } catch (error) {
    debugLog?.(`喂养猫咪失败:${error}`)
    throw error
  }
}

/**
 * 执行升级猫咪操作
 * @param wallet 钱包实例
 * @param accountName 账户名
 * @param catId 猫咪ID
 * @param debugLog 调试日志函数
 * @returns 交易结果
 */
export async function upgradeCat(wallet: any, accountName: string, catId: number, debugLog?: (message: string, data?: any) => void): Promise<any> {
  try {
    // 执行升级操作
    const result = await wallet.transact({
      actions: [{
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
      }],
    }, { useFreeCpu: true })

    message.success('猫咪升级成功')
    debugLog?.('猫咪升级成功', result)
    return result
  } catch (error) {
    debugLog?.('升级猫咪失败:', error)
    throw error
  }
}

/**
 * 执行检查猫咪活动操作
 * @param wallet 钱包实例
 * @param accountName 账户名
 * @param catId 猫咪ID
 * @param debugLog 调试日志函数
 * @returns 交易结果
 */
export async function checkCatAction(wallet: any, accountName: string, catId: number, debugLog?: (message: string, data?: any) => void): Promise<any> {
  try {
    // 执行检查操作
    const result = await wallet.transact({
      actions: [{
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
      }],
    }, { useFreeCpu: true })

    message.success('检查活动成功')
    debugLog?.('检查活动成功', result)
    return result
  } catch (error) {
    debugLog?.('检查活动失败:', error)
    throw error
  }
}

/**
 * 获取用户的猫咪列表
 * @param wallet 钱包实例
 * @param accountName 账户名
 * @param debugLog 调试日志函数
 * @returns 猫咪列表
 */
export async function getUserCats(wallet: any, accountName: string, debugLog?: (message: string, data?: any) => void): Promise<any[]> {
  try {
    const result = await wallet.getTableRows(
      CONTRACT, // code: 合约账户名
      CONTRACT, // scope: 表的作用域
      'cats', // table: 表名
      accountName, // lower_bound: 按所有者索引下限
      '',
      2, // index_position: 2表示secondary index
      'name', // key_type: 索引键类型
      100, // limit: 最大结果数
    )

    debugLog?.('获取猫咪API调用结果:', result)
    // debugLog?.(`获取猫咪API调用结果: ${JSON.stringify(result)}`)

    if (result && Array.isArray(result)) {
      // 过滤出属于当前用户的猫
      const userCats = result.filter(cat => cat.owner === accountName)
      // debugLog?.(`过滤后的用户猫咪列表: ${JSON.stringify(userCats)}`)
      return userCats
    } else {
      debugLog?.('获取猫咪数据返回格式不正确:', result)
      throw new Error('获取猫咪数据格式不正确')
    }
  } catch (error) {
    debugLog?.('获取猫咪失败:', error)
    throw error
  }
}

/**
 * 获取猫咪的互动记录
 * @param wallet 钱包实例
 * @param catId 猫咪ID
 * @param debugLog 调试日志函数
 * @returns 互动记录列表
 */
export async function getCatInteractions(wallet: any, catId: number, debugLog?: (message: string, data?: any) => void): Promise<any[]> {
  try {
    const result = await wallet.getTableRows(
      CONTRACT, // code: 合约账户名
      CONTRACT, // scope: 表的作用域
      'interactions', // table: 表名
      catId.toString(), // lower_bound: 按猫咪ID索引
      catId.toString(), // upper_bound: 按猫咪ID索引
      2, // index_position: 2表示secondary index (cat_id)
      'i64', // key_type: 索引键类型
      5, // limit: 最大结果数
      true,
    )
    if (result && Array.isArray(result)) {
      // 过滤并按时间戳降序排序
      const interactions = result
        .filter(interaction => Number(interaction.cat_id) === catId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(-5)
      // debugLog?.(`获取互动记录: ${JSON.stringify(interactions)}`)
      return interactions
    } else {
      debugLog?.('获取互动记录数据返回格式不正确:', result)
      throw new Error('获取互动记录数据格式不正确')
    }
  } catch (error) {
    debugLog?.('获取互动记录失败:', error)
    throw error
  }
}

/**
 * 获取所有猫咪数据并按等级排序(用于排行榜)
 * @param wallet 钱包实例
 * @param limit 最大结果数
 * @param debugLog 调试日志函数
 * @returns 按等级排序的猫咪列表
 */
export async function getAllCats(wallet: any, limit: number = 50, debugLog?: (message: string, data?: any) => void): Promise<any[]> {
  try {
    const result = await wallet.getTableRows(
      CONTRACT, // code: 合约账户名
      CONTRACT, // scope: 表的作用域
      'cats', // table: 表名
      '', // lower_bound: 不限制下限
      '', // upper_bound: 不限制上限
      1, // index_position: 1表示主键索引
      'i64', // key_type: 索引键类型
      limit, // limit: 最大结果数
    )

    debugLog?.('获取所有猫咪API调用结果:', result)

    if (result && Array.isArray(result)) {
      // 按等级降序排序
      const sortedCats = [...result].sort((a, b) => {
        // 首先按等级降序排序
        if (b.level !== a.level) {
          return b.level - a.level
        }
        // 如果等级相同，按经验值降序排序
        return b.experience - a.experience
      })

      debugLog?.(`获取到${sortedCats.length}只猫咪，已按等级排序`)
      return sortedCats
    } else {
      debugLog?.('获取所有猫咪数据返回格式不正确:', result)
      throw new Error('获取所有猫咪数据格式不正确')
    }
  } catch (error) {
    debugLog?.('获取所有猫咪失败:', error)
    throw error
  }
}

/**
 * 记录猫咪相关交易到钱包交易记录
 * @param wallet 钱包实例
 * @param txId 交易ID
 * @param type 交易类型
 * @param amount 金额
 * @param currency 代币符号
 * @param from 发送方
 * @param to 接收方
 * @param catId 猫咪ID
 * @param debugLog 调试日志函数
 */
export function recordCatTransaction(wallet: any, txId: string, type: 'mint' | 'feed', amount: string, currency: string, from: string, to: string, catId?: number, debugLog?: (message: string, data?: any) => void): void {
  try {
    if (!wallet || !wallet.transactions) {
      debugLog?.('记录猫咪交易失败: 钱包实例不完整')
      return
    }

    // 构造交易记录
    const newTx = {
      id: txId,
      type: 'send',
      amount,
      currency,
      from,
      to,
      date: new Date().toISOString(),
      status: 'completed',
      memo: type === 'mint'
        ? '铸造猫咪'
        : `喂养猫咪 #${catId}`,
    }

    // 添加到交易历史
    wallet.transactions.value.unshift(newTx)

    // 保存到本地存储
    localStorage.setItem('bongo-cat-transactions', JSON.stringify(wallet.transactions.value))

    debugLog?.('猫咪交易已记录到钱包历史', newTx)
  } catch (error) {
    console.error('记录猫咪交易失败:', error)
    debugLog?.('记录猫咪交易失败:', error)
  }
}
