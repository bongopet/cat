import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Card,
  Space,
  Tag,
  Alert,
  Divider,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { QUALITY_NAMES, GENDER_NAMES, calculatePowerRank } from '../utils/chainOperations';

const { Option } = Select;

const PlaceArenaModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  userCats, 
  loading 
}) => {
  const [form] = Form.useForm();
  const [selectedCat, setSelectedCat] = useState(null);
  const [totalAmount, setTotalAmount] = useState(10);

  // 重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedCat(null);
      setTotalAmount(10);
    }
  }, [visible, form]);

  // 获取可用的猫咪（不在擂台上且体力充足）
  const getAvailableCats = () => {
    return userCats.filter(cat => 
      !cat.in_arena && 
      cat.stamina >= 50 // 需要至少50体力才能进入擂台
    );
  };

  // 处理猫咪选择
  const handleCatSelect = (catId) => {
    const cat = userCats.find(c => c.id === catId);
    setSelectedCat(cat);
  };

  // 处理确认
  const handleConfirm = () => {
    form.validateFields().then(values => {
      onConfirm(values.catId, values.totalAmount);
    });
  };

  // 计算挑战费用（总金额的10%）
  const getBetAmount = () => {
    return Math.max(1, totalAmount * 0.1);
  };

  // 获取品质颜色
  const getQualityColor = (quality) => {
    const colors = ['#d9d9d9', '#52c41a', '#1890ff', '#722ed1', '#eb2f96', '#fa8c16', '#f5222d', '#fa541c'];
    return colors[quality] || '#d9d9d9';
  };

  const availableCats = getAvailableCats();

  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ color: '#1890ff' }} />
          放置猫咪到擂台
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      confirmLoading={loading}
      width={600}
      okText="确认放置"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          totalAmount: 10
        }}
      >
        <Alert
          message="擂台规则"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>选择一只猫咪和设置奖池金额</li>
              <li>其他玩家可以挑战你的猫咪</li>
              <li>挑战费用为奖池金额的10%</li>
              <li>战斗基于猫咪属性和随机因素</li>
              <li>失败的挑战费用会加入奖池</li>
              <li>成功的挑战者获得整个奖池</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          label="选择猫咪"
          name="catId"
          rules={[{ required: true, message: '请选择要放置的猫咪' }]}
        >
          <Select
            placeholder="选择一只猫咪"
            onChange={handleCatSelect}
            style={{ width: '100%' }}
          >
            {availableCats.map(cat => (
              <Option key={cat.id} value={cat.id}>
                <Space>
                  <span>#{cat.id}</span>
                  <Tag color={getQualityColor(cat.quality)} size="small">
                    {QUALITY_NAMES[cat.quality]}
                  </Tag>
                  <span>Lv.{cat.level}</span>
                  <span>{GENDER_NAMES[cat.gender]}</span>
                  <span style={{ color: '#666' }}>
                    体力: {cat.stamina}/100
                  </span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {availableCats.length === 0 && (
          <Alert
            message="没有可用的猫咪"
            description="您的猫咪可能都在擂台上或体力不足。猫咪需要至少50点体力才能进入擂台。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          label="奖池金额 (DFS)"
          name="totalAmount"
          rules={[
            { required: true, message: '请设置奖池金额' },
            { type: 'number', min: 1, message: '奖池金额至少为1 DFS' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={1000}
            step={0.1}
            precision={2}
            onChange={setTotalAmount}
            addonAfter="DFS"
          />
        </Form.Item>

        {selectedCat && (
          <>
            <Divider>猫咪信息</Divider>
            <Card size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <img
                    src={`/images/cat_${selectedCat.genes}.png`}
                    alt={`Cat #${selectedCat.id}`}
                    style={{ width: '100%', borderRadius: 8 }}
                    onError={(e) => {
                      e.target.src = '/images/default_cat.png';
                    }}
                  />
                </Col>
                <Col span={16}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <strong>猫咪 #{selectedCat.id}</strong>
                      <div style={{ marginTop: 4 }}>
                        <Tag color={getQualityColor(selectedCat.quality)}>
                          {QUALITY_NAMES[selectedCat.quality]}
                        </Tag>
                        <Tag>{GENDER_NAMES[selectedCat.gender]}</Tag>
                      </div>
                    </div>
                    
                    <Row gutter={8}>
                      <Col span={8}>
                        <Statistic
                          title="等级"
                          value={selectedCat.level}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="体力"
                          value={`${selectedCat.stamina}/100`}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="战力"
                          value={calculatePowerRank(selectedCat)}
                          valueStyle={{ fontSize: 12 }}
                        />
                      </Col>
                    </Row>
                  </Space>
                </Col>
              </Row>
            </Card>
          </>
        )}

        {totalAmount > 0 && (
          <>
            <Divider>擂台设置</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="奖池金额"
                    value={totalAmount}
                    suffix="DFS"
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="挑战费用"
                    value={getBetAmount()}
                    suffix="DFS"
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Alert
              message={
                <Space>
                  <InfoCircleOutlined />
                  <span>
                    其他玩家需要支付 <strong>{getBetAmount().toFixed(2)} DFS</strong> 来挑战你的猫咪
                  </span>
                </Space>
              }
              type="info"
              style={{ marginTop: 12 }}
            />
          </>
        )}
      </Form>
    </Modal>
  );
};

export default PlaceArenaModal;
