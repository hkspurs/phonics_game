import { describe, expect, it } from 'vitest';
import {
  buildSimpleWordQueue,
  scheduleDelayedReview,
  updateSimpleWordStats,
} from './simpleWordReview';

const DAY = 86400000;
const WORDS = ['BAD', 'BUS', 'COT', 'DIG'].map((word) => ({ id: word, word }));

describe('Simple Word review scheduling', () => {
  it('uses 1, 3, then 7 day intervals for first-try success', () => {
    const start = Date.parse('2026-08-10T00:00:00Z');
    const first = updateSimpleWordStats(undefined, true, 0, start);
    const second = updateSimpleWordStats(first, true, 0, start);
    const third = updateSimpleWordStats(second, true, 0, start);

    expect(first.nextDue).toBe(start + DAY);
    expect(second.nextDue).toBe(start + DAY * 3);
    expect(third.nextDue).toBe(start + DAY * 7);
    expect(third.streak).toBe(3);
  });

  it('shortens review after a hinted success', () => {
    const now = Date.parse('2026-08-10T00:00:00Z');
    const result = updateSimpleWordStats(undefined, false, 2, now);

    expect(result).toMatchObject({ attempts: 1, firstTryHits: 0, hintLevel: 2, streak: 0 });
    expect(result.nextDue).toBe(now + DAY);
  });

  it('prioritises weak, due, and new words for a 16-word session', () => {
    const now = Date.parse('2026-08-10T00:00:00Z');
    const queue = buildSimpleWordQueue(WORDS, {
      BAD: { attempts: 2, firstTryHits: 0, nextDue: now + DAY },
      BUS: { attempts: 1, firstTryHits: 1, nextDue: now - 1 },
    }, () => 0.999999, now, 4);

    expect(queue.map((item) => item.word)).toEqual(['BAD', 'BUS', 'COT', 'DIG']);
  });

  it('puts a wrong word back after two other questions without growing the session', () => {
    const queue = scheduleDelayedReview(WORDS, 0);

    expect(queue).toHaveLength(4);
    expect(queue.map((item) => item.word)).toEqual(['BAD', 'BUS', 'COT', 'BAD']);
  });
});
