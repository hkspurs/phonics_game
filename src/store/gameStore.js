import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { questionEngine } from '../game/QuestionEngine';

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Global Profile Data
      stars: 45,
      gems: 12,
      tickets: 2, 
      streak: 5,
      isParentAuthenticated: false, // Prevents Parent Gate Bypass
      
      
      // Map Progression State (QA FIX)
      unlockedSounds: ['AB', 'EB'],
      currentNode: 'IB',
      gameComplete: false, // QA FIX: Dead-End Map state

      // Assignment State
      activeAssignment: { id: 'asgn_1', targetSoundId: 'AB', title: "Vowel 'A' Mastery", completed: false },

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
      setParentAuthenticated: (status) => set({ isParentAuthenticated: status }),

      checkDailyReset: () => set((state) => {
        // QA FIX: Date Locale Override Resilience - use ISO date without timezone shifting
        const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
        if (state.lastPlayedDate !== today) {
          return {
            hasCompletedDaily: false,
            sessionScore: { stars: 0, gems: 0 },
            lastPlayedDate: today
          };
        }
        return {};
      }),

      getNodeStatus: (soundId) => {
        const state = get();
        if (state.currentNode === soundId && !state.gameComplete) return 'practising';
        const stats = state.learningStats[soundId];
        // Pedagogy FIX: Require 5 attempts for statistical significance
        if (stats && stats.attempts >= 5) {
          const accuracy = stats.firstAttemptHits / stats.attempts;
          if (accuracy >= 0.8) return 'mastered';
          if (accuracy < 0.6) return 'weak';
        }
        if (state.unlockedSounds.includes(soundId)) return 'unlocked';
        return 'locked';
      },

      recordAnswer: (soundId, isFirstAttemptSuccess, confusedWithLabel) => set((state) => {
        const stats = state.learningStats[soundId] || { attempts: 0, firstAttemptHits: 0, confusedWith: {} };
        
        // Only increment attempt on the FIRST attempt of a question
        stats.attempts += 1;
        
        if (isFirstAttemptSuccess) {
          stats.firstAttemptHits += 1;
        } else if (confusedWithLabel) {
          stats.confusedWith[confusedWithLabel] = (stats.confusedWith[confusedWithLabel] || 0) + 1;
        }

        return {
          learningStats: {
            ...state.learningStats,
            [soundId]: stats
          }
        };
      }),
      useTicket: () => set((state) => ({ tickets: Math.max(0, state.tickets - 1) })),
      
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
        // QA FIX: Pass learningStats to prioritize weak sounds
        const questions = questionEngine.generateDailyChallenge(state.unlockedSounds, state.currentNode, state.learningStats);
        set({
          activeQuestions: questions,
          currentQuestionIndex: 0,
          isChallengeActive: true,
          currentChallengeType: 'daily',
          sessionScore: { stars: 0, gems: 0 },
        });
      },

      answerQuestion: (isCorrect, isFirstAttempt) => {
        if (isCorrect) {
          set((state) => {
            const currentQ = state.activeQuestions[state.currentQuestionIndex];
            if (!currentQ) return {}; // Prevent fatal TypeError if out of bounds
            const earnedStars = currentQ.type === 'boss' ? 3 : (isFirstAttempt ? 2 : 1);
            const earnedGems = currentQ.type === 'boss' ? 1 : 0;
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
        
        // QA FIX: Allow progression on ANY challenge type if game is not complete
        if (!state.gameComplete) {
          const stats = state.learningStats[state.currentNode];
          
          // QA FIX: Lower mastery threshold to 80%, but require 5 attempts for statistical significance
          if (stats && stats.attempts >= 5) {
            const accuracy = stats.firstAttemptHits / stats.attempts;
            if (accuracy >= 0.8) {
              const currentIndex = questionEngine.sounds.findIndex(s => s.sound_id === state.currentNode || s.label === state.currentNode);
              if (currentIndex !== -1 && currentIndex + 1 < questionEngine.sounds.length) {
                const nextNodeId = questionEngine.sounds[currentIndex + 1].sound_id || questionEngine.sounds[currentIndex + 1].label;
                if (!state.unlockedSounds.includes(nextNodeId)) {
                  nextNodeUpdates = {
                    currentNode: nextNodeId,
                    unlockedSounds: [...state.unlockedSounds, nextNodeId]
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
          streak: state.currentChallengeType === 'daily' ? state.streak + 1 : state.streak,
          activeAssignment: state.currentChallengeType === 'assignment' 
            ? { ...state.activeAssignment, completed: true } 
            : state.activeAssignment,
          ...nextNodeUpdates
        };
      })
    }),
    {
      name: 'phonics-game-storage',
      version: 2, // Bumped version for new schema
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') return {}; // Prevent hydration poisoning
        
        let state = { ...persistedState };
        if (version === 0 || version === 1) {
          state.activeAssignment = { id: 'asgn_1', targetSoundId: 'AB', title: "Vowel 'A' Mastery", completed: false };
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
        activeAssignment: state.activeAssignment // Persist assignment state
      })
    }
  )
);
