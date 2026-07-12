import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { mathCurriculum } from '../curriculum/mathCurriculum';
import { SKILL_METADATA } from '../curriculum/mathSkillCopy';
import { calculateSkillMastery } from '../../analytics/mathAnalytics';
import MathSkillDetail from './MathSkillDetail';

export default function MathSkillMatrix() {
  const store = useGameStore();
  const unlockedSkills = store.math?.unlockedSkillIds || [];
  const mathAttempts = store.analytics?.mathAttempts || [];
  
  const [selectedSkill, setSelectedSkill] = useState(null);

  if (selectedSkill) {
    return <MathSkillDetail skillId={selectedSkill} onBack={() => setSelectedSkill(null)} />;
  }

  // Group attempts by skill for quick lookup
  const attemptsBySkill = {};
  mathAttempts.forEach(a => {
    if (!attemptsBySkill[a.skillId]) attemptsBySkill[a.skillId] = [];
    attemptsBySkill[a.skillId].push(a);
  });

  const getBadgeStyle = (mastery) => {
    switch(mastery) {
      case 'mastered': return { bg: '#d1fae5', color: '#047857', text: '⭐️ 已掌握' };
      case 'competent': return { bg: '#dbeafe', color: '#1d4ed8', text: '📘 熟練' };
      case 'developing': return { bg: '#fef3c7', color: '#b45309', text: '🌱 發展中' };
      case 'beginning': return { bg: '#f1f5f9', color: '#64748b', text: '🐣 起步' };
      case 'needs_review': return { bg: '#fee2e2', color: '#b91c1c', text: '⚠️ 需溫習' };
      default: return { bg: '#f8fafc', color: '#94a3b8', text: '🔒 未開始' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {mathCurriculum.map(unit => {
        const unitSkills = unit.skills;
        // Don't show fully locked units to avoid clutter
        const isUnitUnlocked = unitSkills.some(id => unlockedSkills.includes(id));
        if (!isUnitUnlocked) return null;

        return (
          <div key={unit.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: unit.color }}>
              <span>{unit.emoji}</span> {unit.titleZh} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>({unit.title})</span>
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {unitSkills.map(skillId => {
                const isUnlocked = unlockedSkills.includes(skillId);
                const metadata = SKILL_METADATA[skillId];
                const history = attemptsBySkill[skillId] || [];
                const mastery = isUnlocked ? calculateSkillMastery(history) : 'not_started';
                const badge = getBadgeStyle(mastery);
                
                // Calculate accuracy for the display
                const completions = history.filter(a => a.isCorrect !== undefined);
                const recentCompletions = completions.slice(-5);
                const accuracy = recentCompletions.length > 0 
                  ? Math.round((recentCompletions.filter(a => a.attemptNumber === 1 && a.isCorrect).length / recentCompletions.length) * 100)
                  : 0;

                return (
                  <div 
                    key={skillId}
                    onClick={() => isUnlocked && setSelectedSkill(skillId)}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      border: `1px solid ${isUnlocked ? '#e2e8f0' : '#f1f5f9'}`,
                      background: isUnlocked ? '#f8fafc' : '#f8fafc',
                      opacity: isUnlocked ? 1 : 0.6,
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (isUnlocked) {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isUnlocked) {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                        {metadata?.titleZh || skillId}
                      </strong>
                      {isUnlocked && (
                        <span style={{ 
                          background: badge.bg, 
                          color: badge.color, 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '100px', 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold' 
                        }}>
                          {badge.text}
                        </span>
                      )}
                    </div>
                    
                    {isUnlocked && history.length > 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Recent Accuracy: {accuracy}%</span>
                        <span>{Math.min(5, completions.length)}/5 tested</span>
                      </div>
                    )}
                    
                    {isUnlocked && history.length === 0 && (
                      <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                        Yet to practice
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
