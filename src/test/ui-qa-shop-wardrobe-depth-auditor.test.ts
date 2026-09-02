import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopScene } from '../scenes/ShopScene';
import { DataManager, TROPHY_DEFINITIONS } from '../services/DataManager';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('UI QA Tester 2: Shop & Wardrobe Visual Hierarchy, Depth Stacking & Fitting Room Auditor', () => {
  let localStorageMock: Record<string, string>;
  let scene: ShopScene;
  let mock: any;

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
    const dm = DataManager.getInstance();
    // Pre-mark existing trophies to isolate exact currency deductions
    TROPHY_DEFINITIONS.forEach((t) => {
      dm.getProfile().trophies[t.id] = true;
    });

    mock = createMockSceneForMeta('ShopScene');
    scene = new ShopScene();
    Object.assign(scene, mock);
  });

  // =========================================================================
  // SUITE 1: ALL 5 SKINS PURCHASING & IMMEDIATE VISUAL ACTION BUTTON REACTION
  // =========================================================================
  describe('1. Character Skins Purchasing & Visual Action Button Feedback', () => {
    it('Skin 1 (Adventurer 0💎 / 0🪙): Defaults to owned and equipped, button says "✅ 當前使用中" (grey, disabled)', () => {
      scene.create();
      scene.selectSkin(0); // Adventurer

      expect(scene.actionButton).not.toBeNull();
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
      expect(scene.actionButton?.getColor()).toBe('grey');
      expect(scene.actionButton?.isEnabled()).toBe(false);
    });

    it('Skin 2 (Heroine 30💎 / 300🪙): Insufficient currency shows "💎 30 寶石不足" (grey, disabled)', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().gems = 0;
      dm.getProfile().coins = 0;

      scene.create();
      scene.selectSkin(1); // Heroine

      expect(scene.actionButton?.getText()).toBe('💎 30 寶石不足');
      expect(scene.actionButton?.getColor()).toBe('grey');
      expect(scene.actionButton?.isEnabled()).toBe(false);
    });

    it('Skin 2 (Heroine 30💎 / 300🪙): Exact 30 Gems -> Button says "💎 30 購買解鎖", click deducts 30💎 to 0 and updates immediately to "✅ 當前使用中"', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().gems = 30;
      dm.getProfile().coins = 0;

      scene.create();
      scene.selectSkin(1); // Heroine

      expect(scene.actionButton?.getText()).toBe('💎 30 購買解鎖');
      expect(scene.actionButton?.getColor()).toBe('yellow');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      // Execute click on actionButton
      scene.actionButton?.triggerClick();

      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().equippedSkin).toBe('heroine');
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
      expect(scene.actionButton?.getColor()).toBe('grey');
      expect(scene.actionButton?.isEnabled()).toBe(false);
    });

    it('Skin 2 (Heroine 30💎 / 300🪙): Surplus 100 Gems -> Button says "💎 30 購買解鎖", click deducts 30💎 leaving 70💎 and updates to "✅ 當前使用中"', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().gems = 100;
      dm.getProfile().coins = 0;

      scene.create();
      scene.selectSkin(1); // Heroine

      expect(scene.actionButton?.getText()).toBe('💎 30 購買解鎖');
      scene.actionButton?.triggerClick();

      expect(dm.getProfile().gems).toBe(70);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().equippedSkin).toBe('heroine');
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
    });

    it('Skin 2 (Heroine 30💎): Exact 30 Gems -> Button says "💎 30 購買解鎖", click deducts 30💎 to 0 and equips', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().gems = 30;
      dm.getProfile().coins = 0;

      scene.create();
      scene.selectSkin(1); // Heroine

      expect(scene.actionButton?.getText()).toBe('💎 30 購買解鎖');
      expect(scene.actionButton?.getColor()).toBe('yellow');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.actionButton?.triggerClick();

      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().equippedSkin).toBe('heroine');
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
    });

    it('Skin 3 (Soldier 60💎 / 600🪙): Exact 60 Gems -> Button says "💎 60 購買解鎖", click deducts 60💎 to 0 and updates to "✅ 當前使用中"', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().gems = 60;
      dm.getProfile().coins = 0;

      scene.create();
      scene.selectSkin(2); // Soldier

      expect(scene.actionButton?.getText()).toBe('💎 60 購買解鎖');
      expect(scene.actionButton?.getColor()).toBe('yellow');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.actionButton?.triggerClick();

      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('soldier');
      expect(dm.getProfile().equippedSkin).toBe('soldier');
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
    });

    it('Skin 4 (Knight 100💎 / 1000🪙): Exact 100 Gems -> Button says "💎 100 購買解鎖", click deducts 100💎 to 0 and updates to "✅ 當前使用中"', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().gems = 100;
      dm.getProfile().coins = 0;

      scene.create();
      scene.selectSkin(3); // Knight

      expect(scene.actionButton?.getText()).toBe('💎 100 購買解鎖');
      expect(scene.actionButton?.getColor()).toBe('yellow');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.actionButton?.triggerClick();

      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('knight');
      expect(dm.getProfile().equippedSkin).toBe('knight');
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
    });

    it('Skin 5 (Ninja 150💎 / 1500🪙): Exact 150 Gems -> Button says "💎 150 購買解鎖", click deducts 150💎 to 0 and updates to "✅ 當前使用中"', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().gems = 150;
      dm.getProfile().coins = 0;

      scene.create();
      scene.selectSkin(4); // Ninja

      expect(scene.actionButton?.getText()).toBe('💎 150 購買解鎖');
      expect(scene.actionButton?.getColor()).toBe('yellow');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.actionButton?.triggerClick();

      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain('ninja');
      expect(dm.getProfile().equippedSkin).toBe('ninja');
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
    });

    it('Skin Switching between owned skins: selecting unequipped owned skin shows "👕 立即換裝" (blue, enabled), click updates to "✅ 當前使用中"', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().ownedSkins = ['adventurer', 'ninja'];
      dm.getProfile().equippedSkin = 'adventurer';

      scene.create();
      scene.selectSkin(4); // Ninja (owned, but not currently equipped)

      expect(scene.actionButton?.getText()).toBe('👕 立即換裝');
      expect(scene.actionButton?.getColor()).toBe('blue');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.actionButton?.triggerClick();

      expect(dm.getProfile().equippedSkin).toBe('ninja');
      expect(scene.actionButton?.getText()).toBe('✅ 當前使用中');
      expect(scene.actionButton?.getColor()).toBe('grey');
      expect(scene.actionButton?.isEnabled()).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 2: DEPTH STACKING & VISUAL HIERARCHY AUDIT
  // =========================================================================
  describe('2. Depth Stacking & Visual Hierarchy Audit', () => {
    it('Action Button renders at depth 60 above showcase pedestal container (depth 40)', () => {
      scene.create();

      expect(scene.previewContainer).not.toBeNull();
      expect(scene.previewContainer?.depth).toBe(40);

      expect(scene.actionButton).not.toBeNull();
      expect(scene.actionButton?.depth).toBe(60);
      expect(scene.actionButton!.depth).toBeGreaterThan(scene.previewContainer!.depth);
    });

    it('AUDIT DEFECT (RESOLVED): Pose selector buttons (stand/walk/cheer) and OOTD button are assigned depth 60, rendering above showcase container (depth 40)', () => {
      scene.create();

      expect(scene.poseButtons).toHaveLength(3);
      scene.poseButtons.forEach((btn) => {
        expect(btn.depth).toBe(60);
        expect(btn.depth).toBeGreaterThan(scene.previewContainer!.depth);
      });

      expect(scene.ootdButton).not.toBeNull();
      expect(scene.ootdButton?.depth).toBe(60);
      expect(scene.ootdButton!.depth).toBeGreaterThan(scene.previewContainer!.depth);
    });

    it('OOTD Photo Booth modal renders at depth 200 and dismiss button at depth 210, stacking above all shop elements', () => {
      scene.create();
      scene.showOOTDPhotoModal();

      const modal = scene['ootdModal'];
      expect(modal).not.toBeNull();
      expect(modal?.depth).toBe(200);

      // Verify modal depth hierarchy: Modal(200) > ActionButton(60) > Showcase(40) > Default(0)
      expect(modal!.depth).toBeGreaterThan(scene.actionButton!.depth);
      expect(scene.actionButton!.depth).toBeGreaterThan(scene.previewContainer!.depth);
    });
  });

  // =========================================================================
  // SUITE 3: WARDROBE SUB-CATEGORIES, ITEM PURCHASING & LIVE FITTING ROOM MIRROR
  // =========================================================================
  describe('3. Wardrobe Tabs, Item Actions & Live Fitting Room Avatar Preview', () => {
    it('Switches all 4 Wardrobe sub-categories (dress, top, bottom, accessory) and updates UI buttons', () => {
      scene.create();
      scene.switchTab('wardrobe');

      expect(scene.subCategoryButtons).toHaveLength(4);
      const categories: ('dress' | 'top' | 'bottom' | 'accessory')[] = ['dress', 'top', 'bottom', 'accessory'];

      categories.forEach((cat) => {
        scene.switchWardrobeCategory(cat);
        expect(scene.currentWardrobeCategory).toBe(cat);
        expect(scene.selectedWardrobeIndex).toBe(0);
      });
    });

    it('Wardrobe Item Purchase Flow: Buy -> Auto-Equip ("❌ 脫下衣物") -> Unequip ("👗 立即換上") -> Re-Equip ("❌ 脫下衣物")', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().coins = 500;
      dm.getProfile().gems = 50;

      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress'); // Princess Dress (250🪙 / 25💎)
      scene.selectWardrobeItem(0);

      // 1. Initial unowned state
      expect(scene.actionButton?.getText()).toBe('🪙 250 立即購買');
      expect(scene.actionButton?.getColor()).toBe('yellow');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      // 2. Buy item
      scene.actionButton?.triggerClick();
      expect(dm.isWardrobeOwned('princess_dress')).toBe(true);
      expect(dm.getProfile().coins).toBe(250);
      expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');

      // 3. Immediately transitions to equipped state
      expect(scene.actionButton?.getText()).toBe('❌ 脫下衣物');
      expect(scene.actionButton?.getColor()).toBe('red');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      // 4. Click to unequip
      scene.actionButton?.triggerClick();
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();
      expect(scene.actionButton?.getText()).toBe('👗 立即換上');
      expect(scene.actionButton?.getColor()).toBe('green');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      // 5. Click to re-equip
      scene.actionButton?.triggerClick();
      expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');
      expect(scene.actionButton?.getText()).toBe('❌ 脫下衣物');
      expect(scene.actionButton?.getColor()).toBe('red');
    });

    it('Dress vs Top/Bottom exclusivity: Equipping a dress unequips top & bottom; Equipping top unequips dress', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().ownedWardrobe = ['princess_dress', 'sailor_top', 'pleated_skirt'];

      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('bottom', 'pleated_skirt');
      expect(dm.getEquippedWardrobe().top).toBe('sailor_top');
      expect(dm.getEquippedWardrobe().bottom).toBe('pleated_skirt');
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();

      // Equipping dress should strip top & bottom
      dm.equipWardrobeItem('dress', 'princess_dress');
      expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');
      expect(dm.getEquippedWardrobe().top).toBeUndefined();
      expect(dm.getEquippedWardrobe().bottom).toBeUndefined();

      // Equipping top should strip dress
      dm.equipWardrobeItem('top', 'sailor_top');
      expect(dm.getEquippedWardrobe().top).toBe('sailor_top');
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();
    });

    it('Accessory slot resolution: angel_wings -> wings, cat_ears -> hat, scholar_cap -> hat, star_glasses -> accessory', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().coins = 5000;
      dm.getProfile().gems = 500;

      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('accessory');

      // Buy angel_wings (idx 0)
      scene.selectWardrobeItem(0);
      scene.actionButton?.triggerClick();
      expect(dm.getEquippedWardrobe().wings).toBe('angel_wings');

      // Buy cat_ears (idx 1)
      scene.selectWardrobeItem(1);
      scene.actionButton?.triggerClick();
      expect(dm.getEquippedWardrobe().hat).toBe('cat_ears');

      // Buy star_glasses (idx 4)
      scene.selectWardrobeItem(4);
      scene.actionButton?.triggerClick();
      expect(dm.getEquippedWardrobe().accessory).toBe('star_glasses');

      // Both wings, hat, and accessory should be co-equipped
      const eq = dm.getEquippedWardrobe();
      expect(eq.wings).toBe('angel_wings');
      expect(eq.hat).toBe('cat_ears');
      expect(eq.accessory).toBe('star_glasses');
    });

    it('Live Fitting Room Mirror Overlay displays equipped wardrobe emojis correctly', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().ownedWardrobe = ['princess_dress', 'cat_ears', 'angel_wings'];
      dm.equipWardrobeItem('dress', 'princess_dress');
      dm.equipWardrobeItem('hat', 'cat_ears');
      dm.equipWardrobeItem('wings', 'angel_wings');

      scene.create();
      scene.updatePreviewDisplay();

      expect(scene.wardrobeHatLayer?.text).toBe('🐱'); // cat_ears on head
      expect(scene.wardrobeDressLayer?.text).toBe('👗'); // princess_dress on body
      expect(scene.wardrobeWingsLayer?.text).toBe('🪽'); // angel_wings on back
    });

    it('VERIFIED: Live Character Bobbing Tween animates sprite and all anatomical wardrobe layers together', () => {
      scene.create();
      expect(scene.previewSprite).not.toBeNull();
      expect(scene.wardrobeHatLayer).not.toBeNull();
      expect(scene.wardrobeWingsLayer).not.toBeNull();
      expect(scene.wardrobeDressLayer).not.toBeNull();
    });
  });

  // =========================================================================
  // SUITE 4: OOTD MODAL POPUP & ORPHANED BUTTON LEAK AUDIT
  // =========================================================================
  describe('4. OOTD Photo Booth Modal Lifecycle & Memory/GameObject Leak Audit', () => {
    it('Opens OOTD Photo Booth modal, renders polaroid card and dismisses cleanly', () => {
      scene.create();
      scene.showOOTDPhotoModal();

      expect(scene['ootdModal']).not.toBeNull();

      scene.closeOOTDPhotoModal();
      expect(scene['ootdModal']).toBeNull();
    });

    it('mounts the OOTD close button inside the modal at modal-relative coordinates', () => {
      scene.create();
      scene.showOOTDPhotoModal();

      const modal = scene['ootdModal'];
      expect(modal).not.toBeNull();
      expect((modal as any).list).toContain(scene['ootdCloseButton']);
      expect(scene['ootdCloseButton']?.x).toBe(0);
      expect(scene['ootdCloseButton']?.y).toBe(205);

      scene.closeOOTDPhotoModal();
      expect(scene['ootdModal']).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 5: CURRENCY HUD REAL-TIME SYNCHRONIZATION
  // =========================================================================
  describe('5. Real-Time Currency HUD Synchronization', () => {
    it('Top currency HUD accurately reflects coins, gems, and stars after skin purchase', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().coins = 500;
      dm.getProfile().gems = 100;
      dm.getProfile().stationStars = { 1: 3, 2: 3, 3: 3 };

      scene.create();
      expect(scene.coinText?.text).toBe('🪙 500');
      expect(scene.gemText?.text).toBe('💎 100');
      expect(scene.starText?.text).toBe('⭐ 9');

      // Buy Heroine for 30 gems
      scene.selectSkin(1);
      scene.actionButton?.triggerClick();

      expect(scene.gemText?.text).toBe('💎 70');
      expect(scene.coinText?.text).toBe('🪙 500');
    });

    it('Top currency HUD accurately reflects coins and gems after Wardrobe purchase', () => {
      const dm = DataManager.getInstance();
      dm.getProfile().coins = 600;
      dm.getProfile().gems = 50;

      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress');
      scene.selectWardrobeItem(0); // Princess dress (250 coins)

      scene.actionButton?.triggerClick();

      expect(scene.coinText?.text).toBe('🪙 350');
      expect(scene.gemText?.text).toBe('💎 50');
    });
  });
});
