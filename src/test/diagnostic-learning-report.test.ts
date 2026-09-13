import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { DiagnosticReportModal } from '../ui/DiagnosticReportModal';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';
import { QuestionEngine } from '../engine/QuestionEngine';

describe('Enhancement 6: Diagnostic Learning Report & Review Mistakes Queue', () => {
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

  it('aggregates diagnostic statistics across all subjects and attempts', () => {
    const dm = DataManager.getInstance();

    // Chinese attempt: first attempt correct
    dm.recordAttempt({
      questionId: 'zh_01',
      stationId: 1,
      subject: 'chinese',
      knowledgeTag: 'radicals',
      difficulty: 1,
      selectedAnswerId: '足',
      isCorrect: true,
      attemptNumber: 1,
      hintLevelUsed: 0,
      timestamp: Date.now(),
    });

    // Math attempt 1: wrong
    dm.recordAttempt({
      questionId: 'math_01',
      stationId: 1,
      subject: 'math',
      knowledgeTag: 'addition_10',
      difficulty: 1,
      selectedAnswerId: '4',
      isCorrect: false,
      attemptNumber: 1,
      hintLevelUsed: 0,
      timestamp: Date.now(),
    });

    // Math attempt 2: correct
    dm.recordAttempt({
      questionId: 'math_01',
      stationId: 1,
      subject: 'math',
      knowledgeTag: 'addition_10',
      difficulty: 1,
      selectedAnswerId: '5',
      isCorrect: true,
      attemptNumber: 2,
      hintLevelUsed: 1,
      timestamp: Date.now(),
    });

    // English attempt: first attempt correct
    dm.recordAttempt({
      questionId: 'en_01',
      stationId: 1,
      subject: 'english',
      knowledgeTag: 'phonics_rhyme',
      difficulty: 1,
      selectedAnswerId: 'hat',
      isCorrect: true,
      attemptNumber: 1,
      hintLevelUsed: 0,
      timestamp: Date.now(),
    });

    const report = dm.getDiagnosticSummary();
    expect(report.totalQuestionsCompleted).toBe(3);
    expect(report.firstAttemptAccuracyRate).toBeCloseTo(2 / 3);
    expect(report.eventualCompletionRate).toBe(1.0);
    expect(report.totalHintsUsed).toBe(1);
    expect(report.totalMistakes).toBe(1);

    expect(report.subjectBreakdown.chinese.completed).toBe(1);
    expect(report.subjectBreakdown.chinese.firstAttemptAccuracy).toBe(1.0);

    expect(report.subjectBreakdown.math.completed).toBe(1);
    expect(report.subjectBreakdown.math.firstAttemptAccuracy).toBe(0.0);

    expect(report.subjectBreakdown.english.completed).toBe(1);
    expect(report.subjectBreakdown.english.firstAttemptAccuracy).toBe(1.0);

    expect(report.mistakeQueue).toContain('math_01');
  });

  it('renders DiagnosticReportModal with child-friendly summary and review mistakes button', () => {
    const dm = DataManager.getInstance();
    dm.recordAttempt({
      questionId: 'zh_01',
      stationId: 1,
      subject: 'chinese',
      knowledgeTag: 'radicals',
      difficulty: 1,
      selectedAnswerId: '木',
      isCorrect: false,
      attemptNumber: 1,
      hintLevelUsed: 0,
      timestamp: Date.now(),
    });

    const mockScene = createMockSceneForMeta('MapScene');
    const modal = new DiagnosticReportModal(mockScene);
    modal.show();

    expect(modal.isVisible()).toBe(true);
    expect(modal.getMistakeCount()).toBe(1);
  });

  it('uses attempted questions as each subject accuracy denominator and counts highest hint level once per question session', () => {
    const dm = DataManager.getInstance();
    const base = { stationId: 1, subject: 'math' as const, knowledgeTag: 'addition', difficulty: 1, timestamp: Date.now() };
    dm.recordAttempt({ ...base, questionId: 'm1', selectedAnswerId: 2, isCorrect: false, attemptNumber: 1, hintLevelUsed: 1 });
    dm.recordAttempt({ ...base, questionId: 'm1', selectedAnswerId: 3, isCorrect: false, attemptNumber: 2, hintLevelUsed: 2 });
    // Revisiting the same curriculum question starts a fresh attempt sequence;
    // its hint use must contribute to the usage metric as another session.
    dm.recordAttempt({ ...base, questionId: 'm1', selectedAnswerId: 2, isCorrect: false, attemptNumber: 1, hintLevelUsed: 1 });
    const report = dm.getDiagnosticSummary();
    expect(report.subjectBreakdown.math.attempted).toBe(1);
    expect(report.subjectBreakdown.math.completed).toBe(0);
    expect(report.subjectBreakdown.math.firstAttemptAccuracy).toBe(0);
    expect(report.totalHintsUsed).toBe(3);
  });

  it('returns queued questions in queue order using saved snapshots', () => {
    const dm = DataManager.getInstance();
    const snapshot = { id: 'math_dynamic_1', subject: 'math' as const, type: 'multiple_choice' as const, prompt: '2 + 3 = ?', speakText: '二加三', options: ['4', '5'], correctAnswer: 5 };
    dm.recordAttempt({ questionId: snapshot.id, stationId: 1, subject: 'math', knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 4, isCorrect: false, attemptNumber: 1, hintLevelUsed: 0, timestamp: Date.now(), questionSnapshot: snapshot });
    expect(dm.getMistakeReviewQuestions()).toEqual([snapshot]);
  });

  it('provides usable same-subject review content for legacy dynamic mistakes', () => {
    const dm = DataManager.getInstance();
    dm.recordAttempt({ questionId: 'legacy_math', stationId: 1, subject: 'math', knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 4, isCorrect: false, attemptNumber: 1, hintLevelUsed: 0, timestamp: Date.now() });
    const review = QuestionEngine.getMistakeReviewQuestions();
    expect(review).toHaveLength(1);
    expect(review[0]).toMatchObject({ id: 'legacy_math', subject: 'math' });
    expect(review[0].options?.length).toBeGreaterThan(1);
  });
});
