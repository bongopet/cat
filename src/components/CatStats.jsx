import React, { useState, useEffect } from 'react';
import { Card, Spin, message, Row, Col, Statistic, Progress, Table, Tag, Button } from 'antd';
import { PieChartOutlined, BarChartOutlined, TrophyOutlined, StarOutlined, ReloadOutlined } from '@ant-design/icons';
import { getCatStats, getAllCats, QUALITY_NAMES, TARGET_PERCENTAGES } from '../utils/chainOperations';
import './CatStats.css';

const CatStats = ({ DFSWallet }) => {
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [actualCatsData, setActualCatsData] = useState(null);

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

      // 同时获取统计数据和实际猫咪数据
      const [stats, actualCats] = await Promise.all([
        getCatStats(DFSWallet),
        getAllCats(DFSWallet, 1000) // 获取更多猫咪数据
      ]);

      console.log('获取到的统计数据:', stats);
      console.log('获取到的实际猫咪数据:', actualCats);

      setStatsData(stats);

      // 计算实际猫咪的品质分布
      if (actualCats && Array.isArray(actualCats)) {
        const actualQualityStats = {};
        actualCats.forEach(cat => {
          const quality = cat.quality || 0;
          actualQualityStats[quality] = (actualQualityStats[quality] || 0) + 1;
        });

        // 转换为数组格式
        const actualStatsArray = [];
        for (let i = 0; i < 8; i++) {
          actualStatsArray.push({
            quality: i,
            count: actualQualityStats[i] || 0,
            percentage: actualCats.length > 0 ?
              ((actualQualityStats[i] || 0) / actualCats.length * 100) : 0
          });
        }

        setActualCatsData({
          quality_stats: actualStatsArray,
          total_cats: actualCats.length
        });
      }
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

    return statsData.quality_stats.map((stat, index) => {
      // 查找对应的实际猫咪数据
      const actualStat = actualCatsData?.quality_stats?.find(actual => actual.quality === stat.quality);

      return {
        key: index,
        quality: stat.quality,
        qualityName: QUALITY_NAMES[stat.quality] || '未知',
        count: stat.count, // 统计表中的数量
        actualCount: actualStat?.count || 0, // 实际猫咪数量
        actualPercentage: stat.actual_percentage ? stat.actual_percentage.toFixed(2) : '0.00',
        realActualPercentage: actualStat?.percentage ? actualStat.percentage.toFixed(2) : '0.00', // 实际百分比
        targetPercentage: stat.target_percentage ? stat.target_percentage.toFixed(2) : '0.00',
        // 计算与目标的差异
        deviation: stat.actual_percentage && stat.target_percentage ?
          (stat.actual_percentage - stat.target_percentage).toFixed(2) : '0.00'
      };
    });
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
      title: '统计数量',
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
      title: '实际数量',
      dataIndex: 'actualCount',
      key: 'actualCount',
      render: (count, record) => (
        <div style={{ textAlign: 'center' }}>
          <Statistic
            value={count}
            valueStyle={{
              fontSize: '16px',
              color: count !== record.count ? '#f5222d' : '#52c41a'
            }}
          />
          {count !== record.count && (
            <div style={{ fontSize: '12px', color: '#f5222d' }}>
              差异: {count - record.count}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '统计占比',
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
      title: '实际占比',
      dataIndex: 'realActualPercentage',
      key: 'realActualPercentage',
      render: (percentage, record) => (
        <div style={{ width: '100%' }}>
          <Progress
            percent={parseFloat(percentage)}
            strokeColor={QUALITY_COLORS[record.quality]}
            format={() => `${percentage}%`}
            size="small"
            strokeLinecap="round"
            trailColor="#f0f0f0"
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
        <h2>
          <PieChartOutlined style={{ marginRight: 8 }} />
          猫咪品质统计
        </h2>
        <p>查看全服猫咪品质分布情况</p>
      </div>

      {/* 详细统计表格 */}
      <Card
        title={
          <div className="table-header">
            <span>
              <BarChartOutlined style={{ marginRight: 8 }} />
              品质分布详情
            </span>
            <div className="table-controls">
              <div className="total-cats-display">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div>
                    <span className="total-label">统计总量：</span>
                    <span className="total-value">{totalCats}</span>
                    <span className="total-unit">只</span>
                  </div>
                  {actualCatsData && (
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      <span className="total-label">实际总量：</span>
                      <span
                        className="total-value"
                        style={{
                          color: actualCatsData.total_cats !== totalCats ? '#f5222d' : '#52c41a'
                        }}
                      >
                        {actualCatsData.total_cats}
                      </span>
                      <span className="total-unit">只</span>
                      {actualCatsData.total_cats !== totalCats && (
                        <span style={{ color: '#f5222d', marginLeft: '8px' }}>
                          (差异: {actualCatsData.total_cats - totalCats})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchStats}
                loading={loading}
                style={{ marginLeft: 12 }}
              >
                刷新数据
              </Button>
            </div>
          </div>
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
