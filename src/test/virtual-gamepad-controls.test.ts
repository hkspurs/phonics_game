import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RunnerScene } from '../scenes/RunnerScene';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

describe('RunnerScene Mobile Virtual Gamepad & Kinematics Controls Suite', () => {
  let scene: RunnerScene;

  const createMockGameObject = () => ({
    setScale: () => {},
    setDepth: () => {},
    setX: () => {},
    setY: () => {},
    setTexture: () => {},
    setTint: () => {},
    clearTint: () => {},
    setOrigin: () => {},
    setText: () => {},
    setColor: () => {},
    setShadow: () => {},
    fillStyle: () => {},
    fillRoundedRect: () => {},
    fillEllipse: () => {},
    lineStyle: () => {},
    strokeRoundedRect: () => {},
    clear: () => {},
    destroy: () => {},
    once: vi.fn(),
    removeFromDisplayList: vi.fn(),
    addedToScene: vi.fn(),
  });

  beforeEach(() => {
    scene = new RunnerScene();
    scene.sys = {
      queueDepthSort: vi.fn(),
      input: {
        enable: vi.fn(),
        disable: vi.fn(),
      },
      game: {
        config: { width: GAME_WIDTH, height: GAME_HEIGHT },
      },
    } as any;
    scene.add = {
      container: (x = 0, y = 0) => {
        const c: any = {
          x,
          y,
          list: [],
          depth: 0,
          add: (obj: any) => c.list.push(obj),
          setDepth: (d: number) => { c.depth = d; return c; },
          destroy: () => {},
          once: vi.fn(),
          removeFromDisplayList: vi.fn(),
          addedToScene: vi.fn(),
        };
        return c;
      },
      image: createMockGameObject,
      text: createMockGameObject,
      graphics: createMockGameObject,
      existing: (obj: any) => obj,
    } as any;
    scene.tweens = {
      add: () => ({}),
      killTweensOf: () => {},
      killAll: vi.fn(),
    } as any;
    scene.time = {
      delayedCall: vi.fn(),
      addEvent: vi.fn(),
      removeAllEvents: vi.fn(),
    } as any;
    scene.sound = {
      play: vi.fn(),
      stopAll: vi.fn(),
    } as any;
    scene.input = {
      on: vi.fn(),
      off: vi.fn(),
      keyboard: {
        on: vi.fn(),
        off: vi.fn(),
      },
    } as any;
  });

  it('1. builds the virtual gamepad with Left, Right and Jump buttons on top depth (150)', () => {
    scene.createVirtualGamepad(GAME_WIDTH, GAME_HEIGHT);

    expect(scene.virtualGamepadContainer).toBeDefined();
    expect(scene.virtualGamepadContainer.depth).toBe(150);
    expect(scene.leftBtn).toBeDefined();
    expect(scene.rightBtn).toBeDefined();
    expect(scene.jumpBtn).toBeDefined();
    expect(scene.leftBtn?.getText()).toBe('◀ 左');
    expect(scene.rightBtn?.getText()).toBe('右 ▶');
    expect(scene.jumpBtn?.getText()).toBe('🦘 跳躍');
  });

  it('2. does NOT move or scroll automatically when idle (no buttons pressed)', () => {
    scene.init({ questionIndex: 0 });
    scene.distanceRun = 200;
    scene.isLeftDown = false;
    scene.isRightDown = false;

    scene.update(0, 100);
    scene.update(0, 100);

    expect(scene.distanceRun).toBe(200); // 100% stands still
  });

  it('3. runs forward along track when Right button is held', () => {
    scene.init({ questionIndex: 0 });
    scene.distanceRun = 100;
    scene.isLeftDown = false;
    scene.isRightDown = true;

    scene.update(0, 100); // 100ms
    expect(scene.distanceRun).toBeGreaterThan(100);
  });

  it('4. runs backward along track when Left button is held', () => {
    scene.init({ questionIndex: 0 });
    scene.distanceRun = 100;
    scene.isLeftDown = true;
    scene.isRightDown = false;

    scene.update(0, 100); // 100ms
    expect(scene.distanceRun).toBeLessThan(100);
  });

  it('5. clamps backward movement at track start (distanceRun >= 0)', () => {
    scene.init({ questionIndex: 0 });
    scene.distanceRun = 10;
    scene.isLeftDown = true;
    scene.isRightDown = false;

    scene.update(0, 200);
    expect(scene.distanceRun).toBe(0);
  });

  it('6. triggers kinematic jump on jumpBtn input', () => {
    scene.init({ questionIndex: 0 });
    scene.isGrounded = true;
    scene.isJumping = false;
    scene.playerVelocityY = 0;

    scene.handleJumpInput();

    expect(scene.isJumping).toBe(true);
    expect(scene.playerVelocityY).toBeLessThan(0); // Upward velocity
  });

  it('7. cleans up input and releases directional states in shutdown()', () => {
    scene.isLeftDown = true;
    scene.isRightDown = true;

    scene.shutdown();

    expect(scene.isLeftDown).toBe(false);
    expect(scene.isRightDown).toBe(false);
  });
});
