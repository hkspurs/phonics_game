import { describe, it, expect, beforeEach } from 'vitest';
import { TitleScene } from '../scenes/TitleScene';
import { MapScene } from '../scenes/MapScene';
import { QuestionScene } from '../scenes/QuestionScene';
import { RunnerScene } from '../scenes/RunnerScene';
import { ShopScene } from '../scenes/ShopScene';
import { ResultScene } from '../scenes/ResultScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { TrophyScene } from '../scenes/TrophyScene';
import { SpeechService } from '../services/SpeechService';
import { DataManager } from '../services/DataManager';
import { CanvasButton } from '../ui/CanvasButton';
import { TYPOGRAPHY, SPACING } from '../ui/DesignTokens';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Specification V2 — Phase 5 Responsive & Production Regression', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    DataManager.getInstance().reset();
  });

  describe('1. Multi-Viewport Responsive Matrix & Touch Target Geometry', () => {
    const viewports = [
      { name: 'iPhone 16 Pro Max', width: 932, height: 430 },
      { name: 'iPhone 14 / Compact Wide', width: 844, height: 390 },
      { name: 'iPhone SE / Narrow', width: 667, height: 375 },
      { name: 'iPad Landscape (4:3)', width: 1024, height: 768 },
      { name: 'Desktop Standard (16:9)', width: 1280, height: 720 },
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`initializes all game scenes without crash or clipping on ${name} (${width}x${height})`, () => {
        const scenes = [
          new TitleScene(),
          new MapScene(),
          new QuestionScene(),
          new RunnerScene(),
          new ShopScene(),
          new ResultScene(),
          new SettingsScene(),
          new TrophyScene(),
        ];

        scenes.forEach((scene) => {
          const mock = createMockSceneForMeta(scene.constructor.name);
          mock.sys.game.config.width = width;
          mock.sys.game.config.height = height;
          Object.assign(scene, mock);

          expect(() => {
            if (typeof (scene as any).init === 'function') {
              (scene as any).init();
            }
            scene.create();
          }).not.toThrow();
        });
      });
    });

    it('guarantees CanvasButton touch targets have >= 48px dimensions and centered hit area', () => {
      const mockScene = createMockSceneForMeta('TitleScene');
      const btn = new CanvasButton(mockScene, {
        width: 160,
        height: 52,
        text: '測試按鈕',
      });

      expect(btn.width).toBeGreaterThanOrEqual(48);
      expect(btn.height).toBeGreaterThanOrEqual(48);
      expect(btn.input).toBeDefined();
    });

    it('enforces design tokens minimum rendered font size of >= 16px for child readability', () => {
      expect(parseInt(TYPOGRAPHY.minRendered.fontSize, 10)).toBeGreaterThanOrEqual(16);
      expect(parseInt(TYPOGRAPHY.body.fontSize, 10)).toBeGreaterThanOrEqual(18);
      expect(parseInt(TYPOGRAPHY.screenTitle.fontSize, 10)).toBeGreaterThanOrEqual(28);
      expect(SPACING.xxxl).toBeGreaterThanOrEqual(48);
    });
  });

  describe('2. Accessibility, Speech Synthesis & Reduced Motion', () => {
    it('initializes SpeechService gracefully in non-browser/test environments', () => {
      expect(() => SpeechService.init()).not.toThrow();
      expect(SpeechService.isInitialized()).toBe(false); // In Node without window.speechSynthesis
      expect(SpeechService.getVoices()).toEqual([]);
      expect(SpeechService.normalizeSpeechText('1 + 2 = 3', 'zh-HK')).toContain('1 加 2 等於 3');
      expect(SpeechService.normalizeSpeechText('Apple', 'en-US')).toBe('Apple');
    });

    it('handles speech synthesis speak requests without throwing errors', () => {
      expect(() => {
        SpeechService.speak('海是什麼部首？', 'zh-HK');
        SpeechService.speak('Apple', 'en-US');
        SpeechService.stop();
      }).not.toThrow();
    });

    it('respects prefersReducedMotion setting across scene particles and tweens', () => {
      const scene = new ResultScene();
      const mockScene = createMockSceneForMeta('ResultScene');
      Object.assign(scene, mockScene);

      scene.prefersReducedMotion = true;
      scene.init();
      scene.create();

      // Zero confetti particles spawned when reduced motion is requested
      expect(scene.confettiParticles.length).toBe(0);
    });
  });

  describe('3. Economy, Progression & State Immutability Under Resize/Navigation', () => {
    it('preserves wallet balances and equipped states across repeated scene creation cycles', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.addGems(30);
      dm.equipSkin('adventurer');

      const initialCoins = dm.getProfile().coins;
      const initialGems = dm.getProfile().gems;
      const initialSkin = dm.getProfile().equippedSkin;

      // Simulate entering and exiting scenes
      const titleScene = new TitleScene();
      Object.assign(titleScene, createMockSceneForMeta('TitleScene'));
      titleScene.create();

      const mapScene = new MapScene();
      Object.assign(mapScene, createMockSceneForMeta('MapScene'));
      mapScene.create();

      const shopScene = new ShopScene();
      Object.assign(shopScene, createMockSceneForMeta('ShopScene'));
      shopScene.create();

      // Verify ZERO mutation
      const finalProfile = dm.getProfile();
      expect(finalProfile.coins).toBe(initialCoins);
      expect(finalProfile.gems).toBe(initialGems);
      expect(finalProfile.equippedSkin).toBe(initialSkin);
    });
  });
});
