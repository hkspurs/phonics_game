import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionEngine } from './QuestionEngine';
import { CurriculumBank } from './CurriculumBank';
import { DataManager } from '../services/DataManager';

describe('CurriculumBank', () => {
  it('should have at least 50 Chinese curriculum items', () => {
    expect(CurriculumBank.CHINESE_BANK.length).toBeGreaterThanOrEqual(50);
  });

  it('should have at least 50 English curriculum items', () => {
    expect(CurriculumBank.ENGLISH_BANK.length).toBeGreaterThanOrEqual(50);
  });

  it('should have items distributed across all difficulty levels 1 to 4 for both subjects', () => {
    for (let diff = 1; diff <= 4; diff++) {
      const zhItems = CurriculumBank.getItems('chinese', diff);
      const enItems = CurriculumBank.getItems('english', diff);
      expect(zhItems.length).toBeGreaterThan(0);
      expect(enItems.length).toBeGreaterThan(0);
    }
  });

  it('should contain diverse categories in Chinese bank', () => {
    const categories = new Set(CurriculumBank.CHINESE_BANK.map((item) => item.category));
    expect(categories.has('sentence_scramble')).toBe(true);
    expect(categories.has('antonym')).toBe(true);
    expect(categories.has('measure_word')).toBe(true);
    expect(categories.has('punctuation')).toBe(true);
  });

  it('should contain diverse categories in English bank', () => {
    const categories = new Set(CurriculumBank.ENGLISH_BANK.map((item) => item.category));
    expect(categories.has('sentence_scramble')).toBe(true);
    expect(categories.has('phonics')).toBe(true);
    expect(categories.has('sight_word')).toBe(true);
    expect(categories.has('plural')).toBe(true);
    expect(categories.has('preposition')).toBe(true);
  });

  it('should validate structure and correctness of all CurriculumBank items', () => {
    const allItems = [...CurriculumBank.CHINESE_BANK, ...CurriculumBank.ENGLISH_BANK];
    const ids = new Set<string>();

    for (const item of allItems) {
      expect(item.id).toBeTruthy();
      expect(ids.has(item.id)).toBe(false); // Unique IDs
      ids.add(item.id);

      expect(['chinese', 'english']).toContain(item.subject);
      expect([1, 2, 3, 4]).toContain(item.difficulty);
      expect(item.prompt).toBeTruthy();
      expect(item.speakText).toBeTruthy();

      if (item.type === 'sentence_scramble') {
        expect(item.tokens).toBeDefined();
        expect(item.tokens!.length).toBeGreaterThanOrEqual(2);
      } else if (item.type === 'multiple_choice') {
        expect(item.options).toBeDefined();
        expect(item.options!.length).toBeGreaterThanOrEqual(2);
        expect(typeof item.correctOptionIndex).toBe('number');
        expect(item.correctOptionIndex).toBeGreaterThanOrEqual(0);
        expect(item.correctOptionIndex).toBeLessThan(item.options!.length);
        expect(item.correctAnswer).toBe(item.options![item.correctOptionIndex!]);
      }
    }
  });
});

describe('QuestionEngine', () => {
  beforeEach(() => {
    QuestionEngine.resetHistory();
    DataManager.getInstance().reset();
  });

  describe('Station Question Dispatcher', () => {
    it('should return 3 questions for a station with default subjects (1 Chinese, 1 Math, 1 English)', () => {
      const questions = QuestionEngine.getStationQuestions(1, 1);
      expect(questions).toHaveLength(3);

      const subjects = questions.map((q) => q.subject);
      expect(subjects).toContain('chinese');
      expect(subjects).toContain('math');
      expect(subjects).toContain('english');
    });

    it('should generate valid Math question in the station questions', () => {
      const questions = QuestionEngine.getStationQuestions(1, 2);
      const mathQ = questions.find((q) => q.subject === 'math');

      expect(mathQ).toBeDefined();
      expect(mathQ!.id).toBeTruthy();
      expect(mathQ!.prompt).toBeTruthy();
      expect(mathQ!.speakText).toBeTruthy();
      expect(mathQ!.options).toBeDefined();
      expect(mathQ!.options!.length).toBeGreaterThanOrEqual(3);
      expect(typeof mathQ!.correctOptionIndex).toBe('number');
      expect(mathQ!.correctOptionIndex).toBeGreaterThanOrEqual(0);
      expect(mathQ!.correctAnswer).toBeDefined();
    });

    it('should generate valid Chinese and English questions in station questions', () => {
      const questions = QuestionEngine.getStationQuestions(1, 1);
      const zhQ = questions.find((q) => q.subject === 'chinese')!;
      const enQ = questions.find((q) => q.subject === 'english')!;

      expect(zhQ).toBeDefined();
      expect(enQ).toBeDefined();

      if (zhQ.type === 'sentence_scramble') {
        expect(zhQ.correctTokens).toBeDefined();
        expect(zhQ.shuffledTokens).toBeDefined();
        expect(zhQ.shuffledTokens).not.toEqual(zhQ.correctTokens);
      } else {
        expect(zhQ.options).toBeDefined();
        expect(zhQ.correctOptionIndex).toBeDefined();
      }

      if (enQ.type === 'sentence_scramble') {
        expect(enQ.correctTokens).toBeDefined();
        expect(enQ.shuffledTokens).toBeDefined();
        expect(enQ.shuffledTokens).not.toEqual(enQ.correctTokens);
      } else {
        expect(enQ.options).toBeDefined();
        expect(enQ.correctOptionIndex).toBeDefined();
      }
    });
  });

  describe('Subject Filtering & Settings', () => {
    it('should only return Math questions when only Math is enabled', () => {
      const questions = QuestionEngine.getStationQuestions(1, 1, {
        settings: { chineseEnabled: false, mathEnabled: true, englishEnabled: false },
      });

      expect(questions).toHaveLength(3);
      expect(questions.every((q) => q.subject === 'math')).toBe(true);
    });

    it('should return Chinese and English only when Math is disabled', () => {
      const questions = QuestionEngine.getStationQuestions(1, 1, {
        settings: { chineseEnabled: true, mathEnabled: false, englishEnabled: true },
      });

      expect(questions).toHaveLength(3);
      expect(questions.every((q) => q.subject === 'chinese' || q.subject === 'english')).toBe(true);
      expect(questions.some((q) => q.subject === 'chinese')).toBe(true);
      expect(questions.some((q) => q.subject === 'english')).toBe(true);
    });

    it('should fall back gracefully if all subjects are disabled in settings', () => {
      const questions = QuestionEngine.getStationQuestions(1, 1, {
        settings: { chineseEnabled: false, mathEnabled: false, englishEnabled: false },
      });

      expect(questions).toHaveLength(3);
    });
  });

  describe('Anti-Repetition Circular Buffer', () => {
    it('should track question history and avoid repeating question IDs in consecutive stations', () => {
      const station1 = QuestionEngine.getStationQuestions(1, 1);
      const station2 = QuestionEngine.getStationQuestions(2, 1);

      const s1Ids = station1.map((q) => q.id);
      const s2Ids = station2.map((q) => q.id);

      // Math IDs are dynamic so they won't repeat, Chinese and English should not repeat either
      for (const id of s2Ids) {
        expect(s1Ids).not.toContain(id);
      }
    });

    it('should maintain a buffer of up to 20 recent question IDs', () => {
      for (let i = 1; i <= 8; i++) {
        QuestionEngine.getStationQuestions(i, 1);
      }

      const history = QuestionEngine.getRecentHistory();
      expect(history.length).toBeLessThanOrEqual(20);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should clear history when resetHistory is called', () => {
      QuestionEngine.getStationQuestions(1, 1);
      expect(QuestionEngine.getRecentHistory().length).toBeGreaterThan(0);

      QuestionEngine.resetHistory();
      expect(QuestionEngine.getRecentHistory().length).toBe(0);
    });
  });

  describe('Single Question Generation', () => {
    it('should generate a single question for specified subject and difficulty', () => {
      const zhQ = QuestionEngine.generateSingleQuestion('chinese', 2);
      expect(zhQ.subject).toBe('chinese');

      const mathQ = QuestionEngine.generateSingleQuestion('math', 3);
      expect(mathQ.subject).toBe('math');

      const enQ = QuestionEngine.generateSingleQuestion('english', 1);
      expect(enQ.subject).toBe('english');
    });
  });
});
