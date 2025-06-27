import React, { useState, useEffect } from 'react';
import { Modal, Progress, Tag, Button } from 'antd';
import { 
  ThunderboltOutlined, 
  HeartOutlined, 
  TrophyOutlined,
  FireOutlined,
  SafetyOutlined,
  EyeOutlined,
  StarOutlined
} from '@ant-design/icons';
import CatRenderer from './CatRenderer';
import { QUALITY_NAMES, GENDER_NAMES } from '../utils/chainOperations';
import './BattleAnimation.css';

const BattleAnimation = ({ 
  visible, 
  challengerCat, 
  arenaCat, 
  challengerStats, 
  arenaStats, 
  battleResult, 
  onClose 
}) => {
  const [currentPhase, setCurrentPhase] = useState('intro'); // intro -> battle -> result
  const [challengerHP, setChallengerHP] = useState(100);
  const [arenaHP, setArenaHP] = useState(100);
  const [currentRound, setCurrentRound] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // 重置动画状态并自动开始战斗
  useEffect(() => {
    if (visible && challengerStats && arenaStats) {
      setCurrentPhase('intro');
      setChallengerHP(100);
      setArenaHP(100);
      setCurrentRound(0);
      setBattleLog([]);
      setIsAnimating(false);

      // 2秒后自动开始战斗
      const autoStartTimer = setTimeout(() => {
        startBattle();
      }, 2000);

      return () => clearTimeout(autoStartTimer);
    }
  }, [visible, challengerStats, arenaStats]);

  // 计算伤害
  const calculateDamage = (attacker, defender) => {
    const baseAttack = attacker.attack || 0;
    const defense = defender.defense || 0;
    const critical = attacker.critical || 0;
    const dodge = defender.dodge || 0;
    
    // 基础伤害计算
    let damage = Math.max(1, baseAttack - defense * 0.5);
    
    // 暴击判定 (暴击值/255 的概率)
    const criticalChance = critical / 255;
    const isCritical = Math.random() < criticalChance;
    if (isCritical) {
      damage *= 1.5;
    }
    
    // 闪避判定 (闪避值/255 的概率)
    const dodgeChance = dodge / 255;
    const isDodged = Math.random() < dodgeChance;
    if (isDodged) {
      damage = 0;
    }
    
    return {
      damage: Math.round(damage),
      isCritical,
      isDodged
    };
  };

  // 开始战斗动画
  const startBattle = () => {
    setCurrentPhase('battle');
    setIsAnimating(true);

    // 预先计算所有回合，确保至少5回合
    const generateBattleRounds = () => {
      const rounds = [];
      let challengerCurrentHP = 100;
      let arenaCurrentHP = 100;

      // 强制至少5回合，通过调整伤害来实现
      const minRounds = 5;
      const maxRounds = 8;

      for (let round = 1; round <= maxRounds; round++) {
        // 挑战者攻击
        let challengerAttack = calculateDamage(challengerStats, arenaStats);

        // 如果还没到最小回合数，减少伤害确保不会太早结束
        if (round < minRounds) {
          challengerAttack.damage = Math.min(challengerAttack.damage, Math.floor(arenaCurrentHP / (minRounds - round + 1)));
        }

        arenaCurrentHP = Math.max(0, arenaCurrentHP - challengerAttack.damage);

        rounds.push({
          round,
          attacker: 'challenger',
          ...challengerAttack,
          challengerHP: challengerCurrentHP,
          arenaHP: arenaCurrentHP
        });

        // 如果擂台猫咪死亡且已经达到最小回合数
        if (arenaCurrentHP <= 0 && round >= minRounds) {
          break;
        }

        // 擂台猫咪反击
        let arenaAttack = calculateDamage(arenaStats, challengerStats);

        // 如果还没到最小回合数，减少伤害确保不会太早结束
        if (round < minRounds) {
          arenaAttack.damage = Math.min(arenaAttack.damage, Math.floor(challengerCurrentHP / (minRounds - round + 1)));
        }

        challengerCurrentHP = Math.max(0, challengerCurrentHP - arenaAttack.damage);

        rounds.push({
          round,
          attacker: 'arena',
          ...arenaAttack,
          challengerHP: challengerCurrentHP,
          arenaHP: arenaCurrentHP
        });

        // 如果挑战者死亡且已经达到最小回合数
        if (challengerCurrentHP <= 0 && round >= minRounds) {
          break;
        }
      }

      // 确保最终结果符合battleResult
      const lastRound = rounds[rounds.length - 1];
      if (battleResult.winner === 'challenger' && lastRound.arenaHP > 0) {
        lastRound.arenaHP = 0;
      } else if (battleResult.winner !== 'challenger' && lastRound.challengerHP > 0) {
        lastRound.challengerHP = 0;
      }

      return rounds;
    };

    // 执行战斗动画
    const executeBattle = () => {
      const battleRounds = generateBattleRounds();
      let currentRoundIndex = 0;

      const battleInterval = setInterval(() => {
        if (currentRoundIndex >= battleRounds.length) {
          clearInterval(battleInterval);
          setCurrentPhase('result');
          setIsAnimating(false);
          return;
        }

        const currentRoundData = battleRounds[currentRoundIndex];

        // 更新状态
        setChallengerHP(currentRoundData.challengerHP);
        setArenaHP(currentRoundData.arenaHP);
        setCurrentRound(currentRoundData.round);

        // 更新战斗日志
        setBattleLog(prev => [...prev, {
          round: currentRoundData.round,
          attacker: currentRoundData.attacker,
          damage: currentRoundData.damage,
          isCritical: currentRoundData.isCritical,
          isDodged: currentRoundData.isDodged
        }]);

        currentRoundIndex++;

        // 如果有一方死亡，结束战斗
        if (currentRoundData.challengerHP <= 0 || currentRoundData.arenaHP <= 0) {
          setTimeout(() => {
            clearInterval(battleInterval);
            setCurrentPhase('result');
            setIsAnimating(false);
          }, 1000);
        }
      }, 2000); // 每2秒一个动作
    };

    setTimeout(executeBattle, 1000);
  };

  const renderIntroPhase = () => (
    <div style={{ textAlign: 'center', padding: '30px 20px' }}>
      <h2 style={{ marginBottom: '30px', color: '#1890ff' }}>⚔️ 擂台挑战即将开始！</h2>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        margin: '30px 0',
        minHeight: '280px',
        gap: '20px'
      }}>
        <div style={{
          flex: 1,
          textAlign: 'center',
          maxWidth: '200px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#52c41a' }}>挑战者</h3>
          <div style={{
            width: '140px',
            height: '140px',
            margin: '0 auto 20px',
            border: '3px solid #52c41a',
            borderRadius: '50%',
            padding: '15px',
            background: 'linear-gradient(135deg, #f6ffed, #d9f7be)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div style={{ width: '100%', height: '100%' }}>
              <CatRenderer gene={challengerCat.genes} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <Tag color="blue" style={{ fontSize: '12px', padding: '2px 6px', margin: '2px' }}>
              #{challengerCat.id}
            </Tag>
            <Tag color={challengerCat.gender === 0 ? 'geekblue' : 'magenta'} style={{ fontSize: '12px', padding: '2px 6px', margin: '2px' }}>
              {GENDER_NAMES[challengerCat.gender]}
            </Tag>
            <Tag color="gold" style={{ fontSize: '12px', padding: '2px 6px', margin: '2px' }}>
              {QUALITY_NAMES[challengerCat.quality]}
            </Tag>
          </div>
        </div>

        <div style={{
          flex: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '80px',
          height: '200px'
        }}>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#ff4d4f',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            marginBottom: '10px'
          }}>
            VS
          </div>
        </div>

        <div style={{
          flex: 1,
          textAlign: 'center',
          maxWidth: '200px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#f5222d' }}>擂台守护者</h3>
          <div style={{
            width: '140px',
            height: '140px',
            margin: '0 auto 20px',
            border: '3px solid #f5222d',
            borderRadius: '50%',
            padding: '15px',
            background: 'linear-gradient(135deg, #fff2f0, #ffccc7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div style={{ width: '100%', height: '100%' }}>
              <CatRenderer gene={arenaCat.genes} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <Tag color="blue" style={{ fontSize: '12px', padding: '2px 6px', margin: '2px' }}>
              #{arenaCat.id}
            </Tag>
            <Tag color={arenaCat.gender === 0 ? 'geekblue' : 'magenta'} style={{ fontSize: '12px', padding: '2px 6px', margin: '2px' }}>
              {GENDER_NAMES[arenaCat.gender]}
            </Tag>
            <Tag color="gold" style={{ fontSize: '12px', padding: '2px 6px', margin: '2px' }}>
              {QUALITY_NAMES[arenaCat.quality]}
            </Tag>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)',
        borderRadius: '8px',
        border: '1px solid #91d5ff'
      }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#1890ff' }}>
          🎯 战斗即将自动开始，请准备观战！
        </p>
      </div>
    </div>
  );

  const renderBattlePhase = () => (
    <div style={{ padding: '30px 20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        marginBottom: '30px',
        minHeight: '220px',
        gap: '15px'
      }}>
        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '15px',
          background: challengerHP > 50 ? 'linear-gradient(135deg, #f6ffed, #d9f7be)' : 'linear-gradient(135deg, #fff2f0, #ffccc7)',
          borderRadius: '12px',
          border: `3px solid ${challengerHP > 50 ? '#52c41a' : '#ff7875'}`,
          transition: 'all 0.3s ease',
          maxWidth: '200px'
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 15px',
            transform: isAnimating && currentRound % 2 === 1 ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div style={{ width: '100%', height: '100%' }}>
              <CatRenderer gene={challengerCat.genes} />
            </div>
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
            挑战者
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Tag color="blue" style={{ fontSize: '11px', padding: '1px 4px', margin: '1px' }}>
              #{challengerCat.id}
            </Tag>
            <Tag color={challengerCat.gender === 0 ? 'geekblue' : 'magenta'} style={{ fontSize: '11px', padding: '1px 4px', margin: '1px' }}>
              {GENDER_NAMES[challengerCat.gender]}
            </Tag>
            <Tag color="gold" style={{ fontSize: '11px', padding: '1px 4px', margin: '1px' }}>
              {QUALITY_NAMES[challengerCat.quality]}
            </Tag>
          </div>
          <Progress
            percent={challengerHP}
            strokeColor={challengerHP > 50 ? "#52c41a" : "#ff4d4f"}
            format={() => `${challengerHP}%`}
            strokeWidth={8}
          />
        </div>

        <div style={{
          flex: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '100px',
          height: '180px'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1890ff',
            marginBottom: '10px'
          }}>
            第 {currentRound} 回合
          </div>
          {isAnimating && (
            <div className="battle-vs-text" style={{
              fontSize: '16px',
              color: '#ff4d4f',
              textAlign: 'center'
            }}>
              ⚔️ 激烈战斗中...
            </div>
          )}
        </div>

        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '15px',
          background: arenaHP > 50 ? 'linear-gradient(135deg, #fff2f0, #ffccc7)' : 'linear-gradient(135deg, #f6ffed, #d9f7be)',
          borderRadius: '12px',
          border: `3px solid ${arenaHP > 50 ? '#f5222d' : '#52c41a'}`,
          transition: 'all 0.3s ease',
          maxWidth: '200px'
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 15px',
            transform: isAnimating && currentRound % 2 === 0 ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div style={{ width: '100%', height: '100%' }}>
              <CatRenderer gene={arenaCat.genes} />
            </div>
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
            守护者
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Tag color="blue" style={{ fontSize: '11px', padding: '1px 4px', margin: '1px' }}>
              #{arenaCat.id}
            </Tag>
            <Tag color={arenaCat.gender === 0 ? 'geekblue' : 'magenta'} style={{ fontSize: '11px', padding: '1px 4px', margin: '1px' }}>
              {GENDER_NAMES[arenaCat.gender]}
            </Tag>
            <Tag color="gold" style={{ fontSize: '11px', padding: '1px 4px', margin: '1px' }}>
              {QUALITY_NAMES[arenaCat.quality]}
            </Tag>
          </div>
          <Progress
            percent={arenaHP}
            strokeColor={arenaHP > 50 ? "#f5222d" : "#ff4d4f"}
            format={() => `${arenaHP}%`}
            strokeWidth={8}
          />
        </div>
      </div>

      {/* 战斗日志 */}
      <div style={{
        maxHeight: '150px',
        overflowY: 'auto',
        border: '1px solid #d9d9d9',
        padding: '15px',
        borderRadius: '8px',
        background: '#fafafa'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1890ff' }}>⚔️ 战斗记录</h4>
        {battleLog.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            战斗即将开始...
          </div>
        ) : (
          battleLog.map((log, index) => (
            <div key={index} style={{
              marginBottom: '8px',
              fontSize: '13px',
              padding: '5px 10px',
              background: log.attacker === 'challenger' ? '#e6f7ff' : '#fff2f0',
              borderRadius: '4px',
              borderLeft: `3px solid ${log.attacker === 'challenger' ? '#1890ff' : '#f5222d'}`
            }}>
              <strong>{log.attacker === 'challenger' ? '🐱 挑战者' : '🛡️ 守护者'}</strong>
              {log.isDodged ? ' 的攻击被闪避了！✨' :
               log.isCritical ? ` 发动暴击造成 ${log.damage} 点伤害！💥` :
               ` 造成 ${log.damage} 点伤害`}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderResultPhase = () => {
    const winner = challengerHP > 0 ? 'challenger' : 'arena';
    const isVictory = winner === 'challenger';
    
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h3 style={{ color: isVictory ? '#52c41a' : '#f5222d' }}>
          {isVictory ? '🎉 挑战成功！' : '😔 挑战失败'}
        </h3>
        
        <div style={{ margin: '20px 0' }}>
          {isVictory ? (
            <div>
              <p>🏆 恭喜！你的猫咪成功击败了擂台守护者！💰</p>
              
            </div>
          ) : (
            <div>
              <p>💪 虽然失败了，但你的猫咪表现得很勇敢！</p>
              <p>🔄 继续训练，下次一定能成功！</p>
            </div>
          )}
        </div>
        
        <Button type="primary" onClick={onClose}>
          确定
        </Button>
      </div>
    );
  };

  if (!visible || !challengerCat || !arenaCat) {
    return null;
  }

  return (
    <Modal
      title="⚔️ 擂台挑战"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      styles={{
        body: { padding: '10px' }
      }}
    >
      {currentPhase === 'intro' && renderIntroPhase()}
      {currentPhase === 'battle' && renderBattlePhase()}
      {currentPhase === 'result' && renderResultPhase()}
    </Modal>
  );
};

export default BattleAnimation;
