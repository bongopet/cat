import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Tag, Typography, message, Tooltip, Modal, Card, Space } from 'antd';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAllCats } from '../utils/chainOperations';
import { getCatColorClass } from '../utils/catGeneParser';
import CatRenderer from './CatRenderer';
import './RankingList.css';

const { Title } = Typography;

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

const RankingList = ({ DFSWallet }) => {
  const [catsList, setCatsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedCat, setSelectedCat] = useState(null);
  const [catModalVisible, setCatModalVisible] = useState(false);

  // 获取排行榜数据
  const fetchRankingData = async () => {
    if (!DFSWallet) return;
    
    try {
      setLoading(true);
      const cats = await getAllCats(DFSWallet, 100); // 获取最多100只猫咪
      console.log(cats);
      setCatsList(cats);
      setPagination(prev => ({
        ...prev,
        total: cats.length,
      }));
    } catch (error) {
      console.error('获取排行榜数据失败:', error);
      message.error('获取排行榜数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchRankingData();
  }, [DFSWallet]);

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // 处理刷新按钮点击
  const handleRefresh = () => {
    fetchRankingData();
  };
  
  // 处理猫咪点击，显示猫咪详情
  const handleCatClick = (cat) => {
    setSelectedCat(cat);
    setCatModalVisible(true);
  };
  
  // 关闭猫咪详情Modal
  const handleCloseModal = () => {
    setCatModalVisible(false);
  };

  // 定义表格列
  const columns = [
    {
      title: '#',
      key: 'ranking',
      width: 40,
      align: 'center',
      render: (_, __, index) => {
        const rank = (pagination.current - 1) * pagination.pageSize + index + 1;
        if (rank === 1) {
          return (
            <div className="ranking-badge gold">
              <TrophyOutlined /> 1
            </div>
          );
        } else if (rank === 2) {
          return (
            <div className="ranking-badge silver">
              <TrophyOutlined /> 2
            </div>
          );
        } else if (rank === 3) {
          return (
            <div className="ranking-badge bronze">
              <TrophyOutlined /> 3
            </div>
          );
        }
        return <div className="ranking-number">{rank}</div>;
      },
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 55,
      align: 'center',
      render: (id, record) => (
        <div className="cat-id">
          <Tooltip title="点击查看猫咪详情" placement="top">
            <span
              className={`cat-badge clickable ${getCatColorClass(record.genes || record.gene)}`}
              onClick={() => handleCatClick(record)}
            >
              #{id}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '主人',
      dataIndex: 'owner',
      key: 'owner',
      width: 55,
      render: (owner) => (
        <Tooltip title={owner} placement="topLeft">
          <Tag color="blue" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{owner}</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Lv',
      dataIndex: 'level',
      key: 'level',
      width: 40,
      sorter: (a, b) => a.level - b.level,
      sortDirections: ['descend', 'ascend'],
      defaultSortOrder: 'descend',
      render: (level) => <Tag color="green" style={{ padding: '0 2px' }}>Lv.{level}</Tag>,
    },
    {
      title: '品质',
      dataIndex: 'quality',
      key: 'quality',
      width: 80,
      sorter: (a, b) => a.quality - b.quality,
      sortDirections: ['descend', 'ascend'],
      render: (quality) => {
        const qualityValue = quality || 0;
        const config = qualityConfig[qualityValue] || qualityConfig[0];
        return (
          <Tag
            color={config.color}
            style={{
              color: '#fff',
              fontWeight: 'bold',
              border: 'none',
              padding: '2px 8px'
            }}
          >
            {config.name}
          </Tag>
        );
      },
    },
    {
      title: '体力',
      dataIndex: 'stamina',
      key: 'stamina',
      width: 50,
      render: (stamina, record) => {
        const staminaValue = stamina ? (stamina).toFixed(1) : '0.00';
        // const maxStamina = record.maxStamina ? (record.maxStamina / 100).toFixed(2) : '100.00';
        return `${staminaValue}/${100}`;
      },
    },
  ];

  return (
    <div className="ranking-list-container">
      {/* 标题和操作区域 */}
      <div style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <TrophyOutlined style={{ marginRight: 8, color: '#fadb14' }} />
              猫咪排行榜
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              查看所有猫咪的等级排名和属性信息
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
          <Table
            dataSource={catsList}
            columns={columns}
            rowKey="id"
            pagination={{
              ...pagination,
              size: "small",
              pageSize: 15,
              position: ['bottomCenter']
            }}
            onChange={handleTableChange}
            className="ranking-table"
            size="small"
            bordered={false}
          />
        </Spin>
      </Card>
      
      {/* 猫咪详情Modal */}
      <Modal
        title={selectedCat ? `猫咪 #${selectedCat.id} 详情` : '猫咪详情'}
        open={catModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={400}
        centered
        className="cat-detail-modal cat-modal"
        style={{ borderRadius: '12px' }}
        bodyStyle={{ padding: '16px' }}
        headStyle={{ backgroundColor: '#5a32ea', borderRadius: '12px 12px 0 0' }}
      >
        {selectedCat && (
          <div className="cat-modal-content">
            <div className="cat-modal-info">
              <p><strong>所有者:</strong> {selectedCat.owner}</p>
              <p><strong>等级:</strong> {selectedCat.level}</p>
              <p><strong>经验:</strong> {selectedCat.experience || 0}</p>
              {/* <p><strong>基因:</strong> {selectedCat.genes || 0}</p> */}
            </div>
            <div className="cat-modal-renderer">
              <CatRenderer parent="ranking" gene={selectedCat.genes} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RankingList; 