import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { ShopScene } from '../scenes/ShopScene';
import { WARDROBE_ITEMS } from '../config/wardrobe';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('UI QA Auditor 3: Shop Gem/Coin Skin & Character Purchasing Auditor Adversarial Suite', () => {
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

  // Mock ShopScene creator
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
  // 1. "夠鑽石會唔會買唔到角式" (WILL ENOUGH GEMS FAIL TO BUY CHARACTERS?)
  // =========================================================================
  describe('1. Direct Investigation: 夠鑽石會唔會買唔到角式 (All Skins Purchasing Test)', () => {
    it('Adventurer (0💎): free and unlocked by default', () => {
      const dm = DataManager.getInstance();
      expect(dm.getProfile().ownedSkins).toContain('adventurer');
      expect(dm.getProfile().equippedSkin).toBe('adventurer');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Heroine (30💎): DataManager pure deduction leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);
      expect(dm.getProfile().gems).toBe(30);

      const ok = dm.unlockSkin('heroine', 30, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Soldier (60💎): DataManager pure deduction leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(60);
      expect(dm.getProfile().gems).toBe(60);

      const ok = dm.unlockSkin('soldier', 60, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Knight (100💎): DataManager pure deduction leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(100);
      expect(dm.getProfile().gems).toBe(100);

      const ok = dm.unlockSkin('knight', 100, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('knight');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Ninja (150💎): DataManager pure deduction leaves exactly 0 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(150);
      expect(dm.getProfile().gems).toBe(150);

      const ok = dm.unlockSkin('ninja', 150, 0);
      expect(ok).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('ninja');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('End-to-End ShopScene UI Click: Heroine (30💎) -> unlocks, equips, and triggers cascading trophy rewards', () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);

      const scene = createMockShopScene('skins', 1); // Heroine
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toContain('💎 30 購買解鎖');
      expect((scene.actionButton as any)?.enabled).toBe(true);
      expect((scene.actionButton as any)?.color).toBe('yellow');

      scene.handleActionClick();

      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().equippedSkin).toBe('heroine');
      // 30 - 30 = 0 + 5 (Trophy adv_skin_2: 2 skins) = 5💎
      expect(dm.getProfile().gems).toBe(5);
      // adv_skin_2 awards 50 coins, cascading through wealth trophies (10, 25, 50, 75, 100) -> 140 coins total
      expect(dm.getProfile().coins).toBe(140);
    });
  });

  // =========================================================================
  // 2. SURPLUS GEMS & EXACT COINS PURCHASING AUDIT
  // =========================================================================
  describe('2. Surplus Gems & Exact Coins Deductions', () => {
    it('Surplus Gems (Pure DM): 80 gems -> Buy Heroine (30💎) -> leaves exactly 50 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(80);

      expect(dm.unlockSkin('heroine', 30, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(50);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
    });

    it('Surplus Gems (Pure DM): 250 gems -> Buy Knight (100💎) -> leaves exactly 150 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(250);

      expect(dm.unlockSkin('knight', 100, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(150);
      expect(dm.getProfile().ownedSkins).toContain('knight');
    });

    it('Exact Coins (Pure DM): 300 coins -> Buy Heroine (300🪙) -> leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(300);

      expect(dm.unlockSkin('heroine', 0, 300)).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
    });

    it('Exact Coins (Pure DM): 600 coins -> Buy Soldier (600🪙) -> leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(600);

      expect(dm.unlockSkin('soldier', 0, 600)).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
    });

    it('Exact Coins (Pure DM): 1000 coins -> Buy Knight (1000🪙) -> leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);

      expect(dm.unlockSkin('knight', 0, 1000)).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('knight');
    });

    it('Exact Coins (Pure DM): 1500 coins -> Buy Ninja (1500🪙) -> leaves exactly 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1500);

      expect(dm.unlockSkin('ninja', 0, 1500)).toBe(true);
      expect(dm.getProfile().coins).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('ninja');
    });
  });

  // =========================================================================
  // 3. INSUFFICIENT CURRENCY BLOCKING & TAMPER PROTECTION
  // =========================================================================
  describe('3. Insufficient Currency Blocking & Anti-Exploit', () => {
    it('Heroine (30💎 / 300🪙): 29 gems & 299 coins blocks button and produces zero deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(29);
      dm.addCoins(299);

      const scene = createMockShopScene('skins', 1);
      scene.updatePreviewDisplay();

      // UI disabled state
      expect((scene.actionButton as any)?.text).toBe('💎 30 寶石不足');
      expect((scene.actionButton as any)?.color).toBe('grey');
      expect((scene.actionButton as any)?.enabled).toBe(false);

      // Force click invocation (tamper attempt)
      scene.handleActionClick();

      // Verification: Unchanged balance and skin not unlocked
      expect(dm.getProfile().gems).toBe(29);
      expect(dm.getProfile().coins).toBe(299);
      expect(dm.getProfile().ownedSkins).not.toContain('heroine');
      expect(dm.getProfile().equippedSkin).toBe('adventurer');
    });

    it('Soldier (60💎 / 600🪙): 59 gems & 599 coins fails with 0 deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(59);
      dm.addCoins(599);

      const scene = createMockShopScene('skins', 2);
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toBe('💎 60 寶石不足');
      expect((scene.actionButton as any)?.enabled).toBe(false);

      scene.handleActionClick();

      expect(dm.getProfile().gems).toBe(59);
      expect(dm.getProfile().coins).toBe(599);
      expect(dm.getProfile().ownedSkins).not.toContain('soldier');
    });

    it('Knight (100💎 / 1000🪙): 99 gems & 999 coins fails with 0 deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(99);
      dm.addCoins(999);

      const scene = createMockShopScene('skins', 3);
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toBe('💎 100 寶石不足');
      expect((scene.actionButton as any)?.enabled).toBe(false);

      scene.handleActionClick();

      expect(dm.getProfile().gems).toBe(99);
      expect(dm.getProfile().coins).toBe(999);
      expect(dm.getProfile().ownedSkins).not.toContain('knight');
    });

    it('Ninja (150💎 / 1500🪙): 149 gems & 1499 coins fails with 0 deduction', () => {
      const dm = DataManager.getInstance();
      dm.addGems(149);
      dm.addCoins(1499);

      const scene = createMockShopScene('skins', 4);
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toBe('💎 150 寶石不足');
      expect((scene.actionButton as any)?.enabled).toBe(false);

      scene.handleActionClick();

      expect(dm.getProfile().gems).toBe(149);
      expect(dm.getProfile().coins).toBe(1499);
      expect(dm.getProfile().ownedSkins).not.toContain('ninja');
    });
  });

  // =========================================================================
  // 4. ACTION BUTTON VISUAL DEPTH & STATUS LABELS
  // =========================================================================
  describe('4. Action Button Visual Depth & Dynamic Label State Transitions', () => {
    it('verifies actionButton has depth 60 (above showcase pedestal depth 40)', () => {
      const scene = createMockShopScene('skins', 0);
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.depth).toBe(60);
      expect(scene.actionButton?.setDepth).toHaveBeenCalledWith(60);
    });

    it('Skin Tab: shows "✅ 當前使用中" (grey, disabled) for currently equipped skin', () => {
      const scene = createMockShopScene('skins', 0); // Adventurer equipped by default
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toBe('✅ 當前使用中');
      expect((scene.actionButton as any)?.color).toBe('grey');
      expect((scene.actionButton as any)?.enabled).toBe(false);
    });

    it('Skin Tab: shows "👕 立即換裝" (blue, enabled) for owned but unequipped skin', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('heroine', 0, 0); // Owns heroine
      dm.equipSkin('adventurer'); // Adventurer equipped

      const scene = createMockShopScene('skins', 1); // Selected heroine
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toBe('👕 立即換裝');
      expect((scene.actionButton as any)?.color).toBe('blue');
      expect((scene.actionButton as any)?.enabled).toBe(true);

      // Clicking equips it
      scene.handleActionClick();
      expect(dm.getProfile().equippedSkin).toBe('heroine');
    });

    it('Wardrobe Tab: shows "👗 立即換上" (green, enabled) for owned unequipped wardrobe item', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(250);
      dm.buyWardrobeItem('princess_dress', 'coins');

      const scene = createMockShopScene('wardrobe', 0); // Princess dress
      scene.currentWardrobeCategory = 'dress';
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toBe('👗 立即換上');
      expect((scene.actionButton as any)?.color).toBe('green');
      expect((scene.actionButton as any)?.enabled).toBe(true);
    });

    it('Wardrobe Tab: shows "❌ 脫下衣物" (red, enabled) for equipped wardrobe item', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(250);
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.equipWardrobeItem('dress', 'princess_dress');

      const scene = createMockShopScene('wardrobe', 0);
      scene.currentWardrobeCategory = 'dress';
      scene.updatePreviewDisplay();

      expect((scene.actionButton as any)?.text).toBe('❌ 脫下衣物');
      expect((scene.actionButton as any)?.color).toBe('red');
      expect((scene.actionButton as any)?.enabled).toBe(true);

      // Clicking unequips it
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();
    });
  });

  // =========================================================================
  // 5. LOCALSTORAGE PERSISTENCE ACROSS SESSIONS
  // =========================================================================
  describe('5. LocalStorage Profile Persistence & Cross-Session Restoration', () => {
    it('persists and restores all skins, wardrobe, equipped items, and currencies upon reload', () => {
      const dm1 = DataManager.getInstance();
      dm1.addGems(500);
      dm1.addCoins(5000);

      // Buy all 4 non-default skins directly via unlockSkin
      dm1.unlockSkin('heroine', 30, 0);
      dm1.unlockSkin('soldier', 60, 0);
      dm1.unlockSkin('knight', 100, 0);
      dm1.unlockSkin('ninja', 150, 0);
      dm1.equipSkin('ninja');

      // Buy wardrobe items
      dm1.buyWardrobeItem('princess_dress', 'coins');
      dm1.buyWardrobeItem('angel_wings', 'coins');
      dm1.buyWardrobeItem('cat_ears', 'coins');
      dm1.equipWardrobeItem('dress', 'princess_dress');
      dm1.equipWardrobeItem('wings', 'angel_wings');
      dm1.equipWardrobeItem('hat', 'cat_ears');

      // Check remaining balances
      // Gems: 500 - 30 - 60 - 100 - 150 = 160
      // Coins: 5000 - 250 - 150 - 60 = 4540
      expect(dm1.getProfile().gems).toBe(160);
      expect(dm1.getProfile().coins).toBe(4540);

      // Simulate full app reload by clearing singleton
      (DataManager as any).instance = undefined;
      const dm2 = DataManager.getInstance();

      expect(dm2.getProfile().ownedSkins).toEqual(['adventurer', 'heroine', 'soldier', 'knight', 'ninja']);
      expect(dm2.getProfile().equippedSkin).toBe('ninja');
      expect(dm2.getProfile().ownedWardrobe).toEqual(['princess_dress', 'angel_wings', 'cat_ears']);
      expect(dm2.getProfile().equippedWardrobe).toEqual({
        dress: 'princess_dress',
        wings: 'angel_wings',
        hat: 'cat_ears',
      });
      expect(dm2.getProfile().gems).toBe(160);
      expect(dm2.getProfile().coins).toBe(4540);
    });
  });

  // =========================================================================
  // 6. ALL 18 WARDROBE ITEMS FULL SPECTRUM AUDIT
  // =========================================================================
  describe('6. Full Spectrum Audit of All 18 Wardrobe Items', () => {
    it('verifies all 18 wardrobe items can be purchased with exact coins and exact gems', () => {
      expect(WARDROBE_ITEMS.length).toBe(18);

      WARDROBE_ITEMS.forEach((item) => {
        // 1. Test Coins
        localStorageMock = {};
        (DataManager as any).instance = undefined;
        let dm = DataManager.getInstance();
        dm.addCoins(item.costCoins);
        expect(dm.buyWardrobeItem(item.id, 'coins')).toBe(true);
        expect(dm.getProfile().coins).toBe(0);
        expect(dm.isWardrobeOwned(item.id)).toBe(true);

        // 2. Test Gems
        localStorageMock = {};
        (DataManager as any).instance = undefined;
        dm = DataManager.getInstance();
        dm.addGems(item.costGems);
        expect(dm.buyWardrobeItem(item.id, 'gems')).toBe(true);
        expect(dm.getProfile().gems).toBe(0);
        expect(dm.isWardrobeOwned(item.id)).toBe(true);
      });
    });
  });
});
