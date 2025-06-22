import React, { useState } from 'react';
import { Card, Button, Input, Space, Alert, Divider } from 'antd';
import { LockOutlined, TestTubeOutlined } from '@ant-design/icons';
import SecureCatStatsManager from '../utils/SecureCatStatsManager';

const SecureStatsTest = () => {
    const [testAccount, setTestAccount] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 模拟测试安全属性管理器
    const testSecureStats = async () => {
        if (!testAccount.trim()) {
            setError('请输入测试账户名');
            return;
        }

        setLoading(true);
        setError(null);
        setTestResult(null);

        try {
            // 创建测试实例
            const statsManager = new SecureCatStatsManager(
                'https://eos.greymass.com', // 使用公共RPC端点进行测试
                'bongocat'
            );

            // 模拟获取属性数据（实际需要钱包连接）
            const mockStats = {
                requestId: Date.now(),
                owner: testAccount,
                catsStats: [
                    {
                        catId: 1,
                        attack: 150,
                        defense: 120,
                        health: 300,
                        critical: 45,
                        dodge: 38,
                        luck: 52,
                        totalPower: 1250,
                        timestamp: Math.floor(Date.now() / 1000)
                    },
                    {
                        catId: 2,
                        attack: 200,
                        defense: 180,
                        health: 450,
                        critical: 65,
                        dodge: 55,
                        luck: 70,
                        totalPower: 1850,
                        timestamp: Math.floor(Date.now() / 1000)
                    }
                ]
            };

            // 测试属性等级计算
            const testCat = mockStats.catsStats[0];
            const attackRank = statsManager.getAttributeRank(testCat.attack, 'attack');
            const attackColor = statsManager.getAttributeColor(attackRank);

            setTestResult({
                ...mockStats,
                testInfo: {
                    attackRank,
                    attackColor,
                    cacheStats: statsManager.getCacheStats()
                }
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 渲染测试结果
    const renderTestResult = () => {
        if (!testResult) return null;

        return (
            <div>
                <Alert
                    message="测试成功"
                    description={`为账户 ${testResult.owner} 生成了 ${testResult.catsStats.length} 只猫咪的模拟属性数据`}
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Card title="模拟猫咪属性数据" size="small" style={{ marginBottom: 16 }}>
                    {testResult.catsStats.map(cat => (
                        <Card 
                            key={cat.catId}
                            type="inner"
                            title={`猫咪 #${cat.catId}`}
                            size="small"
                            style={{ marginBottom: 8 }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
                                <div>攻击: {cat.attack}</div>
                                <div>防御: {cat.defense}</div>
                                <div>血量: {cat.health}</div>
                                <div>暴击: {cat.critical}</div>
                                <div>闪避: {cat.dodge}</div>
                                <div>幸运: {cat.luck}</div>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#faad14' }}>
                                总战斗力: {cat.totalPower.toLocaleString()}
                            </div>
                        </Card>
                    ))}
                </Card>

                <Card title="测试信息" size="small">
                    <div style={{ fontSize: '12px' }}>
                        <div>攻击等级测试: {testResult.testInfo.attackRank}</div>
                        <div>攻击颜色: <span style={{ color: testResult.testInfo.attackColor }}>●</span> {testResult.testInfo.attackColor}</div>
                        <div>缓存统计: {JSON.stringify(testResult.testInfo.cacheStats)}</div>
                    </div>
                </Card>
            </div>
        );
    };

    return (
        <Card 
            title={
                <Space>
                    <TestTubeOutlined />
                    安全属性管理器测试
                </Space>
            }
            style={{ maxWidth: 800, margin: '20px auto' }}
        >
            <div style={{ marginBottom: 16 }}>
                <Alert
                    message="测试说明"
                    description="这是安全猫咪属性管理器的测试页面。由于需要钱包连接和签名，这里使用模拟数据进行功能测试。"
                    type="info"
                    showIcon
                />
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                        测试账户名:
                    </label>
                    <Input
                        placeholder="输入EOS账户名 (例如: testaccount)"
                        value={testAccount}
                        onChange={(e) => setTestAccount(e.target.value)}
                        onPressEnter={testSecureStats}
                    />
                </div>

                <Button
                    type="primary"
                    icon={<LockOutlined />}
                    onClick={testSecureStats}
                    loading={loading}
                    block
                >
                    测试安全属性获取
                </Button>

                {error && (
                    <Alert
                        message="测试失败"
                        description={error}
                        type="error"
                        showIcon
                    />
                )}

                {renderTestResult()}
            </Space>

            <Divider />

            <div style={{ fontSize: '12px', color: '#666' }}>
                <h4>功能说明:</h4>
                <ul>
                    <li>🔐 <strong>私钥签名验证</strong>: 确保只有猫咪拥有者能查看属性</li>
                    <li>📊 <strong>批量属性获取</strong>: 一次性获取用户所有猫咪属性</li>
                    <li>💾 <strong>智能缓存</strong>: 减少重复请求，提升用户体验</li>
                    <li>🎯 <strong>属性等级系统</strong>: F-SS等级评定和颜色编码</li>
                    <li>🔄 <strong>生命周期管理</strong>: 支持繁殖、交易等场景的属性转移</li>
                </ul>

                <h4>安全特性:</h4>
                <ul>
                    <li>基于用户公钥的密钥派生，无密钥存储</li>
                    <li>时间戳防重放攻击</li>
                    <li>签名验证确保身份真实性</li>
                    <li>属性数据集中加密存储在用户表中</li>
                </ul>
            </div>
        </Card>
    );
};

export default SecureStatsTest;
