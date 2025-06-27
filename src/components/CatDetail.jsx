import React, { useState, useEffect, useMemo } from 'react';
import { Card, Progress, Button, Spin, Tag, Divider, message, Space, Modal, Select, Row, Col } from 'antd';
import {
  HeartOutlined,
  ExperimentOutlined,
  UpCircleOutlined,
  GiftOutlined,
  SwapOutlined,
  CameraOutlined,
  TeamOutlined,
  EyeOutlined,
  FireOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  StarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import CatRenderer from './CatRenderer';
import CatCoinGuide from './CatCoinGuide';
import { getCatGeneDetails } from '../utils/catGeneParser';
import {
  checkCatAction,
  upgradeCatWithCoin,
  restoreStaminaWithCoin,
  upgradeCat,
  checkCatHasAvailableExp,
  feedCatWithDFS,
  breedCats,
  checkSwapCat,
  grabImage,
  calculateNextLevelCatCoinCost,
  decryptCatStats,
  QUALITY_NAMES,
  GENDER_NAMES
} from '../utils/chainOperations';
import { formatTime, formatRelativeTime, getAgeInDays } from '../utils/timeUtils';
import './CatDetail.css';

const CatDetail = ({ DFSWallet, userInfo, selectedCat, refreshCats, allCats = [] }) => {
  const [loading, setLoading] = useState(false);
  const [geneDetails, setGeneDetails] = useState(null);
  const [hasActionPerformed, setHasActionPerformed] = useState(false);
  const [checkInterval, setCheckInterval] = useState(null);
  const [hasAvailableExp, setHasAvailableExp] = useState(false);

  // New BongoCat functionality state
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [feedingStates, setFeedingStates] = useState({}); // 跟踪每只猫的DFS喂养状态
  const [attributeModalVisible, setAttributeModalVisible] = useState(false); // 属性弹窗状态

  // Calculate exp progress percentage
  const getExpProgressPercent = (exp, level) => {
    // Next level total exp required
    const nextLevelExp = 100 * level * level + 500 * level;
    // Current total exp
    const currentExp = exp || 0;
    
    // Calculate progress percentage, ensure between 0-100
    return Math.min(Math.max(Math.floor((currentExp / nextLevelExp) * 100), 0), 100);
  };

  // Format for display
  const getExpDisplayText = (exp, level) => {
    const nextLevelExp = 100 * level * level + 500 * level;
    const currentExp = exp || 0;
    return `${currentExp}/${nextLevelExp}`;
  };

  // Check if cat can upgrade
  const canUpgrade = (exp, level) => {
    const nextLevelExp = 100 * level * level + 500 * level;
    return exp >= nextLevelExp;
  };

  // Format stamina value (convert from 0-10000 to 0-100.00)
  const formatStamina = (stamina) => {
    if (!stamina && stamina !== 0) return 0;
    return stamina;
  };

  // Get stamina percentage for progress bar
  const getStaminaPercent = (stamina) => {
    if (!stamina && stamina !== 0) return 0;
    return Math.min(100, formatStamina(stamina));
  };

  // Determine stamina color
  const getStaminaColor = (stamina) => {
    return (stamina >= 5000) ? '#52c41a' : '#faad14';
  };

  // Check if stamina is full
  const isStaminaFull = (stamina) => {
    return stamina >= 10000;
  };

  // Calculate total power (战力)
  const calculateTotalPower = (cat) => {
    console.log('计算战力 - 猫咪数据:', cat);
    // console.log('解密属性:', cat.decryptedStats);

    // 如果没有解密属性，尝试手动解密
    let stats = cat.decryptedStats;
    if (!stats && cat.encrypted_stats && cat.id) {
      console.log('手动解密属性...');
      stats = decryptCatStats(cat.encrypted_stats, cat.encryptedStatsHigh, cat.id);
      console.log(`手动解密结果: id${cat.id} ${stats}`);
    }

    if (!stats) {
      console.log('没有解密属性，返回???');
      return '???';
    }

    const totalPower = (stats.attack || 0) +
                      (stats.defense || 0) +
                      (stats.health || 0) +
                      (stats.critical || 0) +
                      (stats.dodge || 0) +
                      (stats.luck || 0);

    console.log('计算出的总战力:', totalPower);
    return totalPower.toLocaleString();
  };

  // 获取属性颜色 (根据属性值高低)
  const getStatColor = (value, maxValue = 100) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return '#52c41a'; // 绿色 - 优秀
    if (percentage >= 60) return '#1890ff'; // 蓝色 - 良好
    if (percentage >= 40) return '#faad14'; // 黄色 - 一般
    if (percentage >= 20) return '#fa8c16'; // 橙色 - 较差
    return '#f5222d'; // 红色 - 很差
  };

  // 获取属性等级描述
  const getStatRank = (value, maxValue = 100) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'S';
    if (percentage >= 60) return 'A';
    if (percentage >= 40) return 'B';
    if (percentage >= 20) return 'C';
    return 'D';
  };

  // 获取解密后的属性 (确保属性被正确解密) - 128位支持
  const getDecryptedStats = (cat) => {
    if (cat.decryptedStats) {
      return cat.decryptedStats;
    }

    if (cat.encrypted_stats && cat.id) {
      console.log(`为猫咪#${cat.id}手动解密属性...`);
      const stats = decryptCatStats(cat.encrypted_stats, cat.encryptedStatsHigh, cat.id);
      console.log(`猫咪#${cat.id}解密结果:`, stats);
      return stats;
    }

    return null;
  };



  // 定时检查是否有可获取的经验
  const startCheckingForExp = () => {
    // 清除之前的定时器
    if (checkInterval) {
      clearInterval(checkInterval);
    }

    // 设置新的定时器，每10秒检查一次
    const interval = setInterval(async () => {
      try {
        if (!DFSWallet || !userInfo || !selectedCat) {
          setHasAvailableExp(false);
          return;
        }

        // 检查是否有可获取的经验
        const hasExp = await checkCatHasAvailableExp(
          DFSWallet,
          userInfo.name,
          selectedCat.id,
          selectedCat.last_external_check || 0
        );

        setHasAvailableExp(hasExp);
        // console.log('检查经验结果:', hasExp);
      } catch (error) {
        console.error('检查可获取经验出错:', error);
        setHasAvailableExp(false);
      }
    }, 10 * 1000); // 10秒检查一次

    setCheckInterval(interval);

    // 立即执行一次检查
    setTimeout(async () => {
      try {
        if (DFSWallet && userInfo && selectedCat) {
          const hasExp = await checkCatHasAvailableExp(
            DFSWallet,
            userInfo.name,
            selectedCat.id,
            selectedCat.last_external_check || 0
          );
          setHasAvailableExp(hasExp);
          console.log('初始检查经验结果:', hasExp);
          // console.log('基因', selectedCat.genes);
        }
      } catch (error) {
        console.error('初始检查可获取经验出错:', error);
      }
    }, 1000);
  };

  // Parse gene details when cat changes
  useEffect(() => {
    if (selectedCat && selectedCat.genes) {
      setGeneDetails(getCatGeneDetails(selectedCat.genes));
    }
  }, [selectedCat]);

  // 启动和清理定时器
  useEffect(() => {
    if (selectedCat && DFSWallet && userInfo) {
      startCheckingForExp();
    }

    // 组件卸载时清除定时器
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [selectedCat, DFSWallet, userInfo]);

  // 监听猫咪列表变化，更新繁殖伙伴选择
  useEffect(() => {
    if (selectedPartner && allCats) {
      const partnerExists = allCats.find(cat => cat.id === selectedPartner);
      if (!partnerExists) {
        console.log('选择的繁殖伙伴已不存在，清除选择');
        setSelectedPartner(null);
      }
    }
  }, [allCats, selectedPartner]);

  // 当选择的猫咪改变时，清除繁殖伙伴选择和关闭模态框
  useEffect(() => {
    setSelectedPartner(null);
    setBreedModalVisible(false);
  }, [selectedCat?.id]);

  // Handle cat action (check)
  const handleCheckAction = async () => {
    if (!DFSWallet || !userInfo || !selectedCat) {
      message.warning('钱包未连接或未选择猫咪');
      return;
    }

    try {
      setLoading(true);
      await checkCatAction(DFSWallet, userInfo.name, selectedCat.id);
      message.success('检查操作成功完成！');
      setHasActionPerformed(true);
      setHasAvailableExp(false); // 重置经验检查状态
      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
    } catch (error) {
      console.error('检查操作失败:', error);
      message.error('检查操作失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Handle cat stamina restore with cat coin
  const handleRestoreStamina = async () => {
    if (!DFSWallet || !userInfo || !selectedCat) {
      message.warning('钱包未连接或未选择猫咪');
      return;
    }

    if (isStaminaFull(selectedCat.stamina)) {
      message.info('猫咪体力已满！');
      return;
    }

    try {
      setLoading(true);
      await restoreStaminaWithCoin(DFSWallet, userInfo, selectedCat.id, '1.00000000');
      setHasActionPerformed(true);
      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
    } catch (error) {
      console.error('猫币恢复体力失败:', error);
      message.error('猫币恢复体力失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Handle cat upgrade with cat coin
  const handleUpgradeCatWithCoin = async () => {
    if (!DFSWallet || !userInfo || !selectedCat) {
      message.warning('钱包未连接或未选择猫咪');
      return;
    }

    if (selectedCat.level >= 100) {
      message.warning('猫咪已达到最高等级');
      return;
    }

    try {
      setLoading(true);

      // 计算升级成本
      const requiredCoins = calculateNextLevelCatCoinCost(selectedCat);
      console.log(`升级猫咪#${selectedCat.id} 需要 ${requiredCoins.toFixed(2)} BGCAT`);

      await upgradeCatWithCoin(DFSWallet, userInfo, selectedCat.id, selectedCat);
      setHasActionPerformed(true);

      message.success(`升级成功！消耗了 ${requiredCoins.toFixed(2)} BGCAT`);

      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
    } catch (error) {
      console.error('猫币升级失败:', error);
      message.error('猫币升级失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Pat the cat - now opens attribute modal
  const handlePatCat = () => {
    setAttributeModalVisible(true);
  };

  // Handle DFS feeding for specific cat (used in attributes panel)
  const handleDFSFeedCat = async (catId) => {
    if (!DFSWallet || !userInfo) {
      message.warning('钱包未连接');
      return;
    }
    console.log(`000000000000000000000000000000000000000000000000000000000000`);
    try {
      // 设置特定猫咪的喂养状态
      setFeedingStates(prev => ({ ...prev, [catId]: true }));

      console.log(`开始为猫咪#进行DFS喂养`);
      await feedCatWithDFS(DFSWallet, userInfo.name, catId, '1.00000000');
      setHasActionPerformed(true);

      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
    } catch (error) {
      console.error('DFS喂养失败:', error);
      message.error('DFS喂养失败: ' + (error.message || String(error)));
    } finally {
      // 清除特定猫咪的喂养状态
      setFeedingStates(prev => ({ ...prev, [catId]: false }));
    }
  };

  // Handle DFS feeding for current selected cat (legacy function)
  const handleFeedWithDFS = async () => {
    if (!selectedCat) {
      message.warning('未选择猫咪');
      return;
    }
    await handleDFSFeedCat(selectedCat.id);
  };

  // Handle check swap
  const handleCheckSwap = async () => {
    if (!DFSWallet || !userInfo) {
      message.warning('钱包未连接');
      return;
    }

    try {
      setLoading(true);
      await checkSwapCat(DFSWallet, userInfo.name);
      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
    } catch (error) {
      console.error('检查交易记录失败:', error);
      message.error('检查交易记录失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Handle grab image
  const handleGrabImage = async () => {
    if (!DFSWallet || !userInfo) {
      message.warning('钱包未连接');
      return;
    }

    try {
      setLoading(true);
      await grabImage(DFSWallet, userInfo.name);
      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
    } catch (error) {
      console.error('抢图失败:', error);
      message.error('抢图失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Handle breed cats
  const handleBreedCats = async () => {
    if (!selectedPartner) {
      message.warning('请选择繁殖伙伴');
      return;
    }

    if (!DFSWallet || !userInfo || !selectedCat) {
      message.warning('钱包未连接或未选择猫咪');
      return;
    }

    // 再次检查繁殖伙伴是否仍然存在
    const partnerCat = allCats.find(cat => cat.id === selectedPartner);
    if (!partnerCat) {
      message.error('选择的繁殖伙伴已不存在，请重新选择');
      setSelectedPartner(null);
      return;
    }

    // 确定公猫和母猫
    let maleCatId, femaleCatId;
    if (selectedCat.gender === 0) { // 当前猫是公猫
      maleCatId = selectedCat.id;
      femaleCatId = selectedPartner;
    } else { // 当前猫是母猫
      maleCatId = selectedPartner;
      femaleCatId = selectedCat.id;
    }

    try {
      setLoading(true);
      await breedCats(DFSWallet, userInfo.name, maleCatId, femaleCatId);

      // 繁殖成功后的清理工作
      setBreedModalVisible(false);
      setSelectedPartner(null);

      // 延迟刷新猫咪列表，确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);

      message.success('繁殖成功！新的小猫已诞生，父母猫咪已完成使命。');
    } catch (error) {
      console.error('繁殖失败:', error);
      message.error('繁殖失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Get available breeding partners using useMemo for better performance and consistency
  const breedingPartners = useMemo(() => {
    if (!selectedCat || !allCats) {
      console.log('useMemo breedingPartners: 缺少必要数据', { selectedCat: !!selectedCat, allCats: allCats?.length });
      return [];
    }

    // 找到异性猫咪作为繁殖伙伴，并确保猫咪仍然存在
    const oppositeGender = selectedCat.gender === 0 ? 1 : 0;
    const partners = allCats.filter(cat =>
      cat.id !== selectedCat.id &&
      cat.gender === oppositeGender &&
      cat.owner === userInfo?.name
    );

    console.log('useMemo breedingPartners: 重新计算可用伙伴', {
      selectedCatId: selectedCat.id,
      selectedCatGender: selectedCat.gender,
      oppositeGender,
      allCatsIds: allCats.map(c => c.id),
      partnersIds: partners.map(p => p.id),
      selectedPartner
    });

    return partners;
  }, [selectedCat, allCats, userInfo?.name]);

  // 监听 breedingPartners 变化，自动清除无效选择
  useEffect(() => {
    if (selectedPartner && breedingPartners.length > 0) {
      const isPartnerValid = breedingPartners.find(p => p.id === selectedPartner);
      if (!isPartnerValid) {
        console.log('breedingPartners 变化，清除无效的伙伴选择:', selectedPartner);
        setSelectedPartner(null);
      }
    } else if (selectedPartner && breedingPartners.length === 0) {
      console.log('没有可用伙伴，清除选择:', selectedPartner);
      setSelectedPartner(null);
    }
  }, [breedingPartners, selectedPartner]);



  // 添加调试信息
  console.log('CatDetail 渲染:', {
    selectedCat: selectedCat ? {
      id: selectedCat.id,
      gender: selectedCat.gender,
      quality: selectedCat.quality,
      level: selectedCat.level,
      genes: selectedCat.genes
    } : null,
    allCatsCount: allCats?.length || 0
  });

  if (!selectedCat) {
    console.log('CatDetail: 没有选中的猫咪');
    return (
      <div className="cat-detail-empty">
        <p>请选择一只猫咪查看详情</p>
      </div>
    );
  }

  // 检查必要的数据是否存在
  if (!selectedCat.id || selectedCat.gender === undefined || selectedCat.quality === undefined) {
    console.error('CatDetail: 猫咪数据不完整', selectedCat);
    return (
      <div className="cat-detail-error">
        <p>猫咪数据不完整，请刷新页面重试</p>
        <pre>{JSON.stringify(selectedCat, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="cat-detail">
      <Spin spinning={loading}>
        <div className="cat-detail-header">
          <div className="cat-identifier">
            <div className="cat-info">
              <Space direction="vertical" size="small">
                <div className="cat-basic-info">
                  <Space>
                    <Tag color="blue">#{selectedCat.id}</Tag>
                    <Tag color={selectedCat.gender === 0 ? 'geekblue' : 'magenta'}>
                      {GENDER_NAMES[selectedCat.gender] || '未知'}
                    </Tag>
                    <Tag color="gold">
                      {QUALITY_NAMES[selectedCat.quality] || '普通'}
                    </Tag>
                    <Tag color="orange">
                      Lv.{selectedCat.level}
                    </Tag>
                    <Tag color="purple" icon={<ThunderboltOutlined />}>
                      战力: {calculateTotalPower(selectedCat)}
                    </Tag>
                  </Space>
                </div>
                <div className="cat-birth">
                  <span>出生于: {formatTime(selectedCat.birth_time)}</span>
                </div>
              </Space>
            </div>
          </div>

        
        </div>

        <div className="cat-illustration clickable-cat" style={{ position: 'relative', cursor: 'pointer' }}>
          {hasAvailableExp && (
            <div className="exp-notification">
              <GiftOutlined className="notification-icon" /> 有经验可以获取!
              <Button
                size="small"
                type="primary"
                className="notification-button"
                onClick={handleCheckAction}
              >
                点击领取
              </Button>
            </div>
          )}

          {/* 属性查看按钮 */}
          <Button
            size="small"
            type="primary"
            onClick={(e) => {
              e.stopPropagation(); // 阻止触发猫咪点击事件
              setAttributeModalVisible(true);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(24, 144, 255, 0.9)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 10,
              animation: 'pulse 2s infinite',
              padding: '4px 8px',
              height: 'auto',
              lineHeight: '1.2'
            }}
          >
            点击查看属性
          </Button>

          {/* 繁殖按钮 - 右下角 */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            zIndex: 10
          }}>
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<TeamOutlined />}
              onClick={(e) => {
                e.stopPropagation(); // 阻止触发猫咪点击事件
                console.log('点击繁殖按钮，可用伙伴:', breedingPartners);

                if (breedingPartners.length > 0) {
                  setSelectedPartner(null);
                  setBreedModalVisible(true);
                } else {
                  message.info('没有可用的繁殖伙伴。需要一只异性猫咪才能繁殖。');
                }
              }}
              disabled={breedingPartners.length === 0}
              title={breedingPartners.length === 0 ? '没有可繁殖的伙伴' : `开始繁殖 (${breedingPartners.length}个伙伴可选)`}
              style={{
                background: breedingPartners.length === 0 ? '#d9d9d9' : 'linear-gradient(135deg, #52c41a, #389e0d)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>

          <CatRenderer
            parent="detail"
            gene={selectedCat.genes}
            onClick={handlePatCat}
          />
        </div>

        {/* 猫币功能区 */}
        <Card title="🪙 猫币功能" size="small" style={{ marginBottom: 16 }}>
          <div className="attribute-item">
            <div className="attribute-label">
              等级升级 (需要 {selectedCat.level >= 100 ? '已满级' : `${calculateNextLevelCatCoinCost(selectedCat).toFixed(2)} BGCAT`})
            </div>
            <div className="attribute-progress">
              <div className="progress-container">
                <Progress
                  percent={getExpProgressPercent(selectedCat.experience, selectedCat.level)}
                  strokeColor="#1890ff"
                  format={() => getExpDisplayText(selectedCat.experience, selectedCat.level)}
                />
                <Button
                  type="primary"
                  shape="circle"
                  size="middle"
                  icon={<UpCircleOutlined />}
                  className="action-button"
                  onClick={handleUpgradeCatWithCoin}
                  disabled={selectedCat.level >= 100}
                  title={selectedCat.level >= 100 ?
                    "已达到最高等级" :
                    `猫币升级 (需要 ${calculateNextLevelCatCoinCost(selectedCat).toFixed(2)} BGCAT)`
                  }
                />
              </div>
            </div>
          </div>

          <div className="attribute-item">
            <div className="attribute-label">
              体力恢复 (猫币)
            </div>
            <div className="attribute-progress">
              <div className="progress-container">
                <Progress
                  percent={getStaminaPercent(selectedCat.stamina)}
                  strokeColor={getStaminaColor(selectedCat.stamina)}
                  format={() => `${formatStamina(selectedCat.stamina).toFixed(2)}/100`}
                />
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  size="middle"
                  icon={<HeartOutlined />}
                  disabled={isStaminaFull(selectedCat.stamina)}
                  onClick={handleRestoreStamina}
                  title="猫币恢复体力 (1 BGCAT = 10-20体力)"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 功能说明提示 */}
        <Card size="small" style={{ marginBottom: 16, textAlign: 'center' }}>
          <Space direction="vertical" size="small">
            <div style={{ fontSize: '16px', color: '#1890ff' }}>
              🐱 猫咪互动功能
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 点击猫咪图像或右上角蓝色按钮查看详细属性
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 点击右下角 <TeamOutlined style={{ color: '#52c41a' }} /> 按钮进行繁殖
            </div>
          </Space>
        </Card>

        {/* 调试信息 - 开发时使用 */}
        {process.env.NODE_ENV === 'development' && (
          <Card title="调试信息" size="small" style={{ marginBottom: 16, fontSize: '12px' }}>
            <div>
              <p><strong>当前猫咪:</strong> #{selectedCat.id} ({GENDER_NAMES[selectedCat.gender]})</p>
              <p><strong>所有猫咪:</strong> {allCats.map(c => `#${c.id}(${GENDER_NAMES[c.gender]})`).join(', ')}</p>
              <p><strong>可用伙伴(useMemo):</strong> {breedingPartners.map(c => `#${c.id}(${GENDER_NAMES[c.gender]})`).join(', ')}</p>
              <p><strong>选择的伙伴:</strong> {selectedPartner || '无'}</p>
              <p><strong>伙伴是否有效:</strong> {selectedPartner ? (breedingPartners.find(p => p.id === selectedPartner) ? '是' : '否') : 'N/A'}</p>
              <p><strong>模态框状态:</strong> {breedModalVisible ? '打开' : '关闭'}</p>
            </div>
          </Card>
        )}



        {/* 繁殖模态框 */}
        <Modal
          title="选择繁殖伙伴"
          open={breedModalVisible}
          width={480}
          onCancel={() => {
            console.log('取消繁殖，重置状态');
            setBreedModalVisible(false);
            setSelectedPartner(null);
          }}
          onOk={handleBreedCats}
          confirmLoading={loading}
          okText="确认繁殖"
          cancelText="取消"
          okButtonProps={{
            disabled: (() => {
              const isPartnerValid = selectedPartner && breedingPartners.find(p => p.id === selectedPartner);
              // console.log('确认按钮状态检查:', { selectedPartner, partnersCount: breedingPartners.length, isPartnerValid });
              return !selectedPartner || breedingPartners.length === 0 || !isPartnerValid;
            })()
          }}
          destroyOnClose={true}
          afterOpenChange={(open) => {
            if (open) {
              // 模态框打开时，强制验证当前选择
              if (selectedPartner && !breedingPartners.find(p => p.id === selectedPartner)) {
                console.log('模态框打开时发现无效选择，清除:', selectedPartner);
                setSelectedPartner(null);
              }
            }
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <p>当前猫咪: <strong>#{selectedCat.id} ({GENDER_NAMES[selectedCat.gender]})</strong></p>
            <p>选择繁殖伙伴:</p>
          </div>

          <Select
            style={{ width: '100%' }}
            placeholder="选择一只异性猫咪"
            showSearch
            optionFilterProp="label"
            listHeight={400}
            dropdownStyle={{
              maxHeight: 400,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
            virtual={false}
            popupMatchSelectWidth={true}
            value={(() => {
              // 实时验证选择的有效性
              const currentPartners = breedingPartners;
              const isValid = selectedPartner && currentPartners.find(p => p.id === selectedPartner);
              console.log('Select value 验证:', { selectedPartner, isValid, currentPartnersIds: currentPartners.map(p => p.id) });
              return isValid ? selectedPartner : undefined;
            })()}
            onChange={(value) => {
              console.log('选择繁殖伙伴:', value);
              setSelectedPartner(value);
            }}
            options={breedingPartners.map(cat => ({
              value: cat.id,
              label: `#${cat.id} - ${GENDER_NAMES[cat.gender]} - ${QUALITY_NAMES[cat.quality]} - 等级${cat.level}`
            }))}
            notFoundContent={breedingPartners.length === 0 ? "没有可用的繁殖伙伴" : "加载中..."}
            key={`breeding-select-${breedingPartners.map(p => p.id).join('-')}`} // 强制重新渲染
          />

          {selectedPartner && (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6f6f6', borderRadius: 6 }}>
              <p><strong>繁殖预览:</strong></p>
              <p>父母: #{selectedCat.gender === 0 ? selectedCat.id : selectedPartner} (公) × #{selectedCat.gender === 1 ? selectedCat.id : selectedPartner} (母)</p>
              <p style={{ color: '#ff4d4f' }}>⚠️ 繁殖后这两只猫咪将被销毁，请确认操作！</p>
            </div>
          )}
        </Modal>


        {/* 功能使用指南 */}
        {/* <CatCoinGuide /> */}
      </Spin>

      {/* 属性弹窗 */}
      <Modal
        title={
          <Space>
            <TrophyOutlined style={{ color: '#1890ff' }} />
            <span>猫咪 #{selectedCat.id} 的属性详情</span>
            <Tag color="gold">
              总战力: {selectedCat.decryptedStats ?
                (selectedCat.decryptedStats.attack +
                 selectedCat.decryptedStats.defense +
                 selectedCat.decryptedStats.health +
                 selectedCat.decryptedStats.critical +
                 selectedCat.decryptedStats.dodge +
                 selectedCat.decryptedStats.luck).toLocaleString() : '???'}
            </Tag>
          </Space>
        }
        open={attributeModalVisible}
        onCancel={() => setAttributeModalVisible(false)}
        footer={[
          <Button
            key="dfs"
            type="primary"
            icon={<GiftOutlined />}
            loading={feedingStates[selectedCat.id] || false}
            onClick={() => handleDFSFeedCat(selectedCat.id)}
            style={{
              background: 'linear-gradient(135deg, #1890ff, #722ed1)',
              border: 'none'
            }}
          >
            DFS提升属性
          </Button>,
          <Button key="close" onClick={() => setAttributeModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <Row gutter={[16, 16]}>
            {/* 基础属性 */}
            <Col span={12}>
              <Card size="small" title="基础属性" style={{ height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><FireOutlined style={{ color: '#f5222d' }} /> 攻击</span>
                    <div>
                      <Tag color={(() => {
                        const stats = getDecryptedStats(selectedCat);
                        return stats ? getStatColor(stats.attack, 1048575) : 'default'; // 128位: 20位攻击
                      })()}>
                        {(() => {
                          const stats = getDecryptedStats(selectedCat);
                          return stats?.attack || '???';
                        })()}
                      </Tag>
                      {(() => {
                        const stats = getDecryptedStats(selectedCat);
                        return stats && (
                          <Tag size="small" style={{ marginLeft: 4 }}>
                            {getStatRank(stats.attack, 1048575)}
                          </Tag>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><SafetyOutlined style={{ color: '#1890ff' }} /> 防御</span>
                    <div>
                      <Tag color={(() => {
                        const stats = getDecryptedStats(selectedCat);
                        return stats ? getStatColor(stats.defense, 1048575) : 'default'; // 128位: 20位防御
                      })()}>
                        {(() => {
                          const stats = getDecryptedStats(selectedCat);
                          return stats?.defense || '???';
                        })()}
                      </Tag>
                      {(() => {
                        const stats = getDecryptedStats(selectedCat);
                        return stats && (
                          <Tag size="small" style={{ marginLeft: 4 }}>
                            {getStatRank(stats.defense, 1048575)}
                          </Tag>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><HeartOutlined style={{ color: '#52c41a' }} /> 血量</span>
                    <div>
                      <Tag color={(() => {
                        const stats = getDecryptedStats(selectedCat);
                        return stats ? getStatColor(stats.health, 16777215) : 'default'; // 128位: 24位血量
                      })()}>
                        {(() => {
                          const stats = getDecryptedStats(selectedCat);
                          return stats?.health || '???';
                        })()}
                      </Tag>
                      {(() => {
                        const stats = getDecryptedStats(selectedCat);
                        return stats && (
                          <Tag size="small" style={{ marginLeft: 4 }}>
                            {getStatRank(stats.health, 16777215)}
                          </Tag>
                        );
                      })()}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* 特殊属性 */}
            <Col span={12}>
              <Card size="small" title="特殊属性" style={{ height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><ThunderboltOutlined style={{ color: '#faad14' }} /> 暴击</span>
                    <div>
                      <Tag color={selectedCat.decryptedStats ? getStatColor(selectedCat.decryptedStats.critical, 255) : 'default'}>
                        {selectedCat.decryptedStats?.critical || '???'}
                      </Tag>
                      {selectedCat.decryptedStats && (
                        <Tag size="small" style={{ marginLeft: 4 }}>
                          {getStatRank(selectedCat.decryptedStats.critical, 255)}
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><EyeOutlined style={{ color: '#722ed1' }} /> 闪避</span>
                    <div>
                      <Tag color={selectedCat.decryptedStats ? getStatColor(selectedCat.decryptedStats.dodge, 255) : 'default'}>
                        {selectedCat.decryptedStats?.dodge || '???'}
                      </Tag>
                      {selectedCat.decryptedStats && (
                        <Tag size="small" style={{ marginLeft: 4 }}>
                          {getStatRank(selectedCat.decryptedStats.dodge, 255)}
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><StarOutlined style={{ color: '#eb2f96' }} /> 幸运</span>
                    <div>
                      <Tag color={selectedCat.decryptedStats ? getStatColor(selectedCat.decryptedStats.luck, 255) : 'default'}>
                        {selectedCat.decryptedStats?.luck || '???'}
                      </Tag>
                      {selectedCat.decryptedStats && (
                        <Tag size="small" style={{ marginLeft: 4 }}>
                          {getStatRank(selectedCat.decryptedStats.luck, 255)}
                        </Tag>
                      )}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Divider />

          <div style={{
            background: '#f0f5ff',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <Space direction="vertical" size="small">
              <div style={{ fontSize: '14px', color: '#1890ff', fontWeight: 'bold' }}>
                💎 DFS属性提升说明
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                使用1个DFS可以随机提升猫咪的攻击、防御、血量、暴击、闪避、幸运等属性
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                点击上方"DFS提升属性"按钮即可为这只猫咪进行属性强化
              </div>

              {/* 调试按钮 */}
              <Button
                size="small"
                type="dashed"
                onClick={() => {
                  console.log('=== 调试信息 ===');
                  console.log('selectedCat:', selectedCat);
                  console.log('encrypted_stats:', selectedCat.encrypted_stats);
                  console.log('decryptedStats:', selectedCat.decryptedStats);

                  if (selectedCat.encrypted_stats) {
                    const manualDecrypt = decryptCatStats(selectedCat.encrypted_stats, selectedCat.encryptedStatsHigh, selectedCat.id);
                    console.log('手动解密结果:', manualDecrypt);
                    message.info(`手动解密成功！攻击:${manualDecrypt.attack}, 防御:${manualDecrypt.defense}, 血量:${manualDecrypt.health}`);
                  }
                }}
              >
                🔍 调试解密
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CatDetail; 