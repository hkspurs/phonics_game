/**
 * Mathematics Analytics & Mastery Calculator
 * Pure functions to compute statistics from event streams.
 */

/**
 * Calculate mastery for a single skill based on recent attempts.
 * 
 * Mastery logic:
 * - 未答過：not_started
 * - 少於 3 次：beginning
 * - 最近 5 次首次答對率 40–59%：developing
 * - 最近 5 次 60–79%：competent
 * - 最近至少 5 次達 80%：mastered
 * - 曾 mastered，但最近 3 次低於 60%：needs_review
 * 
 * @param {Array} skillAttempts - Array of attempt events for a specific skill, sorted oldest to newest.
 * @param {Object} historySummary - Optional lifetime stats (e.g., if we know it was ever mastered).
 * @returns {string} Status ('not_started', 'beginning', 'developing', 'competent', 'mastered', 'needs_review')
 */
export function calculateSkillMastery(skillAttempts, historySummary = null) {
  if (!skillAttempts || skillAttempts.length === 0) {
    return 'not_started';
  }

  // We only count completions (where eventuallyCompleted is true or we consider all interactions)
  // For strict accuracy, we use first-attempt correctness.
  const completions = skillAttempts.filter(a => a.isCorrect !== undefined);
  
  if (completions.length < 3) {
    return 'beginning';
  }

  const last5 = completions.slice(-5);
  const firstAttemptHitsLast5 = last5.filter(a => a.attemptNumber === 1 && a.isCorrect).length;
  const accuracyLast5 = firstAttemptHitsLast5 / last5.length;

  const wasEverMastered = historySummary?.everMastered || false;
  
  if (wasEverMastered) {
    const last3 = completions.slice(-3);
    if (last3.length === 3) {
      const accuracyLast3 = last3.filter(a => a.attemptNumber === 1 && a.isCorrect).length / 3;
      if (accuracyLast3 < 0.6) {
        return 'needs_review';
      }
    }
  }

  if (last5.length >= 5 && accuracyLast5 >= 0.8) {
    return 'mastered';
  }

  if (accuracyLast5 >= 0.6) return 'competent';
  if (accuracyLast5 >= 0.4) return 'developing';
  
  return 'beginning'; // Less than 40%
}

/**
 * Calculate the overall mastery of a unit based on its skills.
 * @param {Array} skillResults - Array of skill statuses inside the unit.
 */
export function calculateUnitMastery(skillResults) {
  if (skillResults.length === 0) return 'not_started';
  
  const allMastered = skillResults.every(s => s === 'mastered');
  if (allMastered) return 'mastered';
  
  const anyStarted = skillResults.some(s => s !== 'not_started');
  if (!anyStarted) return 'not_started';
  
  const anyNeedsReview = skillResults.some(s => s === 'needs_review' || s === 'beginning');
  if (anyNeedsReview) return 'developing';
  
  return 'competent';
}

/**
 * Calculate weekly summary
 * @param {Array} events - Array of events.
 * @param {Date} startDate - Start of the week.
 */
export function calculateWeeklySummary(events, startDate) {
  const weeklyEvents = events.filter(e => e.occurredAt >= startDate.getTime());
  
  const uniqueDays = new Set(
    weeklyEvents.map(e => new Date(e.occurredAt).toDateString())
  ).size;

  const totalQuestions = weeklyEvents.length;
  const firstAttemptCorrect = weeklyEvents.filter(e => e.attemptNumber === 1 && e.isCorrect).length;
  const accuracy = totalQuestions > 0 ? firstAttemptCorrect / totalQuestions : 0;
  
  const hintsUsed = weeklyEvents.reduce((sum, e) => sum + (e.hintLevel || 0), 0);

  // Group by skill
  const skillStats = {};
  weeklyEvents.forEach(e => {
    if (!skillStats[e.skillId]) {
      skillStats[e.skillId] = { total: 0, correct: 0 };
    }
    skillStats[e.skillId].total += 1;
    if (e.attemptNumber === 1 && e.isCorrect) {
      skillStats[e.skillId].correct += 1;
    }
  });

  const rankedSkills = Object.entries(skillStats).map(([skillId, stats]) => ({
    skillId,
    accuracy: stats.correct / stats.total,
    total: stats.total
  })).sort((a, b) => b.accuracy - a.accuracy || b.total - a.total);

  const topSkills = rankedSkills.slice(0, 3).map(s => s.skillId);
  const needsPractice = rankedSkills.slice(-3).reverse().map(s => s.skillId);

  return {
    daysLearned: uniqueDays,
    questionsCompleted: totalQuestions,
    accuracy: Math.round(accuracy * 100),
    hintsUsed,
    topSkills,
    needsPractice
  };
}

/**
 * Detect common misconception tags.
 */
export function detectMisconception(event, question) {
  if (event.isCorrect) return null;
  
  // Example heuristic mapping based on type
  if (question.type === 'counting') {
    if (event.selectedAnswer < question.correctAnswer) return 'missed_items';
    if (event.selectedAnswer > question.correctAnswer) return 'double_counted';
  }
  
  if (question.type === 'addition') {
    if (event.selectedAnswer === question.values.a - question.values.b) {
      return 'confused_with_subtraction';
    }
  }

  return 'unknown';
}
