import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tabs,
  Spin,
  Empty,
  message,
  Statistic,
  Badge,
  Space,
  Tooltip,
  Tag,
  Typography
} from 'antd';
import {
  TrophyOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  ReloadOutlined,
  FireOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import ArenaCard from './ArenaCard';
import PlaceArenaModal from './PlaceArenaModal';
import ChallengeModal from './ChallengeModal';
import {
  getArenas,
  getUserCats,
  placeInArena,
  challengeArena,
  removeArena
} from '../utils/chainOperations';
import './Arena.css';

const { TabPane } = Tabs;
const { Text } = Typography;

const Arena = ({ DFSWallet, accountName }) => {
  const [loading, setLoading] = useState(false);
  const [arenas, setArenas] = useState([]);
  const [userCats, setUserCats] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  
  // 模态框状态
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [selectedBetLevel, setSelectedBetLevel] = useState(null);

  // 计算擂台统计信息
  const getArenaStats = () => {
    const stats = {
      level0Count: 0,
      level1Count: 0,
      level2Count: 0
    };

    arenas.forEach(arena => {
      if (arena.bet_level !== undefined) {
        stats[`level${arena.bet_level}Count`]++;
      }
    });

    return stats;
  };

  // 加载数据
  useEffect(() => {
    if (DFSWallet && accountName) {
      loadData();
    }
  }, [DFSWallet, accountName]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [arenasData, catsData] = await Promise.all([
        getArenas(DFSWallet),
        getUserCats(DFSWallet, accountName)
      ]);
      
      setArenas(arenasData || []);
      setUserCats(catsData || []);
    } catch (error) {
      console.error('加载擂台数据失败:', error);
      message.error('加载擂台数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 筛选擂台
  const getFilteredArenas = () => {
    switch (activeTab) {
      case 'my':
        return arenas.filter(arena => arena.owner === accountName);
      case 'others':
        return arenas.filter(arena => arena.owner !== accountName);
      default:
        return arenas;
    }
  };

  // 处理放置擂台
  const handlePlaceArena = async (catId, betLevel, totalAmount) => {
    try {
      setLoading(true);
      await placeInArena(DFSWallet, accountName, catId, betLevel, totalAmount);
      message.success('猫咪已成功放置到擂台！');
      setPlaceModalVisible(false);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('放置擂台失败:', error);
      message.error('放置擂台失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 处理挑战擂台
  const handleChallengeArena = async (challengerCatId, betLevel) => {
    try {
      setLoading(true);
      await challengeArena(DFSWallet, accountName, challengerCatId, betLevel);
      message.success('挑战已发起！等待战斗结果...');
      setChallengeModalVisible(false);
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('挑战擂台失败:', error);
      message.error('挑战擂台失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 处理移除擂台
  const handleRemoveArena = async (arenaId) => {
    try {
      setLoading(true);
      await removeArena(DFSWallet, accountName, arenaId);
      message.success('擂台已移除，奖池已退还！');
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error('移除擂台失败:', error);
      message.error('移除擂台失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染擂台统计
  const renderArenaStats = () => {
    const totalArenas = arenas.length;
    const myArenas = arenas.filter(arena => arena.owner === accountName).length;
    const totalPool = arenas.reduce((sum, arena) => {
      return sum + parseFloat(arena.total_pool.split(' ')[0] || 0);
    }, 0);

    return (
      <Row gutter={[8, 16]} style={{ marginBottom: 24 }} className="arena-stats">
        <Col xs={8} sm={8} md={8}>
          <Card>
            <Statistic
              title="活跃擂台"
              value={totalArenas}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8} md={8}>
          <Card>
            <Statistic
              title="我的擂台"
              value={myArenas}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={8} md={8}>
          <Card>
            <Statistic
              title="总奖池"
              value={totalPool.toFixed(2)}
              suffix="DFS"
              prefix={<FireOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // 渲染挑战等级卡片
  const renderChallengeLevels = () => {
    const stats = getArenaStats();
    const betLevels = [
      { level: 0, amount: 2, label: '2 DFS', color: '#52c41a', name: '初级擂台' },
      { level: 1, amount: 5, label: '5 DFS', color: '#1890ff', name: '中级擂台' },
      { level: 2, amount: 10, label: '10 DFS', color: '#f5222d', name: '高级擂台' }
    ];

    return (
      <Row gutter={[16, 16]}>
        {betLevels.map(level => {
          const arenaCount = stats[`level${level.level}Count`] || 0;
          const canChallenge = arenaCount >= 3;

          return (
            <Col xs={24} sm={12} lg={8} key={level.level}>
              <Card
                hoverable
                style={{
                  borderColor: level.color,
                  borderWidth: 2,
                  background: canChallenge
                    ? `linear-gradient(135deg, ${level.color}10, ${level.color}05)`
                    : '#f5f5f5'
                }}
                styles={{ body: { padding: '20px' } }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: level.color,
                    marginBottom: '8px'
                  }}>
                    {level.name}
                  </div>

                  <Tag
                    color={level.color}
                    style={{
                      fontSize: '14px',
                      padding: '4px 12px',
                      marginBottom: '16px'
                    }}
                  >
                    {level.label}
                  </Tag>

                  <div style={{ marginBottom: '16px' }}>
                    <Statistic
                      title="可挑战擂台"
                      value={arenaCount}
                      suffix="个"
                      valueStyle={{
                        color: canChallenge ? level.color : '#999',
                        fontSize: '32px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text type={canChallenge ? 'success' : 'danger'}>
                      {canChallenge ? '✓ 可以挑战' : '✗ 需要至少3个擂台'}
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    onClick={() => {
                      setSelectedBetLevel(level.level);
                      setChallengeModalVisible(true);
                    }}
                    disabled={!canChallenge}
                    style={{
                      backgroundColor: canChallenge ? level.color : undefined,
                      borderColor: canChallenge ? level.color : undefined,
                      width: '100%'
                    }}
                  >
                    挑战 {level.label}
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  // 渲染擂台列表
  const renderArenaList = () => {
    const filteredArenas = getFilteredArenas();

    if (filteredArenas.length === 0) {
      return (
        <Empty
          description={
            activeTab === 'my'
              ? "您还没有放置任何擂台"
              : "暂无可挑战的擂台"
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {filteredArenas.map(arena => (
          <Col xs={24} sm={12} lg={8} xl={6} key={arena.id}>
            <ArenaCard
              arena={arena}
              isOwner={arena.owner === accountName}
              onChallenge={() => {
                setSelectedBetLevel(null); // 从擂台卡片挑战时不预选等级
                setChallengeModalVisible(true);
              }}
              onRemove={() => handleRemoveArena(arena.id)}
              userCats={userCats}
              showChallengeButton={activeTab !== 'all'} // 全部擂台页面不显示挑战按钮
            />
          </Col>
        ))}
      </Row>
    );
  };

  if (!DFSWallet || !accountName) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="请先连接钱包" />
      </div>
    );
  }

  return (
    <div className="arena-container">
      <div style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <FireOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              猫咪擂台
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              放置你的猫咪到擂台，或挑战其他玩家获得奖励
            </p>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setPlaceModalVisible(true)}
              disabled={loading}
            >
              放置擂台
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      {renderArenaStats()}

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            <Badge count={arenas.length} showZero>
              <ThunderboltOutlined style={{ fontSize: 16 }} />
            </Badge>
          }
        >
          <TabPane tab="全部擂台" key="all">
            <Spin spinning={loading}>
              {renderArenaList()}
            </Spin>
          </TabPane>
          <TabPane tab="我的擂台" key="my">
            <Spin spinning={loading}>
              {renderArenaList()}
            </Spin>
          </TabPane>
          <TabPane tab="可挑战" key="others">
            <Spin spinning={loading}>
              {renderChallengeLevels()}
            </Spin>
          </TabPane>
        </Tabs>
      </Card>

      {/* 放置擂台模态框 */}
      <PlaceArenaModal
        visible={placeModalVisible}
        onCancel={() => setPlaceModalVisible(false)}
        onConfirm={handlePlaceArena}
        userCats={userCats}
        loading={loading}
      />

      {/* 挑战擂台模态框 */}
      <ChallengeModal
        visible={challengeModalVisible}
        onCancel={() => {
          setChallengeModalVisible(false);
          setSelectedBetLevel(null);
        }}
        onConfirm={handleChallengeArena}
        arenaStats={getArenaStats()}
        userCats={userCats}
        loading={loading}
        preselectedBetLevel={selectedBetLevel}
      />
    </div>
  );
};

export default Arena;
