import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, Alert, Space, Tag, Row, Col, Progress, Tooltip } from 'antd';
import { 
    TrophyOutlined, 
    ReloadOutlined, 
    LockOutlined, 
    FireOutlined,
    SafetyOutlined,
    HeartOutlined,
    ThunderboltOutlined,
    EyeOutlined,
    StarOutlined
} from '@ant-design/icons';
import SimpleCatStatsManager from '../utils/SimpleCatStatsManager';

const SecureCatAttributes = ({ wallet, accountName, showTitle = true }) => {
    const [loading, setLoading] = useState(false);
    const [allCatsStats, setAllCatsStats] = useState(null);
    const [error, setError] = useState(null);
    const [secureStatsService, setSecureStatsService] = useState(null);
    const [cacheStats, setCacheStats] = useState(null);

    // 初始化安全属性服务
    useEffect(() => {
        if (wallet || accountName) {
            const service = new SimpleCatStatsManager(
                'https://your-eos-endpoint.com', // 替换为实际的RPC端点
                'bongocat' // 合约账户
            );
            // 简化版本不需要初始化API
            setSecureStatsService(service);
        }
    }, [wallet, accountName]);

    // 获取所有猫咪属性
    const fetchAllCatsStats = async () => {
        if (!secureStatsService || !accountName) return;

        setLoading(true);
        setError(null);

        try {
            const allStats = await secureStatsService.getAllMyCatStats(accountName);
            setAllCatsStats(allStats);
            
            // 更新缓存统计
            const stats = secureStatsService.getCacheStats();
            setCacheStats(stats);
            
        } catch (err) {
            setError(err.message);
            console.error('获取所有猫咪属性失败:', err);
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时自动获取属性
    useEffect(() => {
        if (secureStatsService && accountName) {
            fetchAllCatsStats();
        }
    }, [secureStatsService, accountName]);

    // 清理缓存
    const clearCache = () => {
        if (secureStatsService) {
            secureStatsService.clearCache();
            setCacheStats(secureStatsService.getCacheStats());
        }
    };

    // 渲染单个属性
    const renderAttribute = (name, value, type, icon, color, max) => {
        const rank = secureStatsService?.getAttributeRank(value, type) || 'F';
        const rankColor = secureStatsService?.getAttributeColor(rank) || '#d9d9d9';
        const percentage = Math.min((value / max) * 100, 100);

        return (
            <Col span={12} key={name}>
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <Space size={4}>
                            {icon}
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{name}</span>
                            <Tag 
                                size="small" 
                                style={{ 
                                    backgroundColor: rankColor, 
                                    color: 'white', 
                                    border: 'none',
                                    fontSize: '10px',
                                    padding: '0 4px',
                                    minWidth: '20px',
                                    textAlign: 'center'
                                }}
                            >
                                {rank}
                            </Tag>
                        </Space>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: color }}>
                            {value.toLocaleString()}
                        </span>
                    </div>
                    <Progress 
                        percent={percentage} 
                        showInfo={false} 
                        strokeColor={color}
                        trailColor="#f0f0f0"
                        size="small"
                        style={{ marginBottom: '2px' }}
                    />
                </div>
            </Col>
        );
    };

    // 渲染单只猫咪的属性
    const renderCatStats = (catStats) => {
        const attributes = [
            { name: '攻击', value: catStats.attack, type: 'attack', icon: <FireOutlined />, color: '#f5222d', max: 1023 },
            { name: '防御', value: catStats.defense, type: 'defense', icon: <SafetyOutlined />, color: '#1890ff', max: 1023 },
            { name: '血量', value: catStats.health, type: 'health', icon: <HeartOutlined />, color: '#52c41a', max: 4095 },
            { name: '暴击', value: catStats.critical, type: 'critical', icon: <ThunderboltOutlined />, color: '#faad14', max: 255 },
            { name: '闪避', value: catStats.dodge, type: 'dodge', icon: <EyeOutlined />, color: '#722ed1', max: 255 },
            { name: '幸运', value: catStats.luck, type: 'luck', icon: <StarOutlined />, color: '#eb2f96', max: 255 }
        ];

        return (
            <Card 
                key={catStats.catId}
                size="small" 
                title={
                    <Space>
                        <span>猫咪 #{catStats.catId}</span>
                        <Tag color="gold">
                            <TrophyOutlined /> {catStats.totalPower.toLocaleString()}
                        </Tag>
                    </Space>
                }
                style={{ marginBottom: '16px' }}
            >
                <Row gutter={[12, 8]}>
                    {attributes.map(attr => renderAttribute(
                        attr.name, 
                        attr.value, 
                        attr.type, 
                        attr.icon, 
                        attr.color, 
                        attr.max
                    ))}
                </Row>
            </Card>
        );
    };

    // 渲染统计信息
    const renderStatsOverview = () => {
        if (!allCatsStats || !allCatsStats.catsStats.length) return null;

        const totalCats = allCatsStats.catsStats.length;
        const totalPower = allCatsStats.catsStats.reduce((sum, cat) => sum + cat.totalPower, 0);
        const avgPower = Math.round(totalPower / totalCats);
        const maxPower = Math.max(...allCatsStats.catsStats.map(cat => cat.totalPower));

        return (
            <Card size="small" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                                {totalCats}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>总猫咪数</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                                {totalPower.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>总战斗力</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                                {avgPower.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>平均战斗力</div>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5222d' }}>
                                {maxPower.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>最高战斗力</div>
                        </div>
                    </Col>
                </Row>
            </Card>
        );
    };

    if (!wallet || !accountName) {
        return (
            <Card title={showTitle ? "猫咪属性" : null} size="small">
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    <LockOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <div>请连接钱包查看猫咪属性</div>
                </div>
            </Card>
        );
    }

    return (
        <div>
            {showTitle && (
                <Card 
                    title={
                        <Space>
                            <LockOutlined style={{ color: '#faad14' }} />
                            安全猫咪属性
                        </Space>
                    }
                    size="small"
                    extra={
                        <Space>
                            {cacheStats && (
                                <Tooltip title={`缓存: ${cacheStats.statsCache} 属性, ${cacheStats.signatureCache} 签名`}>
                                    <Tag size="small">缓存: {cacheStats.statsCache}</Tag>
                                </Tooltip>
                            )}
                            <Button 
                                size="small" 
                                icon={<ReloadOutlined />} 
                                onClick={fetchAllCatsStats}
                                loading={loading}
                            >
                                刷新
                            </Button>
                            <Button 
                                size="small" 
                                onClick={clearCache}
                                type="text"
                            >
                                清理缓存
                            </Button>
                        </Space>
                    }
                    style={{ marginBottom: '16px' }}
                >
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        🎯 演示版本：模拟安全属性系统，基于用户账户生成确定性数据
                    </div>
                </Card>
            )}

            {loading && (
                <Card size="small">
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '12px', color: '#666' }}>
                            正在安全获取猫咪属性...
                        </div>
                    </div>
                </Card>
            )}

            {error && (
                <Alert
                    message="获取属性失败"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                    action={
                        <Button size="small" onClick={fetchAllCatsStats}>
                            重试
                        </Button>
                    }
                />
            )}

            {allCatsStats && !loading && (
                <>
                    {renderStatsOverview()}
                    {allCatsStats.catsStats.map(catStats => renderCatStats(catStats))}
                </>
            )}

            {allCatsStats && allCatsStats.catsStats.length === 0 && !loading && (
                <Card size="small">
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        您还没有任何猫咪
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SecureCatAttributes;
