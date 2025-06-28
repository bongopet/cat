import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  message,
  Statistic,
  Table,
  Space,
  Typography,
  Divider,
  Alert,
  Spin,
  Tag,
  Modal
} from 'antd';
import {
  UserAddOutlined,
  TeamOutlined,
  DollarOutlined,
  CopyOutlined,
  ReloadOutlined,
  GiftOutlined,
  PlusOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { sendTransaction, getTableRows } from '../utils/eosUtils';
import { getUserPermission } from '../utils/permissionManager';
import { createInviteCode, bindInviteCode } from '../utils/chainOperations';
import { formatTime } from '../utils/timeUtils';
import './InvitationSystem.css';

const { Text, Paragraph } = Typography;
const CONTRACT = 'ifwzjalq2lg1'; // 合约地址

const InvitationSystem = ({ DFSWallet, userInfo }) => {
  const [loading, setLoading] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteList, setInviteList] = useState([]);
  const [userInviteCodes, setUserInviteCodes] = useState([]);
  const [bindingCode, setBindingCode] = useState(false);
  const [creatingCode, setCreatingCode] = useState(false);
  const [showInviteHelp, setShowInviteHelp] = useState(false);

  // 获取邀请信息
  const fetchInviteInfo = async () => {
    if (!DFSWallet || !userInfo) return;

    try {
      setLoading(true);
      
      // 查询用户信息
      const users = await getTableRows(
        DFSWallet,
        CONTRACT,
        CONTRACT,
        'newuser22s',
        userInfo.name,
        userInfo.name,
        1,
        'name',
        1
      );

      if (users && users.length > 0) {
        const userRecord = users[0];
        setInviteInfo({
          user: userRecord.user,
          inviteCode: userRecord.invite_code || 0,
          invitedCount: userRecord.invited_count || 0,
          totalCommission: userRecord.total_commission || '0.00000000 DFS'
        });

        // 获取用户创建的邀请码
        await fetchUserInviteCodes();
      } else {
        setInviteInfo({
          user: userInfo.name,
          inviteCode: 0,
          invitedCount: 0,
          totalCommission: '0.00000000 DFS'
        });
      }
    } catch (error) {
      console.error('获取邀请信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取用户创建的邀请码
  const fetchUserInviteCodes = async () => {
    if (!DFSWallet || !userInfo) return;

    try {
      // 查询用户创建的邀请码 - 使用bycreator索引
      const codes = await getTableRows(
        DFSWallet,
        CONTRACT,
        CONTRACT,
        'invitecodes',
        userInfo.name,
        userInfo.name,
        2, // 使用bycreator索引
        'name',
        100
      );

      if (codes) {
        // 按创建时间倒序排列，最新的在前面
        const sortedCodes = codes.sort((a, b) => b.created_at - a.created_at);
        setUserInviteCodes(sortedCodes);
        console.log('获取到用户邀请码:', sortedCodes);

        // 立即获取邀请列表，传入刚获取的邀请码数据
        setTimeout(() => {
          fetchInviteListWithCodes(sortedCodes);
        }, 100);
      } else {
        setUserInviteCodes([]);
        // 即使没有邀请码也要查询邀请列表
        setTimeout(() => {
          fetchInviteListWithCodes([]);
        }, 100);
      }
    } catch (error) {
      console.error('获取邀请码失败:', error);
      // 如果索引查询失败，尝试全表查询并过滤
      try {
        const allCodes = await getTableRows(
          DFSWallet,
          CONTRACT,
          CONTRACT,
          'invitecodes',
          '',
          '',
          1, // 主索引
          'i64',
          1000
        );

        if (allCodes) {
          const userCodes = allCodes.filter(code => code.creator === userInfo.name);
          const sortedCodes = userCodes.sort((a, b) => b.created_at - a.created_at);
          setUserInviteCodes(sortedCodes);
          console.log('通过过滤获取到用户邀请码:', sortedCodes);

          // 立即获取邀请列表，传入刚获取的邀请码数据
          setTimeout(() => {
            fetchInviteListWithCodes(sortedCodes);
          }, 100);
        }
      } catch (fallbackError) {
        console.error('备用查询也失败:', fallbackError);
        setUserInviteCodes([]);
        // 查询失败时也要尝试获取邀请列表
        setTimeout(() => {
          fetchInviteListWithCodes([]);
        }, 100);
      }
    }
  };

  // 获取邀请列表（查询使用了用户邀请码的用户）
  const fetchInviteListWithCodes = async (codes = null) => {
    if (!DFSWallet || !userInfo) return;

    try {
      console.log('开始获取邀请列表，当前用户:', userInfo.name);

      // 使用传入的邀请码或当前状态中的邀请码
      const userCodes = codes || userInviteCodes;
      console.log('当前用户的邀请码:', userCodes);

      if (!userCodes || userCodes.length === 0) {
        setInviteList([]);
        console.log('用户没有创建邀请码，清空邀请列表');
        return;
      }

      // 查询 newuser22s 表，获取所有用户信息
      const allUsers = await getTableRows(
        DFSWallet,
        CONTRACT,
        CONTRACT,
        'newuser22s',
        '',
        '',
        1, // 使用主索引
        'name',
        1000
      );

      console.log('查询到的所有用户:', allUsers);

      if (allUsers) {
        // 过滤出使用了当前用户邀请码的用户
        const invitedUsers = allUsers.filter(user => {
          // 检查用户是否绑定了邀请码，且邀请码属于当前用户
          return user.invite_code && user.invite_code > 0 &&
                 userCodes.some(code => code.code === user.invite_code);
        });

        setInviteList(invitedUsers);
        console.log('过滤后的邀请列表:', invitedUsers);
      } else {
        setInviteList([]);
        console.log('没有查询到用户数据');
      }
    } catch (error) {
      console.error('获取邀请列表失败:', error);
      setInviteList([]);
    }
  };

  // 获取邀请列表（使用当前的邀请码）
  const fetchInviteList = async () => {
    await fetchInviteListWithCodes();
  };

  // 创建邀请码
  const handleCreateInviteCode = async () => {
    if (!DFSWallet || !userInfo) {
      message.warning('请先连接钱包');
      return;
    }

    try {
      setCreatingCode(true);
      const result = await createInviteCode(DFSWallet, userInfo);

      // 刷新邀请信息和邀请码列表
      await fetchInviteInfo();
      await fetchUserInviteCodes();

      message.success('邀请码创建成功！请查看下方的邀请码列表');
    } catch (error) {
      console.error('创建邀请码失败:', error);

      if (error.message.includes('DFS余额不足')) {
        message.error('DFS余额不足，创建邀请码需要5 DFS');
      } else if (error.message.includes('must have at least one cat')) {
        message.error('您必须至少拥有一只猫咪才能创建邀请码');
      } else if (error.message.includes('already created')) {
        message.error('您已经创建过邀请码了');
      } else {
        message.error('创建邀请码失败: ' + (error.message || String(error)));
      }
    } finally {
      setCreatingCode(false);
    }
  };

  // 绑定邀请码
  const handleBindInviteCode = async () => {
    if (!DFSWallet || !userInfo) {
      message.warning('请先连接钱包');
      return;
    }

    if (!inviteCodeInput.trim()) {
      message.warning('请输入邀请码');
      return;
    }

    const codeNumber = parseInt(inviteCodeInput.trim());
    if (isNaN(codeNumber) || codeNumber <= 0) {
      message.error('请输入有效的邀请码数字');
      return;
    }

    try {
      setBindingCode(true);
      await bindInviteCode(DFSWallet, userInfo, codeNumber);

      // 刷新邀请信息
      await fetchInviteInfo();
      setInviteCodeInput('');
    } catch (error) {
      console.error('绑定邀请码失败:', error);

      if (error.message.includes('already bound')) {
        message.error('您已经绑定过邀请码了');
      } else if (error.message.includes('Invalid invite code')) {
        message.error('无效的邀请码');
      } else if (error.message.includes('Cannot use your own invite code')) {
        message.error('不能使用自己的邀请码');
      } else {
        message.error('绑定邀请码失败: ' + (error.message || String(error)));
      }
    } finally {
      setBindingCode(false);
    }
  };

  // 复制邀请码链接
  const copyInviteCode = (code) => {
    const inviteLink = `${window.location.origin}?code=${code}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      message.success('邀请链接已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  // 邀请列表表格列定义
  const inviteColumns = [
    {
      title: '用户名',
      dataIndex: 'user',
      key: 'user',
      render: (text) => <Text strong>{text}</Text>
    },
    // {
    //   title: '使用邀请码',
    //   dataIndex: 'invite_code',
    //   key: 'invite_code',
    //   render: (code) => (
    //     <Tag color="blue">
    //       {code || '无'}
    //     </Tag>
    //   )
    // },
    {
      title: '是否领取猫咪',
      dataIndex: 'has_received_cat',
      key: 'has_received_cat',
      render: (received) => (
        <Tag color={received ? 'green' : 'orange'}>
          {received ? '已领取' : '未领取'}
        </Tag>
      )
    },
    {
      title: '交易获得猫咪',
      dataIndex: 'cats_from_swap',
      key: 'cats_from_swap',
      render: (count) => <Text>{count || 0} 只</Text>
    }
  ];

  useEffect(() => {
    if (DFSWallet && userInfo) {
      console.log('useEffect触发，开始加载邀请数据...');
      fetchInviteInfo();
      fetchUserInviteCodes(); // 这个函数内部会自动调用fetchInviteList
    }
  }, [DFSWallet, userInfo]);

  // 检查URL参数中是否有邀请码信息
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl && !inviteInfo?.inviteCode) {
      setInviteCodeInput(codeFromUrl);
    }
  }, [inviteInfo]);

  if (!userInfo) {
    return (
      <Card>
        <Alert
          message="请先连接钱包"
          description="连接钱包后即可查看和管理邀请关系"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div className="invitation-system">
      {/* 标题和操作区域 */}
      <div style={{ marginBottom: 24 }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', color: 'white' }}>
              <TeamOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              邀请系统
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              邀请好友加入，获得交易佣金奖励
            </p>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchInviteInfo}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Space>
      </div>

      {/* 主要内容区域 */}
      <Card>
        <Row gutter={[16, 16]} align="stretch">
          {/* 邀请统计 */}
          <Col xs={24} lg={12}>
            <Card
              title="我的邀请统计"
              loading={loading}
              style={{ height: '100%', minHeight: '220px' }}
            >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="邀请人数"
                  value={inviteInfo?.invitedCount || 0}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="累计佣金"
                  value={parseFloat((inviteInfo?.totalCommission || '0.00000000 DFS').split(' ')[0]).toFixed(2)}
                  suffix="DFS"
                  prefix={<DollarOutlined />}
                />
              </Col>
            </Row>

            {inviteInfo?.inviteCode ? (
              <>
                <Alert
                  message={`您使用的邀请码: ${inviteInfo.inviteCode}`}
                  type="success"
                  showIcon
                />
                {/* <Divider /> */}
              </>
            ) : (
              <>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>绑定邀请码，享受更多福利</Text>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      style={{ width: 'calc(100% - 80px)' }}
                      placeholder="输入邀请码"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      onPressEnter={handleBindInviteCode}
                    />
                    <Button
                      type="primary"
                      icon={<UserAddOutlined />}
                      loading={bindingCode}
                      onClick={handleBindInviteCode}
                    >
                      绑定
                    </Button>
                  </Space.Compact>
                </Space>
                {/* <Divider /> */}
              </>
            )}
          </Card>
        </Col>

        {/* 邀请码管理 */}
        <Col xs={24} lg={12}>
          <Card
            style={{ height: '100%', minHeight: '220px' }}
            title={
              <Space>
                我的邀请码
                <QuestionCircleOutlined
                  style={{ color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => setShowInviteHelp(true)}
                />
              </Space>
            }
      
          >
            {userInviteCodes.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
               
                {userInviteCodes.map(code => (
                  <div key={code.code} style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
                    borderRadius: '8px'
                  }}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space direction="vertical" size={4}>
                            <Text strong style={{ fontSize: '20px', color: '#1890ff' }}>
                              邀请码: {code.code}
                            </Text>
       
                          </Space>
                        </Col>
                     
                      </Row>

                      {/* 邀请链接显示 */}
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                          邀请链接:
                        </Text>
                        <Space.Compact style={{ width: '100%' }}>
                          <Input
                            value={`${window.location.origin}?code=${code.code}`}
                            readOnly
                            style={{
                              fontSize: '12px',
                              backgroundColor: '#f5f5f5'
                            }}
                          />
                          <Button
                            type="primary"
                            icon={<CopyOutlined />}
                            onClick={() => copyInviteCode(code.code)}
                          >
                            复制链接
                          </Button>
                        </Space.Compact>
                      </div>
                    </Space>
                  </div>
                ))}

              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Space direction="vertical" size={16}>
                  {/* <div style={{ fontSize: '48px', color: '#d9d9d9' }}>
                    🎫
                  </div> */}
                  <Text type="secondary">您还没有创建邀请码</Text>
                  {/* <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建邀请码需要支付5个DFS，每个用户只能创建一个邀请码
                  </Text> */}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    loading={creatingCode}
                    onClick={handleCreateInviteCode}
                    size="large"
                  >
                    创建我的邀请码 (5 DFS)
                  </Button>
                </Space>
              </div>
            )}

            {/* <Divider /> */}

          </Card>
        </Col>
      </Row>

      {/* 邀请列表 */}
      {inviteInfo?.invitedCount > 0 && (
        <Card
          title={`我邀请的用户 (${inviteList.length})`}
          style={{ marginTop: 16 }}
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchInviteList}
              loading={loading}
            >
              刷新
            </Button>
          }
        >
          <Table
            columns={inviteColumns}
            dataSource={inviteList}
            rowKey="user"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
            loading={loading}
          />
        </Card>
      )}
      </Card>

      {/* 邀请说明Modal */}
      <Modal
        title={
          <Space>
            <GiftOutlined style={{ color: '#1890ff' }} />
            邀请奖励说明
          </Space>
        }
        open={showInviteHelp}
        onCancel={() => setShowInviteHelp(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowInviteHelp(false)}>
            我知道了
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                🎯 如何获得邀请奖励？
              </Text>
              <div style={{ marginTop: '8px', lineHeight: '1.6' }}>
                <Text>
                  当使用您邀请码的用户在市场购买猫咪时，您将获得交易金额 <Text strong style={{ color: '#f5222d' }}>5%</Text> 的DFS佣金奖励！
                </Text>
              </div>
            </div>

            <div>
              <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                💰 邀请码特点
              </Text>
              <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>每个用户只能创建一个邀请码</li>
                <li>创建邀请码需要支付5个DFS</li>
                <li>邀请关系一旦绑定无法修改</li>
              </ul>
            </div>

            <div>
              <Text strong style={{ fontSize: '16px', color: '#722ed1' }}>
                📋 使用方法
              </Text>
              <ol style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>创建您的邀请码</li>
                <li>复制邀请链接分享给朋友</li>
                <li>朋友通过链接访问并绑定邀请码</li>
                <li>朋友购买猫咪时您自动获得5%佣金</li>
              </ol>
            </div>

            <Alert
              message="温馨提示"
              description="邀请奖励会在用户购买猫咪时自动发放到您的账户，无需手动领取。"
              type="info"
              showIcon
            />
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default InvitationSystem;
