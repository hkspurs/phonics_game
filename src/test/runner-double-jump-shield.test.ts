import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RunnerScene } from '../scenes/RunnerScene';
import { createMockRunnerScene } from '../scenes/RunnerScene.test';
import { DataManager } from '../services/DataManager';

describe('RunnerScene Double Jump & Shield Mechanics', () => {
  let scene: RunnerScene;
  let mock: any;
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
    const dm = DataManager.getInstance();
    dm.getProfile().coins = 500;
    dm.getProfile().equippedSkin = 'adventurer';

    mock = createMockRunnerScene();
    scene = new RunnerScene();
    Object.assign(scene, mock);
  });

  it('allows kinematic first jump from ground and second jump in mid-air', () => {
    scene.init();
    scene.create();

    // 1. Initial on ground
    expect(scene.isGrounded).toBe(true);
    expect(scene.hasDoubleJumped).toBe(false);

    // 2. First Jump
    scene.executeKinematicJump();
    expect(scene.isGrounded).toBe(false);
    expect(scene.isJumping).toBe(true);
    expect(scene.playerVelocityY).toBe(-660);

    // 3. Second Jump (Double Jump in mid-air)
    scene.executeKinematicJump();
    expect(scene.hasDoubleJumped).toBe(true);
    expect(scene.playerVelocityY).toBe(-600);

    // 4. Third Jump in same air time is blocked
    const afterDoubleVel = scene.playerVelocityY;
    scene.executeKinematicJump();
    expect(scene.playerVelocityY).toBe(afterDoubleVel);
  });

  it('consumes shield bubble when hitting rock obstacle without slowing down', () => {
    const dm = DataManager.getInstance();
    dm.buyGadget('shield', 1, 'coins');
    expect(dm.getGadgetCount('shield')).toBe(1);

    scene.init();
    scene.create();

    // Verify shield is active in runner
    expect(scene.hasShield).toBe(true);

    // Simulate hitting obstacle on ground
    scene.hitObstacleWithShieldCheck();

    // Shield should be consumed, stumbleTimer remains 0
    expect(scene.hasShield).toBe(false);
    expect(scene.stumbleTimer).toBe(0);
    expect(dm.getGadgetCount('shield')).toBe(0);
  });
});
