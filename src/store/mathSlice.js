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

/**
 * Mathematics slice actions — called within the Zustand (set, get) context.
 */
export const createMathSlice = (set, get) => ({
  // ---- Mathematics State ----
  math: { ...MATH_DEFAULTS },

  // ---- Mathematics Actions ----

  /** Record a mathematics answer attempt */
  recordMathAnswer: (skillId, isFirstAttemptSuccess, difficulty = 1) => set((state) => {
    const stats = state.math.learningStats[skillId] || {
      attempts: 0,
      firstAttemptHits: 0,
      hintsUsed: 0,
      avgAttemptsToComplete: 0,
      misconceptions: {},
    };

    stats.attempts += 1;
    if (isFirstAttemptSuccess) {
      stats.firstAttemptHits += 1;
    }

    // Rolling recent attempts (keep last 20 per skill)
    const recentAttempts = { ...state.math.recentAttempts };
    const skillRecent = [...(recentAttempts[skillId] || [])];
    skillRecent.push({
      correct: isFirstAttemptSuccess,
      timestamp: Date.now(),
      difficulty,
    });
    // Keep only last 20
    if (skillRecent.length > 20) skillRecent.shift();
    recentAttempts[skillId] = skillRecent;

    return {
      math: {
        ...state.math,
        learningStats: {
          ...state.math.learningStats,
          [skillId]: stats,
        },
        recentAttempts,
      }
    };
  }),

  /** Record a misconception tag */
  recordMathMisconception: (skillId, tag) => set((state) => {
    const stats = state.math.learningStats[skillId] || {
      attempts: 0,
      firstAttemptHits: 0,
      hintsUsed: 0,
      avgAttemptsToComplete: 0,
      misconceptions: {},
    };
    stats.misconceptions[tag] = (stats.misconceptions[tag] || 0) + 1;

    return {
      math: {
        ...state.math,
        learningStats: {
          ...state.math.learningStats,
          [skillId]: stats,
        }
      }
    };
  }),

  /** Record hint usage */
  recordMathHintUsed: (skillId) => set((state) => {
    const stats = state.math.learningStats[skillId] || {
      attempts: 0,
      firstAttemptHits: 0,
      hintsUsed: 0,
      avgAttemptsToComplete: 0,
      misconceptions: {},
    };
    stats.hintsUsed += 1;

    return {
      math: {
        ...state.math,
        learningStats: {
          ...state.math.learningStats,
          [skillId]: stats,
        }
      }
    };
  }),

  /** Get math skill mastery status */
  getMathSkillStatus: (skillId) => {
    const state = get();
    const recent = state.math.recentAttempts[skillId] || [];
    const lastFive = recent.slice(-5);

    if (state.math.currentUnitId && !state.math.unlockedSkillIds.includes(skillId)) {
      return 'locked';
    }

    if (lastFive.length >= 5) {
      const accuracy = lastFive.filter(a => a.correct).length / lastFive.length;
      if (accuracy >= 0.8) return 'mastered';
      if (accuracy < 0.6) return 'weak';
    }

    // Check lifetime stats too for weak detection
    const stats = state.math.learningStats[skillId];
    if (stats && stats.attempts >= 3) {
      const accuracy = stats.firstAttemptHits / stats.attempts;
      if (accuracy < 0.6) return 'weak';
    }

    if (state.math.unlockedSkillIds.includes(skillId)) return 'unlocked';
    return 'locked';
  },

  /** Mark math daily as completed */
  completeMathDaily: () => set((state) => ({
    math: {
      ...state.math,
      completedToday: true,
      isMathChallengeActive: false,
      mathActiveQuestions: [],
      mathCurrentQuestionIndex: 0,
    },
    // Award shared rewards
    stars: state.stars + state.math.mathSessionScore.stars,
    tickets: state.tickets + 1,
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
