import { useState, useEffect } from 'react';
import { Card, Spin, message, Table, Tag, Button, Space } from 'antd';
import { BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { getCatStats, QUALITY_NAMES, getCats } from '../utils/chainOperations';
import './CatStats.css';

// 品质映射配置
const qualityConfig = {
  0: { name: '普通', color: '#8c8c8c' },
  1: { name: '精良', color: '#52c41a' },
  2: { name: '卓越', color: '#1890ff' },
  3: { name: '非凡', color: '#722ed1' },
  4: { name: '至尊', color: '#f5222d' },
  5: { name: '神圣', color: '#fa8c16' },
  6: { name: '永恒', color: '#eb2f96' },
  7: { name: '传世', color: '#fadb14' }
};

// 目标概率配置 (基于合约中的BASE_PROBABILITIES)
const targetProbabilities = {
  0: 60.0,   // 普通 60%
  1: 20.0,   // 精良 20%
  2: 10.0,   // 卓越 10%
  3: 5.0,    // 非凡 5%
  4: 3.0,    // 至尊 3%
  5: 1.0,    // 神圣 1%
  6: 0.7,    // 永恒 0.7%
  7: 0.3     // 传世 0.3%
};

const CatStats = ({ DFSWallet }) => {
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [actualCatsData, setActualCatsData] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 获取统计数据
  const fetchStats = async () => {
    if (!DFSWallet) {
      console.log('DFS钱包未连接');
      return;
    }

    try {
      setLoading(true);
      
      // 获取统计数据
      const stats = await getCatStats(DFSWallet);
      console.log('统计数据:', stats);
      setStatsData(stats);

      // 获取实际猫咪数据
      const actualCats = await getCats(1000);
      console.log('实际猫咪数据:', actualCats);
      setActualCatsData(actualCats);

      // 设置分页总数
      setPagination(prev => ({
        ...prev,
        total: stats?.quality_stats?.length || 0,
      }));

    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchStats();
  }, [DFSWallet]);

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // 处理刷新按钮点击
  const handleRefresh = () => {
    fetchStats();
  };

  // 准备表格数据
  const tableData = [];
  if (statsData?.quality_stats) {
    for (let quality = 0; quality <= 7; quality++) {
      const qualityData = statsData.quality_stats.find(item => item.quality === quality);
      const actualCount = actualCatsData ? 
        actualCatsData.filter(cat => (cat.quality || 0) === quality).length : 0;
      
      tableData.push({
        key: quality,
        quality,
        name: QUALITY_NAMES[quality] || '未知',
        count: qualityData?.count || 0,
        actualCount,
        percentage: statsData.total_cats > 0 ?
          ((qualityData?.count || 0) / statsData.total_cats * 100).toFixed(2) : '0.00',
        targetPercentage: targetProbabilities[quality].toFixed(1)
      });
    }
  }

  // 计算总数
  const totalCats = statsData?.total_cats || 0;
  const actualTotalCats = actualCatsData?.length || 0;

  // 定义表格列
  const columns = [
    {
      title: '品质',
      dataIndex: 'name',
      key: 'name',
      width: 50,
      render: (name, record) => {
        const config = qualityConfig[record.quality] || qualityConfig[0];
        return (
          <Tag
            color={config.color}
            style={{
              color: '#fff',
              fontWeight: 'bold',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '16px'
            }}
          >
            {name}
          </Tag>
        );
      },
    },
    {
      title: '统计',
      dataIndex: 'count',
      key: 'count',
      width: 55,
      align: 'center',
      sorter: (a, b) => a.count - b.count,
      sortDirections: ['descend', 'ascend'],
      defaultSortOrder: 'descend',
      render: (count) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {count}
        </span>
      ),
    },
    {
      title: '实际',
      dataIndex: 'actualCount',
      key: 'actualCount',
      width: 80,
      align: 'center',
      render: (actualCount, record) => (
        <span style={{ 
          fontWeight: 'bold', 
          color: actualCount !== record.count ? '#f5222d' : '#52c41a' 
        }}>
          {actualCount}
          {actualCount !== record.count && (
            <div style={{ fontSize: '10px', color: '#f5222d' }}>
              差异: {actualCount - record.count}
            </div>
          )}
        </span>
      ),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 80,
      align: 'center',
      render: (percentage) => (
        <span style={{ color: '#722ed1', fontWeight: '500' }}>
          {percentage}%
        </span>
      ),
    },
    {
      title: '概率',
      dataIndex: 'targetPercentage',
      key: 'targetPercentage',
      width: 90,
      align: 'center',
      render: (targetPercentage) => (
        <span style={{ color: '#fa8c16', fontWeight: '500' }}>
          {targetPercentage}%
        </span>
      ),
    },
  ];

  return (
    <div className="ranking-list-container">
      {/* 标题和操作区域 */}
      <div style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              猫咪统计
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              查看全服猫咪品质分布和统计信息
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      {/* 主要内容区域 */}
      <Card>
        <Spin spinning={loading}>
          {/* 统计概览 */}
          <div style={{ marginBottom: 16, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
            <Space size="large">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {totalCats}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>统计总量</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: actualTotalCats !== totalCats ? '#f5222d' : '#52c41a' 
                }}>
                  {actualTotalCats}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>实际总量</div>
                {actualTotalCats !== totalCats && (
                  <div style={{ fontSize: '12px', color: '#f5222d' }}>
                    差异: {actualTotalCats - totalCats}
                  </div>
                )}
              </div>
    
            </Space>
          </div>

          {/* 品质分布表格 */}
          <Table
            dataSource={tableData}
            columns={columns}
            rowKey="quality"
            pagination={{
              ...pagination,
              size: "small",
              pageSize: 8,
              position: ['bottomCenter']
            }}
            onChange={handleTableChange}
            className="ranking-table"
            size="small"
            bordered={false}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default CatStats;
