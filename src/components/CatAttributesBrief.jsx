import React from 'react';
import { Space, Tag, Tooltip } from 'antd';
import {
  FireOutlined,
  SafetyOutlined,
  HeartOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import {
  decryptCatStats,
  calculateTotalBattlePower,
  getAttributeRank,
  getAttributeColor
} from '../utils/chainOperations';

const CatAttributesBrief = ({ cat, showPower = true, showTopStats = true }) => {
  if (!cat || !cat.encrypted_stats) {
    return null;
  }

  // 解密猫咪属性
  const stats = decryptCatStats(cat.encrypted_stats, cat.id);
  const totalPower = calculateTotalBattlePower(stats, cat.level);

  // 获取最高的3个属性
  const topStats = [
    { name: '攻击', value: stats.attack, type: 'attack', icon: <FireOutlined /> },
    { name: '防御', value: stats.defense, type: 'defense', icon: <SafetyOutlined /> },
    { name: '血量', value: stats.health, type: 'health', icon: <HeartOutlined /> }
  ].sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <div style={{ fontSize: '11px', marginTop: '4px' }}>
      {showPower && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: showTopStats ? '6px' : '0',
          padding: '2px 6px',
          background: 'linear-gradient(45deg, #ffd89b, #19547b)',
          borderRadius: '4px',
          color: 'white'
        }}>
          <Space size={2}>
            <TrophyOutlined style={{ fontSize: '10px' }} />
            <span style={{ fontWeight: 'bold', fontSize: '10px' }}>
              {totalPower.toLocaleString()}
            </span>
          </Space>
        </div>
      )}
      
      {showTopStats && (
        <Space size={2} wrap>
          {topStats.map((stat, index) => {
            const rank = getAttributeRank(stat.value, stat.type);
            const color = getAttributeColor(rank);
            
            return (
              <Tooltip 
                key={stat.name}
                title={`${stat.name}: ${stat.value} (${rank}级)`}
                placement="top"
              >
                <Tag
                  size="small"
                  style={{
                    fontSize: '9px',
                    padding: '1px 3px',
                    margin: '1px',
                    backgroundColor: color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    lineHeight: '12px',
                    minWidth: '16px',
                    textAlign: 'center'
                  }}
                >
                  {rank}
                </Tag>
              </Tooltip>
            );
          })}
        </Space>
      )}
    </div>
  );
};

export default CatAttributesBrief;
