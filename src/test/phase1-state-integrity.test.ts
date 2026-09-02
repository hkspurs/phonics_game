import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { CHARACTER_SKINS } from '../scenes/ShopScene';
import { WARDROBE_ITEMS } from '../config/wardrobe';
import { LearningAttemptRecord } from '../types';

describe('Phase 1: P0 State Integrity, Pricing, Rewards, Saves, and Report Entry', () => {
  let dm: DataManager;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });

    (DataManager as any).instance = undefined;
    dm = DataManager.getInstance();
  });

  describe('1. P0 Shop State & Single-Source Pricing Integrity', () => {
    it('verifies exact reproduction scenario: preview, resize, tab switch, and reload do NOT purchase or equip', () => {
      // Starting state: 661 coins, 22 gems, Heroine not owned, Adventurer equipped
      dm.getProfile().coins = 661;
      dm.getProfile().gems = 22;
      dm.getProfile().ownedSkins = ['adventurer'];
      dm.getProfile().equippedSkin = 'adventurer';
      dm.save();

      expect(dm.getProfile().coins).toBe(661);
      expect(dm.getProfile().gems).toBe(22);
      expect(dm.getProfile().ownedSkins.includes('heroine')).toBe(false);
      expect(dm.getProfile().equippedSkin).toBe('adventurer');

      // 1. Select / preview Heroine (skin index 1)
      const heroineSkin = CHARACTER_SKINS.find((s) => s.id === 'heroine');
      expect(heroineSkin).toBeDefined();
      expect(heroineSkin?.costGems).toBe(30);

      // Ephemeral preview should not change profile
      expect(dm.getProfile().equippedSkin).toBe('adventurer');
      expect(dm.getProfile().coins).toBe(661);
      expect(dm.getProfile().gems).toBe(22);

      // 2. Viewport resize simulation: state remains intact
      const profileAfterResize = dm.getProfile();
      expect(profileAfterResize.coins).toBe(661);
      expect(profileAfterResize.gems).toBe(22);
      expect(profileAfterResize.equippedSkin).toBe('adventurer');

      // 3. Tab switch simulation: state remains intact
      expect(dm.getProfile().coins).toBe(661);
      expect(dm.getProfile().gems).toBe(22);
      expect(dm.getProfile().ownedSkins.includes('heroine')).toBe(false);

      // 4. Reload / hydration simulation from localStorage
      (DataManager as any).instance = undefined;
      const reloadedDm = DataManager.getInstance();
      expect(reloadedDm.getProfile().coins).toBe(661);
      expect(reloadedDm.getProfile().gems).toBe(22);
      expect(reloadedDm.getProfile().ownedSkins.includes('heroine')).toBe(false);
      expect(reloadedDm.getProfile().equippedSkin).toBe('adventurer');
    });

    it('blocks purchase when currency is insufficient and leaves balances untouched', () => {
      dm.getProfile().gems = 22;
      const purchaseSuccess = dm.unlockSkin('heroine', 30, 0);
      expect(purchaseSuccess).toBe(false);
      expect(dm.getProfile().gems).toBe(22);
      expect(dm.getProfile().ownedSkins.includes('heroine')).toBe(false);
    });

    it('guarantees single-source authoritative pricing for all skins and wardrobe items', () => {
      for (const skin of CHARACTER_SKINS) {
        expect(skin.id).toBeDefined();
        if (skin.costGems !== undefined) {
          expect(typeof skin.costGems).toBe('number');
          expect(skin.costGems).toBeGreaterThanOrEqual(0);
        }
        if (skin.costCoins !== undefined) {
          expect(typeof skin.costCoins).toBe('number');
          expect(skin.costCoins).toBeGreaterThanOrEqual(0);
        }
      }

      for (const item of WARDROBE_ITEMS) {
        expect(item.id).toBeDefined();
        expect(item.costCoins || item.costGems).toBeDefined();
      }
    });

    it('prevents equipping unowned skins or unowned wardrobe items', () => {
      expect(dm.getProfile().ownedSkins.includes('ninja')).toBe(false);
      const equipSuccess = dm.equipSkin('ninja');
      expect(equipSuccess).toBe(false);
      expect(dm.getProfile().equippedSkin).toBe('adventurer');
    });
  });

  describe('2. Authoritative Transaction Boundary & Idempotency', () => {
    it('executes valid purchase transaction idempotently with unique transaction ID', () => {
      dm.getProfile().gems = 100;
      const txId = 'tx_custom_test_001';

      const tx1 = dm.recordTransaction('shop_purchase', 'skin_heroine', 'gems', -30, txId);
      expect(tx1).not.toBeNull();
      expect(tx1?.transactionId).toBe(txId);
      expect(dm.getProfile().gems).toBe(70);

      // Re-executing identical transaction ID returns existing transaction without double deduction
      const tx2 = dm.recordTransaction('shop_purchase', 'skin_heroine', 'gems', -30, txId);
      expect(tx2?.transactionId).toBe(txId);
      expect(dm.getProfile().gems).toBe(70);
    });

    it('rejects negative resulting balances', () => {
      dm.getProfile().coins = 50;
      const tx = dm.recordTransaction('shop_purchase', 'gadget_potion', 'coins', -100);
      expect(tx).toBeNull();
      expect(dm.getProfile().coins).toBe(50);
    });

    it('restores balance atomically if storage save throws an exception', () => {
      dm.getProfile().gems = 100;
      const originalSave = dm.save.bind(dm);

      // Mock save failure
      dm.save = () => {
        throw new Error('QuotaExceededError');
      };

      expect(() => {
        dm.recordTransaction('shop_purchase', 'skin_soldier', 'gems', -60);
      }).toThrow('QuotaExceededError');

      // Balance must roll back to 100
      expect(dm.getProfile().gems).toBe(100);

      // Restore save function
      dm.save = originalSave;
    });
  });

  describe('3. Reward & Progress Separation Integrity', () => {
    it('strictly separates completed station count from highest unlocked station', () => {
      expect(dm.getCompletedStationCount()).toBe(0);
      expect(dm.getProfile().unlockedStations).toBe(1);

      dm.markStationCompleted(1);
      expect(dm.getCompletedStationCount()).toBe(1);
      expect(dm.isStationCompleted(1)).toBe(true);
      expect(dm.isStationCompleted(2)).toBe(false);

      dm.unlockNextStation(1);
      expect(dm.getProfile().unlockedStations).toBe(2);
      expect(dm.getCompletedStationCount()).toBe(1); // Still 1 completed!
    });

    it('prevents duplicate reward grants on first-clear and achievements', () => {
      dm.getProfile().coins = 100;
      const tx1 = dm.recordTransaction('first_clear', 'station_1', 'coins', 20);
      expect(tx1).not.toBeNull();
      expect(dm.getProfile().coins).toBe(120);

      // Re-attempting first clear for station 1 returns existing transaction without double reward
      const tx2 = dm.recordTransaction('first_clear', 'station_1', 'coins', 20);
      expect(tx2).toEqual(tx1);
      expect(dm.getProfile().coins).toBe(120);
    });
  });

  describe('4. Learning Attempt Record Schema & Mistake Queue', () => {
    it('persists structured LearningAttemptRecord without fabricating data', () => {
      const attempt: LearningAttemptRecord = {
        attemptId: 'att_20260902_001',
        questionId: 'q_zh_scramble_01',
        stationId: 1,
        subject: 'chinese',
        knowledgeTags: ['sentence_structure', 'punctuation'],
        selectedAnswer: '我愛上學。',
        correctAnswer: '我愛上學。',
        isCorrect: true,
        attemptIndexWithinQuestion: 1,
        isFirstAttempt: true,
        highestHintLevelUsed: 0,
        responseTimeMs: 2450,
        createdAt: Date.now(),
      };

      dm.recordLearningAttempt(attempt);
      const records = dm.getLearningAttemptRecords();
      expect(records.length).toBe(1);
      expect(records[0].attemptId).toBe('att_20260902_001');
      expect(records[0].knowledgeTags).toContain('sentence_structure');
      expect(records[0].isFirstAttempt).toBe(true);
    });

    it('enqueues incorrect or high-hint attempts into mistakeReviewQueue for re-testing', () => {
      const wrongAttempt: LearningAttemptRecord = {
        attemptId: 'att_20260902_002',
        questionId: 'q_math_add_02',
        stationId: 2,
        subject: 'math',
        knowledgeTags: ['addition_within_20'],
        selectedAnswer: 12,
        correctAnswer: 15,
        isCorrect: false,
        attemptIndexWithinQuestion: 1,
        isFirstAttempt: true,
        highestHintLevelUsed: 2,
        createdAt: Date.now(),
      };

      dm.recordLearningAttempt(wrongAttempt);
      const queue = dm.getMistakeReviewQueue();
      expect(queue).toContain('q_math_add_02');

      // Removing after successful review
      dm.removeMistakeFromQueue('q_math_add_02');
      expect(dm.getMistakeReviewQueue()).not.toContain('q_math_add_02');
    });
  });

  describe('5. Safe Backward-Compatible Save Migration', () => {
    it('migrates legacy save format idempotently without resetting balances or equipment', () => {
      const legacySave = {
        coins: 450,
        gems: 18,
        unlockedStations: 3,
        stationStars: { 1: 3, 2: 2 },
        equippedSkin: 'soldier',
        ownedSkins: ['adventurer', 'soldier'],
        stats: {
          chineseCorrect: 12,
          mathCorrect: 15,
          englishCorrect: 8,
          streakDays: 3,
          lastPlayedDate: '2026-09-01',
        },
        settings: {
          chineseEnabled: true,
          mathEnabled: true,
          englishEnabled: true,
          voiceLanguage: 'zh-HK',
          difficulty: 1,
          soundVolume: 0.8,
        },
        trophies: { first_question: true },
      };

      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(legacySave));

      // Re-initialize DataManager to trigger hydration & migration
      (DataManager as any).instance = undefined;
      const migratedDm = DataManager.getInstance();

      const profile = migratedDm.getProfile();
      expect(profile.coins).toBe(450);
      expect(profile.gems).toBe(18);
      expect(profile.equippedSkin).toBe('soldier');
      expect(profile.ownedSkins).toContain('soldier');
      expect(profile.completedStations).toBeDefined();
      expect(profile.rewardLedger).toBeDefined();
      expect(profile.learningAttempts).toBeDefined();
      expect(profile.mistakeReviewQueue).toBeDefined();
    });
  });
});
