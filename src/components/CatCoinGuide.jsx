import React from 'react';
import { Card, Typography, Space, Tag, Divider } from 'antd';
import { 
  UpCircleOutlined, 
  HeartOutlined, 
  GiftOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const CatCoinGuide = () => {
  return (
    <Card 
      title={
        <Space>
          <InfoCircleOutlined />
          猫币与DFS功能说明
        </Space>
      }
      style={{ margin: '16px 0' }}
    >
      <Typography>
        <Title level={4}>🪙 猫币 (BGCAT) 功能</Title>
        
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
            <Space>
              <UpCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
              <div>
                <Text strong>等级升级</Text>
                <br />
                <Text type="secondary">
                  使用猫币直接提升猫咪等级，根据品质消耗不同数量的猫币
                </Text>
              </div>
            </Space>
          </Card>

          <Card size="small" style={{ backgroundColor: '#fff2e8' }}>
            <Space>
              <HeartOutlined style={{ color: '#fa8c16', fontSize: '18px' }} />
              <div>
                <Text strong>体力恢复</Text>
                <br />
                <Text type="secondary">
                  每1个猫币恢复10-20体力（随机），体力满时自动停止消耗
                </Text>
              </div>
            </Space>
          </Card>
        </Space>

        <Divider />

        <Title level={4}>💎 DFS 功能</Title>

        <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
          <Space>
            <GiftOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
            <div>
              <Text strong>属性提升</Text>
              <br />
              <Text type="secondary">
                在"猫咪属性"界面中，每只猫咪都有DFS提升按钮，可随机提升攻击、防御、血量等属性
              </Text>
            </div>
          </Space>
        </Card>

        <Divider />

        <Title level={4}>📊 功能位置</Title>

        <Card size="small" title="功能分布" headStyle={{ backgroundColor: '#f6ffed' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Tag color="green">🪙 猫币功能</Tag>
              <Text>在猫币功能区 - 等级升级和体力恢复</Text>
            </div>
            <div>
              <Tag color="blue">💎 DFS功能</Tag>
              <Text>在猫咪属性界面 - 每只猫咪独立的属性提升按钮</Text>
            </div>
          </Space>
        </Card>

        <Divider />

        <Title level={4}>💡 使用建议</Title>

        <Paragraph>
          <ul>
            <li><Text strong>新手阶段：</Text>优先使用猫币升级，快速提升等级</li>
            <li><Text strong>属性强化：</Text>在"猫咪属性"界面中为每只猫咪使用DFS提升属性</li>
            <li><Text strong>体力管理：</Text>战斗前用猫币恢复体力</li>
            <li><Text strong>精准提升：</Text>可以针对特定猫咪进行属性强化，而不是只能强化当前选中的猫咪</li>
            <li><Text strong>资源平衡：</Text>合理分配猫币和DFS的使用</li>
          </ul>
        </Paragraph>
      </Typography>
    </Card>
  );
};

export default CatCoinGuide;
