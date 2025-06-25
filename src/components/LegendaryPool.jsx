import React, { useState, useEffect } from 'react';
import { Card, Button, Statistic, Row, Col, Typography, Space, Alert, Spin, message, Tooltip } from 'antd';
import { TrophyOutlined, GiftOutlined, InfoCircleOutlined, ReloadOutlined, GoldOutlined, DollarOutlined } from '@ant-design/icons';
import { claimDailyReward, getPoolInfo, getMyLegendaryInfo } from '../utils/chainOperations';

const { Title, Text } = Typography;

const LegendaryPool = ({ DFSWallet, userInfo }) => {
  const wallet = DFSWallet;
  const accountName = userInfo?.name;
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [poolInfo, setPoolInfo] = useState({
    totalDFS: '0.00000000',
    totalDailyReward: '0.00000000',
    individualDailyReward: '0.00000000',
    legendaryOwnerCount: 0,
    poolId: 1
  });
  const [legendaryInfo, setLegendaryInfo] = useState({
    hasLegendary: false,
    catId: 0,
    canClaim: false,
    totalClaimed: '0.00000000',
    claimCount: 0,
    lastClaimDay: 'Never'
  });

  // 加载池子信息
  const loadPoolInfo = async () => {
    if (!wallet) return;

    try {
      setLoading(true);
      const info = await getPoolInfo(wallet);
      setPoolInfo(info);
      console.log('池子信息加载成功:', info);
    } catch (error) {
      console.error('获取池子信息失败:', error);
      message.error('获取池子信息失败: ' + (error.message || '未知错误'));
      // 设置默认值，避免界面显示异常
      setPoolInfo({
        totalDFS: '0.00000000',
        totalDailyReward: '0.00000000',
        individualDailyReward: '0.00000000',
        legendaryOwnerCount: 0,
        poolId: 1
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载用户传世猫信息
  const loadLegendaryInfo = async () => {
    if (!wallet || !accountName) return;

    try {
      const info = await getMyLegendaryInfo(wallet, accountName);
      setLegendaryInfo(info);
      console.log('用户传世猫信息加载成功:', info);
    } catch (error) {
      console.error('获取传世猫信息失败:', error);
      // 如果没有传世猫或其他错误，设置默认状态
      setLegendaryInfo({
        hasLegendary: false,
        catId: 0,
        canClaim: false,
        totalClaimed: '0.00000000',
        claimCount: 0,
        lastClaimDay: 'Never'
      });

      // 只有在非预期错误时才显示错误消息
      if (error.message && !error.message.includes("doesn't own any legendary cats")) {
        message.error('获取传世猫信息失败: ' + (error.message || '未知错误'));
      }
    }
  };

  // 领取每日奖励
  const handleClaimDaily = async () => {
    if (!wallet || !accountName) {
      message.warning('请先连接钱包');
      return;
    }

    if (!legendaryInfo.hasLegendary) {
      message.warning('您没有传世猫，无法领取奖励');
      return;
    }

    if (!legendaryInfo.canClaim) {
      message.warning('今日已领取，请明天再来');
      return;
    }

    try {
      setClaiming(true);
      const result = await claimDailyReward(wallet, accountName);

      if (result.success) {
        message.success(`每日奖励领取成功！获得 ${result.amount} DFS`);
        console.log('领取成功，交易ID:', result.txHash);

        // 刷新数据
        await Promise.all([loadPoolInfo(), loadLegendaryInfo()]);
      } else {
        message.error('领取失败，请重试');
      }
    } catch (error) {
      console.error('领取奖励失败:', error);

      // 解析具体的错误信息
      let errorMessage = '领取奖励失败';
      if (error.message) {
        if (error.message.includes('Already claimed today')) {
          errorMessage = '今日已领取，请明天再来';
        } else if (error.message.includes("don't own any legendary cats")) {
          errorMessage = '您没有传世猫，无法领取奖励';
        } else if (error.message.includes('No rewards available')) {
          errorMessage = '池子暂无奖励可领取';
        } else if (error.message.includes('Insufficient pool balance')) {
          errorMessage = '池子余额不足';
        } else {
          errorMessage = '领取奖励失败: ' + error.message;
        }
      }

      message.error(errorMessage);
    } finally {
      setClaiming(false);
    }
  };

  // 刷新所有数据
  const refreshData = async () => {
    await Promise.all([loadPoolInfo(), loadLegendaryInfo()]);
  };

  useEffect(() => {
    if (wallet) {
      loadPoolInfo();
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet && accountName) {
      loadLegendaryInfo();
    }
  }, [wallet, accountName]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Title level={2}>
          <GoldOutlined style={{ color: '#faad14', marginRight: '8px' }} />
          传世猫池
        </Title>
        <Text type="secondary">
          所有传世猫拥有者每日均分池子1%的DFS奖励
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 池子信息卡片 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DollarOutlined style={{ color: '#faad14' }} />
                池子信息
                <Tooltip title="点击刷新数据">
                  <Button 
                    type="text" 
                    icon={<ReloadOutlined />} 
                    onClick={refreshData}
                    loading={loading}
                    size="small"
                  />
                </Tooltip>
              </Space>
            }
            loading={loading}
            style={{ height: '100%' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Statistic
                title="池子总DFS"
                value={poolInfo.totalDFS}
                suffix="DFS"
                precision={8}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="每日总释放 (1%)"
                    value={poolInfo.totalDailyReward}
                    suffix="DFS"
                    precision={8}
                    valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="传世猫拥有者"
                    value={poolInfo.legendaryOwnerCount}
                    suffix="人"
                    valueStyle={{ color: '#faad14', fontSize: '16px' }}
                  />
                </Col>
              </Row>

              <Statistic
                title="每人可领取"
                value={poolInfo.individualDailyReward}
                suffix="DFS"
                precision={8}
                valueStyle={{ color: '#eb2f96', fontSize: '20px' }}
              />

              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
                padding: '12px',
                marginTop: '16px'
              }}>
                <Space direction="vertical" size="small">
                  <Text strong style={{ color: '#389e0d' }}>
                    <InfoCircleOutlined style={{ marginRight: '4px' }} />
                    分配机制
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#666' }}>
                    • 每日释放池子总量的1%<br/>
                    • 所有传世猫拥有者均分<br/>
                    • 每人每天只能领取一次<br/>
                    • 拥有者越少，每人分得越多
                  </Text>
                  {poolInfo.legendaryOwnerCount > 0 && (
                    <Text style={{ fontSize: '11px', color: '#52c41a', fontWeight: 'bold' }}>
                      当前 {poolInfo.legendaryOwnerCount} 人均分，每人可得 {poolInfo.individualDailyReward} DFS
                    </Text>
                  )}
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 我的传世猫信息 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <GiftOutlined style={{ color: '#eb2f96' }} />
                我的传世猫
              </Space>
            }
            style={{ height: '100%' }}
          >
            {!wallet || !accountName ? (
              <Alert
                message="请先连接钱包"
                description="连接钱包后可查看您的传世猫信息"
                type="info"
                showIcon
              />
            ) : !legendaryInfo.hasLegendary ? (
              <Alert
                message="您还没有传世猫"
                description="通过繁殖获得传世品质的猫咪，即可参与每日奖励分配"
                type="warning"
                showIcon
              />
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>传世猫 ID: </Text>
                  <Text style={{ color: '#faad14', fontSize: '16px' }}>#{legendaryInfo.catId}</Text>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="累计领取"
                      value={legendaryInfo.totalClaimed}
                      suffix="DFS"
                      precision={8}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="领取次数"
                      value={legendaryInfo.claimCount}
                      suffix="次"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>

                <div>
                  <Text type="secondary">上次领取: {legendaryInfo.lastClaimDay}</Text>
                </div>

                <Button
                  type="primary"
                  size="large"
                  icon={<GiftOutlined />}
                  onClick={handleClaimDaily}
                  loading={claiming}
                  disabled={!legendaryInfo.canClaim}
                  style={{ 
                    width: '100%',
                    background: legendaryInfo.canClaim ? '#52c41a' : undefined,
                    borderColor: legendaryInfo.canClaim ? '#52c41a' : undefined
                  }}
                >
                  {legendaryInfo.canClaim ? '领取今日奖励' : '今日已领取'}
                </Button>

                {legendaryInfo.canClaim && (
                  <Alert
                    message={`今日可领取: ${poolInfo.individualDailyReward} DFS`}
                    type="success"
                    showIcon
                    style={{ marginTop: '8px' }}
                  />
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 说明信息 */}
      <Card
        title="传世猫池说明"
        style={{ marginTop: '24px' }}
        styles={{ body: { padding: '16px' } }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <GoldOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '8px' }} />
              <Title level={4}>获得传世猫</Title>
              <Text type="secondary">
                通过繁殖系统培育出传世品质的猫咪
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <DollarOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
              <Title level={4}>均分奖励</Title>
              <Text type="secondary">
                所有传世猫拥有者均分池子1%的DFS
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <InfoCircleOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
              <Title level={4}>持续收益</Title>
              <Text type="secondary">
                只要拥有传世猫，就能持续获得被动收益
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default LegendaryPool;
