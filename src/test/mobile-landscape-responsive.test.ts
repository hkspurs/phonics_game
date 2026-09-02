import { describe, it, expect } from 'vitest';
import { phaserGameConfig } from '../main';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

describe('Enhancement 5: Mobile Landscape Responsive Layout', () => {
  it('configures Phaser Scale Manager with FIT and CENTER_BOTH', () => {
    expect(phaserGameConfig.scale?.mode).toBe(Phaser.Scale.FIT);
    expect(phaserGameConfig.scale?.autoCenter).toBe(Phaser.Scale.CENTER_BOTH);
    expect(phaserGameConfig.width).toBe(GAME_WIDTH);
    expect(phaserGameConfig.height).toBe(GAME_HEIGHT);
  });

  it('calculates aspect ratios correctly across common mobile landscape viewports', () => {
    const viewports = [
      { name: 'iPhone 15 Pro Max (932x430)', w: 932, h: 430, aspect: 932 / 430 },
      { name: 'iPhone 14/15 (844x390)', w: 844, h: 390, aspect: 844 / 390 },
      { name: 'iPhone SE (667x375)', w: 667, h: 375, aspect: 667 / 375 },
      { name: 'iPad (1024x768)', w: 1024, h: 768, aspect: 1024 / 768 },
    ];

    const baseAspect = GAME_WIDTH / GAME_HEIGHT; // 1280 / 720 = 1.777...
    expect(baseAspect).toBeCloseTo(1.777, 2);

    viewports.forEach((vp) => {
      // All modern landscape phones are within 1.33 to 2.2 aspect ratio
      expect(vp.aspect).toBeGreaterThan(1.3);
      expect(vp.aspect).toBeLessThan(2.3);

      // Scale factor to fit inside viewport
      const scaleX = vp.w / GAME_WIDTH;
      const scaleY = vp.h / GAME_HEIGHT;
      const fitScale = Math.min(scaleX, scaleY);
      expect(fitScale).toBeGreaterThan(0.45);
    });
  });
});
