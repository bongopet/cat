import React, { useState, useEffect } from 'react';
import { List, Card, Button, Spin, Empty, Tag, message, Space, Select, Dropdown, Menu } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  GiftOutlined,
  SwapOutlined,
  CameraOutlined,
  FilterOutlined,
  DownOutlined
} from '@ant-design/icons';
import { getUserCats, GENDER_NAMES } from '../utils/chainOperations';
import CatRenderer from './CatRenderer';
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
  const [filteredCatsList, setFilteredCatsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('all');
  const [hasClaimedFreeCat, setHasClaimedFreeCat] = useState(false);

  // 品质颜色映射 - 与统计页面保持一致
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

  // 品质名称映射
  const QUALITY_NAMES = {
    0: '普通',
    1: '精良',
    2: '卓越',
    3: '非凡',
    4: '至尊',
    5: '神圣',
    6: '永恒',
    7: '传世'
  };



  // Get cats from blockchain
  const fetchCats = async () => {
    if (!DFSWallet || !userInfo) return;

    try {
      setLoading(true);
      const cats = await getUserCats(DFSWallet, userInfo.name);
      setCatsList(cats);

      // 检查是否已领取免费猫咪（如果有猫咪，说明已经领取过）
      setHasClaimedFreeCat(cats.length > 0);
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

  // 品质筛选逻辑
  useEffect(() => {
    if (selectedQuality === 'all') {
      setFilteredCatsList(catsList);
    } else {
      const filtered = catsList.filter(cat => cat.quality === parseInt(selectedQuality));
      setFilteredCatsList(filtered);
    }
  }, [catsList, selectedQuality]);

  // 处理品质筛选
  const handleQualityFilter = (quality) => {
    setSelectedQuality(quality);
  };

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
                {!hasClaimedFreeCat && (
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
                )}

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
                </Space>
              </Space>
            </Empty>
          </div>
        ) : (
          <>
            <div className="cats-header">
              <div className="cats-count">
                <span>我的猫咪 ({filteredCatsList.length}/{catsList.length})</span>
              </div>
              <Space>
                {/* 品质筛选下拉菜单 */}
                <Dropdown
                  overlay={
                    <Menu
                      selectedKeys={[selectedQuality]}
                      onClick={({ key }) => handleQualityFilter(key)}
                    >
                      <Menu.Item key="all">全部</Menu.Item>
                      <Menu.Divider />
                      {Object.entries(QUALITY_NAMES).map(([quality, name]) => (
                        <Menu.Item key={quality}>
                          <Tag color={QUALITY_COLORS[quality]} style={{ margin: 0 }}>
                            {name}
                          </Tag>
                        </Menu.Item>
                      ))}
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button size="small" icon={<FilterOutlined />}>
                    {selectedQuality === 'all' ? '全部' : QUALITY_NAMES[selectedQuality]} <DownOutlined />
                  </Button>
                </Dropdown>

                {!hasClaimedFreeCat && (
                  <Button
                    icon={<GiftOutlined />}
                    onClick={onClaimFreeCat}
                    disabled={!DFSWallet || !userInfo}
                    size="small"
                  >
                    免费猫咪
                  </Button>
                )}

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
                gutter: [8, 8], // 水平和垂直间距
                xs: 2,  // 在最小的屏幕上显示2列
                sm: 3,  // 小屏幕显示3列
                md: 4,  // 中等屏幕显示4列
                lg: 5,  // 大屏幕显示5列
                xl: 6,  // 超大屏幕显示6列
                xxl: 8, // 超超大屏幕显示8列
              }}
              dataSource={filteredCatsList}
              renderItem={cat => (
                <List.Item>
                  <Card
                    className={`cat-card ${selectedCatId === cat.id ? 'cat-card-selected' : ''}`}
                    hoverable
                    onClick={(event) => handleSelectCat(event, cat.id)}
                    size="small"
                    styles={{
                      body: { padding: '12px' }
                    }}
                    style={{
                      border: `2px solid ${QUALITY_COLORS[cat.quality] || QUALITY_COLORS[0]}`,
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    <div className="cat-card-content">
                      {/* 左上角等级 */}
                      <div className="cat-level-badge">
                        LV {cat.level}
                      </div>

                      {/* 右上角性别图标 */}
                      <div className={`cat-gender-badge ${cat.gender === 0 ? 'male' : 'female'}`}>
                        {cat.gender === 0 ? '♂' : '♀'}
                      </div>

                      {/* 猫咪SVG图像 */}
                      <div className="cat-card-image">
                        <CatRenderer
                          parent={`list-${cat.id}`}
                          gene={cat.genes}
                        />
                      </div>

                      {/* 猫咪信息 */}
                      <div className="cat-card-info">
                        <div className="cat-info-row">
                          <span className="cat-id-text">猫咪 #{cat.id}</span>
                          <Tag
                            size="small"
                            style={{
                              backgroundColor: QUALITY_COLORS[cat.quality] || QUALITY_COLORS[0],
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            {cat.qualityName || QUALITY_NAMES[cat.quality] || '普通'}
                          </Tag>
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