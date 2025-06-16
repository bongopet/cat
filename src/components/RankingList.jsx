import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Spin, Tag, Typography, message, Tooltip, Modal } from 'antd';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAllCats } from '../utils/chainOperations';
import { getCatColorClass } from '../utils/catGeneParser';
import CatRenderer from './CatRenderer';
import './RankingList.css';

const { Title } = Typography;

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
      title: '排名',
      key: 'ranking',
      width: 80,
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
      title: '猫咪ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
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
      title: '所有者',
      dataIndex: 'owner',
      key: 'owner',
      width: 100, // 设置列宽
      render: (owner) => (
        <Tooltip title={owner} placement="topLeft">
          <Tag color="blue">{owner}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100, // 设置列宽
      sorter: (a, b) => a.level - b.level,
      sortDirections: ['descend', 'ascend'],
      defaultSortOrder: 'descend',
      render: (level) => <Tag color="green">Lv.{level}</Tag>,
    },
    {
      title: '经验',
      dataIndex: 'experience',
      key: 'experience',
      width: 100, // 设置列宽
      sorter: (a, b) => a.experience - b.experience,
      render: (experience) => experience || 0,
    },
    {
      title: '体力',
      dataIndex: 'stamina',
      key: 'stamina',
      width: 100, // 设置列宽
      render: (stamina, record) => {
        const staminaValue = stamina ? (stamina / 100).toFixed(2) : '0.00';
        const maxStamina = record.maxStamina ? (record.maxStamina / 100).toFixed(2) : '100.00';
        return `${staminaValue}/${maxStamina}`;
      },
    },
  ];

  return (
    <div className="ranking-list-container">
      <Card className="ranking-card">
        <div className="ranking-header">
          <Title level={4}>
            <TrophyOutlined /> 猫咪排行榜
          </Title>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </div>
        
        <Spin spinning={loading}>
          <Table
            dataSource={catsList}
            columns={columns}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
            className="ranking-table"
            scroll={{ x: 'max-content' }} // 添加水平滚动
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