import { describe, expect, it } from 'vitest';
import { ADVENTURE_EVENTS, getAdventureStep } from './adventureEvents';

describe('adventure events', () => {
  it('keeps the Phaser bridge limited to presentation events', () => {
    expect(ADVENTURE_EVENTS.SESSION_START).toBe('SESSION_START');
    expect(ADVENTURE_EVENTS.ANSWER_RESULT).toBe('ANSWER_RESULT');
    expect(ADVENTURE_EVENTS.CONTINUE).toBe('CONTINUE');
  });

  it('maps learning progress to three world landmarks', () => {
    expect(getAdventureStep(0, 5)).toBe(0);
    expect(getAdventureStep(2, 5)).toBe(1);
    expect(getAdventureStep(5, 5)).toBe(2);
  });
});
