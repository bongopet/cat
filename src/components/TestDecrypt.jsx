import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Divider } from 'antd';
import { decryptCatStats } from '../utils/chainOperations';

const TestDecrypt = () => {
  const [testResult, setTestResult] = useState(null);

  // 测试数据 - 猫咪#1989
  const testCat = {
    id: 1989,
    encrypted_stats: "2139885574208804149"
  };

  const runDecryptTest = () => {
    console.log('开始解密测试...');
    
    try {
      const decryptedStats = decryptCatStats(testCat.encrypted_stats, testCat.id);
      // console.log('解密结果:', decryptedStats);
      
      const totalPower = decryptedStats.attack + decryptedStats.defense + decryptedStats.health + 
                        decryptedStats.critical + decryptedStats.dodge + decryptedStats.luck;
      
      setTestResult({
        success: true,
        stats: decryptedStats,
        totalPower
      });
    } catch (error) {
      console.error('解密失败:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    }
  };

  useEffect(() => {
    runDecryptTest();
  }, []);

  const getStatColor = (value, maxValue) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return '#52c41a'; // 绿色
    if (percentage >= 60) return '#1890ff'; // 蓝色
    if (percentage >= 40) return '#faad14'; // 黄色
    if (percentage >= 20) return '#fa8c16'; // 橙色
    return '#f5222d'; // 红色
  };

  const getStatRank = (value, maxValue) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'S';
    if (percentage >= 60) return 'A';
    if (percentage >= 40) return 'B';
    if (percentage >= 20) return 'C';
    return 'D';
  };

  return (
    <div style={{ padding: 20 }}>
      <Card title="属性解密测试" style={{ maxWidth: 600 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>测试猫咪:</strong> #{testCat.id}
          </div>
          <div>
            <strong>加密属性:</strong> {testCat.encrypted_stats}
          </div>
          
          <Divider />
          
          <Button type="primary" onClick={runDecryptTest}>
            重新测试解密
          </Button>
          
          {testResult && (
            <>
              <Divider />
              
              {testResult.success ? (
                <div>
                  <h4>✅ 解密成功</h4>
                  
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔥 攻击力:</span>
                      <div>
                        <Tag color={getStatColor(testResult.stats.attack, 1023)}>
                          {testResult.stats.attack}
                        </Tag>
                        <Tag size="small">
                          {getStatRank(testResult.stats.attack, 1023)}
                        </Tag>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🛡️ 防御力:</span>
                      <div>
                        <Tag color={getStatColor(testResult.stats.defense, 1023)}>
                          {testResult.stats.defense}
                        </Tag>
                        <Tag size="small">
                          {getStatRank(testResult.stats.defense, 1023)}
                        </Tag>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>❤️ 生命值:</span>
                      <div>
                        <Tag color={getStatColor(testResult.stats.health, 4095)}>
                          {testResult.stats.health}
                        </Tag>
                        <Tag size="small">
                          {getStatRank(testResult.stats.health, 4095)}
                        </Tag>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>⚡ 暴击率:</span>
                      <div>
                        <Tag color={getStatColor(testResult.stats.critical, 255)}>
                          {testResult.stats.critical}
                        </Tag>
                        <Tag size="small">
                          {getStatRank(testResult.stats.critical, 255)}
                        </Tag>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>👁️ 闪避率:</span>
                      <div>
                        <Tag color={getStatColor(testResult.stats.dodge, 255)}>
                          {testResult.stats.dodge}
                        </Tag>
                        <Tag size="small">
                          {getStatRank(testResult.stats.dodge, 255)}
                        </Tag>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🍀 幸运值:</span>
                      <div>
                        <Tag color={getStatColor(testResult.stats.luck, 255)}>
                          {testResult.stats.luck}
                        </Tag>
                        <Tag size="small">
                          {getStatRank(testResult.stats.luck, 255)}
                        </Tag>
                      </div>
                    </div>
                    
                    <Divider />
                    
                    <div style={{ textAlign: 'center' }}>
                      <Tag color="gold" style={{ fontSize: '16px', padding: '8px 16px' }}>
                        总战力: {testResult.totalPower}
                      </Tag>
                    </div>
                  </Space>
                </div>
              ) : (
                <div>
                  <h4>❌ 解密失败</h4>
                  <p style={{ color: 'red' }}>{testResult.error}</p>
                </div>
              )}
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TestDecrypt;
