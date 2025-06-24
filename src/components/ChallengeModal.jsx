import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Card,
  Space,
  Tag,
  Alert,
  Divider,
  Statistic,
  Row,
  Col,
  Progress,
  Typography
} from 'antd';
import {
  ThunderboltOutlined,
  SafetyOutlined,
  TrophyOutlined,
  FireOutlined
} from '@ant-design/icons';
import { QUALITY_NAMES, GENDER_NAMES, calculatePowerRank } from '../utils/chainOperations';

const { Option } = Select;
const { Text } = Typography;

const ChallengeModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  arena, 
  userCats, 
  loading 
}) => {
  const [form] = Form.useForm();
  const [selectedCat, setSelectedCat] = useState(null);

  // 重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedCat(null);
    }
  }, [visible, form]);

  // 获取可用的挑战猫咪
  const getAvailableCats = () => {
    return userCats.filter(cat => 
      !cat.in_arena && 
      cat.stamina >= 20 // 挑战需要20体力
    );
  };

  // 处理猫咪选择
  const handleCatSelect = (catId) => {
    const cat = userCats.find(c => c.id === catId);
    setSelectedCat(cat);
  };

  // 处理确认挑战
  const handleConfirm = () => {
    if (!arena || !selectedCat || !arena.bet_amount) return;

    form.validateFields().then(values => {
      const betAmount = parseFloat(arena.bet_amount.split(' ')[0]);
      onConfirm(arena.id, values.catId, betAmount);
    });
  };

  // 计算胜率估算
  const calculateWinChance = () => {
    if (!selectedCat || !arena || !arena.cat) return 50;

    // 简单的胜率计算（基于等级和品质）
    const challengerPower = selectedCat.level * 15 + selectedCat.quality * 50;
    const defenderPower = arena.cat.level * 15 + arena.cat.quality * 50;

    const totalPower = challengerPower + defenderPower;
    const winChance = Math.round((challengerPower / totalPower) * 100);

    // 限制在10-90%之间，增加不确定性
    return Math.max(10, Math.min(90, winChance));
  };

  // 获取品质颜色
  const getQualityColor = (quality) => {
    const colors = ['#d9d9d9', '#52c41a', '#1890ff', '#722ed1', '#eb2f96', '#fa8c16', '#f5222d', '#fa541c'];
    return colors[quality] || '#d9d9d9';
  };

  // 获取胜率颜色
  const getWinChanceColor = (chance) => {
    if (chance >= 70) return '#52c41a';
    if (chance >= 50) return '#faad14';
    if (chance >= 30) return '#fa8c16';
    return '#f5222d';
  };

  // 早期返回检查
  if (!arena) return null;

  const availableCats = getAvailableCats();
  const betAmount = arena.bet_amount ? parseFloat(arena.bet_amount.split(' ')[0]) : 0;
  const totalPool = arena.total_pool ? parseFloat(arena.total_pool.split(' ')[0]) : 0;
  const winChance = calculateWinChance();

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#f5222d' }} />
          挑战擂台 #{arena.id}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      confirmLoading={loading}
      width={700}
      okText="确认挑战"
      cancelText="取消"
      okButtonProps={{ 
        disabled: !selectedCat || availableCats.length === 0,
        danger: true 
      }}
    >
      <Alert
        message="挑战规则"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>支付挑战费用参与战斗</li>
            <li>挑战成功：获得挑战费用作为奖励，失败费用按比例分配</li>
            <li>挑战失败：费用的1.5%给开发者，1.5%进传世猫池，97%加入奖池</li>
            <li>挑战成功：获得退还的挑战费用 + 97%的奖池奖励</li>
            <li>战斗结果基于猫咪属性和随机因素</li>
            <li>每只猫咪每天只能挑战一次</li>
            <li>挑战消耗20点体力</li>
          </ul>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 擂台信息 */}
      <Card title="擂台信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            {arena.cat && (
              <img
                src={`/images/cat_${arena.cat.genes}.png`}
                alt={`Defender Cat #${arena.cat.id}`}
                style={{ width: '100%', borderRadius: 8 }}
                onError={(e) => {
                  e.target.src = '/images/logo.png';
                }}
              />
            )}
          </Col>
          <Col span={16}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>防守方: {arena.owner}</Text>
                {arena.cat && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color={getQualityColor(arena.cat.quality)}>
                      {QUALITY_NAMES[arena.cat.quality]}
                    </Tag>
                    <Tag>{GENDER_NAMES[arena.cat.gender]}</Tag>
                    <Tag color="blue">{arena.powerRank}</Tag>
                  </div>
                )}
              </div>
              
              <Row gutter={8}>
                <Col span={8}>
                  <Statistic
                    title="奖池"
                    value={totalPool}
                    suffix="DFS"
                    precision={2}
                    valueStyle={{ fontSize: 14, color: '#f5222d' }}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="挑战费"
                    value={betAmount}
                    suffix="DFS"
                    precision={2}
                    valueStyle={{ fontSize: 14, color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="战绩"
                    value={`${arena.wins}胜${arena.losses}负`}
                    valueStyle={{ fontSize: 14 }}
                  />
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 选择挑战猫咪 */}
      <Form form={form} layout="vertical">
        <Form.Item
          label="选择挑战猫咪"
          name="catId"
          rules={[{ required: true, message: '请选择挑战的猫咪' }]}
        >
          <Select
            placeholder="选择一只猫咪参与挑战"
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
            description="您的猫咪可能都在擂台上或体力不足。挑战需要至少20点体力。"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </Form>

      {/* 战斗预览 */}
      {selectedCat && (
        <>
          <Divider>战斗预览</Divider>
          <Row gutter={16}>
            <Col span={10}>
              <Card size="small" title={<Space><ThunderboltOutlined />挑战方</Space>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <img
                    src={`/images/cat_${selectedCat.genes}.png`}
                    alt={`Challenger Cat #${selectedCat.id}`}
                    style={{ width: '100%', borderRadius: 8 }}
                    onError={(e) => {
                      e.target.src = '/images/logo.png';
                    }}
                  />
                  <div>
                    <Text strong>#{selectedCat.id}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color={getQualityColor(selectedCat.quality)}>
                        {QUALITY_NAMES[selectedCat.quality]}
                      </Tag>
                      <Tag>{GENDER_NAMES[selectedCat.gender]}</Tag>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">等级: {selectedCat.level}</Text><br/>
                      <Text type="secondary">体力: {selectedCat.stamina}/100</Text><br/>
                      <Text type="secondary">战力: {calculatePowerRank(selectedCat)}</Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
            
            <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: getWinChanceColor(winChance) }}>
                    {winChance}%
                  </Text>
                  <div style={{ fontSize: 12, color: '#666' }}>胜率</div>
                </div>
              </div>
            </Col>
            
            <Col span={10}>
              <Card size="small" title={<Space><SafetyOutlined />防守方</Space>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {arena.cat && (
                    <>
                      <img
                        src={`/images/cat_${arena.cat.genes}.png`}
                        alt={`Defender Cat #${arena.cat.id}`}
                        style={{ width: '100%', borderRadius: 8 }}
                        onError={(e) => {
                          e.target.src = '/images/logo.png';
                        }}
                      />
                      <div>
                        <Text strong>#{arena.cat.id}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={getQualityColor(arena.cat.quality)}>
                            {QUALITY_NAMES[arena.cat.quality]}
                          </Tag>
                          <Tag>{GENDER_NAMES[arena.cat.gender]}</Tag>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">等级: {arena.cat.level}</Text><br/>
                          <Text type="secondary">体力: {arena.cat.stamina}/100</Text><br/>
                          <Text type="secondary">战力: {arena.powerRank}</Text>
                        </div>
                      </div>
                    </>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Progress
              percent={winChance}
              strokeColor={getWinChanceColor(winChance)}
              format={(percent) => `胜率 ${percent}%`}
            />
            <Alert
              message={
                <Space>
                  <FireOutlined />
                  <span>
                    支付 <strong>{betAmount.toFixed(2)} DFS</strong> 挑战费用，
                    胜利可获得 <strong>{(betAmount + betAmount * 0.97).toFixed(2)} DFS</strong> 奖励！
                    (退还 {betAmount.toFixed(2)} + 97%奖池奖励 {(betAmount * 0.97).toFixed(2)})
                  </span>
                </Space>
              }
              type="info"
              style={{ marginTop: 12 }}
            />
          </div>
        </>
      )}
    </Modal>
  );
};

export default ChallengeModal;
