import React, { useState, useEffect } from 'react';
import { List, Card, Button, Spin, Empty, Tag } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { getCatColorClass } from '../utils/catGeneParser';
import { getUserCats } from '../utils/chainOperations';
import './CatList.css';

const CatList = ({ 
  DFSWallet, 
  userInfo, 
  onSelectCat, 
  refreshTrigger, 
  selectedCatId,
  onMintCat, 
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
  const handleSelectCat = (catId) => {
    if (onSelectCat) {
      onSelectCat(catId);
    }
  };

  const handleRefresh = () => {
    fetchCats();
  };

  return (
    <div className="cat-list-container">
      <Spin spinning={loading || externalLoading}>
        {catsList.length === 0 ? (
          <div className="empty-cats">
            <Empty 
              description={
                <span>
                  你还没有猫咪
                </span>
              }
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={onMintCat}
                disabled={!DFSWallet || !userInfo}
                size="large"
              >
                铸造猫咪 (30.0000 DFS)
              </Button>
            </Empty>
          </div>
        ) : (
          <>
            <div className="cats-header">
              <div className="cats-count">
                <span>我的猫咪 ({catsList.length})</span>
              </div>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                size="middle"
              >
                刷新
              </Button>
            </div>
            <List
              grid={{ 
                gutter: 24,
                xs: 1,
                sm: 2,
                md: 3,
                lg: 3,
                xl: 4,
                xxl: 5,
              }}
              dataSource={catsList}
              renderItem={cat => (
                <List.Item>
                  <Card 
                    className={`cat-card ${selectedCatId === cat.id ? 'cat-card-selected' : ''}`}
                    hoverable
                    onClick={() => handleSelectCat(cat.id)}
                  >
                    <div className="cat-card-content">
                      <div className="cat-card-header">
                        <div className={`cat-badge ${getCatColorClass(cat.genes)}`}>
                          #{cat.id}
                        </div>
                        <Tag color="blue">等级 {cat.level}</Tag>
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