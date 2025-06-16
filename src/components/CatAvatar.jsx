import React from 'react';
import { Avatar } from 'antd';

// 基于基因解析猫咪颜色
const getCatColor = (gene) => {
  // 确保gene是数字或者转换成数字
  let geneValue = gene;
  if (typeof gene === 'string') {
    // 尝试将字符串解析为数字
    try {
      geneValue = BigInt(gene) % BigInt(360);
      geneValue = Number(geneValue);
    } catch (e) {
      // 如果解析失败，使用字符串的字符编码总和作为基础
      geneValue = gene.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    }
  } else if (typeof gene === 'number') {
    geneValue = gene % 360;
  } else {
    geneValue = 0;
  }
  
  // 使用基因值的不同位来决定颜色
  const hue = geneValue; // 0-359的色调
  const saturation = 70 + (geneValue % 100) / 4; // 70-95%的饱和度
  const lightness = 60 + (geneValue % 80) / 4; // 60-80%的亮度
  
  // 返回HSL颜色
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// 基于基因解析猫咪眼睛颜色
const getCatEyeColor = (gene) => {
  // 同样处理不同类型的基因值
  let geneValue = gene;
  if (typeof gene === 'string') {
    try {
      geneValue = BigInt(gene) % BigInt(360);
      geneValue = Number(geneValue);
    } catch (e) {
      geneValue = gene.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
    }
  } else if (typeof gene === 'number') {
    geneValue = gene % 360;
  } else {
    geneValue = 0;
  }
  
  const hueOffset = (geneValue * 123) % 360; // 使用不同的计算方式，让眼睛颜色和身体颜色有差异
  return `hsl(${hueOffset}, 80%, 50%)`;
};

// 基于基因决定是否有特殊图案
const hasCatPattern = (gene) => {
  // 同样处理不同类型的基因值
  let geneValue = gene;
  if (typeof gene === 'string') {
    try {
      geneValue = BigInt(gene) % BigInt(7);
      geneValue = Number(geneValue);
    } catch (e) {
      geneValue = gene.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 7;
    }
  } else if (typeof gene === 'number') {
    geneValue = gene % 7;
  } else {
    geneValue = 0;
  }
  
  // 使用基因的某些位来决定是否有图案
  return geneValue > 3;
};

// 基于基因决定猫咪的稀有度
const getCatRarity = (gene) => {
  // 同样处理不同类型的基因值
  let geneValue = gene;
  if (typeof gene === 'string') {
    try {
      geneValue = BigInt(gene) % BigInt(100);
      geneValue = Number(geneValue);
    } catch (e) {
      geneValue = gene.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
    }
  } else if (typeof gene === 'number') {
    geneValue = gene % 100;
  } else {
    geneValue = 0;
  }
  
  // 根据稀有度返回不同的边框颜色和样式
  if (geneValue >= 95) return { border: '3px solid #9c27b0', boxShadow: '0 0 10px #9c27b0' }; // 传说
  if (geneValue >= 80) return { border: '2px solid #2196f3', boxShadow: '0 0 8px #2196f3' }; // 史诗
  if (geneValue >= 60) return { border: '2px solid #ffc107', boxShadow: '0 0 5px #ffc107' }; // 稀有
  return { border: '1px solid #9e9e9e', boxShadow: '0 0 3px #9e9e9e' }; // 普通
};

const CatAvatar = ({ cat, size = 40, showId = true, onClick }) => {
  // 如果没有猫咪数据，显示默认头像
  if (!cat) {
    return <Avatar size={size} style={{ backgroundColor: '#f56a00' }}>猫</Avatar>;
  }

  // 获取基因值，支持不同的字段名称
  const gene = cat.genes || cat.gene || 0;
  const id = cat.id || 0;
  
  // 获取猫咪的颜色和稀有度样式
  const catColor = getCatColor(gene);
  const eyeColor = getCatEyeColor(gene);
  const hasPattern = hasCatPattern(gene);
  const rarityStyle = getCatRarity(gene);
  
  // 生成不同的背景模式基于基因
  const backgroundStyle = hasPattern 
    ? { background: `${catColor} repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)` }
    : { background: `radial-gradient(circle, ${catColor}, ${catColor.replace('hsl', 'hsla').replace(')', ', 0.7)')}` };
  
  // 最终样式 = 背景样式 + 稀有度样式
  const combinedStyle = {
    ...backgroundStyle,
    ...rarityStyle,
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default'
  };

  return (
    <div 
      className="cat-avatar" 
      style={combinedStyle}
      onClick={onClick}
    >
      {/* 猫咪眼睛 */}
      <div 
        className="cat-avatar-eyes"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          background: eyeColor,
          top: size * 0.25,
          left: size * 0.35,
        }}
      />
      
      {/* 猫咪ID */}
      {showId && (
        <div 
          className="cat-avatar-id"
          style={{ fontSize: Math.max(size / 4, 10) }}
        >
          #{id}
        </div>
      )}
    </div>
  );
};

export default CatAvatar; 