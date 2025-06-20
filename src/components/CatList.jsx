import React, { useState, useEffect } from 'react';
import { List, Card, Button, Spin, Empty, Tag, message, Space, Divider } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  GiftOutlined,
  SwapOutlined,
  CameraOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { getCatColorClass } from '../utils/catGeneParser';
import { getUserCats, refundCat, QUALITY_NAMES, GENDER_NAMES } from '../utils/chainOperations';
import './CatList.css';

const CatList = ({
  DFSWallet,
  userInfo,
  onSelectCat,
  refreshTrigger,
  selectedCatId,
  onMintCat,
  onClaimFreeCat,
  onCheckSwap,
  onGrabImage,
  loading: externalLoading
}) => {
  const [catsList, setCatsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Format stamina value (convert from 0-10000 to 0-100.00)
  const formatStamina = (stamina) => {
    if (!stamina && stamina !== 0) return 0;
    return (stamina / 100).toFixed(2);
  };

  // Calculate exp progress percentage
  const getExpProgressPercent = (exp, level) => {
    // Next level total exp required
    const nextLevelExp = 100 * level * level + 500 * level;
    // Current total exp
    const currentExp = exp || 0;
    
    // Calculate progress percentage, ensure between 0-100
    return Math.min(Math.max(Math.floor((currentExp / nextLevelExp) * 100), 0), 100);
  };

  // Get cats from blockchain
  const fetchCats = async () => {
    if (!DFSWallet || !userInfo) return;
    
    try {
      setLoading(true);
      const cats = await getUserCats(DFSWallet, userInfo.name);
      setCatsList(cats);
    } catch (error) {
      console.error('获取猫咪失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cats when component mounts or deps change
  useEffect(() => {
    fetchCats();
  }, [DFSWallet, userInfo, refreshTrigger]);

  // Handle cat selection
  const handleSelectCat = (event, catId) => {
    // 检查点击的是否是退款按钮或其子元素
    if (event.target.closest('button')) {
      return; // 如果点击的是按钮，不执行选择操作
    }

    console.log('CatList: 点击猫咪', catId);
    const clickedCat = catsList.find(cat => cat.id === catId);
    console.log('CatList: 找到的猫咪数据', clickedCat);

    if (onSelectCat) {
      onSelectCat(catId);
    }
  };

  const handleRefresh = () => {
    fetchCats();
  };

  // Handle cat refund
  const handleRefundCat = async (event, catId) => {
    // 阻止事件冒泡和默认行为，避免触发卡片点击事件
    event.stopPropagation();
    event.preventDefault();

    if (!DFSWallet || !userInfo) {
      message.warning('钱包未连接');
      return;
    }

    try {
      await refundCat(DFSWallet, userInfo.name, catId);
      // 刷新猫咪列表
      fetchCats();
    } catch (error) {
      console.error('退款失败:', error);
      message.error('退款失败: ' + (error.message || String(error)));
    }
  };

  return (
    <div className="cat-list-container">
      <Spin spinning={loading || externalLoading}>
        {catsList.length === 0 ? (
          <div className="empty-cats">
            <Empty
              description={
                <span>
                  你还没有猫咪，快来获取你的第一只猫咪吧！
                </span>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<GiftOutlined />}
                  onClick={onClaimFreeCat}
                  disabled={!DFSWallet || !userInfo}
                  size="large"
                  style={{ width: '100%' }}
                >
                  领取免费猫咪
                </Button>

                <Space wrap style={{ justifyContent: 'center' }}>
                  <Button
                    icon={<SwapOutlined />}
                    onClick={onCheckSwap}
                    disabled={!DFSWallet || !userInfo}
                  >
                    检查交易记录
                  </Button>

                  <Button
                    icon={<CameraOutlined />}
                    onClick={onGrabImage}
                    disabled={!DFSWallet || !userInfo}
                  >
                    抢图获得猫咪
                  </Button>

                  <Button
                    icon={<PlusOutlined />}
                    onClick={onMintCat}
                    disabled={!DFSWallet || !userInfo}
                  >
                    铸造猫咪 (30 DFS)
                  </Button>
                </Space>
              </Space>
            </Empty>
          </div>
        ) : (
          <>
            <div className="cats-header">
              <div className="cats-count">
                <span>我的猫咪 ({catsList.length})</span>
              </div>
              <Space>
                <Button
                  icon={<GiftOutlined />}
                  onClick={onClaimFreeCat}
                  disabled={!DFSWallet || !userInfo}
                  size="small"
                >
                  免费猫咪
                </Button>

                <Button
                  icon={<SwapOutlined />}
                  onClick={onCheckSwap}
                  disabled={!DFSWallet || !userInfo}
                  size="small"
                >
                  检查交易
                </Button>

                <Button
                  icon={<CameraOutlined />}
                  onClick={onGrabImage}
                  disabled={!DFSWallet || !userInfo}
                  size="small"
                >
                  抢图
                </Button>

                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="small"
                >
                  刷新
                </Button>
              </Space>
            </div>
            <List
              grid={{ 
                gutter: 6, // 移除间距
                xs: 1,  // 在最小的屏幕上只显示1列
                sm: 2,  // 小屏幕显示2列
                md: 3,  // 中等屏幕显示3列
                lg: 4,
                xl: 5,
                xxl: 6,
              }}
              dataSource={catsList}
              renderItem={cat => (
                <List.Item>
                  <Card 
                    className={`cat-card ${selectedCatId === cat.id ? 'cat-card-selected' : ''}`}
                    hoverable
                    onClick={(event) => handleSelectCat(event, cat.id)}
                    size="small"
                    bodyStyle={{ padding: '2px' }}
                  >
                    <div className="cat-card-content">
                      <div className="cat-card-header">
                        <div className={`cat-badge ${getCatColorClass(cat.genes)}`}>
                          #{cat.id}
                        </div>
                        <Space size="small">
                          <Tag color="blue">等级 {cat.level}</Tag>
                          <Tag color={cat.gender === 0 ? 'geekblue' : 'magenta'}>
                            {cat.genderName || GENDER_NAMES[cat.gender] || '未知'}
                          </Tag>
                          <Tag color="gold">
                            {cat.qualityName || QUALITY_NAMES[cat.quality] || '普通'}
                          </Tag>
                        </Space>
                      </div>                    
                      <div className="cat-card-stats">
                        <div className="cat-stat">
                          <span className="stat-label">体力:</span>
                          <span className="stat-value">{formatStamina(cat.stamina)}/100</span>
                        </div>
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${formatStamina(cat.stamina)}%` }}
                          ></div>
                        </div>
                        
                        <div className="cat-stat">
                          <span className="stat-label">经验值:</span>
                          <span className="stat-value">{getExpProgressPercent(cat.experience, cat.level)}%</span>
                        </div>
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${getExpProgressPercent(cat.experience, cat.level)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </>
        )}
      </Spin>
    </div>
  );
};

export default CatList; 