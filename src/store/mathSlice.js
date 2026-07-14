/**
 * Mathematics learning state slice.
 * 
 * Provides default state, actions, and selectors for the mathematics domain.
 * Integrated into the main gameStore but logically separated.
 */

// Default mathematics state — initialised on first boot or migration
export const MATH_DEFAULTS = {
  currentUnitId: 'numbers-1-20',
  unlockedSkillIds: ['number_counting_1_20'],
  learningStats: {},
  // Rolling recent-attempt window: { skillId: [{ correct: bool, timestamp, difficulty }] }
  recentAttempts: {},
  completedToday: false,
  activeSession: null,
  // Active session state
  mathActiveQuestions: [],
  mathCurrentQuestionIndex: 0,
  mathSessionScore: { stars: 0 },
  isMathChallengeActive: false,
};

import { mathCurriculum } from '../math/curriculum/mathCurriculum';

/**
 * Mathematics slice actions — called within the Zustand (set, get) context.
 */
export const createMathSlice = (set, get) => ({
  // ---- Mathematics State ----
  math: { ...MATH_DEFAULTS },

  // ---- Mathematics Actions ----

  /** Record a mathematics answer attempt */
  recordMathAnswer: (...args) => set((state) => {
    // Legacy support (skillId, isFirstAttemptSuccess, difficulty)
    const payload = args[0];
    const p = typeof payload === 'string' ? {
      skillId: args[0],
      firstAttemptCorrect: args[1],
      difficulty: args[2] || 1,
      eventuallyCompleted: true,
      attemptCount: args[1] ? 1 : 2,
      hintLevelUsed: 0,
      responseTimeMs: 0
    } : payload;

    const {
      skillId,
      firstAttemptCorrect,
      eventuallyCompleted,
      attemptCount,
      hintLevelUsed,
      responseTimeMs,
      difficulty
    } = p;

    const prevStats = state.math.learningStats[skillId] || {
      attempts: 0,
      firstAttemptHits: 0,
      hintsUsed: 0,
      avgAttemptsToComplete: 0,
      misconceptions: {},
    };

    const newStats = { ...prevStats };

    // Only increment attempts on the final completion/failure of a question,
    // or just track per interaction. Let's say stats.attempts is 'questions encountered'
    // but the payload gives attemptCount.
    if (eventuallyCompleted) {
      newStats.attempts += 1;
      if (firstAttemptCorrect) {
        newStats.firstAttemptHits += 1;
      }
      newStats.hintsUsed += hintLevelUsed;
    }

    // Rolling recent attempts (keep last 20 per skill)
    const recentAttempts = { ...state.math.recentAttempts };
    const skillRecent = [...(recentAttempts[skillId] || [])];
    skillRecent.push({
      correct: firstAttemptCorrect,
      eventuallyCompleted,
      attemptCount,
      hintLevelUsed,
      responseTimeMs,
      timestamp: Date.now(),
      difficulty,
    });
    // Keep only last 20
    if (skillRecent.length > 20) skillRecent.shift();
    recentAttempts[skillId] = skillRecent;

    // Evaluate unlocks based on new stats
    const flatCurriculum = mathCurriculum.flatMap(u => u.skills);
    let newUnlockedSkillIds = [...state.math.unlockedSkillIds];
    
    newUnlockedSkillIds.forEach(id => {
      // Check recent attempts first, matching getMathSkillStatus
      const recent = id === skillId ? recentAttempts[id] : (state.math.recentAttempts?.[id] || []);
      const lastFive = recent.slice(-5);
      
      let isMastered = false;
      if (lastFive.length >= 3) {
        const accuracy = lastFive.filter(a => a.correct).length / lastFive.length;
        if (accuracy >= 0.4) isMastered = true;
      } else {
        const s = id === skillId ? newStats : state.math.learningStats[id];
        if (s && s.attempts >= 3) {
          const accuracy = s.firstAttemptHits / s.attempts;
          if (accuracy >= 0.4) isMastered = true;
        }
      }

      if (isMastered) {
        const currentIndex = flatCurriculum.indexOf(id);
        if (currentIndex !== -1 && currentIndex + 1 < flatCurriculum.length) {
          const nextSkill = flatCurriculum[currentIndex + 1];
          if (!newUnlockedSkillIds.includes(nextSkill)) {
            newUnlockedSkillIds.push(nextSkill);
          }
        }
      }
    });

    return {
      math: {
        ...state.math,
        unlockedSkillIds: newUnlockedSkillIds,
        learningStats: {
          ...state.math.learningStats,
          [skillId]: newStats,
        },
        recentAttempts,
      }
    };
  }),

  /** Record a misconception tag */
  recordMathMisconception: (skillId, tag) => set((state) => {
    const prevStats = state.math.learningStats[skillId] || {
      attempts: 0,
      firstAttemptHits: 0,
      hintsUsed: 0,
      avgAttemptsToComplete: 0,
      misconceptions: {},
    };
    
    const newStats = {
      ...prevStats,
      misconceptions: {
        ...prevStats.misconceptions,
        [tag]: (prevStats.misconceptions[tag] || 0) + 1
      }
    };

    return {
      math: {
        ...state.math,
        learningStats: {
          ...state.math.learningStats,
          [skillId]: newStats,
        }
      }
    };
  }),

  /** Record hint usage */
  recordMathHintUsed: (skillId) => set((state) => {
    const prevStats = state.math.learningStats[skillId] || {
      attempts: 0,
      firstAttemptHits: 0,
      hintsUsed: 0,
      avgAttemptsToComplete: 0,
      misconceptions: {},
    };
    
    const newStats = {
      ...prevStats,
      hintsUsed: prevStats.hintsUsed + 1
    };

    return {
      math: {
        ...state.math,
        learningStats: {
          ...state.math.learningStats,
          [skillId]: newStats,
        }
      }
    };
  }),

  /** Get math skill mastery status */
  getMathSkillStatus: (skillId) => {
    const state = get();
    const recent = state.math.recentAttempts?.[skillId] || [];
    const lastFive = recent.slice(-5);

    if (state.math.currentUnitId && !state.math.unlockedSkillIds?.includes(skillId)) {
      return 'locked';
    }

    if (lastFive.length >= 3) {
      const accuracy = lastFive.filter(a => a.correct).length / lastFive.length;
      if (accuracy >= 0.4) return 'mastered';
      if (accuracy < 0.4) return 'weak';
    }

    // Check lifetime stats too for weak detection
    const stats = state.math.learningStats[skillId];
    if (stats && stats.attempts >= 3) {
      const accuracy = stats.firstAttemptHits / stats.attempts;
      if (accuracy >= 0.4) return 'mastered';
      if (accuracy < 0.4) return 'weak';
    }

    if (state.math.unlockedSkillIds.includes(skillId)) return 'unlocked';
    return 'locked';
  },

  /** Mark math daily as completed */
  completeMathDaily: () => set((state) => {
    const flatCurriculum = mathCurriculum.flatMap(u => u.skills);
    let newUnlockedSkillIds = [...state.math.unlockedSkillIds];
    
    // Auto-unlock next skills if current is mastered
    state.math.unlockedSkillIds.forEach(skillId => {
      const recent = state.math.recentAttempts?.[skillId] || [];
      const lastFive = recent.slice(-5);
      
      let isMastered = false;
      if (lastFive.length >= 3) {
        const accuracy = lastFive.filter(a => a.correct).length / lastFive.length;
        if (accuracy >= 0.4) isMastered = true;
      } else {
        const stats = state.math.learningStats[skillId];
        if (stats && stats.attempts >= 3) {
          const accuracy = stats.firstAttemptHits / stats.attempts;
          if (accuracy >= 0.4) isMastered = true;
        }
      }

      if (isMastered) {
        const currentIndex = flatCurriculum.indexOf(skillId);
        if (currentIndex !== -1 && currentIndex + 1 < flatCurriculum.length) {
          const nextSkill = flatCurriculum[currentIndex + 1];
          if (!newUnlockedSkillIds.includes(nextSkill)) {
            newUnlockedSkillIds.push(nextSkill);
          }
        }
      }
    });

    return {
      math: {
        ...state.math,
        unlockedSkillIds: newUnlockedSkillIds,
        completedToday: true,
        isMathChallengeActive: false,
        mathActiveQuestions: [],
        mathCurrentQuestionIndex: 0,
      },
      // Award shared rewards
      stars: state.stars + state.math.mathSessionScore.stars,
      tickets: state.tickets + 1,
    };
  }),

  /** Clear math session (for gym or exiting early) */
  clearMathSession: () => set((state) => ({
    math: {
      ...state.math,
      isMathChallengeActive: false,
      mathActiveQuestions: [],
      mathCurrentQuestionIndex: 0,
    },
    // Award stars earned!
    stars: state.stars + state.math.mathSessionScore.stars,
  })),

  /** Reset math daily flag (called by checkDailyReset) */
  resetMathDaily: () => set((state) => ({
    math: {
      ...state.math,
      completedToday: false,
      mathSessionScore: { stars: 0 },
    }
  })),

  /** Start a math challenge session */
  startMathSession: (questions) => set((state) => ({
    math: {
      ...state.math,
      mathActiveQuestions: questions,
      mathCurrentQuestionIndex: 0,
      isMathChallengeActive: true,
      mathSessionScore: { stars: 0 },
    }
  })),

  /** Advance to next math question */
  nextMathQuestion: () => set((state) => ({
    math: {
      ...state.math,
      mathCurrentQuestionIndex: Math.min(
        state.math.mathCurrentQuestionIndex + 1,
        state.math.mathActiveQuestions.length - 1
      ),
    }
  })),

  /** Push a new math question to the active session (for Gym re-injection) */
  pushMathQuestion: (question) => set((state) => ({
    math: {
      ...state.math,
      mathActiveQuestions: [...state.math.mathActiveQuestions, question],
    }
  })),

  /** Award math session stars */
  awardMathStars: (amount) => set((state) => ({
    math: {
      ...state.math,
      mathSessionScore: {
        stars: state.math.mathSessionScore.stars + amount,
      }
    }
  })),

  /** Unlock a new math skill */
  unlockMathSkill: (skillId) => set((state) => ({
    math: {
      ...state.math,
      unlockedSkillIds: state.math.unlockedSkillIds.includes(skillId)
        ? state.math.unlockedSkillIds
        : [...state.math.unlockedSkillIds, skillId],
    }
  })),

  /** Set current math unit */
  setMathUnit: (unitId) => set((state) => ({
    math: {
      ...state.math,
      currentUnitId: unitId,
    }
  })),

  /** Reset all math progress */
  resetMathProgress: () => set((state) => ({
    math: { ...MATH_DEFAULTS },
  })),
});

/**
 * Selectors for shared profile rewards — use these in components
 * that need profile data without subscribing to the full store.
 */
export const selectSharedRewards = (state) => ({
  stars: state.stars,
  gems: state.gems,
  tickets: state.tickets,
  streak: state.streak,
});

export const selectMathState = (state) => state.math;

export const selectMathStats = (state) => state.math.learningStats;

export const selectMathSession = (state) => ({
  questions: state.math.mathActiveQuestions,
  currentIndex: state.math.mathCurrentQuestionIndex,
  isActive: state.math.isMathChallengeActive,
  score: state.math.mathSessionScore,
});
