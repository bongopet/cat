import React, { useState, useEffect } from 'react';
import { Card, Spin, message, Row, Col, Statistic, Progress, Table, Tag, Button } from 'antd';
import { PieChartOutlined, BarChartOutlined, TrophyOutlined, StarOutlined, ReloadOutlined } from '@ant-design/icons';
import { getCatStats, QUALITY_NAMES, TARGET_PERCENTAGES } from '../utils/chainOperations';
import './CatStats.css';

const CatStats = ({ DFSWallet }) => {
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // 品质颜色映射 - 扩展到8个品质
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

  // 获取统计数据
  const fetchStats = async () => {
    if (!DFSWallet) {
      console.log('DFS钱包未连接');
      return;
    }

    try {
      setLoading(true);
      console.log('开始获取猫咪统计数据...');
      const stats = await getCatStats(DFSWallet);
      console.log('获取到的统计数据:', stats);
      setStatsData(stats);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败: ' + (error.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [DFSWallet]);

  // 计算总数
  const getTotalCats = () => {
    if (!statsData || !statsData.quality_stats) return 0;
    return statsData.quality_stats.reduce((total, stat) => total + stat.count, 0);
  };

  // 准备表格数据
  const getTableData = () => {
    if (!statsData || !statsData.quality_stats) return [];

    return statsData.quality_stats.map((stat, index) => ({
      key: index,
      quality: stat.quality,
      qualityName: QUALITY_NAMES[stat.quality] || '未知',
      count: stat.count,
      actualPercentage: stat.actual_percentage ? stat.actual_percentage.toFixed(2) : '0.00',
      targetPercentage: stat.target_percentage ? stat.target_percentage.toFixed(2) : '0.00',
      // 计算与目标的差异
      deviation: stat.actual_percentage && stat.target_percentage ?
        (stat.actual_percentage - stat.target_percentage).toFixed(2) : '0.00'
    }));
  };

  // 表格列定义
  const columns = [
    {
      title: '品质',
      dataIndex: 'qualityName',
      key: 'quality',
      render: (text, record) => (
        <Tag color={QUALITY_COLORS[record.quality]} style={{ fontWeight: 'bold' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      render: (count) => (
        <Statistic
          value={count}
          valueStyle={{ fontSize: '16px' }}
        />
      ),
    },
    {
      title: '实际占比',
      dataIndex: 'actualPercentage',
      key: 'actualPercentage',
      render: (percentage, record) => (
        <div style={{ width: '100%' }}>
          <Progress
            percent={parseFloat(percentage)}
            strokeColor={QUALITY_COLORS[record.quality]}
            format={() => `${percentage}%`}
            size="small"
          />
        </div>
      ),
    },
    {
      title: '目标概率',
      dataIndex: 'targetPercentage',
      key: 'targetPercentage',
      render: (percentage) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {percentage}%
        </span>
      ),
    },
    {
      title: '偏差',
      dataIndex: 'deviation',
      key: 'deviation',
      render: (deviation) => {
        const value = parseFloat(deviation);
        const color = value > 0 ? '#52c41a' : value < 0 ? '#f5222d' : '#8c8c8c';
        const prefix = value > 0 ? '+' : '';
        return (
          <span style={{ fontWeight: 'bold', color }}>
            {prefix}{deviation}%
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="cat-stats-loading">
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>正在加载统计数据...</p>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="cat-stats-empty">
        <div className="empty-icon">📊</div>
        <h3>暂无统计数据</h3>
        <p>请稍后再试或联系管理员</p>
      </div>
    );
  }

  const totalCats = getTotalCats();
  const tableData = getTableData();

  return (
    <div className="cat-stats">
      <div className="stats-header">
        <div className="stats-title-section">
          <h2>
            <PieChartOutlined style={{ marginRight: 8 }} />
            猫咪品质统计
          </h2>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchStats}
            loading={loading}
            style={{ marginLeft: 16 }}
          >
            刷新数据
          </Button>
        </div>
        <p>查看全服猫咪品质分布情况</p>
      </div>

      {/* 总览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总猫咪数量"
              value={totalCats}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="品质种类"
              value={tableData.length}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最稀有品质"
              value={tableData.length > 0 ?
                QUALITY_NAMES[tableData.filter(d => d.count > 0).reduce((prev, current) =>
                  prev.quality > current.quality ? prev : current, { quality: 0 }
                ).quality] : '-'}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最大偏差品质"
              value={tableData.length > 0 ?
                QUALITY_NAMES[tableData.reduce((prev, current) =>
                  Math.abs(parseFloat(prev.deviation)) > Math.abs(parseFloat(current.deviation)) ? prev : current
                ).quality] : '-'}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细统计表格 */}
      <Card 
        title={
          <span>
            <BarChartOutlined style={{ marginRight: 8 }} />
            品质分布详情
          </span>
        }
        className="stats-table-card"
      >
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          size="middle"
          className="stats-table"
        />
      </Card>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <Card title="调试信息" size="small" style={{ marginTop: 16, fontSize: '12px' }}>
          <pre>{JSON.stringify(statsData, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
};

export default CatStats;
