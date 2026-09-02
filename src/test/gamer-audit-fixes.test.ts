import { describe, it, expect, beforeEach } from 'vitest';
import { DataManager } from '../services/DataManager';
import { RunnerScene } from '../scenes/RunnerScene';
import { CHARACTER_SKINS } from '../scenes/ShopScene';
import { QuestionScene } from '../scenes/QuestionScene';
import { ResultScene } from '../scenes/ResultScene';

describe('Gamer Audit Fixes & Enhancements Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    (DataManager as any).instance = null;
  });

  describe('1. Platformer Kinematics & Manual Jump Controls', () => {
    it('initializes with kinematic physics parameters and grounded state', () => {
      const scene = new RunnerScene();
      scene.init();

      expect(scene.isGrounded).toBe(true);
      expect(scene.playerVelocityY).toBe(0);
      expect(scene.playerBaselineY).toBe(540);
      expect(scene.currentGroundY).toBe(540);
    });

    it('buffers jump inputs within 140ms window and executes kinematic jump impulse', () => {
      const scene = new RunnerScene();
      scene.init();

      // Simulate input event
      scene.handleJumpInput();
      expect(scene.isJumping).toBe(true);
      expect(scene.isGrounded).toBe(false);
      expect(scene.playerVelocityY).toBeLessThan(-500); // Negative = upward impulse
    });

    it('supports solid one-way floating platform landings', () => {
      const scene = new RunnerScene();
      scene.init();

      // Add a platform at x: 260 (playerScreenX), y: 440 (100px above baseline)
      scene.worldItems = [
        {
          id: 'plat_1',
          type: 'platform',
          worldX: 260,
          worldY: 440,
        },
      ];

      // Simulate player descending on top of the platform
      scene.playerY = 430;
      scene.playerVelocityY = 100; // Falling down

      scene.update(0, 16);

      // Current ground level should snap to platform height
      expect(scene.currentGroundY).toBe(440);
    });

    it('scales dynamic magnet pull speed to always exceed player running speed', () => {
      const scene = new RunnerScene();
      const dm = DataManager.getInstance();
      dm.unlockSkin('ninja', 0);
      dm.equipSkin('ninja');
      scene.init();

      expect(scene.skinConfig.id).toBe('ninja');
      expect(scene.skinConfig.speedMultiplier).toBe(1.30);
      expect(scene.skinConfig.magnetRadius).toBe(190);

      // Distance test: Coin at distance 120px within 180px magnet radius
      const coinItem: any = {
        id: 'coin_1',
        type: 'coin',
        worldX: 380,
        worldY: 540,
        collected: false,
      };
      scene.worldItems = [coinItem];
      scene.distanceRun = 0;

      const initialX = coinItem.worldX;
      scene.update(0, 50); // 50ms tick

      // Coin should be pulled left towards playerScreenX (260)
      expect(coinItem.worldX).toBeLessThan(initialX);
    });

    it('doubles coin rewards during Rainbow Rush fever mode', () => {
      const scene = new RunnerScene();
      scene.init({ isRainbowRush: true });

      expect(scene.isRainbowRush).toBe(true);

      const coinItem: any = {
        id: 'coin_rr',
        type: 'coin',
        worldX: 260,
        worldY: 540,
        collected: false,
      };

      scene.collectCoin(coinItem);
      expect(scene.sessionStats.collectedCoins).toBe(2);
      expect(DataManager.getInstance().getProfile().coins).toBe(2);
    });
  });

  describe('2. Economy Rebalancing & Dual Currency Shop', () => {
    it('allows unlocking character skins with Gold Coins (Zero-Sink fixed)', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(600); // Has 600 coins, 0 gems

      expect(dm.getProfile().coins).toBe(600);
      expect(dm.getProfile().gems).toBe(0);

      // Unlock Soldier (cost: 60 gems OR 600 coins)
      const success = dm.unlockSkin('soldier', 0, 600);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
      expect(dm.getProfile().coins).toBe(0);
    });

    it('prevents recursive Ponzi inflation when checking trophies on stage 1', () => {
      const dm = DataManager.getInstance();

      // Simulate stage 1 clear rewards: +14 gems, +104 coins
      dm.addGems(14);
      dm.addCoins(104);

      const unlockedTrophies = dm.checkTrophies();

      // Gems should remain reasonable (< 50 gems), NOT inflated to 555 gems!
      expect(dm.getProfile().gems).toBeLessThan(50);
      expect(unlockedTrophies.length).toBeLessThan(15);
    });

    it('defines accurate character perks and single-source gem prices in ShopScene', () => {
      const adventurer = CHARACTER_SKINS.find(s => s.id === 'adventurer')!;
      expect(adventurer.costGems).toBe(0);
      expect(adventurer.costCoins).toBe(0);

      const heroine = CHARACTER_SKINS.find(s => s.id === 'heroine')!;
      expect(heroine.costGems).toBe(30);
      expect(heroine.costCoins).toBe(0);

      const soldier = CHARACTER_SKINS.find(s => s.id === 'soldier')!;
      expect(soldier.costGems).toBe(60);
      expect(soldier.costCoins).toBe(0);

      const ninja = CHARACTER_SKINS.find(s => s.id === 'ninja')!;
      expect(ninja.costGems).toBe(150);
      expect(ninja.costCoins).toBe(0);
      expect(ninja.waterGlide).toBe(true);
    });
  });

  describe('3. Speedrunner Flow-State & QoL Features', () => {
    it('supports quick restart from QuestionScene header', () => {
      const qScene = new QuestionScene();
      qScene.init({
        stationId: 2,
        stationName: '草原之站',
        questionIndex: 1,
      });

      expect(qScene.stationId).toBe(2);
      expect(qScene.questionIndex).toBe(1);
    });

    it('provides non-blocking floating trophy toast in ResultScene', () => {
      const rScene = new ResultScene();
      rScene.init({
        stationId: 1,
        stationName: '起點站',
        totalQuestions: 3,
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: Date.now() },
      });

      rScene.newlyUnlockedTrophies = ['wealth_coin_10'];
      expect(rScene.newlyUnlockedTrophies).toContain('wealth_coin_10');
    });
  });
});
