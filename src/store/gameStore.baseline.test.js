import { describe, it, expect, beforeEach } from 'vitest';

// ===================================================================
// Baseline tests for the existing Phonics game store.
// These MUST remain green throughout the Mathematics integration work.
// ===================================================================

// We need to reset module state between tests because Zustand stores are singletons.
// Import fresh each time via dynamic import.

describe('gameStore baseline — existing Phonics behaviour', () => {
  let useGameStore;
  
  beforeEach(async () => {
    // Clear localStorage to reset persisted state
    localStorage.clear();
    
    // Re-import to get fresh store
    const mod = await import('../store/gameStore.js');
    useGameStore = mod.useGameStore;
    
    // Reset to defaults
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('has correct default profile values', () => {
    const state = useGameStore.getState();
    expect(state.stars).toBe(45);
    expect(state.gems).toBe(12);
    expect(state.tickets).toBe(2);
    expect(state.streak).toBe(5);
  });

  it('has correct default phonics progression', () => {
    const state = useGameStore.getState();
    expect(state.unlockedSounds).toEqual(['AB', 'EB']);
    expect(state.currentNode).toBe('IB');
    expect(state.gameComplete).toBe(false);
    expect(state.currentChapter).toBe('A Families');
  });

  it('has correct default challenge state', () => {
    const state = useGameStore.getState();
    expect(state.activeQuestions).toEqual([]);
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.isChallengeActive).toBe(false);
    expect(state.hasCompletedDaily).toBe(false);
    expect(state.sessionScore).toEqual({ stars: 0, gems: 0 });
  });

  it('useTicket decrements tickets', () => {
    const initial = useGameStore.getState().tickets;
    useGameStore.getState().useTicket();
    expect(useGameStore.getState().tickets).toBe(initial - 1);
  });

  it('useTicket does not go below 0', () => {
    useGameStore.setState({ tickets: 0 });
    useGameStore.getState().useTicket();
    expect(useGameStore.getState().tickets).toBe(0);
  });

  it('addTicket increments tickets', () => {
    const initial = useGameStore.getState().tickets;
    useGameStore.getState().addTicket();
    expect(useGameStore.getState().tickets).toBe(initial + 1);
  });

  it('checkDailyReset resets daily flags on new day', () => {
    useGameStore.setState({
      hasCompletedDaily: true,
      lastPlayedDate: '2020-01-01',
      sessionScore: { stars: 5, gems: 1 },
    });
    useGameStore.getState().checkDailyReset();
    const state = useGameStore.getState();
    expect(state.hasCompletedDaily).toBe(false);
    expect(state.sessionScore).toEqual({ stars: 0, gems: 0 });
  });

  it('checkDailyReset does not reset on same day', () => {
    const today = new Intl.DateTimeFormat('en-CA').format(new Date());
    useGameStore.setState({
      hasCompletedDaily: true,
      lastPlayedDate: today,
      sessionScore: { stars: 5, gems: 1 },
    });
    useGameStore.getState().checkDailyReset();
    const state = useGameStore.getState();
    expect(state.hasCompletedDaily).toBe(true);
    expect(state.sessionScore).toEqual({ stars: 5, gems: 1 });
  });

  it('recordAnswer tracks first-attempt success', () => {
    useGameStore.getState().recordAnswer('AB', true, null);
    const stats = useGameStore.getState().learningStats['AB'];
    expect(stats.attempts).toBe(1);
    expect(stats.firstAttemptHits).toBe(1);
  });

  it('recordAnswer tracks failure with confusion label', () => {
    useGameStore.getState().recordAnswer('AB', false, 'EB');
    const stats = useGameStore.getState().learningStats['AB'];
    expect(stats.attempts).toBe(1);
    expect(stats.firstAttemptHits).toBe(0);
    expect(stats.confusedWith['EB']).toBe(1);
  });

  it('getNodeStatus returns correct states', () => {
    // Current node
    useGameStore.setState({ currentNode: 'IB', gameComplete: false });
    expect(useGameStore.getState().getNodeStatus('IB')).toBe('practising');
    
    // Unlocked
    expect(useGameStore.getState().getNodeStatus('AB')).toBe('unlocked');
    
    // Locked
    expect(useGameStore.getState().getNodeStatus('ZZ')).toBe('locked');
  });

  it('resetProgress restores defaults', () => {
    useGameStore.setState({ stars: 999, gems: 999 });
    useGameStore.getState().resetProgress();
    const state = useGameStore.getState();
    expect(state.stars).toBe(0);
    expect(state.gems).toBe(0);
    expect(state.tickets).toBe(2);
  });

  it('persistence version is 2', () => {
    // Verify that the current persistence version has not changed unexpectedly
    const options = useGameStore.persist.getOptions();
    expect(options.version).toBe(2);
  });

  it('partialize preserves all expected fields', () => {
    const options = useGameStore.persist.getOptions();
    const state = useGameStore.getState();
    const partialState = options.partialize(state);

    // All these fields must be present in persisted state
    const requiredFields = [
      'stars', 'gems', 'tickets', 'streak',
      'learningStats', 'unlockedSounds', 'currentNode',
      'gameComplete', 'hasCompletedDaily', 'lastPlayedDate',
      'activeAssignment', 'refresherMode', 'preRefresherState',
      'currentChapter'
    ];
    for (const field of requiredFields) {
      expect(partialState).toHaveProperty(field);
    }
  });

  it('migration from version 0/1 sets activeAssignment to null', () => {
    const options = useGameStore.persist.getOptions();
    const migrated = options.migrate({ stars: 10 }, 0);
    expect(migrated.activeAssignment).toBe(null);
  });

  it('migration adds currentChapter if missing', () => {
    const options = useGameStore.persist.getOptions();
    const migrated = options.migrate({ stars: 10 }, 2);
    expect(migrated.currentChapter).toBe('A Families');
  });

  it('migration disables refresherMode on boot', () => {
    const options = useGameStore.persist.getOptions();
    const migrated = options.migrate({
      stars: 10,
      refresherMode: true,
      preRefresherState: { currentNode: 'XY', currentChapter: 'B Families' }
    }, 2);
    expect(migrated.refresherMode).toBe(false);
    expect(migrated.currentNode).toBe('XY');
    expect(migrated.currentChapter).toBe('B Families');
  });
});
