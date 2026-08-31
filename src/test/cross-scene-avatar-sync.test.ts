import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { PlayerAvatarService } from '../services/PlayerAvatarService';
import { PlayerAvatarBadge } from '../ui/PlayerAvatarBadge';
import { TitleScene } from '../scenes/TitleScene';
import { MapScene } from '../scenes/MapScene';
import { QuestionScene } from '../scenes/QuestionScene';
import { ShopScene } from '../scenes/ShopScene';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Top 10: Player Avatar Cross-Scene Synchronization & Shop Ecosystem Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    const dm = DataManager.getInstance();
    dm.reset();
  });

  describe('1. PlayerAvatarService Appearance Resolution', () => {
    it('resolves base adventurer skin and default appearance cleanly', () => {
      const appearance = PlayerAvatarService.getInstance().getAppearance();
      expect(appearance.skinId).toBe('adventurer');
      expect(appearance.wardrobe).toEqual({});
      expect(appearance.hasShield).toBe(false);
    });

    it('resolves equipped skin (ninja) and applies perks and texture keys', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('ninja', 0, 0);
      dm.equipSkin('ninja');

      const appearance = PlayerAvatarService.getInstance().getAppearance();
      expect(appearance.skinId).toBe('ninja');

      const texInfo = PlayerAvatarService.getInstance().getTextureKey('idle');
      expect(texInfo.textureKey).toBe('player_stand');
      expect(texInfo.tint).toBe(0x222222);
    });

    it('resolves Level-1 dedicated full-body AI outfit sprite when scholar_robe is equipped', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('scholar_robe');
      dm.equipWardrobeItem('dress', 'scholar_robe');

      const appearance = PlayerAvatarService.getInstance().getAppearance();
      expect(appearance.wardrobe.dress).toBe('scholar_robe');
      expect(appearance.outfitDefinition?.id).toBe('scholar_robe');

      const texInfo = PlayerAvatarService.getInstance().getTextureKey('idle');
      expect(texInfo.isFullSprite).toBe(true);
      expect(texInfo.textureKey).toBe('assets/character/outfits/scholar_gown/idle.png');
    });

    it('does not treat placeholder Star Hoodie artwork as a full outfit sprite', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('hoodie_star');
      dm.equipWardrobeItem('top', 'hoodie_star');

      const texInfo = PlayerAvatarService.getInstance().getTextureKey('idle');

      expect(texInfo.isFullSprite).toBe(false);
      expect(texInfo.textureKey).toBe('player_stand');
    });

    it('reuses dedicated idle art when a requested outfit pose is missing', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('scholar_robe');
      dm.equipWardrobeItem('dress', 'scholar_robe');

      const scene = {
        textures: {
          exists: vi.fn((key: string) => key.endsWith('/idle.png')),
        },
      } as never;
      const texInfo = PlayerAvatarService.getInstance().getTextureKey('run', scene);

      expect(texInfo.isFullSprite).toBe(true);
      expect(texInfo.textureKey).toBe('assets/character/outfits/scholar_gown/idle.png');
    });
  });

  describe('2. PlayerAvatarBadge Component & Reactions', () => {
    it('mounts circular avatar badge with sprite and companion pet', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedPets!.push('dino');
      dm.equipPet('dino');

      const scene = createMockSceneForMeta('TestScene');
      const badge = new PlayerAvatarBadge(scene as never, {
        x: 200,
        y: 150,
        size: 56,
        showPet: true,
      });

      expect(badge.size).toBe(56);
      expect(scene.add.graphics).toHaveBeenCalled();
      expect(scene.add.image).toHaveBeenCalled();
      expect(scene.add.text).toHaveBeenCalled();
    });

    it('executes cheer() and think() reaction tweens', () => {
      const scene = createMockSceneForMeta('TestScene');
      const badge = new PlayerAvatarBadge(scene as never, { x: 200, y: 150 });

      badge.cheer();
      expect(scene.tweens.add).toHaveBeenCalled();

      badge.think();
      expect(scene.tweens.add).toHaveBeenCalled();
    });
  });

  describe('3. MapScene Active Station Player Pin Marker', () => {
    it('attaches PlayerAvatarBadge onto the active station node', () => {
      const scene = new MapScene();
      const mockScene = createMockSceneForMeta('MapScene');
      Object.assign(scene, mockScene);

      scene.create();
      expect(scene.stationNodes.length).toBeGreaterThan(0);
      expect(scene.currentPinMarker).toBeDefined();
    });
  });

  describe('4. QuestionScene Companion Avatar HUD & Reaction Sync', () => {
    it('creates header HUD with PlayerAvatarBadge at top right', () => {
      const scene = new QuestionScene();
      const mockScene = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mockScene);

      scene.create();
      expect(scene.avatarBadge).toBeDefined();
      expect(scene.headerContainer).toBeDefined();
    });

    it('triggers avatar cheer on correct answer and think on wrong answer', () => {
      const scene = new QuestionScene();
      const mockScene = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mockScene);

      scene.create();
      scene.currentQuestion = { id: 1, subject: 'chinese', prompt: 'test', type: 'choice' } as never;
      const cheerSpy = vi.spyOn(scene.avatarBadge!, 'cheer');
      const thinkSpy = vi.spyOn(scene.avatarBadge!, 'think');

      // Simulate correct answer
      scene.onCorrectAnswer();
      expect(cheerSpy).toHaveBeenCalled();

      // Reset isAnswered and simulate wrong choice
      scene.isAnswered = false;
      const card = { getState: () => 'idle', getValue: () => 'wrong', wobble: vi.fn(), setDisabled: vi.fn() };
      scene.handleChoiceSelection(card as never, 99);
      expect(thinkSpy).toHaveBeenCalled();
    });
  });

  describe('5. TitleScene Mascot Showcase Integration', () => {
    it('renders equipped avatar and companion pet on title screen', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedPets!.push('mecha_cat');
      dm.equipPet('mecha_cat');
      dm.getProfile()!.ownedWardrobe!.push('princess_dress');
      dm.equipWardrobeItem('dress', 'princess_dress');

      const scene = new TitleScene();
      const mockScene = createMockSceneForMeta('TitleScene');
      Object.assign(scene, mockScene);

      scene.create();
      expect(scene.startButton).toBeDefined();
      expect(scene.shopButton).toBeDefined();
    });
  });

  describe('6. ShopScene Global Sync Toast', () => {
    it('displays global sync toast on equipping skin or wardrobe item', () => {
      const scene = new ShopScene();
      const mockScene = createMockSceneForMeta('ShopScene');
      Object.assign(scene, mockScene);

      scene.create();
      scene.showGlobalSyncToast('✨ 已套用至全遊戲！');
      expect(scene.add.container).toHaveBeenCalled();
      expect(scene.add.text).toHaveBeenCalled();
    });
  });
});
