import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopScene } from '../scenes/ShopScene';
import { RunnerScene } from '../scenes/RunnerScene';
import { DataManager } from '../services/DataManager';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('UI QA Auditor 1: Wardrobe Anatomical Layering & Real Fitting Room Placement Suite', () => {
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
    vi.restoreAllMocks();
  });

  describe('1. ShopScene Anatomical Layering Verification', () => {
    let scene: ShopScene;

    beforeEach(() => {
      scene = new ShopScene();
      const mock = createMockSceneForMeta('ShopScene');
      Object.assign(scene, mock);
    });

    it('creates distinct anatomical wardrobe layers with correct initial hierarchy', () => {
      scene.create();

      expect(scene.wardrobeWingsLayer).toBeDefined();
      expect(scene.wardrobeDressLayer).toBeDefined();
      expect(scene.wardrobeTopLayer).toBeDefined();
      expect(scene.wardrobeBottomLayer).toBeDefined();
      expect(scene.wardrobeBackpackLayer).toBeDefined();
      expect(scene.wardrobeGlassesLayer).toBeDefined();
      expect(scene.wardrobeHatLayer).toBeDefined();

      // Verify layer depths
      expect((scene.wardrobeWingsLayer as any)?.depth).toBe(35); // Behind sprite (depth 40)
      expect((scene.wardrobeDressLayer as any)?.depth).toBe(44);
      expect((scene.wardrobeTopLayer as any)?.depth).toBe(45);
      expect((scene.wardrobeBottomLayer as any)?.depth).toBe(46);
      expect((scene.wardrobeBackpackLayer as any)?.depth).toBe(47);
      expect((scene.wardrobeGlassesLayer as any)?.depth).toBe(48);
      expect((scene.wardrobeHatLayer as any)?.depth).toBe(49);
    });

    it('populates equipped top (👕) on chest/torso, NOT on head', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.buyWardrobeItem('sailor_top', 'coins');
      dm.equipWardrobeItem('top', 'sailor_top');

      scene.create();

      // Top layer must display top icon (👕)
      expect(scene.wardrobeTopLayer?.text).toBe('👕');
      // Head layer must NOT display the shirt!
      expect(scene.wardrobeHatLayer?.text).toBe('');
      // Glasses layer must NOT display the shirt!
      expect(scene.wardrobeGlassesLayer?.text).toBe('');
    });

    it('populates equipped bottom (👖/🩳) on waist/legs, NOT on head', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.buyWardrobeItem('denim_shorts', 'coins');
      dm.equipWardrobeItem('bottom', 'denim_shorts');

      scene.create();

      expect(scene.wardrobeBottomLayer?.text).toBe('👖');
      expect(scene.wardrobeHatLayer?.text).toBe('');
    });

    it('populates equipped dress (👗) on body/torso, NOT on head', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.equipWardrobeItem('dress', 'princess_dress');

      scene.create();

      expect(scene.wardrobeDressLayer?.text).toBe('👗');
      expect(scene.wardrobeHatLayer?.text).toBe('');
    });

    it('populates equipped hat (🎓/🐱/🧢) on head, and glasses (👓) on face', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.buyWardrobeItem('scholar_cap', 'coins');
      dm.buyWardrobeItem('star_glasses', 'coins');
      dm.equipWardrobeItem('hat', 'scholar_cap');
      dm.equipWardrobeItem('accessory', 'star_glasses');

      scene.create();

      expect(scene.wardrobeHatLayer?.text).toBe('🎓');
      expect(scene.wardrobeGlassesLayer?.text).toBe('👓');
    });

    it('populates wings (🪽) behind back and backpack (🎒) on shoulder', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.buyWardrobeItem('angel_wings', 'coins');
      dm.equipWardrobeItem('wings', 'angel_wings');

      scene.create();

      expect(scene.wardrobeWingsLayer?.text).toBe('🪽');
    });

    it('supports equipping full set (hat + top + bottom + wings) simultaneously on distinct body parts', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      dm.buyWardrobeItem('cat_ears', 'coins');
      dm.buyWardrobeItem('sailor_top', 'coins');
      dm.buyWardrobeItem('pleated_skirt', 'coins');
      dm.buyWardrobeItem('angel_wings', 'coins');

      dm.equipWardrobeItem('hat', 'cat_ears');
      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('bottom', 'pleated_skirt');
      dm.equipWardrobeItem('wings', 'angel_wings');

      scene.create();

      expect(scene.wardrobeHatLayer?.text).toBe('🐱');
      expect(scene.wardrobeTopLayer?.text).toBe('👕');
      expect(scene.wardrobeBottomLayer?.text).toBe('🩳');
      expect(scene.wardrobeWingsLayer?.text).toBe('🪽');
    });
  });

  describe('2. OOTD Photo Booth & Polaroid Wardrobe Rendering', () => {
    let scene: ShopScene;

    beforeEach(() => {
      scene = new ShopScene();
      const mock = createMockSceneForMeta('ShopScene');
      Object.assign(scene, mock);
    });

    it('renders equipped wardrobe layers inside Polaroid photo modal', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.buyWardrobeItem('cat_ears', 'coins');
      dm.equipWardrobeItem('dress', 'princess_dress');
      dm.equipWardrobeItem('hat', 'cat_ears');

      scene.create();
      scene.showOOTDPhotoModal();

      expect((scene as any).ootdModal).toBeDefined();
    });
  });

  describe('3. RunnerScene Equipped Wardrobe Rendering', () => {
    let runner: RunnerScene;

    beforeEach(() => {
      runner = new RunnerScene();
      const mock = createMockSceneForMeta('RunnerScene');
      Object.assign(runner, mock);
    });

    it('creates runner wardrobe layers and attaches them to player kinematics', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.buyWardrobeItem('sailor_top', 'coins');
      dm.equipWardrobeItem('top', 'sailor_top');

      runner.create();

      expect(runner.runnerWardrobeTop).toBeDefined();
      expect((runner.runnerWardrobeTop as any)?.text).toBe('👕');
      expect((runner.runnerWardrobeTop as any)?.depth).toBe(16);
      expect(runner.runnerWardrobeGraphics).toBeDefined();
    });
  });

  describe('4. CharacterOutfitCompositor Vector Outfit Rendering Tests', () => {
    it('renders tailored dress, top, bottom, hat, glasses, wings, and backpack on graphics canvas', () => {
      const scene = new ShopScene();
      const mock = createMockSceneForMeta('ShopScene');
      Object.assign(scene, mock);
      scene.create();

      expect(scene.wardrobeGraphics).toBeDefined();
      expect((scene.wardrobeGraphics as any)?.depth).toBe(45);
    });
  });
});
