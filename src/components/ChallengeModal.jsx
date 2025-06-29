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

  Typography
} from 'antd';
import {
  ThunderboltOutlined,
  SafetyOutlined,
  TrophyOutlined,
  FireOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { QUALITY_NAMES, GENDER_NAMES, decryptCatStats, getUserCats } from '../utils/chainOperations';
import BattleAnimation from './BattleAnimation';

const { Option } = Select;
const { Text } = Typography;

// 挑战等级配置
const BET_LEVELS = [
  { level: 0, amount: 2, label: '2 DFS', color: '#52c41a' },
  { level: 1, amount: 5, label: '5 DFS', color: '#1890ff' },
  { level: 2, amount: 10, label: '10 DFS', color: '#f5222d' }
];

const ChallengeModal = ({
  visible,
  onCancel,
  onConfirm,
  arenaStats, // 改为传入擂台统计信息
  userCats,
  loading,
  preselectedBetLevel = null // 预选的挑战等级
}) => {
  const [form] = Form.useForm();
  const [selectedCat, setSelectedCat] = useState(null);
  const [betLevel, setBetLevel] = useState(0);
  const [showBattleAnimation, setShowBattleAnimation] = useState(false);
  const [battleData, setBattleData] = useState(null);
  const [catPower, setCatPower] = useState(0);

  // 重置表单
  useEffect(() => {
    if (visible) {
      const initialBetLevel = preselectedBetLevel !== null ? preselectedBetLevel : 0;
      form.resetFields();
      form.setFieldsValue({ betLevel: initialBetLevel });
      setSelectedCat(null);
      setBetLevel(initialBetLevel);
    }
  }, [visible, form, preselectedBetLevel]);

  // 计算选中猫咪的战力值
  useEffect(() => {
    const calculatePower = () => {
      if (selectedCat) {
        try {
          // 解密猫咪属性并计算战力
          const stats = decryptCatStats(selectedCat.encrypted_stats, selectedCat.encrypted_stats_high, selectedCat.id);
          const totalPower = stats.attack + stats.defense + stats.health + stats.critical + stats.dodge + stats.luck;
          setCatPower(totalPower);
        } catch (error) {
          console.error('计算猫咪战力失败:', error);
          setCatPower(0);
        }
      } else {
        setCatPower(0);
      }
    };

    calculatePower();
  }, [selectedCat]);

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
    if (!selectedCat) return;

    form.validateFields().then(values => {
      // 如果有预选等级，使用预选等级，否则使用表单中的等级
      const finalBetLevel = preselectedBetLevel !== null ? preselectedBetLevel : values.betLevel;
      onConfirm(values.catId, finalBetLevel);
    });
  };

  // 品质颜色映射 - 与统计页面保持一致
  const QUALITY_COLORS = {
    0: '#8c8c8c',  // 普通 - 灰色
    1: '#52c41a',  // 精良 - 绿色
    2: '#1890ff',  // 卓越 - 蓝色
    3: '#722ed1',  // 非凡 - 紫色
    4: '#f5222d',  // 至尊 - 红色
    5: '#fa8c16',  // 神圣 - 橙色
    6: '#eb2f96',  // 永恒 - 粉色
    7: '#fadb14'   // 传世 - 金色
  };

  // 获取品质颜色
  const getQualityColor = (quality) => {
    return QUALITY_COLORS[quality] || QUALITY_COLORS[0];
  };

  const availableCats = getAvailableCats();

  // 获取当前显示的等级（预选等级优先）
  const currentBetLevel = preselectedBetLevel !== null ? preselectedBetLevel : betLevel;
  const betAmount = BET_LEVELS[currentBetLevel]?.amount || 2;

  // 获取当前bet_level的擂台数量
  const currentLevelArenaCount = arenaStats ? arenaStats[`level${currentBetLevel}Count`] || 0 : 0;

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#f5222d' }} />
          挑战擂台 - {BET_LEVELS[currentBetLevel]?.label}
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
     

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          betLevel: preselectedBetLevel !== null ? preselectedBetLevel : 0
        }}
      >
        {preselectedBetLevel !== null ? (
          // 预选等级时显示隐藏字段
          <Form.Item name="betLevel" style={{ display: 'none' }}>
            <input type="hidden" />
          </Form.Item>
        ) : (
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
              {BET_LEVELS.map(level => {
                const arenaCount = arenaStats ? arenaStats[`level${level.level}Count`] || 0 : 0;
                const canChallenge = arenaCount >= 3;

                return (
                  <Option key={level.level} value={level.level} disabled={!canChallenge}>
                    <Space>
                      <Tag color={level.color}>{level.label}</Tag>
                      <span>费用: {level.amount} DFS</span>
                      <span style={{ color: canChallenge ? '#52c41a' : '#f5222d' }}>
                        ({arenaCount} 个擂台)
                      </span>
                      {!canChallenge && <span style={{ color: '#f5222d' }}>需要至少3个</span>}
                    </Space>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        )}

        {/* 挑战等级信息 */}
        {(betLevel !== undefined || preselectedBetLevel !== null) && (
          <Card
            title="挑战信息"
            size="small"
            style={{
              marginBottom: 16,
              backgroundColor: BET_LEVELS[currentBetLevel]?.color + '10'
            }}
          >
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Statistic
                  title="挑战等级"
                  value={BET_LEVELS[currentBetLevel]?.label}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: BET_LEVELS[currentBetLevel]?.color, fontSize: 18 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="挑战费用"
                  value={BET_LEVELS[currentBetLevel]?.amount}
                  suffix="DFS"
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: 18 }}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                可用擂台: {currentLevelArenaCount} 个
                {currentLevelArenaCount < 3 && (
                  <span style={{ color: '#f5222d' }}> (需要至少3个才能挑战)</span>
                )}
              </Text>
            </div>
          </Card>
        )}
        {/* 选择挑战猫咪 */}
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
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 8, margin: '0 auto', display: 'block' }}
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
                      <Text type="secondary">战力: {catPower}</Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <ThunderboltOutlined style={{ fontSize: 36, color: '#faad14' }} />
                <div style={{ marginTop: 4, fontSize: 14, fontWeight: 'bold', color: '#333' }}>
                  VS
                </div>
              </div>
            </Col>

            <Col span={10}>
              <Card size="small" title="对手信息" style={{ height: '100%' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  textAlign: 'center'
                }}>
                  <QuestionCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                  <Text strong style={{ fontSize: 24, color: '#faad14', marginBottom: 8 }}>
                    
                  </Text>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>随机对手</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    系统将从相同等级的<br/>
                    擂台中随机选择对手
                  </div>
                </div>
              </Card>
            </Col>

          </Row>

          {selectedCat && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Alert
                message={
                  <Space>
                    <FireOutlined />
                    <span>
                      支付 <strong>{betAmount} DFS</strong> 挑战费用，
                      胜利可获得退还费用 + 97%的随机擂台奖池奖励！
                      失败时97%费用会加入擂台奖池。
                    </span>
                  </Space>
                }
                type="info"
                style={{ marginTop: 12 }}
              />
            </div>
          )}
        </>
      )}
      </Form>
    </Modal>
  );
};

export default ChallengeModal;
