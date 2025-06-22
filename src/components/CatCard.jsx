import React from 'react'
import { Card, Tag, Space } from 'antd'
import { QUALITY_NAMES } from '../utils/chainOperations'
import CatRenderer from './CatRenderer'
import CatAttributesBrief from './CatAttributesBrief'
import './CatCard.css'

function CatCard({ cat, showDetails = false, onClick, showPrice = false, showSeller = false }) {
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
            {cat.qualityName || QUALITY_NAMES[cat.quality] || '普通'}
          </Tag>
        </div>

        {/* 价格信息 */}
        {showPrice && cat.price && (
          <div className="cat-price-info">
            <span className="price-label">价格:</span>
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
        {showDetails && (
          <CatAttributesBrief cat={cat} showPower={true} showTopStats={true} />
        )}
      </div>
    </div>
  )

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
