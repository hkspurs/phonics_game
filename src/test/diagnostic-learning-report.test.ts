import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { DiagnosticReportModal } from '../ui/DiagnosticReportModal';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';
import { QuestionEngine } from '../engine/QuestionEngine';
import { QuestionScene } from '../scenes/QuestionScene';

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

  it('groups interleaved new attempts by explicit session identity', () => {
    const dm = DataManager.getInstance();
    const base = { questionId: 'm-session', stationId: 1, subject: 'math' as const, knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 0, isCorrect: false, timestamp: Date.now() };
    dm.recordAttempt({ ...base, sessionId: 'visit-a', attemptNumber: 1, hintLevelUsed: 1 });
    dm.recordAttempt({ ...base, sessionId: 'visit-b', attemptNumber: 1, hintLevelUsed: 3 });
    dm.recordAttempt({ ...base, sessionId: 'visit-a', attemptNumber: 2, hintLevelUsed: 2 });
    expect(dm.getDiagnosticSummary().totalHintsUsed).toBe(5);
  });

  it('keeps one explicit session across midnight and reordered timestamps', () => {
    const dm = DataManager.getInstance();
    const base = { questionId: 'm-midnight', stationId: 1, subject: 'math' as const, knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 0, isCorrect: false, sessionId: 'visit-midnight' };
    dm.recordAttempt({ ...base, attemptNumber: 2, hintLevelUsed: 3, timestamp: Date.parse('2026-09-15T00:00:01+08:00') });
    dm.recordAttempt({ ...base, attemptNumber: 1, hintLevelUsed: 1, timestamp: Date.parse('2026-09-14T23:59:59+08:00') });
    expect(dm.getDiagnosticSummary().totalHintsUsed).toBe(3);
  });

  it('treats legacy rows without attempt numbers as separate conservative sessions', () => {
    const dm = DataManager.getInstance();
    const base = { questionId: 'legacy-missing-attempt', stationId: 1, subject: 'math' as const, knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 0, isCorrect: false, timestamp: Date.now() };
    dm.recordAttempt({ ...base, attemptNumber: undefined as unknown as number, hintLevelUsed: 1 });
    dm.recordAttempt({ ...base, attemptNumber: undefined as unknown as number, hintLevelUsed: 2 });
    expect(dm.getDiagnosticSummary().totalHintsUsed).toBe(3);
  });

  it('aggregates explicit and legacy sessions independently for one question', () => {
    const dm = DataManager.getInstance();
    const base = { questionId: 'mixed-history', stationId: 1, subject: 'math' as const, knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 0, isCorrect: false, timestamp: Date.now() };
    dm.recordAttempt({ ...base, attemptNumber: 1, hintLevelUsed: 1 });
    dm.recordAttempt({ ...base, attemptNumber: 2, hintLevelUsed: 2 });
    dm.recordAttempt({ ...base, sessionId: 'new-visit', attemptNumber: 1, hintLevelUsed: 3 });
    expect(dm.getDiagnosticSummary().totalHintsUsed).toBe(5);
  });

  it('returns queued questions in queue order using saved snapshots', () => {
    const dm = DataManager.getInstance();
    const snapshot = { id: 'math_dynamic_1', subject: 'math' as const, type: 'multiple_choice' as const, prompt: '2 + 3 = ?', speakText: '二加三', options: ['4', '5'], correctAnswer: 5 };
    dm.recordAttempt({ questionId: snapshot.id, stationId: 1, subject: 'math', knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 4, isCorrect: false, attemptNumber: 1, hintLevelUsed: 0, timestamp: Date.now(), questionSnapshot: snapshot });
    expect(dm.getMistakeReviewQuestions()).toEqual([snapshot]);
  });

  it('deep-copies mutable question arrays when recording and reading snapshots', () => {
    const dm = DataManager.getInstance();
    const snapshot = { id: 'mutable', subject: 'chinese' as const, type: 'sentence_scramble' as const, prompt: '排句', speakText: '姐姐吃餅乾', correctTokens: ['姐姐', '吃', '餅乾'], shuffledTokens: ['吃', '姐姐', '餅乾'] };
    dm.recordAttempt({ questionId: snapshot.id, stationId: 1, subject: 'chinese', knowledgeTag: 'sentence', difficulty: 1, selectedAnswerId: '', isCorrect: false, attemptNumber: 1, hintLevelUsed: 0, timestamp: Date.now(), questionSnapshot: snapshot });
    snapshot.correctTokens[0] = '已改';
    const replay = dm.getMistakeReviewQuestions()[0];
    expect(replay.correctTokens).toEqual(['姐姐', '吃', '餅乾']);
    replay.correctTokens![1] = '再改';
    expect(dm.getMistakeReviewQuestions()[0].correctTokens).toEqual(['姐姐', '吃', '餅乾']);
  });

  it('provides usable same-subject review content for legacy dynamic mistakes', () => {
    const dm = DataManager.getInstance();
    dm.recordAttempt({ questionId: 'legacy_math', stationId: 1, subject: 'math', knowledgeTag: 'addition', difficulty: 1, selectedAnswerId: 4, isCorrect: false, attemptNumber: 1, hintLevelUsed: 0, timestamp: Date.now() });
    const review = QuestionEngine.getMistakeReviewQuestions();
    expect(review).toHaveLength(1);
    expect(review[0]).toMatchObject({ subject: 'math', originalQuestionId: 'legacy_math', reviewSource: 'replacement', reviewLabel: '相同類型練習' });
    expect(review[0].id).not.toBe('legacy_math');
    expect(review[0].options?.length).toBeGreaterThan(1);
  });

  it('creates a distinct question session identity for each scene visit', () => {
    const scene = new QuestionScene();
    scene.init({ stationId: 1 });
    const first = scene.questionSessionId;
    scene.init({ stationId: 1 });
    expect(first).toBeTruthy();
    expect(scene.questionSessionId).toBeTruthy();
    expect(scene.questionSessionId).not.toBe(first);
  });
});
