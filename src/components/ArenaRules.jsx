import React from 'react';
import { Modal, Card, Row, Col, Divider, Tag, Space, Typography } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  DollarOutlined,
  StarOutlined,
  HeartOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const ArenaRules = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ color: '#1890ff' }} />
          <span>擂台挑战规则说明</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '10px' }}>
        
        {/* 基本规则 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={4}>
            <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            基本规则
          </Title>
          <Paragraph>
            <ul>
              <li>擂台分为三个等级：<Tag color="green">2 DFS</Tag>、<Tag color="blue">5 DFS</Tag>、<Tag color="red">10 DFS</Tag></li>
              <li>每个等级需要至少 <Text strong>3个擂台</Text> 才能发起挑战</li>
              <li>挑战时系统会随机选择同等级的擂台进行对战</li>
              <li>战斗结果基于猫咪的属性进行计算</li>
              <li>胜利者获得奖励，失败者失去挑战费用</li>
            </ul>
          </Paragraph>
        </Card>

        {/* 战斗机制 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={4}>
            <ThunderboltOutlined style={{ color: '#faad14', marginRight: 8 }} />
            战斗机制
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" title="攻击属性">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <FireOutlined style={{ color: '#f5222d', marginRight: 4 }} />
                    <Text strong>攻击力</Text>：决定造成的基础伤害
                  </div>
                  <div>
                    <ThunderboltOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    <Text strong>暴击</Text>：提高暴击概率，暴击伤害x1.5
                  </div>
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="防御属性">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <SafetyOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                    <Text strong>防御力</Text>：减少受到的伤害
                  </div>
                  <div>
                    <EyeOutlined style={{ color: '#722ed1', marginRight: 4 }} />
                    <Text strong>闪避</Text>：提高闪避概率，完全避免伤害
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
          <Divider />
          <div>
            <HeartOutlined style={{ color: '#52c41a', marginRight: 4 }} />
            <Text strong>血量</Text>：猫咪的生命值，血量归零即战败
          </div>
          <div style={{ marginTop: 8 }}>
            <StarOutlined style={{ color: '#eb2f96', marginRight: 4 }} />
            <Text strong>幸运</Text>：影响战斗中的随机事件
          </div>
        </Card>

        {/* 奖励机制 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={4}>
            <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            奖励机制
          </Title>
          <Paragraph>
            <Text strong>胜利奖励计算：</Text>
            <ul>
              <li>获得 <Text code>挑战费用</Text> 的全额退还</li>
              <li>获得擂台奖池的大部分奖励</li>
              <li>系统扣除 <Text mark>1.5%</Text> 作为开发者费用</li>
              <li>系统扣除 <Text mark>1.5%</Text> 注入传奇猫咪奖池</li>
            </ul>
          </Paragraph>
          
          <Divider />
          
          <Text strong>示例（2 DFS 挑战）：</Text>
          <div style={{ 
            background: '#f6ffed', 
            padding: '12px', 
            borderRadius: '6px', 
            marginTop: '8px',
            border: '1px solid #b7eb8f'
          }}>
            <div>• 挑战费用：2.00 DFS</div>
            <div>• 擂台奖池：10.00 DFS</div>
            <div>• 胜利总奖励：3.94 DFS</div>
            <div style={{ marginLeft: '16px', fontSize: '12px', color: '#666' }}>
              - 退还挑战费：2.00 DFS<br/>
              - 奖池奖励：1.94 DFS<br/>
              - 开发者费用：0.03 DFS<br/>
              - 传奇奖池：0.03 DFS
            </div>
          </div>
        </Card>

        {/* 策略建议 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={4}>
            <StarOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
            策略建议
          </Title>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Tag color="blue">💡 选择合适等级</Tag>
              <Text>根据猫咪实力选择合适的挑战等级，避免实力悬殊</Text>
            </Col>
            <Col span={24}>
              <Tag color="green">💡 属性搭配</Tag>
              <Text>平衡攻击、防御、血量等属性，避免偏科</Text>
            </Col>
            <Col span={24}>
              <Tag color="orange">💡 观察对手</Tag>
              <Text>查看擂台猫咪的品质和等级，评估胜算</Text>
            </Col>
            <Col span={24}>
              <Tag color="purple">💡 风险控制</Tag>
              <Text>从低等级开始挑战，积累经验后再挑战高等级</Text>
            </Col>
          </Row>
        </Card>

        {/* 注意事项 */}
        <Card size="small">
          <Title level={4}>
            <SafetyOutlined style={{ color: '#f5222d', marginRight: 8 }} />
            注意事项
          </Title>
          <Paragraph>
            <ul>
              <li><Text type="danger">挑战失败将失去全部挑战费用</Text></li>
              <li>战斗结果完全基于猫咪属性，无法人为干预</li>
              <li>每次挑战都会消耗猫咪体力</li>
              <li>建议在猫咪体力充足时进行挑战</li>
              <li>可以通过升级和喂养提升猫咪属性</li>
            </ul>
          </Paragraph>
        </Card>

      </div>
    </Modal>
  );
};

export default ArenaRules;
