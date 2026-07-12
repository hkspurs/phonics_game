import { calculateSkillMastery } from '../../analytics/mathAnalytics';
import { mathCurriculum, SKILL_IDS } from '../curriculum/mathCurriculum';

/**
 * Generate practice recommendations based on recent analytics.
 * Priorities:
 * 1. needs_review
 * 2. 最近首次答對率最低 (lowest accuracy)
 * 3. 提示使用率最高 (highest hints)
 * 4. 長時間未練習 (longest unpracticed)
 * 5. 當前 curriculum 下一項技能
 * 
 * @param {Object} state - The game store state containing analytics & math progress
 * @returns {Array} List of recommendation objects { skillId, reason, priority }
 */
export function getMathRecommendations(state) {
  const attempts = state.analytics?.mathAttempts || [];
  const unlockedSkills = state.math?.unlockedSkillIds || [SKILL_IDS.NUMBER_COUNTING];
  
  // Group attempts by skill
  const skillHistory = {};
  attempts.forEach(a => {
    if (!skillHistory[a.skillId]) {
      skillHistory[a.skillId] = [];
    }
    skillHistory[a.skillId].push(a);
  });

  const recommendations = [];

  for (const skillId of unlockedSkills) {
    const history = skillHistory[skillId] || [];
    const mastery = calculateSkillMastery(history);
    
    // 1. Needs review
    if (mastery === 'needs_review') {
      recommendations.push({
        skillId,
        reason: 'needs_review',
        reasonText: '這項技能最近的準確率下降了，需要重點溫習。',
        priority: 100
      });
      continue;
    }

    if (history.length > 0) {
      const last5 = history.slice(-5);
      const accuracy = last5.filter(a => a.attemptNumber === 1 && a.isCorrect).length / last5.length;
      const avgHints = last5.reduce((sum, a) => sum + (a.hintLevel || 0), 0) / last5.length;

      // 2. Low accuracy
      if (accuracy <= 0.4) {
        recommendations.push({
          skillId,
          reason: 'low_accuracy',
          reasonText: '最近做這類題目比較吃力，多練習一定會進步！',
          priority: 80 - (accuracy * 10)
        });
        continue;
      }

      // 3. High hints
      if (avgHints >= 1.5) {
        recommendations.push({
          skillId,
          reason: 'high_hints',
          reasonText: '做這類題目時經常需要提示，再挑戰一下自己吧！',
          priority: 60 + avgHints
        });
        continue;
      }
    }
  }

  // 4. Find the next skill to learn (if nothing urgent)
  if (recommendations.length < 3) {
    // Find first locked skill in an unlocked unit, or next unlocked skill with 'not_started'
    // Simplified: Just suggest any unlocked skill that is 'not_started' or 'beginning'
    for (const skillId of unlockedSkills) {
      const history = skillHistory[skillId] || [];
      const mastery = calculateSkillMastery(history);
      
      if (mastery === 'not_started' || mastery === 'beginning') {
        // Prevent duplicates
        if (!recommendations.some(r => r.skillId === skillId)) {
          recommendations.push({
            skillId,
            reason: 'next_skill',
            reasonText: '這是你最近解鎖的新技能，快來試試看！',
            priority: 40
          });
        }
      }
    }
  }

  // Sort by priority descending and take top 3
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
