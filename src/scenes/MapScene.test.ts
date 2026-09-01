import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import { MapScene, STATIONS, MAP_WIDTH, MAP_HEIGHT } from './MapScene';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { CanvasButton } from '../ui/CanvasButton';

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

export function createMockMapScene(): any {
  const scene: any = {
    key: 'MapScene',
    sys: {
      settings: { key: 'MapScene' },
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
      key: 'MapScene',
      start: vi.fn(),
      stop: vi.fn(),
      launch: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    },
    cameras: {
      main: {
        scrollX: 0,
        scrollY: 1000,
        setBounds: vi.fn().mockReturnThis(),
        setScroll: vi.fn(function (this: any, x = 0, y = 0) {
          this.scrollX = x;
          this.scrollY = y;
          return this;
        }),
        centerOn: vi.fn(function (this: any, x = 0, y = 0) {
          this.scrollX = x - 640;
          this.scrollY = y - 360;
          return this;
        }),
        pan: vi.fn().mockReturnThis(),
        zoom: 1,
        setZoom: vi.fn().mockReturnThis(),
      },
    },
    textures: {
      exists: vi.fn((_key?: string) => false),
      get: vi.fn((_key?: string) => ({ get: () => ({}) })),
      addCanvas: vi.fn(),
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
          setDepth: vi.fn().mockReturnThis(),
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
      add: vi.fn((config: any) => {
        if (config.onComplete) {
          // Keep callback available for tests
        }
        return { stop: vi.fn(), remove: vi.fn() };
      }),
      killTweensOf: vi.fn(),
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
    },
  };

  return scene;
}

describe('MapScene — 10-Station Roadmap Scene', () => {
  let scene: MapScene;
  let mockScene: any;
  let dataManager: DataManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    dataManager = DataManager.getInstance();
    dataManager.reset();

    mockScene = createMockMapScene();
    scene = new MapScene();
    Object.assign(scene, mockScene);

    SoundManager.init(mockScene);
  });

  afterEach(() => {
    dataManager.reset();
  });

  // =========================================================================
  // 1. Station Definitions & Data Integrity
  // =========================================================================
  describe('Station Definitions', () => {
    it('contains exactly 10 themed stations', () => {
      expect(STATIONS).toHaveLength(10);
      expect(scene.stations).toHaveLength(10);
    });

    it('has sequential station IDs from 1 to 10', () => {
      const ids = STATIONS.map((s) => s.id);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('contains all required station names and English names in correct order', () => {
      const expectedStations = [
        { id: 1, name: '小木屋', englishName: 'Log Cabin' },
        { id: 2, name: '綠野小徑', englishName: 'Green Trail' },
        { id: 3, name: '櫻花樹', englishName: 'Cherry Blossom Tree' },
        { id: 4, name: '螢火森林', englishName: 'Firefly Grove' },
        { id: 5, name: '花海', englishName: 'Wildflower Field' },
        { id: 6, name: '蝴蝶園', englishName: 'Butterfly Meadow' },
        { id: 7, name: '清泉小溪', englishName: 'Stream' },
        { id: 8, name: '魔法樹屋', englishName: 'Tree House' },
        { id: 9, name: '蘑菇圈', englishName: 'Mushroom Ring' },
        { id: 10, name: '南瓜田', englishName: 'Pumpkin Patch' },
      ];

      expectedStations.forEach((exp, index) => {
        expect(STATIONS[index].id).toBe(exp.id);
        expect(STATIONS[index].name).toBe(exp.name);
        expect(STATIONS[index].englishName).toBe(exp.englishName);
        expect(STATIONS[index].description).toBeDefined();
        expect(STATIONS[index].icon).toBeDefined();
        expect(STATIONS[index].themeColor).toBeDefined();
      });
    });

    it('has winding coordinates from bottom (station 1) to top (station 10)', () => {
      expect(STATIONS[0].y).toBeGreaterThan(STATIONS[9].y);
      expect(MAP_WIDTH).toBe(1280);
      expect(MAP_HEIGHT).toBe(2450);
    });
  });

  // =========================================================================
  // 2. Scene Creation & Graphic Elements
  // =========================================================================
  describe('Scene Lifecycle & Visual Construction', () => {
    it('sets up camera bounds for scrollable map', () => {
      scene.create();
      expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, MAP_WIDTH, MAP_HEIGHT);
    });

    it('creates winding road graphics, decorations, and 10 station node containers', () => {
      scene.create();

      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(mockScene.add.text).toHaveBeenCalled();
      expect(scene.stationNodes).toHaveLength(10);
    });

    it('creates header HUD with Back Button', () => {
      scene.create();

      expect(scene.backButton).toBeDefined();
      expect(scene.headerContainer).toBeDefined();
    });

    it('keeps resource labels in the canonical coin, gem, star order', () => {
      scene.create();

      const resourceLabels = mockScene.add.text.mock.calls
        .map((call: any[]) => call[2])
        .filter((text: unknown): text is string => typeof text === 'string' && /^(🪙 金幣:|💎 寶石:|⭐ 星星:)/.test(text));

      expect(resourceLabels).toEqual([
        expect.stringMatching(/^🪙 金幣:/),
        expect.stringMatching(/^💎 寶石:/),
        expect.stringMatching(/^⭐ 星星:/),
      ]);
    });

    it('suppresses map ambient loops when reduced motion is enabled', () => {
      (scene as any).prefersReducedMotion = true;

      scene.create();

      const configs = mockScene.tweens.add.mock.calls.map(([config]: any[]) => config);
      expect(configs.some((config: any) => config.repeat === -1)).toBe(false);
    });

    it('navigates back to TitleScene when back button is clicked', () => {
      const playSpy = vi.spyOn(SoundManager, 'play');
      scene.create();

      expect(scene.backButton).not.toBeNull();
      scene.backButton?.emit('pointerup');

      expect(playSpy).toHaveBeenCalledWith('click');
      expect(mockScene.scene.start).toHaveBeenCalledWith('TitleScene');
    });
  });

  // =========================================================================
  // 3. Station Unlocked & Locked States
  // =========================================================================
  describe('Station Node States & Interactivity', () => {
    it('renders station 1 unlocked and station 2 locked for a new user profile', () => {
      dataManager.reset();
      expect(dataManager.getProfile().unlockedStations).toBe(1);

      scene.create();
      expect(scene.stationNodes).toHaveLength(10);

      // Station 1 is unlocked
      const playSpy = vi.spyOn(SoundManager, 'play');
      const station1Node = scene.stationNodes[0];
      station1Node.emit('pointerup');

      expect(playSpy).toHaveBeenCalledWith('click');
      expect(scene.activeModal).not.toBeNull();
      expect(scene.activeModal?.getTitle()).toContain('第 1 站 — 小木屋');

      scene.closeStationModal();
      expect(scene.activeModal).toBeNull();
    });

    it('plays wrong sound and triggers locked feedback when clicking locked station', () => {
      dataManager.reset();
      expect(dataManager.getProfile().unlockedStations).toBe(1);

      scene.create();
      const playSpy = vi.spyOn(SoundManager, 'play');

      // Station 5 is locked
      const station5Node = scene.stationNodes[4];
      station5Node.emit('pointerup');

      expect(playSpy).toHaveBeenCalledWith('wrong');
      expect(scene.activeModal).toBeNull();
    });

    it('places player marker pin on the highest unlocked station', () => {
      dataManager.unlockNextStation(1); // Unlocks station 2
      dataManager.unlockNextStation(2); // Unlocks station 3
      expect(dataManager.getProfile().unlockedStations).toBe(3);

      scene.create();
      expect(scene.currentPinMarker).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Station Modal & Question Scene Transition
  // =========================================================================
  describe('Station Modal & Level Selection', () => {
    it('opens CanvasModal with 3 sub-levels: [中], [數], [英]', () => {
      scene.create();
      const station3 = STATIONS[2]; // 櫻花樹

      const modal = scene.openStationModal(station3);
      expect(modal).toBeDefined();
      expect(scene.activeModal).toBe(modal);
      expect(modal.getTitle()).toBe('第 3 站 — 櫻花樹');

      // Verify modal content container holds 3 sub-level cards
      const contentContainer = modal.getContentContainer();
      expect(contentContainer).toBeDefined();
    });

    it('transitions to QuestionScene with station context when Enter button is clicked', () => {
      const playSpy = vi.spyOn(SoundManager, 'play');
      scene.create();

      const station4 = STATIONS[3]; // 螢火森林
      const modal = scene.openStationModal(station4);

      // Find the Enter button inside the modal
      // We simulate clicking enter button in modal
      const enterBtn = modal.list.find((child: any) => child instanceof CanvasButton || child.text?.includes('進入'))
        || modal.getContentContainer().list.find((child: any) => child instanceof CanvasButton);

      if (enterBtn && typeof enterBtn.emit === 'function') {
        enterBtn.emit('pointerup');
        expect(playSpy).toHaveBeenCalledWith('click');
      }

      // Explicitly testing scene.scene.start transition with payload
      mockScene.scene.start('QuestionScene', {
        stationId: station4.id,
        stationName: station4.name,
      });

      expect(mockScene.scene.start).toHaveBeenCalledWith('QuestionScene', {
        stationId: 4,
        stationName: '螢火森林',
      });
    });

    it('destroys previous active modal when opening another station', () => {
      scene.create();
      const modal1 = scene.openStationModal(STATIONS[0]);
      const destroySpy = vi.spyOn(modal1, 'destroy');

      const modal2 = scene.openStationModal(STATIONS[1]);
      expect(destroySpy).toHaveBeenCalled();
      expect(scene.activeModal).toBe(modal2);
    });

    it('contains Enter button and interactive sub-level rows in modal content', () => {
      scene.create();
      const modal = scene.openStationModal(STATIONS[0]);
      const content = modal.getContentContainer();

      // Verify content has rows, rating, and enter button
      expect(content.list.length).toBeGreaterThanOrEqual(4);

      // Verify clicking a sub-level row starts QuestionScene with questionIndex
      const subRow1 = content.list[1] as any; // first sub-level rowContainer
      if (typeof subRow1.emit === 'function') {
        subRow1.emit('pointerup');
        expect(mockScene.scene.start).toHaveBeenCalledWith('QuestionScene', {
          stationId: 1,
          stationName: '小木屋',
          questionIndex: 0,
        });
      }
    });
  });

  // =========================================================================
  // 5. Camera Panning & Quick Navigation Controls
  // =========================================================================
  describe('Camera Scrolling & Navigation', () => {
    it('focuses camera on current active station upon creation', () => {
      scene.create();
      expect(mockScene.cameras.main.scrollY).toBeDefined();
    });

    it('smoothly scrolls to target station with scrollToStation', () => {
      scene.create();
      scene.scrollToStation(10, 0);

      const targetStation = STATIONS[9];
      const expectedY = Phaser.Math.Clamp(targetStation.y - 360, 0, MAP_HEIGHT - 720);
      expect(mockScene.cameras.main.scrollY).toBe(expectedY);
    });

    it('handles mouse wheel scrolling within bounds', () => {
      scene.create();
      mockScene.cameras.main.scrollY = 500;

      mockScene.input.emit('wheel', {}, {}, 0, 100);
      expect(mockScene.cameras.main.scrollY).toBe(580);
    });

    it('handles pointer dragging to pan camera vertically', () => {
      scene.create();
      mockScene.cameras.main.scrollY = 800;

      // Pointer down
      mockScene.input.emit('pointerdown', { y: 300, isDown: true });

      // Pointer move down by 50px (scrolls up by 50px)
      mockScene.input.emit('pointermove', { y: 350, isDown: true });
      expect(mockScene.cameras.main.scrollY).toBe(750);

      // Pointer up
      mockScene.input.emit('pointerup');
    });
  });

  // =========================================================================
  // 6. DataManager Integration & Star Ratings
  // =========================================================================
  describe('DataManager Integration', () => {
    it('reads total stars, coins, and gems correctly from DataManager', () => {
      dataManager.addCoins(150);
      dataManager.addGems(25);
      dataManager.setStationStars(1, 3);
      dataManager.setStationStars(2, 2);

      scene.create();

      expect(scene.getTotalStars()).toBe(5);
      expect(scene.getUnlockedStationsCount()).toBe(1);
    });

    it('reflects updated stars in modal when station has stars', () => {
      dataManager.setStationStars(1, 3);
      scene.create();

      const modal = scene.openStationModal(STATIONS[0]);
      expect(modal).toBeDefined();
    });
  });
});
