import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { ResultScene } from '../scenes/ResultScene';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Enhancement 3: Authoritative Reward Ledger & Progress Semantics', () => {
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

  it('guarantees atomic ledger transactions with correct balanceBefore and balanceAfter', () => {
    const dm = DataManager.getInstance();
    expect(dm.getProfile().coins).toBe(0);

    const tx1 = dm.recordTransaction('learning', 'st1_q1', 'coins', 15);
    expect(tx1?.balanceBefore).toBe(0);
    expect(tx1?.balanceAfter).toBe(15);
    expect(dm.getProfile().coins).toBe(15);

    const tx2 = dm.recordTransaction('shop_purchase', 'item_hat', 'coins', -10);
    expect(tx2?.balanceBefore).toBe(15);
    expect(tx2?.balanceAfter).toBe(5);
    expect(dm.getProfile().coins).toBe(5);
  });

  it('enforces idempotency on one-time first_clear rewards', () => {
    const dm = DataManager.getInstance();

    const tx1 = dm.recordTransaction('first_clear', 'station_1', 'gems', 10);
    expect(tx1?.amount).toBe(10);
    expect(dm.getProfile().gems).toBe(10);

    // Second attempt to claim first_clear for the same station returns the existing tx and does not duplicate
    const tx2 = dm.recordTransaction('first_clear', 'station_1', 'gems', 10);
    expect(tx2?.transactionId).toBe(tx1?.transactionId);
    expect(dm.getProfile().gems).toBe(10);
  });

  it('strictly distinguishes completedStations from unlockedStations', () => {
    const dm = DataManager.getInstance();

    expect(dm.getProfile().unlockedStations).toBe(1);
    expect(dm.getCompletedStationCount()).toBe(0);
    expect(dm.isStationCompleted(1)).toBe(false);

    // Completing station 1 unlocks station 2
    dm.markStationCompleted(1);
    dm.unlockNextStation(1);

    expect(dm.getProfile().unlockedStations).toBe(2);
    expect(dm.getCompletedStationCount()).toBe(1);
    expect(dm.isStationCompleted(1)).toBe(true);
    expect(dm.isStationCompleted(2)).toBe(false); // Station 2 is unlocked, but NOT completed!
  });

  it('renders itemised reward breakdown rows in ResultScene', () => {
    const scene = new ResultScene();
    const mock = createMockSceneForMeta('ResultScene');
    Object.assign(scene, mock);

    scene.init({
      stationId: 1,
      stationName: '起點海灘',
      totalQuestions: 3,
      sessionStats: {
        hintsUsed: 1,
        mistakes: 0,
        correctCount: 3,
        startTime: Date.now() - 30000,
        collectedCoins: 8,
        collectedGems: 2,
      },
    });

    scene.create();

    const breakdown = scene.getItemisedRewardBreakdown();
    expect(breakdown).toBeTruthy();
    expect(breakdown.learningCoins).toBeGreaterThanOrEqual(15);
    expect(breakdown.runnerCoins).toBe(8);
    expect(breakdown.runnerGems).toBe(2);
  });
});
