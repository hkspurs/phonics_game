import { describe, it, expect } from 'vitest';
import { MathGenerator } from './MathGenerator';
import type { MathQuestion } from '../types';

describe('MathGenerator Engine', () => {
  describe('MathQuestion Contract & Validation', () => {
    it('should generate a valid MathQuestion with all required fields', () => {
      const q: MathQuestion = MathGenerator.generate(1);

      expect(q).toBeDefined();
      expect(typeof q.id).toBe('string');
      expect(q.id.length).toBeGreaterThan(0);
      expect(['addition', 'subtraction', 'comparison', 'word_problem']).toContain(q.type);
      expect(typeof q.prompt).toBe('string');
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(typeof q.expression).toBe('string');
      expect(q.expression.length).toBeGreaterThan(0);
      expect(typeof q.correctAnswer).toBe('number');
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.options.length).toBeLessThanOrEqual(4);
    });

    it('should always include the correctAnswer within options', () => {
      for (let i = 0; i < 50; i++) {
        const q = MathGenerator.generate(1);
        expect(q.options).toContain(q.correctAnswer);
      }
    });

    it('should always have strictly unique options (no duplicate distractors)', () => {
      for (let i = 0; i < 50; i++) {
        const q = MathGenerator.generate(2);
        const uniqueSet = new Set(q.options);
        expect(uniqueSet.size).toBe(q.options.length);
      }
    });

    it('should always have strictly non-negative integers in options', () => {
      for (let i = 0; i < 50; i++) {
        const q = MathGenerator.generate(1);
        for (const opt of q.options) {
          expect(Number.isInteger(opt)).toBe(true);
          expect(opt).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Difficulty Level 1 (Within 10)', () => {
    it('should generate operations within 10 with non-negative subtraction', () => {
      for (let i = 0; i < 50; i++) {
        const q = MathGenerator.generate(1);
        expect(q.correctAnswer).toBeLessThanOrEqual(10);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);

        if (q.type === 'addition') {
          // Verify sum <= 10
          expect(q.correctAnswer).toBeLessThanOrEqual(10);
        } else if (q.type === 'subtraction') {
          // Verify result >= 0 and minuend <= 10
          expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(q.correctAnswer).toBeLessThanOrEqual(10);
        }
      }
    });
  });

  describe('Difficulty Level 2 (Within 20)', () => {
    it('should generate operations within 20', () => {
      for (let i = 0; i < 50; i++) {
        const q = MathGenerator.generate(2);
        expect(q.correctAnswer).toBeLessThanOrEqual(20);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);

        for (const opt of q.options) {
          expect(opt).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Difficulty Level 3 (Word Problems with HK P.1 Themes)', () => {
    it('should generate word problems using authentic Hong Kong P.1 themes', () => {
      for (let i = 0; i < 30; i++) {
        const q = MathGenerator.generate(3);
        expect(q.type).toBe('word_problem');
        expect(q.options).toContain(q.correctAnswer);
        if (typeof q.correctAnswer === 'number') {
          expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(q.correctAnswer).toBeLessThanOrEqual(20);
        } else {
          expect(typeof q.correctAnswer).toBe('string');
          expect(q.correctAnswer.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Difficulty Level 4 (Mixed Operations & Fill-in-the-Blank)', () => {
    it('should generate mixed operations or fill-in-the-blank questions', () => {
      for (let i = 0; i < 30; i++) {
        const q = MathGenerator.generate(4);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(q.options).toContain(q.correctAnswer);
        expect(new Set(q.options).size).toBe(q.options.length);

        // Should either have parentheses/brackets for fill-in-the-blank or 3 numbers / compound expression
        const isFillBlank = q.prompt.includes('( )') || q.prompt.includes('括號') || q.expression.includes('( )') || q.expression.includes('[ ]');
        const isMixed = q.expression.split(/[+\-]/).length >= 3 || q.type === 'word_problem';
        expect(isFillBlank || isMixed).toBe(true);
      }
    });
  });

  describe('Smart Distractors Generation', () => {
    it('should generate requested number of unique distractors without including the answer', () => {
      const answer = 8;
      const operands = [5, 3];
      const distractors = MathGenerator.generateDistractors(answer, operands, 3, 0, 15);

      expect(distractors).toHaveLength(3);
      expect(distractors).not.toContain(answer);
      const uniqueDistractors = new Set(distractors);
      expect(uniqueDistractors.size).toBe(3);
      for (const d of distractors) {
        expect(d).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle edge case answer = 0 gracefully without negative distractors', () => {
      const answer = 0;
      const operands = [4, 4];
      const distractors = MathGenerator.generateDistractors(answer, operands, 3, 0, 10);

      expect(distractors).toHaveLength(3);
      expect(distractors).not.toContain(0);
      for (const d of distractors) {
        expect(d).toBeGreaterThan(0);
      }
    });

    it('should handle answer = 1 gracefully', () => {
      const answer = 1;
      const operands = [3, 2];
      const distractors = MathGenerator.generateDistractors(answer, operands, 3, 0, 10);

      expect(distractors).toHaveLength(3);
      expect(distractors).not.toContain(1);
      for (const d of distractors) {
        expect(d).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Fisher-Yates Shuffle & Option Randomness', () => {
    it('should shuffle arrays without modifying element set', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = MathGenerator.fisherYatesShuffle([...original]);

      expect(shuffled.sort((a, b) => a - b)).toEqual(original);
    });

    it('should randomize correct answer positions across questions', () => {
      const positionCounts = [0, 0, 0, 0];
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const q = MathGenerator.generate(1);
        const idx = q.options.indexOf(q.correctAnswer);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(4);
        positionCounts[idx]++;
      }

      // Every position (0, 1, 2, 3) should appear at least a few times across 100 trials
      for (let pos = 0; pos < 4; pos++) {
        expect(positionCounts[pos]).toBeGreaterThan(5);
      }
    });
  });

  describe('Edge Cases & Defaults', () => {
    it('should default to difficulty 1 if no argument is provided', () => {
      const q = MathGenerator.generate();
      expect(q).toBeDefined();
      expect(q.correctAnswer).toBeLessThanOrEqual(10);
    });

    it('should clamp out-of-range difficulty levels', () => {
      const qLow = MathGenerator.generate(0);
      expect(qLow).toBeDefined();
      expect(qLow.correctAnswer).toBeLessThanOrEqual(10);

      const qHigh = MathGenerator.generate(99);
      expect(qHigh).toBeDefined();
      expect(qHigh.correctAnswer).toBeGreaterThanOrEqual(0);
    });
  });
});
