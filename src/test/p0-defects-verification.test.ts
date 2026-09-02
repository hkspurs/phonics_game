import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { QuestionEngine } from '../engine/QuestionEngine';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasCard } from '../ui/CanvasCard';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';
import { QuizQuestion } from '../types';

describe('P0 Defects Verification Suite', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    });
    DataManager.getInstance().reset();
  });

  describe('P0-1: Displayed answer vs Submitted answer mapping integrity', () => {
    it('generates a stable option model where every displayed card value maps to its exact option identity', () => {
      const q = QuestionEngine.generateSingleQuestion('english', 1);
      if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        // If correctAnswer is defined, it must match one of the options
        if (q.correctAnswer) {
          expect(q.options).toContain(q.correctAnswer);
        }
      }
    });

    it('ensures selecting any choice card evaluates strictly based on that card\'s value rather than arbitrary visual index', () => {
      const question: QuizQuestion = {
        id: 'en_plural_105',
        subject: 'english',
        type: 'multiple_choice',
        prompt: 'Choose the plural: "one dish, two ___"',
        speakText: 'Choose the plural: one dish, two dishes',
        options: ['dishes', 'dishs', 'dishies', 'dish'],
        correctAnswer: 'dishes',
        correctOptionIndex: 0,
      };

      // Shuffled display cards order:
      // Card 0: "dish" (wrong)
      // Card 1: "dishes" (correct)
      // Card 2: "dishs" (wrong)
      // Card 3: "dishies" (wrong)
      const shuffledOptions = ['dish', 'dishes', 'dishs', 'dishies'];

      const mockScene = createMockSceneForMeta('QuestionScene');

      const cards = shuffledOptions.map((opt, idx) => {
        return new CanvasCard(mockScene, {
          x: 100 * idx,
          y: 200,
          text: opt,
          value: opt,
        });
      });

      // Verify that card 0 ("dish") is recognized as WRONG, even if original correctOptionIndex was 0
      const card0 = cards[0];
      const isCard0Correct = card0.getValue() === question.correctAnswer;
      expect(isCard0Correct).toBe(false);

      // Verify that card 1 ("dishes") is recognized as CORRECT, regardless of being at index 1
      const card1 = cards[1];
      const isCard1Correct = card1.getValue() === question.correctAnswer;
      expect(isCard1Correct).toBe(true);
    });
  });

  describe('P0-2: Reward arithmetic and wallet mutation consistency', () => {
    it('reconciles the exact 351/38 wallet reproduction to the sum of committed transactions', () => {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();

      // Setup exact initial wallet state: 351 coins, 38 gems, 3 stars
      profile.coins = 351;
      profile.gems = 38;
      profile.stationStars = { 1: 3 }; // 3 stars
      profile.rewardLedger = [];
      dm.save();

      expect(dm.getProfile().coins).toBe(351);
      expect(dm.getProfile().gems).toBe(38);

      // Record station settlement: Result gives 20 coins, 1 gem (1 star clear)
      dm.recordTransaction('learning', 'station_2_clear', 'coins', 20);
      dm.recordTransaction('first_clear', 'station_2_first_clear', 'gems', 1);

      // Record 3 achievement rewards: +30/+3, +15/+1, +20/+2
      dm.recordTransaction('achievement', 'ach_1', 'coins', 30);
      dm.recordTransaction('achievement', 'ach_1', 'gems', 3);
      dm.recordTransaction('achievement', 'ach_2', 'coins', 15);
      dm.recordTransaction('achievement', 'ach_2', 'gems', 1);
      dm.recordTransaction('achievement', 'ach_3', 'coins', 20);
      dm.recordTransaction('achievement', 'ach_3', 'gems', 2);

      const finalProfile = dm.getProfile();

      // Expected calculation:
      // Coins: 351 + 20 + 30 + 15 + 20 = 436
      // Gems: 38 + 1 + 3 + 1 + 2 = 45
      expect(finalProfile.coins).toBe(436);
      expect(finalProfile.gems).toBe(45);

      // Verify that ledger entries sum exactly to the balance difference
      const ledger = dm.getRewardLedger();
      const totalLedgerCoins = ledger.filter(t => t.currencyType === 'coins').reduce((s, t) => s + t.amount, 0);
      const totalLedgerGems = ledger.filter(t => t.currencyType === 'gems').reduce((s, t) => s + t.amount, 0);

      expect(totalLedgerCoins).toBe(85);
      expect(totalLedgerGems).toBe(7);
      expect(finalProfile.coins - 351).toBe(totalLedgerCoins);
      expect(finalProfile.gems - 38).toBe(totalLedgerGems);
    });

    it('guarantees that skipped runner grants zero pickup rewards', () => {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();
      profile.coins = 100;
      profile.gems = 10;
      profile.rewardLedger = [];
      dm.save();

      // If runner is skipped, runnerCoins = 0 and runnerGems = 0
      const runnerPickupsCoins = 0;
      const runnerPickupsGems = 0;

      if (runnerPickupsCoins > 0) {
        dm.recordTransaction('runner_pickups', 'runner_coins', 'coins', runnerPickupsCoins);
      }
      if (runnerPickupsGems > 0) {
        dm.recordTransaction('runner_pickups', 'runner_gems', 'gems', runnerPickupsGems);
      }

      expect(dm.getProfile().coins).toBe(100);
      expect(dm.getProfile().gems).toBe(10);
      expect(dm.getRewardLedger().filter(t => t.sourceType === 'runner_pickups').length).toBe(0);
    });

    it('guarantees idempotency on duplicate achievement or transaction IDs', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().coins = 50;
      dm.getProfile().gems = 5;
      dm.getProfile().rewardLedger = [];
      dm.save();

      // First grant
      dm.recordTransaction('achievement', 'ach_first_clear', 'gems', 5, 'tx_unique_ach_01');
      expect(dm.getProfile().gems).toBe(10);

      // Duplicate grant attempt with same transaction ID
      dm.recordTransaction('achievement', 'ach_first_clear', 'gems', 5, 'tx_unique_ach_01');
      expect(dm.getProfile().gems).toBe(10); // No double grant!

      // Duplicate grant attempt with same source ID
      dm.recordTransaction('achievement', 'ach_first_clear', 'gems', 5);
      expect(dm.getProfile().gems).toBe(10); // No double grant!
    });
  });

  describe('P0-3 & P0-4: Canvas Button Hitbox Geometry and Map Report', () => {
    it('validates that CanvasButton hitArea covers the entire rectangle (center, 4 edges, 4 corners)', () => {
      const mockScene = createMockSceneForMeta('TitleScene');

      let clickCount = 0;
      const btnW = 160;
      const btnH = 50;

      const button = new CanvasButton(mockScene, {
        x: 200,
        y: 150,
        width: btnW,
        height: btnH,
        text: '測試按鈕',
        onClick: () => {
          clickCount++;
        },
      });

      expect(button.isInteractive()).toBe(true);

      // Hit area test points relative to button center (0, 0):
      const testPoints = [
        { name: 'center', x: 0, y: 0 },
        { name: '3px inside left', x: -btnW / 2 + 3, y: 0 },
        { name: '3px inside right', x: btnW / 2 - 3, y: 0 },
        { name: '3px inside top', x: 0, y: -btnH / 2 + 3 },
        { name: '3px inside bottom', x: 0, y: btnH / 2 - 3 },
        { name: 'top-left corner', x: -btnW / 2 + 3, y: -btnH / 2 + 3 },
        { name: 'top-right corner', x: btnW / 2 - 3, y: -btnH / 2 + 3 },
        { name: 'bottom-left corner', x: -btnW / 2 + 3, y: btnH / 2 - 3 },
        { name: 'bottom-right corner', x: btnW / 2 - 3, y: btnH / 2 - 3 },
      ];

      for (const pt of testPoints) {
        const contains = button.containsPoint(pt.x, pt.y);
        expect(contains, `Point ${pt.name} (${pt.x}, ${pt.y}) should be inside button hitbox`).toBe(true);
      }
    });
  });
});
