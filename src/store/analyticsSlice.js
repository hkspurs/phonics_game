import { createMathAttemptEvent } from '../analytics/mathEvents';

const MAX_ATTEMPTS = 1000;

export const createAnalyticsSlice = (set, get) => ({
  analytics: {
    mathAttempts: [],
    weeklyAggregates: {},
  },

  recordMathAttempt: (payload) => set((state) => {
    const event = createMathAttemptEvent(payload);
    let newAttempts = [...state.analytics.mathAttempts, event];
    
    // Prune if exceeds max
    if (newAttempts.length > MAX_ATTEMPTS) {
      // Typically we'd aggregate before shifting, but for MVP we just shift
      newAttempts = newAttempts.slice(-MAX_ATTEMPTS);
    }

    return {
      analytics: {
        ...state.analytics,
        mathAttempts: newAttempts
      }
    };
  }),

  // Optional: clear analytics (for resetProgress)
  resetAnalytics: () => set((state) => ({
    analytics: {
      mathAttempts: [],
      weeklyAggregates: {},
    }
  }))
});
