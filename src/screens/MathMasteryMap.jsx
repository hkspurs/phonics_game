import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, X, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import MathMascot from '../math/components/MathMascot';
import { mathCurriculum, SKILL_LABELS, SKILL_EMOJIS, isUnitUnlocked } from '../math/curriculum/mathCurriculum';
import { mathQuestionEngine } from '../math/engine/MathQuestionEngine';
import { createRandom } from '../math/engine/random';
import { useTranslation } from '../hooks/useTranslation';

export default function MathMasteryMap() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { 
    getMathSkillStatus,
    startMathSession
  } = useGameStore();

  const [selectedSkill, setSelectedSkill] = useState(null);

  const MAP_WIDTH = 1200;
  const MAP_HEIGHT = 800;

  const handleSkillClick = (skillId, unit) => {
    const status = getMathSkillStatus(skillId);
    if (!isUnitUnlocked(unit, getMathSkillStatus) && status === 'locked') return;
    
    setSelectedSkill({
      id: skillId,
      unit: unit,
      status: status
    });
  };

  const handlePractice = () => {
    if (!selectedSkill) return;
    // Generate a quick 5-question training session
    const questions = [];
    for(let i=0; i<5; i++) {
      const q = mathQuestionEngine.generateQuestion(selectedSkill.id, {
        difficulty: selectedSkill.status === 'mastered' ? 3 : (selectedSkill.status === 'weak' ? 1 : 2),
        random: createRandom(Date.now() + i)
      });
      if(q) questions.push(q);
    }
    
    startMathSession(questions);
    navigate('/math/gym');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'mastered': return '#f59e0b'; // Amber
      case 'unlocked': return '#10b981'; // Emerald
      case 'weak': return '#8b5cf6'; // Violet
      default: return '#9ca3b8'; // Gray
    }
  };

  // Generate node coordinates dynamically based on curriculum
  let currentX = 150;
  let currentY = 400;
  
  const nodes = [];
  const paths = [];

  mathCurriculum.forEach((unit, unitIdx) => {
    const isUnlocked = isUnitUnlocked(unit, getMathSkillStatus);
    
    unit.skills.forEach((skillId, skillIdx) => {
      const status = isUnlocked ? getMathSkillStatus(skillId) : 'locked';
      const node = {
        id: skillId,
        unit: unit,
        status: status,
        x: currentX,
        y: currentY + (skillIdx % 2 === 0 ? -80 : 80),
      };
      nodes.push(node);
      currentX += 160;
    });

    // Add path
    if (unitIdx < mathCurriculum.length - 1) {
      currentX += 80;
    }
  });

  const generatePath = () => {
    if (nodes.length === 0) return '';
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i-1];
      const curr = nodes[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  return (
    <div className="screen-container" style={{ background: '#fef3c7', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/math')}>
          <ArrowLeft size={24} /> {t('back')}
        </button>
      </div>
      <h1 style={{ textAlign: 'center', color: '#b45309', fontSize: '2.5rem', marginTop: '1rem', zIndex: 10, position: 'relative' }}>
        {t('masteryMap')}
      </h1>

      <style>{`
        @keyframes active-node-pulse {
          0% { box-shadow: 0 8px 0 #10b981, 0 0 0 0px rgba(16, 185, 129, 0.6); transform: translateY(-4px) scale(1); }
          50% { box-shadow: 0 8px 0 #10b981, 0 0 0 20px rgba(16, 185, 129, 0); transform: translateY(-4px) scale(1.05); }
          100% { box-shadow: 0 8px 0 #10b981, 0 0 0 0px rgba(16, 185, 129, 0); transform: translateY(-4px) scale(1); }
        }
        @keyframes weak-node-pulse {
          0% { box-shadow: 0 8px 0 #8b5cf6, 0 0 0 0px rgba(139, 92, 246, 0.6); transform: translateY(-4px) scale(1); }
          50% { box-shadow: 0 8px 0 #8b5cf6, 0 0 0 20px rgba(139, 92, 246, 0); transform: translateY(-4px) scale(1.05); }
          100% { box-shadow: 0 8px 0 #8b5cf6, 0 0 0 0px rgba(139, 92, 246, 0); transform: translateY(-4px) scale(1); }
        }
      `}</style>

      {/* Scrollable Map Area */}
      <div style={{ 
        position: 'relative', width: '100%', flex: 1, marginTop: '1rem', 
        border: '6px solid #fcd34d', borderRadius: '32px', overflowX: 'auto', overflowY: 'auto', 
        background: 'linear-gradient(to bottom, #dbeafe, #fef3c7)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' 
      }}>
        <div style={{ position: 'relative', width: `${Math.max(1200, currentX + 200)}px`, height: `${MAP_HEIGHT}px` }}>
          
          <svg width="100%" height={MAP_HEIGHT} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}>
            <path d={generatePath()} fill="none" stroke="#cbd5e1" strokeWidth="16" strokeDasharray="1 30" strokeLinecap="round" />
            <path d={generatePath()} fill="none" stroke="#fbbf24" strokeWidth="16" strokeDasharray="1 30" strokeLinecap="round" className="map-path-animate" />
          </svg>

          {nodes.map(node => (
            <div key={node.id} style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* Unit Title (above the first skill of the unit) */}
              {node.id === node.unit.skills[0] && (
                <div style={{
                  position: 'absolute', top: '-100px',
                  background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem',
                  borderRadius: '16px', fontWeight: 'bold', color: node.unit.color,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  whiteSpace: 'nowrap', zIndex: 10
                }}>
                  {node.unit.emoji} {language === 'zh' ? node.unit.titleZh : node.unit.title}
                </div>
              )}

              {/* Node Button */}
              <button 
                onClick={() => handleSkillClick(node.id, node.unit)}
                style={{
                  width: '80px', height: '80px',
                  borderRadius: '50%',
                  background: node.status === 'locked' ? '#f1f5f9' : 'white',
                  border: `6px solid ${getStatusColor(node.status)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem',
                  cursor: node.status === 'locked' ? 'not-allowed' : 'pointer',
                  boxShadow: node.status === 'locked' ? 'none' : `0 8px 0 ${getStatusColor(node.status)}`,
                  transform: node.status === 'locked' ? 'none' : 'translateY(-4px)',
                  transition: 'transform 0.2s',
                  animation: node.status === 'unlocked' ? 'active-node-pulse 2s infinite' : (node.status === 'weak' ? 'weak-node-pulse 2s infinite' : 'none')
                }}
              >
                {node.status === 'locked' ? <Lock size={32} color="#9ca3b8" /> : SKILL_EMOJIS[node.id]}
              </button>
              <div style={{
                  marginTop: '1rem',
                  fontSize: '1.2rem', fontWeight: 'bold', pointerEvents: 'none',
                  color: node.status === 'locked' ? '#94A3B8' : '#b45309',
                  textAlign: 'center', width: '120px'
              }}>
                {SKILL_LABELS[node.id]?.[language] || node.id}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Modal */}
      {selectedSkill && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'popIn 0.3s', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <button className="btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={() => setSelectedSkill(null)}>
              <X size={28} />
            </button>
            
            <h2 style={{ color: '#b45309', fontSize: '2.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {SKILL_EMOJIS[selectedSkill.id]} {SKILL_LABELS[selectedSkill.id]?.[language]}
            </h2>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '2rem', marginBottom: '1rem' }}>
              {selectedSkill.status === 'mastered' ? '⭐⭐⭐' : (selectedSkill.status === 'unlocked' ? '⭐☆☆' : '☆☆☆')}
            </div>

            <p style={{ color: '#475569', fontSize: '1.25rem', marginBottom: '2rem', fontWeight: 'bold' }}>
              {selectedSkill.status === 'mastered' 
                ? t('mapMastered') 
                : selectedSkill.status === 'weak'
                  ? t('mapNeedsPractice').replace('{skill}', SKILL_LABELS[selectedSkill.id]?.[language])
                  : t('mapLearn')}
            </p>

            <button className="btn-primary" style={{ width: '100%', fontSize: '1.5rem', padding: '1rem', justifyContent: 'center' }} onClick={handlePractice}>
              {selectedSkill.status === 'weak' ? (
                <>🏋️‍♂️ {t('toTheGym')}</>
              ) : (
                <><Play size={28} fill="currentColor" /> {t('go')}</>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
