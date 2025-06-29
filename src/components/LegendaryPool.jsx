import React, { useState, useEffect } from 'react';
import { Card, Button, Statistic, Row, Col, Typography, Space, Alert, Spin, message } from 'antd';
import { GiftOutlined, InfoCircleOutlined, ReloadOutlined, GoldOutlined, DollarOutlined } from '@ant-design/icons';
import { claimDailyReward, getPoolInfo, getMyLegendaryInfo } from '../utils/chainOperations';
import './LegendaryPool.css';

const { Text } = Typography;

const LegendaryPool = ({ DFSWallet, userInfo }) => {
  const wallet = DFSWallet;
  const accountName = userInfo?.name;
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [poolInfo, setPoolInfo] = useState({
    totalDFS: '0.00000000',
    totalDailyReward: '0.00000000',
    perCatReward: '0.00000000',
    legendaryOwnerCount: 0,
    totalLegendaryCats: 0,
    poolId: 1
  });
  const [legendaryInfo, setLegendaryInfo] = useState({
    hasLegendary: false,
    legendaryCount: 0,
    catIds: [],
    canClaim: false,
    totalClaimed: '0.00000000',
    claimCount: 0,
    lastClaimDay: 'Never',
    userDailyReward: '0.00000000'
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
        perCatReward: '0.00000000',
        legendaryOwnerCount: 0,
        totalLegendaryCats: 0,
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
        legendaryCount: 0,
        catIds: [],
        canClaim: false,
        totalClaimed: '0.00000000',
        claimCount: 0,
        lastClaimDay: 'Never',
        userDailyReward: '0.00000000'
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
        const rewardAmount = legendaryInfo.userDailyReward || result.amount;
        message.success(`每日奖励领取成功！获得 ${rewardAmount} DFS (${legendaryInfo.legendaryCount}只传世猫)`);
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
    <div className="legendary-pool-container">
      {/* 标题和操作区域 */}
      <div style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <GoldOutlined style={{ marginRight: 8, color: '#faad14' }} />
              传世猫池
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              池子1%的DFS按传世猫数量分配，拥有多只传世猫获得更多奖励
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      {/* 主要内容区域 */}
      <Card>
        <Row gutter={[24, 24]}>
          {/* 池子信息卡片 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: '#faad14' }} />
                  池子信息
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
                <Col span={8}>
                  <Statistic
                    title="每日总释放 (1%)"
                    value={poolInfo.totalDailyReward}
                    suffix="DFS"
                    precision={8}
                    valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="传世猫总数"
                    value={poolInfo.totalLegendaryCats}
                    suffix="只"
                    valueStyle={{ color: '#faad14', fontSize: '14px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="每猫奖励"
                    value={poolInfo.perCatReward}
                    suffix="DFS"
                    precision={8}
                    valueStyle={{ color: '#722ed1', fontSize: '14px' }}
                  />
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: '16px' }}>
                <Col span={12}>
                  <Statistic
                    title="传世猫拥有者"
                    value={poolInfo.legendaryOwnerCount}
                    suffix="人"
                    valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  />
                </Col>
              </Row>

              <Statistic
                title="我的可领取"
                value={legendaryInfo.hasLegendary ? legendaryInfo.userDailyReward : '0.00000000'}
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
                    • 按传世猫数量分配奖励<br/>
                    • 每人每天只能领取一次<br/>
                    • 拥有多只传世猫获得更多奖励
                  </Text>
                  {poolInfo.totalLegendaryCats > 0 && (
                    <Text style={{ fontSize: '11px', color: '#52c41a', fontWeight: 'bold' }}>
                      当前 {poolInfo.totalLegendaryCats} 只传世猫，每只可得 {poolInfo.perCatReward} DFS
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
                  <Text strong>拥有传世猫: </Text>
                  <Text style={{ color: '#faad14', fontSize: '16px' }}>{legendaryInfo.legendaryCount}只</Text>
                </div>

                <div>
                  <Text strong>传世猫 ID: </Text>
                  <Text style={{ color: '#faad14', fontSize: '14px' }}>
                    {legendaryInfo.catIds && legendaryInfo.catIds.length > 0
                      ? legendaryInfo.catIds.map(id => `#${id}`).join(', ')
                      : '无'}
                  </Text>
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
                    message={`今日可领取: ${legendaryInfo.userDailyReward} DFS (${legendaryInfo.legendaryCount}只传世猫)`}
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
      {/* <div style={{ marginTop: '24px' }}>
        <h3 style={{ color: 'white', marginBottom: '16px' }}>传世猫池说明</h3>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={8}>
            <div style={{
              textAlign: 'center',
              padding: '20px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8e8e8'
            }}>
              <GoldOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '12px' }} />
              <h4 style={{ color: '#000000', margin: '8px 0', fontWeight: 'bold' }}>获得传世猫</h4>
              <p style={{ color: '#333333', margin: 0, fontSize: '14px' }}>
                通过繁殖系统培育出传世品质的猫咪
              </p>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{
              textAlign: 'center',
              padding: '20px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8e8e8'
            }}>
              <DollarOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
              <h4 style={{ color: '#000000', margin: '8px 0', fontWeight: 'bold' }}>按猫分配</h4>
              <p style={{ color: '#333333', margin: 0, fontSize: '14px' }}>
                池子1%的DFS按传世猫数量分配，多猫多得
              </p>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{
              textAlign: 'center',
              padding: '20px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8e8e8'
            }}>
              <InfoCircleOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
              <h4 style={{ color: '#000000', margin: '8px 0', fontWeight: 'bold' }}>持续收益</h4>
              <p style={{ color: '#333333', margin: 0, fontSize: '14px' }}>
                只要拥有传世猫，就能持续获得被动收益
              </p>
            </div>
          </Col>
        </Row>
      </div> */}
    </Card>
    </div>
  );
};

export default LegendaryPool;
