import React, { useState } from 'react';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { SKILL_METADATA } from '../curriculum/mathSkillCopy';
import { calculateSkillMastery } from '../../analytics/mathAnalytics';
import MathQuestionRenderer from '../renderers/MathQuestionRenderer';
import { useNavigate } from 'react-router-dom';

export default function MathSkillDetail({ skillId, onBack }) {
  const store = useGameStore();
  const navigate = useNavigate();
  const metadata = SKILL_METADATA[skillId];
  
  const allAttempts = store.analytics?.mathAttempts || [];
  const history = allAttempts.filter(a => a.skillId === skillId);
  const mastery = calculateSkillMastery(history);

  // Derive stats
  const completions = history.filter(a => a.isCorrect !== undefined);
  const recentCompletions = completions.slice(-5);
  const accuracy = recentCompletions.length > 0 
    ? Math.round((recentCompletions.filter(a => a.attemptNumber === 1 && a.isCorrect).length / recentCompletions.length) * 100)
    : 0;

  const avgHints = recentCompletions.length > 0
    ? (recentCompletions.reduce((sum, a) => sum + (a.hintLevel || 0), 0) / recentCompletions.length).toFixed(1)
    : 0;

  const [sampleQuestion] = useState(() => metadata.sampleQuestionFactory());

  const handlePractice = () => {
    // Generate a targeted session for this skill
    const questions = [];
    for (let i = 0; i < 5; i++) {
      questions.push(metadata.sampleQuestionFactory());
    }
    store.startMathSession(questions);
    navigate('/math/gym'); // Let's pretend there's a route for practice or we reuse the gym
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button 
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: 0 }}
      >
        <ArrowLeft size={20} /> 返回技能總覽
      </button>

      <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0', color: '#0f172a' }}>
          {metadata.titleZh}
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
          {metadata.parentDescriptionZh}
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{ flex: 1, minWidth: '150px', background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>狀態</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{mastery.replace('_', ' ').toUpperCase()}</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>近期準確率</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{accuracy}%</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: '#f8fafc', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>平均提示次數</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{avgHints}</div>
          </div>
        </div>

        <button 
          onClick={handlePractice}
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
        >
          <Play size={20} /> 安排此技能針對練習
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#334155' }}>示例題型</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
            小朋友在遊戲中會遇到類似這樣的題目。你可以嘗試點擊操作。
          </p>
          <div style={{ pointerEvents: 'none', transform: 'scale(0.8)', transformOrigin: 'top left' }}>
            {/* Render a read-only or mocked version of the question */}
            <MathQuestionRenderer question={sampleQuestion} onAnswer={() => {}} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '300px', background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#334155' }}>解題提示</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sampleQuestion.explanation?.steps?.map((step, idx) => (
              <li key={idx} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#e0f2fe', color: '#0369a1', width: '24px', height: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ color: '#475569', lineHeight: 1.5 }}>
                  {step.zh}
                </div>
              </li>
            ))}
            {(!sampleQuestion.explanation || !sampleQuestion.explanation.steps) && (
              <li style={{ color: '#64748b' }}>此題型暫無詳細解題步驟。</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
