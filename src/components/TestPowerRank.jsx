import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Spin, Alert, Table } from 'antd';
import { calculatePowerRankFromContract, calculatePowerRank, getUserCats } from '../utils/chainOperations';
import Wallet from 'dfssdk';

const { Title, Text } = Typography;

/**
 * 测试战斗等级计算的组件
 */
const TestPowerRank = () => {
  const [loading, setLoading] = useState(false);
  const [userCats, setUserCats] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    // 获取当前用户账户
    const account = Wallet.getAccountName();
    setAccountName(account);
  }, []);

  // 加载用户猫咪
  const loadUserCats = async () => {
    if (!accountName) return;
    
    setLoading(true);
    try {
      const cats = await getUserCats(Wallet, accountName);
      setUserCats(cats || []);
    } catch (error) {
      console.error('加载用户猫咪失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 测试战斗等级计算
  const testPowerRankCalculation = async () => {
    if (userCats.length === 0) {
      alert('请先加载用户猫咪');
      return;
    }

    setLoading(true);
    const results = [];

    try {
      // 测试前5只猫咪
      const testCats = userCats.slice(0, 5);
      
      for (const cat of testCats) {
        console.log(`测试猫咪 #${cat.id} 的战斗等级...`);
        
        // 使用估算方法
        const estimatedRank = calculatePowerRank(cat);
        
        // 使用合约方法
        let contractRank = 'Failed';
        try {
          contractRank = await calculatePowerRankFromContract(Wallet, cat.id);
        } catch (error) {
          console.error(`合约计算失败:`, error);
        }

        results.push({
          key: cat.id,
          catId: cat.id,
          level: cat.level,
          quality: cat.quality,
          estimatedRank,
          contractRank,
          match: estimatedRank === contractRank
        });
      }

      setTestResults(results);
    } catch (error) {
      console.error('测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '猫咪ID',
      dataIndex: 'catId',
      key: 'catId',
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: '品质',
      dataIndex: 'quality',
      key: 'quality',
      render: (quality) => {
        const qualityNames = ["Normal", "Fine", "Excellent", "Rare", "Supreme", "Sacred", "Eternal", "Legendary"];
        return qualityNames[quality] || 'Unknown';
      }
    },
    {
      title: '估算等级',
      dataIndex: 'estimatedRank',
      key: 'estimatedRank',
    },
    {
      title: '合约等级',
      dataIndex: 'contractRank',
      key: 'contractRank',
      render: (rank) => (
        <Text type={rank === 'Failed' ? 'danger' : 'success'}>
          {rank}
        </Text>
      )
    },
    {
      title: '是否匹配',
      dataIndex: 'match',
      key: 'match',
      render: (match) => (
        <Text type={match ? 'success' : 'warning'}>
          {match ? '✓' : '✗'}
        </Text>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={3}>战斗等级计算测试</Title>
        
        {accountName ? (
          <Alert 
            message={`当前账户: ${accountName}`} 
            type="info" 
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <Alert 
            message="请先连接钱包" 
            type="warning" 
            style={{ marginBottom: '16px' }}
          />
        )}

        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button 
              type="primary" 
              onClick={loadUserCats}
              loading={loading}
              disabled={!accountName}
            >
              加载我的猫咪 ({userCats.length})
            </Button>
            
            <Button 
              onClick={testPowerRankCalculation}
              loading={loading}
              disabled={userCats.length === 0}
            >
              测试战斗等级计算
            </Button>
          </Space>

          {testResults.length > 0 && (
            <div>
              <Title level={4}>测试结果</Title>
              <Table 
                columns={columns} 
                dataSource={testResults}
                pagination={false}
                size="small"
              />
              
              <div style={{ marginTop: '16px' }}>
                <Text>
                  匹配率: {testResults.filter(r => r.match).length} / {testResults.length} 
                  ({Math.round(testResults.filter(r => r.match).length / testResults.length * 100)}%)
                </Text>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '10px' }}>
                <Text>正在计算战斗等级...</Text>
              </div>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TestPowerRank;
