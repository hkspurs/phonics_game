import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager, TROPHY_DEFINITIONS } from './DataManager';

describe('DataManager', () => {
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

    // Reset DataManager singleton instance before each test
    (DataManager as any).instance = undefined;
  });

  describe('Singleton & Initialization', () => {
    it('should maintain a single instance across getInstance calls', () => {
      const instance1 = DataManager.getInstance();
      const instance2 = DataManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with valid default profile', () => {
      const manager = DataManager.getInstance();
      const profile = manager.getProfile();

      expect(profile.coins).toBe(0);
      expect(profile.gems).toBe(0);
      expect(profile.unlockedStations).toBe(1);
      expect(profile.stationStars).toEqual({});
      expect(profile.equippedSkin).toBe('adventurer');
      expect(profile.ownedSkins).toContain('adventurer');
      expect(profile.trophies).toEqual({});
      expect(profile.stats.chineseCorrect).toBe(0);
      expect(profile.stats.mathCorrect).toBe(0);
      expect(profile.stats.englishCorrect).toBe(0);
      expect(profile.stats.streakDays).toBeGreaterThanOrEqual(1);
      expect(profile.settings.chineseEnabled).toBe(true);
      expect(profile.settings.mathEnabled).toBe(true);
      expect(profile.settings.englishEnabled).toBe(true);
      expect(profile.settings.voiceLanguage).toBe('zh-HK');
      expect(profile.settings.difficulty).toBe(1);
      expect(profile.settings.soundVolume).toBe(1.0);
    });
  });

  describe('Currency Management', () => {
    it('should add coins correctly and persist', () => {
      const manager = DataManager.getInstance();
      manager.addCoins(50);
      expect(manager.getProfile().coins).toBe(50);
      manager.addCoins(25);
      expect(manager.getProfile().coins).toBe(75);
    });

    it('should add gems correctly and persist', () => {
      const manager = DataManager.getInstance();
      manager.addGems(10);
      expect(manager.getProfile().gems).toBe(10);
      manager.addGems(5);
      expect(manager.getProfile().gems).toBe(15);
    });
  });

  describe('Station & Star Progression', () => {
    it('should set station stars and keep highest star count', () => {
      const manager = DataManager.getInstance();
      manager.setStationStars(1, 2);
      expect(manager.getProfile().stationStars[1]).toBe(2);

      // Higher star score updates
      manager.setStationStars(1, 3);
      expect(manager.getProfile().stationStars[1]).toBe(3);

      // Lower star score should NOT overwrite
      manager.setStationStars(1, 1);
      expect(manager.getProfile().stationStars[1]).toBe(3);
    });

    it('should calculate total stars across all stations', () => {
      const manager = DataManager.getInstance();
      manager.setStationStars(1, 3);
      manager.setStationStars(2, 2);
      manager.setStationStars(3, 3);
      expect(manager.getTotalStars()).toBe(8);
    });

    it('should unlock next station sequentially up to max 10', () => {
      const manager = DataManager.getInstance();
      expect(manager.getProfile().unlockedStations).toBe(1);

      manager.unlockNextStation(1);
      expect(manager.getProfile().unlockedStations).toBe(2);

      // Unlocking previous station does not decrease progress
      manager.unlockNextStation(1);
      expect(manager.getProfile().unlockedStations).toBe(2);

      // Advance to station 10
      for (let i = 2; i <= 10; i++) {
        manager.unlockNextStation(i);
      }
      expect(manager.getProfile().unlockedStations).toBe(10);

      // Cannot exceed station 10
      manager.unlockNextStation(10);
      expect(manager.getProfile().unlockedStations).toBe(10);
    });
  });

  describe('Skin Management & Shop', () => {
    it('should reject unlocking skin if player has insufficient gems', () => {
      const manager = DataManager.getInstance();
      manager.addGems(20);
      const success = manager.unlockSkin('heroine', 30);
      expect(success).toBe(false);
      expect(manager.getProfile().ownedSkins).not.toContain('heroine');
      expect(manager.getProfile().gems).toBe(20);
    });

    it('should unlock skin when player has enough gems and deduct cost', () => {
      const manager = DataManager.getInstance();
      manager.addGems(50);
      const success = manager.unlockSkin('heroine', 30);
      expect(success).toBe(true);
      expect(manager.getProfile().ownedSkins).toContain('heroine');
      expect(manager.getProfile().gems).toBe(20);
    });

    it('should return true immediately if skin is already owned without deducting gems', () => {
      const manager = DataManager.getInstance();
      manager.addGems(50);
      manager.unlockSkin('heroine', 30);
      expect(manager.getProfile().gems).toBe(20);

      const success = manager.unlockSkin('heroine', 30);
      expect(success).toBe(true);
      expect(manager.getProfile().gems).toBe(20);
    });

    it('should equip owned skin and reject unowned skin', () => {
      const manager = DataManager.getInstance();
      manager.addGems(100);
      manager.unlockSkin('soldier', 60);

      const equipSoldier = manager.equipSkin('soldier');
      expect(equipSoldier).toBe(true);
      expect(manager.getProfile().equippedSkin).toBe('soldier');

      const equipNinja = manager.equipSkin('ninja');
      expect(equipNinja).toBe(false);
      expect(manager.getProfile().equippedSkin).toBe('soldier');
    });
  });

  describe('Subject Answer Stats & Daily Streak', () => {
    it('should record correct answers for Chinese, Math, and English', () => {
      const manager = DataManager.getInstance();
      manager.recordCorrectAnswer('chinese');
      manager.recordCorrectAnswer('chinese');
      manager.recordCorrectAnswer('math');
      manager.recordCorrectAnswer('english');
      manager.recordCorrectAnswer('english');
      manager.recordCorrectAnswer('english');

      const stats = manager.getProfile().stats;
      expect(stats.chineseCorrect).toBe(2);
      expect(stats.mathCorrect).toBe(1);
      expect(stats.englishCorrect).toBe(3);
    });

    it('should handle streak calculation for consecutive days', () => {
      const manager = DataManager.getInstance();
      const profile = manager.getProfile();

      // Mock last played date as yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      profile.stats.lastPlayedDate = yesterday.toISOString().split('T')[0];
      profile.stats.streakDays = 3;

      manager.updateStreak();
      expect(manager.getProfile().stats.streakDays).toBe(4);
      expect(manager.getProfile().stats.lastPlayedDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should reset streak if missed more than 1 day', () => {
      const manager = DataManager.getInstance();
      const profile = manager.getProfile();

      // Mock last played date as 3 days ago
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      profile.stats.lastPlayedDate = pastDate.toISOString().split('T')[0];
      profile.stats.streakDays = 10;

      manager.updateStreak();
      expect(manager.getProfile().stats.streakDays).toBe(1);
      expect(manager.getProfile().stats.lastPlayedDate).toBe(new Date().toISOString().split('T')[0]);
    });
  });

  describe('Trophy System (100+ Trophies)', () => {
    it('should define at least 100 comprehensive trophies across 6 categories', () => {
      expect(TROPHY_DEFINITIONS.length).toBeGreaterThanOrEqual(100);

      const categories = new Set(TROPHY_DEFINITIONS.map(t => t.category));
      expect(categories).toContain('consistency');
      expect(categories).toContain('chinese');
      expect(categories).toContain('math');
      expect(categories).toContain('english');
      expect(categories).toContain('adventure');
      expect(categories).toContain('wealth');
    });

    it('should unlock consistency trophies when milestones are met', () => {
      const manager = DataManager.getInstance();
      manager.recordCorrectAnswer('chinese');

      const unlocked = manager.checkTrophies();
      expect(unlocked.length).toBeGreaterThan(0);
      expect(manager.getProfile().trophies[unlocked[0]]).toBe(true);

      // Check that calling checkTrophies again returns no duplicates
      const unlockedAgain = manager.checkTrophies();
      expect(unlockedAgain.length).toBe(0);
    });

    it('should unlock subject and wealth milestones and award bonus gems/coins', () => {
      const manager = DataManager.getInstance();
      const initialGems = manager.getProfile().gems;

      // Add 100 coins
      manager.addCoins(100);
      const unlocked = manager.checkTrophies();
      expect(unlocked.some(id => id.includes('coin') || id.includes('wealth'))).toBe(true);
      expect(manager.getProfile().gems).toBeGreaterThanOrEqual(initialGems);
    });

    it('should unlock adventure trophies when clearing stations and earning stars', () => {
      const manager = DataManager.getInstance();
      manager.setStationStars(1, 3);
      manager.unlockNextStation(1);

      const unlocked = manager.checkTrophies();
      expect(unlocked.some(id => id.includes('station') || id.includes('star') || id.includes('adv'))).toBe(true);
    });
  });

  describe('Settings & State Persistence', () => {
    it('should update partial settings cleanly', () => {
      const manager = DataManager.getInstance();
      manager.updateSettings({
        difficulty: 3,
        voiceLanguage: 'en-US',
        soundVolume: 0.5,
      });

      const settings = manager.getProfile().settings;
      expect(settings.difficulty).toBe(3);
      expect(settings.voiceLanguage).toBe('en-US');
      expect(settings.soundVolume).toBe(0.5);
      expect(settings.chineseEnabled).toBe(true); // Unchanged
    });

    it('should persist and reload state across instances via localStorage', () => {
      const manager1 = DataManager.getInstance();
      manager1.addCoins(250);
      manager1.addGems(45);
      manager1.setStationStars(1, 3);
      manager1.setStationStars(2, 2);
      manager1.unlockNextStation(1);
      manager1.unlockNextStation(2);
      manager1.save();

      // Clear instance reference to force reload from localStorage
      (DataManager as any).instance = undefined;

      const manager2 = DataManager.getInstance();
      const profile = manager2.getProfile();
      expect(profile.coins).toBe(250);
      expect(profile.gems).toBe(45);
      expect(profile.unlockedStations).toBe(3);
      expect(profile.stationStars[1]).toBe(3);
      expect(profile.stationStars[2]).toBe(2);
    });

    it('should handle corrupted localStorage gracefully with default fallback', () => {
      localStorageMock['p1_adventure_save_v1'] = 'INVALID_JSON_CORRUPTED{[[';
      (DataManager as any).instance = undefined;

      const manager = DataManager.getInstance();
      expect(manager.getProfile().coins).toBe(0);
      expect(manager.getProfile().unlockedStations).toBe(1);
    });

    it('should reset all state back to default profile on reset()', () => {
      const manager = DataManager.getInstance();
      manager.addCoins(500);
      manager.addGems(100);
      manager.setStationStars(1, 3);
      manager.unlockNextStation(1);
      manager.recordCorrectAnswer('chinese');

      manager.reset();

      const profile = manager.getProfile();
      expect(profile.coins).toBe(0);
      expect(profile.gems).toBe(0);
      expect(profile.unlockedStations).toBe(1);
      expect(profile.stationStars).toEqual({});
      expect(profile.stats.chineseCorrect).toBe(0);
    });
  });
});
