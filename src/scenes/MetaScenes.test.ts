import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import { ResultScene, ResultSceneInitData } from './ResultScene';
import { ShopScene, CHARACTER_SKINS } from './ShopScene';
import { TrophyScene, TROPHY_CATEGORIES } from './TrophyScene';
import { SettingsScene, DIFFICULTY_OPTIONS } from './SettingsScene';
import { DataManager, TROPHY_DEFINITIONS } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { WARDROBE_ITEMS } from '../config/wardrobe';

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

export function createMockSceneForMeta(sceneKey: string): any {
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
      restart: vi.fn(),
    },
    cameras: {
      main: {
        scrollX: 0,
        scrollY: 0,
        setBounds: vi.fn().mockReturnThis(),
        setScroll: vi.fn().mockReturnThis(),
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
          lineBetween: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          setDepth: vi.fn(function (d: number) {
            g.depth = d;
            return g;
          }),
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
          setDepth: vi.fn(function (d: number) {
            t.depth = d;
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
  };
  return scene;
}

describe('Meta & Support Scenes Suite', () => {
  let dataManager: DataManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    dataManager = DataManager.getInstance();
    dataManager.reset();

    const mockGlobal = createMockSceneForMeta('Global');
    SoundManager.init(mockGlobal);
    vi.spyOn(SoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(SpeechService, 'speak').mockImplementation(() => null as any);
  });

  afterEach(() => {
    dataManager.reset();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. ResultScene Tests
  // =========================================================================
  describe('ResultScene — Settlement, Stars, Rewards & Navigation', () => {
    let scene: ResultScene;
    let mock: any;

    beforeEach(() => {
      mock = createMockSceneForMeta('ResultScene');
      scene = new ResultScene();
      Object.assign(scene, mock);
    });

    it('calculates 3 stars for 0 hints and 0 mistakes (Perfect run)', () => {
      expect(scene.calculateStars(0, 0)).toBe(3);
    });

    it('calculates 2 stars for 1 hint or 1 mistake', () => {
      expect(scene.calculateStars(1, 0)).toBe(2);
      expect(scene.calculateStars(0, 1)).toBe(2);
    });

    it('calculates 1 star for 2 or more hints and mistakes', () => {
      expect(scene.calculateStars(2, 0)).toBe(1);
      expect(scene.calculateStars(1, 1)).toBe(1);
      expect(scene.calculateStars(3, 2)).toBe(1);
    });

    it('initializes with settlement payload, calculates rewards, and updates DataManager', () => {
      const payload: ResultSceneInitData = {
        stationId: 2,
        stationName: '綠野小徑',
        totalQuestions: 3,
        sessionStats: {
          hintsUsed: 0,
          mistakes: 0,
          correctCount: 3,
          startTime: Date.now(),
        },
        runnerCoins: 15,
      };

      scene.init(payload);

      expect(scene.stationId).toBe(2);
      expect(scene.stationName).toBe('綠野小徑');
      expect(scene.starsEarned).toBe(3);
      expect(scene.rewardCoins).toBe(65); // 50 base + 15 runner
      expect(scene.rewardGems).toBe(5);

      // Verify DataManager progress
      const profile = dataManager.getProfile();
      expect(profile.stationStars[2]).toBe(3);
      expect(profile.unlockedStations).toBe(3);
      expect(profile.coins).toBeGreaterThanOrEqual(65);
      expect(profile.gems).toBeGreaterThanOrEqual(5);
    });

    it('normalizes legacy string station IDs before settling and displaying the station', () => {
      scene.init({ stationId: 'st_cherry' });

      expect(scene.stationId).toBe(3);
      expect(scene.stationName).toBe('櫻花樹');
    });

    it('creates settlement UI with fanfare sound, confetti particles, and StarRating', () => {
      scene.init({
        stationId: 1,
        stationName: '小木屋',
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: Date.now() },
      });
      scene.create();

      expect(SoundManager.play).toHaveBeenCalledWith('victory');
      expect(scene.starRating).toBeDefined();
      expect(scene.confettiParticles.length).toBeGreaterThan(0);
      expect(scene.mapButton).toBeDefined();
      expect(scene.retryButton).toBeDefined();
      expect(scene.nextStationButton).toBeDefined();
      expect(scene.homeButton).toBeDefined();
    });

    it('uses one-shot result confetti instead of an infinite loop', () => {
      mock.tweens.add.mockClear();

      (scene as any).spawnConfettiParticles(1280, 720);

      expect(mock.tweens.add.mock.calls.length).toBeGreaterThan(0);
      expect(mock.tweens.add.mock.calls.every(([config]: any[]) => config.repeat !== -1)).toBe(true);
    });

    it('cleans each result confetti particle after its one-shot tween completes', () => {
      mock.tweens.add.mockClear();

      (scene as any).spawnConfettiParticles(1280, 720);
      const configs = mock.tweens.add.mock.calls.map(([config]: any[]) => config);

      configs.forEach((config: any) => config.onComplete?.());

      expect(scene.confettiParticles).toHaveLength(0);
      configs.forEach((config: any) => expect(config.targets.destroy).toHaveBeenCalled());
    });

    it('caps result confetti to a short burst and cleans it on scene shutdown', () => {
      mock.tweens.add.mockClear();

      (scene as any).spawnConfettiParticles(1280, 720);
      const configs = mock.tweens.add.mock.calls.map(([config]: any[]) => config);

      expect(configs.length).toBeLessThanOrEqual(22);
      expect(configs.every((config: any) => (config.delay ?? 0) + config.duration <= 6000)).toBe(true);

      scene.shutdown();

      expect(scene.confettiParticles).toHaveLength(0);
      expect(configs.every((config: any) => config.targets.destroy.mock.calls.length > 0)).toBe(true);
    });

    it('skips optional result confetti when reduced motion is enabled', () => {
      scene.prefersReducedMotion = true;

      (scene as any).spawnConfettiParticles(1280, 720);

      expect(scene.confettiParticles).toHaveLength(0);
      expect(mock.tweens.add).not.toHaveBeenCalled();
    });

    it('navigates to MapScene when clicking map button', () => {
      scene.init({ stationId: 1 });
      scene.create();

      scene.mapButton?.emit('pointerup');
      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(mock.scene.start).toHaveBeenCalledWith('MapScene');
    });

    it('navigates to QuestionScene when clicking retry button', () => {
      scene.init({ stationId: 2, stationName: '綠野小徑' });
      scene.create();

      scene.retryButton?.emit('pointerup');
      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(mock.scene.start).toHaveBeenCalledWith('QuestionScene', {
        stationId: 2,
        stationName: '綠野小徑',
        questionIndex: 0,
      });
    });

    it('navigates to next station QuestionScene when clicking next station button', () => {
      scene.init({ stationId: 2 });
      scene.create();

      scene.nextStationButton?.emit('pointerup');
      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(mock.scene.start).toHaveBeenCalledWith('QuestionScene', {
        stationId: 3,
        stationName: '櫻花樹',
        questionIndex: 0,
      });
    });

    it('navigates to TitleScene when clicking home button', () => {
      scene.init({ stationId: 1 });
      scene.create();

      scene.homeButton?.emit('pointerup');
      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(mock.scene.start).toHaveBeenCalledWith('TitleScene');
    });

    it('announces newly unlocked trophies via banner/modal if earned during settlement', () => {
      // Setup condition to trigger a trophy on next correct answer / settlement
      dataManager.recordCorrectAnswer('chinese');

      scene.init({
        stationId: 1,
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: Date.now() },
      });
      scene.create();

      expect(scene.newlyUnlockedTrophies.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. ShopScene Tests
  // =========================================================================
  describe('ShopScene — Character Skins, Live Preview & Purchases', () => {
    let scene: ShopScene;
    let mock: any;

    beforeEach(() => {
      mock = createMockSceneForMeta('ShopScene');
      scene = new ShopScene();
      Object.assign(scene, mock);
    });

    it('contains all 5 Kenney character skins with perk bonuses and costs', () => {
      expect(CHARACTER_SKINS).toHaveLength(5);

      const skinIds = CHARACTER_SKINS.map((s) => s.id);
      expect(skinIds).toContain('adventurer');
      expect(skinIds).toContain('heroine');
      expect(skinIds).toContain('soldier');
      expect(skinIds).toContain('knight');
      expect(skinIds).toContain('ninja');

      const adventurer = CHARACTER_SKINS.find((s) => s.id === 'adventurer')!;
      expect(adventurer.costGems).toBe(0);

      const heroine = CHARACTER_SKINS.find((s) => s.id === 'heroine')!;
      expect(heroine.costGems).toBe(30);
      expect(heroine.jumpBonus).toBe(0.10);

      const soldier = CHARACTER_SKINS.find((s) => s.id === 'soldier')!;
      expect(soldier.costGems).toBe(60);
      expect(soldier.speedBonus).toBe(0.15);

      const knight = CHARACTER_SKINS.find((s) => s.id === 'knight')!;
      expect(knight.costGems).toBe(100);
      expect(knight.jumpBonus).toBe(0.25);
      expect(knight.speedBonus).toBe(0.10);

      const ninja = CHARACTER_SKINS.find((s) => s.id === 'ninja')!;
      expect(ninja.costGems).toBe(150);
      expect(ninja.speedBonus).toBe(0.30);
      expect(ninja.waterGlide).toBe(true);
    });

    it('renders shop layout with currency HUD, skin card buttons, and live preview', () => {
      scene.create();

      expect(scene.skinCardButtons).toHaveLength(5);
      expect(scene.previewContainer).toBeDefined();
      expect(scene.previewSprite).toBeDefined();
      expect(scene.actionButton).toBeDefined();
      expect(scene.homeButton).toBeDefined();
      expect(scene.mapButton).toBeDefined();
    });

    it('updates live preview details when selecting different skin card', () => {
      scene.create();

      // Select Heroine (index 1)
      scene.selectSkin(1);

      expect(scene.selectedSkinIndex).toBe(1);
      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(scene.previewNameText?.text).toContain('女英雄');
      expect(scene.previewJumpText?.text).toContain('+10%');
    });

    it('shows equipped state for default Adventurer skin', () => {
      scene.create();
      scene.selectSkin(0);

      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
      expect(scene.actionButton?.isEnabled()).toBe(false);
    });

    it('shows purchase button with gem cost when skin is unowned and player has enough gems', () => {
      dataManager.addGems(50);
      scene.create();

      // Select Heroine (30 gems)
      scene.selectSkin(1);

      expect(scene.actionButton?.getText()).toBe('💎 30 購買解鎖');
      expect(scene.actionButton?.isEnabled()).toBe(true);
    });

    it('shows disabled purchase button when player has insufficient gems', () => {
      scene.create();

      // Select Ninja (150 gems, player has 0)
      scene.selectSkin(4);

      expect(scene.actionButton?.getText()).toBe('💎 150 寶石不足');
      expect(scene.actionButton?.isEnabled()).toBe(false);
    });

    it('successfully purchases and auto-equips skin when clicking action button', () => {
      dataManager.addGems(50);
      scene.create();

      scene.selectSkin(1); // Heroine (30 gems)
      scene.handleActionClick();

      expect(SoundManager.play).toHaveBeenCalledWith('victory');
      expect(dataManager.getProfile().ownedSkins).toContain('heroine');
      expect(dataManager.getProfile().equippedSkin).toBe('heroine');
      expect(dataManager.getProfile().gems).toBeGreaterThanOrEqual(20); // 50 - 30 + trophy bonuses
    });

    it('adds a small celebration burst to the wardrobe purchase success modal', () => {
      scene.create();
      (scene as any).showWardrobePurchaseSuccess(WARDROBE_ITEMS[0]);

      const content = (scene as any).purchaseModal.getContentContainer().list;
      expect(content.some((child: any) => Array.isArray(child.list) && child.list.length >= 3)).toBe(true);
      expect(content.some((child: any) => String(child.text ?? child.getText?.() ?? '').includes('已購買並穿上'))).toBe(true);
      expect(content.some((child: any) => child.getText?.() === '✅ 繼續探索')).toBe(true);
    });

    it('labels a selected ready outfit as try-on instead of implying ownership', () => {
      scene.create();
      scene.switchTab('wardrobe');
      scene.selectWardrobeItem(1); // Scholar Gown in the dress catalogue

      expect(scene.skinCardTextObjects[1]?.status.text).toContain('試穿中');
      expect(scene.skinCardTextObjects[1]?.status.text).not.toContain('已擁有');
      expect(scene.skinCardTextObjects[1]?.status.text).not.toContain('已穿戴');
    });

    it('does not let legacy base-frame cycling overwrite dedicated outfit run art', () => {
      scene.create();
      const previewSprite = scene.previewSprite!;
      (previewSprite.setTexture as any).mockClear();
      (scene as any).currentPose = 'walk';
      (scene as any).previewController = { lastRenderResult: { mode: 'fullSprite' } };

      (scene as any).cyclePreviewAnimation();

      expect((previewSprite.setTexture as any)).not.toHaveBeenCalled();
    });

    it('equips already owned skin when clicking action button', () => {
      dataManager.unlockSkin('soldier', 0);
      scene.create();

      scene.selectSkin(2); // Soldier
      expect(scene.actionButton?.getText()).toBe('👕 立即換裝');

      scene.handleActionClick();
      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(dataManager.getProfile().equippedSkin).toBe('soldier');
    });

    it('navigates back to TitleScene or MapScene', () => {
      scene.create();

      scene.homeButton?.emit('pointerup');
      expect(mock.scene.start).toHaveBeenCalledWith('TitleScene');

      scene.mapButton?.emit('pointerup');
      expect(mock.scene.start).toHaveBeenCalledWith('MapScene');
    });
  });

  // =========================================================================
  // 3. TrophyScene Tests
  // =========================================================================
  describe('TrophyScene — Hall of Fame, Categories & Pagination', () => {
    let scene: TrophyScene;
    let mock: any;

    beforeEach(() => {
      mock = createMockSceneForMeta('TrophyScene');
      scene = new TrophyScene();
      Object.assign(scene, mock);
    });

    it('defines 6 structured trophy categories matching specifications', () => {
      expect(TROPHY_CATEGORIES).toHaveLength(6);
      const keys = TROPHY_CATEGORIES.map((c) => c.key);
      expect(keys).toEqual(['consistency', 'chinese', 'math', 'english', 'adventure', 'wealth']);
    });

    it('renders trophy hall with category tabs, trophy cards, and pagination UI', () => {
      scene.create();

      expect(scene.categoryTabButtons).toHaveLength(6);
      expect(scene.cardsContainer).toBeDefined();
      expect(scene.totalTrophyText).toBeDefined();
      expect(scene.prevPageButton).toBeDefined();
      expect(scene.nextPageButton).toBeDefined();
      expect(scene.homeButton).toBeDefined();
    });

    it('filters trophies correctly when switching categories', () => {
      scene.create();

      expect(scene.selectedCategory).toBe('consistency');
      const consistencyTrophies = scene.getFilteredTrophies();
      expect(consistencyTrophies.length).toBeGreaterThan(10);

      // Switch to Chinese
      scene.switchCategory('chinese');
      expect(scene.selectedCategory).toBe('chinese');
      const chineseTrophies = scene.getFilteredTrophies();
      expect(chineseTrophies.every((t) => t.category === 'chinese')).toBe(true);

      // Switch to Math
      scene.switchCategory('math');
      expect(scene.selectedCategory).toBe('math');
      const mathTrophies = scene.getFilteredTrophies();
      expect(mathTrophies.every((t) => t.category === 'math')).toBe(true);
    });

    it('paginates 6 trophies per page and handles page switching', () => {
      scene.create();
      scene.switchCategory('chinese'); // 19 trophies -> 4 pages

      expect(scene.currentPage).toBe(0);
      expect(scene.pageIndicatorText?.text).toContain('第 1 /');

      // Next Page
      scene.nextPageButton?.emit('pointerup');
      expect(scene.currentPage).toBe(1);
      expect(scene.pageIndicatorText?.text).toContain('第 2 /');

      // Previous Page
      scene.prevPageButton?.emit('pointerup');
      expect(scene.currentPage).toBe(0);
    });

    it('calculates trophy progress accurately for various requirements', () => {
      const profile = dataManager.getProfile();
      profile.stats.chineseCorrect = 15;
      profile.stats.mathCorrect = 20;
      profile.stats.englishCorrect = 10;
      profile.stats.streakDays = 5;
      profile.unlockedStations = 4;
      profile.coins = 500;
      profile.gems = 30;

      // 1. Total questions
      const totalQ = TROPHY_DEFINITIONS.find((t) => t.id === 'total_questions_50')!;
      const progTotal = scene.calculateTrophyProgress(totalQ, profile);
      expect(progTotal.current).toBe(45); // 15 + 20 + 10
      expect(progTotal.target).toBe(50);

      // 2. Streak days
      const streakTrophy = TROPHY_DEFINITIONS.find((t) => t.id === 'streak_7_days')!;
      const progStreak = scene.calculateTrophyProgress(streakTrophy, profile);
      expect(progStreak.current).toBe(5);
      expect(progStreak.target).toBe(7);

      // 3. Subject correct count
      const mathTrophy = TROPHY_DEFINITIONS.find((t) => t.id === 'math_50')!;
      const progMath = scene.calculateTrophyProgress(mathTrophy, profile);
      expect(progMath.current).toBe(20);
      expect(progMath.target).toBe(50);

      // 4. Adventure unlocked station
      const advTrophy = TROPHY_DEFINITIONS.find((t) => t.id === 'adv_station_6')!;
      const progAdv = scene.calculateTrophyProgress(advTrophy, profile);
      expect(progAdv.current).toBe(4);
      expect(progAdv.target).toBe(6);

      // 5. Wealth gems
      const gemTrophy = TROPHY_DEFINITIONS.find((t) => t.id === 'wealth_gem_50')!;
      const progGem = scene.calculateTrophyProgress(gemTrophy, profile);
      expect(progGem.current).toBe(30);
      expect(progGem.target).toBe(50);
    });
  });

  // =========================================================================
  // 4. SettingsScene Tests
  // =========================================================================
  describe('SettingsScene — Subjects, Language, Difficulty & Reset Modal', () => {
    let scene: SettingsScene;
    let mock: any;

    beforeEach(() => {
      mock = createMockSceneForMeta('SettingsScene');
      scene = new SettingsScene();
      Object.assign(scene, mock);
    });

    it('renders all settings options including subject toggles, language, difficulty, and reset', () => {
      scene.create();

      expect(scene.chineseToggleBtn).toBeDefined();
      expect(scene.mathToggleBtn).toBeDefined();
      expect(scene.englishToggleBtn).toBeDefined();
      expect(scene.voiceButtons).toHaveLength(3);
      expect(scene.difficultyButtons).toHaveLength(4);
      expect(scene.volumeButtons).toHaveLength(3);
      expect(scene.resetButton).toBeDefined();
      expect(scene.homeButton).toBeDefined();
    });

    it('toggles individual subject on and off, updating DataManager', () => {
      scene.create();

      // Toggle Chinese OFF
      scene.toggleSubject('chineseEnabled');
      expect(dataManager.getProfile().settings.chineseEnabled).toBe(false);
      expect(scene.chineseToggleBtn?.getText()).toBe('📕 中文：關');

      // Toggle Chinese back ON
      scene.toggleSubject('chineseEnabled');
      expect(dataManager.getProfile().settings.chineseEnabled).toBe(true);
      expect(scene.chineseToggleBtn?.getText()).toBe('📕 中文：開');
    });

    it('prevents disabling all 3 subjects to guarantee at least 1 active subject', () => {
      scene.create();

      // Disable Chinese and Math
      scene.toggleSubject('chineseEnabled');
      scene.toggleSubject('mathEnabled');
      expect(dataManager.getProfile().settings.chineseEnabled).toBe(false);
      expect(dataManager.getProfile().settings.mathEnabled).toBe(false);
      expect(dataManager.getProfile().settings.englishEnabled).toBe(true);

      // Attempt to disable the last one (English)
      scene.toggleSubject('englishEnabled');

      // Should be rejected with error sound and English remains true
      expect(SoundManager.play).toHaveBeenCalledWith('wrong');
      expect(dataManager.getProfile().settings.englishEnabled).toBe(true);
    });

    it('selects voice language, updates DataManager, and tests speech synthesis', () => {
      scene.create();

      const speakSpy = vi.spyOn(SpeechService, 'speak');

      // Select English
      scene.selectVoiceLanguage('en-US', 'Hello!');
      expect(dataManager.getProfile().settings.voiceLanguage).toBe('en-US');
      expect(speakSpy).toHaveBeenCalledWith('Hello!', 'en-US');

      // Select Cantonese
      scene.selectVoiceLanguage('zh-HK');
      expect(dataManager.getProfile().settings.voiceLanguage).toBe('zh-HK');
    });

    it('selects difficulty levels 1 to 4 and updates descriptions', () => {
      scene.create();

      expect(DIFFICULTY_OPTIONS).toHaveLength(4);

      // Select Level 3
      scene.selectDifficulty(3);
      expect(dataManager.getProfile().settings.difficulty).toBe(3);
      expect(scene.difficultyDescText?.text).toContain('高級 (進階)');

      // Select Level 4
      scene.selectDifficulty(4);
      expect(dataManager.getProfile().settings.difficulty).toBe(4);
      expect(scene.difficultyDescText?.text).toContain('挑戰級');
    });

    it('sets audio volume level and triggers test audio chime', () => {
      scene.create();

      const setVolSpy = vi.spyOn(SoundManager, 'setVolume');
      scene.setVolumeLevel(0.5);
      expect(setVolSpy).toHaveBeenCalledWith(0.5);

      scene.testAudioButton?.emit('pointerup');
      expect(SoundManager.play).toHaveBeenCalledWith('coin');
    });

    it('opens confirmation modal when clicking reset button', () => {
      scene.create();

      scene.resetButton?.emit('pointerup');
      expect(scene.confirmResetModal).not.toBeNull();
      expect(scene.confirmResetModal?.isOpen()).toBe(true);
      expect(scene.confirmResetModal?.getTitle()).toContain('確認重設');
    });

    it('executes full progress reset when confirmed in modal', () => {
      // Modify save data
      dataManager.addCoins(500);
      dataManager.addGems(50);
      dataManager.setStationStars(2, 3);
      expect(dataManager.getProfile().coins).toBe(500);

      scene.create();
      scene.executeDataReset();

      expect(SoundManager.play).toHaveBeenCalledWith('victory');
      expect(dataManager.getProfile().coins).toBe(0);
      expect(dataManager.getProfile().gems).toBe(0);
      expect(dataManager.getProfile().unlockedStations).toBe(1);
      expect(mock.scene.restart).toHaveBeenCalled();
    });
  });
});
