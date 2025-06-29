import React, { useState, useEffect, useCallback } from 'react'
import { Button, message, Layout, Typography, Tabs, Modal, Tag, Drawer } from 'antd'
import {
  WalletOutlined,
  LogoutOutlined,
  HomeOutlined,
  ShopOutlined,
  TrophyOutlined,
  MenuOutlined,
  BarChartOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  FireOutlined,
  StarOutlined,
  DollarOutlined,
  GoldOutlined,
  LockOutlined,
  TeamOutlined
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
import InvitationSystem from './components/InvitationSystem'
import WalletSigner from './components/WalletSigner'
import SignatureEncryption from './components/SignatureEncryption'
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

  // 移除定时器，只保留手动刷新
  const [activeTab, setActiveTab] = useState('home')
  const [catDetailsVisible, setCatDetailsVisible] = useState(false)
  const [mintingCat, setMintingCat] = useState(false)

  // 获取余额的函数
  const fetchBalance = useCallback(async () => {
    console.log('fetchBalance被调用，检查条件:', {
      dfsWallet: !!dfsWallet,
      account: !!account,
      accountName: account?.name
    });

    if (dfsWallet && account ) {
      try {
        console.log('开始获取余额...');
        const balanceStr = await getAccountBalance(dfsWallet, 'eosio.token', account.name, 'DFS');
        setBalance({ balance: balanceStr });
        console.log('自动刷新余额成功:', balanceStr);
      } catch (balanceError) {
        console.error('自动刷新余额失败:', balanceError);
        // 如果获取失败，不更新余额状态，保持之前的值
      }
    } else {
      console.log('fetchBalance条件不满足，跳过余额获取');
    }
  }, [dfsWallet, account]);

  // 移除定时器相关函数，只保留手动刷新

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

  // 移除定时器清理代码

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

    // 检查是否已经登录
    const checkLoginStatus = async () => {
      try {
        // 从localStorage获取保存的钱包类型和用户信息
        const savedWalletType = localStorage.getItem('dfs_wallet_type');
        const savedUserInfo = localStorage.getItem('dfs_user_info');

        console.log('检查保存的钱包状态:', { savedWalletType, savedUserInfo });

        if (savedWalletType && savedUserInfo) {
          const userInfo = JSON.parse(savedUserInfo);
          console.log('尝试恢复钱包连接:', { walletType: savedWalletType, userInfo });

          // 使用保存的钱包类型重新初始化
          const walletType = savedWalletType === 'DFSWALLET' ? WalletType.DFSWALLET :
                           savedWalletType === 'WEB' ? WalletType.WEB :
                           WalletType.TELEGRAMAPP;

          await wallet.init(walletType);
          console.log('钱包重新初始化完成，钱包类型:', walletType);

          // 直接使用保存的用户信息恢复连接状态
          console.log('使用保存的用户信息恢复连接:', userInfo);
          setAccount(userInfo);
          setConnected(true);

          // 设置全局权限
          if (userInfo.authority) {
            setUserPermission(userInfo.authority);
            console.log('已设置全局权限:', userInfo.authority);
          } else {
            setUserPermission('active');
            console.log('使用默认权限: active');
          }

          // 获取余额并验证连接有效性
          try {
            const balanceStr = await getAccountBalance(wallet, 'eosio.token', userInfo.name, 'DFS');
            setBalance({ balance: balanceStr });
            console.log('恢复用户余额:', balanceStr);
            console.log('钱包连接状态恢复成功');
          } catch (balanceError) {
            console.error('获取余额失败，可能连接已过期:', balanceError);
            // 如果余额获取失败，可能是连接已过期，清除保存的状态
            console.log('清除可能过期的连接状态');
            localStorage.removeItem('dfs_wallet_type');
            localStorage.removeItem('dfs_user_info');
            setConnected(false);
            setAccount(null);
            setBalance(null);
            resetUserPermission();
          }
        } else {
          console.log('没有保存的钱包连接信息');
        }
      } catch (error) {
        console.log('恢复钱包连接失败:', error);
        // 清除可能损坏的保存信息
        localStorage.removeItem('dfs_wallet_type');
        localStorage.removeItem('dfs_user_info');
      }
    };

    // 延迟检查登录状态，确保钱包完全初始化
    setTimeout(checkLoginStatus, 1000);
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

      // 保存钱包连接状态到localStorage
      const walletTypeStr = walletType === WalletType.DFSWALLET ? 'DFSWALLET' :
                           walletType === WalletType.WEB ? 'WEB' :
                           'TELEGRAMAPP';
      localStorage.setItem('dfs_wallet_type', walletTypeStr);
      localStorage.setItem('dfs_user_info', JSON.stringify(userInfo));
      console.log('已保存钱包连接状态:', { walletType: walletTypeStr, userInfo });

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
      // 停止余额自动刷新


      // Call logout method
      dfsWallet.logout()
      setConnected(false)
      setAccount(null)
      setBalance(null)
      setSelectedCat(null)

      // 清除保存的钱包连接状态
      localStorage.removeItem('dfs_wallet_type')
      localStorage.removeItem('dfs_user_info')
      console.log('已清除保存的钱包连接状态')

      // 重置权限
      resetUserPermission()

      message.success('钱包已断开连接')
    } catch (error) {
      console.error('断开钱包连接失败:', error)
      message.error('断开钱包连接失败: ' + (error.message || String(error)))
    }
  }

  // Handle cat selection
  const handleCatSelect = async (catId) => {
    console.log('选择猫咪:', catId);
    let cat = catList.find(c => c.id === catId);

    if (cat) {
      console.log('找到猫咪数据:', cat);
      setSelectedCat(cat);
      setCatDetailsVisible(true);
    } else {
      console.log('本地未找到猫咪数据，尝试重新获取...', catId);

      // 如果本地没找到，可能是新购买的猫咪，尝试重新获取猫咪列表
      try {
        if (dfsWallet && account) {
          const cats = await getUserCats(dfsWallet, account.name);
          setCatList(cats);

          // 在新获取的列表中查找
          cat = cats.find(c => c.id === catId);
          if (cat) {
            console.log('重新获取后找到猫咪数据:', cat);
            setSelectedCat(cat);
            setCatDetailsVisible(true);
          } else {
            console.error('重新获取后仍未找到猫咪数据:', catId, '可用猫咪:', cats.map(c => c.id));
            message.error('未找到猫咪数据，请稍后重试');
          }
        }
      } catch (error) {
        console.error('重新获取猫咪列表失败:', error);
        message.error('获取猫咪数据失败，请刷新页面重试');
      }
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
            // 如果当前选中的猫咪不存在了（比如被繁殖销毁），选择最新的猫咪（ID最大）
            if (cats.length > 0) {
              // 按ID排序，选择ID最大的猫咪（最新繁殖出来的）
              const sortedCats = [...cats].sort((a, b) => b.id - a.id);
              const newestCat = sortedCats[0];
              console.log('当前选中的猫咪已不存在，自动选择最新的猫咪:', newestCat.id);
              setSelectedCat(newestCat);
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
          // 如果没有选中任何猫咪但有猫咪存在，选择最新的猫咪（ID最大）
          const sortedCats = [...cats].sort((a, b) => b.id - a.id);
          setSelectedCat(sortedCats[0]);
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
      icon: <CrownOutlined />,
      label: '排行榜',
    },
    {
      key: 'market',
      icon: <ShopOutlined />,
      label: '市场',
    },
    {
      key: 'arena',
      icon: <FireOutlined />,
      label: '擂台',
    },
    {
      key: 'legendary-pool',
      icon: <GoldOutlined />,
      label: '传世猫池',
    },
    {
      key: 'invitation',
      icon: <TeamOutlined />,
      label: '邀请',
    },
    // {
    //   key: 'wallet-signer',
    //   icon: <WalletOutlined />,
    //   label: '签名工具',
    // },
    // {
    //   key: 'signature-encryption',
    //   icon: <LockOutlined />,
    //   label: '签名加密',
    // },
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

      case 'invitation':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <InvitationSystem DFSWallet={dfsWallet} userInfo={account} />
          </div>
        );

      case 'wallet-signer':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <WalletSigner DFSWallet={dfsWallet} userInfo={account} />
          </div>
        );

      case 'signature-encryption':
        return (
          <div className="tab-content" style={{ margin: 0, padding: 0 }}>
            <SignatureEncryption DFSWallet={dfsWallet} userInfo={account} />
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
      {/* <div className="bubbles">
        {[...Array(10)].map((_, i) => (
          <div className="bubble" key={i} style={{
            '--size': `${Math.random() * 5 + 2}rem`,
            '--distance': `${Math.random() * 6 + 4}rem`,
            '--position': `${Math.random() * 100}%`,
            '--time': `${Math.random() * 2 + 2}s`,
            '--delay': `${Math.random() * 2}s`,
          }}></div>
        ))}
      </div> */}

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
                {/* 余额显示在按钮左边 */}
                {balance && (
                  <div className="balance-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      {(() => {
                        try {
                          const balanceStr = balance.balance || '0.00000000 DFS';
                          const amount = parseFloat(balanceStr.split(' ')[0]);
                          return `${amount.toFixed(2)} DFS`;
                        } catch (error) {
                          return '0.00 DFS';
                        }
                      })()}
                    </Text>
                    <Button
                      size="small"
                      type="text"
                      onClick={fetchBalance}
                      style={{ color: '#52c41a', padding: '0 4px' }}
                      title="手动刷新余额"
                    >
                      🔄
                    </Button>
                  </div>
                )}
                <Button
                  danger
                  icon={<LogoutOutlined />}
                  onClick={disconnectWallet}
                >
                  {account?.name || '断开连接'}
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
          
              <div className="connect-features">
                <div className="feature-item">
                  <div className="feature-icon">
                    <img src="/cat/images/Cat.svg" alt="猫咪" className="feature-icon-image" />
                  </div>
                  <h3>收集猫咪</h3>
                  <p>繁殖独特的猫咪，8种品质等级，每只都有独特基因和属性</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="feature-icon-symbol">⚔️</span>
                  </div>
                  <h3>擂台对战</h3>
                  <p>将猫咪放置在擂台上，接受其他玩家的挑战，赢取DFS奖励</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="feature-icon-symbol">🎯</span>
                  </div>
                  <h3>邀请系统</h3>
                  <p>创建邀请码邀请新用户，获得邀请奖励和持续收益分成</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="feature-icon-symbol">🏆</span>
                  </div>
                  <h3>提升等级</h3>
                  <p>使用猫币和DFS喂养猫咪，提升等级和属性，增强战斗力</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="feature-icon-symbol">💰</span>
                  </div>
                  <h3>市场交易</h3>
                  <p>在市场上买卖猫咪，发现稀有品质，建立您的猫咪收藏</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <span className="feature-icon-symbol">👑</span>
                  </div>
                  <h3>传世猫池</h3>
                  <p>拥有传世品质猫咪可每日领取特殊奖励，享受顶级收益</p>
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