import { describe, it, expect, beforeEach } from 'vitest';
import { TitleScene } from '../scenes/TitleScene';
import { ShopScene } from '../scenes/ShopScene';
import { DataManager } from '../services/DataManager';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Specification V2 — Phase 4 Home & Collectible Presentation', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    DataManager.getInstance().reset();
  });

  describe('1. TitleScene Hero Composition & Action Hierarchy', () => {
    it('creates dominant Start Adventure CTA and balanced secondary actions', () => {
      const scene = new TitleScene();
      const mockScene = createMockSceneForMeta('TitleScene');
      Object.assign(scene, mockScene);

      scene.create();

      expect(scene.startButton).toBeDefined();
      expect(scene.reportButton).toBeDefined();
      expect(scene.shopButton).toBeDefined();
      expect(scene.trophyButton).toBeDefined();
      expect(scene.settingsButton).toBeDefined();
    });

    it('opens Report Modal when clicking report button', () => {
      const scene = new TitleScene();
      const mockScene = createMockSceneForMeta('TitleScene');
      Object.assign(scene, mockScene);

      scene.create();

      expect(scene.reportModal).toBeNull();
      scene.openReportModal();
      expect(scene.reportModal).toBeDefined();
      expect(scene.reportModal?.isOpen()).toBe(true);
    });
  });

  describe('2. ShopScene Authoritative State & Non-Mutating Preview', () => {
    it('passes the P0 reproduction test: selecting, previewing, and navigating never transacts', () => {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();
      profile.coins = 661;
      profile.gems = 22;
      profile.ownedSkins = ['adventurer'];
      profile.equippedSkin = 'adventurer';
      dm.save();

      const scene = new ShopScene();
      const mockScene = createMockSceneForMeta('ShopScene');
      Object.assign(scene, mockScene);

      scene.create();

      // Step 1: Select Heroine index 1 (costs 30 gems, player only has 22)
      scene.selectSkin(1);

      // Verify preview state is active
      expect(scene.selectedSkinIndex).toBe(1);
      expect(scene.skins[scene.selectedSkinIndex].id).toBe('heroine');

      // Verify NO purchase occurred and NO currencies were deducted
      const currentProfile = dm.getProfile();
      expect(currentProfile.coins).toBe(661);
      expect(currentProfile.gems).toBe(22);
      expect(currentProfile.ownedSkins).toEqual(['adventurer']);
      expect(currentProfile.equippedSkin).toBe('adventurer');

      // Step 2: Switch tab to wardrobe and back
      scene.switchTab('wardrobe');
      expect(scene.currentTab).toBe('wardrobe');
      scene.switchTab('skins');
      expect(scene.currentTab).toBe('skins');

      // Currencies and ownership remain untouched
      expect(dm.getProfile().coins).toBe(661);
      expect(dm.getProfile().gems).toBe(22);
      expect(dm.getProfile().ownedSkins).toEqual(['adventurer']);
      expect(dm.getProfile().equippedSkin).toBe('adventurer');
    });

    it('confirms and executes purchase atomically when player has sufficient gems', () => {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();
      profile.gems = 50;
      profile.ownedSkins = ['adventurer'];
      profile.equippedSkin = 'adventurer';
      dm.save();

      const scene = new ShopScene();
      const mockScene = createMockSceneForMeta('ShopScene');
      Object.assign(scene, mockScene);

      scene.create();

      // Select Heroine index 1 (30 gems)
      scene.selectSkin(1);

      // Action button should show purchase with 30 gems
      expect(scene.actionButton?.getText()).toContain('30');

      // Execute purchase via handleActionClick
      scene.handleActionClick();

      // Verify atomic deduction (50 - 30 = 20 gems, +5 gems from first skin trophy unlock)
      expect(dm.getProfile().gems).toBe(25);
      expect(dm.getProfile().ownedSkins).toContain('heroine');
      expect(dm.getProfile().equippedSkin).toBe('heroine');
    });
  });

  describe('3. Pet Collection & Companion Presentation', () => {
    it('manages pet equip state and retrieves pet companion details correctly', () => {
      const dm = DataManager.getInstance();
      const pets = dm.getPets();
      expect(pets.length).toBeGreaterThanOrEqual(3);

      const mechaCat = pets.find((p) => p.id === 'mecha_cat')!;
      expect(mechaCat).toBeDefined();
      expect(mechaCat.name).toContain('機械貓');

      // Buy & Equip pet
      dm.addCoins(1000);
      const bought = dm.buyPet('mecha_cat', 'coins');
      expect(bought).toBe(true);
      dm.equipPet('mecha_cat');
      expect(dm.getEquippedPetId()).toBe('mecha_cat');

      const companion = dm.getPetCompanion();
      expect(companion).toBeDefined();
    });
  });
});
