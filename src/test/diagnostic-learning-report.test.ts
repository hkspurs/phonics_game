import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { DiagnosticReportModal } from '../ui/DiagnosticReportModal';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

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
});
