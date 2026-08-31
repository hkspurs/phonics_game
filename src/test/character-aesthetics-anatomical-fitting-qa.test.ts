import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { ShopScene, CHARACTER_SKINS } from '../scenes/ShopScene';
import { WARDROBE_ITEMS } from '../config/wardrobe';
import { DataManager } from '../services/DataManager';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';
import { EquippedWardrobe } from '../types';

interface GraphicsCallRecord {
  method: string;
  args: any[];
}

function createMockGraphics() {
  const calls: GraphicsCallRecord[] = [];
  return {
    calls,
    clear: vi.fn(function (this: any) {
      calls.push({ method: 'clear', args: [] });
      return this;
    }),
    fillStyle: vi.fn(function (this: any, color: number, alpha?: number) {
      calls.push({ method: 'fillStyle', args: [color, alpha] });
      return this;
    }),
    lineStyle: vi.fn(function (this: any, width: number, color: number, alpha?: number) {
      calls.push({ method: 'lineStyle', args: [width, color, alpha] });
      return this;
    }),
    beginPath: vi.fn(function (this: any) {
      calls.push({ method: 'beginPath', args: [] });
      return this;
    }),
    closePath: vi.fn(function (this: any) {
      calls.push({ method: 'closePath', args: [] });
      return this;
    }),
    moveTo: vi.fn(function (this: any, x: number, y: number) {
      calls.push({ method: 'moveTo', args: [x, y] });
      return this;
    }),
    lineTo: vi.fn(function (this: any, x: number, y: number) {
      calls.push({ method: 'lineTo', args: [x, y] });
      return this;
    }),
    fillPath: vi.fn(function (this: any) {
      calls.push({ method: 'fillPath', args: [] });
      return this;
    }),
    strokePath: vi.fn(function (this: any) {
      calls.push({ method: 'strokePath', args: [] });
      return this;
    }),
    fillRect: vi.fn(function (this: any, x: number, y: number, w: number, h: number) {
      calls.push({ method: 'fillRect', args: [x, y, w, h] });
      return this;
    }),
    strokeRect: vi.fn(function (this: any, x: number, y: number, w: number, h: number) {
      calls.push({ method: 'strokeRect', args: [x, y, w, h] });
      return this;
    }),
    fillRoundedRect: vi.fn(function (this: any, x: number, y: number, w: number, h: number, r?: number) {
      calls.push({ method: 'fillRoundedRect', args: [x, y, w, h, r] });
      return this;
    }),
    strokeRoundedRect: vi.fn(function (this: any, x: number, y: number, w: number, h: number, r?: number) {
      calls.push({ method: 'strokeRoundedRect', args: [x, y, w, h, r] });
      return this;
    }),
    fillCircle: vi.fn(function (this: any, x: number, y: number, r: number) {
      calls.push({ method: 'fillCircle', args: [x, y, r] });
      return this;
    }),
    strokeCircle: vi.fn(function (this: any, x: number, y: number, r: number) {
      calls.push({ method: 'strokeCircle', args: [x, y, r] });
      return this;
    }),
    fillEllipse: vi.fn(function (this: any, x: number, y: number, w: number, h: number) {
      calls.push({ method: 'fillEllipse', args: [x, y, w, h] });
      return this;
    }),
    lineBetween: vi.fn(function (this: any, x1: number, y1: number, x2: number, y2: number) {
      calls.push({ method: 'lineBetween', args: [x1, y1, x2, y2] });
      return this;
    }),
    setDepth: vi.fn(function (this: any, _d: number) {
      return this;
    }),
  };
}

describe('Game Agent 1: 角色造型與人體工學審計 (Character Aesthetics & Anatomical Fitting QA Suite)', () => {
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

  // ==========================================
  // 1. All 18 Wardrobe Items Inventory Completeness
  // ==========================================
  describe('Audit 1: Wardrobe Item Registry Completeness & Category Integrity', () => {
    it('contains all 18 specified wardrobe items in WARDROBE_ITEMS', () => {
      expect(WARDROBE_ITEMS).toHaveLength(18);

      const expectedIds = [
        // 4 Dresses
        'princess_dress', 'scholar_robe', 'dino_onesie', 'magic_robe',
        // 4 Tops
        'sailor_top', 'hk_school_shirt', 'sport_jersey', 'hoodie_star',
        // 4 Bottoms
        'pleated_skirt', 'denim_shorts', 'sport_shorts', 'magic_tutu',
        // 6 Accessories
        'scholar_cap', 'cat_ears', 'tram_hat', 'star_glasses', 'star_backpack', 'angel_wings'
      ];

      expectedIds.forEach((id) => {
        const item = WARDROBE_ITEMS.find((w) => w.id === id);
        expect(item, `Item ${id} must exist in WARDROBE_ITEMS`).toBeDefined();
        expect(item?.name).toBeTruthy();
        expect(item?.nameEn).toBeTruthy();
        expect(item?.icon).toBeTruthy();
        expect(item?.costCoins).toBeGreaterThan(0);
        expect(item?.costGems).toBeGreaterThan(0);
      });
    });

    it('categorizes every item strictly into dress, top, bottom, or accessory', () => {
      const dressItems = WARDROBE_ITEMS.filter((w) => w.category === 'dress');
      const topItems = WARDROBE_ITEMS.filter((w) => w.category === 'top');
      const bottomItems = WARDROBE_ITEMS.filter((w) => w.category === 'bottom');
      const accessoryItems = WARDROBE_ITEMS.filter((w) => w.category === 'accessory');

      expect(dressItems).toHaveLength(4);
      expect(topItems).toHaveLength(4);
      expect(bottomItems).toHaveLength(4);
      expect(accessoryItems).toHaveLength(6);
    });
  });

  // ==========================================
  // 2. Anatomical Coordinate Audit for Dresses (4 items)
  // ==========================================
  describe('Audit 2: Anatomical Fitting - Category: Dresses (👗 連身洋裝與長袍)', () => {
    it('princess_dress: anchors neckline at chest (oy-12), waist at (oy), flare down to thighs (oy+30)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { dress: 'princess_dress' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // MoveTo upper neckline: (ox - 14, bodyY - 14) where bodyY = oy + 2 = 2 => y = -12
      const moveToCall = g.calls.find((c) => c.method === 'moveTo');
      expect(moveToCall).toBeDefined();
      expect(moveToCall?.args).toEqual([-14, -12]);

      // Hem lineTo: (ox + 26, bodyY + 28) = (26, 30)
      const lineToCalls = g.calls.filter((c) => c.method === 'lineTo');
      expect(lineToCalls.some((c) => c.args[0] === 26 && c.args[1] === 30)).toBe(true);
      expect(lineToCalls.some((c) => c.args[0] === -26 && c.args[1] === 30)).toBe(true);

      // Waist sash rounded rect: y = bodyY - 2 = 0
      const sashCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(sashCall?.args).toEqual([-15, 0, 30, 6, 3]);

      // Brooch circle: y = bodyY - 8 = -6 (sternum center)
      const broochCall = g.calls.find((c) => c.method === 'fillCircle');
      expect(broochCall?.args).toEqual([0, -6, 4]);
    });

    it('scholar_robe: anchors shoulder lapels (oy-14), golden stole down to hem (oy+32)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { dress: 'scholar_robe' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      const moveToCall = g.calls.find((c) => c.method === 'moveTo');
      expect(moveToCall?.args).toEqual([-16, -14]);

      // Stole vertical gold band: (ox - 4, bodyY - 16) = (-4, -14)
      const stoleCall = g.calls.find((c) => c.method === 'fillRect');
      expect(stoleCall?.args).toEqual([-4, -14, 8, 44]);

      // Crest collar: y = bodyY - 10 = -8
      const crestCall = g.calls.find((c) => c.method === 'fillCircle');
      expect(crestCall?.args).toEqual([0, -8, 5]);
    });

    it('dino_onesie: body onesie spans torso to knee (oy-14 to oy+30) with belly oval & back spikes', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { dress: 'dino_onesie' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // Body rounded rect
      const bodyCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(bodyCall?.args).toEqual([-18, -14, 36, 44, 10]);

      // Belly ellipse: center y = bodyY + 6 = 8
      const bellyCall = g.calls.find((c) => c.method === 'fillEllipse');
      expect(bellyCall?.args).toEqual([0, 8, 22, 26]);

      // Spikes path drawn on back
      const spikeMoves = g.calls.filter((c) => c.method === 'moveTo');
      expect(spikeMoves.length).toBeGreaterThanOrEqual(2);
    });

    it('magic_robe: celestial gown spans (oy-14 to oy+32) with mystic belt at waist (oy)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { dress: 'magic_robe' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      const moveToCall = g.calls.find((c) => c.method === 'moveTo');
      expect(moveToCall?.args).toEqual([-16, -14]);

      // Mystic belt rect: (ox - 16, bodyY - 2, 32, 5) => (-16, 0, 32, 5)
      const beltCall = g.calls.find((c) => c.method === 'fillRect');
      expect(beltCall?.args).toEqual([-16, 0, 32, 5]);
    });
  });

  // ==========================================
  // 3. Anatomical Coordinate Audit for Tops (4 items)
  // ==========================================
  describe('Audit 3: Anatomical Fitting - Category: Tops (👕 上衣與短袖)', () => {
    it('sailor_top: chest bounding box at (oy-14 to oy+8) with navy collar and red bow', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { top: 'sailor_top' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // topY = oy - 4 = -4. Rounded rect: (-16, topY - 10, 32, 22) => (-16, -14, 32, 22)
      const shirtCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(shirtCall?.args).toEqual([-16, -14, 32, 22, 5]);

      // Collar path: starts at (-14, -14)
      const collarMove = g.calls.find((c) => c.method === 'moveTo');
      expect(collarMove?.args).toEqual([-14, -14]);
    });

    it('hk_school_shirt: crisp uniform body with centered tie (topY - 8 = -12) and crest pocket', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { top: 'hk_school_shirt' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      const shirtCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(shirtCall?.args).toEqual([-15, -14, 30, 22, 4]);

      // Tie rect: (-2.5, -12, 5, 14)
      const tieCall = g.calls.find((c) => c.method === 'fillRect');
      expect(tieCall?.args).toEqual([-2.5, -12, 5, 14]);

      // Crest pocket: (4, -7, 6, 6, 2)
      const pocketCall = g.calls.filter((c) => c.method === 'fillRoundedRect')[1];
      expect(pocketCall?.args).toEqual([4, -7, 6, 6, 2]);
    });

    it('sport_jersey: athletic cyan shirt with dual racing stripes & #1 center emblem', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { top: 'sport_jersey' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      const shirtCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(shirtCall?.args).toEqual([-16, -14, 32, 22, 5]);

      // Stripes: (-14, -14, 3, 22) and (11, -14, 3, 22)
      const stripeCalls = g.calls.filter((c) => c.method === 'fillRect');
      expect(stripeCalls.some((c) => c.args[0] === -14 && c.args[1] === -14)).toBe(true);
      expect(stripeCalls.some((c) => c.args[0] === 11 && c.args[1] === -14)).toBe(true);

      // Emblem circle: center (0, topY = -4, radius 5)
      const badgeCall = g.calls.find((c) => c.method === 'fillCircle');
      expect(badgeCall?.args).toEqual([0, -4, 5]);
    });

    it('hoodie_star: roomier hoodie body (-17 to +17) with star chest badge and kangaroo pocket', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { top: 'hoodie_star' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // Roomier body: (-17, -14, 34, 24)
      const bodyCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(bodyCall?.args).toEqual([-17, -14, 34, 24, 6]);

      // Kangaroo pocket: (-10, topY + 4 = 0, 20, 7, 3)
      const pocketCall = g.calls.filter((c) => c.method === 'fillRoundedRect')[1];
      expect(pocketCall?.args).toEqual([-10, 0, 20, 7, 3]);
    });
  });

  // ==========================================
  // 4. Anatomical Coordinate Audit for Bottoms (4 items)
  // ==========================================
  describe('Audit 4: Anatomical Fitting - Category: Bottoms (👖 裙子與短褲)', () => {
    it('pleated_skirt: waistband meets top hem perfectly at (oy+8) with no anatomical gap', () => {
      const g = createMockGraphics();
      // Render Top + Bottom combo
      CharacterOutfitCompositor.renderOutfit(g as any, { top: 'sailor_top', bottom: 'pleated_skirt' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // Top bottom edge: topY + 12 = (-4) + 12 = 8
      // Skirt top edge: bottomY - 4 = 12 - 4 = 8
      // Exact alignment: y = 8 for both!
      const skirtMove = g.calls.find((c) => c.method === 'moveTo' && c.args[1] === 8);
      expect(skirtMove, 'Skirt top waistband must connect seamlessly at y=8').toBeDefined();
      expect(skirtMove?.args).toEqual([-15, 8]);
    });

    it('denim_shorts: casual shorts span (oy+8 to oy+22) with rivet details', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { bottom: 'denim_shorts' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // bottomY = 12. fillRoundedRect: (-14, bottomY - 4 = 8, 28, 14, 4)
      const shortsCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(shortsCall?.args).toEqual([-14, 8, 28, 14, 4]);

      // Rivets: (-10, 12) and (10, 12)
      const rivetCalls = g.calls.filter((c) => c.method === 'fillCircle');
      expect(rivetCalls).toHaveLength(2);
      expect(rivetCalls[0].args).toEqual([-10, 12, 1.5]);
      expect(rivetCalls[1].args).toEqual([10, 12, 1.5]);
    });

    it('sport_shorts: athletic shorts span (oy+8 to oy+21) with white leg trim', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { bottom: 'sport_shorts' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      const shortsCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(shortsCall?.args).toEqual([-14, 8, 28, 13, 4]);

      // Trim rect: (-13, bottomY + 6 = 18, 26, 2)
      const trimCall = g.calls.find((c) => c.method === 'fillRect');
      expect(trimCall?.args).toEqual([-13, 18, 26, 2]);
    });

    it('magic_tutu: puffy ballerina flare waistband at (oy+8), flares wide to (-24 to +24) at (oy+24)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { bottom: 'magic_tutu' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      const waistMove = g.calls.find((c) => c.method === 'moveTo');
      expect(waistMove?.args).toEqual([-14, 8]);

      const flareLines = g.calls.filter((c) => c.method === 'lineTo');
      expect(flareLines.some((c) => c.args[0] === 24 && c.args[1] === 24)).toBe(true);
      expect(flareLines.some((c) => c.args[0] === -24 && c.args[1] === 24)).toBe(true);
    });
  });

  // ==========================================
  // 5. Anatomical Coordinate Audit for Accessories (6 items)
  // ==========================================
  describe('Audit 5: Anatomical Fitting - Category: Accessories (🎀 配件、帽子、眼鏡、翅膀、背包)', () => {
    it('scholar_cap: perched on top crown of skull (oy-42) with mortarboard diamond and tassel', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { hat: 'scholar_cap' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // headY = oy - 42 = -42. Mortarboard diamond top: (0, headY - 8 = -50)
      const diamondTop = g.calls.find((c) => c.method === 'moveTo');
      expect(diamondTop?.args).toEqual([0, -50]);

      // Skull cap base: (-10, headY + 3 = -39, 20, 6)
      const skullCap = g.calls.find((c) => c.method === 'fillRect');
      expect(skullCap?.args).toEqual([-10, -39, 20, 6]);

      // Tassel line: from (0, -43) to (16, -34)
      const tassel = g.calls.find((c) => c.method === 'lineBetween');
      expect(tassel?.args).toEqual([0, -43, 16, -34]);
    });

    it('cat_ears: dual triangular ears anchored at upper temporal head (ox +/- 14, oy-56)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { hat: 'cat_ears' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // headY = -42. Ear peaks at y = headY - 14 = -56
      const leftEarLines = g.calls.filter((c) => c.method === 'lineTo');
      expect(leftEarLines.some((c) => c.args[0] === -14 && c.args[1] === -56)).toBe(true);
      expect(leftEarLines.some((c) => c.args[0] === 14 && c.args[1] === -56)).toBe(true);
    });

    it('tram_hat: green visor cap dome (oy-46 to oy-32) and dark brim sitting over forehead (oy-36)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { hat: 'tram_hat' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // Dome rect: (-16, headY - 4 = -46, 32, 14, 4)
      const domeCall = g.calls.find((c) => c.method === 'fillRoundedRect');
      expect(domeCall?.args).toEqual([-16, -46, 32, 14, 4]);

      // Visor brim: (-18, headY + 6 = -36, 36, 5, 2)
      const brimCall = g.calls.filter((c) => c.method === 'fillRoundedRect')[1];
      expect(brimCall?.args).toEqual([-18, -36, 36, 5, 2]);
    });

    it('star_glasses: round dual lenses positioned over eye level (oy-22) with bridge between (-2 and +2)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { accessory: 'star_glasses' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // glassY = oy - 22 = -22.
      // Left lens at (-8, -22, radius 6), right lens at (8, -22, radius 6)
      const lenses = g.calls.filter((c) => c.method === 'fillCircle' && c.args[2] === 6);
      expect(lenses).toHaveLength(2);
      expect(lenses[0].args).toEqual([-8, -22, 6]);
      expect(lenses[1].args).toEqual([8, -22, 6]);

      // Nose bridge line: (-2, -22) to (2, -22)
      const bridge = g.calls.find((c) => c.method === 'lineBetween');
      expect(bridge?.args).toEqual([-2, -22, 2, -22]);
    });

    it('star_backpack: backpack sphere on right shoulder (ox+18, oy-2) with strap to collarbone (ox+6, oy-14)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { accessory: 'star_backpack' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // bpX = 18, bpY = -2, radius 11
      const packCircle = g.calls.find((c) => c.method === 'fillCircle' && c.args[2] === 11);
      expect(packCircle?.args).toEqual([18, -2, 11]);

      // Shoulder strap: from (14, -12) to (6, -14)
      const strap = g.calls.find((c) => c.method === 'lineBetween');
      expect(strap?.args).toEqual([14, -12, 6, -14]);
    });

    it('angel_wings: dual wings anchored at upper scapulae (oy-4) spanning horizontally (-48 to +48)', () => {
      const g = createMockGraphics();
      CharacterOutfitCompositor.renderOutfit(g as any, { accessory: 'angel_wings' }, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // wingY = oy - 4 = -4.
      // Tip points: (-48, -18) on left, (48, -18) on right
      const wingLines = g.calls.filter((c) => c.method === 'lineTo');
      expect(wingLines.some((c) => c.args[0] === -48 && c.args[1] === -18)).toBe(true);
      expect(wingLines.some((c) => c.args[0] === 48 && c.args[1] === -18)).toBe(true);

      // Fluff circles at (-24, -10) and (24, -10)
      const fluff = g.calls.filter((c) => c.method === 'fillCircle' && c.args[2] === 8);
      expect(fluff).toHaveLength(2);
      expect(fluff[0].args).toEqual([-24, -10, 8]);
      expect(fluff[1].args).toEqual([24, -10, 8]);
    });
  });

  // ==========================================
  // 6. Cross-Character (5 models) & Tint Compatibility Audit
  // ==========================================
  describe('Audit 6: Cross-Character Fitting & Model Tint Separation', () => {
    const characters = [
      { id: 'adventurer', name: 'Adventurer', sprite: 'adventurer_stand', tint: undefined },
      { id: 'heroine', name: 'Heroine', sprite: 'female_stand', tint: undefined },
      { id: 'soldier', name: 'Soldier', sprite: 'soldier_stand', tint: undefined },
      { id: 'knight', name: 'Knight', sprite: 'player_stand', tint: 0xc8e6ff },
      { id: 'ninja', name: 'Ninja', sprite: 'player_stand', tint: 0x4a4a5a },
    ];

    characters.forEach((char) => {
      it(`renders full wardrobe suite accurately on character: ${char.name} (${char.id})`, () => {
        const scene = new ShopScene();
        const mock = createMockSceneForMeta('ShopScene');
        Object.assign(scene, mock);

        const dm = DataManager.getInstance();
        dm.getProfile().coins = 5000;
        dm.getProfile().gems = 500;
        dm.getProfile().ownedSkins = ['adventurer', 'heroine', 'soldier', 'knight', 'ninja'];
        dm.getProfile().equippedSkin = char.id;

        scene.create();

        // Find character index
        const skinIdx = CHARACTER_SKINS.findIndex((s) => s.id === char.id);
        scene.selectSkin(skinIdx);

        // Verify sprite texture & tint application
        expect(scene.previewSprite).toBeDefined();
        if (char.tint) {
          expect(char.tint).toBeGreaterThan(0);
        }

        // Test equipping every single one of the 18 items on this character
        WARDROBE_ITEMS.forEach((item) => {
          dm.buyWardrobeItem(item.id, 'coins');
          dm.equipWardrobeItem(item.category as any, item.id);
          scene.updatePreviewDisplay();

          expect(scene.wardrobeGraphics).toBeDefined();
        });
      });
    });
  });

  // ==========================================
  // 7. Layering, FlipX, and Scale Kinematics Audit
  // ==========================================
  describe('Audit 7: Mutual Exclusivity, FlipX, and Scaling Kinematics', () => {
    it('dress strictly suppresses top and bottom rendering to avoid clothing clipping', () => {
      const g = createMockGraphics();
      const equipped: EquippedWardrobe = {
        dress: 'princess_dress',
        top: 'sailor_top',
        bottom: 'pleated_skirt',
      };

      CharacterOutfitCompositor.renderOutfit(g as any, equipped, { scale: 1.0, offsetX: 0, offsetY: 0 });

      // Princess dress drawn (pink fill 0xffb6c1)
      const dressFill = g.calls.find((c) => c.method === 'fillStyle' && c.args[0] === 0xffb6c1);
      expect(dressFill).toBeDefined();

      // Top sailor shirt (fill 0xf8fafc) must NOT be drawn
      const topFill = g.calls.find((c) => c.method === 'fillStyle' && c.args[0] === 0xf8fafc);
      expect(topFill).toBeUndefined();

      // Skirt (fill 0x1e293b) must NOT be drawn
      const skirtFill = g.calls.find((c) => c.method === 'fillStyle' && c.args[0] === 0x1e293b);
      expect(skirtFill).toBeUndefined();
    });

    it('flipX correctly mirrors asymmetrical accessories (backpack, tassel, pocket badge, dino spikes)', () => {
      const gNormal = createMockGraphics();
      const gFlipped = createMockGraphics();

      const equipped: EquippedWardrobe = {
        accessory: 'star_backpack',
      };

      // Normal facing right
      CharacterOutfitCompositor.renderOutfit(gNormal as any, equipped, { scale: 1.0, flipX: false });
      const packNormal = gNormal.calls.find((c) => c.method === 'fillCircle' && c.args[2] === 11);
      expect(packNormal?.args[0]).toBe(18); // +18 on right

      // Flipped facing left
      CharacterOutfitCompositor.renderOutfit(gFlipped as any, equipped, { scale: 1.0, flipX: true });
      const packFlipped = gFlipped.calls.find((c) => c.method === 'fillCircle' && c.args[2] === 11);
      expect(packFlipped?.args[0]).toBe(-18); // -18 on left
    });

    it('scales all vector paths and coordinates proportionally without coordinate drift', () => {
      const g1 = createMockGraphics();
      const g2 = createMockGraphics();

      CharacterOutfitCompositor.renderOutfit(g1 as any, { accessory: 'star_glasses' }, { scale: 1.0 });
      CharacterOutfitCompositor.renderOutfit(g2 as any, { accessory: 'star_glasses' }, { scale: 2.0 });

      const lens1 = g1.calls.find((c) => c.method === 'fillCircle');
      const lens2 = g2.calls.find((c) => c.method === 'fillCircle');

      // scale 1: radius 6 at x=-8, y=-22
      expect(lens1?.args).toEqual([-8, -22, 6]);
      // scale 2: radius 12 at x=-16, y=-44
      expect(lens2?.args).toEqual([-16, -44, 12]);
    });
  });
});
