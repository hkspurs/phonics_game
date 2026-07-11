import { describe, it, expect, beforeEach } from 'vitest';

describe('mathSlice — Mathematics learning state', () => {
  let useGameStore;
  
  beforeEach(async () => {
    localStorage.clear();
    const mod = await import('../store/gameStore.js');
    useGameStore = mod.useGameStore;
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('has math state with defaults', () => {
    const state = useGameStore.getState();
    expect(state.math).toBeDefined();
    expect(state.math.currentUnitId).toBe('numbers-1-20');
    expect(state.math.unlockedSkillIds).toEqual(['number_counting_1_20']);
    expect(state.math.completedToday).toBe(false);
  });

  it('recordMathAnswer tracks first-attempt success', () => {
    useGameStore.getState().recordMathAnswer('addition_within_10', true, 1);
    const stats = useGameStore.getState().math.learningStats['addition_within_10'];
    expect(stats.attempts).toBe(1);
    expect(stats.firstAttemptHits).toBe(1);
  });

  it('recordMathAnswer tracks failure', () => {
    useGameStore.getState().recordMathAnswer('addition_within_10', false, 1);
    const stats = useGameStore.getState().math.learningStats['addition_within_10'];
    expect(stats.attempts).toBe(1);
    expect(stats.firstAttemptHits).toBe(0);
  });

  it('recordMathAnswer maintains rolling recent attempts', () => {
    for (let i = 0; i < 25; i++) {
      useGameStore.getState().recordMathAnswer('addition_within_10', i % 2 === 0, 1);
    }
    const recent = useGameStore.getState().math.recentAttempts['addition_within_10'];
    expect(recent.length).toBe(20); // Capped at 20
  });

  it('recordMathMisconception tracks tags', () => {
    useGameStore.getState().recordMathAnswer('subtraction_within_10', false, 1);
    useGameStore.getState().recordMathMisconception('subtraction_within_10', 'subtracts_larger_from_smaller');
    useGameStore.getState().recordMathMisconception('subtraction_within_10', 'subtracts_larger_from_smaller');
    const stats = useGameStore.getState().math.learningStats['subtraction_within_10'];
    expect(stats.misconceptions['subtracts_larger_from_smaller']).toBe(2);
  });

  it('recordMathHintUsed increments hint counter', () => {
    useGameStore.getState().recordMathAnswer('number_counting_1_20', false, 1);
    useGameStore.getState().recordMathHintUsed('number_counting_1_20');
    const stats = useGameStore.getState().math.learningStats['number_counting_1_20'];
    expect(stats.hintsUsed).toBe(1);
  });

  it('getMathSkillStatus returns locked for non-unlocked skills', () => {
    expect(useGameStore.getState().getMathSkillStatus('addition_within_10')).toBe('locked');
  });

  it('getMathSkillStatus returns unlocked for unlocked skills', () => {
    expect(useGameStore.getState().getMathSkillStatus('number_counting_1_20')).toBe('unlocked');
  });

  it('getMathSkillStatus returns mastered after 5 consecutive successes', () => {
    useGameStore.getState().unlockMathSkill('addition_within_10');
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().recordMathAnswer('addition_within_10', true, 1);
    }
    expect(useGameStore.getState().getMathSkillStatus('addition_within_10')).toBe('mastered');
  });

  it('getMathSkillStatus returns weak after failures', () => {
    useGameStore.getState().unlockMathSkill('addition_within_10');
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().recordMathAnswer('addition_within_10', false, 1);
    }
    expect(useGameStore.getState().getMathSkillStatus('addition_within_10')).toBe('weak');
  });

  it('unlockMathSkill adds skill without duplicates', () => {
    useGameStore.getState().unlockMathSkill('addition_within_10');
    useGameStore.getState().unlockMathSkill('addition_within_10');
    const skills = useGameStore.getState().math.unlockedSkillIds;
    expect(skills.filter(s => s === 'addition_within_10').length).toBe(1);
  });

  it('startMathSession sets up active session', () => {
    const mockQuestions = [{ id: 'q1' }, { id: 'q2' }];
    useGameStore.getState().startMathSession(mockQuestions);
    const state = useGameStore.getState();
    expect(state.math.isMathChallengeActive).toBe(true);
    expect(state.math.mathActiveQuestions).toEqual(mockQuestions);
    expect(state.math.mathCurrentQuestionIndex).toBe(0);
  });

  it('nextMathQuestion advances index', () => {
    const mockQuestions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];
    useGameStore.getState().startMathSession(mockQuestions);
    useGameStore.getState().nextMathQuestion();
    expect(useGameStore.getState().math.mathCurrentQuestionIndex).toBe(1);
  });

  it('nextMathQuestion does not exceed array bounds', () => {
    const mockQuestions = [{ id: 'q1' }];
    useGameStore.getState().startMathSession(mockQuestions);
    useGameStore.getState().nextMathQuestion();
    useGameStore.getState().nextMathQuestion();
    expect(useGameStore.getState().math.mathCurrentQuestionIndex).toBe(0);
  });

  it('awardMathStars accumulates session stars', () => {
    useGameStore.getState().startMathSession([]);
    useGameStore.getState().awardMathStars(2);
    useGameStore.getState().awardMathStars(1);
    expect(useGameStore.getState().math.mathSessionScore.stars).toBe(3);
  });

  it('completeMathDaily awards shared rewards and marks complete', () => {
    const initialStars = useGameStore.getState().stars;
    const initialTickets = useGameStore.getState().tickets;
    useGameStore.getState().startMathSession([]);
    useGameStore.getState().awardMathStars(5);
    useGameStore.getState().completeMathDaily();
    const state = useGameStore.getState();
    expect(state.math.completedToday).toBe(true);
    expect(state.stars).toBe(initialStars + 5);
    expect(state.tickets).toBe(initialTickets + 1);
  });

  it('setMathUnit updates current unit', () => {
    useGameStore.getState().setMathUnit('number-bonds');
    expect(useGameStore.getState().math.currentUnitId).toBe('number-bonds');
  });

  it('resetMathProgress restores defaults without affecting phonics', () => {
    useGameStore.getState().unlockMathSkill('addition_within_10');
    useGameStore.getState().recordMathAnswer('addition_within_10', true, 1);
    const phonicsStatsBefore = useGameStore.getState().learningStats;
    
    useGameStore.getState().resetMathProgress();
    
    const state = useGameStore.getState();
    expect(state.math.unlockedSkillIds).toEqual(['number_counting_1_20']);
    expect(state.math.learningStats).toEqual({});
    // Phonics unchanged
    expect(state.learningStats).toEqual(phonicsStatsBefore);
  });

  it('checkDailyReset also resets math daily on new day', () => {
    useGameStore.setState({
      lastPlayedDate: '2020-01-01',
      math: {
        ...useGameStore.getState().math,
        completedToday: true,
        mathSessionScore: { stars: 5 },
      }
    });
    useGameStore.getState().checkDailyReset();
    const state = useGameStore.getState();
    expect(state.math.completedToday).toBe(false);
    expect(state.math.mathSessionScore).toEqual({ stars: 0 });
  });
});
