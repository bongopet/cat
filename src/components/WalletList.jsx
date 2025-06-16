import React, { useMemo } from 'react';
import './WalletList.css'; // 我们将创建这个CSS文件

// 导入钱包类型常量
// 注意：您需要确保从正确的路径导入WalletType
import { WalletType } from 'dfssdk/dist/types';

// 获取基础路径
const getBasePath = () => {
  // 检查是否为生产环境
  if (import.meta.env.PROD) {
    // 使用 vite.config.js 中配置的 base 路径
    return '/bongocat/';
  }
  // 开发环境使用根路径
  return '/';
};

const WalletList = ({ onWalletSelect }) => {
  // 获取基础路径
  const basePath = getBasePath();
  
  // 检查是否在Telegram应用中
  const isTgApp = useMemo(() => {
    const Telegram = window.Telegram;
    return Telegram?.WebApp?.platform && Telegram?.WebApp?.platform !== 'unknown';
  }, []);

  // 输出WalletType值，用于调试
  console.log('WalletType 值:', { 
    WEB: WalletType.WEB, 
    DFSWALLET: WalletType.DFSWALLET, 
    TELEGRAMAPP: WalletType.TELEGRAMAPP 
  });

  // 处理钱包选择
  const handleChoose = (walletType) => {
    console.log('钱包选择被点击:', walletType);
    if (onWalletSelect) {
      console.log('调用 onWalletSelect 函数');
      onWalletSelect(walletType);
    } else {
      console.error('onWalletSelect 函数未定义');
    }
  };

  return (
    <div className="wallets">
      <div className="title">选择登录方式</div>
      
      <div className="item" onClick={() => handleChoose(WalletType.WEB)}>
        <img src={`${basePath}images/fingerprint.svg`} className="icon" alt="Passkey" />
        <div className="label">Passkey</div>
      </div>
      
      <div className="item" onClick={() => handleChoose(WalletType.DFSWALLET)}>
        <img src={`${basePath}images/DFS.png`} className="icon" alt="DFS Wallet" />
        <div className="label">DFS Wallet</div>
      </div>
      
      {isTgApp && (
        <div className="item" onClick={() => handleChoose(WalletType.TELEGRAMAPP)}>
          <img src={`${basePath}images/logo.png`} className="icon" alt="Telegram App" />
          <div className="label">Telegram App</div>
        </div>
      )}
    </div>
  );
};

export default WalletList; 