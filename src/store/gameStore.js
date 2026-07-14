import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { questionEngine } from '../game/QuestionEngine';
import { createMathSlice, MATH_DEFAULTS } from './mathSlice';
import { createAnalyticsSlice } from './analyticsSlice';
import { createEncouragementSlice } from './encouragementSlice';

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Global Profile Data
      stars: 45,
      gems: 12,
      tickets: 2, 
      streak: 5,
      isParentAuthenticated: false, // Prevents Parent Gate Bypass
      language: 'en', // 'zh' for Traditional Chinese, 'en' for English
      refresherMode: false, // Teacher Agent Refresher Mode
      preRefresherState: null, // Restores progression after refresher
      currentChapter: 'A Families', // Chapter Support
      selectedSubject: 'phonics', // Current subject selection
      phonicsSessionTime: 0, // Track time in minutes
      phonicsMistakeHistory: [], // Track mistakes
      inventory: [], // Array of purchased item IDs
      equipped: {}, // Map of category -> item ID
      // Map Progression State (QA FIX)
      unlockedSounds: ['AB', 'EB'],
      currentNode: 'IB',
      gameComplete: false, // QA FIX: Dead-End Map state

      // Assignment State
      activeAssignment: null,

      // Learning Analytics State (QA FIX)
      learningStats: {}, // { 'AB': { attempts: 0, firstAttemptHits: 0, confusedWith: { 'EB': 2 } } }

      // Current Challenge State
      activeQuestions: [],
      currentQuestionIndex: 0,
      isChallengeActive: false,
      currentChallengeType: null, // 'daily' | 'assignment'
      hasCompletedDaily: false, // QA FIX: Lock Brain Games
      lastPlayedDate: null, // QA FIX: Eternal Tomorrow (Daily Reset)
      sessionScore: { stars: 0, gems: 0 },

      // Actions
      resetProgress: () => set({
        stars: 0,
        gems: 0,
        tickets: 2,
        streak: 0,
        unlockedSounds: ['AB', 'EB'],
        currentNode: 'AB_01', // QA FIX: Use proper ID
        gameComplete: false,
        learningStats: {},
        activeAssignment: null,
        hasCompletedDaily: false,
        lastPlayedDate: null,
        refresherMode: false,
        preRefresherState: null,
        currentChapter: 'A Families',
        phonicsSessionTime: 0,
        phonicsMistakeHistory: []
      }),

      addSessionTime: (minutes) => set((state) => ({
        phonicsSessionTime: (state.phonicsSessionTime || 0) + minutes
      })),

      addPhonicsMistake: (mistake) => set((state) => {
        const history = state.phonicsMistakeHistory || [];
        return {
          phonicsMistakeHistory: [mistake, ...history].slice(0, 50) // Keep last 50
        };
      }),

      relockSound: (soundId) => set((state) => {
        return {
          unlockedSounds: state.unlockedSounds.filter(id => id !== soundId),
          currentNode: soundId // Fallback current node to this locked sound
        };
      }),

      toggleRefresherMode: (familyName = 'A Families') => set((state) => {
        const isTurningOn = !state.refresherMode;
        if (isTurningOn) {
          const familySounds = questionEngine.sounds.filter(s => s.family === familyName).map(s => s.sound_id || s.label);
          // If family doesn't exist or is empty, fallback safely
          if (familySounds.length === 0) return { refresherMode: true };
          
          return { 
            refresherMode: true, 
            preRefresherState: { currentNode: state.currentNode, currentChapter: state.currentChapter },
            currentChapter: familyName,
            unlockedSounds: Array.from(new Set([...state.unlockedSounds, ...familySounds])),
            currentNode: familySounds[0]
          };
        }
        return { 
          refresherMode: false,
          currentNode: state.preRefresherState?.currentNode || state.currentNode,
          currentChapter: state.preRefresherState?.currentChapter || state.currentChapter
        };
      }),

      setChapter: (familyName) => set((state) => {
        const familySounds = questionEngine.sounds.filter(s => s.family === familyName).map(s => s.sound_id || s.label);
        if (familySounds.length === 0) return { currentChapter: familyName };
        return {
          currentChapter: familyName,
          currentNode: state.unlockedSounds.includes(familySounds[0]) ? familySounds[0] : state.currentNode
        };
      }),

      authenticateParent: (isAuthenticated) => set({ isParentAuthenticated: isAuthenticated }),

      // 14. Global Language Settings
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ language: state.language === 'zh' ? 'en' : 'zh' })),

      checkDailyReset: () => set((state) => {
        // QA FIX (Challenge 16): Timezone Drift. Use Intl to get local YYYY-MM-DD reliably.
        const today = new Intl.DateTimeFormat('en-CA').format(new Date()); // e.g. 2026-07-06
        if (state.lastPlayedDate !== today) {
          return {
            hasCompletedDaily: false,
            sessionScore: { stars: 0, gems: 0 },
            lastPlayedDate: today,
            // Also reset math daily
            math: {
              ...state.math,
              completedToday: false,
              mathSessionScore: { stars: 0 },
            }
          };
        }
        return {};
      }),

      getNodeStatus: (soundId) => {
        const state = get();
        if (state.currentNode === soundId && !state.gameComplete) return 'practising';
        const stats = state.learningStats[soundId];
        // Pedagogy FIX (Challenge 5): Rolling window / threshold logic.
        if (stats && stats.attempts >= 3) {
          const accuracy = stats.firstAttemptHits / stats.attempts;
          if (accuracy >= 0.7) return 'mastered'; // Slightly more forgiving
          if (stats.attempts >= 5 && accuracy < 0.6) return 'weak';
        }
        if (state.unlockedSounds.includes(soundId)) return 'unlocked';
        return 'locked';
      },

      recordAnswer: (soundId, isFirstAttemptSuccess, confusedWithLabel) => set((state) => {
        const prevStats = state.learningStats[soundId] || { attempts: 0, firstAttemptHits: 0, confusedWith: {} };
        const newConfusedWith = { ...prevStats.confusedWith };
        
        let currentAttempts = prevStats.attempts;
        let currentHits = prevStats.firstAttemptHits;
        
        // Teacher Agent Pedagogical Fix: Rolling Window (Decay)
        if (currentAttempts >= 10) {
          currentAttempts *= 0.8;
          currentHits *= 0.8;
        }
        
        let newMistakeHistory = state.phonicsMistakeHistory || [];

        if (isFirstAttemptSuccess) {
          // Challenge 7: Confused Pairs Decay. If they get it right on the first try, slightly decay all confusions.
          Object.keys(newConfusedWith).forEach(key => {
            if (newConfusedWith[key] > 0) {
              newConfusedWith[key] = Math.max(0, newConfusedWith[key] - 1);
            }
          });
        } else if (confusedWithLabel) {
          newConfusedWith[confusedWithLabel] = (newConfusedWith[confusedWithLabel] || 0) + 1;
          
          // Log to Mistake History
          const mistake = { target: soundId, choice: confusedWithLabel, type: state.currentChallengeType || 'practice', time: Date.now() };
          newMistakeHistory = [mistake, ...newMistakeHistory].slice(0, 50);
        }

        const newStats = {
          ...prevStats,
          attempts: currentAttempts + 1,
          firstAttemptHits: currentHits + (isFirstAttemptSuccess ? 1 : 0),
          confusedWith: newConfusedWith
        };

        return {
          learningStats: {
            ...state.learningStats,
            [soundId]: newStats
          },
          phonicsMistakeHistory: newMistakeHistory
        };
      }),
      useTicket: () => set((state) => ({ tickets: Math.max(0, state.tickets - 1) })),
      addTicket: () => set((state) => ({ tickets: state.tickets + 1 })),
      
      buyItem: (item, costStars, costGems) => set((state) => {
        if (state.stars >= costStars && state.gems >= costGems && !state.inventory.includes(item.id)) {
          return {
            stars: state.stars - costStars,
            gems: state.gems - costGems,
            inventory: [...state.inventory, item.id]
          };
        }
        return state;
      }),
      
      equipItem: (category, itemId) => set((state) => {
        if (state.inventory.includes(itemId)) {
          return {
            equipped: { ...state.equipped, [category]: itemId }
          };
        }
        return state;
      }),
      startAssignment: (soundId) => {
        const questions = questionEngine.generateAssignment(soundId);
        set({
          activeQuestions: questions,
          currentQuestionIndex: 0,
          isChallengeActive: true,
          currentChallengeType: 'assignment',
          sessionScore: { stars: 0, gems: 0 },
        });
      },

      startDailyChallenge: () => {
        const state = get();
        let questions;
        if (state.refresherMode) {
          const familySounds = questionEngine.sounds.filter(s => s.family === state.currentChapter).map(s => s.sound_id || s.label);
          const unlockedFamilySounds = state.unlockedSounds.filter(id => familySounds.includes(id));
          questions = questionEngine.generateRefresherAssignment(unlockedFamilySounds, state.learningStats);
        } else {
          questions = questionEngine.generateDailyChallenge(state.unlockedSounds, state.currentNode, state.learningStats, state.gameComplete);
        }
        
        set({
          activeQuestions: questions,
          currentQuestionIndex: 0,
          isChallengeActive: true,
          currentChallengeType: 'daily',
          sessionScore: { stars: 0, gems: 0 },
        });
      },

      startGymWorkout: (soundId) => {
        const state = get();
        // Find most confused sound
        let confusedWithLabel = null;
        let maxConfusion = 0;
        const stats = state.learningStats[soundId];
        if (stats && stats.confusedWith) {
          for (const [label, count] of Object.entries(stats.confusedWith)) {
            if (count > maxConfusion) {
              maxConfusion = count;
              confusedWithLabel = label;
            }
          }
        }
        
        const questions = questionEngine.generateGymWorkout(soundId, confusedWithLabel);
        
        set({
          activeQuestions: questions,
          currentQuestionIndex: 0,
          isChallengeActive: true,
          currentChallengeType: 'gym',
          sessionScore: { stars: 0, gems: 0 },
        });
      },

      startBubbleChallenge: () => {
        const state = get();
        // Generate 10 rounds of 10 bubbles
        const questions = questionEngine.generateBubbleChallenge(state.unlockedSounds);
        set({
          activeQuestions: questions,
          currentQuestionIndex: 0,
          isChallengeActive: true,
          currentChallengeType: 'bubble',
          sessionScore: { stars: 0, gems: 0 },
        });
      },

      completeBubbleChallenge: (isPerfect) => set((state) => {
        return {
          isChallengeActive: false,
          currentChallengeType: null,
          stars: state.stars + 10, // Base reward for completing
          tickets: isPerfect ? state.tickets + 1 : state.tickets // Perfect bonus
        };
      }),

      answerQuestion: (isCorrect, attemptCount) => {
        if (isCorrect) {
          set((state) => {
            const currentQ = state.activeQuestions[state.currentQuestionIndex];
            if (!currentQ) return {}; // Prevent fatal TypeError if out of bounds
            
            // Challenge 27: Reward Inflation Fix. 0 stars if attempt > 2.
            let earnedStars = 0;
            if (currentQ.type === 'boss') {
              earnedStars = attemptCount === 1 ? 3 : (attemptCount === 2 ? 1 : 0);
            } else {
              earnedStars = attemptCount === 1 ? 2 : (attemptCount === 2 ? 1 : 0);
            }
            
            const earnedGems = currentQ.type === 'boss' && attemptCount === 1 ? 1 : 0;
            
            return {
              sessionScore: {
                stars: state.sessionScore.stars + earnedStars,
                gems: state.sessionScore.gems + earnedGems
              }
            };
          });
        }
      },

      nextQuestion: () => set((state) => ({
        currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.activeQuestions.length - 1)
      })),

      endChallenge: () => set((state) => {
        let nextNodeUpdates = {};
        
        // QA FIX: Allow progression ONLY on daily challenge
        if (!state.gameComplete && state.currentChallengeType === 'daily') {
          const stats = state.learningStats[state.currentNode];
          
          // QA FIX: Guarantee progression for players who finish a challenge (40% accuracy threshold) to avoid frustration.
          if (stats && stats.attempts >= 3) {
            const accuracy = stats.firstAttemptHits / stats.attempts;
            if (accuracy >= 0.4) {
              const currentIndex = questionEngine.sounds.findIndex(s => s.sound_id === state.currentNode || s.label === state.currentNode);
              if (currentIndex !== -1 && currentIndex + 1 < questionEngine.sounds.length) {
                const nextNodeId = questionEngine.sounds[currentIndex + 1].sound_id || questionEngine.sounds[currentIndex + 1].label;
                const nextNodeFamily = questionEngine.sounds[currentIndex + 1].family; // Get next family
                
                if (!state.unlockedSounds.includes(nextNodeId)) {
                  nextNodeUpdates = {
                    currentNode: nextNodeId,
                    unlockedSounds: [...state.unlockedSounds, nextNodeId],
                    currentChapter: nextNodeFamily || state.currentChapter // Auto-switch map chapter
                  };
                } else {
                  // If it was already unlocked, just move the cursor and map
                  nextNodeUpdates = {
                    currentNode: nextNodeId,
                    currentChapter: nextNodeFamily || state.currentChapter
                  };
                }
              } else {
                // QA FIX: Reached the end, or fallback if findIndex fails to prevent soft-lock
                nextNodeUpdates = { gameComplete: true };
              }
            }
          }
        }

        return {
          isChallengeActive: false,
          currentChallengeType: null,
          hasCompletedDaily: state.currentChallengeType === 'daily' ? true : state.hasCompletedDaily, // QA FIX: Unlock Brain Games only on daily
          stars: state.stars + state.sessionScore.stars,
          gems: state.gems + state.sessionScore.gems,
          tickets: (state.currentChallengeType === 'daily' || state.currentChallengeType === 'gym') ? state.tickets + 1 : state.tickets, // Award 1 ticket for daily or gym completion
          streak: state.currentChallengeType === 'daily' ? state.streak + 1 : state.streak,
          activeAssignment: state.currentChallengeType === 'assignment' 
            ? { ...state.activeAssignment, completed: true } 
            : state.activeAssignment,
          ...nextNodeUpdates
        };
      }),

      completeGymWorkout: (soundId) => set((state) => {
        const prevStats = state.learningStats[soundId] || { attempts: 0, firstAttemptHits: 0, confusedWith: {} };
        
        const newStats = {
          ...prevStats,
          attempts: prevStats.attempts + 2,
          firstAttemptHits: prevStats.firstAttemptHits + 2
        };
        
        return {
          learningStats: {
            ...state.learningStats,
            [soundId]: newStats
          }
        };
      }),

      // Subject selection
      setSelectedSubject: (subject) => set({ selectedSubject: subject }),

      // ---- Mathematics Slice ----
      ...createMathSlice(set, get),

      // ---- Analytics Slice ----
      ...createAnalyticsSlice(set, get),

      // ---- Encouragement Slice ----
      ...createEncouragementSlice(set, get)
    }),
    {
      name: 'phonics-game-storage',
      version: 4, // Bumped for analytics & encouragements
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') return {}; // Prevent hydration poisoning
        
        let state = { ...persistedState };
        if (version === 0 || version === 1) {
          state.activeAssignment = null;
        }
        // V2 Migration fallback
        if (!state.currentChapter) {
          state.currentChapter = 'A Families';
        }
        
        // V3 Migration: Add mathematics state if missing
        if (!state.math) {
          state.math = { ...MATH_DEFAULTS };
        }
        if (!state.selectedSubject) {
          state.selectedSubject = 'phonics';
        }
        
        // Self-Healing: Auto-disable Refresher Mode on app boot to prevent permanent progress loss
        if (state.refresherMode) {
          state.refresherMode = false;
          if (state.preRefresherState) {
            state.currentNode = state.preRefresherState.currentNode || state.currentNode;
            state.currentChapter = state.preRefresherState.currentChapter || state.currentChapter;
          }
        }
        
        // V4 Migration: Add analytics & encouragements if missing
        if (!state.analytics) {
          state.analytics = {
            mathAttempts: [],
            weeklyAggregates: {},
          };
        }
        if (!state.encouragements) {
          state.encouragements = [];
        }
        
        return state;
      },
      partialize: (state) => ({
        stars: state.stars,
        gems: state.gems,
        tickets: state.tickets,
        streak: state.streak,
        learningStats: state.learningStats,
        unlockedSounds: state.unlockedSounds,
        currentNode: state.currentNode,
        gameComplete: state.gameComplete,
        hasCompletedDaily: state.hasCompletedDaily,
        lastPlayedDate: state.lastPlayedDate,
        activeAssignment: state.activeAssignment, // Persist assignment state
        refresherMode: state.refresherMode, // Persist refresher toggle
        preRefresherState: state.preRefresherState,
        currentChapter: state.currentChapter, // Persist chapter
        selectedSubject: state.selectedSubject, // Persist subject selection
        math: state.math, // Persist entire math slice
        analytics: state.analytics, // Persist analytics
        encouragements: state.encouragements, // Persist encouragements
      })
    }
  )
);

if (typeof window !== 'undefined') {
  window.useGameStore = useGameStore;
}
