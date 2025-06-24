import React from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Tooltip,
  Avatar,
  Statistic,
  Divider,
  Progress
} from 'antd';
import {
  TrophyOutlined,
  ThunderboltOutlined,
  UserOutlined,
  FireOutlined,
  SafetyOutlined,
  DeleteOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { QUALITY_NAMES, GENDER_NAMES } from '../utils/chainOperations';

const ArenaCard = ({ 
  arena, 
  isOwner, 
  onChallenge, 
  onRemove, 
  userCats 
}) => {
  // 获取战斗力等级颜色
  const getPowerRankColor = (rank) => {
    const colors = {
      'Weak': '#d9d9d9',
      'Normal': '#52c41a',
      'Strong': '#1890ff',
      'Elite': '#722ed1',
      'Master': '#eb2f96',
      'Legendary': '#fa8c16',
      'Mythical': '#f5222d'
    };
    return colors[rank] || '#d9d9d9';
  };

  // 获取品质颜色
  const getQualityColor = (quality) => {
    const colors = ['#d9d9d9', '#52c41a', '#1890ff', '#722ed1', '#eb2f96', '#fa8c16', '#f5222d', '#fa541c'];
    return colors[quality] || '#d9d9d9';
  };

  // 计算胜率
  const getWinRate = () => {
    const total = arena.wins + arena.losses;
    if (total === 0) return 0;
    return Math.round((arena.wins / total) * 100);
  };

  // 解析价格
  const parsePrice = (priceStr) => {
    return parseFloat(priceStr.split(' ')[0] || 0);
  };

  const totalPool = parsePrice(arena.total_pool);
  const betAmount = parsePrice(arena.bet_amount);
  const winRate = getWinRate();

  // 检查用户是否有可用的猫咪挑战
  const hasAvailableCats = userCats.some(cat => 
    !cat.in_arena && 
    cat.stamina >= 20 && 
    cat.owner === userCats[0]?.owner
  );

  return (
    <Card
      className="arena-card"
      hoverable
      cover={
        arena.cat ? (
          <div className="arena-cat-cover">
            <img
              src={`/images/cat_${arena.cat.genes}.png`}
              alt={`Cat #${arena.cat.id}`}
              style={{ width: '100%', height: 200, objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = '/images/logo.png';
              }}
            />
            <div className="arena-cat-overlay">
              <Tag 
                color={getQualityColor(arena.cat.quality)}
                style={{ margin: 4 }}
              >
                {QUALITY_NAMES[arena.cat.quality]}
              </Tag>
              <Tag 
                color={getPowerRankColor(arena.powerRank)}
                style={{ margin: 4 }}
              >
                {arena.powerRank}
              </Tag>
            </div>
          </div>
        ) : (
          <div 
            style={{ 
              height: 200, 
              background: 'linear-gradient(45deg, #f0f0f0, #e0e0e0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SafetyOutlined style={{ fontSize: 48, color: '#ccc' }} />
          </div>
        )
      }
      actions={
        isOwner ? [
          <Tooltip title="移除擂台">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={onRemove}
            >
              移除
            </Button>
          </Tooltip>
        ] : [
          <Tooltip title={hasAvailableCats ? "挑战这个擂台" : "没有可用的猫咪"}>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={onChallenge}
              disabled={!hasAvailableCats}
            >
              挑战
            </Button>
          </Tooltip>
        ]
      }
    >
      <Card.Meta
        avatar={
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: isOwner ? '#52c41a' : '#1890ff' }}
          />
        }
        title={
          <Space>
            <span>擂台 #{arena.id}</span>
            {isOwner && <Tag color="green">我的</Tag>}
          </Space>
        }
        description={
          <Tooltip title={arena.owner}>
            <span style={{ color: '#666' }}>
              主人: {arena.owner.length > 10 ? 
                `${arena.owner.substring(0, 8)}...` : 
                arena.owner
              }
            </span>
          </Tooltip>
        }
      />

      <Divider style={{ margin: '12px 0' }} />

      <div className="arena-stats">
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Statistic
              title="奖池"
              value={totalPool}
              suffix="DFS"
              precision={2}
              valueStyle={{ fontSize: 16, color: '#f5222d' }}
            />
            <Statistic
              title="挑战费"
              value={betAmount}
              suffix="DFS"
              precision={2}
              valueStyle={{ fontSize: 16, color: '#1890ff' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#666' }}>胜率</span>
              <span style={{ fontSize: 12, color: '#666' }}>
                {arena.wins}胜 {arena.losses}负
              </span>
            </div>
            <Progress 
              percent={winRate} 
              size="small"
              strokeColor={{
                '0%': '#52c41a',
                '100%': '#f5222d',
              }}
              format={(percent) => `${percent}%`}
            />
          </div>

          {arena.cat && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              <Space split={<span>•</span>}>
                <span>等级 {arena.cat.level}</span>
                <span>{GENDER_NAMES[arena.cat.gender]}</span>
                <span>体力 {arena.cat.stamina}/100</span>
              </Space>
            </div>
          )}

          <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            创建于 {new Date(arena.created_at + 'Z').toLocaleDateString()}
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default ArenaCard;
