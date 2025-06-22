import React, { useState, useEffect, useMemo } from 'react';
import { Card, Progress, Button, Spin, Tag, Divider, message, Space, Modal, Select, Tabs } from 'antd';
import {
  HeartOutlined,
  ExperimentOutlined,
  UpCircleOutlined,
  GiftOutlined,
  SwapOutlined,
  CameraOutlined,
  TeamOutlined,
  LockOutlined,
  EyeOutlined
} from '@ant-design/icons';
import CatRenderer from './CatRenderer';
import CatAttributes from './CatAttributes';
import SecureCatAttributes from './SecureCatAttributes';
import { getCatGeneDetails } from '../utils/catGeneParser';
import {
  checkCatAction,
  feedCat,
  upgradeCat,
  checkCatHasAvailableExp,
  feedCatWithDFS,
  breedCats,
  checkSwapCat,
  grabImage,
  QUALITY_NAMES,
  GENDER_NAMES
} from '../utils/chainOperations';
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
  const [feedingWithDFS, setFeedingWithDFS] = useState(false);

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
      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
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
      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
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

  // Handle DFS feeding
  const handleFeedWithDFS = async () => {
    if (!DFSWallet || !userInfo || !selectedCat) {
      message.warning('钱包未连接或未选择猫咪');
      return;
    }

    try {
      setFeedingWithDFS(true);
      await feedCatWithDFS(DFSWallet, userInfo.name, selectedCat.id, '1.00000000');
      setHasActionPerformed(true);
      // 延迟刷新确保合约状态已更新
      setTimeout(() => {
        refreshCats();
      }, 1000);
    } catch (error) {
      console.error('DFS喂养失败:', error);
      message.error('DFS喂养失败: ' + (error.message || String(error)));
    } finally {
      setFeedingWithDFS(false);
    }
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
                  </Space>
                </div>
                <div className="cat-birth">
                  <span>出生于: {formatTime(selectedCat.birth_time)}</span>
                </div>
              </Space>
            </div>
          </div>

          <Space>
          
            <Button
              icon={<CameraOutlined />}
              onClick={handleGrabImage}
              size="small"
            >
              抢图
            </Button>

            <Button
              icon={<ExperimentOutlined />}
              onClick={handleCheckAction}
              type="primary"
            >
              检查
            </Button>
          </Space>
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
                <Space className="action-buttons">
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    size="middle"
                    icon={<HeartOutlined />}
                    disabled={isStaminaFull(selectedCat.stamina)}
                    onClick={handleFeedCat}
                    title="BGFISH喂养"
                  />
                  <Button
                    type="primary"
                    shape="circle"
                    size="middle"
                    icon={<GiftOutlined />}
                    disabled={isStaminaFull(selectedCat.stamina)}
                    onClick={handleFeedWithDFS}
                    loading={feedingWithDFS}
                    title="DFS喂养 (1 DFS)"
                  />
                </Space>
              </div>
            </div>
          </div>
        </Card>

        {/* 猫咪属性 */}
        <Card title="猫咪属性" size="small" style={{ marginBottom: 16 }}>
          <Tabs
            defaultActiveKey="secure"
            items={[
              {
                key: 'secure',
                label: (
                  <Space>
                    <LockOutlined />
                    安全属性
                  </Space>
                ),
                children: (
                  <SecureCatAttributes
                    wallet={DFSWallet}
                    accountName={userInfo?.name}
                    showTitle={false}
                  />
                )
              },
              {
                key: 'legacy',
                label: (
                  <Space>
                    <EyeOutlined />
                    演示属性
                  </Space>
                ),
                children: (
                  <CatAttributes cat={selectedCat} showTitle={false} />
                )
              }
            ]}
          />
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

        {/* 繁殖功能卡片 */}
        <Card className="cat-breeding" title="繁殖功能">
          <div className="breeding-info">
            <p>选择一只异性猫咪进行繁殖，将产生一只新的小猫。</p>
            <p><strong>注意：</strong>繁殖后父母猫咪将被销毁！</p>
          </div>

          <Button
            type="primary"
            icon={<TeamOutlined />}
            onClick={() => {
              console.log('点击繁殖按钮，可用伙伴:', breedingPartners);

              if (breedingPartners.length > 0) {
                // 清除之前的选择，确保选择列表是最新的
                setSelectedPartner(null);
                setBreedModalVisible(true);
              } else {
                message.info('没有可用的繁殖伙伴。需要一只异性猫咪才能繁殖。');
              }
            }}
            disabled={breedingPartners.length === 0}
            block
          >
            {breedingPartners.length === 0 ? '没有可繁殖的伙伴' : `开始繁殖 (${breedingPartners.length}个伙伴可选)`}
          </Button>
        </Card>

        {/* 繁殖模态框 */}
        <Modal
          title="选择繁殖伙伴"
          open={breedModalVisible}
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
              console.log('确认按钮状态检查:', { selectedPartner, partnersCount: breedingPartners.length, isPartnerValid });
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