import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { SKILL_METADATA } from '../curriculum/mathSkillCopy';
import { detectMisconception } from '../../analytics/mathAnalytics';

export default function MathMistakeHistory() {
  const store = useGameStore();
  const allAttempts = store.analytics?.mathAttempts || [];
  
  // Filter only mistakes (isCorrect === false)
  const mistakes = allAttempts.filter(a => !a.isCorrect).reverse(); // Newest first

  if (mistakes.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h3 style={{ color: '#334155', margin: '0 0 0.5rem 0' }}>太棒了！</h3>
        <p style={{ color: '#64748b', margin: 0 }}>目前沒有記錄到任何錯誤。</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {mistakes.map(mistake => {
        const metadata = SKILL_METADATA[mistake.skillId];
        const date = new Date(mistake.occurredAt);
        const misconception = detectMisconception(mistake, { type: mistake.questionType, correctAnswer: mistake.correctAnswer, values: mistake.values });

        let misconceptionText = null;
        if (misconception === 'missed_items') misconceptionText = '可能漏數了物件';
        if (misconception === 'double_counted') misconceptionText = '可能重複數了物件';
        if (misconception === 'confused_with_subtraction') misconceptionText = '將加法混淆為減法';

        return (
          <div key={mistake.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                {metadata?.titleZh || mistake.skillId}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                  提示使用: {mistake.hintLevel || 0} 次
                </span>
                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                  嘗試次數: 第 {mistake.attemptNumber} 次
                </span>
              </div>
            </div>

            <div style={{ flex: 2, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.25rem' }}>小朋友的答案</div>
                  <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {mistake.selectedAnswer !== null ? JSON.stringify(mistake.selectedAnswer) : '未知'}
                  </div>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.25rem' }}>正確答案</div>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {JSON.stringify(mistake.correctAnswer)}
                  </div>
                </div>
              </div>

              {misconceptionText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontSize: '0.9rem' }}>
                  <span>💡</span> 系統分析: {misconceptionText}
                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
}
