import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DataManager, TROPHY_DEFINITIONS } from '../services/DataManager';
import { ShopScene } from '../scenes/ShopScene';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';
import { SpeechService } from '../services/SpeechService';
import { SoundManager } from '../services/SoundManager';
import { WARDROBE_ITEMS } from '../config/wardrobe';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { EquippedWardrobe, UserProfile } from '../types';

describe('Game Agent 3: Wardrobe UX & Exclusivity Logic Adversarial Audit Suite', () => {
  let dm: DataManager;
  let scene: ShopScene;
  let localStorageMock: Record<string, string>;

  // Helper to mark all trophies as already claimed so trophy rewards don't interfere with exact currency math
  const claimAllTrophies = (profile: UserProfile) => {
    TROPHY_DEFINITIONS.forEach((t) => {
      profile.trophies[t.id] = true;
    });
  };

  beforeEach(() => {
    localStorageMock = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
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

    (DataManager as any).instance = null;
    dm = DataManager.getInstance();
    dm.reset();
    claimAllTrophies(dm.getProfile());

    // Mock SpeechService and SoundManager
    vi.spyOn(SpeechService, 'speak').mockImplementation(() => null as any);
    vi.spyOn(SoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(SoundManager, 'playClothSnap').mockImplementation(() => {});
    vi.spyOn(SoundManager, 'playMagicTransform').mockImplementation(() => {});
    vi.spyOn(SoundManager, 'playCameraSnap').mockImplementation(() => {});

    // Create ShopScene instance
    const metaMock = createMockSceneForMeta('ShopScene');
    scene = new ShopScene();
    Object.assign(scene, metaMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. PURCHASE FLOW & CURRENCY DEDUCTIONS
  // =========================================================================
  describe('1. Purchase Flow & Currency Deductions', () => {
    it('buys wardrobe item with exact coins and immediately auto-equips', () => {
      // princess_dress: 250 coins
      dm.getProfile().coins = 250;
      dm.getProfile().gems = 0;

      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress');
      scene.selectWardrobeItem(0); // princess_dress

      expect(scene.actionButton?.getText()).toBe('🪙 250 立即購買');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.handleActionClick();

      expect(dm.getProfile().coins).toBe(0);
      expect(dm.isWardrobeOwned('princess_dress')).toBe(true);
      expect(dm.getEquippedWardrobe().dress).toBe('princess_dress');
      expect(SoundManager.playMagicTransform).toHaveBeenCalled();
    });

    it('buys wardrobe item with surplus coins and correctly deducts price', () => {
      // sailor_top: 80 coins
      dm.getProfile().coins = 300;
      dm.getProfile().gems = 50;

      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('top');
      scene.selectWardrobeItem(0); // sailor_top

      expect(scene.actionButton?.getText()).toBe('🪙 80 立即購買');
      scene.handleActionClick();

      expect(dm.getProfile().coins).toBe(220);
      expect(dm.getProfile().gems).toBe(50); // gems untouched
      expect(dm.isWardrobeOwned('sailor_top')).toBe(true);
      expect(dm.getEquippedWardrobe().top).toBe('sailor_top');
    });

    it('buys wardrobe item with gems when coins are insufficient but gems are sufficient', () => {
      // dino_onesie: 200 coins / 20 gems
      dm.getProfile().coins = 50; // Insufficient coins (< 200)
      dm.getProfile().gems = 25; // Sufficient gems (>= 20)

      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress');
      scene.selectWardrobeItem(2); // dino_onesie

      expect(scene.actionButton?.getText()).toBe('💎 20 立即購買');
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.handleActionClick();

      expect(dm.getProfile().coins).toBe(50); // coins untouched
      expect(dm.getProfile().gems).toBe(5); // 25 - 20 = 5
      expect(dm.isWardrobeOwned('dino_onesie')).toBe(true);
      expect(dm.getEquippedWardrobe().dress).toBe('dino_onesie');
    });

    it('blocks purchase and shows disabled button when both coins and gems are insufficient', () => {
      // princess_dress: 250 coins / 25 gems
      dm.getProfile().coins = 100;
      dm.getProfile().gems = 5;

      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress');
      scene.selectWardrobeItem(0); // princess_dress

      expect(scene.actionButton?.getText()).toBe('🪙 250 金幣不足');
      expect(scene.actionButton?.isEnabled()).toBe(false);

      // Force click
      scene.handleActionClick();

      // Ensure no state corruption or purchase
      expect(dm.getProfile().coins).toBe(100);
      expect(dm.getProfile().gems).toBe(5);
      expect(dm.isWardrobeOwned('princess_dress')).toBe(false);
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();
    });

    it('prevents double-purchase exploit on already owned wardrobe items', () => {
      dm.getProfile().coins = 500;
      dm.buyWardrobeItem('sailor_top', 'coins'); // 80 coins
      expect(dm.getProfile().coins).toBe(420);

      // Attempt second purchase directly via DataManager
      const ok = dm.buyWardrobeItem('sailor_top', 'coins');
      expect(ok).toBe(false);
      expect(dm.getProfile().coins).toBe(420); // No deduction
      expect(dm.getProfile().ownedWardrobe?.filter((id) => id === 'sailor_top').length).toBe(1);
    });

    it('toggles action button text properly through: Not Owned -> Owned -> Equipped -> Unequipped', () => {
      dm.getProfile().coins = 500;
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('bottom');
      scene.selectWardrobeItem(0); // pleated_skirt (60 coins)

      // State 1: Unowned
      expect(scene.actionButton?.getText()).toBe('🪙 60 立即購買');
      expect(scene.actionButton?.getColor()).toBe('yellow');

      // Buy & auto-equip
      scene.handleActionClick();

      // State 2: Equipped
      expect(dm.getEquippedWardrobe().bottom).toBe('pleated_skirt');
      scene.updatePreviewDisplay();
      expect(scene.actionButton?.getText()).toBe('❌ 脫下衣物');
      expect(scene.actionButton?.getColor()).toBe('red');

      // State 3: Unequip
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().bottom).toBeUndefined();
      scene.updatePreviewDisplay();

      // State 4: Owned but unequipped
      expect(scene.actionButton?.getText()).toBe('👗 立即換上');
      expect(scene.actionButton?.getColor()).toBe('green');

      // State 5: Equip again
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().bottom).toBe('pleated_skirt');
      scene.updatePreviewDisplay();
      expect(scene.actionButton?.getText()).toBe('❌ 脫下衣物');
    });
  });

  // =========================================================================
  // 2. MUTUAL EXCLUSIVITY LOGIC (DRESS vs TOP / BOTTOM)
  // =========================================================================
  describe('2. Mutual Exclusivity Logic', () => {
    it('equipping a dress MUST immediately unequip top and bottom', () => {
      dm.getProfile().ownedWardrobe = ['sailor_top', 'pleated_skirt', 'princess_dress'];
      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('bottom', 'pleated_skirt');

      expect(dm.getEquippedWardrobe().top).toBe('sailor_top');
      expect(dm.getEquippedWardrobe().bottom).toBe('pleated_skirt');
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();

      // Equip dress
      const ok = dm.equipWardrobeItem('dress', 'princess_dress');
      expect(ok).toBe(true);

      const eq = dm.getEquippedWardrobe();
      expect(eq.dress).toBe('princess_dress');
      expect(eq.top).toBeUndefined();
      expect(eq.bottom).toBeUndefined();
    });

    it('equipping a top MUST immediately unequip any dress', () => {
      dm.getProfile().ownedWardrobe = ['magic_robe', 'hk_school_shirt'];
      dm.equipWardrobeItem('dress', 'magic_robe');

      expect(dm.getEquippedWardrobe().dress).toBe('magic_robe');

      // Equip top
      const ok = dm.equipWardrobeItem('top', 'hk_school_shirt');
      expect(ok).toBe(true);

      const eq = dm.getEquippedWardrobe();
      expect(eq.top).toBe('hk_school_shirt');
      expect(eq.dress).toBeUndefined();
    });

    it('equipping a bottom MUST immediately unequip any dress', () => {
      dm.getProfile().ownedWardrobe = ['dino_onesie', 'denim_shorts'];
      dm.equipWardrobeItem('dress', 'dino_onesie');

      expect(dm.getEquippedWardrobe().dress).toBe('dino_onesie');

      // Equip bottom
      const ok = dm.equipWardrobeItem('bottom', 'denim_shorts');
      expect(ok).toBe(true);

      const eq = dm.getEquippedWardrobe();
      expect(eq.bottom).toBe('denim_shorts');
      expect(eq.dress).toBeUndefined();
    });

    it('preserves accessory, hat, and wings when switching between dress and top/bottom', () => {
      dm.getProfile().ownedWardrobe = [
        'cat_ears',
        'angel_wings',
        'star_glasses',
        'scholar_robe',
        'sport_jersey',
        'sport_shorts',
      ];
      dm.equipWardrobeItem('hat', 'cat_ears');
      dm.equipWardrobeItem('wings', 'angel_wings');
      dm.equipWardrobeItem('accessory', 'star_glasses');

      // Equip dress
      dm.equipWardrobeItem('dress', 'scholar_robe');
      let eq = dm.getEquippedWardrobe();
      expect(eq.hat).toBe('cat_ears');
      expect(eq.wings).toBe('angel_wings');
      expect(eq.accessory).toBe('star_glasses');
      expect(eq.dress).toBe('scholar_robe');

      // Switch to Top & Bottom
      dm.equipWardrobeItem('top', 'sport_jersey');
      dm.equipWardrobeItem('bottom', 'sport_shorts');
      eq = dm.getEquippedWardrobe();
      expect(eq.hat).toBe('cat_ears');
      expect(eq.wings).toBe('angel_wings');
      expect(eq.accessory).toBe('star_glasses');
      expect(eq.top).toBe('sport_jersey');
      expect(eq.bottom).toBe('sport_shorts');
      expect(eq.dress).toBeUndefined();

      // Switch back to dress
      dm.equipWardrobeItem('dress', 'scholar_robe');
      eq = dm.getEquippedWardrobe();
      expect(eq.hat).toBe('cat_ears');
      expect(eq.wings).toBe('angel_wings');
      expect(eq.accessory).toBe('star_glasses');
      expect(eq.dress).toBe('scholar_robe');
      expect(eq.top).toBeUndefined();
      expect(eq.bottom).toBeUndefined();
    });

    it('clearAllWardrobe completely empties equipped wardrobe', () => {
      dm.getProfile().equippedWardrobe = {
        hat: 'cat_ears',
        wings: 'angel_wings',
        dress: 'princess_dress',
      };
      dm.clearAllWardrobe();
      expect(dm.getEquippedWardrobe()).toEqual({});
    });
  });

  // =========================================================================
  // 3. MULTI-SLOT FULL SETS & ACCESSORY CONTROLLING
  // =========================================================================
  describe('3. Multi-slot Full Sets & Accessory Contention Analysis', () => {
    it('correctly maps accessory sub-types to wings, hat, and generic accessory in ShopScene', () => {
      dm.getProfile().coins = 5000;
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('accessory');

      // 0: angel_wings -> slot 'wings'
      scene.selectWardrobeItem(0);
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().wings).toBe('angel_wings');

      // 1: cat_ears -> slot 'hat'
      scene.selectWardrobeItem(1);
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().hat).toBe('cat_ears');

      // 2: scholar_cap -> slot 'hat' (replaces cat_ears)
      scene.selectWardrobeItem(2);
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().hat).toBe('scholar_cap');

      // 4: star_glasses -> slot 'accessory'
      scene.selectWardrobeItem(4);
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().accessory).toBe('star_glasses');
    });

    it('verifies slot collision between star_glasses and star_backpack in current architecture', () => {
      dm.getProfile().coins = 5000;
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('accessory');

      // Equip star_glasses (idx 4)
      scene.selectWardrobeItem(4);
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().accessory).toBe('star_glasses');

      // Equip star_backpack (idx 5) -> both use slot 'accessory', so star_backpack overwrites star_glasses
      scene.selectWardrobeItem(5);
      scene.handleActionClick();
      expect(dm.getEquippedWardrobe().accessory).toBe('star_backpack');

      // Note: In current EquippedWardrobe interface, 'accessory' is a single slot shared between glasses and backpack.
      // Confirming whether both can coexist in profile:
      const eq = dm.getEquippedWardrobe();
      expect(eq.accessory).toBe('star_backpack');
    });

    it('renders all full set combinations in CharacterOutfitCompositor without error', () => {
      const mockGraphics = {
        clear: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        fillEllipse: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        strokePath: vi.fn().mockReturnThis(),
        fillPath: vi.fn().mockReturnThis(),
        beginPath: vi.fn().mockReturnThis(),
        moveTo: vi.fn().mockReturnThis(),
        lineTo: vi.fn().mockReturnThis(),
        closePath: vi.fn().mockReturnThis(),
        lineBetween: vi.fn().mockReturnThis(),
      } as any;

      // Full Set 1: Top + Bottom + Hat + Wings + Glasses
      const set1: EquippedWardrobe = {
        top: 'sailor_top',
        bottom: 'pleated_skirt',
        hat: 'scholar_cap',
        wings: 'angel_wings',
        accessory: 'star_glasses',
      };
      expect(() => CharacterOutfitCompositor.renderOutfit(mockGraphics, set1)).not.toThrow();

      // Full Set 2: Dress + Hat + Wings + Backpack
      const set2: EquippedWardrobe = {
        dress: 'magic_robe',
        hat: 'cat_ears',
        wings: 'angel_wings',
        accessory: 'star_backpack',
      };
      expect(() => CharacterOutfitCompositor.renderOutfit(mockGraphics, set2)).not.toThrow();

      // Test every single item in WARDROBE_ITEMS with compositor
      WARDROBE_ITEMS.forEach((item) => {
        const singleEquip: EquippedWardrobe = {};
        if (item.category === 'dress') singleEquip.dress = item.id;
        else if (item.category === 'top') singleEquip.top = item.id;
        else if (item.category === 'bottom') singleEquip.bottom = item.id;
        else if (item.category === 'accessory') {
          if (item.id === 'angel_wings') singleEquip.wings = item.id;
          else if (['cat_ears', 'scholar_cap', 'tram_hat'].includes(item.id)) singleEquip.hat = item.id;
          else singleEquip.accessory = item.id;
        }
        expect(() => CharacterOutfitCompositor.renderOutfit(mockGraphics, singleEquip)).not.toThrow();
      });
    });
  });

  // =========================================================================
  // 4. LOCALSTORAGE PERSISTENCE & CROSS-SESSION RESTORATION
  // =========================================================================
  describe('4. LocalStorage Persistence & Cross-Session Restoration', () => {
    it('persists and restores complete wardrobe state across sessions', () => {
      dm.getProfile().coins = 1000;
      dm.getProfile().gems = 100;
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.buyWardrobeItem('angel_wings', 'coins');
      dm.buyWardrobeItem('cat_ears', 'coins');
      dm.equipWardrobeItem('dress', 'princess_dress');
      dm.equipWardrobeItem('wings', 'angel_wings');
      dm.equipWardrobeItem('hat', 'cat_ears');

      // Create new DataManager instance to simulate app reload
      const savedRaw = localStorage.getItem('p1_adventure_save_v1');
      expect(savedRaw).not.toBeNull();
      const parsed = JSON.parse(savedRaw!);
      expect(parsed.ownedWardrobe).toEqual(['princess_dress', 'angel_wings', 'cat_ears']);
      expect(parsed.equippedWardrobe).toEqual({
        dress: 'princess_dress',
        wings: 'angel_wings',
        hat: 'cat_ears',
      });

      // Reload
      (DataManager as any).instance = null;
      const dm2 = DataManager.getInstance();
      expect(dm2.getEquippedWardrobe()).toEqual({
        dress: 'princess_dress',
        wings: 'angel_wings',
        hat: 'cat_ears',
      });
      expect(dm2.getProfile().ownedWardrobe).toEqual(['princess_dress', 'angel_wings', 'cat_ears']);
    });

    it('safely heals corrupted or missing equippedWardrobe in localStorage', () => {
      // Corrupt localStorage with invalid non-object equippedWardrobe
      const corruptedData = {
        coins: 100,
        gems: 10,
        equippedWardrobe: 'malformed_string',
        ownedWardrobe: 'not_an_array',
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(corruptedData));

      (DataManager as any).instance = null;
      const dm2 = DataManager.getInstance();

      expect(dm2.getEquippedWardrobe()).toEqual({});
      expect(dm2.getProfile().ownedWardrobe).toEqual([]);
      expect(dm2.isWardrobeOwned('princess_dress')).toBe(false);
    });

    it('safely handles null equippedWardrobe in localStorage', () => {
      const corruptedData = {
        coins: 100,
        gems: 10,
        equippedWardrobe: null,
        ownedWardrobe: null,
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(corruptedData));

      (DataManager as any).instance = null;
      const dm2 = DataManager.getInstance();

      expect(dm2.getEquippedWardrobe()).toEqual({});
      expect(dm2.getProfile().ownedWardrobe).toEqual([]);
    });
  });

  // =========================================================================
  // 5. BILINGUAL AUDIO & SPEECH SYNTHESIS
  // =========================================================================
  describe('5. Bilingual Audio & SpeechService Pronunciation', () => {
    it('verifies all 18 wardrobe items have valid speakEn and speakZh', () => {
      expect(WARDROBE_ITEMS.length).toBe(18);

      WARDROBE_ITEMS.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.speakEn).toBeTruthy();
        expect(item.speakEn.length).toBeGreaterThan(1);
        expect(item.speakZh).toBeTruthy();
        expect(item.speakZh.length).toBeGreaterThan(1);
      });
    });

    it('invokes bilingual speech synthesis on wardrobe item selection', () => {
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('dress');

      scene.selectWardrobeItem(0); // princess_dress

      expect(SpeechService.speak).toHaveBeenCalledWith(
        'Princess Dress, 公主連身裙',
        'zh-HK'
      );
    });

    it('pronounces top, bottom, and accessory items correctly upon selection', () => {
      scene.create();
      scene.switchTab('wardrobe');

      // Top: sailor_top
      scene.switchWardrobeCategory('top');
      scene.selectWardrobeItem(0);
      expect(SpeechService.speak).toHaveBeenCalledWith('Sailor Shirt, 水手襯衫', 'zh-HK');

      // Bottom: pleated_skirt
      scene.switchWardrobeCategory('bottom');
      scene.selectWardrobeItem(0);
      expect(SpeechService.speak).toHaveBeenCalledWith('Pleated Skirt, 百褶短裙', 'zh-HK');

      // Accessory: angel_wings
      scene.switchWardrobeCategory('accessory');
      scene.selectWardrobeItem(0);
      expect(SpeechService.speak).toHaveBeenCalledWith('Angel Wings, 天使羽翼', 'zh-HK');
    });

    it('speaks Cantonese praise on successful wardrobe purchase or equip', () => {
      dm.getProfile().coins = 1000;
      scene.create();
      scene.switchTab('wardrobe');
      scene.switchWardrobeCategory('top');
      scene.selectWardrobeItem(0);

      vi.mocked(SpeechService.speak).mockClear();
      scene.handleActionClick();

      expect(SpeechService.speak).toHaveBeenCalled();
      const lastCall = vi.mocked(SpeechService.speak).mock.calls[0];
      expect(lastCall[1]).toBe('zh-HK');
    });
  });
});
