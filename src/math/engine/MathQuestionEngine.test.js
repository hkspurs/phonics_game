import { describe, it, expect } from 'vitest';
import { mathQuestionEngine } from './MathQuestionEngine.js';
import { validateMathQuestion } from './validators.js';

describe('MathQuestionEngine', () => {
  describe('Generator Constraints via 1000 seeds', () => {
    it('additionGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        // Vary difficulty cyclically 1, 2, 3
        const q = mathQuestionEngine.generateQuestion('addition_within_10', {
          difficulty: (i % 3) + 1,
        });
        
        const { a, b, result } = q.values;
        expect(result).toBeLessThanOrEqual(10);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(a + b).toBe(result);
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });

    it('subtractionGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        const q = mathQuestionEngine.generateQuestion('subtraction_within_10', {
          difficulty: (i % 3) + 1,
        });
        
        const { a, b, result } = q.values;
        expect(result).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(10);
        expect(a - b).toBe(result);
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });

    it('numberBondGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        const q = mathQuestionEngine.generateQuestion('number_bonds_to_10', {
          difficulty: (i % 3) + 1,
        });
        
        const { target, givenPart, missingPart } = q.values;
        expect(givenPart).toBeGreaterThanOrEqual(0);
        expect(missingPart).toBeGreaterThanOrEqual(0);
        expect(givenPart + missingPart).toBe(target);
        expect([5, 10]).toContain(target); // MVP targets
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });

    it('countingGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        const q = mathQuestionEngine.generateQuestion('number_counting_1_20', {
          difficulty: (i % 3) + 1,
        });
        
        const { count } = q.values;
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(20);
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });

    it('orderingGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        const q = mathQuestionEngine.generateQuestion('number_ordering_1_20', {
          difficulty: (i % 3) + 1,
        });
        
        const { items } = q.values;
        expect(items.length).toBeGreaterThanOrEqual(3);
        expect(items.length).toBeLessThanOrEqual(6);
        const unique = new Set(items);
        expect(unique.size).toBe(items.length); // All unique
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });

    it('comparisonGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        const q = mathQuestionEngine.generateQuestion('compare_quantity_1_20', {
          difficulty: (i % 3) + 1,
        });
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });

    it('ordinalGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        const q = mathQuestionEngine.generateQuestion('ordinal_position_1_10', {
          difficulty: (i % 3) + 1,
        });
        
        const { position, queueSize } = q.values;
        expect(position).toBeGreaterThanOrEqual(1);
        expect(position).toBeLessThanOrEqual(queueSize);
        expect(queueSize).toBeGreaterThanOrEqual(3);
        expect(queueSize).toBeLessThanOrEqual(10);
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });

    it('patternGenerator satisfies constraints', () => {
      for (let i = 0; i < 1000; i++) {
        const q = mathQuestionEngine.generateQuestion('shape_and_pattern_basics', {
          difficulty: (i % 3) + 1,
        });
        
        const { template } = q.values;
        expect(['AB', 'AAB', 'ABB', 'ABC']).toContain(template);
        
        const val = validateMathQuestion(q);
        expect(val.valid).toBe(true);
      }
    });
  });

  describe('Session Generation', () => {
    it('generates exactly 8 questions', () => {
      const skills = ['addition_within_10', 'subtraction_within_10'];
      const session = mathQuestionEngine.generateSession(skills, {}, 12345);
      expect(session.length).toBe(8);
    });

    it('ensures no duplicate fingerprints in a session', () => {
      const skills = ['addition_within_10'];
      const session = mathQuestionEngine.generateSession(skills, {}, 9999);
      const fingerprints = session.map(q => q.fingerprint);
      const uniqueFingerprints = new Set(fingerprints);
      // It should try its best. Given addition within 10 has enough combinations,
      // 8 questions should easily be unique.
      expect(uniqueFingerprints.size).toBe(8);
    });

    it('generates 100 valid sessions with 8 questions and no duplicate fingerprints per session', () => {
      const stats = {};
      for (let i = 0; i < 100; i++) {
        // Uses the MATH_DAILY_BLUEPRINT logic internally
        const session = mathQuestionEngine.generateSession([], stats, 1000 + i);
        
        expect(session).toHaveLength(8);
        
        const fingerprints = new Set();
        session.forEach((question) => {
          expect(question.id).toBeDefined();
          expect(typeof question.id).toBe('string');
          
          expect(question.skillId).toBeDefined();
          expect(question.type).toBeDefined();
          expect(question.fingerprint).toBeDefined();
          expect(question.answer).toBeDefined();

          fingerprints.add(question.fingerprint);
        });
        
        expect(fingerprints.size).toBe(8);
      }
    });
  });

  describe('Fallback behavior', () => {
    it('returns fallback question if generator fails', () => {
      const q = mathQuestionEngine.generateQuestion('non_existent_skill', {});
      expect(q).toBeDefined();
      expect(q.id).toBeDefined();
      expect(q.answer).toBeDefined();
    });
  });

  describe('Validators catch bad questions', () => {
    it('catches missing properties', () => {
      expect(validateMathQuestion(null).valid).toBe(false);
      expect(validateMathQuestion({}).valid).toBe(false);
      expect(validateMathQuestion({ id: '1', skillId: 's', type: 't' }).valid).toBe(false); // missing answer
    });

    it('catches addition out of bounds', () => {
      const badAdd = {
        id: '1', skillId: 'addition_within_10', type: 'addition',
        answer: 11, choices: [11, 10],
        values: { a: 5, b: 6, result: 11 }
      };
      const res = validateMathQuestion(badAdd);
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/exceeds 10/);
    });

    it('catches subtraction negative answers', () => {
      const badSub = {
        id: '1', skillId: 'subtraction_within_10', type: 'subtraction',
        answer: -1, choices: [-1, 0],
        values: { a: 2, b: 3, result: -1 }
      };
      const res = validateMathQuestion(badSub);
      expect(res.valid).toBe(false);
      expect(res.reason).toMatch(/negative/);
    });
  });
});
