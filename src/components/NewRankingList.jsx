import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Statistic, Modal, message, Spin, Empty, Space, Select, Tag, Tooltip } from 'antd';
import { TrophyOutlined, ReloadOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { getAllCats, QUALITY_NAMES } from '../utils/chainOperations';
import CatRenderer from './CatRenderer';
import UnifiedCatCard from './UnifiedCatCard';
import './RankingList.css';

const { Option } = Select;

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

const NewRankingList = ({ DFSWallet }) => {
  // 状态管理
  const [catsList, setCatsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [catModalVisible, setCatModalVisible] = useState(false);
  
  // 筛选和排序状态
  const [qualityFilter, setQualityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('level'); // level, quality, id
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  // 获取排行榜数据
  const fetchRankingData = async () => {
    if (!DFSWallet) return;
    
    try {
      setLoading(true);
      const cats = await getAllCats(DFSWallet, 100); // 获取最多100只猫咪
      console.log('获取到的猫咪数据:', cats);
      setCatsList(cats || []);
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      message.error('获取排行榜数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchRankingData();
  }, [DFSWallet]);

  // 刷新数据
  const handleRefresh = () => {
    fetchRankingData();
  };

  // 处理猫咪点击
  const handleCatClick = (cat) => {
    setSelectedCat(cat);
    setCatModalVisible(true);
  };

  // 筛选和排序猫咪
  const getFilteredAndSortedCats = () => {
    let filtered = [...catsList];

    // 品质筛选
    if (qualityFilter !== 'all') {
      filtered = filtered.filter(cat => cat.quality === parseInt(qualityFilter));
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'level':
          aValue = a.level || 0;
          bValue = b.level || 0;
          break;
        case 'quality':
          aValue = a.quality || 0;
          bValue = b.quality || 0;
          break;
        case 'id':
          aValue = parseInt(a.id) || 0;
          bValue = parseInt(b.id) || 0;
          break;
        default:
          aValue = a.level || 0;
          bValue = b.level || 0;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  };

  // 渲染统计信息
  const renderRankingStats = () => {
    const totalCats = catsList.length;
    const filteredCats = getFilteredAndSortedCats().length;

    return (
      <Row gutter={[8, 16]} style={{ marginBottom: 24 }} className="ranking-stats">
        <Col xs={12} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="总猫咪数"
              value={totalCats}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="当前显示"
              value={filteredCats}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // 渲染筛选器
  const renderFilters = () => {
    return (
      <div className="filter-section">
        <Space size="large" wrap>
          <div>
            {/* <span style={{ marginRight: 8 }}>品质筛选:</span> */}
            <Select
              value={qualityFilter}
              onChange={setQualityFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部</Option>
              {Object.entries(QUALITY_NAMES).map(([key, name]) => (
                <Option key={key} value={key}>
                  <Tag color={QUALITY_COLORS[key]} size="small">{name}</Tag>
                </Option>
              ))}
            </Select>
          </div>
          
          <div>
            {/* <span style={{ marginRight: 8 }}>排序方式:</span> */}
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 120 }}
            >
              <Option value="level">等级</Option>
              <Option value="quality">品质</Option>
              <Option value="id">ID</Option>
            </Select>
          </div>
          
          <div>
            {/* <span style={{ marginRight: 8 }}>排序顺序:</span> */}
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              style={{ width: 120 }}
            >
              <Option value="desc">
                <SortDescendingOutlined /> 降序
              </Option>
              <Option value="asc">
                <SortAscendingOutlined /> 升序
              </Option>
            </Select>
          </div>
        </Space>
      </div>
    );
  };

  // 渲染排行榜猫咪卡片
  const renderRankingCat = (cat, index) => {
    const rank = index + 1;
    
    return (
      <Col xs={12} sm={8} md={6} lg={4} xl={4} xxl={3} key={cat.id}>
        <div className="ranking-cat-wrapper">
          <div className="ranking-badge-container">
            {rank <= 3 ? (
              <div className={`ranking-badge ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'}`}>
                <TrophyOutlined /> {rank}
              </div>
            ) : (
              <div className="ranking-number">#{rank}</div>
            )}
          </div>
          <UnifiedCatCard
            cat={cat}
            onClick={() => handleCatClick(cat)}
            showPrice={false}
            showSeller={false}
            isMarketMode={false}
          />
        </div>
      </Col>
    );
  };

  return (
    <div className="ranking-list-container">
      {/* 标题和操作区域 */}
      <div style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <TrophyOutlined style={{ marginRight: 8, color: '#fadb14' }} />
              猫咪排行榜
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              查看所有猫咪的等级排名和属性信息
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      {/* 统计信息区域 */}
      {renderRankingStats()}

      {/* 主要内容区域 */}
      <Card styles={{ body: { padding: 0 } }}>
        <div style={{ padding: '24px' }}>
          {renderFilters()}

          <Spin spinning={loading}>
            {getFilteredAndSortedCats().length > 0 ? (
              <Row gutter={[16, 16]}>
                {getFilteredAndSortedCats().map(renderRankingCat)}
              </Row>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无猫咪数据"
              />
            )}
          </Spin>
        </div>
      </Card>

      {/* 猫咪详情模态框 */}
      <Modal
        title={selectedCat ? `猫咪 #${selectedCat.id} 详情` : '猫咪详情'}
        open={catModalVisible}
        onCancel={() => setCatModalVisible(false)}
        footer={null}
        width={600}
        className="cat-detail-modal"
      >
        {selectedCat && (
          <div className="modal-cat-preview">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="cat-image-container">
                  <CatRenderer
                    parent={`modal-${selectedCat.id}`}
                    gene={selectedCat.genes || selectedCat.gene}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="cat-detail-info">
                  <div className="cat-detail-item">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">#{selectedCat.id}</span>
                  </div>
                  <div className="cat-detail-item">
                    <span className="detail-label">等级:</span>
                    <span className="detail-value cat-level">Lv.{selectedCat.level || 1}</span>
                  </div>
                  <div className="cat-detail-item">
                    <span className="detail-label">品质:</span>
                    <Tag
                      color={QUALITY_COLORS[selectedCat.quality]}
                      className="quality-tag"
                    >
                      {QUALITY_NAMES[selectedCat.quality] || '普通'}
                    </Tag>
                  </div>
                  <div className="cat-detail-item">
                    <span className="detail-label">主人:</span>
                    <span className="detail-value">{selectedCat.owner}</span>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NewRankingList;
