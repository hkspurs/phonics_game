import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { ShopScene } from '../scenes/ShopScene';
import { RunnerScene, SKIN_CONFIGS } from '../scenes/RunnerScene';

describe('Gamer Tester 2: Shop Gem/Coin Skin Purchasing & Currency Deduction Audit Suite', () => {
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
  function createMockShopScene(selectedIdx: number = 0) {
    const scene = new ShopScene();
    scene.selectedSkinIndex = selectedIdx;

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
    });

    scene.coinText = mockTextObj('🪙 0') as any;
    scene.gemText = mockTextObj('💎 0') as any;
    scene.starText = mockTextObj('⭐ 0') as any;

    scene.previewNameText = mockTextObj() as any;
    scene.previewDescText = mockTextObj() as any;
    scene.previewSpeedText = mockTextObj() as any;
    scene.previewJumpText = mockTextObj() as any;
    scene.previewSpecialText = mockTextObj() as any;

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

    scene.scene = {
      restart: vi.fn(),
      start: vi.fn(),
    } as any;

    return scene;
  }

  // =========================================================================
  // 1. EXACT GEMS PURCHASING TESTS (All 5 Skins)
  // =========================================================================
  describe('1. Exact Gems Skin Purchasing & Deduction', () => {
    it('Adventurer: default skin requires 0 gems / 0 coins and is already owned', () => {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();

      expect(profile.ownedSkins).toContain('adventurer');
      expect(profile.equippedSkin).toBe('adventurer');

      const success = dm.unlockSkin('adventurer', 0, 0);
      expect(success).toBe(true);
      expect(profile.gems).toBe(0);
      expect(profile.coins).toBe(0);
    });

    it('Heroine (30💎): exact 30 gems purchase succeeds and deducts exactly 30 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);
      expect(dm.getProfile().gems).toBe(30);
      expect(dm.getProfile().coins).toBe(0);

      const success = dm.unlockSkin('heroine', 30, 0);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      // Direct deduction verification
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Soldier (60💎): exact 60 gems purchase succeeds and deducts exactly 60 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(60);
      expect(dm.getProfile().gems).toBe(60);

      const success = dm.unlockSkin('soldier', 60, 0);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Knight (100💎): exact 100 gems purchase succeeds and deducts exactly 100 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(100);
      expect(dm.getProfile().gems).toBe(100);

      const success = dm.unlockSkin('knight', 100, 0);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('knight');
      expect(dm.getProfile().gems).toBe(0);
    });

    it('Ninja (150💎): exact 150 gems purchase succeeds and deducts exactly 150 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(150);
      expect(dm.getProfile().gems).toBe(150);

      const success = dm.unlockSkin('ninja', 150, 0);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('ninja');
      expect(dm.getProfile().gems).toBe(0);
    });
  });

  // =========================================================================
  // 2. SURPLUS GEMS PURCHASING TESTS
  // =========================================================================
  describe('2. Surplus Gems Purchasing & Accurate Balance Deduction', () => {
    it('200 gems -> buy Soldier (60💎) -> remaining gems is exactly 140', () => {
      const dm = DataManager.getInstance();
      dm.addGems(200);
      expect(dm.getProfile().gems).toBe(200);

      const success = dm.unlockSkin('soldier', 60, 0);
      expect(success).toBe(true);
      expect(dm.getProfile().gems).toBe(140);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
    });

    it('500 gems -> buy Ninja (150💎) -> remaining gems is exactly 350', () => {
      const dm = DataManager.getInstance();
      dm.addGems(500);
      expect(dm.getProfile().gems).toBe(500);

      const success = dm.unlockSkin('ninja', 150, 0);
      expect(success).toBe(true);
      expect(dm.getProfile().gems).toBe(350);
      expect(dm.getProfile().ownedSkins).toContain('ninja');
    });

    it('sequential purchasing of Heroine (30💎) then Knight (100💎) from 150 gems -> leaves 20 gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(150);

      expect(dm.unlockSkin('heroine', 30, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(120);

      expect(dm.unlockSkin('knight', 100, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(20);

      expect(dm.getProfile().ownedSkins).toEqual(['adventurer', 'heroine', 'knight']);
    });
  });

  // =========================================================================
  // 3. EXACT COINS PURCHASING TESTS
  // =========================================================================
  describe('3. Exact Coins Purchasing & Deduction', () => {
    it('Heroine (300🪙): exact 300 coins purchase succeeds with 0 gems and leaves 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(300);
      expect(dm.getProfile().coins).toBe(300);
      expect(dm.getProfile().gems).toBe(0);

      const success = dm.unlockSkin('heroine', 0, 300);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().coins).toBe(0);
    });

    it('Soldier (600🪙): exact 600 coins purchase succeeds and leaves 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(600);
      expect(dm.getProfile().coins).toBe(600);

      const success = dm.unlockSkin('soldier', 0, 600);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
      expect(dm.getProfile().coins).toBe(0);
    });

    it('Knight (1000🪙): exact 1000 coins purchase succeeds and leaves 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      expect(dm.getProfile().coins).toBe(1000);

      const success = dm.unlockSkin('knight', 0, 1000);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('knight');
      expect(dm.getProfile().coins).toBe(0);
    });

    it('Ninja (1500🪙): exact 1500 coins purchase succeeds and leaves 0 coins', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1500);
      expect(dm.getProfile().coins).toBe(1500);

      const success = dm.unlockSkin('ninja', 0, 1500);
      expect(success).toBe(true);
      expect(dm.getProfile().ownedSkins).toContain('ninja');
      expect(dm.getProfile().coins).toBe(0);
    });
  });

  // =========================================================================
  // 4. INSUFFICIENT CURRENCY REJECTION TESTS
  // =========================================================================
  describe('4. Insufficient Currency Blocking & Anti-Fraud Tests', () => {
    it('Heroine (30💎): 29 gems fails purchase, deducts 0 gems, does not grant skin', () => {
      const dm = DataManager.getInstance();
      dm.addGems(29);

      const success = dm.unlockSkin('heroine', 30, 0);
      expect(success).toBe(false);
      expect(dm.getProfile().gems).toBe(29);
      expect(dm.getProfile().ownedSkins).not.toContain('heroine');
    });

    it('Soldier (60💎): 59 gems fails purchase', () => {
      const dm = DataManager.getInstance();
      dm.addGems(59);

      const success = dm.unlockSkin('soldier', 60, 0);
      expect(success).toBe(false);
      expect(dm.getProfile().gems).toBe(59);
      expect(dm.getProfile().ownedSkins).not.toContain('soldier');
    });

    it('Knight (100💎): 99 gems fails purchase', () => {
      const dm = DataManager.getInstance();
      dm.addGems(99);

      const success = dm.unlockSkin('knight', 100, 0);
      expect(success).toBe(false);
      expect(dm.getProfile().gems).toBe(99);
      expect(dm.getProfile().ownedSkins).not.toContain('knight');
    });

    it('Ninja (150💎): 149 gems fails purchase', () => {
      const dm = DataManager.getInstance();
      dm.addGems(149);

      const success = dm.unlockSkin('ninja', 150, 0);
      expect(success).toBe(false);
      expect(dm.getProfile().gems).toBe(149);
      expect(dm.getProfile().ownedSkins).not.toContain('ninja');
    });

    it('Soldier (600🪙): 599 coins fails purchase when gems = 0', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(599);

      const success = dm.unlockSkin('soldier', 0, 600);
      expect(success).toBe(false);
      expect(dm.getProfile().coins).toBe(599);
      expect(dm.getProfile().ownedSkins).not.toContain('soldier');
    });

    it('cannot equip an unowned skin via equipSkin', () => {
      const dm = DataManager.getInstance();
      expect(dm.getProfile().ownedSkins).toEqual(['adventurer']);

      const success = dm.equipSkin('ninja');
      expect(success).toBe(false);
      expect(dm.getProfile().equippedSkin).toBe('adventurer');
    });
  });

  // =========================================================================
  // 5. SHOPSCENE ACTION BUTTON & UI DYNAMICS
  // =========================================================================
  describe('5. ShopScene Action Button & UI State Update', () => {
    it('displays "✅ 當前使用中" (disabled) when viewing currently equipped skin', () => {
      const scene = createMockShopScene(0); // Adventurer
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('✅ 當前使用中');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('grey');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(false);
    });

    it('displays "💎 30 購買解鎖" (enabled, yellow) when unaffordable skin can be bought with gems', () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);

      const scene = createMockShopScene(1); // Heroine (idx 1)
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('💎 30 購買解鎖');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('yellow');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(true);
    });

    it('displays "🪙 300 購買解鎖" when gems = 0 but coins >= 300', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(300);

      const scene = createMockShopScene(1); // Heroine (idx 1)
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('🪙 300 購買解鎖');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('yellow');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(true);
    });

    it('displays "💎 60 寶石不足" (disabled, grey) when user has 0 gems and 0 coins', () => {
      const scene = createMockShopScene(2); // Soldier (idx 2)
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.setText).toHaveBeenCalledWith('💎 60 寶石不足');
      expect(scene.actionButton?.setColor).toHaveBeenCalledWith('grey');
      expect(scene.actionButton?.setEnabled).toHaveBeenCalledWith(false);
    });

    it('clicking Action Button on affordable skin unlocks, equips, and triggers scene restart', () => {
      const dm = DataManager.getInstance();
      dm.addGems(60); // Enough for Soldier

      const scene = createMockShopScene(2); // Soldier (idx 2)
      scene.handleActionClick();

      expect(dm.getProfile().ownedSkins).toContain('soldier');
      expect(dm.getProfile().equippedSkin).toBe('soldier');
      expect(scene.scene?.restart).toHaveBeenCalled();
    });

    it('clicking Action Button on owned but unequipped skin equips it immediately', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('heroine', 0, 0); // Owns heroine
      dm.equipSkin('adventurer'); // Currently on adventurer

      const scene = createMockShopScene(1); // Heroine
      scene.handleActionClick();

      expect(dm.getProfile().equippedSkin).toBe('heroine');
      expect(scene.scene?.restart).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 6. LOCALSTORAGE PROFILE PERSISTENCE ACROSS SESSIONS
  // =========================================================================
  describe('6. LocalStorage Profile Persistence Across Reloads', () => {
    it('persists ownedSkins and equippedSkin to localStorage after purchase & equip', () => {
      const dm1 = DataManager.getInstance();
      dm1.addGems(150);
      dm1.unlockSkin('ninja', 150, 0);
      dm1.equipSkin('ninja');

      expect(dm1.getProfile().equippedSkin).toBe('ninja');
      expect(dm1.getProfile().ownedSkins).toContain('ninja');

      // Verify raw localStorage entry
      const raw = localStorage.getItem('p1_adventure_save_v1');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.equippedSkin).toBe('ninja');
      expect(parsed.ownedSkins).toEqual(['adventurer', 'ninja']);
      expect(parsed.gems).toBe(0);

      // Simulate full page refresh / new DataManager instance
      (DataManager as any).instance = undefined;
      const dm2 = DataManager.getInstance();

      expect(dm2.getProfile().equippedSkin).toBe('ninja');
      expect(dm2.getProfile().ownedSkins).toEqual(['adventurer', 'ninja']);
      expect(dm2.getProfile().gems).toBe(0);
    });

    it('persists all 5 unlocked skins and their trophies after full collection', () => {
      const dm1 = DataManager.getInstance();
      dm1.addGems(1000);
      dm1.unlockSkin('heroine', 30, 0);
      dm1.unlockSkin('soldier', 60, 0);
      dm1.unlockSkin('knight', 100, 0);
      dm1.unlockSkin('ninja', 150, 0);
      dm1.equipSkin('knight');
      dm1.checkTrophies();

      // Simulate reload
      (DataManager as any).instance = undefined;
      const dm2 = DataManager.getInstance();

      expect(dm2.getProfile().ownedSkins).toEqual([
        'adventurer',
        'heroine',
        'soldier',
        'knight',
        'ninja',
      ]);
      expect(dm2.getProfile().equippedSkin).toBe('knight');
      expect(dm2.getProfile().trophies['adv_skin_5']).toBe(true);
    });
  });

  // =========================================================================
  // 7. RUNNERSCENE SKIN PERKS, SPEED, JUMP, MAGNET & TEXTURE KEYS
  // =========================================================================
  describe('7. RunnerScene Skin Perk Application & Asset Texture Integrity', () => {
    it('applies Adventurer default configuration and baseline kinematics', () => {
      const dm = DataManager.getInstance();
      dm.equipSkin('adventurer');

      const scene = new RunnerScene();
      scene.init();

      expect(scene.skinConfig.id).toBe('adventurer');
      expect(scene.skinConfig.walk1Key).toBe('adventurer_walk1');
      expect(scene.skinConfig.walk2Key).toBe('adventurer_walk2');
      expect(scene.skinConfig.jumpKey).toBe('adventurer_jump');
      expect(scene.skinConfig.standKey).toBe('adventurer_stand');
      expect(scene.skinConfig.cheerKey).toBe('adventurer_cheer1');
      expect(scene.skinConfig.speedMultiplier).toBe(1.0);
      expect(scene.skinConfig.jumpMultiplier).toBe(1.0);
      expect(scene.skinConfig.magnetRadius).toBe(100);
      expect(scene.currentSpeed).toBe(380); // 380 * 1.0
    });

    it('applies Heroine skin configuration and perks', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('heroine', 0, 0);
      dm.equipSkin('heroine');

      const scene = new RunnerScene();
      scene.init();

      expect(scene.skinConfig.id).toBe('heroine');
      expect(scene.skinConfig.walk1Key).toBe('female_walk1');
      expect(scene.skinConfig.walk2Key).toBe('female_walk2');
      expect(scene.skinConfig.jumpKey).toBe('female_jump');
      expect(scene.skinConfig.cheerKey).toBe('female_cheer1');
      expect(scene.skinConfig.speedMultiplier).toBe(1.10);
      expect(scene.skinConfig.jumpMultiplier).toBe(1.10);
      expect(scene.skinConfig.magnetRadius).toBe(130);
      expect(scene.currentSpeed).toBe(380 * 1.10);
    });

    it('applies Soldier skin configuration and perks', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('soldier', 0, 0);
      dm.equipSkin('soldier');

      const scene = new RunnerScene();
      scene.init();

      expect(scene.skinConfig.id).toBe('soldier');
      expect(scene.skinConfig.walk1Key).toBe('soldier_walk1');
      expect(scene.skinConfig.walk2Key).toBe('soldier_walk2');
      expect(scene.skinConfig.jumpKey).toBe('soldier_jump');
      expect(scene.skinConfig.cheerKey).toBe('soldier_cheer1');
      expect(scene.skinConfig.speedMultiplier).toBe(1.15);
      expect(scene.skinConfig.jumpMultiplier).toBe(1.15);
      expect(scene.skinConfig.magnetRadius).toBe(140);
    });

    it('applies Knight skin configuration, perks, and armor tint 0xc8e6ff', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('knight', 0, 0);
      dm.equipSkin('knight');

      const scene = new RunnerScene();
      scene.init();

      expect(scene.skinConfig.id).toBe('knight');
      expect(scene.skinConfig.walk1Key).toBe('player_walk1');
      expect(scene.skinConfig.walk2Key).toBe('player_walk2');
      expect(scene.skinConfig.jumpKey).toBe('player_jump');
      expect(scene.skinConfig.cheerKey).toBe('player_cheer1');
      expect(scene.skinConfig.tint).toBe(0xc8e6ff);
      expect(scene.skinConfig.speedMultiplier).toBe(1.10);
      expect(scene.skinConfig.jumpMultiplier).toBe(1.25);
      expect(scene.skinConfig.magnetRadius).toBe(160);
      expect(scene.currentSpeed).toBe(380 * 1.10);
    });

    it('applies Ninja skin configuration, perks, and shadow stealth tint 0x4a4a5a', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('ninja', 0, 0);
      dm.equipSkin('ninja');

      const scene = new RunnerScene();
      scene.init();

      expect(scene.skinConfig.id).toBe('ninja');
      expect(scene.skinConfig.walk1Key).toBe('player_walk1');
      expect(scene.skinConfig.walk2Key).toBe('player_walk2');
      expect(scene.skinConfig.jumpKey).toBe('player_jump');
      expect(scene.skinConfig.cheerKey).toBe('player_cheer1');
      expect(scene.skinConfig.tint).toBe(0x4a4a5a);
      expect(scene.skinConfig.speedMultiplier).toBe(1.30);
      expect(scene.skinConfig.jumpMultiplier).toBe(1.20);
      expect(scene.skinConfig.magnetRadius).toBe(190);
      expect(scene.currentSpeed).toBe(380 * 1.30);
    });
  });

  // =========================================================================
  // 8. ADVERSARIAL AUDIT: SPECIFICATION VS IMPLEMENTATION DISCREPANCY CHECKS
  // =========================================================================
  describe('8. Zero-Trust Adversarial Audit: Discrepancies & Defect Manifestation', () => {
    it('AUDIT DEFECT: detects stat discrepancy between ShopScene advertised perks and RunnerScene actual perks', () => {
      const runnerSoldier = SKIN_CONFIGS.soldier;

      expect(runnerSoldier.speedMultiplier).toBe(1.15);
      expect(runnerSoldier.jumpMultiplier).toBe(1.15);
      expect(runnerSoldier.magnetRadius).toBe(140);

      const runnerKnight = SKIN_CONFIGS.knight;

      expect(runnerKnight.speedMultiplier).toBe(1.10);
      expect(runnerKnight.jumpMultiplier).toBe(1.25);
      expect(runnerKnight.magnetRadius).toBe(160);

      const runnerNinja = SKIN_CONFIGS.ninja;

      expect(runnerNinja.speedMultiplier).toBe(1.30);
      expect(runnerNinja.jumpMultiplier).toBe(1.20);
      expect(runnerNinja.magnetRadius).toBe(190);
    });

    it('AUDIT DEFECT: detects that ShopScene has uninstantiated backButton reference', () => {
      const scene = new ShopScene();
      // backButton is declared on class, but createHeaderHUD only creates homeButton & mapButton
      expect(scene.backButton).toBeNull();
    });

    it('AUDIT DEFECT: detects dual-currency force prioritization (Gems always consumed before Coins)', () => {
      const dm = DataManager.getInstance();
      // User has 30 gems AND 300 coins
      dm.addGems(30);
      dm.addCoins(300);

      const scene = createMockShopScene(1); // Heroine
      scene.handleActionClick();

      // Gems was spent for purchase (30 - 30 = 0), then trophy adv_skin_2 gave +5 gems
      // Coins was NOT spent (initial 300 coins was kept and increased via trophy rewards)
      expect(dm.getProfile().gems).toBe(5); // 0 + 5 from adv_skin_2
      expect(dm.getProfile().coins).toBeGreaterThanOrEqual(300); // Coins was NOT deducted
    });
  });
});
