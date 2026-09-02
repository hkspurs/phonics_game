import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionEngine } from '../engine/QuestionEngine';
import { DataManager } from '../services/DataManager';

describe('Enhancement 9: Question Sequence Depth & Cognitive Reinforcement', () => {
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

  it('generates a 3-question sequence with cognitive progression across subjects', () => {
    const questions = QuestionEngine.getStationQuestions(1, 1, { count: 3 });
    expect(questions.length).toBe(3);

    expect(questions[0].subject).toBe('chinese');
    expect(questions[1].subject).toBe('math');
    expect(questions[2].subject).toBe('english');

    // Check that each question is populated with pedagogical attributes
    for (const q of questions) {
      expect(q.prompt).toBeTruthy();
      expect(q.speakText).toBeTruthy();
      expect(q.id).toBeTruthy();
    }
  });

  it('generates transparent remedial follow-up question on demand for mistakes', () => {
    const remedialQ = QuestionEngine.generateRemedialQuestion('math', 'addition_10', 1);
    expect(remedialQ).toBeTruthy();
    expect(remedialQ.subject).toBe('math');
  });
});
