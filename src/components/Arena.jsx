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
  SafetyOutlined,
  QuestionCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import ArenaCard from './ArenaCard';
import PlaceArenaModal from './PlaceArenaModal';
import ChallengeModal from './ChallengeModal';
import { formatTime } from '../utils/timeUtils';
import BattleAnimation from './BattleAnimation';
import ArenaRules from './ArenaRules';
import CatRenderer from './CatRenderer';
import {
  getArenas,
  getUserCats,
  placeInArena,
  challengeArena,
  removeArena,
  decryptCatStats,
  getUserChallengeRecords,
  QUALITY_NAMES
} from '../utils/chainOperations';
import './Arena.css';

const { TabPane } = Tabs;
const { Text } = Typography;

const Arena = ({ DFSWallet, accountName }) => {
  const [loading, setLoading] = useState(false);
  const [arenas, setArenas] = useState([]);
  const [userCats, setUserCats] = useState([]);
  const [challengeRecords, setChallengeRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  
  // 模态框状态
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [selectedBetLevel, setSelectedBetLevel] = useState(null);

  // 战斗动画状态
  const [battleAnimationVisible, setBattleAnimationVisible] = useState(false);
  const [battleData, setBattleData] = useState(null);

  // 品质颜色映射
  const QUALITY_COLORS = {
    0: '#8c8c8c',  // 普通 - 灰色
    1: '#52c41a',  // 精良 - 绿色
    2: '#1890ff',  // 卓越 - 蓝色
    3: '#722ed1',  // 非凡 - 紫色
    4: '#f5222d',  // 至尊 - 红色
    5: '#fa8c16',  // 神圣 - 橙色
    6: '#eb2f96',  // 永恒 - 粉色
    7: '#fadb14'   // 传世 - 金色
  };

  // 规则说明状态
  const [rulesVisible, setRulesVisible] = useState(false);

  // 解析战斗结果
  const parseBattleResult = (consoleOutput) => {
    try {
      // 解析挑战成功的输出: "Cat #123 defeated cat #456 in bet level 1 arena. Total prize: 4.50000000 DFS..."
      const defeatedMatch = consoleOutput.match(/Cat #(\d+) defeated cat #(\d+) in bet level (\d+) arena/);
      if (defeatedMatch) {
        return {
          challengerCatId: parseInt(defeatedMatch[1]),
          arenaCatId: parseInt(defeatedMatch[2]),
          betLevel: parseInt(defeatedMatch[3]),
          winner: 'challenger',
          result: 'victory'
        };
      }

      // 解析挑战失败的输出: "Cat #456 defended successfully against cat #123 in bet level 1 arena..."
      const defendedMatch = consoleOutput.match(/Cat #(\d+) defended successfully against cat #(\d+) in bet level (\d+) arena/);
      if (defendedMatch) {
        return {
          challengerCatId: parseInt(defendedMatch[2]),
          arenaCatId: parseInt(defendedMatch[1]),
          betLevel: parseInt(defendedMatch[3]),
          winner: 'arena',
          result: 'defeat'
        };
      }

      return null;
    } catch (error) {
      console.error('解析战斗结果失败:', error);
      return null;
    }
  };

  // 显示战斗动画
  const showBattleAnimation = async (challengerCatId, arenaCatId, battleInfo) => {
    try {
      // 获取挑战者猫咪信息
      const challengerCat = userCats.find(cat => cat.id === challengerCatId);
      if (!challengerCat) {
        console.error('未找到挑战者猫咪:', challengerCatId);
        return;
      }

      // 获取擂台猫咪信息
      const arenaCat = arenas.find(arena => arena.cat_id === arenaCatId)?.cat;
      if (!arenaCat) {
        console.error('未找到擂台猫咪:', arenaCatId);
        return;
      }

      // 解密猫咪属性
      const challengerStats = decryptCatStats(
        challengerCat.encrypted_stats,
        challengerCat.encrypted_stats_high,
        challengerCat.id
      );

      const arenaStats = decryptCatStats(
        arenaCat.encrypted_stats,
        arenaCat.encrypted_stats_high,
        arenaCat.id
      );

      // 设置战斗数据并显示动画
      setBattleData({
        challengerCat,
        arenaCat,
        challengerStats,
        arenaStats,
        battleResult: battleInfo
      });

      setBattleAnimationVisible(true);
    } catch (error) {
      console.error('准备战斗动画失败:', error);
    }
  };

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
      const [arenasData, catsData, challengeData] = await Promise.all([
        getArenas(DFSWallet),
        getUserCats(DFSWallet, accountName),
        getUserChallengeRecords(DFSWallet, accountName)
      ]);

      setArenas(arenasData || []);
      setUserCats(catsData || []);
      setChallengeRecords(challengeData || []);
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
      const result = await challengeArena(DFSWallet, accountName, challengerCatId, betLevel);

      // 解析挑战结果 - 遍历所有action traces寻找console输出
      let consoleOutput = '';
      const actionTraces = result.processed?.action_traces || [];

      // 遍历所有action traces寻找包含战斗结果的console输出
      for (const trace of actionTraces) {
        if (trace.console && (trace.console.includes('defeated') || trace.console.includes('defended successfully'))) {
          consoleOutput = trace.console;
          break;
        }
        // 也检查inline traces
        if (trace.inline_traces) {
          for (const inlineTrace of trace.inline_traces) {
            if (inlineTrace.console && (inlineTrace.console.includes('defeated') || inlineTrace.console.includes('defended successfully'))) {
              consoleOutput = inlineTrace.console;
              break;
            }
          }
        }
        if (consoleOutput) break;
      }

      console.log('挑战结果console输出:', consoleOutput);

      // 提取战斗信息
      const battleInfo = parseBattleResult(consoleOutput);

      if (battleInfo) {
        // 获取两只猫咪的详细信息并显示战斗动画
        await showBattleAnimation(challengerCatId, battleInfo.arenaCatId, battleInfo);
      } else {
        message.success('挑战已发起！等待战斗结果...');
      }

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

  // 处理战斗回放
  const handleBattleReplay = async (record) => {
    try {
      if (!record.challengerCat || !record.defenderCat) {
        message.warning('缺少猫咪数据，无法回放战斗');
        return;
      }

      // 使用与实际挑战相同的属性解密方法
      const challengerStats = decryptCatStats(
        record.challengerCat.encrypted_stats,
        record.challengerCat.encrypted_stats_high,
        record.challengerCat.id
      );

      const defenderStats = decryptCatStats(
        record.defenderCat.encrypted_stats,
        record.defenderCat.encrypted_stats_high,
        record.defenderCat.id
      );

      console.log('战斗回放数据:', {
        challengerCat: record.challengerCat.id,
        defenderCat: record.defenderCat.id,
        challengerStats,
        defenderStats,
        victory: record.victory,
        timestamp: record.created_at
      });

      // 构建与实际挑战相同格式的战斗结果数据
      const battleInfo = {
        challengerCatId: record.challenger_cat_id,
        arenaCatId: record.defender_cat_id,
        betLevel: record.challenge_level,
        winner: record.victory ? 'challenger' : 'arena',
        result: record.victory ? 'victory' : 'defeat',
        // 添加战力信息用于动画计算
        challengerPower: challengerStats ?
          challengerStats.attack + challengerStats.defense + challengerStats.health +
          challengerStats.critical + challengerStats.dodge + challengerStats.luck : 300,
        defenderPower: defenderStats ?
          defenderStats.attack + defenderStats.defense + defenderStats.health +
          defenderStats.critical + defenderStats.dodge + defenderStats.luck : 300,
        // 添加回放标识，让动画组件知道这是回放
        isReplay: true,
        // 使用挑战记录的时间戳作为随机种子，确保回放一致性
        randomSeed: new Date(record.created_at).getTime()
      };

      // 使用与实际挑战相同的数据结构设置战斗数据
      setBattleData({
        challengerCat: record.challengerCat,
        arenaCat: record.defenderCat,
        challengerStats: challengerStats || {
          attack: 50, defense: 50, health: 50,
          critical: 50, dodge: 50, luck: 50
        },
        arenaStats: defenderStats || {
          attack: 50, defense: 50, health: 50,
          critical: 50, dodge: 50, luck: 50
        },
        battleResult: battleInfo
      });

      setBattleAnimationVisible(true);
    } catch (error) {
      console.error('准备战斗回放失败:', error);
      message.error('战斗回放失败');
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
      <Row gutter={[4, 16]} style={{ marginBottom: 24 }} className="arena-stats">
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

  // 渲染挑战记录列表
  const renderChallengeRecords = () => {
    if (challengeRecords.length === 0) {
      return (
        <Empty
          description="您还没有挑战记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const betLevelNames = ['初级擂台', '中级擂台', '高级擂台'];
    const betLevelColors = ['#52c41a', '#1890ff', '#f5222d'];

    return (
      <Row gutter={[16, 16]}>
        {challengeRecords.map(record => (
          <Col xs={24} sm={12} lg={8} key={record.challenge_id}>
            <Card
              size="small"
              style={{
                borderColor: record.victory ? '#52c41a' : '#ff4d4f',
                borderWidth: 2
              }}
              styles={{ body: { padding: '12px' } }}
            >
              <div style={{ marginBottom: '8px' }}>
                <Space>
                  <Tag color={record.victory ? 'success' : 'error'}>
                    {record.victory ? '胜利' : '失败'}
                  </Tag>
                  <Tag color={betLevelColors[record.challenge_level]}>
                    {betLevelNames[record.challenge_level]}
                  </Tag>
                </Space>
              </div>

              {/* 猫咪对战展示区域 */}
              <div style={{ marginBottom: '12px' }}>
                <Row gutter={4} align="top" justify="space-between">
                  {/* 挑战者 */}
                  <Col span={11}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text strong style={{ color: '#1890ff', fontSize: '12px' }}>挑战者</Text>
                      </div>
                      {record.challengerCat && (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          margin: '0 auto 4px',
                          border: `2px solid ${QUALITY_COLORS[record.challengerCat.quality] || QUALITY_COLORS[0]}`,
                          borderRadius: '6px',
                          padding: '2px',
                          background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          <div style={{ transform: 'scale(0.45)', transformOrigin: 'center' }}>
                            <CatRenderer
                              parent={`challenge-challenger-${record.challenger_cat_id}`}
                              gene={record.challengerCat.genes}
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <Text style={{ fontSize: '12px' }}>#{record.challenger_cat_id}</Text>
                        {record.challengerCat && (
                          <div style={{ marginTop: '2px' }}>
                            <Tag
                              size="small"
                              style={{
                                backgroundColor: QUALITY_COLORS[record.challengerCat.quality] || QUALITY_COLORS[0],
                                color: 'white',
                                border: 'none',
                                fontSize: '10px',
                                padding: '0 4px',
                                lineHeight: '16px'
                              }}
                            >
                              {QUALITY_NAMES[record.challengerCat.quality] || '普通'}
                            </Tag>
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {record.challenger_account === accountName ? '我的' : `主人: ${record.challenger_account}`}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* VS 标识 */}
                  <Col span={2}>
                    <div style={{
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingTop: '30px'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        VS
                      </div>
                    </div>
                  </Col>

                  {/* 守护者 */}
                  <Col span={11}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <Text strong style={{ color: '#f5222d', fontSize: '12px' }}>守护者</Text>
                      </div>
                      {record.defenderCat && (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          margin: '0 auto 4px',
                          border: `2px solid ${QUALITY_COLORS[record.defenderCat.quality] || QUALITY_COLORS[0]}`,
                          borderRadius: '6px',
                          padding: '2px',
                          background: 'linear-gradient(135deg, #fff2f0, #ffccc7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          <div style={{ transform: 'scale(0.45)', transformOrigin: 'center' }}>
                            <CatRenderer
                              parent={`challenge-defender-${record.defender_cat_id}`}
                              gene={record.defenderCat.genes}
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <Text style={{ fontSize: '12px' }}>#{record.defender_cat_id}</Text>
                        {record.defenderCat && (
                          <div style={{ marginTop: '2px' }}>
                            <Tag
                              size="small"
                              style={{
                                backgroundColor: QUALITY_COLORS[record.defenderCat.quality] || QUALITY_COLORS[0],
                                color: 'white',
                                border: 'none',
                                fontSize: '10px',
                                padding: '0 4px',
                                lineHeight: '16px'
                              }}
                            >
                              {QUALITY_NAMES[record.defenderCat.quality] || '普通'}
                            </Tag>
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {record.defender_account === accountName ? '我的' : `主人: ${record.defender_account}`}
                        </Text>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                <Text strong style={{ fontSize: '12px' }}>擂台ID: </Text>
                <Text style={{ fontSize: '12px' }}>{record.arena_id}</Text>
              </div>

              <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {formatTime(record.created_at)}
                </Text>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleBattleReplay(record)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    fontSize: '12px',
                    height: '28px'
                  }}
                >
                  战斗回放
                </Button>
              </div>
            </Card>
          </Col>
        ))}
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
      <Row gutter={[12, 12]}>
        {filteredArenas.map(arena => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4} key={arena.id}>
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
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <FireOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              猫咪擂台
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => setRulesVisible(true)}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginLeft: 8,
                  fontSize: '16px'
                }}
                title="查看擂台规则"
              />
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
          <TabPane tab="可挑战" key="others">
            <Spin spinning={loading}>
              {renderChallengeLevels()}
            </Spin>
          </TabPane>
          <TabPane tab="我的擂台" key="my">
            <Spin spinning={loading}>
              {renderArenaList()}
            </Spin>
          </TabPane>
          <TabPane tab="我的挑战" key="challenges">
            <Spin spinning={loading}>
              {renderChallengeRecords()}
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

      {/* 战斗动画模态框 */}
      {battleData && (
        <BattleAnimation
          visible={battleAnimationVisible}
          challengerCat={battleData.challengerCat}
          arenaCat={battleData.arenaCat}
          challengerStats={battleData.challengerStats}
          arenaStats={battleData.arenaStats}
          battleResult={battleData.battleResult}
          onClose={() => {
            setBattleAnimationVisible(false);
            setBattleData(null);
          }}
        />
      )}

      {/* 规则说明模态框 */}
      <ArenaRules
        visible={rulesVisible}
        onClose={() => setRulesVisible(false)}
      />
    </div>
  );
};

export default Arena;
