import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager } from '../services/DataManager';
import { AVATAR_SKIN_CONFIGS, PlayerAvatarService } from '../services/PlayerAvatarService';
import { OUTFIT_DEFINITIONS } from '../config/outfits';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { PlayerAvatarBadge } from '../ui/PlayerAvatarBadge';
import { TitleScene } from '../scenes/TitleScene';
import { MapScene } from '../scenes/MapScene';
import { QuestionScene } from '../scenes/QuestionScene';
import { CHARACTER_SKINS, ShopScene } from '../scenes/ShopScene';
import { SKIN_CONFIGS } from '../scenes/RunnerScene';
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

    it('resolves the base skin jump pose instead of falling back to idle art', () => {
      const service = PlayerAvatarService.getInstance();
      const texInfo = service.getTextureKey('jump');

      expect(texInfo.isFullSprite).toBe(false);
      expect(texInfo.textureKey).toBe('adventurer_jump');
      expect(service.getTextureKey('idle').textureKey).toBe('adventurer_stand');
      expect(service.getTextureKey('run').textureKey).toBe('adventurer_walk1');
      expect(service.getTextureKey('cheer').textureKey).toBe('adventurer_cheer1');
    });

    it.each(CHARACTER_SKINS.map(skin => skin.id))(
      'keeps %s pose texture keys aligned across avatar, Runner, and Shop',
      (skinId) => {
        const dm = DataManager.getInstance();
        dm.getProfile().equippedSkin = skinId;

        const avatar = AVATAR_SKIN_CONFIGS[skinId];
        const runner = SKIN_CONFIGS[skinId];
        const shop = CHARACTER_SKINS.find(skin => skin.id === skinId)!;
        const service = PlayerAvatarService.getInstance();

        expect(avatar).toBeDefined();
        expect(runner).toBeDefined();
        expect(service.getTextureKey('idle').textureKey).toBe(shop.standSprite);
        expect(service.getTextureKey('idle').textureKey).toBe(avatar.idleKey);
        expect(service.getTextureKey('run').textureKey).toBe(shop.walkSprites[0]);
        expect(service.getTextureKey('run').textureKey).toBe(avatar.runKey);
        expect(service.getTextureKey('run').textureKey).toBe(runner.walk1Key);
        expect(service.getTextureKey('jump').textureKey).toBe(avatar.jumpKey);
        expect(service.getTextureKey('jump').textureKey).toBe(runner.jumpKey);
        expect(service.getTextureKey('cheer').textureKey).toBe(shop.cheerSprite);
        expect(service.getTextureKey('cheer').textureKey).toBe(avatar.cheerKey);
        expect(service.getTextureKey('cheer').textureKey).toBe(runner.cheerKey);
      }
    );

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

    it('keeps Heroine identity when an Adventurer-only full-body outfit is equipped', () => {
      const dm = DataManager.getInstance();
      dm.unlockSkin('heroine', 0, 0);
      dm.equipSkin('heroine');
      dm.getProfile()!.ownedWardrobe!.push('scholar_robe');
      dm.equipWardrobeItem('dress', 'scholar_robe');

      const scene = {
        textures: {
          exists: vi.fn(() => true),
        },
      } as never;
      const texInfo = PlayerAvatarService.getInstance().getTextureKey('idle', scene);

      expect(texInfo.isFullSprite).toBe(false);
      expect(texInfo.textureKey).toBe('female_stand');
    });

    it('uses the base pose when a full-body top is combined with a bottom', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('hk_school_shirt', 'denim_shorts');
      dm.equipWardrobeItem('top', 'hk_school_shirt');
      dm.equipWardrobeItem('bottom', 'denim_shorts');

      const scene = {
        textures: {
          exists: vi.fn((key: string) => key.includes('school_uniform/idle.png')),
        },
      } as never;
      const appearance = PlayerAvatarService.getInstance().getAppearance();
      const texInfo = PlayerAvatarService.getInstance().getTextureKey('idle', scene);

      expect(appearance.outfitDefinition).toBeUndefined();
      expect(texInfo.isFullSprite).toBe(false);
      expect(texInfo.textureKey).toBe('adventurer_stand');
    });

    it('never resolves a catalog thumbnail as dedicated wearing art', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('scholar_robe');
      dm.equipWardrobeItem('dress', 'scholar_robe');

      const scholar = OUTFIT_DEFINITIONS.find(definition => definition.id === 'scholar_robe')!;
      const originalIdle = scholar.assets.idle;
      const thumbnail = scholar.assets.thumbnail!;
      scholar.assets.idle = thumbnail;

      try {
        const scene = {
          textures: {
            exists: vi.fn((key: string) => key === thumbnail),
          },
        } as never;
        const texInfo = PlayerAvatarService.getInstance().getTextureKey('idle', scene);

        expect(texInfo.isFullSprite).toBe(false);
        expect(texInfo.textureKey).toBe('adventurer_stand');
      } finally {
        scholar.assets.idle = originalIdle;
      }
    });

    it('does not treat placeholder Star Hoodie artwork as a full outfit sprite', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('hoodie_star');
      dm.equipWardrobeItem('top', 'hoodie_star');

      const texInfo = PlayerAvatarService.getInstance().getTextureKey('idle');

      expect(texInfo.isFullSprite).toBe(false);
      expect(texInfo.textureKey).toBe('adventurer_stand');
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

    it('does not treat duplicate outfit run art as authored motion', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('scholar_robe');
      dm.equipWardrobeItem('dress', 'scholar_robe');

      const scene = {
        textures: {
          exists: vi.fn((key: string) => key.includes('/idle.png') || key.includes('/run.png')),
        },
      } as never;
      const texInfo = PlayerAvatarService.getInstance().getTextureKey('run', scene);

      expect(texInfo.isFullSprite).toBe(true);
      expect(texInfo.textureKey).toBe('assets/character/outfits/scholar_gown/idle.png');
      expect(texInfo.poseFallback).toBe(true);
    });

    it('uses an explicit dedicated jump outfit asset before run and idle fallbacks', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('dino_onesie');
      dm.equipWardrobeItem('dress', 'dino_onesie');

      const dino = OUTFIT_DEFINITIONS.find(definition => definition.id === 'dino_onesie')!;
      const assets = dino.assets as typeof dino.assets & { jump?: string };
      const previousJumpAsset = assets.jump;
      assets.jump = 'assets/character/outfits/dino_onesie/jump.png';

      try {
        const scene = {
          textures: {
            exists: vi.fn((key: string) => key === assets.jump),
          },
        } as never;
        const texInfo = PlayerAvatarService.getInstance().getTextureKey('jump', scene);

        expect(texInfo.isFullSprite).toBe(true);
        expect(texInfo.textureKey).toBe(assets.jump);
      } finally {
        if (previousJumpAsset) assets.jump = previousJumpAsset;
        else delete assets.jump;
      }
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

    it('fits a 512px dedicated outfit sprite inside the compact badge', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('scholar_robe');
      dm.equipWardrobeItem('dress', 'scholar_robe');

      const scene = createMockSceneForMeta('TestScene');
      scene.textures.exists = vi.fn((key: string) =>
        key.includes('assets/character/outfits/scholar_gown/idle.png')
      );
      scene.textures.get = vi.fn(() => ({
        getSourceImage: () => ({ width: 512, height: 512 }),
      }));

      const badge = new PlayerAvatarBadge(scene as never, { x: 200, y: 150, size: 56 });
      const targetDiameter = 56 * 0.85;

      expect(badge.avatarSprite?.scaleX).toBeCloseTo(targetDiameter / 512, 5);
      expect(badge.avatarSprite?.scaleY).toBeCloseTo(targetDiameter / 512, 5);
    });

    it('keeps badge accessory passes on the same vertical offset as the avatar sprite', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('sailor_top', 'star_backpack');
      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('accessory', 'star_backpack');

      const scene = createMockSceneForMeta('TestScene');
      const badge = new PlayerAvatarBadge(scene as never, { x: 200, y: 150, size: 56 });
      const avatarOffsetY = 56 * 0.1 / 2;

      expect(badge.avatarSprite?.y).toBeCloseTo(avatarOffsetY, 5);
      expect(badge.backOutfitGraphics?.setPosition).toHaveBeenCalledWith(0, avatarOffsetY);
      expect(badge.outfitGraphics?.setPosition).toHaveBeenCalledWith(0, avatarOffsetY);
    });

    it('executes cheer() and think() reaction tweens', () => {
      const scene = createMockSceneForMeta('TestScene');
      const badge = new PlayerAvatarBadge(scene as never, { x: 200, y: 150 });

      badge.cheer();
      expect(scene.tweens.add).toHaveBeenCalled();

      badge.think();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('suppresses non-essential badge motion when reduced motion is requested', () => {
      const previousMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn(() => ({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      try {
        const scene = createMockSceneForMeta('TestScene');
        const badge = new PlayerAvatarBadge(scene as never, { x: 200, y: 150 });

        badge.cheer();
        badge.think();

        expect(scene.tweens.add).not.toHaveBeenCalled();
      } finally {
        if (previousMatchMedia) {
          Object.defineProperty(window, 'matchMedia', previousMatchMedia);
        } else {
          delete (window as any).matchMedia;
        }
      }
    });

    it('renders modular wardrobe through the badge depth-aware fallback', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('sailor_top', 'star_backpack');
      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('accessory', 'star_backpack');

      const scene = createMockSceneForMeta('TestScene');
      const backSpy = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewBackAccessories');
      const outfitSpy = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewOutfit');
      const badge = new PlayerAvatarBadge(scene as never, { x: 200, y: 150, size: 56 });

      expect(badge.outfitGraphics).toBeDefined();
      expect(backSpy).toHaveBeenCalled();
      expect(outfitSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ top: 'sailor_top', accessory: 'star_backpack' }),
        expect.objectContaining({ includeBackAccessories: false })
      );

      badge.destroy();
      backSpy.mockRestore();
      outfitSpy.mockRestore();
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

    it('renders an equipped modular wardrobe on the title mascot', () => {
      const dm = DataManager.getInstance();
      dm.getProfile()!.ownedWardrobe!.push('sailor_top');
      dm.equipWardrobeItem('top', 'sailor_top');

      const scene = new TitleScene();
      const mockScene = createMockSceneForMeta('TitleScene');
      Object.assign(scene, mockScene);
      const outfitSpy = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewOutfit');

      scene.create();

      expect(outfitSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ top: 'sailor_top' }),
        expect.anything()
      );
      outfitSpy.mockRestore();
    });

    it('suppresses title ambient loops when reduced motion is enabled', () => {
      const scene = new TitleScene();
      const mockScene = createMockSceneForMeta('TitleScene');
      Object.assign(scene, mockScene);
      (scene as any).prefersReducedMotion = true;

      scene.create();

      const configs = mockScene.tweens.add.mock.calls.map(([config]: any[]) => config);
      expect(configs.some((config: any) => config.repeat === -1)).toBe(false);
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
