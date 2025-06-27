import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert, message, Divider } from 'antd';
import { EditOutlined, SafetyOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const WalletSigner = ({ DFSWallet, userInfo }) => {
  const [inputText, setInputText] = useState('mint');
  const [signatureResult, setSignatureResult] = useState(null);
  const [signing, setSigning] = useState(false);

  // 执行签名
  const handleSign = async () => {
    if (!DFSWallet || !userInfo) {
      message.warning('请先连接钱包');
      return;
    }

    if (!inputText.trim()) {
      message.warning('请输入要签名的文本');
      return;
    }

    try {
      setSigning(true);
      console.log('开始签名文本:', inputText);

      // 使用DFS钱包的sign方法直接签名文本
      const signResult = await DFSWallet.sign(inputText.trim());

      console.log('签名结果:', signResult);

      const signatureResult = {
        originalText: inputText.trim(),
        signature: signResult.signature || signResult || '未获取到签名',
        publicKey: signResult.publicKey || userInfo.publicKey || '未获取到公钥',
        account: userInfo.name,
        authority: userInfo.authority || 'active',
        timestamp: new Date().toISOString(),
        signedAt: new Date().toLocaleString(),
        rawResult: JSON.stringify(signResult, null, 2)
      };

      setSignatureResult(signatureResult);
      message.success('签名成功！');

    } catch (error) {
      console.error('签名失败:', error);
      message.error('签名失败: ' + (error.message || String(error)));
    } finally {
      setSigning(false);
    }
  };

  // 复制签名结果
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 复制完整结果
  const copyFullResult = () => {
    if (!signatureResult) return;
    
    const fullResult = JSON.stringify(signatureResult, null, 2);
    copyToClipboard(fullResult);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Title level={2}>
          <SafetyOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          钱包签名工具
        </Title>
        <Text type="secondary">
          使用您的钱包对任意文本进行数字签名
        </Text>
      </div>

      {!DFSWallet || !userInfo ? (
        <Alert
          message="请先连接钱包"
          description="连接钱包后可使用签名功能"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      ) : (
        <Alert
          message={`当前账户: ${userInfo.name}`}
          description="确保您使用正确的账户进行签名"
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card
        title={
          <Space>
            <EditOutlined />
            输入要签名的文本
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>签名文本:</Text>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入要签名的文本，例如: mint"
              rows={4}
              style={{ marginTop: '8px' }}
            />
          </div>

          <Button
            type="primary"
            size="large"
            onClick={handleSign}
            loading={signing}
            disabled={!DFSWallet || !userInfo || !inputText.trim()}
            style={{ width: '100%' }}
          >
            {signing ? '签名中...' : '执行签名'}
          </Button>
        </Space>
      </Card>

      {signatureResult && (
        <Card
          title={
            <Space>
              <SafetyOutlined style={{ color: '#52c41a' }} />
              签名结果
            </Space>
          }
          extra={
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={copyFullResult}
              size="small"
            >
              复制全部
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>原始文本:</Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontFamily: 'monospace'
              }}>
                {signatureResult.originalText}
              </div>
            </div>

            <Divider />

            <div>
              <Text strong>签名结果:</Text>
              <Space style={{ float: 'right' }}>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(signatureResult.signature)}
                >
                  复制
                </Button>
              </Space>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                fontSize: '12px'
              }}>
                {signatureResult.signature}
              </div>
            </div>

            <div>
              <Text strong>签名账户:</Text>
              <Space style={{ float: 'right' }}>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(signatureResult.account)}
                >
                  复制
                </Button>
              </Space>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontFamily: 'monospace'
              }}>
                {signatureResult.account}
              </div>
            </div>

            {signatureResult.publicKey && signatureResult.publicKey !== '未获取到公钥' && (
              <div>
                <Text strong>公钥:</Text>
                <Space style={{ float: 'right' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(signatureResult.publicKey)}
                  >
                    复制
                  </Button>
                </Space>
                <div style={{
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  fontSize: '12px'
                }}>
                  {signatureResult.publicKey}
                </div>
              </div>
            )}

            <div>
              <Text strong>权限:</Text>
              <div style={{
                background: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '4px',
                fontFamily: 'monospace'
              }}>
                {signatureResult.authority}
              </div>
            </div>

            {signatureResult.rawResult && (
              <div>
                <Text strong>完整签名结果:</Text>
                <Space style={{ float: 'right' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(signatureResult.rawResult)}
                  >
                    复制
                  </Button>
                </Space>
                <div style={{
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  fontSize: '10px',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {signatureResult.rawResult}
                </div>
              </div>
            )}

            <div>
              <Text strong>签名时间:</Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontFamily: 'monospace'
              }}>
                {signatureResult.signedAt}
              </div>
            </div>
          </Space>
        </Card>
      )}

      <Card
        title="使用说明"
        style={{ marginTop: '24px' }}
        size="small"
      >
        <Space direction="vertical" size="small">
          <Text>• 在文本框中输入您要签名的内容</Text>
          <Text>• 点击"执行签名"按钮，钱包会弹出签名确认</Text>
          <Text>• 确认后即可获得数字签名结果</Text>
          <Text>• 可以复制签名结果用于验证身份或其他用途</Text>
          <Text type="secondary">注意: 签名操作需要钱包确认，请确保您信任要签名的内容</Text>
        </Space>
      </Card>
    </div>
  );
};

export default WalletSigner;
