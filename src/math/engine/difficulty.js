/**
 * Adaptive Difficulty Engine for Mathematics
 * 
 * Adjusts difficulty based on the child's recent performance.
 * Uses a rolling window of recent attempts to be responsive to improvement.
 */

import { SKILL_DIFFICULTY_RANGE } from '../curriculum/mathCurriculum.js';

/**
 * Get the current difficulty level for a skill based on recent performance.
 * 
 * Rules:
 * - Default: level 1
 * - Increase one level after 3 consecutive first-attempt successes
 * - Decrease one level after 2 recent failures (out of last 5) or repeated hint use
 * - Clamped to skill's permitted range
 * - Does NOT change mid-question (caller should cache at session start)
 * 
 * @param {string} skillId
 * @param {object} mathState - the math slice state
 * @returns {number} difficulty level (1-3)
 */
export function getMathDifficulty(skillId, mathState) {
  const range = SKILL_DIFFICULTY_RANGE[skillId] || { min: 1, max: 3 };
  const recentAttempts = mathState.recentAttempts?.[skillId] || [];
  const stats = mathState.learningStats?.[skillId];
  
  if (recentAttempts.length === 0) {
    return range.min;
  }
  
  // Start from the last assigned difficulty, or 1
  const lastAttempt = recentAttempts[recentAttempts.length - 1];
  let currentLevel = lastAttempt?.difficulty || 1;
  
  // Check for 2 consecutive successes → increase (Faster progression)
  const lastTwo = recentAttempts.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every(a => a.correct)) {
    currentLevel = Math.min(currentLevel + 1, range.max);
  }
  
  // Check for 2+ failures in last 5 → decrease
  const lastFive = recentAttempts.slice(-5);
  const recentFailures = lastFive.filter(a => !a.correct).length;
  if (recentFailures >= 2) {
    currentLevel = Math.max(currentLevel - 1, range.min);
  }
  
  // Check for repeated hint use → decrease
  if (stats && stats.hintsUsed > 0) {
    const hintRate = stats.hintsUsed / Math.max(1, stats.attempts);
    if (hintRate > 0.4) {
      currentLevel = Math.max(currentLevel - 1, range.min);
    }
  }
  
  return Math.max(range.min, Math.min(range.max, currentLevel));
}

/**
 * Compose a daily math session of 8 questions.
 * 
 * Composition:
 * - 3 current-skill questions
 * - 2 weak-skill review questions (if any weak skills exist)
 * - 2 previously mastered mixed-review questions (if any mastered)
 * - 1 gentle challenge question (current skill at +1 difficulty)
 * 
 * Falls back to current-skill questions if insufficient history.
 * 
 * @param {string[]} unlockedSkillIds
 * @param {object} mathState
 * @param {function} getSkillStatus - getMathSkillStatus function
 * @returns {Array<{skillId: string, difficulty: number, role: string}>} session plan
 */
export function composeMathSession(unlockedSkillIds, mathState, getSkillStatus) {
  const SESSION_SIZE = 8;
  const plan = [];
  
  // Categorise skills
  const currentSkills = [];
  const weakSkills = [];
  const masteredSkills = [];
  
  for (const skillId of unlockedSkillIds) {
    const status = getSkillStatus(skillId);
    if (status === 'weak') {
      weakSkills.push(skillId);
    } else if (status === 'mastered') {
      masteredSkills.push(skillId);
    } else if (status === 'unlocked') {
      currentSkills.push(skillId);
    }
  }
  
  // If no specific current skills, use the first unlocked skill
  if (currentSkills.length === 0 && unlockedSkillIds.length > 0) {
    currentSkills.push(unlockedSkillIds[0]);
  }
  
  // Helper to pick from array cyclically
  const pickCyclic = (arr, index) => arr[index % arr.length];
  
  // 3 current-skill questions (add variety by occasionally bumping difficulty)
  for (let i = 0; i < 3 && currentSkills.length > 0; i++) {
    const skillId = pickCyclic(currentSkills, i);
    const range = SKILL_DIFFICULTY_RANGE[skillId] || { min: 1, max: 3 };
    let d = getMathDifficulty(skillId, mathState);
    if (i === 2) d = Math.min(d + 1, range.max); // 3rd question is slightly harder
    
    plan.push({
      skillId,
      difficulty: d,
      role: 'current',
    });
  }
  
  // 2 weak-skill review questions
  for (let i = 0; i < 2; i++) {
    if (weakSkills.length > 0) {
      const skillId = pickCyclic(weakSkills, i);
      plan.push({
        skillId,
        difficulty: Math.max(1, getMathDifficulty(skillId, mathState) - 1), // easier for review
        role: 'weak_review',
      });
    } else if (currentSkills.length > 0) {
      // Fill with current skill if no weak
      const skillId = pickCyclic(currentSkills, i + 3);
      plan.push({
        skillId,
        difficulty: getMathDifficulty(skillId, mathState),
        role: 'current_fill',
      });
    }
  }
  
  // 2 mastered mixed-review questions
  for (let i = 0; i < 2; i++) {
    if (masteredSkills.length > 0) {
      const skillId = pickCyclic(masteredSkills, i);
      plan.push({
        skillId,
        difficulty: getMathDifficulty(skillId, mathState),
        role: 'mastered_review',
      });
    } else if (currentSkills.length > 0) {
      const skillId = pickCyclic(currentSkills, i + 5);
      plan.push({
        skillId,
        difficulty: getMathDifficulty(skillId, mathState),
        role: 'current_fill',
      });
    }
  }
  
  // 1 gentle challenge question
  if (currentSkills.length > 0) {
    const skillId = currentSkills[0];
    const baseDifficulty = getMathDifficulty(skillId, mathState);
    const range = SKILL_DIFFICULTY_RANGE[skillId] || { min: 1, max: 3 };
    plan.push({
      skillId,
      difficulty: Math.min(baseDifficulty + 1, range.max),
      role: 'challenge',
    });
  }
  
  // Pad to SESSION_SIZE if somehow under
  while (plan.length < SESSION_SIZE && currentSkills.length > 0) {
    const skillId = pickCyclic(currentSkills, plan.length);
    plan.push({
      skillId,
      difficulty: getMathDifficulty(skillId, mathState),
      role: 'fill',
    });
  }
  
  return plan.slice(0, SESSION_SIZE);
}
