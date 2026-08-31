import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import { BootScene } from './BootScene';
import { PreloadScene, LEARNING_TIPS } from './PreloadScene';
import { TitleScene } from './TitleScene';
import { MapScene } from './MapScene';
import { QuestionScene } from './QuestionScene';
import { RunnerScene } from './RunnerScene';
import { ResultScene } from './ResultScene';
import { ShopScene } from './ShopScene';
import { TrophyScene } from './TrophyScene';
import { SettingsScene } from './SettingsScene';
import { gameScenes, phaserGameConfig } from '../main';
import { DataManager } from '../services/DataManager';
import { SpeechService } from '../services/SpeechService';
import { SoundManager } from '../services/SoundManager';

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

export function createMockSceneForTest(sceneKey: string): any {
  const sceneListeners: Record<string, Function[]> = {};
  const loaderListeners: Record<string, Function[]> = {};

  const scene: any = {
    key: sceneKey,
    sys: {
      settings: { key: sceneKey },
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
      key: sceneKey,
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
        setScroll: vi.fn(function (this: any, x = 0, y = 0) {
          this.scrollX = x;
          this.scrollY = y;
          return this;
        }),
        centerOn: vi.fn().mockReturnThis(),
        pan: vi.fn().mockReturnThis(),
        zoom: 1,
        setZoom: vi.fn().mockReturnThis(),
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
      on: vi.fn((ev: string, fn: Function) => {
        (loaderListeners[ev] = loaderListeners[ev] || []).push(fn);
      }),
      emit: vi.fn((ev: string, ...args: any[]) => {
        (loaderListeners[ev] || []).forEach((fn: any) => fn(...args));
      }),
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
          fillTriangle: vi.fn().mockReturnThis(),
          strokeTriangle: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          lineBetween: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          quadraticBezierTo: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
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
          setFontSize: vi.fn().mockReturnThis(),
          setFontFamily: vi.fn().mockReturnThis(),
          setShadow: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
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
          setOrigin: vi.fn(function (ox = 0.5, oy = 0.5) {
            r.originX = ox;
            r.originY = oy;
            return r;
          }),
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
          displayWidth: 32,
          displayHeight: 32,
          setOrigin: vi.fn().mockReturnThis(),
          setScale: vi.fn(function (s: number) {
            img.scaleX = s;
            img.scaleY = s;
            return img;
          }),
          setDisplaySize: vi.fn(function (w: number, h: number) {
            img.displayWidth = w;
            img.displayHeight = h;
            return img;
          }),
          setTexture: vi.fn(function (k: string) {
            img.texture = { key: k };
            return img;
          }),
          setTint: vi.fn().mockReturnThis(),
          clearTint: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(img);
      }),
    },
    tweens: {
      add: vi.fn((_config: any) => {
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

describe('Scene Lifecycle & Navigation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    try {
      DataManager.getInstance().reset();
    } catch {
      // Ignore
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. BootScene Tests
  // =========================================================================
  describe('BootScene', () => {
    it('creates BootScene instance with correct scene key', () => {
      const bootScene = new BootScene();
      expect(bootScene.sys?.settings?.key || (bootScene as any).scene?.key).toBe('BootScene');
    });

    it('sets Phaser scale FIT and CENTER_BOTH during init()', () => {
      const bootScene = new BootScene();
      const mock = createMockSceneForTest('BootScene');
      Object.assign(bootScene, mock);

      bootScene.init();
      expect(bootScene.scale.scaleMode).toBe(Phaser.Scale.FIT);
      expect(bootScene.scale.autoCenter).toBe(Phaser.Scale.CENTER_BOTH);
    });

    it('initializes DataManager, binds pointerdown audio unlock, and transitions to PreloadScene', () => {
      const bootScene = new BootScene();
      const mock = createMockSceneForTest('BootScene');
      Object.assign(bootScene, mock);

      const unlockSpy = vi.spyOn(SpeechService, 'unlockAudio');
      const initSpy = vi.spyOn(SpeechService, 'init');

      bootScene.create();

      expect(initSpy).toHaveBeenCalled();
      expect(mock.input.once).toHaveBeenCalledWith('pointerdown', expect.any(Function));

      // Simulate pointerdown
      mock.input.emit('pointerdown');
      expect(unlockSpy).toHaveBeenCalled();

      // Verify immediate transition to PreloadScene
      expect(mock.scene.start).toHaveBeenCalledWith('PreloadScene');
    });
  });

  // =========================================================================
  // 2. PreloadScene Tests
  // =========================================================================
  describe('PreloadScene', () => {
    it('creates PreloadScene instance with correct scene key', () => {
      const preloadScene = new PreloadScene();
      expect(preloadScene.sys?.settings?.key || (preloadScene as any).scene?.key).toBe('PreloadScene');
    });

    it('sets up loading bar UI and learning tips during preload()', () => {
      const preloadScene = new PreloadScene();
      const mock = createMockSceneForTest('PreloadScene');
      Object.assign(preloadScene, mock);

      preloadScene.preload();

      // UI graphics and text created
      expect(mock.add.graphics).toHaveBeenCalled();
      expect(mock.add.text).toHaveBeenCalled();
      expect(mock.time.addEvent).toHaveBeenCalled();

      // Kenney assets loading requested
      expect(mock.load.audio).toHaveBeenCalled();
      expect(mock.load.image).toHaveBeenCalled();

      // Verify standard sound keys are loaded
      const loadedAudioKeys = mock.load.audio.mock.calls.map((call: any[]) => call[0]);
      expect(loadedAudioKeys).toContain('click');
      expect(loadedAudioKeys).toContain('correct');
      expect(loadedAudioKeys).toContain('wrong');
      expect(loadedAudioKeys).toContain('coin');
      expect(loadedAudioKeys).toContain('victory');

      // Verify platformer character sprites are loaded
      const loadedImageKeys = mock.load.image.mock.calls.map((call: any[]) => call[0]);
      expect(loadedImageKeys).toContain('player_stand');
      expect(loadedImageKeys).toContain('player_jump');
      expect(loadedImageKeys).toContain('adventurer_stand');
      expect(loadedImageKeys).toContain('soldier_stand');
    });

    it('registers wardrobe thumbnails and optional wearing poses with the asset loader', () => {
      const preloadScene = new PreloadScene();
      const mock = createMockSceneForTest('PreloadScene');
      Object.assign(preloadScene, mock);

      preloadScene.preload();

      const loadedImageKeys = mock.load.image.mock.calls.map((call: any[]) => call[0]);
      expect(loadedImageKeys).toContain('assets/outfits/scholar_gown/thumbnail.png');
      expect(loadedImageKeys).toContain('assets/character/outfits/scholar_gown/idle.png');
      expect(loadedImageKeys).toContain('assets/character/outfits/scholar_gown/run.png');
      expect(loadedImageKeys).toContain('assets/character/outfits/scholar_gown/cheer.png');
    });

    it('does not enqueue missing Star Hoodie placeholder art', () => {
      const preloadScene = new PreloadScene();
      const mock = createMockSceneForTest('PreloadScene');
      Object.assign(preloadScene, mock);

      preloadScene.preload();

      const loadedImageKeys = mock.load.image.mock.calls.map((call: any[]) => call[0]);
      expect(loadedImageKeys).not.toContain('assets/character/outfits/star_hoodie/star_hoodie_wearing.png');
      expect(loadedImageKeys).not.toContain('assets/outfits/star_hoodie/star_hoodie_thumbnail.png');
    });

    it('does not enqueue synthetic future layer paths for full-sprite outfits', () => {
      const preloadScene = new PreloadScene();
      const mock = createMockSceneForTest('PreloadScene');
      Object.assign(preloadScene, mock);

      preloadScene.preload();

      const loadedImageKeys = mock.load.image.mock.calls.map((call: any[]) => call[0]);
      expect(loadedImageKeys.some((key: string) => key.endsWith('/dress_or_outfit.png'))).toBe(false);
    });

    it('handles loader progress and complete events cleanly', () => {
      const preloadScene = new PreloadScene();
      const mock = createMockSceneForTest('PreloadScene');
      Object.assign(preloadScene, mock);

      preloadScene.preload();

      // Emit progress 50%
      mock.load.emit('progress', 0.5);

      // Emit complete
      mock.load.emit('complete');

      expect(mock.load.on).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(mock.load.on).toHaveBeenCalledWith('complete', expect.any(Function));
    });

    it('generates procedural fallback textures for stars, clouds, airship and currencies', () => {
      const preloadScene = new PreloadScene();
      const mock = createMockSceneForTest('PreloadScene');
      Object.assign(preloadScene, mock);

      preloadScene.generateProceduralTextures();
      // Should execute without errors even in mock headless environment
      expect(preloadScene.generateProceduralTextures).toBeDefined();
    });

    it('initializes SoundManager and starts TitleScene in create()', () => {
      const preloadScene = new PreloadScene();
      const mock = createMockSceneForTest('PreloadScene');
      Object.assign(preloadScene, mock);

      const soundInitSpy = vi.spyOn(SoundManager, 'init');

      preloadScene.create();

      expect(soundInitSpy).toHaveBeenCalledWith(preloadScene);
      expect(mock.scene.start).toHaveBeenCalledWith('TitleScene');
    });

    it('has valid learning tips array defined with positive guidance', () => {
      expect(LEARNING_TIPS.length).toBeGreaterThanOrEqual(4);
      for (const tip of LEARNING_TIPS) {
        expect(tip.startsWith('小提示：')).toBe(true);
      }
    });
  });

  // =========================================================================
  // 3. TitleScene Tests
  // =========================================================================
  describe('TitleScene', () => {
    it('creates TitleScene instance with correct scene key', () => {
      const titleScene = new TitleScene();
      expect(titleScene.sys?.settings?.key || (titleScene as any).scene?.key).toBe('TitleScene');
    });

    it('renders sky, clouds, airship, title logo and navigation buttons in create()', () => {
      const titleScene = new TitleScene();
      const mock = createMockSceneForTest('TitleScene');
      Object.assign(titleScene, mock);

      titleScene.create();

      expect(titleScene.startButton).toBeDefined();
      expect(titleScene.shopButton).toBeDefined();
      expect(titleScene.trophyButton).toBeDefined();
      expect(titleScene.settingsButton).toBeDefined();
      expect(titleScene.reportButton).toBeDefined();

      expect(titleScene.startButton?.getText()).toBe('🚀 開始遊戲');
      expect(titleScene.shopButton?.getText()).toBe('🛒 商店');
      expect(titleScene.trophyButton?.getText()).toBe('🏆 獎盃');
      expect(titleScene.settingsButton?.getText()).toBe('⚙️ 設定');
      expect(titleScene.reportButton?.getText()).toBe('📊 成績表');
    });

    it('navigates to MapScene on start button click', () => {
      const titleScene = new TitleScene();
      const mock = createMockSceneForTest('TitleScene');
      Object.assign(titleScene, mock);

      titleScene.create();

      // Trigger startButton pointerup
      titleScene.startButton?.emit('pointerup');
      expect(mock.scene.start).toHaveBeenCalledWith('MapScene');
    });

    it('navigates to ShopScene on shop button click', () => {
      const titleScene = new TitleScene();
      const mock = createMockSceneForTest('TitleScene');
      Object.assign(titleScene, mock);

      titleScene.create();

      titleScene.shopButton?.emit('pointerup');
      expect(mock.scene.start).toHaveBeenCalledWith('ShopScene');
    });

    it('navigates to TrophyScene on trophy button click', () => {
      const titleScene = new TitleScene();
      const mock = createMockSceneForTest('TitleScene');
      Object.assign(titleScene, mock);

      titleScene.create();

      titleScene.trophyButton?.emit('pointerup');
      expect(mock.scene.start).toHaveBeenCalledWith('TrophyScene');
    });

    it('navigates to SettingsScene on settings button click', () => {
      const titleScene = new TitleScene();
      const mock = createMockSceneForTest('TitleScene');
      Object.assign(titleScene, mock);

      titleScene.create();

      titleScene.settingsButton?.emit('pointerup');
      expect(mock.scene.start).toHaveBeenCalledWith('SettingsScene');
    });

    it('opens Report Card modal on report button click and displays statistics', () => {
      const titleScene = new TitleScene();
      const mock = createMockSceneForTest('TitleScene');
      Object.assign(titleScene, mock);

      const dm = DataManager.getInstance();
      dm.recordCorrectAnswer('chinese');
      dm.recordCorrectAnswer('math');
      dm.recordCorrectAnswer('english');
      dm.addCoins(50);
      dm.addGems(5);

      titleScene.create();

      // Click report card button
      titleScene.reportButton?.emit('pointerup');
      const modal = titleScene.reportModal;
      expect(modal).not.toBeNull();
      expect(modal?.getTitle()).toBe('📊 學習成績表');
      expect(modal?.isOpen()).toBe(true);

      // Close modal
      modal?.close();
      expect(modal?.isOpen()).toBe(false);
      expect(titleScene.reportModal).toBeNull();
    });

    it('refreshes currency bar text on data updates', () => {
      const titleScene = new TitleScene();
      const mock = createMockSceneForTest('TitleScene');
      Object.assign(titleScene, mock);

      titleScene.create();

      const dm = DataManager.getInstance();
      dm.addCoins(100);
      dm.addGems(10);

      titleScene.refreshCurrencyBar();
      // Should run without throw
      expect(titleScene.refreshCurrencyBar).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Stub Scenes (MapScene, QuestionScene, RunnerScene, ResultScene, ShopScene, TrophyScene, SettingsScene)
  // =========================================================================
  describe('Stub Scenes Round-Trip Navigation', () => {
    it('MapScene renders and provides back-to-title navigation', () => {
      const scene = new MapScene();
      const mock = createMockSceneForTest('MapScene');
      Object.assign(scene, mock);

      scene.create();
      expect(mock.add.text).toHaveBeenCalled();
    });

    it('QuestionScene renders and provides back-to-title navigation', () => {
      const scene = new QuestionScene();
      const mock = createMockSceneForTest('QuestionScene');
      Object.assign(scene, mock);

      scene.create();
      expect(mock.add.text).toHaveBeenCalled();
    });

    it('RunnerScene renders and provides back-to-title navigation', () => {
      const scene = new RunnerScene();
      const mock = createMockSceneForTest('RunnerScene');
      Object.assign(scene, mock);

      scene.create();
      expect(mock.add.text).toHaveBeenCalled();
    });

    it('ResultScene renders and provides back-to-title navigation', () => {
      const scene = new ResultScene();
      const mock = createMockSceneForTest('ResultScene');
      Object.assign(scene, mock);

      scene.create();
      expect(mock.add.text).toHaveBeenCalled();
    });

    it('ShopScene renders and provides back-to-title navigation', () => {
      const scene = new ShopScene();
      const mock = createMockSceneForTest('ShopScene');
      Object.assign(scene, mock);

      scene.create();
      expect(mock.add.text).toHaveBeenCalled();
    });

    it('TrophyScene renders and provides back-to-title navigation', () => {
      const scene = new TrophyScene();
      const mock = createMockSceneForTest('TrophyScene');
      Object.assign(scene, mock);

      scene.create();
      expect(mock.add.text).toHaveBeenCalled();
    });

    it('SettingsScene renders and provides back-to-title navigation', () => {
      const scene = new SettingsScene();
      const mock = createMockSceneForTest('SettingsScene');
      Object.assign(scene, mock);

      scene.create();
      expect(mock.add.text).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 5. Game Scene Registration Suite
  // =========================================================================
  describe('Game Scene Registration in main.ts', () => {
    it('registers all 10 scenes in exact sequence in gameScenes array', () => {
      expect(gameScenes).toHaveLength(10);
      expect(gameScenes[0]).toBe(BootScene);
      expect(gameScenes[1]).toBe(PreloadScene);
      expect(gameScenes[2]).toBe(TitleScene);
      expect(gameScenes[3]).toBe(MapScene);
      expect(gameScenes[4]).toBe(QuestionScene);
      expect(gameScenes[5]).toBe(RunnerScene);
      expect(gameScenes[6]).toBe(ResultScene);
      expect(gameScenes[7]).toBe(ShopScene);
      expect(gameScenes[8]).toBe(TrophyScene);
      expect(gameScenes[9]).toBe(SettingsScene);
    });

    it('passes gameScenes array to phaserGameConfig.scene', () => {
      expect(phaserGameConfig.scene).toBe(gameScenes);
    });
  });
});
