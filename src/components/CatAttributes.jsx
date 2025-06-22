import React from 'react';
import { Card, Row, Col, Progress, Tag, Space, Tooltip } from 'antd';
import {
  ThunderboltOutlined,
  SafetyOutlined,
  HeartOutlined,
  FireOutlined,
  EyeOutlined,
  StarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import {
  decryptCatStats,
  calculateTotalBattlePower,
  getAttributeRank,
  getAttributeColor
} from '../utils/chainOperations';
import './CatAttributes.css';

const CatAttributes = ({ cat, showTitle = true }) => {
  if (!cat) {
    return (
      <Card title={showTitle ? "猫咪属性" : null} size="small">
        <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
          请选择一只猫咪查看属性
        </div>
      </Card>
    );
  }

  // 如果没有加密属性数据，使用模拟数据进行演示
  if (!cat.encrypted_stats) {
    console.log('没有加密属性数据，使用模拟数据演示');
    // 基于猫咪ID和等级生成模拟属性
    const mockStats = {
      attack: Math.floor(Math.random() * 200) + cat.level * 10,
      defense: Math.floor(Math.random() * 200) + cat.level * 8,
      health: Math.floor(Math.random() * 500) + cat.level * 20,
      critical: Math.floor(Math.random() * 100) + cat.level * 3,
      dodge: Math.floor(Math.random() * 100) + cat.level * 3,
      luck: Math.floor(Math.random() * 100) + cat.level * 2
    };

    const mockTotalPower = calculateTotalBattlePower(mockStats, cat.level);

    return renderAttributesDisplay(mockStats, mockTotalPower, showTitle, true);
  }

  // 解密猫咪属性
  const stats = decryptCatStats(cat.encrypted_stats, cat.id);
  const totalPower = calculateTotalBattlePower(stats, cat.level);

  return renderAttributesDisplay(stats, totalPower, showTitle, false);
};

// 渲染属性显示的通用函数
const renderAttributesDisplay = (stats, totalPower, showTitle, isMockData) => {
  // 属性配置
  const attributes = [
    {
      key: 'attack',
      name: '攻击',
      value: stats.attack,
      icon: <FireOutlined />,
      color: '#f5222d',
      maxValue: 1023, // 10位最大值
      description: '影响造成的伤害'
    },
    {
      key: 'defense',
      name: '防御',
      value: stats.defense,
      icon: <SafetyOutlined />,
      color: '#1890ff',
      maxValue: 1023, // 10位最大值
      description: '减少受到的伤害'
    },
    {
      key: 'health',
      name: '血量',
      value: stats.health,
      icon: <HeartOutlined />,
      color: '#52c41a',
      maxValue: 4095, // 12位最大值
      description: '生命值上限'
    },
    {
      key: 'critical',
      name: '暴击',
      value: stats.critical,
      icon: <ThunderboltOutlined />,
      color: '#faad14',
      maxValue: 255, // 8位最大值
      description: '暴击几率和伤害'
    },
    {
      key: 'dodge',
      name: '闪避',
      value: stats.dodge,
      icon: <EyeOutlined />,
      color: '#722ed1',
      maxValue: 255, // 8位最大值
      description: '躲避攻击的几率'
    },
    {
      key: 'luck',
      name: '幸运',
      value: stats.luck,
      icon: <StarOutlined />,
      color: '#eb2f96',
      maxValue: 255, // 8位最大值
      description: '影响各种随机事件'
    }
  ];

  // 渲染单个属性
  const renderAttribute = (attr) => {
    const rank = getAttributeRank(attr.value, attr.key);
    const rankColor = getAttributeColor(rank);
    const percentage = Math.round((attr.value / attr.maxValue) * 100);

    return (
      <Col xs={24} sm={12} md={8} key={attr.key}>
        <div className="cat-attribute-item">
          <div className="attribute-header">
            <Space>
              <span className="attribute-icon" style={{ color: attr.color }}>
                {attr.icon}
              </span>
              <span className="attribute-name">{attr.name}</span>
              <Tag 
                color={rankColor} 
                style={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  minWidth: '24px',
                  textAlign: 'center'
                }}
              >
                {rank}
              </Tag>
            </Space>
          </div>
          
          <div className="attribute-value">
            <span className="value-number">{attr.value}</span>
            <span className="value-max">/{attr.maxValue}</span>
          </div>
          
          <Tooltip title={attr.description}>
            <Progress
              percent={percentage}
              strokeColor={attr.color}
              trailColor="#f0f0f0"
              size="small"
              showInfo={false}
              className="attribute-progress"
            />
          </Tooltip>
        </div>
      </Col>
    );
  };

  return (
    <Card
      title={showTitle ? (
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          猫咪属性 {isMockData && <Tag color="orange" size="small">演示数据</Tag>}
        </Space>
      ) : null}
      size="small"
      className="cat-attributes-card"
    >
      {/* 总战斗力显示 */}
      <div className="total-power-section">
        <div className="total-power-header">
          <Space>
            <TrophyOutlined style={{ color: '#faad14', fontSize: '16px' }} />
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>总战斗力</span>
          </Space>
        </div>
        <div className="total-power-value">
          <span style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#faad14',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            {totalPower.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 属性详情 */}
      <div className="attributes-section">
        <Row gutter={[12, 16]}>
          {attributes.map(renderAttribute)}
        </Row>
      </div>

      {/* 属性说明 */}
      <div className="attributes-legend">
        <div style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
          <Space wrap>
            <span>等级:</span>
            <Tag size="small" color="#d9d9d9">F</Tag>
            <Tag size="small" color="#52c41a">E</Tag>
            <Tag size="small" color="#1890ff">D</Tag>
            <Tag size="small" color="#722ed1">C</Tag>
            <Tag size="small" color="#eb2f96">B</Tag>
            <Tag size="small" color="#fa8c16">A</Tag>
            <Tag size="small" color="#f5222d">S</Tag>
            <Tag size="small" color="#fadb14">SS</Tag>
          </Space>
        </div>
      </div>

      {isMockData && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: '#fff7e6',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#d46b08'
        }}>
          💡 这是基于猫咪等级生成的演示数据。真实属性需要合约中的加密数据。
        </div>
      )}
    </Card>
  );
};

export default CatAttributes;
