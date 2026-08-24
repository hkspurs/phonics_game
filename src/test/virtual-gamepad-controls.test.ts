import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RunnerScene } from '../scenes/RunnerScene';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

describe('RunnerScene Mobile Virtual Analog Joystick & Kinematics Suite', () => {
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
    fillCircle: () => {},
    fillEllipse: () => {},
    lineStyle: () => {},
    strokeRoundedRect: () => {},
    strokeCircle: () => {},
    lineBetween: () => {},
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
      addPointer: vi.fn(),
      keyboard: {
        on: vi.fn(),
        off: vi.fn(),
      },
    } as any;
  });

  it('1. builds the analog virtual joystick and jump button on top depth (150)', () => {
    scene.createVirtualGamepad(GAME_WIDTH, GAME_HEIGHT);

    expect(scene.virtualGamepadContainer).toBeDefined();
    expect(scene.virtualGamepadContainer.depth).toBe(150);
    expect(scene.joystickBaseGraphics).toBeDefined();
    expect(scene.joystickThumbGraphics).toBeDefined();
    expect(scene.jumpBtn).toBeDefined();
    expect(scene.jumpBtn?.getText()).toBe('🦘 跳躍');
  });

  it('2. stays completely idle (no movement) when joystick is at rest (axis = 0)', () => {
    scene.init({ questionIndex: 0 });
    scene.distanceRun = 250;
    scene.joystickAxisX = 0;
    scene.isLeftDown = false;
    scene.isRightDown = false;

    scene.update(0, 100);
    expect(scene.distanceRun).toBe(250);
  });

  it('3. runs forward when joystick is dragged to the right (continuous slide)', () => {
    scene.init({ questionIndex: 0 });
    scene.createVirtualGamepad(GAME_WIDTH, GAME_HEIGHT);
    scene.distanceRun = 100;

    // Simulate thumb dragging right: pointerX = baseX + radius
    scene.updateJoystickFromPointer(scene.joystickBaseX + scene.joystickRadius, scene.joystickBaseY);

    expect(scene.joystickAxisX).toBe(1.0);

    scene.update(0, 100); // 100ms
    expect(scene.distanceRun).toBeGreaterThan(100);
  });

  it('4. seamlessly switches to moving left when sliding thumb from right to left in one swipe', () => {
    scene.init({ questionIndex: 0 });
    scene.createVirtualGamepad(GAME_WIDTH, GAME_HEIGHT);
    scene.distanceRun = 300;

    // Swipe right first
    scene.updateJoystickFromPointer(scene.joystickBaseX + scene.joystickRadius, scene.joystickBaseY);
    expect(scene.joystickAxisX).toBe(1.0);
    scene.update(0, 50);
    const distAfterRight = scene.distanceRun;
    expect(distAfterRight).toBeGreaterThan(300);

    // Seamlessly slide left without releasing finger
    scene.updateJoystickFromPointer(scene.joystickBaseX - scene.joystickRadius, scene.joystickBaseY);
    expect(scene.joystickAxisX).toBe(-1.0);
    scene.update(0, 50);
    expect(scene.distanceRun).toBeLessThan(distAfterRight);
  });

  it('5. springs back to center and stops player immediately on release', () => {
    scene.init({ questionIndex: 0 });
    scene.createVirtualGamepad(GAME_WIDTH, GAME_HEIGHT);
    scene.distanceRun = 150;

    scene.updateJoystickFromPointer(scene.joystickBaseX + scene.joystickRadius, scene.joystickBaseY);
    expect(scene.joystickAxisX).toBe(1.0);

    // Finger released
    scene.resetJoystick();
    expect(scene.joystickAxisX).toBe(0);
    expect(scene.joystickActive).toBe(false);

    scene.update(0, 100);
    expect(scene.distanceRun).toBe(150); // Did not move
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

  it('7. cleans up input and releases joystick state in shutdown()', () => {
    scene.joystickActive = true;
    scene.joystickAxisX = 0.8;

    scene.shutdown();

    expect(scene.isLeftDown).toBe(false);
    expect(scene.isRightDown).toBe(false);
  });
});
