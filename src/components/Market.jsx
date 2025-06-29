import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Statistic,
  Modal,
  Input,
  message,
  Spin,
  Empty,
  Tabs,
  Select,
  Space,
  Divider
} from 'antd'
import {
  ShopOutlined,
  DollarOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import {
  getMarketCats,
  getMarketStats,
  buyCatFromMarket,
  listCatForSale,
  unlistCatFromSale,
  getUserCats,
  checkCatInMarket,
  QUALITY_NAMES
} from '../utils/chainOperations'
import CatCard from './CatCard'
import UnifiedCatCard from './UnifiedCatCard'
import './Market.css'

const { TabPane } = Tabs
const { Option } = Select

// 品质映射配置
const qualityConfig = {
  0: { name: '普通', color: '#8c8c8c' },
  1: { name: '精良', color: '#52c41a' },
  2: { name: '卓越', color: '#1890ff' },
  3: { name: '非凡', color: '#722ed1' },
  4: { name: '至尊', color: '#f5222d' },
  5: { name: '神圣', color: '#fa8c16' },
  6: { name: '永恒', color: '#eb2f96' },
  7: { name: '传世', color: '#fadb14' }
};

function Market({ DFSWallet, userInfo }) {
  // 状态管理
  const [marketCats, setMarketCats] = useState([])
  const [userCats, setUserCats] = useState([])
  const [marketStats, setMarketStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // 模态框状态
  const [buyModalVisible, setBuyModalVisible] = useState(false)
  const [sellModalVisible, setSellModalVisible] = useState(false)
  const [selectedCat, setSelectedCat] = useState(null)

  // 表单状态
  const [sellPrice, setSellPrice] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // 筛选和排序状态
  const [qualityFilter, setQualityFilter] = useState('all')
  const [priceSort, setPriceSort] = useState('asc')
  const [activeTab, setActiveTab] = useState('market')

  // 获取市场数据
  const fetchMarketData = async () => {
    if (!DFSWallet) return
    
    try {
      setLoading(true)
      
      // 并行获取市场猫咪和统计信息
      const [cats, stats] = await Promise.all([
        getMarketCats(DFSWallet, 50),
        getMarketStats(DFSWallet)
      ])
      
      setMarketCats(cats || [])
      setMarketStats(stats)
      
    } catch (error) {
      console.error('获取市场数据失败:', error)
      message.error('获取市场数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取用户猫咪
  const fetchUserCats = async () => {
    if (!DFSWallet || !userInfo) return

    try {
      const cats = await getUserCats(DFSWallet, userInfo.name)
      // 只显示可交易的猫咪（卓越品质以上）
      const tradeableCats = cats.filter(cat => cat.is_tradeable && cat.quality >= 1)

      // 检查每只猫咪是否已经在市场上出售
      const catsWithMarketStatus = await Promise.all(
        tradeableCats.map(async (cat) => {
          try {
            const isListed = await checkCatInMarket(DFSWallet, cat.id)
            return {
              ...cat,
              isListedInMarket: isListed
            }
          } catch (error) {
            console.error(`检查猫咪#${cat.id}市场状态失败:`, error)
            return {
              ...cat,
              isListedInMarket: false
            }
          }
        })
      )

      setUserCats(catsWithMarketStatus)
    } catch (error) {
      console.error('获取用户猫咪失败:', error)
    }
  }

  // 初始化和刷新数据
  useEffect(() => {
    fetchMarketData()
    fetchUserCats()
  }, [DFSWallet, userInfo, refreshTrigger])

  // 处理购买猫咪
  const handleBuyCat = async () => {
    if (!selectedCat || !userInfo) return
    
    try {
      setActionLoading(true)
      await buyCatFromMarket(DFSWallet, userInfo.name, selectedCat.catId, selectedCat.price)
      
      setBuyModalVisible(false)
      setSelectedCat(null)
      setRefreshTrigger(prev => prev + 1)
      
    } catch (error) {
      console.error('购买猫咪失败:', error)
      message.error('购买猫咪失败: ' + (error.message || String(error)))
    } finally {
      setActionLoading(false)
    }
  }

  // 处理上架猫咪
  const handleSellCat = async () => {
    if (!selectedCat || !sellPrice || !userInfo) return
    
    try {
      setActionLoading(true)
      const priceAsset = `${parseFloat(sellPrice).toFixed(8)} DFS`
      await listCatForSale(DFSWallet, userInfo.name, selectedCat.id, priceAsset)
      
      setSellModalVisible(false)
      setSelectedCat(null)
      setSellPrice('')
      setRefreshTrigger(prev => prev + 1)
      
    } catch (error) {
      console.error('上架猫咪失败:', error)
      message.error('上架猫咪失败: ' + (error.message || String(error)))
    } finally {
      setActionLoading(false)
    }
  }

  // 处理下架猫咪
  const handleUnlistCat = async (catId) => {
    if (!userInfo) return
    
    try {
      setActionLoading(true)
      await unlistCatFromSale(DFSWallet, userInfo.name, catId)
      setRefreshTrigger(prev => prev + 1)
      
    } catch (error) {
      console.error('下架猫咪失败:', error)
      message.error('下架猫咪失败: ' + (error.message || String(error)))
    } finally {
      setActionLoading(false)
    }
  }



  // 筛选和排序市场猫咪
  const getFilteredAndSortedCats = () => {
    let filteredCats = marketCats

    // 品质筛选
    if (qualityFilter !== 'all') {
      filteredCats = filteredCats.filter(cat => cat.quality === parseInt(qualityFilter))
    }

    // 价格排序
    filteredCats.sort((a, b) => {
      const priceA = parseFloat(a.price.split(' ')[0])
      const priceB = parseFloat(b.price.split(' ')[0])
      return priceSort === 'asc' ? priceA - priceB : priceB - priceA
    })

    return filteredCats
  }

  // 渲染市场统计
  const renderMarketStats = () => {
    if (!marketStats) return null

    // 安全地获取数值，确保都是数字类型
    const safeNumber = (value, defaultValue = 0) => {
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    }

    return (
      <Row gutter={[4, 16]} style={{ marginBottom: 24 }} className="market-stats">
        <Col xs={12} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="在售猫咪"
              value={safeNumber(marketStats.activeListings)}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={12} lg={12}>
          <Card>
            <Statistic
              title="市场总值"
              value={safeNumber(marketStats.totalValue)}
              suffix="DFS"
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  // 渲染筛选控件
  const renderFilters = () => (
    <div style={{ marginBottom: 16 }}>
      <Space wrap>
        <Select
          value={qualityFilter}
          onChange={setQualityFilter}
          style={{ width: 120 }}
          placeholder="品质"
        >
          <Option value="all">全部</Option>
          {Object.entries(QUALITY_NAMES).map(([key, name]) => {
            const config = qualityConfig[key];
            return (
              <Option key={key} value={key}>
                <span style={{ color: config?.color || '#000' }}>
                  {name}
                </span>
              </Option>
            );
          })}
        </Select>
        <Select
          value={priceSort}
          onChange={setPriceSort}
          style={{ width: 120 }}
        >
          <Option value="asc">
            <SortAscendingOutlined /> 价格升序
          </Option>
          <Option value="desc">
            <SortDescendingOutlined /> 价格降序
          </Option>
        </Select>
      </Space>
    </div>
  )

  // 渲染市场猫咪卡片
  const renderMarketCat = (cat) => {
    // 检查是否是自己的猫咪
    const isOwnCat = userInfo && cat.seller === userInfo.name;

    return (
      <Col xs={12} sm={8} md={6} lg={4} xl={4} xxl={3} key={cat.catId}>
        <div className="market-cat-wrapper">
          <UnifiedCatCard
            cat={cat}
            isMarketMode={true}
            showPrice={true}
            // showSeller={true}
            isOwnCat={isOwnCat}
            onBuy={isOwnCat ? null : (cat) => {
              setSelectedCat(cat)
              setBuyModalVisible(true)
            }}
          />
        </div>
      </Col>
    )
  }

  // 渲染用户猫咪卡片
  const renderUserCat = (cat) => (
    <Col xs={12} sm={8} md={6} lg={4} xl={4} xxl={3} key={cat.id}>
      <div className="user-cat-wrapper">
        <UnifiedCatCard
          cat={cat}
          actionButton={
            <div className="cat-actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                {cat.isListedInMarket ? (
                  <Button
                    danger
                    icon={<DollarOutlined />}
                    size="small"
                    className="unlist-button"
                    onClick={() => handleUnlistCat(cat.id)}
                    loading={actionLoading}
                    block
                  >
                    下架
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    size="small"
                    className="sell-button"
                    onClick={() => {
                      setSelectedCat(cat)
                      setSellModalVisible(true)
                    }}
                    block
                  >
                    上架出售
                  </Button>
                )}
              </Space>
            </div>
          }
        />
      </div>
    </Col>
  )

  if (!userInfo) {
    return (
      <div className="market-container">
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请先连接钱包以使用市场功能"
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="market-container">
      {/* 标题和操作区域 */}
      <div style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <ShopOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              猫咪市场
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              在这里买卖你的猫咪，发现稀有品种
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchMarketData}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      {/* 统计信息区域 */}
      {renderMarketStats()}

      {/* 主要内容区域 */}
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ padding: '24px' }}>
          <TabPane tab={<span><ShopOutlined />市场</span>} key="market">
            {renderFilters()}

            <Spin spinning={loading}>
              {getFilteredAndSortedCats().length > 0 ? (
                <Row gutter={[16, 16]}>
                  {getFilteredAndSortedCats().map(renderMarketCat)}
                </Row>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无猫咪在售"
                />
              )}
            </Spin>
          </TabPane>

          <TabPane tab={<span><DollarOutlined />我的出售</span>} key="mysales">
            {userCats.length > 0 ? (
              <Row gutter={[16, 16]}>
                {userCats.map(renderUserCat)}
              </Row>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="您暂无可交易的猫咪"
              />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 购买确认模态框 */}
      <Modal
        title="购买猫咪"
        open={buyModalVisible}
        onOk={handleBuyCat}
        onCancel={() => {
          setBuyModalVisible(false)
          setSelectedCat(null)
        }}
        confirmLoading={actionLoading}
        okText="确认购买"
        cancelText="取消"
      >
        {selectedCat && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
               <UnifiedCatCard cat={selectedCat} />
            </div>
            <Divider />
            <div>
              {selectedCat.seller && (
                <p><strong>卖家:</strong> {selectedCat.seller}</p>
              )}
              {selectedCat.price && (
                <p style={{ fontSize: '18px', color: '#1890ff' }}>
                  <strong>{selectedCat.price}</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 上架出售模态框 */}
      <Modal
        title="上架猫咪"
        open={sellModalVisible}
        onOk={handleSellCat}
        onCancel={() => {
          setSellModalVisible(false)
          setSelectedCat(null)
          setSellPrice('')
        }}
        confirmLoading={actionLoading}
        okText="确认上架"
        cancelText="取消"
      >
        {selectedCat && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <UnifiedCatCard cat={selectedCat} />
            </div>
            <Divider />

            <div style={{ marginTop: 16 }}>
              <label>设置价格 (DFS):</label>
              <Input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="请输入价格，如: 10.5"
                suffix="DFS"
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </Modal>


    </div>
  )
}

export default Market
