import React, { useState, useEffect } from 'react'
import { Button, message, Layout, Typography, Tabs, Modal, Tag } from 'antd'
import {
  WalletOutlined,
  LogoutOutlined,
  HomeOutlined,
  ShopOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import Wallet from 'dfssdk'
import { WalletType } from 'dfssdk/dist/types'
import CatList from './components/CatList'
import CatDetail from './components/CatDetail'
import RankingList from './components/RankingList'
import { getUserCats, mintCat } from './utils/chainOperations'
import { getAccountBalance } from './utils/eosUtils'
import WalletList from './components/WalletList'
import './App.css'

const { Header, Content } = Layout
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

  // WalletList state
  const [showWalletList, setShowWalletList] = useState(false)

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
      message.success('钱包已断开连接')
    } catch (error) {
      console.error('断开钱包连接失败:', error)
      message.error('断开钱包连接失败: ' + (error.message || String(error)))
    }
  }

  // Handle cat selection
  const handleCatSelect = (catId) => {
    const cat = catList.find(c => c.id === catId);
    setSelectedCat(cat)
    setCatDetailsVisible(true)
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

  // Get cats list
  useEffect(() => {
    const fetchCats = async () => {
      if (!dfsWallet || !account || !connected) return;

      try {
        const cats = await getUserCats(dfsWallet, account.name);
        setCatList(cats);

        // If there are cats but none selected, default select first one
        if (cats.length > 0 && !selectedCat) {
          setSelectedCat(cats[0]);
        }
      } catch (error) {
        console.error('获取猫咪列表失败:', error);
      }
    };

    fetchCats();
  }, [dfsWallet, account, connected, refreshCats]);

  // Define tab items
  const tabItems = [
    {
      key: 'home',
      label: (
        <span>
          <HomeOutlined />
          主页
        </span>
      ),
      children: (
        <div className="tab-content">
          <CatList
            DFSWallet={dfsWallet}
            userInfo={account}
            onSelectCat={handleCatSelect}
            refreshTrigger={refreshCats}
            selectedCatId={selectedCat?.id}
            onMintCat={handleMintCat}
            loading={connecting || mintingCat}
          />
        </div>
      )
    },
    {
      key: 'ranking',
      label: (
        <span>
          <TrophyOutlined />
          排行榜
        </span>
      ),
      children: (
        <div className="tab-content">
          <RankingList DFSWallet={dfsWallet} />
        </div>
      )
    },
    {
      key: 'market',
      label: (
        <span>
          <ShopOutlined />
          市场
        </span>
      ),
      children: (
        <div className="tab-content">
          <div className="coming-soon-container">
            <div className="coming-soon-icon">🛒</div>
            <h2>市场功能即将推出</h2>
            <p>敬请期待！我们正在紧锣密鼓地开发猫咪交易市场，让您可以自由买卖您的猫咪。</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <Layout className="app-layout">
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

      <Header className="app-header">
        <div className="header-content">
          {/* Logo和标题区域 */}
          <div className="logo-section">
            <div className="logo">
              <img
                src="https://s1.imagehub.cc/images/2025/06/11/c34dd32ef2c2206b6a77cd970cd5818b.png"
                alt="猫星球"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <Title level={4} style={{ margin: 0, color: 'white' }}>
              猫星球
            </Title>
          </div>

          {/* Wallet connection info and buttons */}
          <div className="wallet-section">
            {connected ? (
              <>
                <div className="account-info">
                  <Text style={{ color: 'white' }} ellipsis={{ tooltip: account?.name }}>
                    {account?.name}
                  </Text>
                  {balance && (
                    <Tag color="gold">{balance.balance}</Tag>
                  )}
                </div>
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

      <Content className="app-content">
        {connected ? (
          <div className="content-container">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="main-tabs"
              tabBarStyle={{ marginBottom: 16 }}
              items={tabItems}
            />
          </div>
        ) : (
          <div className="connect-prompt">
            <div className="connect-hero">
              <div className="connect-cat-image">
                <img
                  src="https://s1.imagehub.cc/images/2025/06/11/c34dd32ef2c2206b6a77cd970cd5818b.png"
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