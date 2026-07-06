import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { questionEngine } from '../game/QuestionEngine';

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Global Profile Data
      stars: 45,
      gems: 12,
      tickets: 2, // New for Phase 5
      streak: 5,
      
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
      checkDailyReset: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
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
        if (stats && stats.attempts >= 3) {
          const accuracy = stats.firstAttemptHits / stats.attempts;
          if (accuracy >= 0.9) return 'mastered';
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
        
        // Only process Map Progression if this was a Daily Challenge
        if (state.currentChallengeType === 'daily' && !state.gameComplete) {
          const stats = state.learningStats[state.currentNode];
          
          // QA FIX: Raise mastery threshold to 90%
          if (stats && stats.attempts >= 3) {
            const accuracy = stats.firstAttemptHits / stats.attempts;
            if (accuracy >= 0.9) {
              const currentIndex = questionEngine.sounds.findIndex(s => s.sound_id === state.currentNode || s.label === state.currentNode);
              if (currentIndex !== -1) {
                if (currentIndex + 1 < questionEngine.sounds.length) {
                  const nextNodeId = questionEngine.sounds[currentIndex + 1].label;
                  if (!state.unlockedSounds.includes(nextNodeId)) {
                    nextNodeUpdates = {
                      currentNode: nextNodeId,
                      unlockedSounds: [...state.unlockedSounds, nextNodeId]
                    };
                  }
                } else {
                  // QA FIX: Reached the absolute end of the game map
                  nextNodeUpdates = { gameComplete: true };
                }
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
      version: 1, // QA FIX: Schema versioning for future-proofing
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration from unversioned to version 1
          return {
            ...persistedState,
            activeAssignment: { id: 'asgn_1', targetSoundId: 'AB', title: "Vowel 'A' Mastery", completed: false }
          };
        }
        return persistedState;
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
