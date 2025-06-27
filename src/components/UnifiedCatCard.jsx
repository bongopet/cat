import React from 'react'
import { Card, Tag, Button } from 'antd'
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
import './UnifiedCatCard.css'

function UnifiedCatCard({
  cat,
  onClick,
  showPrice = false,
  showSeller = false,
  isMarketMode = false,
  onBuy,
  isSelected = false,
  isOwnCat = false,  // 是否是自己的猫咪
  actionButton = null  // 外部操作按钮（如上架/下架）
}) {
  if (!cat) return null

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
  }

  // 解密猫咪属性
  const stats = decryptCatStats(cat.encrypted_stats, cat.encrypted_stats_high, cat.id || cat.catId);

  const renderCatImage = () => {
    return (
      <div className="unified-cat-image">
        <CatRenderer
          parent={`unified-${cat.id || cat.catId}`}
          gene={cat.genes}
        />
      </div>
    )
  }

  const renderCardContent = () => {
    return (
      <div className="unified-cat-content">
        {/* 左上角等级 */}
        <div className="unified-level-badge">
          LV {cat.level}
        </div>

        {/* 右上角性别图标 */}
        <div className={`unified-gender-badge ${cat.gender === 0 ? 'male' : 'female'}`}>
          {cat.gender === 0 ? '♂' : '♀'}
        </div>

        {/* 猫咪SVG图像 */}
        {renderCatImage()}

        {/* 猫咪信息 */}
        <div className="unified-cat-info">
          {/* 6个属性显示 - 使用图标一行显示 */}
          <div className="unified-attributes">
            <div className="unified-attributes-row">
              <div className="unified-attr-item">
                <FireOutlined style={{ color: '#f5222d', fontSize: '12px' }} />
                <span className="unified-attr-value">{stats?.attack || 0}</span>
              </div>
              <div className="unified-attr-item">
                <SafetyOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                <span className="unified-attr-value">{stats?.defense || 0}</span>
              </div>
              <div className="unified-attr-item">
                <HeartOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                <span className="unified-attr-value">{stats?.health || 0}</span>
              </div>
              <div className="unified-attr-item">
                <ThunderboltOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                <span className="unified-attr-value">{stats?.critical || 0}</span>
              </div>
              <div className="unified-attr-item">
                <EyeOutlined style={{ color: '#722ed1', fontSize: '12px' }} />
                <span className="unified-attr-value">{stats?.dodge || 0}</span>
              </div>
              <div className="unified-attr-item">
                <StarOutlined style={{ color: '#eb2f96', fontSize: '12px' }} />
                <span className="unified-attr-value">{stats?.luck || 0}</span>
              </div>
            </div>
          </div>

          {/* ID和品质行 - 截图样式 */}
          <div className="unified-info-row-styled">
            <div className="unified-cat-id-container">
              <span className="unified-cat-id-styled">猫咪 #{cat.id || cat.catId}</span>
            </div>
            <div className="unified-quality-container">
              <Tag
                size="small"
                className="unified-quality-tag"
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

          {/* 卖家信息 */}
          {showSeller && cat.seller && (
            <div className="unified-seller-info">
              <span className="unified-seller-label">卖家:</span>
              <span className="unified-seller-value">{cat.seller}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 市场模式：卡片 + 购买按钮
  if (isMarketMode) {
    return (
      <div className="unified-card-wrapper">
        <Card
          className={`unified-cat-card unified-market-card`}
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
          {renderCardContent()}
        </Card>
        <Button
          type={isOwnCat ? "default" : "primary"}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            if (!isOwnCat && onBuy) {
              onBuy(cat);
            }
          }}
          disabled={isOwnCat}
          className={`unified-buy-button ${isOwnCat ? 'own-cat-button' : ''}`}
        >
          {isOwnCat
            ? '我的猫咪'
            : cat.price
              ? `${parseFloat(cat.price).toFixed(2)} DFS 购买`
              : '价格未知'
          }
        </Button>
      </div>
    )
  }

  // 普通模式：只有卡片
  return (
    <div className="unified-card-wrapper">
      <Card
        className={`unified-cat-card ${isSelected ? 'unified-card-selected' : ''}`}
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
          cursor: onClick ? 'pointer' : 'default',
          marginBottom: actionButton ? '4px' : '0'
        }}
      >
        {renderCardContent()}
      </Card>
      {/* 外部操作按钮 */}
      {actionButton}
    </div>
  )
}

export default UnifiedCatCard
