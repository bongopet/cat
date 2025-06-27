#!/usr/bin/env node

/**
 * 测试日期转换的正确性
 */

// 测试合约天数转换为日期
function testDateConversion() {
    console.log('=== 测试合约天数转换 ===\n');

    // 测试用例：合约返回的天数
    const contractDay = 20266;
    
    console.log(`合约返回的天数: ${contractDay}`);
    
    // 方法1: 直接从1970-01-01开始计算
    const timestamp1 = contractDay * 86400 * 1000; // 转换为毫秒
    const date1 = new Date(timestamp1);
    console.log(`方法1 - 从1970-01-01计算: ${date1.toLocaleDateString('zh-CN')}`);
    console.log(`方法1 - ISO格式: ${date1.toISOString().split('T')[0]}`);
    
    // 方法2: 验证当前日期的计算
    const currentTime = Math.floor(Date.now() / 1000);
    const currentDay = Math.floor(currentTime / 86400);
    console.log(`\n当前时间戳: ${currentTime}`);
    console.log(`当前天数: ${currentDay}`);
    
    const currentDate = new Date(currentDay * 86400 * 1000);
    console.log(`当前日期: ${currentDate.toLocaleDateString('zh-CN')}`);
    
    // 计算差值
    const daysDiff = currentDay - contractDay;
    console.log(`\n天数差值: ${daysDiff} 天`);
    console.log(`这意味着上次领取是 ${daysDiff} 天前`);
    
    // 验证特定日期
    console.log('\n=== 验证特定日期 ===');
    
    // 2024-01-01的天数
    const date20240101 = new Date('2024-01-01T00:00:00Z');
    const day20240101 = Math.floor(date20240101.getTime() / (86400 * 1000));
    console.log(`2024-01-01的天数: ${day20240101}`);
    
    // 2025-06-27的天数
    const date20250627 = new Date('2025-06-27T00:00:00Z');
    const day20250627 = Math.floor(date20250627.getTime() / (86400 * 1000));
    console.log(`2025-06-27的天数: ${day20250627}`);
    
    // 检查20266是什么日期
    console.log(`\n天数20266对应的日期:`);
    const testDate = new Date(20266 * 86400 * 1000);
    console.log(`完整日期: ${testDate.toString()}`);
    console.log(`本地日期: ${testDate.toLocaleDateString('zh-CN')}`);
    console.log(`UTC日期: ${testDate.toISOString().split('T')[0]}`);
}

// 运行测试
testDateConversion();
