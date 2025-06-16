import React, { useState } from 'react';
import { Input, Button, Form, InputNumber, message, Card, Space, Typography, Divider } from 'antd';
import { SendOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const DFSTransfer = ({ DFSWallet, userInfo }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [transferResult, setTransferResult] = useState(null);

  const handleTransfer = async (values) => {
    if (!DFSWallet || !userInfo) {
      message.error('请先连接DFS钱包');
      return;
    }

    setLoading(true);
    setTransferResult(null);

    try {
      const transaction = {
        actions: [
          {
            account: 'eosio.token',
            name: 'transfer',
            authorization: [
              {
                actor: userInfo.name || '',
                permission: userInfo.authority || 'active',
              },
            ],
            data: {
              from: userInfo.name,
              to: values.receiver,
              quantity: `${values.amount.toFixed(8)} DFS`,
              memo: values.memo || 'DFS Transfer',
            },
          },
        ],
      };

      const result = await DFSWallet.transact(transaction, {
        useFreeCpu: true,
      });

      setTransferResult({
        success: true,
        data: result,
        message: '转账成功',
      });

      message.success('转账成功');
      form.resetFields();
    } catch (error) {
      console.error('转账失败:', error);
      setTransferResult({
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        message: '转账失败',
      });
      message.error('转账失败: ' + (error instanceof Error ? error.message : JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card 
        title={<Title level={4}>DFS转账测试</Title>} 
        bordered={false}
        style={{ borderRadius: '12px', marginBottom: '20px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleTransfer}
          initialValues={{ amount: 0.00000001 }}
        >
          <Form.Item
            label="接收地址"
            name="receiver"
            rules={[{ required: true, message: '请输入接收地址' }]}
          >
            <Input placeholder="请输入接收DFS的地址" />
          </Form.Item>

          <Form.Item
            label="金额"
            name="amount"
            rules={[{ required: true, message: '请输入转账金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.00000001}
              step={0.00000001}
              precision={8}
              placeholder="请输入转账金额"
              addonAfter="DFS"
            />
          </Form.Item>

          <Form.Item
            label="备注"
            name="memo"
          >
            <Input placeholder="请输入转账备注（可选）" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={loading}
              style={{ width: '100%', height: '40px', marginTop: '10px' }}
              disabled={!userInfo}
            >
              发起转账
            </Button>
          </Form.Item>
        </Form>

        {transferResult && (
          <>
            <Divider />
            <div>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ fontSize: '16px', color: transferResult.success ? '#52c41a' : '#ff4d4f' }}>
                  {transferResult.message}
                </Text>
                {transferResult.success ? (
                  <Card 
                    size="small" 
                    title="交易详情" 
                    style={{ marginTop: '10px', background: 'rgba(82, 196, 26, 0.1)' }}
                  >
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(transferResult.data, null, 2)}
                    </pre>
                  </Card>
                ) : (
                  <Card 
                    size="small" 
                    title="错误详情" 
                    style={{ marginTop: '10px', background: 'rgba(255, 77, 79, 0.1)' }}
                  >
                    <Text type="danger">{transferResult.error}</Text>
                  </Card>
                )}
              </Space>
            </div>
          </>
        )}

        {!userInfo && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Text type="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: '8px' }} />
              请先连接DFS钱包才能进行转账操作
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DFSTransfer; 