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
  userCats,
  showChallengeButton = true // 默认显示挑战按钮
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
    console.log('Rank:', rank, 'Color:', colors[rank] || '#d9d9d9');
    return colors[rank] || '#d9d9d9';
  };

  // 品质颜色映射 - 与统计页面保持一致
  const QUALITY_COLORS = {
    0: '#8c8c8c',  // 普通 - 灰色
    1: '#52c41a',  // 精良 - 绿色
    2: '#1890ff',  // 卓越 - 蓝色
    3: '#722ed1',  // 非凡 - 紫色
    4: '#f5222d',  // 至尊 - 红色
    5: '#fa8c16',  // 神圣 - 橙色
    6: '#eb2f96',  // 永恒 - 粉色
    7: '#fadb14'   // 传世 - 金色
  };

  // 获取品质颜色
  const getQualityColor = (quality) => {
    return QUALITY_COLORS[quality] || QUALITY_COLORS[0];
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
        ] : showChallengeButton ? [
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
        ] : []
      }
    >
      <Card.Meta
        avatar={
          <Avatar
            style={{
              backgroundColor: isOwner ? '#52c41a' : '#1890ff',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            #{arena.id}
          </Avatar>
        }
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="small">
              <span>擂台</span>
              {isOwner && <Tag color="green" size="small">我的</Tag>}
            </Space>
            {arena.cat && (
              <Space size={4}>
                <Tag
                  color={getQualityColor(arena.cat.quality)}
                  size="small"
                  style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}
                >
                  {QUALITY_NAMES[arena.cat.quality]}
                </Tag>
                <Tag
                  color={getPowerRankColor(arena.powerRank)}
                  size="small"
                  style={{ fontSize: '10px', padding: '0 4px', margin: 0 }}
                >
                  {arena.powerRank}
                </Tag>
              </Space>
            )}
          </div>
        }
        description={
          <Tooltip title={arena.owner}>
            <span style={{ color: '#666', fontSize: '12px' }}>
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
              valueStyle={{ fontSize: 14, color: '#f5222d' }}
            />
            <Statistic
              title="挑战费"
              value={betAmount}
              suffix="DFS"
              precision={2}
              valueStyle={{ fontSize: 14, color: '#1890ff' }}
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
            <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
              <Space split={<span>•</span>} size="small">
                <span>等级 {arena.cat.level}</span>
                <span>{GENDER_NAMES[arena.cat.gender]}</span>
                <span>体力 {arena.cat.stamina}/100</span>
              </Space>
            </div>
          )}

          <div style={{ fontSize: 10, color: '#ccc', marginTop: 4 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            创建于 {new Date(arena.created_at + 'Z').toLocaleDateString()}
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default ArenaCard;
