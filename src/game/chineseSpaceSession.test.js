import { describe, expect, it } from 'vitest';
import {
  advanceChineseSpaceQuestion,
  beginChineseSpaceCountdown,
  createChineseSpaceSession,
  resolveChineseSpaceTarget,
  resolveChineseSpaceTimeout,
} from './chineseSpaceSession';

const questions = [
  { id: 'q1', answer: { id: 'a1', text: '一' }, distractors: [{ id: 'd1', text: '二' }, { id: 'd2', text: '三' }] },
  { id: 'q2', answer: { id: 'a2', text: '四' }, distractors: [{ id: 'd3', text: '五' }, { id: 'd4', text: '六' }] },
];

describe('Chinese space session reducer', () => {
  it('starts in audio and cannot answer until countdown begins', () => {
    const state = createChineseSpaceSession(questions, 100);
    expect(state).toMatchObject({ phase: 'audio', questionIndex: 0, hp: 3, activeStartedAt: null });
    expect(resolveChineseSpaceTarget(state, 'a1', 200)).toEqual({ state, event: 'ignored' });
    expect(beginChineseSpaceCountdown(state, 300)).toMatchObject({ phase: 'active', activeStartedAt: 300 });
  });

  it('accepts only the current three targets and ignores invalid targets', () => {
    const active = beginChineseSpaceCountdown(createChineseSpaceSession(questions), 0);
    expect(resolveChineseSpaceTarget(active, 'unknown', 100)).toEqual({ state: active, event: 'ignored' });
    expect(resolveChineseSpaceTarget(active, 'a1', 100)).toMatchObject({ event: 'correct', state: { phase: 'correct' } });
  });

  it('charges a wrong target once, retries in audio, and ignores the same target thereafter', () => {
    const active = beginChineseSpaceCountdown(createChineseSpaceSession(questions), 100);
    const first = resolveChineseSpaceTarget(active, 'd1', 250);
    expect(first).toMatchObject({ event: 'wrong', state: { phase: 'audio', hp: 2, wrongTargetIds: ['d1'], activeTimeMs: 150 } });
    const retried = beginChineseSpaceCountdown(first.state, 300);
    const repeated = resolveChineseSpaceTarget(retried, 'd1', 400);
    expect(repeated).toEqual({ state: retried, event: 'ignored' });
  });

  it('accumulates active intervals across wrong retries and excludes audio and correct animation', () => {
    let state = beginChineseSpaceCountdown(createChineseSpaceSession(questions), 100);
    state = resolveChineseSpaceTarget(state, 'd1', 250).state;
    state = beginChineseSpaceCountdown(state, 1000);
    const correct = resolveChineseSpaceTarget(state, 'a1', 1300);
    expect(correct).toMatchObject({ event: 'correct', state: { activeTimeMs: 450, reactionTimes: [450], correctCount: 1 } });
    expect(advanceChineseSpaceQuestion(correct.state)).toMatchObject({
      phase: 'audio', questionIndex: 1, activeTimeMs: 0, wrongTargetIds: [], activeStartedAt: null,
      hp: 2, reactionTimes: [450], correctCount: 1,
    });
  });

  it('times out with a clamped interval, preserves the question, and ends at zero HP', () => {
    let state = beginChineseSpaceCountdown(createChineseSpaceSession(questions), 100);
    const timeout = resolveChineseSpaceTimeout(state, 9100);
    expect(timeout).toMatchObject({ event: 'timeout', state: { phase: 'audio', hp: 2, activeTimeMs: 8000, questionIndex: 0 } });
    state = beginChineseSpaceCountdown(timeout.state, 10000);
    const secondTimeout = resolveChineseSpaceTimeout(state, 19000);
    expect(secondTimeout).toMatchObject({ event: 'timeout', state: { phase: 'audio', hp: 1, activeTimeMs: 16000 } });
    state = beginChineseSpaceCountdown(secondTimeout.state, 20000);
    expect(resolveChineseSpaceTimeout(state, 28000)).toMatchObject({ event: 'gameOver', state: { phase: 'gameOver', hp: 0 } });
  });

  it.each([8000, 9000])('turns a target at or after the time limit into timeout (%ims)', (elapsed) => {
    const state = beginChineseSpaceCountdown(createChineseSpaceSession(questions), 0);
    const result = resolveChineseSpaceTarget(state, 'a1', elapsed);
    expect(result).toMatchObject({ event: 'timeout', state: { phase: 'audio', hp: 2, activeTimeMs: 8000 } });
  });

  it('completes after the last question is answered correctly', () => {
    let state = createChineseSpaceSession([questions[0]]);
    state = beginChineseSpaceCountdown(state, 0);
    const result = resolveChineseSpaceTarget(state, 'a1', 500);
    expect(result).toMatchObject({ event: 'correct', state: { phase: 'complete', questionIndex: 0, correctCount: 1, reactionTimes: [500] } });
    expect(advanceChineseSpaceQuestion(result.state)).toBe(result.state);
  });
});
