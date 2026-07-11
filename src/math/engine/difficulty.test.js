import { describe, it, expect } from 'vitest';
import { getMathDifficulty, composeMathSession } from './difficulty.js';
import { SKILL_IDS } from '../curriculum/mathCurriculum.js';

describe('difficulty engine', () => {
  describe('getMathDifficulty', () => {
    it('returns level 1 if no history', () => {
      expect(getMathDifficulty(SKILL_IDS.ADDITION, {})).toBe(1);
    });

    it('increases difficulty after 3 consecutive successes', () => {
      const state = {
        recentAttempts: {
          [SKILL_IDS.ADDITION]: [
            { correct: true, difficulty: 1 },
            { correct: true, difficulty: 1 },
            { correct: true, difficulty: 1 },
          ]
        }
      };
      expect(getMathDifficulty(SKILL_IDS.ADDITION, state)).toBe(2);
    });

    it('does not exceed max difficulty', () => {
      const state = {
        recentAttempts: {
          [SKILL_IDS.ORDINAL_POSITION]: [ // max difficulty is 2
            { correct: true, difficulty: 2 },
            { correct: true, difficulty: 2 },
            { correct: true, difficulty: 2 },
          ]
        }
      };
      expect(getMathDifficulty(SKILL_IDS.ORDINAL_POSITION, state)).toBe(2);
    });

    it('decreases difficulty after 2 recent failures', () => {
      const state = {
        recentAttempts: {
          [SKILL_IDS.ADDITION]: [
            { correct: true, difficulty: 2 },
            { correct: false, difficulty: 2 },
            { correct: true, difficulty: 2 },
            { correct: false, difficulty: 2 },
            { correct: true, difficulty: 2 },
          ]
        }
      };
      expect(getMathDifficulty(SKILL_IDS.ADDITION, state)).toBe(1);
    });

    it('decreases difficulty if hint rate is high', () => {
      const state = {
        recentAttempts: {
          [SKILL_IDS.ADDITION]: [
            { correct: true, difficulty: 2 },
            { correct: false, difficulty: 2 },
            { correct: true, difficulty: 2 },
          ]
        },
        learningStats: {
          [SKILL_IDS.ADDITION]: {
            attempts: 5,
            hintsUsed: 3, // > 0.4
          }
        }
      };
      // Because hints > 40%, it drops from 2 down to 1
      expect(getMathDifficulty(SKILL_IDS.ADDITION, state)).toBe(1);
    });
  });

  describe('composeMathSession', () => {
    it('creates an 8 question session', () => {
      const unlocked = [SKILL_IDS.ADDITION, SKILL_IDS.SUBTRACTION];
      const getStatus = () => 'unlocked';
      const plan = composeMathSession(unlocked, {}, getStatus);
      
      expect(plan.length).toBe(8);
      // First 3 should be current
      expect(plan[0].role).toBe('current');
      expect(plan[1].role).toBe('current');
      expect(plan[2].role).toBe('current');
      
      // Since no weak skills, they are filled with current
      expect(plan[3].role).toBe('current_fill');
      expect(plan[4].role).toBe('current_fill');
      
      // Since no mastered skills, they are filled with current
      expect(plan[5].role).toBe('current_fill');
      expect(plan[6].role).toBe('current_fill');
      
      // Last is challenge
      expect(plan[7].role).toBe('challenge');
    });

    it('includes weak and mastered review', () => {
      const unlocked = [SKILL_IDS.ADDITION, SKILL_IDS.SUBTRACTION, SKILL_IDS.NUMBER_COUNTING, SKILL_IDS.NUMBER_ORDERING];
      const getStatus = (id) => {
        if (id === SKILL_IDS.NUMBER_COUNTING) return 'mastered';
        if (id === SKILL_IDS.NUMBER_ORDERING) return 'weak';
        return 'unlocked';
      };
      
      const plan = composeMathSession(unlocked, {}, getStatus);
      expect(plan.length).toBe(8);
      
      const roles = plan.map(p => p.role);
      expect(roles.filter(r => r === 'weak_review').length).toBe(2);
      expect(roles.filter(r => r === 'mastered_review').length).toBe(2);
      
      const weakQs = plan.filter(p => p.role === 'weak_review');
      expect(weakQs[0].skillId).toBe(SKILL_IDS.NUMBER_ORDERING);
      
      const masteredQs = plan.filter(p => p.role === 'mastered_review');
      expect(masteredQs[0].skillId).toBe(SKILL_IDS.NUMBER_COUNTING);
    });
  });
});
