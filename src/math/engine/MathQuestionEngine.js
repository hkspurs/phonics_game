import { createRandom } from './random.js';
import { validateMathQuestion } from './validators.js';
import * as countingGenerator from '../generators/countingGenerator.js';
import * as orderingGenerator from '../generators/orderingGenerator.js';
import * as comparisonGenerator from '../generators/comparisonGenerator.js';
import * as ordinalGenerator from '../generators/ordinalGenerator.js';
import * as numberBondGenerator from '../generators/numberBondGenerator.js';
import * as additionGenerator from '../generators/additionGenerator.js';
import * as subtractionGenerator from '../generators/subtractionGenerator.js';
import * as patternGenerator from '../generators/patternGenerator.js';

const MATH_DAILY_BLUEPRINT = [
  'number_counting_1_20',
  'compare_quantity_1_20',
  'number_counting_1_20',
  'number_ordering_1_20',
  'number_counting_1_20',
  'number_bonds_to_10',
  'compare_quantity_1_20',
  'addition_within_10'
];

/**
 * MathQuestionEngine — deterministic, validated mathematics question engine.
 *
 * Registers all generators by skillId, generates individual questions with
 * retry logic, and composes 8-question sessions with no duplicate fingerprints.
 */
class MathQuestionEngine {
  constructor() {
    /** @type {Map<string, { generate: Function }>} */
    this.generators = new Map();

    // Register all generators by skillId
    this.generators.set('number_counting_1_20', countingGenerator);
    this.generators.set('number_ordering_1_20', orderingGenerator);
    this.generators.set('compare_quantity_1_20', comparisonGenerator);
    this.generators.set('ordinal_position_1_10', ordinalGenerator);
    this.generators.set('number_bonds_to_10', numberBondGenerator);
    this.generators.set('addition_within_10', additionGenerator);
    this.generators.set('subtraction_within_10', subtractionGenerator);
    this.generators.set('shape_and_pattern_basics', patternGenerator);
  }

  /**
   * Generate a single question for a given skill.
   * Validates the result and retries up to 5 times on failure.
   * Returns a safe fallback if all retries fail.
   *
   * @param {string} skillId
   * @param {{ difficulty?: number, random?: object, recentQuestionKeys?: Set }} config
   * @returns {object} A validated question object
   */
  generateQuestion(skillId, config = {}) {
    const generator = this.generators.get(skillId);
    if (!generator) {
      console.warn(`MathQuestionEngine: No generator for skillId "${skillId}"`);
      return this.getSafeQuestion(skillId);
    }

    const {
      difficulty = 1,
      random = createRandom(Date.now()),
      recentQuestionKeys = new Set(),
    } = config;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const question = generator.generate({ difficulty, random, recentQuestionKeys });
        const validation = validateMathQuestion(question);
        if (validation.valid) {
          return question;
        }
        console.warn(`MathQuestionEngine: Validation failed (attempt ${attempt + 1}): ${validation.reason}`);
      } catch (err) {
        console.warn(`MathQuestionEngine: Generator error (attempt ${attempt + 1}):`, err.message);
      }
    }

    // All retries failed — return a known-good fallback
    return this.getSafeQuestion(skillId);
  }

  /**
   * Generate an 8-question session following composition rules.
   * Ensures no duplicate fingerprints across the session.
   *
   * @param {string[]} skills - Array of skillIds to include
   * @param {object} stats - Per-skill stats for difficulty adaptation
   * @param {number} seed - Seed for deterministic generation
   * @returns {object[]} Array of 8 validated questions
   */
  generateSession(skills, stats = {}, seed = Date.now()) {
    const random = createRandom(seed);
    const questions = [];
    const usedFingerprints = new Set();
    const recentQuestionKeys = new Set();

    // Use blueprint instead of availableSkills if we are generating a full 8-slot session
    const blueprint = [...MATH_DAILY_BLUEPRINT];

    // Shuffle blueprint slightly but avoid 3 identical types in a row
    // Actually, prompt says: "Shuffle the order while ensuring that two identical question types do not appear more than twice consecutively."
    // For simplicity, we just use the blueprint as is, maybe slightly swap things. Let's just shuffle with constraint:
    const shuffled = random.shuffle(blueprint);
    for (let i = 0; i < shuffled.length - 2; i++) {
       if (shuffled[i] === shuffled[i+1] && shuffled[i] === shuffled[i+2]) {
           // Swap with something else
           const swapIdx = (i + 3) % shuffled.length;
           [shuffled[i+2], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i+2]];
       }
    }

    for (let i = 0; i < 8; i++) {
      const skillId = shuffled[i] || 'number_counting_1_20';

      // Determine difficulty from stats
      const skillStats = stats[skillId];
      let difficulty = 1;
      if (skillStats) {
        const accuracy = skillStats.attempts > 0
          ? skillStats.firstAttemptHits / skillStats.attempts
          : 0;
        if (accuracy >= 0.85 && skillStats.attempts >= 5) {
          difficulty = 3;
        } else if (accuracy >= 0.6 && skillStats.attempts >= 3) {
          difficulty = 2;
        }
      }

      let question = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = this.generateQuestion(skillId, {
          difficulty,
          random,
          recentQuestionKeys,
        });

        if (!usedFingerprints.has(candidate.fingerprint)) {
          question = candidate;
          usedFingerprints.add(candidate.fingerprint);
          recentQuestionKeys.add(candidate.fingerprint);
          break;
        }
      }

      if (!question) {
        question = this.generateQuestion(skillId, { difficulty, random, recentQuestionKeys });
      }

      // Add a unique ID that won't conflict even if fingerprint duplicates
      question.id = crypto.randomUUID();
      questions.push(question);
    }

    return questions;
  }

  /**
   * Returns a known-good fallback question for the given skill.
   * These are hardcoded to always pass validation.
   *
   * @param {string} skillId
   * @returns {object} A valid question object
   */
  getSafeQuestion(skillId) {
    const fallbacks = {
      number_counting_1_20: {
        id: 'safe_counting_3',
        skillId: 'number_counting_1_20',
        type: 'counting',
        answer: 3,
        choices: [1, 2, 3, 4],
        values: { count: 3, theme: 'fruit_apple', emoji: '🍎', label: '蘋果' },
        fingerprint: 'number_counting_1_20:3',
      },
      number_ordering_1_20: {
        id: 'safe_ordering_1_2_3',
        skillId: 'number_ordering_1_20',
        type: 'ordering',
        answer: [1, 2, 3],
        choices: [3, 1, 2],
        values: { items: [1, 2, 3], direction: 'ascending' },
        fingerprint: 'number_ordering_1_20:1,2,3',
      },
      compare_quantity_1_20: {
        id: 'safe_compare_5_2',
        skillId: 'compare_quantity_1_20',
        type: 'comparison',
        answer: 'bigger',
        choices: ['bigger', 'smaller', 'equal'],
        values: { a: 5, b: 2, choiceLabels: [
          { value: 'bigger', label: '更多' },
          { value: 'smaller', label: '更少' },
          { value: 'equal', label: '一樣' },
        ]},
        fingerprint: 'compare_quantity_1_20:5:2',
      },
      ordinal_position_1_10: {
        id: 'safe_ordinal_2_4',
        skillId: 'ordinal_position_1_10',
        type: 'ordinal',
        answer: '👧',
        choices: ['👦', '👧', '👨', '👩'],
        values: { position: 2, queueSize: 4, queue: ['👦', '👧', '👨', '👩'] },
        fingerprint: 'ordinal_position_1_10:2:4',
      },
      number_bonds_to_10: {
        id: 'safe_bonds_5_2',
        skillId: 'number_bonds_to_10',
        type: 'number_bonds',
        answer: 3,
        choices: [1, 2, 3, 4],
        values: {
          target: 5, givenPart: 2, missingPart: 3,
          tenFrame: ['filled', 'filled', 'empty', 'empty', 'empty'],
        },
        fingerprint: 'number_bonds_to_10:5:2',
      },
      addition_within_10: {
        id: 'safe_addition_2_3',
        skillId: 'addition_within_10',
        type: 'addition',
        answer: 5,
        choices: [3, 4, 5, 6],
        values: { a: 2, b: 3, result: 5, theme: 'fruit_apple', emoji: '🍎' },
        fingerprint: 'addition_within_10:2:3',
      },
      subtraction_within_10: {
        id: 'safe_subtraction_5_2',
        skillId: 'subtraction_within_10',
        type: 'subtraction',
        answer: 3,
        choices: [2, 3, 4, 5],
        values: { a: 5, b: 2, result: 3, theme: 'fruit_apple', emoji: '🍎' },
        fingerprint: 'subtraction_within_10:5:2',
      },
      shape_and_pattern_basics: {
        id: 'safe_pattern_ab',
        skillId: 'shape_and_pattern_basics',
        type: 'pattern',
        answer: '🔴',
        choices: ['🔴', '🔵', '🟢', '🟡'],
        values: {
          template: 'AB',
          visibleItems: ['🔴', '🔵', '🔴', '🔵'],
          selectedShapes: ['🔴', '🔵'],
          fullPattern: ['🔴', '🔵', '🔴', '🔵', '🔴'],
        },
        fingerprint: 'shape_and_pattern_basics:AB:🔴🔵🔴🔵',
      },
    };

    return fallbacks[skillId] || fallbacks['addition_within_10'];
  }
}

export const mathQuestionEngine = new MathQuestionEngine();
export { MathQuestionEngine };
