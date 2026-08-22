import { describe, it, expect } from 'vitest';
import { DEFAULT_GAME_SETTINGS, GAME_WIDTH, GAME_HEIGHT, GAME_TITLE } from './config';

describe('Project Scaffolding & Setup', () => {
  it('should define correct canvas resolution of 1280x720', () => {
    expect(GAME_WIDTH).toBe(1280);
    expect(GAME_HEIGHT).toBe(720);
    expect(DEFAULT_GAME_SETTINGS.width).toBe(1280);
    expect(DEFAULT_GAME_SETTINGS.height).toBe(720);
  });

  it('should target the game-container DOM element', () => {
    expect(DEFAULT_GAME_SETTINGS.parent).toBe('game-container');
  });

  it('should have the proper game title and background color', () => {
    expect(GAME_TITLE).toContain('升夢大冒險');
    expect(DEFAULT_GAME_SETTINGS.backgroundColor).toBe('#1a1a2e');
  });
});
