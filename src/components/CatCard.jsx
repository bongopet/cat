import React from 'react'
import { Card, Tag, Space, Button } from 'antd'
import {
  FireOutlined,
  SafetyOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  StarOutlined
} from '@ant-design/icons'
import { QUALITY_NAMES, decryptCatStats } from '../utils/chainOperations'
import CatRenderer from './CatRenderer'
import CatAttributesBrief from './CatAttributesBrief'
import './CatCard.css'

function CatCard({
  cat,
  showDetails = false,
  onClick,
  showPrice = false,
  showSeller = false,
  isMarketMode = false,
  onBuy,
  onViewDetails,
  showAttributes = false,  // 新增：是否显示属性
  variant = 'default'      // 新增：卡片变体 'default' | 'market' | 'list'
}) {
  if (!cat) return null

  // 品质颜色映射 - 与CatList保持一致
  const QUALITY_COLORS = {
    0: '#8c8c8c',  // 普通 - 灰色
    1: '#52c41a',  // 精良 - 绿色
    2: '#1890ff',  // 卓越 - 蓝色
    3: '#722ed1',  // 非凡 - 紫色
    4: '#f5222d',  // 至尊 - 红色
    5: '#fa8c16',  // 神圣 - 橙色
    6: '#eb2f96',  // 永恒 - 粉色
    7: '#fadb14'   // 传世 - 金色
  }

  const renderCatImage = () => {
    return (
      <div className="cat-card-image">
        <CatRenderer
          parent={`card-${cat.id || cat.catId}`}
          gene={cat.genes}
        />
      </div>
    )
  }

  const renderCatInfo = () => (
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
      {renderCatImage()}

      {/* 猫咪信息 */}
      <div className="cat-card-info">
        <div className="cat-info-row">
          <span className="cat-id-text">猫咪 #{cat.id || cat.catId}</span>
          <Tag
            size="small"
            style={{
              backgroundColor: QUALITY_COLORS[cat.quality] || QUALITY_COLORS[0],
              color: 'white',
              border: 'none'
            }}
          >
            {QUALITY_NAMES[cat.quality] || '普通'}
          </Tag>
        </div>

        {/* 价格信息 */}
        {showPrice && cat.price && (
          <div className="cat-price-info">
            <span className="price-label"></span>
            <span className="price-value">{cat.price}</span>
          </div>
        )}

        {/* 卖家信息 */}
        {showSeller && cat.seller && (
          <div className="cat-seller-info">
            <span className="seller-label">卖家:</span>
            <span className="seller-value">{cat.seller}</span>
          </div>
        )}

        {/* 猫咪属性简要显示 */}
        {(showDetails || showAttributes) && (
          <CatAttributesBrief cat={cat} showPower={true} showTopStats={true} />
        )}
      </div>
    </div>
  )

  // 市场模式的渲染函数
  const renderMarketMode = () => {

     
    // 解密猫咪属性
    const stats = decryptCatStats(cat.encrypted_stats, cat.encrypted_stats_high, cat.id);

    return (
      <div className="cat-card-content market-mode">
        {/* 左上角等级 */}
        <div className="cat-level-badge">
          LV {cat.level}
        </div>

        {/* 右上角性别图标 */}
        <div className={`cat-gender-badge ${cat.gender === 0 ? 'male' : 'female'}`}>
          {cat.gender === 0 ? '♂' : '♀'}
        </div>

        {/* 猫咪SVG图像 */}
        {renderCatImage()}

        {/* 猫咪信息 */}
        <div className="cat-card-info">
          {/* 6个属性显示 - 使用图标一行显示 */}
          <div className="market-attributes">
            <div className="attributes-row">
              <div className="attr-icon-item">
                <FireOutlined style={{ color: '#f5222d', fontSize: '12px' }} />
                <span className="attr-value">{stats?.attack || 0}</span>
              </div>
              <div className="attr-icon-item">
                <SafetyOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                <span className="attr-value">{stats?.defense || 0}</span>
              </div>
              <div className="attr-icon-item">
                <HeartOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                <span className="attr-value">{stats?.health || 0}</span>
              </div>
              <div className="attr-icon-item">
                <ThunderboltOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                <span className="attr-value">{stats?.critical || 0}</span>
              </div>
              <div className="attr-icon-item">
                <EyeOutlined style={{ color: '#722ed1', fontSize: '12px' }} />
                <span className="attr-value">{stats?.dodge || 0}</span>
              </div>
              <div className="attr-icon-item">
                <StarOutlined style={{ color: '#eb2f96', fontSize: '12px' }} />
                <span className="attr-value">{stats?.luck || 0}</span>
              </div>
            </div>
          </div>

          {/* 猫咪信息 - 使用与"我的出售"一致的样式 */}
          <div className="cat-card-info">
            <div className="cat-info-row">
              <span className="cat-id-text">猫咪 #{cat.id || cat.catId}</span>
              <Tag
                size="small"
                style={{
                  backgroundColor: QUALITY_COLORS[cat.quality] || QUALITY_COLORS[0],
                  color: 'white',
                  border: 'none'
                }}
              >
                {QUALITY_NAMES[cat.quality] || '普通'}
              </Tag>
            </div>
          </div>


        </div>
      </div>
    )
  }

  if (isMarketMode) {
    return (
      <div className="cat-card-wrapper">
        <Card
          className={`cat-card cat-card-market`}
          hoverable
          size="small"
          styles={{
            body: { padding: '12px' }
          }}
          style={{
            border: `2px solid ${QUALITY_COLORS[cat.quality] || QUALITY_COLORS[0]}`,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            marginBottom: '4px',
            width: '100%'
          }}
        >
          {renderMarketMode()}
        </Card>
        <Button
          type="primary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onBuy && onBuy(cat);
          }}
          className="market-buy-button"
        >
          {cat.price ? `${parseFloat(cat.price).toFixed(2)} DFS 购买` : '价格未知'}
        </Button>
      </div>
    )
  }

  return (
    <Card
      className={`cat-card ${showDetails ? 'cat-card-detailed' : 'cat-card-simple'}`}
      hoverable
      onClick={onClick}
      size="small"
      styles={{
        body: { padding: '12px' }
      }}
      style={{
        border: `2px solid ${QUALITY_COLORS[cat.quality] || QUALITY_COLORS[0]}`,
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {renderCatInfo()}
    </Card>
  )
}

export default CatCard
