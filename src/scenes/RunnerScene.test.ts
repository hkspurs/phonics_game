import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import {
  RunnerScene,
  RunnerSceneInitData,
} from './RunnerScene';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { QuizQuestion } from '../types';

function attachEventEmitter(obj: any): any {
  const listeners: Record<string, Function[]> = {};
  obj.on = vi.fn(function (ev: string, fn: Function) {
    (listeners[ev] = listeners[ev] || []).push(fn);
    return obj;
  });
  obj.once = vi.fn(function (ev: string, fn: Function) {
    const wrapper = (...args: any[]) => {
      obj.off(ev, wrapper);
      fn(...args);
    };
    (listeners[ev] = listeners[ev] || []).push(wrapper);
    return obj;
  });
  obj.off = vi.fn(function (ev: string, fn?: Function) {
    if (!fn) delete listeners[ev];
    else if (listeners[ev]) listeners[ev] = listeners[ev].filter((f: any) => f !== fn);
    return obj;
  });
  obj.removeListener = obj.off;
  obj.emit = vi.fn(function (ev: string, ...args: any[]) {
    (listeners[ev] || []).slice().forEach((fn: any) => fn(...args));
    return true;
  });
  obj.removeFromDisplayList = vi.fn().mockReturnThis();
  obj.addedToScene = vi.fn().mockReturnThis();
  return obj;
}

export function createMockRunnerScene(): any {
  const sceneListeners: Record<string, Function[]> = {};

  const scene: any = {
    key: 'RunnerScene',
    sys: {
      settings: { key: 'RunnerScene' },
      game: {
        config: { width: 1280, height: 720 },
      },
      queueDepthSort: () => {},
      updateList: { add: () => {}, remove: () => {} },
      input: {
        enable: vi.fn(),
        disable: vi.fn(),
      },
    },
    scene: {
      key: 'RunnerScene',
      start: vi.fn(),
      stop: vi.fn(),
      launch: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    },
    cameras: {
      main: {
        scrollX: 0,
        scrollY: 0,
        setBounds: vi.fn().mockReturnThis(),
        setScroll: vi.fn().mockReturnThis(),
        pan: vi.fn().mockReturnThis(),
      },
    },
    scale: {
      scaleMode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
      pageAlignHorizontally: false,
    },
    input: attachEventEmitter({
      setDraggable: vi.fn(),
    }),
    load: {
      audio: vi.fn(),
      image: vi.fn(),
      spritesheet: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
    },
    add: {
      existing: vi.fn((obj: any) => obj),
      container: vi.fn((x: number, y: number) => {
        const c = new (Phaser.GameObjects.Container as any)(scene, x, y);
        return c;
      }),
      graphics: vi.fn((config?: any) => {
        const g: any = {
          x: config?.x ?? 0,
          y: config?.y ?? 0,
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillGradientStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillEllipse: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(g);
      }),
      text: vi.fn((x: number, y: number, text: string, style?: any) => {
        const t: any = {
          x,
          y,
          text,
          style: style || {},
          originX: 0,
          originY: 0,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          setOrigin: vi.fn(function (ox = 0.5, oy = 0.5) {
            t.originX = ox;
            t.originY = oy;
            return t;
          }),
          setText: vi.fn(function (val: string) {
            t.text = val;
            return t;
          }),
          setColor: vi.fn(function (val: string) {
            if (t.style) t.style.color = val;
            return t;
          }),
          setDepth: vi.fn().mockReturnThis(),
          setScale: vi.fn(function (sx: number, sy?: number) {
            t.scaleX = sx;
            t.scaleY = sy ?? sx;
            return t;
          }),
          setAlpha: vi.fn(function (a: number) {
            t.alpha = a;
            return t;
          }),
          setPosition: vi.fn(function (nx: number, ny: number) {
            t.x = nx;
            t.y = ny;
            return t;
          }),
          destroy: vi.fn(),
        };
        return attachEventEmitter(t);
      }),
      rectangle: vi.fn((x: number, y: number, width: number, height: number, fillColor = 0, fillAlpha = 1) => {
        const r: any = {
          x,
          y,
          width,
          height,
          fillColor,
          fillAlpha,
          originX: 0.5,
          originY: 0.5,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          disableInteractive: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(r);
      }),
      image: vi.fn((x: number, y: number, key: string) => {
        const img: any = {
          x,
          y,
          texture: { key },
          originX: 0.5,
          originY: 0.5,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          tint: 0xffffff,
          depth: 0,
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn(function (s: number) {
            img.scaleX = s;
            img.scaleY = s;
            return img;
          }),
          setTexture: vi.fn(function (k: string) {
            img.texture = { key: k };
            return img;
          }),
          setTint: vi.fn(function (t: number) {
            img.tint = t;
            return img;
          }),
          clearTint: vi.fn().mockReturnThis(),
          setAlpha: vi.fn(function (a: number) {
            img.alpha = a;
            return img;
          }),
          setDepth: vi.fn(function (d: number) {
            img.depth = d;
            return img;
          }),
          setPosition: vi.fn(function (nx: number, ny: number) {
            img.x = nx;
            img.y = ny;
            return img;
          }),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(img);
      }),
    },
    tweens: {
      add: vi.fn((config: any) => {
        if (config.onComplete) {
          // Can be called immediately or manually
        }
        return { stop: vi.fn(), remove: vi.fn() };
      }),
      killTweensOf: vi.fn(),
    },
    textures: {
      exists: vi.fn((_key?: string) => false),
      get: vi.fn((_key?: string) => ({ get: () => ({}) })),
      addCanvas: vi.fn(),
    },
    sound: {
      play: vi.fn(),
      setVolume: vi.fn(),
    },
    time: {
      delayedCall: vi.fn((_delay: number, callback: Function) => {
        callback();
        return { remove: vi.fn() };
      }),
      addEvent: vi.fn((config: any) => {
        return { remove: vi.fn(), ...config };
      }),
    },
    events: {
      on: vi.fn((ev: string, fn: Function) => {
        (sceneListeners[ev] = sceneListeners[ev] || []).push(fn);
      }),
      emit: vi.fn((ev: string, ...args: any[]) => {
        (sceneListeners[ev] || []).forEach((fn: any) => fn(...args));
      }),
    },
  };

  return scene;
}

describe('RunnerScene (2D Platformer Runner Reward Scene)', () => {
  let scene: RunnerScene;
  let mockScene: any;

  beforeEach(() => {
    vi.clearAllMocks();
    DataManager.getInstance().reset();
    scene = new RunnerScene();
    mockScene = createMockRunnerScene();
    Object.assign(scene, mockScene);
    SoundManager.init(mockScene);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Scene Initialization & Payload Handling
  // =========================================================================
  describe('Lifecycle & Payload Handling', () => {
    it('initializes with default values when no data is provided', () => {
      scene.init();
      expect(scene.stationId).toBe(1);
      expect(scene.stationName).toBe('冒險關卡');
      expect(scene.questionIndex).toBe(0);
      expect(scene.isStationComplete).toBe(false);
      expect(scene.totalQuestions).toBe(3);
      expect(scene.questions).toEqual([]);
      expect(scene.sessionStats.collectedCoins).toBe(0);
      expect(scene.sessionStats.collectedGems).toBe(0);
    });

    it('initializes with custom QuestionScene transition payload', () => {
      const mockQuestions: QuizQuestion[] = [
        { id: 'q1', subject: 'chinese', type: 'sentence_scramble', prompt: 'Sentence 1', speakText: '1' },
        { id: 'q2', subject: 'math', type: 'math_calc', prompt: 'Math 1', speakText: '2' },
        { id: 'q3', subject: 'english', type: 'multiple_choice', prompt: 'English 1', speakText: '3' },
      ];

      const payload: RunnerSceneInitData = {
        stationId: 2,
        stationName: '森林秘境',
        questionIndex: 1,
        isStationComplete: false,
        totalQuestions: 3,
        questions: mockQuestions,
        sessionStats: {
          hintsUsed: 1,
          mistakes: 0,
          correctCount: 2,
          startTime: 1000,
          collectedCoins: 5,
          collectedGems: 1,
        },
      };

      scene.init(payload);
      expect(scene.stationId).toBe(2);
      expect(scene.stationName).toBe('森林秘境');
      expect(scene.questionIndex).toBe(1);
      expect(scene.isStationComplete).toBe(false);
      expect(scene.totalQuestions).toBe(3);
      expect(scene.questions).toHaveLength(3);
      expect(scene.sessionStats.collectedCoins).toBe(5);
      expect(scene.sessionStats.collectedGems).toBe(1);
    });
  });

  // =========================================================================
  // 2. Skin System & Perk Mechanics
  // =========================================================================
  describe('Character Skins & Perks', () => {
    it('resolves default Adventurer skin perks correctly', () => {
      const dm = DataManager.getInstance();
      dm.equipSkin('adventurer');

      scene.init();
      expect(scene.skinConfig.id).toBe('adventurer');
      expect(scene.skinConfig.walk1Key).toBe('adventurer_walk1');
      expect(scene.skinConfig.jumpKey).toBe('adventurer_jump');
      expect(scene.skinConfig.speedMultiplier).toBe(1.0);
      expect(scene.currentSpeed).toBe(scene.baseSpeed * 1.0);
    });

    it('resolves Heroine skin perks with +15% speed bonus and increased magnet radius', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('heroine', 0);
      dm.equipSkin('heroine');

      scene.init();
      expect(scene.skinConfig.id).toBe('heroine');
      expect(scene.skinConfig.walk1Key).toBe('female_walk1');
      expect(scene.skinConfig.speedMultiplier).toBe(1.15);
      expect(scene.skinConfig.magnetRadius).toBe(130);
      expect(scene.currentSpeed).toBe(scene.baseSpeed * 1.15);
    });

    it('resolves Soldier skin with high jump multiplier (+25%)', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('soldier', 0);
      dm.equipSkin('soldier');

      scene.init();
      expect(scene.skinConfig.id).toBe('soldier');
      expect(scene.skinConfig.jumpMultiplier).toBe(1.25);
      expect(scene.skinConfig.walk1Key).toBe('soldier_walk1');
    });

    it('resolves Knight skin with armor tint and increased magnet radius', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('knight', 0);
      dm.equipSkin('knight');

      scene.init();
      expect(scene.skinConfig.id).toBe('knight');
      expect(scene.skinConfig.tint).toBe(0xc8e6ff);
      expect(scene.skinConfig.magnetRadius).toBe(150);
    });

    it('resolves Ninja skin with max speed bonus (+22%) and super magnet radius (180)', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('ninja', 0);
      dm.equipSkin('ninja');

      scene.init();
      expect(scene.skinConfig.id).toBe('ninja');
      expect(scene.skinConfig.speedMultiplier).toBe(1.22);
      expect(scene.skinConfig.magnetRadius).toBe(180);
      expect(scene.skinConfig.tint).toBe(0x4a4a5a);
    });

    it('gracefully falls back to Adventurer config if equippedSkin is unrecognized', () => {
      const dm = DataManager.getInstance();
      (dm.getProfile() as any).equippedSkin = 'unknown_super_hero';

      scene.init();
      expect(scene.skinConfig.id).toBe('adventurer');
    });
  });

  // =========================================================================
  // 3. Scene Creation & Parallax World Building
  // =========================================================================
  describe('World Creation & Parallax Layers', () => {
    it('creates parallax background, distant hills, ground layer and clouds', () => {
      scene.init({ stationId: 1 });
      scene.create();

      expect(mockScene.add.rectangle).toHaveBeenCalled();
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(scene.clouds.length).toBeGreaterThanOrEqual(4);
      expect(scene.skyBackground).toBeDefined();
      expect(scene.groundGraphics).toBeDefined();
    });

    it('builds track course with coins, gems, obstacles, springboards, and chest', () => {
      scene.init({ stationId: 1 });
      scene.create();

      expect(scene.worldItems.length).toBeGreaterThan(10);
      const coins = scene.worldItems.filter((i) => i.type === 'coin');
      const gems = scene.worldItems.filter((i) => i.type === 'gem');
      const obstacles = scene.worldItems.filter((i) => i.type === 'obstacle');
      const springboards = scene.worldItems.filter((i) => i.type === 'springboard');
      const chests = scene.worldItems.filter((i) => i.type === 'chest');

      expect(coins.length).toBeGreaterThanOrEqual(8);
      expect(gems.length).toBeGreaterThanOrEqual(2);
      expect(obstacles.length).toBeGreaterThanOrEqual(2);
      expect(springboards.length).toBeGreaterThanOrEqual(2);
      expect(chests.length).toBe(1);
    });

    it('creates player sprite with equipped skin texture and shadow graphics', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('heroine', 0);
      dm.equipSkin('heroine');

      scene.init();
      scene.create();

      expect(scene.playerSprite).toBeDefined();
      expect(scene.playerSprite.texture.key).toBe('female_walk1');
      expect(scene.playerShadow).toBeDefined();
    });

    it('creates HUD with currency counters, progress bar, and skip button', () => {
      scene.init({ stationId: 3 });
      scene.create();

      expect(scene.hudContainer).toBeDefined();
      expect(scene.coinCounterText).toBeDefined();
      expect(scene.gemCounterText).toBeDefined();
      expect(scene.progressBarFill).toBeDefined();
      expect(scene.skipButton).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Collectibles & Economy Progression
  // =========================================================================
  describe('Collectibles & Economy', () => {
    it('collectCoin awards +1 coin to profile & sessionStats, plays sound and spawns feedback text', () => {
      scene.init();
      scene.create();

      const dm = DataManager.getInstance();
      const initialCoins = dm.getProfile().coins;
      const initialSessionCoins = scene.sessionStats.collectedCoins || 0;

      const coinItem = scene.worldItems.find((i) => i.type === 'coin')!;
      expect(coinItem).toBeDefined();

      const soundSpy = vi.spyOn(SoundManager, 'play');
      const floatTextSpy = vi.spyOn(scene, 'spawnFloatingFeedbackText');

      scene.collectCoin(coinItem);

      expect(coinItem.collected).toBe(true);
      expect(dm.getProfile().coins).toBe(initialCoins + 1);
      expect(scene.sessionStats.collectedCoins).toBe(initialSessionCoins + 1);
      expect(soundSpy).toHaveBeenCalledWith('coin');
      expect(floatTextSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), '+1 🪙', '#ffd700');
    });

    it('collectGem awards +1 gem to profile & sessionStats, plays victory sound and spawns feedback text', () => {
      scene.init();
      scene.create();

      const dm = DataManager.getInstance();
      const initialGems = dm.getProfile().gems;
      const initialSessionGems = scene.sessionStats.collectedGems || 0;

      const gemItem = scene.worldItems.find((i) => i.type === 'gem')!;
      expect(gemItem).toBeDefined();

      const soundSpy = vi.spyOn(SoundManager, 'play');
      const floatTextSpy = vi.spyOn(scene, 'spawnFloatingFeedbackText');

      scene.collectGem(gemItem);

      expect(gemItem.collected).toBe(true);
      expect(dm.getProfile().gems).toBe(initialGems + 1);
      expect(scene.sessionStats.collectedGems).toBe(initialSessionGems + 1);
      expect(soundSpy).toHaveBeenCalledWith('victory');
      expect(floatTextSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), '+1 💎', '#00e5ff');
    });

    it('does not re-collect an already collected coin or gem', () => {
      scene.init();
      scene.create();

      const dm = DataManager.getInstance();
      const coinItem = scene.worldItems.find((i) => i.type === 'coin')!;

      scene.collectCoin(coinItem);
      const coinsAfterFirst = dm.getProfile().coins;

      // Second attempt
      scene.collectCoin(coinItem);
      expect(dm.getProfile().coins).toBe(coinsAfterFirst);
    });
  });

  // =========================================================================
  // 5. Jump & Springboard Mechanics
  // =========================================================================
  describe('Jump & Springboard Actions', () => {
    it('triggers regular obstacle auto-jump with jump sound and texture', () => {
      scene.init();
      scene.create();

      const soundSpy = vi.spyOn(SoundManager, 'play');
      scene.triggerJump(1.0);

      expect(scene.isJumping).toBe(true);
      expect(scene.playerSprite.texture.key).toBe(scene.skinConfig.jumpKey);
      expect(soundSpy).toHaveBeenCalledWith('jump');
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('triggers springboard super-jump with springboard bounce compression', () => {
      scene.init();
      scene.create();

      const springItem = scene.worldItems.find((i) => i.type === 'springboard')!;
      expect(springItem).toBeDefined();

      const soundSpy = vi.spyOn(SoundManager, 'play');
      scene.triggerSpringboard(springItem);

      expect(scene.isSuperJumping).toBe(true);
      expect(springItem.gameObject.setTexture).toHaveBeenCalledWith('springboard_down');
      expect(soundSpy).toHaveBeenCalledWith('jump');
      expect(mockScene.tweens.add).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 6. Update Loop & Magnet Perk System
  // =========================================================================
  describe('Update Loop & Magnet Interaction', () => {
    it('progresses distanceRun, scrolls clouds and updates progress bar', () => {
      scene.init();
      scene.create();

      const initialDist = scene.distanceRun;
      const initialCloudX = scene.clouds[0]?.x;

      scene.update(100, 50); // delta = 50ms

      expect(scene.distanceRun).toBeGreaterThan(initialDist);
      if (scene.clouds[0]) {
        expect(scene.clouds[0].x).toBeLessThan(initialCloudX);
      }
    });

    it('cycles walk frames (walk1 <-> walk2) during running', () => {
      scene.init();
      scene.create();

      expect(scene.currentWalkFrame).toBe(1);

      // Advance time enough to trigger step timer (> 130ms)
      scene.update(200, 160);
      expect(scene.currentWalkFrame).toBe(2);
      expect(scene.playerSprite.texture.key).toBe(scene.skinConfig.walk2Key);

      scene.update(400, 160);
      expect(scene.currentWalkFrame).toBe(1);
      expect(scene.playerSprite.texture.key).toBe(scene.skinConfig.walk1Key);
    });

    it('attracts nearby coins towards player within magnetRadius', () => {
      scene.init();
      scene.create();

      const coinItem = scene.worldItems.find((i) => i.type === 'coin')!;
      // Position coin close to player (within 90px)
      coinItem.worldX = scene.playerScreenX + 60;
      coinItem.worldY = scene.playerBaselineY;

      const prevX = coinItem.worldX;
      scene.update(100, 30);

      // Coin worldX should be pulled closer towards playerScreenX
      expect(coinItem.worldX).toBeLessThan(prevX);
    });
  });

  // =========================================================================
  // 7. Treasure Chest Goal Celebration
  // =========================================================================
  describe('Goal & Chest Celebration', () => {
    it('switches to cheer pose, opens chest, awards bonus loot (+5 coins, +1 gem) and plays sfx', () => {
      scene.init({ isStationComplete: false });
      scene.create();

      const soundSpy = vi.spyOn(SoundManager, 'play');
      const lootSpy = vi.spyOn(scene, 'spawnFountainLoot');
      const dm = DataManager.getInstance();
      const initialCoins = dm.getProfile().coins;
      const initialGems = dm.getProfile().gems;

      scene.onReachChest();

      expect(scene.isCelebrating).toBe(true);
      expect(scene.playerSprite.texture.key).toBe(scene.skinConfig.cheerKey);
      expect(scene.chestObject.texture.key).toBe('chest_open');
      expect(soundSpy).toHaveBeenCalledWith('chest');
      expect(lootSpy).toHaveBeenCalled();
      expect(dm.getProfile().coins).toBe(initialCoins + 5);
      expect(dm.getProfile().gems).toBe(initialGems + 1);
    });
  });

  // =========================================================================
  // 8. Skip Button & Navigation Transitions
  // =========================================================================
  describe('Skip / Fast-Forward & Navigation Flow', () => {
    it('skipRunner sweeps remaining coins, awards chest bonus and transitions immediately', () => {
      scene.init({ isStationComplete: false, questionIndex: 0 });
      scene.create();

      const dm = DataManager.getInstance();
      const initialCoins = dm.getProfile().coins;

      scene.skipRunner();

      expect(dm.getProfile().coins).toBeGreaterThan(initialCoins);
      expect(mockScene.scene.start).toHaveBeenCalledWith(
        'QuestionScene',
        expect.objectContaining({
          stationId: 1,
          questionIndex: 1,
        })
      );
    });

    it('transitions to QuestionScene with questionIndex + 1 when isStationComplete is false', () => {
      scene.init({
        stationId: 1,
        stationName: '起點海灘',
        questionIndex: 0,
        isStationComplete: false,
        totalQuestions: 3,
      });
      scene.create();

      scene.finishRunner();

      expect(mockScene.scene.start).toHaveBeenCalledWith('QuestionScene', {
        stationId: 1,
        stationName: '起點海灘',
        questionIndex: 1,
        totalQuestions: 3,
        questions: scene.questions,
        sessionStats: scene.sessionStats,
      });
    });

    it('transitions to ResultScene when isStationComplete is true', () => {
      scene.init({
        stationId: 1,
        stationName: '起點海灘',
        questionIndex: 2,
        isStationComplete: true,
        totalQuestions: 3,
      });
      scene.create();

      scene.finishRunner();

      expect(mockScene.scene.start).toHaveBeenCalledWith('ResultScene', {
        stationId: 1,
        stationName: '起點海灘',
        totalQuestions: 3,
        questions: scene.questions,
        sessionStats: scene.sessionStats,
      });
    });

    it('prevents double transition execution via isTransitioning guard', () => {
      scene.init({ isStationComplete: true });
      scene.create();

      scene.finishRunner();
      expect(mockScene.scene.start).toHaveBeenCalledTimes(1);

      // Second attempt
      scene.finishRunner();
      expect(mockScene.scene.start).toHaveBeenCalledTimes(1);
    });
  });
});
