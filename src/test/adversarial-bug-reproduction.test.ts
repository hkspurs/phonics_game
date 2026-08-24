import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { CanvasCard } from '../ui/CanvasCard';
import { QuestionScene } from '../scenes/QuestionScene';
import { SoundManager } from '../services/SoundManager';
import { ResultScene } from '../scenes/ResultScene';
import { createMockScene } from '../ui/ui.test';

describe('Adversarial Tester 1 - Exact Bug Reproduction Suite', () => {
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
    SoundManager.reset();
  });

  describe('Bug 1: CanvasCard.wobble() resets state to normal, breaking disabled options', () => {
    it('demonstrates that wobble onComplete preserves disabled state', () => {
      let tweenOnCompleteCallback: (() => void) | null = null;
      const mockScene = createMockScene();
      mockScene.tweens = {
        killTweensOf: vi.fn(),
        add: vi.fn((config: any) => {
          tweenOnCompleteCallback = config.onComplete;
        }),
      };

      const card = new CanvasCard(mockScene, { text: 'Option A' });
      expect(card.getState()).toBe('normal');

      // QuestionScene wrong answer flow:
      card.wobble();
      card.setDisabled(true);
      expect(card.getState()).toBe('disabled');

      // Now simulate wobble tween completing after 200ms
      expect(tweenOnCompleteCallback).toBeDefined();
      tweenOnCompleteCallback!();

      // FIXED: State is preserved as 'disabled'!
      expect(card.getState()).toBe('disabled');
    });
  });

  describe('Bug 2: CanvasCard.wobble() overlapping calls cause startX position drift', () => {
    it('demonstrates coordinate drift protection on overlapping wobbles', () => {
      const mockScene = createMockScene();
      mockScene.tweens = {
        add: vi.fn(),
        killTweensOf: vi.fn(),
      };

      const card = new CanvasCard(mockScene, { x: 100, y: 100, text: 'Card' });
      expect(card.x).toBe(100);

      // 1st wobble called
      card.wobble();

      // Card moved by tween to x = 108
      card.x = 108;

      // 2nd wobble called while card is at x = 108
      card.wobble();

      // Extract the onComplete callback of the 2nd wobble
      const secondCallArgs = mockScene.tweens.add.mock.calls[1][0];
      secondCallArgs.onComplete();

      // FIXED: Card resets to original homeX (100) without drift!
      expect(card.x).toBe(100);
    });
  });

  describe('Bug 3: DataManager.claimDailySpin() double-claim infinite coin exploit', () => {
    it('demonstrates claimDailySpin idempotency protection', () => {
      const dm = DataManager.getInstance();
      const initialCoins = dm.getProfile().coins;

      const claim1 = dm.claimDailySpin(50);
      expect(claim1).toBe(true);
      expect(dm.getProfile().coins).toBe(initialCoins + 50);
      expect(dm.getDailyQuest().spinClaimed).toBe(true);

      // Second claim attempt on same day:
      const claim2 = dm.claimDailySpin(50);
      expect(claim2).toBe(false);
      // FIXED: Coins do NOT increase again!
      expect(dm.getProfile().coins).toBe(initialCoins + 50);
    });
  });

  describe('Bug 4: QuestionScene.handleHint() increments hintsUsed even with no options to eliminate', () => {
    it('demonstrates hintsUsed is not penalized when no hint options remain', () => {
      const qScene = new QuestionScene();
      qScene.init({
        stationId: 1,
        questionIndex: 0,
        questions: [
          {
            id: 'test_mc',
            subject: 'math',
            type: 'multiple_choice',
            prompt: '1 + 1 = ?',
            speakText: '1 + 1 = ?',
            options: ['2', '3'],
            correctOptionIndex: 0,
            correctAnswer: '2',
          },
        ],
      });

      // Mock choiceCards
      const card1 = { getState: () => 'normal', getValue: () => '2', wobble: vi.fn(), setDisabled: vi.fn() } as any;
      const card2 = { getState: () => 'normal', getValue: () => '3', wobble: vi.fn(), setDisabled: vi.fn() } as any;
      qScene.choiceCards = [card1, card2];

      // 1st Hint -> eliminates card2
      qScene.handleHint();
      expect(qScene.sessionStats.hintsUsed).toBe(1);

      // Now card2 is disabled
      card2.getState = () => 'disabled';

      // 2nd Hint -> No wrong options left
      qScene.handleHint();
      // FIXED: hintsUsed remains 1!
      expect(qScene.sessionStats.hintsUsed).toBe(1);
    });
  });

  describe('Bug 5: ResultScene.init() awards rewards unconditionally without idempotency check', () => {
    it('demonstrates idempotency guard on multiple ResultScene initializations', () => {
      const dm = DataManager.getInstance();

      const rScene = new ResultScene();
      rScene.init({
        stationId: 1,
        totalQuestions: 3,
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: Date.now() },
        runnerCoins: 5,
      });

      const coinsAfterFirst = dm.getProfile().coins;
      const gemsAfterFirst = dm.getProfile().gems;

      // Re-invoking init (e.g. on scene restart or re-entry with same station):
      rScene.init({
        stationId: 1,
        totalQuestions: 3,
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: Date.now() },
        runnerCoins: 5,
      });

      // FIXED: Rewards are NOT added again!
      expect(dm.getProfile().coins).toBe(coinsAfterFirst);
      expect(dm.getProfile().gems).toBe(gemsAfterFirst);
    });
  });
});
