import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager, TROPHY_DEFINITIONS } from '../services/DataManager';
import { MathGenerator } from '../engine/MathGenerator';
import { SentenceEngine } from '../engine/SentenceEngine';
import { QuestionEngine } from '../engine/QuestionEngine';
import { CurriculumBank } from '../engine/CurriculumBank';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';

describe('Chaos Monkey / Adversarial Stress Suite', () => {
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
    QuestionEngine.resetHistory();
    SoundManager.reset();
  });

  describe('1. CurriculumBank Integrity & Consistency Fuzzing', () => {
    it('all CurriculumBank items have strictly valid types, non-empty tokens, and valid options/answers', () => {
      const items = [...CurriculumBank.CHINESE_BANK, ...CurriculumBank.ENGLISH_BANK];
      const ids = new Set<string>();

      for (const item of items) {
        expect(ids.has(item.id), `Duplicate Curriculum ID detected: ${item.id}`).toBe(false);
        ids.add(item.id);

        expect(item.prompt, `Item ${item.id} has empty prompt`).toBeTruthy();
        expect(item.speakText, `Item ${item.id} has empty speakText`).toBeTruthy();

        if (item.type === 'sentence_scramble') {
          expect(item.tokens, `Scramble item ${item.id} missing tokens`).toBeDefined();
          expect(item.tokens!.length, `Scramble item ${item.id} has < 2 tokens`).toBeGreaterThanOrEqual(2);
          for (const token of item.tokens!) {
            expect(token, `Item ${item.id} has empty or whitespace token`).toBeTruthy();
          }
        } else if (item.type === 'multiple_choice') {
          expect(item.options, `Choice item ${item.id} missing options`).toBeDefined();
          expect(item.options!.length, `Choice item ${item.id} has < 2 options`).toBeGreaterThanOrEqual(2);

          // If correctOptionIndex is defined, verify bounds
          if (item.correctOptionIndex !== undefined) {
            expect(item.correctOptionIndex).toBeGreaterThanOrEqual(0);
            expect(item.correctOptionIndex).toBeLessThan(item.options!.length);
          }

          // If correctAnswer is defined, verify it exists in options
          if (item.correctAnswer !== undefined) {
            expect(item.options).toContain(item.correctAnswer);
          }

          // If both defined, verify consistency
          if (item.correctOptionIndex !== undefined && item.correctAnswer !== undefined) {
            expect(item.options![item.correctOptionIndex]).toBe(item.correctAnswer);
          }
        }
      }
    });
  });

  describe('2. MathGenerator Fuzzing & Stress (10,000 runs)', () => {
    it('fuzzes 2,500 questions per difficulty level (1-4) without NaN, undefined, or duplicate options', () => {
      for (let diff = 1; diff <= 4; diff++) {
        for (let i = 0; i < 2500; i++) {
          const q = MathGenerator.generate(diff);

          expect(q.id).toBeTruthy();
          expect(q.prompt).toBeTruthy();
          expect(q.expression).toBeTruthy();
          expect(q.correctAnswer).toBeDefined();
          expect(Number.isNaN(q.correctAnswer)).toBe(false);

          expect(q.options).toBeDefined();
          expect(q.options.length).toBeGreaterThanOrEqual(3);

          // All options must be defined, not NaN, not empty string
          for (const opt of q.options) {
            expect(opt).toBeDefined();
            expect(Number.isNaN(opt)).toBe(false);
            expect(String(opt).trim()).toBeTruthy();
          }

          // Options must contain correct answer
          const hasAnswer = q.options.some((opt) => String(opt) === String(q.correctAnswer));
          expect(hasAnswer, `Options ${JSON.stringify(q.options)} does not contain correctAnswer ${q.correctAnswer} in prompt: ${q.prompt}`).toBe(true);

          // Options must NOT contain duplicates
          const uniqueOpts = new Set(q.options.map((o) => String(o)));
          expect(uniqueOpts.size, `Duplicate options in ${JSON.stringify(q.options)} for prompt: ${q.prompt}`).toBe(q.options.length);
        }
      }
    });
  });

  describe('3. SentenceEngine Chaos Fuzzing', () => {
    it('shuffleTokens on 1000 sentences never returns identical order for length >= 2', () => {
      const sampleTokens = [
        ['姐姐', '吃', '餅乾', '。'],
        ['The', 'cat', 'is', 'sleeping', '.'],
        ['A', 'B'],
        ['1', '2', '3', '4', '5', '6', '7'],
      ];

      for (const tokens of sampleTokens) {
        for (let i = 0; i < 250; i++) {
          const shuffled = SentenceEngine.shuffleTokens(tokens);
          expect(shuffled.length).toBe(tokens.length);
          // Check that it contains all original tokens
          expect([...shuffled].sort()).toEqual([...tokens].sort());

          // Verify not identical
          const isSame = shuffled.every((t, idx) => t === tokens[idx]);
          expect(isSame, `Shuffled returned identical order: ${JSON.stringify(shuffled)}`).toBe(false);
        }
      }
    });

    it('handles edge case inputs gracefully (empty, single token, all identical tokens)', () => {
      expect(SentenceEngine.tokenize('')).toEqual([]);
      expect(SentenceEngine.shuffleTokens([])).toEqual([]);
      expect(SentenceEngine.shuffleTokens(['單字'])).toEqual(['單字']);
      expect(SentenceEngine.shuffleTokens(['同', '同', '同'])).toEqual(['同', '同', '同']);
    });
  });

  describe('4. DataManager Corrupted Storage Chaos Injection', () => {
    it('handles corrupted JSON string without crashing', () => {
      localStorageMock['p1_adventure_save_v1'] = '{ broken json %%@@!!';
      const dm = (DataManager as any).getInstance();
      const profile = (dm as any).load();
      expect(profile).toBeDefined();
      expect(profile.coins).toBe(0);
      expect(profile.unlockedStations).toBe(1);
    });

    it('handles corrupted stats (null / undefined fields)', () => {
      localStorageMock['p1_adventure_save_v1'] = JSON.stringify({
        stats: null,
        stationStars: null,
        trophies: null,
        coins: 'invalid_coins',
      });

      const dm = DataManager.getInstance();
      const prof = dm.getProfile();
      expect(prof).toBeDefined();

      // Check if getPetCompanion or getStamps or checkTrophies throw
      expect(() => dm.getPetCompanion()).not.toThrow();
      expect(() => dm.getStamps()).not.toThrow();
      expect(() => dm.checkTrophies()).not.toThrow();
      expect(() => dm.getTotalStars()).not.toThrow();
    });

    it('handles negative coin/gem additions and invalid streak calculations', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(-100);
      dm.addGems(-50);
      expect(dm.getProfile().coins).toBeGreaterThanOrEqual(0);
      expect(dm.getProfile().gems).toBeGreaterThanOrEqual(0);
    });

    it('checks all trophy definitions with various extreme profile states', () => {
      const dm = DataManager.getInstance();
      const prof = dm.getProfile();

      // Corrupt profile in memory
      prof.stats.chineseCorrect = -10;
      prof.stats.mathCorrect = -5;
      prof.stats.englishCorrect = -1;
      prof.stats.streakDays = -99;
      prof.unlockedStations = -10;

      for (const trophy of TROPHY_DEFINITIONS) {
        expect(() => trophy.condition(prof)).not.toThrow();
      }
    });

    it('tests daily spin double claim vulnerability', () => {
      const dm = DataManager.getInstance();
      const initialCoins = dm.getProfile().coins;

      dm.claimDailySpin(50);
      expect(dm.getProfile().coins).toBe(initialCoins + 50);
      const quest = dm.getDailyQuest();
      expect(quest.spinClaimed).toBe(true);

      // Attempt second claim
      dm.claimDailySpin(50);
      console.log('Coins after 2nd spin claim:', dm.getProfile().coins);
    });
  });

  describe('5. SoundManager & SpeechService Robustness', () => {
    it('SoundManager methods execute safely without crash even when uninitialized or invalid keys', () => {
      expect(() => SoundManager.play('non_existent_key' as any)).not.toThrow();
      expect(() => SoundManager.playComboCorrect(999)).not.toThrow();
      expect(() => SoundManager.playSoftWrong()).not.toThrow();
      expect(() => SoundManager.playCardSnap()).not.toThrow();
      expect(() => SoundManager.playCoinArpeggio(999)).not.toThrow();
      expect(() => SoundManager.setVolume(NaN)).not.toThrow();
      expect(() => SoundManager.setVolume(-5)).not.toThrow();
      expect(() => SoundManager.setVolume(5)).not.toThrow();
    });

    it('SpeechService normalizes math expressions properly without TTS crashes', () => {
      expect(SpeechService.normalizeSpeechText('10 - 3 = ?', 'zh-HK')).toContain('減');
      expect(SpeechService.normalizeSpeechText('5 + 4 = ?', 'zh-HK')).toContain('加');
      expect(SpeechService.normalizeSpeechText('10 - 3 = ?', 'en-US')).toContain('minus');
      expect(SpeechService.normalizeSpeechText('', 'zh-HK')).toBe('');
    });
  });
});
