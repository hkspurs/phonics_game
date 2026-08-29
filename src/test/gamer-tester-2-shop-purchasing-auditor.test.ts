import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { ShopScene } from '../scenes/ShopScene';
import { WARDROBE_ITEMS } from '../config/wardrobe';
import { EquippedWardrobe } from '../types';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Gamer Tester 2: Shop Gem/Coin Skin & Wardrobe Purchasing Auditor Suite', () => {
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

  // Helper to create a mocked ShopScene for testing UI interactions
  function createMockShopScene(tab: 'skins' | 'wardrobe' | 'pets' | 'gadgets' = 'skins', selectedIdx: number = 0) {
    const mock = createMockSceneForMeta('ShopScene');
    const scene = new ShopScene();
    Object.assign(scene, mock);

    scene.currentTab = tab;
    scene.selectedSkinIndex = selectedIdx;
    scene.selectedWardrobeIndex = selectedIdx;

    const mockTextObj = (txt: string = '') => ({
      text: txt,
      setText: vi.fn(function (this: any, t: string) {
        this.text = t;
        return this;
      }),
      setColor: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
    });

    const mockButton = (initialText: string = '', initialColor: string = 'grey') => ({
      text: initialText,
      color: initialColor,
      enabled: true,
      depth: 0,
      getText: function (this: any) {
        return this.text;
      },
      setText: vi.fn(function (this: any, t: string) {
        this.text = t;
        return this;
      }),
      setColor: vi.fn(function (this: any, c: string) {
        this.color = c;
        return this;
      }),
      setEnabled: vi.fn(function (this: any, e: boolean) {
        this.enabled = e;
        return this;
      }),
      setDepth: vi.fn(function (this: any, d: number) {
        this.depth = d;
        return this;
      }),
    });

    scene.coinText = mockTextObj('🪙 0') as any;
    scene.gemText = mockTextObj('💎 0') as any;
    scene.starText = mockTextObj('⭐ 0') as any;

    scene.previewNameText = mockTextObj() as any;
    scene.previewDescText = mockTextObj() as any;
    scene.previewSpeedText = mockTextObj() as any;
    scene.previewJumpText = mockTextObj() as any;
    scene.previewSpecialText = mockTextObj() as any;
    scene.previewWardrobeOverlay = mockTextObj() as any;
    scene.wardrobeHatLayer = mockTextObj() as any;
    scene.wardrobeGlassesLayer = mockTextObj() as any;
    scene.wardrobeTopLayer = mockTextObj() as any;
    scene.wardrobeBottomLayer = mockTextObj() as any;
    scene.wardrobeDressLayer = mockTextObj() as any;
    scene.wardrobeWingsLayer = mockTextObj() as any;
    scene.wardrobeBackpackLayer = mockTextObj() as any;

    scene.previewSprite = {
      setTexture: vi.fn(),
      clearTint: vi.fn(),
      setTint: vi.fn(),
    } as any;

    scene.actionButton = mockButton('👕 立即換裝', 'green') as any;

    scene.skinCardButtons = scene.skins.map((_, i) =>
      mockButton(scene.skins[i].name, i === selectedIdx ? 'yellow' : 'grey') as any
    );

    scene.skinCardTextObjects = scene.skins.map((s) => ({
      name: mockTextObj(s.name) as any,
      perk: mockTextObj(s.perkDescription) as any,
      status: mockTextObj(`💎 ${s.costGems}`) as any,
    }));

    return scene;
  }

  // =========================================================================
  // 1. ALL 5 SKINS: EXACT & SURPLUS GEMS & COINS PURCHASING AUDIT
  // =========================================================================
  describe('1. Character Skins: Exact & Surplus Currency Deductions (All 5 Skins)', () => {
    it('Skin 1: Adventurer (Default 0💎 / 0🪙) is unlocked by default with 0 currency spent', () => {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();

      expect(profile.ownedSkins).toEqual(['adventurer']);
      expect(profile.equippedSkin).toBe('adventurer');
      expect(profile.gems).toBe(0);
      expect(profile.coins).toBe(0);

      // Re-unlock attempt is a no-op
      expect(dm.unlockSkin('adventurer', 0, 0)).toBe(true);
      expect(profile.gems).toBe(0);
      expect(profile.coins).toBe(0);
    });

    it('Skin 2: Heroine (30💎 / 300🪙) - Exact 30 Gems leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);
      expect(dm.getProfile().gems).toBe(30);

      const ok = dm.unlockSkin('heroine', 30, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Skin 2: Heroine (30💎 / 300🪙) - Surplus 80 Gems leaves exactly 50 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(80);

      const ok = dm.unlockSkin('heroine', 30, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().gems).toBe(50);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
    });

    it('Skin 2: Heroine (30💎 / 300🪙) - Exact 300 Coins leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(300);

      const ok = dm.unlockSkin('heroine', 0, 300);
      expect(ok).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
    });

    it('Skin 2: Heroine (30💎 / 300🪙) - Insufficient 29 Gems fails with 0 deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(29);

      const ok = dm.unlockSkin('heroine', 30, 0);
      expect(ok).toBe(false);
      expect(dm.getProfile().gems).toBe(29);
      expect(dm.getProfile().ownedSkins).not.toContain('heroine');
    });

    it('Skin 3: Soldier (60💎 / 600🪙) - Exact 60 Gems leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(60);

      const ok = dm.unlockSkin('soldier', 60, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
    });

    it('Skin 3: Soldier (60💎 / 600🪙) - Surplus 200 Gems leaves exactly 140 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(200);

      const ok = dm.unlockSkin('soldier', 60, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().gems).toBe(140);
    });

    it('Skin 3: Soldier (60💎 / 600🪙) - Exact 600 Coins leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(600);

      const ok = dm.unlockSkin('soldier', 0, 600);
      expect(ok).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
    });

    it('Skin 3: Soldier (60💎 / 600🪙) - Insufficient 59 Gems / 599 Coins fails with 0 deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(59);
      dm.addCoins(599);

      const okGems = dm.unlockSkin('soldier', 60, 0);
      expect(okGems).toBe(false);
      expect(dm.getProfile().gems).toBe(59);

      const okCoins = dm.unlockSkin('soldier', 0, 600);
      expect(okCoins).toBe(false);
      expect(dm.getProfile().coins).toBe(599);
      expect(dm.getProfile().ownedSkins).not.toContain('soldier');
    });

    it('Skin 4: Knight (100💎 / 1000🪙) - Exact 100 Gems leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(100);

      const ok = dm.unlockSkin('knight', 100, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('knight');
    });

    it('Skin 4: Knight (100💎 / 1000🪙) - Surplus 250 Gems leaves exactly 150 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(250);

      const ok = dm.unlockSkin('knight', 100, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().gems).toBe(150);
    });

    it('Skin 4: Knight (100💎 / 1000🪙) - Exact 1000 Coins leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);

      const ok = dm.unlockSkin('knight', 0, 1000);
      expect(ok).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
    });

    it('Skin 4: Knight (100💎 / 1000🪙) - Insufficient 99 Gems / 999 Coins fails with 0 deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(99);
      dm.addCoins(999);

      expect(dm.unlockSkin('knight', 100, 0)).toBe(false);
      expect(dm.getProfile().gems).toBe(99);
      expect(dm.unlockSkin('knight', 0, 1000)).toBe(false);
      expect(dm.getProfile().coins).toBe(999);
      expect(dm.getProfile().ownedSkins).not.toContain('knight');
    });

    it('Skin 5: Ninja (150💎 / 1500🪙) - Exact 150 Gems leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(150);

      const ok = dm.unlockSkin('ninja', 150, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('ninja');
    });

    it('Skin 5: Ninja (150💎 / 1500🪙) - Surplus 500 Gems leaves exactly 350 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(500);

      const ok = dm.unlockSkin('ninja', 150, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().gems).toBe(350);
    });

    it('Skin 5: Ninja (150💎 / 1500🪙) - Exact 1500 Coins leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1500);

      const ok = dm.unlockSkin('ninja', 0, 1500);
      expect(ok).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
    });

    it('Skin 5: Ninja (150💎 / 1500🪙) - Insufficient 149 Gems / 1499 Coins fails with 0 deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(149);
      dm.addCoins(1499);

      expect(dm.unlockSkin('ninja', 150, 0)).toBe(false);
      expect(dm.getProfile().gems).toBe(149);
      expect(dm.unlockSkin('ninja', 0, 1500)).toBe(false);
      expect(dm.getProfile().coins).toBe(1499);
      expect(dm.getProfile().ownedSkins).not.toContain('ninja');
    });
  });

  // =========================================================================
  // 2. ALL 18 WARDROBE ITEMS: EXACT & SURPLUS CURRENCY AUDIT
  // =========================================================================
  describe('2. Wardrobe Items: Exact & Surplus Currency Audit (All 18 Items)', () => {
    it('Audits all 4 Dresses purchasing with EXACT coins and EXACT gems', () => {
      const dresses = WARDROBE_ITEMS.filter((i) => i.category === 'dress');
      expect(dresses.length).toBe(4);

      dresses.forEach((dress) => {
        // Coin Test
        localStorageMock = {};
        (DataManager as any).instance = undefined;
        let dm = DataManager.getInstance();
        dm.addCoins(dress.costCoins);

        expect(dm.buyWardrobeItem(dress.id, 'coins')).toBe(true);
        expect(dm.getProfile().coins).toBe(0);
        expect(dm.isWardrobeOwned(dress.id)).toBe(true);

        // Gem Test
        localStorageMock = {};
        (DataManager as any).instance = undefined;
        dm = DataManager.getInstance();
        dm.addGems(dress.costGems);

        expect(dm.buyWardrobeItem(dress.id, 'gems')).toBe(true);
        expect(dm.getProfile().gems).toBe(0);
        expect(dm.isWardrobeOwned(dress.id)).toBe(true);
      });
    });

    it('Audits all 4 Tops purchasing with EXACT coins and EXACT gems', () => {
      const tops = WARDROBE_ITEMS.filter((i) => i.category === 'top');
      expect(tops.length).toBe(4);

      tops.forEach((top) => {
        localStorageMock = {};
        (DataManager as any).instance = undefined;
        let dm = DataManager.getInstance();
        dm.addCoins(top.costCoins);
        expect(dm.buyWardrobeItem(top.id, 'coins')).toBe(true);
        expect(dm.getProfile().coins).toBe(0);

        localStorageMock = {};
        (DataManager as any).instance = undefined;
        dm = DataManager.getInstance();
        dm.addGems(top.costGems);
        expect(dm.buyWardrobeItem(top.id, 'gems')).toBe(true);
        expect(dm.getProfile().gems).toBe(0);
      });
    });

    it('Audits all 4 Bottoms purchasing with EXACT coins and EXACT gems', () => {
      const bottoms = WARDROBE_ITEMS.filter((i) => i.category === 'bottom');
      expect(bottoms.length).toBe(4);

      bottoms.forEach((bottom) => {
        localStorageMock = {};
        (DataManager as any).instance = undefined;
        let dm = DataManager.getInstance();
        dm.addCoins(bottom.costCoins);
        expect(dm.buyWardrobeItem(bottom.id, 'coins')).toBe(true);
        expect(dm.getProfile().coins).toBe(0);

        localStorageMock = {};
        (DataManager as any).instance = undefined;
        dm = DataManager.getInstance();
        dm.addGems(bottom.costGems);
        expect(dm.buyWardrobeItem(bottom.id, 'gems')).toBe(true);
        expect(dm.getProfile().gems).toBe(0);
      });
    });

    it('Audits all 6 Accessories purchasing with EXACT coins and EXACT gems', () => {
      const accessories = WARDROBE_ITEMS.filter((i) => i.category === 'accessory');
      expect(accessories.length).toBe(6);

      accessories.forEach((acc) => {
        localStorageMock = {};
        (DataManager as any).instance = undefined;
        let dm = DataManager.getInstance();
        dm.addCoins(acc.costCoins);
        expect(dm.buyWardrobeItem(acc.id, 'coins')).toBe(true);
        expect(dm.getProfile().coins).toBe(0);

        localStorageMock = {};
        (DataManager as any).instance = undefined;
        dm = DataManager.getInstance();
        dm.addGems(acc.costGems);
        expect(dm.buyWardrobeItem(acc.id, 'gems')).toBe(true);
        expect(dm.getProfile().gems).toBe(0);
      });
    });

    it('Surplus gems/coins deduction on Princess Dress (250🪙 / 25💎)', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);
      dm.addGems(100);

      expect(dm.buyWardrobeItem('princess_dress', 'coins')).toBe(true);
      expect(dm.getProfile().coins).toBe(250); // 500 - 250
      expect(dm.getProfile().gems).toBe(100); // untouched

      expect(dm.buyWardrobeItem('angel_wings', 'gems')).toBe(true);
      expect(dm.getProfile().gems).toBe(85); // 100 - 15
      expect(dm.getProfile().coins).toBe(250); // untouched
    });

    it('Insufficient currency blocks purchase without deducting any balance', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(249); // Princess Dress costs 250
      dm.addGems(24); // Princess Dress costs 25

      expect(dm.buyWardrobeItem('princess_dress', 'coins')).toBe(false);
      expect(dm.getProfile().coins).toBe(249);
      expect(dm.isWardrobeOwned('princess_dress')).toBe(false);

      expect(dm.buyWardrobeItem('princess_dress', 'gems')).toBe(false);
      expect(dm.getProfile().gems).toBe(24);
      expect(dm.isWardrobeOwned('princess_dress')).toBe(false);
    });

    it('Anti-fraud: duplicate purchase attempt returns false and does NOT deduct double currency', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(600);

      expect(dm.buyWardrobeItem('princess_dress', 'coins')).toBe(true);
      expect(dm.getProfile().coins).toBe(350);

      // 2nd buy attempt
      expect(dm.buyWardrobeItem('princess_dress', 'coins')).toBe(false);
      expect(dm.getProfile().coins).toBe(350); // Balance untouched
    });
  });

  // =========================================================================
  // 3. SHOPSCENE ACTION BUTTON: DEPTH 60, TEXT LABELS & CLICK TRIGGERS
  // =========================================================================
  describe('3. ShopScene Action Button: Depth 60 & Text Label Dynamics', () => {
    it('verifies actionButton visual depth is set to 60 (above showcase pedestal depth 40)', () => {
      const scene = createMockShopScene('skins', 0);
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setDepth).toHaveBeenCalledWith(60);
      expect(scene.actionButton?.depth).toBe(60);
    });

    it('Skin Tab: verifies "✅ 當前使用中" (grey, disabled) for equipped skin', () => {
      const scene = createMockShopScene('skins', 0); // Adventurer
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('✅ 當前使用中');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('grey');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(false);
    });

    it('Skin Tab: verifies "👕 立即換裝" (blue, enabled) for owned but unequipped skin', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('heroine', 0, 0); // User owns heroine
      dm.equipSkin('adventurer'); // Currently equipped adventurer

      const scene = createMockShopScene('skins', 1); // Select heroine
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('👕 立即換裝');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('blue');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(true);
    });

    it('Skin Tab: verifies "💎 30 購買解鎖" (yellow, enabled) for affordable skin', () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);

      const scene = createMockShopScene('skins', 1); // Heroine (idx 1)
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('💎 30 購買解鎖');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('yellow');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(true);
    });

    it('Skin Tab: verifies "💎 30 寶石不足" (grey, disabled) for unaffordable skin', () => {
      const dm = DataManager.getInstance();
      dm.addGems(20);

      const scene = createMockShopScene('skins', 1); // Heroine (costs 30)
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('💎 30 寶石不足');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('grey');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(false);
    });

    it('Wardrobe Tab: verifies "🪙 250 立即購買" (yellow, enabled) for affordable unowned wardrobe item', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(250);

      const scene = createMockShopScene('wardrobe', 0); // Princess Dress (idx 0)
      scene.currentWardrobeCategory = 'dress';
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('🪙 250 立即購買');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('yellow');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(true);
    });

    it('Wardrobe Tab: verifies "👗 立即換上" (green, enabled) for owned unequipped wardrobe item', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(250);
      dm.buyWardrobeItem('princess_dress', 'coins');

      const scene = createMockShopScene('wardrobe', 0); // Princess Dress
      scene.currentWardrobeCategory = 'dress';
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('👗 立即換上');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('green');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(true);
    });

    it('Wardrobe Tab: verifies "❌ 脫下衣物" (red, enabled) for currently equipped wardrobe item', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(250);
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.equipWardrobeItem('dress', 'princess_dress');

      const scene = createMockShopScene('wardrobe', 0); // Princess Dress
      scene.currentWardrobeCategory = 'dress';
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('❌ 脫下衣物');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('red');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(true);
    });

    it('Clicking Action Button triggers buy, equips item, and refreshes scene state', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(250);

      const scene = createMockShopScene('wardrobe', 0); // Princess dress
      scene.currentWardrobeCategory = 'dress';
      scene.handleActionClick();

      expect(dm.isWardrobeOwned('princess_dress')).toBe(true);
      expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');
      expect(scene.scene?.restart).toHaveBeenCalled();
    });

    it('Clicking Action Button when already equipped unequips the item', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(250);
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.equipWardrobeItem('dress', 'princess_dress');

      const scene = createMockShopScene('wardrobe', 0);
      scene.currentWardrobeCategory = 'dress';
      scene.handleActionClick();

      expect(dm.getEquippedWardrobe().dress).toBeUndefined();
      expect(scene.scene?.restart).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. WARDROBE SLOT EXCLUSIVITY & CATEGORY SWITCHING
  // =========================================================================
  describe('4. Wardrobe Slot Exclusivity & Category Switching Audit', () => {
    it('Exclusivity: Equipping a dress un-equips existing top and bottom', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      dm.buyWardrobeItem('sailor_top', 'coins');
      dm.buyWardrobeItem('denim_shorts', 'coins');
      dm.buyWardrobeItem('princess_dress', 'coins');

      // Equip top and bottom
      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('bottom', 'denim_shorts');
      expect(dm.getEquippedWardrobe()).toEqual({
        top: 'sailor_top',
        bottom: 'denim_shorts',
      });

      // Now equip dress
      dm.equipWardrobeItem('dress', 'princess_dress');
      expect(dm.getEquippedWardrobe()).toEqual({
        dress: 'princess_dress',
      });
      expect(dm.getEquippedWardrobe().top).toBeUndefined();
      expect(dm.getEquippedWardrobe().bottom).toBeUndefined();
    });

    it('Exclusivity: Equipping top or bottom un-equips existing dress', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.buyWardrobeItem('sailor_top', 'coins');
      dm.buyWardrobeItem('denim_shorts', 'coins');

      dm.equipWardrobeItem('dress', 'princess_dress');
      expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');

      // Equip top -> dress is removed
      dm.equipWardrobeItem('top', 'sailor_top');
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();
      expect(dm.getEquippedWardrobe().top).toBe('sailor_top');

      // Equip bottom -> top stays, bottom added, dress still undefined
      dm.equipWardrobeItem('bottom', 'denim_shorts');
      expect(dm.getEquippedWardrobe().top).toBe('sailor_top');
      expect(dm.getEquippedWardrobe().bottom).toBe('denim_shorts');
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();
    });

    it('Category Switching: switches category tabs without crashing and resets index', () => {
      const scene = createMockShopScene('wardrobe', 0);
      scene.switchWardrobeCategory('top');
      expect(scene.currentWardrobeCategory).toBe('top');
      expect(scene.selectedWardrobeIndex).toBe(0);

      scene.switchWardrobeCategory('bottom');
      expect(scene.currentWardrobeCategory).toBe('bottom');
      expect(scene.selectedWardrobeIndex).toBe(0);

      scene.switchWardrobeCategory('accessory');
      expect(scene.currentWardrobeCategory).toBe('accessory');
      expect(scene.selectedWardrobeIndex).toBe(0);
    });
  });

  // =========================================================================
  // 5. LOCALSTORAGE PERSISTENCE ACROSS SESSIONS
  // =========================================================================
  describe('5. LocalStorage Profile Persistence & Cross-Session Restoration', () => {
    it('persists and restores ownedSkins, equippedSkin, ownedWardrobe, equippedWardrobe, coins, gems', () => {
      const dm1 = DataManager.getInstance();
      dm1.addCoins(2000);
      dm1.addGems(300);

      // Buy & equip skin
      dm1.unlockSkin('ninja', 150, 0);
      dm1.equipSkin('ninja');

      // Buy & equip wardrobe items
      dm1.buyWardrobeItem('princess_dress', 'coins');
      dm1.buyWardrobeItem('angel_wings', 'coins');
      dm1.equipWardrobeItem('dress', 'princess_dress');
      dm1.equipWardrobeItem('wings', 'angel_wings');

      // Verify raw JSON in localStorage
      const raw = localStorage.getItem('p1_adventure_save_v1');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.equippedSkin).toBe('ninja');
      expect(parsed.ownedSkins).toEqual(['adventurer', 'ninja']);
      expect(parsed.ownedWardrobe).toEqual(['princess_dress', 'angel_wings']);
      expect(parsed.equippedWardrobe).toEqual({
        dress: 'princess_dress',
        wings: 'angel_wings',
      });
      expect(parsed.gems).toBe(150); // 300 - 150
      expect(parsed.coins).toBe(1600); // 2000 - 250 - 150

      // Re-instantiate DataManager (simulating page reload)
      (DataManager as any).instance = undefined;
      const dm2 = DataManager.getInstance();

      expect(dm2.getProfile().equippedSkin).toBe('ninja');
      expect(dm2.getProfile().ownedSkins).toEqual(['adventurer', 'ninja']);
      expect(dm2.getProfile().ownedWardrobe).toEqual(['princess_dress', 'angel_wings']);
      expect(dm2.getProfile().equippedWardrobe).toEqual({
        dress: 'princess_dress',
        wings: 'angel_wings',
      });
      expect(dm2.getProfile().gems).toBe(150);
      expect(dm2.getProfile().coins).toBe(1600);
    });

    it('falls back safely to default profile if localStorage has corrupted JSON', () => {
      localStorage.setItem('p1_adventure_save_v1', 'INVALID_CORRUPTED_JSON{{{');

      (DataManager as any).instance = undefined;
      const dm = DataManager.getInstance();

      expect(dm.getProfile().equippedSkin).toBe('adventurer');
      expect(dm.getProfile().ownedSkins).toEqual(['adventurer']);
      expect(dm.getProfile().coins).toBe(0);
      expect(dm.getProfile().gems).toBe(0);
    });
  });

  // =========================================================================
  // 6. ZERO-TRUST ADVERSARIAL DEFECT & DISCREPANCY REPRODUCTION
  // =========================================================================
  describe('6. Zero-Trust Adversarial Audit: Defect Manifestations & Inconsistencies', () => {
    it('DEFECT 1: ShopScene collapses glasses & backpacks into "hat" slot instead of "accessory"', () => {
      // In ShopScene.ts lines 1436 and 1452:
      // slot = item.id.includes('wings') ? 'wings' : 'hat';
      // When equipping 'star_glasses' or 'star_backpack', it assigns slot = 'hat',
      // which obliterates any hat currently worn (e.g. cat_ears or scholar_cap).
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      dm.buyWardrobeItem('cat_ears', 'coins');
      dm.buyWardrobeItem('star_glasses', 'coins');

      // Equip cat_ears to hat
      dm.equipWardrobeItem('hat', 'cat_ears');
      expect(dm.getEquippedWardrobe().hat).toBe('cat_ears');

      // Simulate ShopScene handling for star_glasses
      const item = WARDROBE_ITEMS.find((w) => w.id === 'star_glasses')!;
      let slot: keyof EquippedWardrobe = 'dress';
      if (item.category === 'accessory') {
        slot = item.id.includes('wings') ? 'wings' : 'hat'; // ShopScene logic
      }
      dm.equipWardrobeItem(slot, item.id);

      // DEFECT MANIFESTATION: cat_ears was overwritten because star_glasses mapped to hat!
      expect(dm.getEquippedWardrobe().hat).toBe('star_glasses');
      expect(dm.getEquippedWardrobe().accessory).toBeUndefined();
    });

    it('DEFECT 2 (FIXED): updateWardrobeOverlay properly renders the "accessory" slot icon', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().equippedWardrobe = {
        accessory: 'star_glasses',
      };

      const scene = createMockShopScene('wardrobe', 0);
      scene.updatePreviewDisplay();

      // previewWardrobeOverlay setText is called with glasses icon
      expect(scene.previewWardrobeOverlay?.setText).toHaveBeenCalledWith('👓');
    });

    it('DEFECT 3: Currency Prioritization Inconsistency between Skins (Gems-first) vs Wardrobe (Coins-first)', () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);
      dm.addCoins(300);

      // In Skins tab: Action button defaults to gems
      const skinScene = createMockShopScene('skins', 1); // Heroine (30💎 / 300🪙)
      skinScene.updatePreviewDisplay();
      expect(skinScene.actionButton?.getText()).toContain('💎 30 購買解鎖');

      // In Wardrobe tab: Action button defaults to coins
      const wardrobeScene = createMockShopScene('wardrobe', 1); // Scholar Gown (300🪙 / 30💎)
      wardrobeScene.currentWardrobeCategory = 'dress';
      wardrobeScene.updatePreviewDisplay();
      expect(wardrobeScene.actionButton?.getText()).toContain('🪙 300 立即購買');
    });

    it('DEFECT 4: ShopScene declares uninstantiated backButton property', () => {
      const scene = new ShopScene();
      expect(scene.backButton).toBeNull();
    });
  });
});
