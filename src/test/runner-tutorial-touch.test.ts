import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { RunnerScene } from '../scenes/RunnerScene';
import { createMockRunnerScene } from '../scenes/RunnerScene.test';

describe('Enhancement 4: First-Run Runner Tutorial & Touch Controls', () => {
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

  it('triggers first-run tutorial on new save when runnerTutorialCompleted is false', () => {
    const dm = DataManager.getInstance();
    expect(dm.isRunnerTutorialCompleted()).toBe(false);

    const scene = new RunnerScene();
    const mock = createMockRunnerScene();
    Object.assign(scene, mock);

    scene.init({
      stationId: 1,
      questionIndex: 0,
      totalQuestions: 3,
      sessionStats: {
        hintsUsed: 0,
        mistakes: 0,
        correctCount: 1,
        startTime: Date.now(),
      },
    });

    scene.create();

    expect((scene as any).isTutorialActive).toBe(true);
    expect((scene as any).tutorialStep).toBe(1); // Step 1: Move right
  });

  it('advances tutorial only upon detecting requested actions (Move -> Jump -> Pickup)', () => {
    const dm = DataManager.getInstance();
    const scene = new RunnerScene();
    const mock = createMockRunnerScene();
    Object.assign(scene, mock);

    scene.init({
      stationId: 1,
      questionIndex: 0,
      totalQuestions: 3,
      sessionStats: {
        hintsUsed: 0,
        mistakes: 0,
        correctCount: 1,
        startTime: Date.now(),
      },
    });

    scene.create();

    // Step 1: Detect Move Right
    scene.simulateTutorialAction('move_right');
    expect((scene as any).tutorialStep).toBe(2); // Step 2: Jump
    expect(dm.isRunnerTutorialCompleted()).toBe(false);

    // Step 2: Detect Jump
    scene.simulateTutorialAction('jump');
    expect((scene as any).tutorialStep).toBe(3); // Step 3: Collect pickup
    expect(dm.isRunnerTutorialCompleted()).toBe(false);

    // Step 3: Detect Pickup collection
    scene.simulateTutorialAction('pickup');
    expect((scene as any).isTutorialActive).toBe(false);
    expect(dm.isRunnerTutorialCompleted()).toBe(true);
  });

  it('skips tutorial if runnerTutorialCompleted is already true', () => {
    const dm = DataManager.getInstance();
    dm.setRunnerTutorialCompleted(true);

    const scene = new RunnerScene();
    const mock = createMockRunnerScene();
    Object.assign(scene, mock);

    scene.init({
      stationId: 1,
      questionIndex: 0,
      totalQuestions: 3,
      sessionStats: {
        hintsUsed: 0,
        mistakes: 0,
        correctCount: 1,
        startTime: Date.now(),
      },
    });

    scene.create();

    expect((scene as any).isTutorialActive).toBe(false);
  });
});
