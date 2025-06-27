import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert, message, Divider, Radio } from 'antd';
import { LockOutlined, UnlockOutlined, SafetyOutlined, CopyOutlined, KeyOutlined } from '@ant-design/icons';
import CryptoJS from 'crypto-js';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SignatureEncryption = ({ DFSWallet, userInfo }) => {
  const [mode, setMode] = useState('encrypt'); // 'encrypt' or 'decrypt'
  const [inputData, setInputData] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [signatureKey, setSignatureKey] = useState('');

  // 生成签名密钥
  const generateSignatureKey = async () => {
    if (!DFSWallet || !userInfo) {
      message.warning('请先连接钱包');
      return;
    }

    try {
      setProcessing(true);
      
      // 使用当前时间戳作为签名内容，确保每次都不同
      const timestamp = Math.floor(Date.now() / 1000);
      const signMessage = `encryption_key_${userInfo.name}_${timestamp}`;
      
      console.log('生成签名密钥，签名内容:', signMessage);
      
      // 使用钱包签名
      const signResult = await DFSWallet.sign(signMessage);
      console.log('签名结果:', signResult);
      
      const signature = signResult.signature || signResult || '';
      setSignatureKey(signature);
      
      message.success('签名密钥生成成功！');
      
    } catch (error) {
      console.error('生成签名密钥失败:', error);
      message.error('生成签名密钥失败: ' + (error.message || String(error)));
    } finally {
      setProcessing(false);
    }
  };

  // 使用签名加密数据
  const encryptData = () => {
    if (!signatureKey) {
      message.warning('请先生成签名密钥');
      return;
    }
    
    if (!inputData.trim()) {
      message.warning('请输入要加密的数据');
      return;
    }

    try {
      // 使用签名的哈希作为加密密钥
      const key = CryptoJS.SHA256(signatureKey).toString();
      
      // 使用AES加密
      const encrypted = CryptoJS.AES.encrypt(inputData.trim(), key).toString();
      
      const result = {
        originalData: inputData.trim(),
        encryptedData: encrypted,
        signatureKey: signatureKey,
        keyHash: key.substring(0, 16) + '...', // 只显示部分哈希
        account: userInfo.name,
        timestamp: new Date().toISOString(),
        encryptedAt: new Date().toLocaleString()
      };
      
      setResult(result);
      message.success('数据加密成功！');
      
    } catch (error) {
      console.error('加密失败:', error);
      message.error('加密失败: ' + (error.message || String(error)));
    }
  };

  // 使用签名解密数据
  const decryptData = () => {
    if (!signatureKey) {
      message.warning('请先生成签名密钥');
      return;
    }
    
    if (!encryptedData.trim()) {
      message.warning('请输入要解密的数据');
      return;
    }

    try {
      // 使用签名的哈希作为解密密钥
      const key = CryptoJS.SHA256(signatureKey).toString();
      
      // 使用AES解密
      const decrypted = CryptoJS.AES.decrypt(encryptedData.trim(), key);
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error('解密失败，可能是密钥不正确或数据已损坏');
      }
      
      const result = {
        encryptedData: encryptedData.trim(),
        decryptedData: decryptedText,
        signatureKey: signatureKey,
        keyHash: key.substring(0, 16) + '...', // 只显示部分哈希
        account: userInfo.name,
        timestamp: new Date().toISOString(),
        decryptedAt: new Date().toLocaleString()
      };
      
      setResult(result);
      message.success('数据解密成功！');
      
    } catch (error) {
      console.error('解密失败:', error);
      message.error('解密失败: ' + (error.message || String(error)));
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 复制完整结果
  const copyFullResult = () => {
    if (!result) return;
    const fullResult = JSON.stringify(result, null, 2);
    copyToClipboard(fullResult);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Title level={2}>
          <LockOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
          签名加密工具
        </Title>
        <Text type="secondary">
          使用钱包签名作为密钥来加密和解密数据
        </Text>
      </div>

      {!DFSWallet || !userInfo ? (
        <Alert
          message="请先连接钱包"
          description="连接钱包后可使用签名加密功能"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      ) : (
        <Alert
          message={`当前账户: ${userInfo.name}`}
          description="确保您使用正确的账户进行签名加密"
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 签名密钥生成 */}
      <Card
        title={
          <Space>
            <KeyOutlined />
            签名密钥
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>当前签名密钥:</Text>
            <div style={{ 
              background: signatureKey ? '#f6ffed' : '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px', 
              marginTop: '4px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              fontSize: '12px',
              minHeight: '40px',
              border: signatureKey ? '1px solid #b7eb8f' : '1px solid #d9d9d9'
            }}>
              {signatureKey || '请点击下方按钮生成签名密钥'}
            </div>
          </div>

          <Button
            type="primary"
            icon={<SafetyOutlined />}
            onClick={generateSignatureKey}
            loading={processing}
            disabled={!DFSWallet || !userInfo}
            style={{ width: '100%' }}
          >
            {processing ? '生成中...' : '生成新的签名密钥'}
          </Button>
          
          <Alert
            message="安全提示"
            description="每次生成的签名密钥都是唯一的。请妥善保管您的签名密钥，丢失后将无法解密之前加密的数据。"
            type="warning"
            showIcon
            size="small"
          />
        </Space>
      </Card>

      {/* 模式选择 */}
      <Card style={{ marginBottom: '24px' }}>
        <Radio.Group 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{ width: '100%' }}
        >
          <Radio.Button value="encrypt" style={{ width: '50%', textAlign: 'center' }}>
            <LockOutlined /> 加密数据
          </Radio.Button>
          <Radio.Button value="decrypt" style={{ width: '50%', textAlign: 'center' }}>
            <UnlockOutlined /> 解密数据
          </Radio.Button>
        </Radio.Group>
      </Card>

      {/* 加密模式 */}
      {mode === 'encrypt' && (
        <Card
          title={
            <Space>
              <LockOutlined style={{ color: '#52c41a' }} />
              数据加密
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>要加密的数据:</Text>
              <TextArea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="请输入要加密的数据..."
                rows={6}
                style={{ marginTop: '8px' }}
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<LockOutlined />}
              onClick={encryptData}
              disabled={!signatureKey || !inputData.trim()}
              style={{ width: '100%' }}
            >
              加密数据
            </Button>
          </Space>
        </Card>
      )}

      {/* 解密模式 */}
      {mode === 'decrypt' && (
        <Card
          title={
            <Space>
              <UnlockOutlined style={{ color: '#1890ff' }} />
              数据解密
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>要解密的数据:</Text>
              <TextArea
                value={encryptedData}
                onChange={(e) => setEncryptedData(e.target.value)}
                placeholder="请输入要解密的加密数据..."
                rows={6}
                style={{ marginTop: '8px' }}
              />
            </div>

            <Button
              type="primary"
              size="large"
              icon={<UnlockOutlined />}
              onClick={decryptData}
              disabled={!signatureKey || !encryptedData.trim()}
              style={{ width: '100%' }}
            >
              解密数据
            </Button>
          </Space>
        </Card>
      )}

      {/* 结果显示 */}
      {result && (
        <Card
          title={
            <Space>
              <SafetyOutlined style={{ color: mode === 'encrypt' ? '#52c41a' : '#1890ff' }} />
              {mode === 'encrypt' ? '加密结果' : '解密结果'}
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
            {mode === 'encrypt' ? (
              <>
                <div>
                  <Text strong>原始数据:</Text>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    marginTop: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {result.originalData}
                  </div>
                </div>

                <Divider />

                <div>
                  <Text strong>加密结果:</Text>
                  <Space style={{ float: 'right' }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(result.encryptedData)}
                    >
                      复制
                    </Button>
                  </Space>
                  <div style={{ 
                    background: '#f6ffed', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    fontSize: '12px',
                    border: '1px solid #b7eb8f'
                  }}>
                    {result.encryptedData}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Text strong>加密数据:</Text>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    fontSize: '12px'
                  }}>
                    {result.encryptedData}
                  </div>
                </div>

                <Divider />

                <div>
                  <Text strong>解密结果:</Text>
                  <Space style={{ float: 'right' }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(result.decryptedData)}
                    >
                      复制
                    </Button>
                  </Space>
                  <div style={{ 
                    background: '#e6f7ff', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    border: '1px solid #91d5ff'
                  }}>
                    {result.decryptedData}
                  </div>
                </div>
              </>
            )}

            <div>
              <Text strong>密钥哈希:</Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                {result.keyHash}
              </div>
            </div>

            <div>
              <Text strong>操作时间:</Text>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontFamily: 'monospace'
              }}>
                {mode === 'encrypt' ? result.encryptedAt : result.decryptedAt}
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
          <Text>• <strong>生成签名密钥</strong>: 使用钱包签名生成唯一的加密密钥</Text>
          <Text>• <strong>加密数据</strong>: 使用签名密钥对任意文本进行AES加密</Text>
          <Text>• <strong>解密数据</strong>: 使用相同的签名密钥解密之前加密的数据</Text>
          <Text>• <strong>安全性</strong>: 只有拥有相同私钥的人才能生成相同的签名密钥</Text>
          <Text type="secondary">注意: 每次生成的签名密钥都不同，请妥善保管用于加密的签名密钥</Text>
        </Space>
      </Card>
    </div>
  );
};

export default SignatureEncryption;
