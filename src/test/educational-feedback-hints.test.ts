import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PedagogyEngine } from '../engine/PedagogyEngine';
import { DataManager } from '../services/DataManager';
import { QuizQuestion, QuestionAttempt } from '../types';

describe('Enhancement 1: Educational Answer Feedback & Progressive Hints', () => {
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
  });

  it('generates 3 progressive hint tiers (Direction, Visual support, Guided solution)', () => {
    const question: QuizQuestion = {
      id: 'zh_rad_01',
      subject: 'chinese',
      type: 'multiple_choice',
      prompt: '「跑、跳、踢」三個字都有相同的偏旁，請問是什麼？',
      speakText: '跑、跳、踢三個字都有相同的偏旁，請問是什麼？',
      options: ['口', '足', '手', '木'],
      correctAnswer: '足',
      correctOptionIndex: 1,
    };

    const hints = PedagogyEngine.getProgressiveHints(question);
    expect(hints.level1Direction).toBeTruthy();
    expect(hints.level2VisualSupport).toBeTruthy();
    expect(hints.level3GuidedSolution).toBeTruthy();

    // Level 1 should not reveal the answer directly
    expect(hints.level1Direction).not.toContain('答案是');
    // Level 3 should guide towards the rule and solution
    expect(hints.level3GuidedSolution).toContain('足');
  });

  it('generates age-appropriate wrong answer explanation and correct answer reinforcement', () => {
    const mathQ: QuizQuestion = {
      id: 'math_sub_01',
      subject: 'math',
      type: 'multiple_choice',
      prompt: '計算：10 - 9 = ?',
      speakText: '10 減去 9 等於幾多？',
      options: ['1', '2', '3', '0'],
      correctAnswer: '1',
      correctOptionIndex: 0,
    };

    const wrongFeedback = PedagogyEngine.getWrongAnswerFeedback(mathQ, '2');
    expect(wrongFeedback).toBeTruthy();
    expect(wrongFeedback).toContain('10');

    const reinforcement = PedagogyEngine.getReinforcementSentence(mathQ);
    expect(reinforcement).toBeTruthy();
    expect(reinforcement).toContain('1');
  });

  it('records question attempts with full pedagogical telemetry in DataManager', () => {
    const dm = DataManager.getInstance();
    const attempt: QuestionAttempt = {
      questionId: 'en_phonics_01',
      stationId: 1,
      subject: 'english',
      knowledgeTag: 'phonics_rhyme',
      difficulty: 1,
      selectedAnswerId: 'dog',
      isCorrect: false,
      attemptNumber: 1,
      hintLevelUsed: 1,
      timestamp: Date.now(),
      responseTimeMs: 2400,
    };

    dm.recordAttempt(attempt);

    const attempts = dm.getQuestionAttempts();
    expect(attempts.length).toBe(1);
    expect(attempts[0].questionId).toBe('en_phonics_01');
    expect(attempts[0].isCorrect).toBe(false);

    // Should queue for mistake review because it was incorrect
    const reviewQueue = dm.getMistakeReviewQueue();
    expect(reviewQueue).toContain('en_phonics_01');
  });

  it('flags hint-assisted completions and queues them for review if level 3 hint was used', () => {
    const dm = DataManager.getInstance();
    const attempt: QuestionAttempt = {
      questionId: 'zh_scramble_01',
      stationId: 1,
      subject: 'chinese',
      knowledgeTag: 'sentence_scramble',
      difficulty: 1,
      selectedAnswerId: '姐姐吃餅乾。',
      isCorrect: true,
      attemptNumber: 1,
      hintLevelUsed: 3, // Guided solution
      timestamp: Date.now(),
      responseTimeMs: 4500,
    };

    dm.recordAttempt(attempt);

    expect(dm.isFirstAttemptCorrect('zh_scramble_01')).toBe(false);
    expect(dm.getMistakeReviewQueue()).toContain('zh_scramble_01');
  });

  it('correctly distinguishes first-attempt correct from eventual completion', () => {
    const dm = DataManager.getInstance();

    // Question 1: First attempt correct with no major hints
    dm.recordAttempt({
      questionId: 'q1',
      stationId: 1,
      subject: 'math',
      knowledgeTag: 'addition',
      difficulty: 1,
      selectedAnswerId: '5',
      isCorrect: true,
      attemptNumber: 1,
      hintLevelUsed: 0,
      timestamp: Date.now(),
    });

    // Question 2: First attempt wrong, second attempt correct
    dm.recordAttempt({
      questionId: 'q2',
      stationId: 1,
      subject: 'chinese',
      knowledgeTag: 'vocabulary',
      difficulty: 1,
      selectedAnswerId: '錯',
      isCorrect: false,
      attemptNumber: 1,
      hintLevelUsed: 0,
      timestamp: Date.now(),
    });
    dm.recordAttempt({
      questionId: 'q2',
      stationId: 1,
      subject: 'chinese',
      knowledgeTag: 'vocabulary',
      difficulty: 1,
      selectedAnswerId: '對',
      isCorrect: true,
      attemptNumber: 2,
      hintLevelUsed: 1,
      timestamp: Date.now(),
    });

    expect(dm.isFirstAttemptCorrect('q1')).toBe(true);
    expect(dm.isFirstAttemptCorrect('q2')).toBe(false);
    expect(dm.isQuestionCompleted('q1')).toBe(true);
    expect(dm.isQuestionCompleted('q2')).toBe(true);
  });
});
