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

// 挑战等级配置
const BET_LEVELS = [
  { level: 0, amount: 2, label: '2 DFS', color: '#52c41a' },
  { level: 1, amount: 5, label: '5 DFS', color: '#1890ff' },
  { level: 2, amount: 10, label: '10 DFS', color: '#f5222d' }
];

const PlaceArenaModal = ({
  visible,
  onCancel,
  onConfirm,
  userCats,
  loading
}) => {
  const [form] = Form.useForm();
  const [selectedCat, setSelectedCat] = useState(null);
  const [betLevel, setBetLevel] = useState(0); // 0=2DFS, 1=5DFS, 2=10DFS
  const [totalAmount, setTotalAmount] = useState(10); // 初始奖池金额

  // 重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedCat(null);
      setBetLevel(0);
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
      onConfirm(values.catId, values.betLevel, values.totalAmount);
    });
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
          betLevel: 0,
          totalAmount: 10
        }}
      >
        <Alert
          message="新擂台规则"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>选择一只猫咪和挑战等级（2 DFS / 5 DFS / 10 DFS）</li>
              <li>每个等级需要至少3个擂台才能被挑战</li>
              <li>挑战者随机匹配同等级的擂台进行战斗</li>
              <li>战斗基于猫咪属性和随机因素</li>
              <li>挑战失败：费用的1.5%给开发者，1.5%进传世猫池，97%加入奖池</li>
              <li>挑战成功：获得退还的挑战费用 + 97%的奖池奖励</li>
              <li>移除擂台：获得奖池内所有奖金</li>
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
          label="挑战等级"
          name="betLevel"
          rules={[{ required: true, message: '请选择挑战等级' }]}
        >
          <Select
            placeholder="选择挑战等级"
            onChange={setBetLevel}
            style={{ width: '100%' }}
          >
            {BET_LEVELS.map(level => (
              <Option key={level.level} value={level.level}>
                <Space>
                  <Tag color={level.color}>{level.label}</Tag>
                  <span>挑战费用: {level.amount} DFS</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="初始奖池金额 (DFS)"
          name="totalAmount"
          rules={[
            { required: true, message: '请设置初始奖池金额' },
            { type: 'number', min: 2, max: 100, message: '奖池金额必须在2-100 DFS之间' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const betLevel = getFieldValue('betLevel');
                const minAmount = BET_LEVELS[betLevel]?.amount || 2;
                if (!value || value >= minAmount) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(`奖池金额不能少于挑战费用 ${minAmount} DFS`));
              },
            }),
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={2}
            max={100}
            step={1}
            precision={2}
            onChange={setTotalAmount}
            addonAfter="DFS"
            placeholder="设置初始奖池金额"
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
                      e.target.src = '/images/logo.png';
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

        {betLevel !== undefined && totalAmount > 0 && (
          <>
            <Divider>擂台设置</Divider>
            <Card size="small" style={{ backgroundColor: BET_LEVELS[betLevel]?.color + '10' }}>
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <Statistic
                    title="挑战等级"
                    value={BET_LEVELS[betLevel]?.label}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: BET_LEVELS[betLevel]?.color, fontSize: 16 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="挑战费用"
                    value={BET_LEVELS[betLevel]?.amount}
                    suffix="DFS"
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: 16 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="初始奖池"
                    value={totalAmount}
                    suffix="DFS"
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#f5222d', fontSize: 16 }}
                  />
                </Col>
              </Row>
            </Card>

            <Alert
              message={
                <Space>
                  <InfoCircleOutlined />
                  <span>
                    其他玩家需要支付 <strong>{BET_LEVELS[betLevel]?.amount} DFS</strong> 来挑战你的猫咪。
                    挑战失败时，97%的费用会加入奖池。挑战成功时，获得退还费用 + 97%的当前奖池奖励。
                    初始奖池: <strong>{totalAmount} DFS</strong>
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
