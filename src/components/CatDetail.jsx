import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, Spin, Tag, Divider, message } from 'antd';
import { HeartOutlined, ExperimentOutlined, UpCircleOutlined, GiftOutlined } from '@ant-design/icons';
import CatRenderer from './CatRenderer';
import { getCatGeneDetails } from '../utils/catGeneParser';
import { checkCatAction, feedCat, upgradeCat, checkCatHasAvailableExp } from '../utils/chainOperations';
import './CatDetail.css';

const CatDetail = ({ DFSWallet, userInfo, selectedCat, refreshCats }) => {
  const [loading, setLoading] = useState(false);
  const [geneDetails, setGeneDetails] = useState(null);
  const [hasActionPerformed, setHasActionPerformed] = useState(false);
  const [checkInterval, setCheckInterval] = useState(null);
  const [hasAvailableExp, setHasAvailableExp] = useState(false);

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
    return stamina / 100;
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

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
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
      refreshCats();
    } catch (error) {
      console.error('检查操作失败:', error);
      message.error('检查操作失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Handle cat feeding
  const handleFeedCat = async () => {
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
      await feedCat(DFSWallet, userInfo.name, selectedCat.id);
      message.success('喂食成功！');
      setHasActionPerformed(true);
      refreshCats();
    } catch (error) {
      console.error('喂食失败:', error);
      message.error('喂食失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Handle cat upgrade
  const handleUpgradeCat = async () => {
    if (!DFSWallet || !userInfo || !selectedCat) {
      message.warning('钱包未连接或未选择猫咪');
      return;
    }

    if (!canUpgrade(selectedCat.experience, selectedCat.level)) {
      message.info('经验不足，无法升级！');
      return;
    }

    try {
      setLoading(true);
      await upgradeCat(DFSWallet, userInfo.name, selectedCat.id);
      message.success('升级成功！');
      setHasActionPerformed(true);
      refreshCats();
    } catch (error) {
      console.error('升级失败:', error);
      message.error('升级失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Pat the cat
  const handlePatCat = () => {
    const responses = [
      '喵~',
      '呼噜~',
      '喵？',
      '喵！',
      '咕噜~',
      '呼噜呼噜~',
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    message.success({
      content: randomResponse,
      duration: 2,
    });
  };

  if (!selectedCat) {
    return (
      <div className="cat-detail-empty">
        <p>请选择一只猫咪查看详情</p>
      </div>
    );
  }

  return (
    <div className="cat-detail">
      <Spin spinning={loading}>
        <div className="cat-detail-header">
          <div className="cat-identifier">
            {/* <div className="cat-id">
              <span className="cat-number">#{selectedCat.id}</span>
            </div> */}
            <div className="cat-birth">
              <span>出生于: {formatTime(selectedCat.birth_time)}</span>
            </div>
          </div>
          
          <Button 
            icon={<ExperimentOutlined />} 
            onClick={handleCheckAction}
          >
            检查
          </Button>
        </div>
        
        <div className="cat-illustration">
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
          <CatRenderer 
            parent="detail"
            gene={selectedCat.genes} 
            onClick={handlePatCat} 
          />
        </div>
        
        <Card className="cat-attributes" title="属性">
          <div className="attribute-item">
            <div className="attribute-label">
              等级
            </div>
            <div className="attribute-value">
              {selectedCat.level}
            </div>
          </div>
          
          <div className="attribute-item">
            <div className="attribute-label">
              经验
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
                  disabled={!canUpgrade(selectedCat.experience, selectedCat.level)}
                  onClick={handleUpgradeCat}
                />
              </div>
            </div>
          </div>
          
          <div className="attribute-item">
            <div className="attribute-label">
              体力
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
                  className="action-button"
                  disabled={isStaminaFull(selectedCat.stamina)}
                  onClick={handleFeedCat}
                />
              </div>
            </div>
          </div>
        </Card>
        
        {/* {geneDetails && (
          <Card className="cat-genes" title="Gene Details">
            <div className="gene-section">
              <h4>Appearance</h4>
              <div className="gene-grid">
                <div className="gene-item">
                  <span className="gene-label">Base Color:</span>
                  <span className="gene-value">{geneDetails.baseColor}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Fur Type:</span>
                  <span className="gene-value">{geneDetails.furLength}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Ear Shape:</span>
                  <span className="gene-value">{geneDetails.earShape}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Eye Color:</span>
                  <span className="gene-value">{geneDetails.eyeColor}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Pattern:</span>
                  <span className="gene-value">{geneDetails.pattern}</span>
                </div>
              </div>
            </div>
            
            <Divider />
            
            <div className="gene-section">
              <h4>Personality & Abilities</h4>
              <div className="gene-grid">
                <div className="gene-item">
                  <span className="gene-label">Personality:</span>
                  <span className="gene-value">{geneDetails.personality}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Rarity:</span>
                  <span className="gene-value">{geneDetails.rarity}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Growth Potential:</span>
                  <span className="gene-value">{geneDetails.growthPotential}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Stamina Recovery:</span>
                  <span className="gene-value">{geneDetails.staminaRecovery}</span>
                </div>
                <div className="gene-item">
                  <span className="gene-label">Luck:</span>
                  <span className="gene-value">{geneDetails.luck}</span>
                </div>
              </div>
            </div>
            
            <Divider />
            
            <div className="gene-section">
              <h4>Special Abilities</h4>
              {geneDetails.specialAbilities.length > 0 ? (
                <div className="abilities-container">
                  {geneDetails.specialAbilities.map((ability, index) => (
                    <Tag color="blue" key={index}>{ability}</Tag>
                  ))}
                </div>
              ) : (
                <p>No special abilities unlocked yet</p>
              )}
              
              {geneDetails.hiddenTrait && (
                <div className="hidden-trait">
                  <Tag color="purple">Hidden Trait: Mystery Gene</Tag>
                </div>
              )}
            </div>
          </Card>
        )} */}
      </Spin>
    </div>
  );
};

export default CatDetail; 