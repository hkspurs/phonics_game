import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { calculateWeeklySummary } from '../../analytics/mathAnalytics';
import { SKILL_METADATA } from '../curriculum/mathSkillCopy';
import { getMathRecommendations } from '../recommendations/getMathRecommendations';

export default function MathWeeklyReport() {
  const store = useGameStore();
  const mathAttempts = store.analytics?.mathAttempts || [];
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);

  const summary = calculateWeeklySummary(mathAttempts, oneWeekAgo);
  const recommendations = getMathRecommendations(store);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Metrics Row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ color: '#64748b', fontWeight: 'bold', marginBottom: '0.5rem' }}>Days Learned</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a' }}>{summary.daysLearned}</div>
        </div>
        <div style={{ flex: 1, background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ color: '#64748b', fontWeight: 'bold', marginBottom: '0.5rem' }}>Questions Completed</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a' }}>{summary.questionsCompleted}</div>
        </div>
        <div style={{ flex: 1, background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ color: '#64748b', fontWeight: 'bold', marginBottom: '0.5rem' }}>First Attempt Accuracy</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: summary.accuracy >= 80 ? '#10b981' : '#f59e0b' }}>
            {summary.accuracy}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Left Col: Top Skills */}
        <div style={{ flex: 1, minWidth: '300px', background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>🏆 Top Skills this Week</h3>
          {summary.topSkills.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>Play more math games to see top skills!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {summary.topSkills.map(skillId => (
                <li key={skillId} style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  {SKILL_METADATA[skillId]?.titleZh || skillId}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Col: Recommended Practice */}
        <div style={{ flex: 1, minWidth: '300px', background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>🎯 Recommended Practice</h3>
          {recommendations.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No specific recommendations right now.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recommendations.map(rec => (
                <li key={rec.skillId} style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {SKILL_METADATA[rec.skillId]?.titleZh || rec.skillId}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#b45309' }}>
                    {rec.reasonText}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
