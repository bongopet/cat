import React, { useState, useEffect } from 'react'
import { Button, message, Layout, Typography, Tabs, Modal, Tag, Drawer } from 'antd'
import {
  WalletOutlined,
  LogoutOutlined,
  HomeOutlined,
  ShopOutlined,
  TrophyOutlined,
  MenuOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import Wallet from 'dfssdk'
import { WalletType } from 'dfssdk/dist/types'
import CatList from './components/CatList'
import CatDetail from './components/CatDetail'
import RankingList from './components/RankingList'
import CatStats from './components/CatStats'
import Market from './components/Market'
import Arena from './components/Arena'
import LegendaryPool from './components/LegendaryPool'
import {
  getUserCats,
  mintCat,
  claimFreeCat,
  checkSwapCat,
  grabImage,
  breedCats,
  feedCatWithDFS
} from './utils/chainOperations'
import { getAccountBalance } from './utils/eosUtils'
import { setUserPermission, resetUserPermission } from './utils/permissionManager'
import WalletList from './components/WalletList'
import './App.css'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography
  
function App() {
  // DFS wallet state
  const [dfsWallet, setDfsWallet] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)

  // Cat functionality state
  const [catList, setCatList] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [refreshCats, setRefreshCats] = useState(0)
  const [activeTab, setActiveTab] = useState('home')
  const [catDetailsVisible, setCatDetailsVisible] = useState(false)
  const [mintingCat, setMintingCat] = useState(false)

  // New BongoCat functionality state
  const [claimingFreeCat, setClaimingFreeCat] = useState(false)
  const [checkingSwap, setCheckingSwap] = useState(false)
  const [grabbingImage, setGrabbingImage] = useState(false)

  // WalletList state
  const [showWalletList, setShowWalletList] = useState(false)
  
  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // 检测窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initialize DFS wallet
  useEffect(() => {
    // Initialize wallet per README example
    const wallet = new Wallet({
      appName: '猫星球',
      logo: 'https://dfs.land/assets/icons/180x180.png',
      rpcUrl: 'https://api.dfs.land',
    })
    setDfsWallet(wallet)
    console.log('钱包对象已初始化', wallet);
    // 不再自动尝试连接钱包，只在用户点击连接按钮时连接
  }, []);

  // Get account information
  const fetchAccountInfo = async (wallet) => {
    try {
      // Use login method to get user info
      const userInfo = await wallet.login()
      setAccount(userInfo)

      // Get balance information
      if (userInfo && userInfo.name) {
        try {
          const balanceStr = await getAccountBalance(wallet, 'eosio.token', userInfo.name, 'DFS');
          setBalance({ balance: balanceStr });
        } catch (balanceError) {
          console.error('获取余额失败:', balanceError);
          setBalance({ balance: '获取失败' });
        }
      }
    } catch (error) {
      console.error('获取账户信息失败:', error)
      message.error('获取账户信息失败')
    }
  }

  // Handle wallet selection
  const handleWalletSelect = (walletType) => {
    console.log('App.jsx - handleWalletSelect 被调用，钱包类型:', walletType);
    connectWallet(walletType);
  };

  // Show wallet selector
  const showWalletSelector = () => {
    console.log('显示钱包选择列表');
    setShowWalletList(true);
  };

  // Connect wallet
  const connectWallet = async (walletType = WalletType.DFSWALLET) => {
    if (!dfsWallet) {
      console.error('钱包对象未初始化');
      return;
    }

    try {
      setConnecting(true);
      console.log('开始连接钱包...类型:', walletType);
      
      // 输出钱包对象信息，用于调试
      console.log('钱包对象:', dfsWallet);
      console.log('WalletType 值:', { 
        WEB: WalletType.WEB, 
        DFSWALLET: WalletType.DFSWALLET, 
        TELEGRAMAPP: WalletType.TELEGRAMAPP 
      });
      
      // 使用传入的钱包类型初始化
      await dfsWallet.init(walletType);
      console.log(`${walletType === WalletType.DFSWALLET ? 'DFSAPP' : walletType === WalletType.WEB ? 'Passkey' : 'Telegram'}钱包已初始化`);
      
      // Login to get user info
      const userInfo = await dfsWallet.login();
      console.log('登录成功，用户信息:', userInfo);
      setAccount(userInfo);
      setConnected(true);

      // 设置全局权限
      if (userInfo && userInfo.authority) {
        setUserPermission(userInfo.authority);
        console.log('已设置全局权限:', userInfo.authority);
      } else {
        setUserPermission('active'); // 默认权限
        console.log('未找到权限信息，使用默认权限: active');
      }

      // 隐藏钱包列表
      setShowWalletList(false);

      // Get balance
      if (userInfo && userInfo.name) {
        try {
          console.log('尝试获取余额...');
          const balanceStr = await getAccountBalance(dfsWallet, 'eosio.token', userInfo.name, 'DFS');
          setBalance({ balance: balanceStr });
        } catch (balanceError) {
          console.error('获取余额失败:', balanceError);
          setBalance({ balance: '获取失败' });
        }
      }

      message.success('钱包连接成功');
    } catch (error) {
      console.error('连接钱包失败:', error);
      message.error('连接钱包失败: ' + (error.message || String(error)));
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    if (!dfsWallet) return

    try {
      // Call logout method
      dfsWallet.logout()
      setConnected(false)
      setAccount(null)
      setBalance(null)
      setSelectedCat(null)

      // 重置权限
      resetUserPermission()

      message.success('钱包已断开连接')
    } catch (error) {
      console.error('断开钱包连接失败:', error)
      message.error('断开钱包连接失败: ' + (error.message || String(error)))
    }
  }

  // Handle cat selection
  const handleCatSelect = (catId) => {
    console.log('选择猫咪:', catId);
    const cat = catList.find(c => c.id === catId);
    if (cat) {
      console.log('找到猫咪数据:', cat);
      setSelectedCat(cat);
      setCatDetailsVisible(true);
    } else {
      console.error('未找到猫咪数据:', catId, '可用猫咪:', catList.map(c => c.id));
      message.error('未找到猫咪数据，请刷新页面重试');
    }
  }

  // Handle cat action completion refresh
  const handleCatActionComplete = () => {
    setRefreshCats(prev => prev + 1)
  }

  // Mint new cat
  const handleMintCat = async () => {
    if (!dfsWallet || !account) {
      message.warning('请先连接钱包');
      return;
    }

    try {
      setMintingCat(true);
      const newCat = await mintCat(dfsWallet, account.name);
      message.success('猫咪铸造成功！');

      // Refresh cat list
      setRefreshCats(prev => prev + 1);
    } catch (error) {
      console.error('铸造猫咪失败:', error);
      message.error('铸造猫咪失败: ' + (error.message || String(error)));
    } finally {
      setMintingCat(false);
    }
  };

  // Claim free cat
  const handleClaimFreeCat = async () => {
    if (!dfsWallet || !account) {
      message.warning('请先连接钱包');
      return;
    }

    try {
      setClaimingFreeCat(true);
      console.log('App.jsx - 调用claimFreeCat前的account对象:', account);
      const result = await claimFreeCat(dfsWallet, account);

      if (result.success) {
        // Refresh cat list
        setRefreshCats(prev => prev + 1);
      }
    } catch (error) {
      console.error('领取免费猫咪失败:', error);
      message.error('领取免费猫咪失败: ' + (error.message || String(error)));
    } finally {
      setClaimingFreeCat(false);
    }
  };

  // Check swap for cats
  const handleCheckSwap = async () => {
    if (!dfsWallet || !account) {
      message.warning('请先连接钱包');
      return;
    }

    try {
      setCheckingSwap(true);
      console.log('App.jsx - 调用checkSwapCat前的account对象:', account);
      const result = await checkSwapCat(dfsWallet, account);

      if (result.success) {
        // Refresh cat list
        setRefreshCats(prev => prev + 1);
      }
    } catch (error) {
      console.error('检查交易记录失败:', error);
      message.error('检查交易记录失败: ' + (error.message || String(error)));
    } finally {
      setCheckingSwap(false);
    }
  };

  // Grab image for cats
  const handleGrabImage = async () => {
    if (!dfsWallet || !account) {
      message.warning('请先连接钱包');
      return;
    }

    try {
      setGrabbingImage(true);
      const result = await grabImage(dfsWallet, account);

      if (result.success) {
        // Refresh cat list
        setRefreshCats(prev => prev + 1);
      }
    } catch (error) {
      console.error('抢图失败:', error);
      message.error('抢图失败: ' + (error.message || String(error)));
    } finally {
      setGrabbingImage(false);
    }
  };

  // Get cats list
  useEffect(() => {
    const fetchCats = async () => {
      if (!dfsWallet || !account || !connected) return;

      try {
        const cats = await getUserCats(dfsWallet, account.name);
        setCatList(cats);

        // 检查当前选中的猫咪是否还存在
        if (selectedCat) {
          const currentCatStillExists = cats.find(cat => cat.id === selectedCat.id);
          if (!currentCatStillExists) {
            // 如果当前选中的猫咪不存在了（比如被繁殖销毁），选择第一只猫咪或清空选择
            if (cats.length > 0) {
              console.log('当前选中的猫咪已不存在，自动选择第一只猫咪');
              setSelectedCat(cats[0]);
            } else {
              console.log('没有猫咪了，清空选择');
              setSelectedCat(null);
              setCatDetailsVisible(false);
            }
          } else {
            // 更新选中猫咪的数据（可能属性有变化）
            setSelectedCat(currentCatStillExists);
          }
        } else if (cats.length > 0) {
          // 如果没有选中任何猫咪但有猫咪存在，选择第一只
          setSelectedCat(cats[0]);
        }
      } catch (error) {
        console.error('获取猫咪列表失败:', error);
      }
    };

    fetchCats();
  }, [dfsWallet, account, connected, refreshCats]);

  // Define menu items for navigation
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '主页',
    },
    {
      key: 'ranking',
      icon: <TrophyOutlined />,
      label: '排行榜',
    },
    {
      key: 'market',
      icon: <ShopOutlined />,
      label: '市场',
    },
    {
      key: 'arena',
      icon: <TrophyOutlined />,
      label: '擂台',
    },
    {
      key: 'legendary-pool',
      icon: <TrophyOutlined />,
      label: '传世猫池',
    },
    {
      key: 'stats',
      icon: <BarChartOutlined />,
      label: '统计',
    }
  ];

  // Handle menu item click
  const handleMenuClick = (key) => {
    setActiveTab(key)
    if (isMobile) {
      setDrawerVisible(false)
    }
  }

  // Define tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <CatList
              DFSWallet={dfsWallet}
              userInfo={account}
              onSelectCat={handleCatSelect}
              refreshTrigger={refreshCats}
              selectedCatId={selectedCat?.id}
              onMintCat={handleMintCat}
              onClaimFreeCat={handleClaimFreeCat}
              onCheckSwap={handleCheckSwap}
              onGrabImage={handleGrabImage}
              loading={connecting || mintingCat || claimingFreeCat || checkingSwap || grabbingImage}
            />
          </div>
        );
        
      case 'ranking':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
              <div className="ranking-header">
                <div></div> {/* 占位，保持与其他页面布局一致 */}
              </div>
                <RankingList DFSWallet={dfsWallet} />
          </div>
        );
      case 'market':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <Market DFSWallet={dfsWallet} userInfo={account} />
          </div>
        );

      case 'arena':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <Arena DFSWallet={dfsWallet} accountName={account?.name} />
          </div>
        );

      case 'legendary-pool':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <LegendaryPool DFSWallet={dfsWallet} userInfo={account} />
          </div>
        );

      case 'stats':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <CatStats DFSWallet={dfsWallet} />
          </div>
        );

      default:
        return null;
    }
  };

  // Render navigation menu
  const renderMenu = () => {
    return (
      <div className="nav-menu">
        {menuItems.map(item => (
          <div 
            key={item.key} 
            className={`menu-item ${activeTab === item.key ? 'menu-item-active' : ''}`}
            onClick={() => handleMenuClick(item.key)}
          >
            {item.icon}
            <span className="menu-label">{item.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Layout className="app-layout" style={{ margin: 0, padding: 0 }}>
      {/* 背景气泡动画 */}
      <div className="bubbles">
        {[...Array(10)].map((_, i) => (
          <div className="bubble" key={i} style={{
            '--size': `${Math.random() * 5 + 2}rem`,
            '--distance': `${Math.random() * 6 + 4}rem`,
            '--position': `${Math.random() * 100}%`,
            '--time': `${Math.random() * 2 + 2}s`,
            '--delay': `${Math.random() * 2}s`,
          }}></div>
        ))}
      </div>

      <Header className="app-header" style={{ margin: 0, padding: 0 }}>
        <div className="header-content">
          {/* 移动端菜单按钮 */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />}
              onClick={() => setDrawerVisible(true)}
              style={{ marginRight: '10px', border: 'none', padding: 0 }}
              className="mobile-menu-button"
            />
          )}

          {/* Logo和标题区域 */}
          <div className="logo-section">
            <div className="logo">
              <img
                // src={`${basePath}images/logo.png`}
                src={`/cat/images/logo.png`}
                alt="猫星球"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <Title level={4} style={{ margin: 0, color: 'white' }}>
              猫星球 测试版
            </Title>
          </div>

          {/* 钱包连接/断开按钮 */}
          <div className="wallet-section">
            {connected ? (
              <>
                {/* 账户信息显示在按钮旁边 */}
                {connected && (
                  <div className="account-info">
                    <Text style={{ color: 'white', maxWidth: '250px' }} ellipsis={{ tooltip: account?.name }}>
                      {account?.name}
                    </Text>
                  </div>
                )}
                <Button
                  danger
                  icon={<LogoutOutlined />}
                  onClick={disconnectWallet}
                >
                  断开连接
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                onClick={showWalletSelector}
                loading={connecting}
                disabled={connecting}
                icon={<WalletOutlined />}
              >
                连接钱包
              </Button>
            )}
          </div>
        </div>
      </Header>

      <Layout style={{ margin: 0, padding: 0 }}>
        {/* 桌面端固定菜单 */}
        {!isMobile && (
          <div className="desktop-menu-container">
            {renderMenu()}
          </div>
        )}

        {/* 移动端抽屉菜单 */}
        {isMobile && (
          <Drawer
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            title="菜单导航"
            bodyStyle={{ padding: 0 }}
            width={200}
          >
            {renderMenu()}
          </Drawer>
        )}

        <Content className="app-content" style={{ margin: 0, padding: 0 }}>
          {connected ? (
            <div className="content-container" style={{ margin: 0, padding: 0 }}>
              {renderTabContent()}
            </div>
          ) : (
            <div className="connect-prompt">
              <div className="connect-hero">
                <div className="connect-cat-image">
                  <img
                    // src={`${basePath}images/logo.png`}
                    src={`/cat/images/logo.png`}
                    alt="猫星球"
                    className="hero-cat-image"
                  />
                </div>
                <div className="connect-text">
                  <h1>欢迎来到猫星球</h1>
                  <p>连接您的DFS钱包，开始您的养猫之旅！</p>
                  <Button
                    type="primary"
                    size="large"
                    onClick={showWalletSelector}
                    loading={connecting}
                    icon={<WalletOutlined />}
                  >
                    连接DFS钱包
                  </Button>
                </div>
              </div>
              <div className="connect-features">
                <div className="feature-item">
                  <div className="feature-icon">
                    <img src="/cat/images/Cat.svg" alt="猫咪" className="feature-icon-image" />
                  </div>
                  <h3>收集猫咪</h3>
                  <p>铸造独特的猫咪，每只猫咪都有自己的特性和属性</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="feature-icon-symbol">🏆</span>
                  </div>
                  <h3>提升等级</h3>
                  <p>通过喂养和互动提升您的猫咪等级，增强属性</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="feature-icon-symbol">💰</span>
                  </div>
                  <h3>市场交易</h3>
                  <p>未来您可以在市场上买卖猫咪，赚取收益</p>
                </div>
              </div>
            </div>
          )}
        </Content>
      </Layout>

      {/* Cat detail modal */}
      <Modal
        title={selectedCat ? `猫咪 #${selectedCat.id} 详情` : "猫咪详情"}
        open={catDetailsVisible}
        onCancel={() => setCatDetailsVisible(false)}
        footer={null}
        width={700}
        className="cat-modal"
      >
        {selectedCat && (
          <CatDetail
            DFSWallet={dfsWallet}
            userInfo={account}
            selectedCat={selectedCat}
            refreshCats={handleCatActionComplete}
            allCats={catList}
          />
        )}
      </Modal>

      {/* WalletList modal */}
      {showWalletList && !connected && (
        <div className="wallet-list-modal">
          <div className="wallet-list-backdrop" onClick={() => {
            setShowWalletList(false);
          }}></div>
          <WalletList onWalletSelect={handleWalletSelect} />
        </div>
      )}
    </Layout>
  )
}

export default App