import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { RunnerScene } from '../scenes/RunnerScene';
import { createMockRunnerScene } from '../scenes/RunnerScene.test';

describe('Enhancement 2: Runner Role, Skip Rules & Reward Separation', () => {
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

  it('separates learning reward from runner pickups in session stats and ledger', () => {
    const dm = DataManager.getInstance();

    // Record learning reward: +20 coins
    const txLearning = dm.recordTransaction('learning', 'station_1_q1', 'coins', 20);
    expect(txLearning).toBeTruthy();
    expect(dm.getProfile().coins).toBe(20);

    // Record runner pickups: +5 coins
    const txRunner = dm.recordTransaction('runner_pickups', 'station_1_runner', 'coins', 5);
    expect(txRunner).toBeTruthy();
    expect(dm.getProfile().coins).toBe(25);

    const ledger = dm.getRewardLedger();
    expect(ledger.length).toBe(2);
    expect(ledger[0].sourceType).toBe('learning');
    expect(ledger[1].sourceType).toBe('runner_pickups');
  });

  it('handles Skip action by forfeiting uncollected runner pickups while preserving learning reward', () => {
    const dm = DataManager.getInstance();

    // Learning reward awarded in question phase
    dm.recordTransaction('learning', 'station_1_q1', 'coins', 20);

    // Player skips runner: no runner pickups recorded
    dm.incrementRunnerSkippedCount();

    expect(dm.getProfile().coins).toBe(20);
    expect(dm.getProfile().runnerSkippedCount).toBe(1);

    const runnerTxs = dm.getRewardLedger().filter((t) => t.sourceType === 'runner_pickups');
    expect(runnerTxs.length).toBe(0);
  });

  it('shows confirmation modal before skipping runner with explicit forfeiture message', () => {
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

    // Trigger skip button
    scene.promptSkipConfirmation();

    expect((scene as any).skipConfirmationModal).toBeTruthy();
    const modalText = (scene as any).skipConfirmationText;
    expect(modalText).toContain('保留答題獎勵');
    expect(modalText).toContain('不會獲得尚未收集的跑酷獎勵');
  });
});
