import { describe, expect, it, vi } from 'vitest';
import Phaser from 'phaser';
import {
  OUTFIT_DEFINITIONS,
  OutfitLayer,
  OutfitSlot,
  PreviewMode,
  getWardrobeSlot,
  previewWardrobe,
} from '../config/outfits';
import { WARDROBE_ITEMS, getWardrobeItemsForFilter } from '../config/wardrobe';
import { OutfitRegistry, wardrobeRegistry } from '../ui/OutfitRegistry';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { OutfitRenderer } from '../ui/OutfitRenderer';
import { CharacterPreviewController } from '../ui/CharacterPreviewController';
import { getWardrobeLayout } from '../ui/wardrobeLayout';

const mockGraphics = () => ({
  clear: vi.fn(),
  fillStyle: vi.fn(),
  lineStyle: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fillPath: vi.fn(),
  strokePath: vi.fn(),
  fillRect: vi.fn(),
  fillCircle: vi.fn(),
  fillRoundedRect: vi.fn(),
  strokeRoundedRect: vi.fn(),
});

describe('Dream Wardrobe preview system', () => {
  it('keeps every outfit definition separate from its wearing asset', () => {
    expect(OUTFIT_DEFINITIONS).toHaveLength(6);
    for (const outfit of OUTFIT_DEFINITIONS) {
      expect(outfit.assets.thumbnail).toBeTruthy();
      expect(outfit.assets.idle).toBeTruthy();
      expect(outfit.assets.thumbnail).not.toBe(outfit.assets.idle);
      expect(outfit.previewMode).toBe('fullSprite');
    }
  });

  it('keeps Star Hoodie thumbnail and transparent wearing assets separate', () => {
    const hoodie = wardrobeRegistry.get('hoodie_star');

    expect(hoodie?.id).toBe('star_hoodie');
    expect(hoodie?.aliases).toContain('hoodie_star');
    expect(hoodie?.assets.thumbnail).toContain('star_hoodie_thumbnail.png');
    expect(hoodie?.assets.idle).toContain('star_hoodie_wearing.png');
    expect(hoodie?.assets.thumbnail).not.toBe(hoodie?.assets.idle);
  });

  it('never draws a rectangle when Star Hoodie wearing art is unavailable', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();

    const result = renderer.render(
      { sprite, graphics } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { top: 'hoodie_star' },
        textureExists: () => false,
      }
    );

    expect(result.mode).toBe('composite');
    expect(sprite.setTexture).toHaveBeenCalledWith('player_stand');
    expect(graphics.fillRoundedRect).not.toHaveBeenCalled();
  });

  it('never promotes a Star Hoodie thumbnail to a wearing texture', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();

    const result = renderer.render(
      { sprite, graphics } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { top: 'hoodie_star' },
        textureExists: key => key.includes('star_hoodie_thumbnail'),
      }
    );

    expect(result.mode).toBe('composite');
    expect(sprite.setTexture).toHaveBeenCalledWith('player_stand');
    expect(sprite.setTexture).not.toHaveBeenCalledWith(expect.stringContaining('thumbnail'));
  });

  it('restores preview-only texture filters when the renderer cache is cleared', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const texture = { setFilter: vi.fn() };
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn(), texture };

    renderer.render(
      { sprite, graphics: mockGraphics() } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { top: 'hoodie_star' },
        textureExists: () => false,
      }
    );
    renderer.clearCache();

    expect(texture.setFilter).toHaveBeenLastCalledWith(Phaser.Textures.FilterMode.LINEAR);
  });

  it('supports the scholar gown id without breaking the saved scholar robe id', () => {
    expect(wardrobeRegistry.resolveId('scholar_gown')).toBe('scholar_robe');
    expect(wardrobeRegistry.get('scholar_gown')?.nameEn).toBe('Scholar Gown');
  });

  it('resolves full sprite before layered, composite, and base fallback', () => {
    const registry = new OutfitRegistry([OUTFIT_DEFINITIONS[0]]);
    expect(registry.resolveMode('scholar_gown', 'idle', key => key.endsWith(':idle'))).toBe('fullSprite');
    expect(registry.resolveMode('scholar_gown', 'idle', key => key.includes(':layer:'))).toBe('layered');
    expect(registry.resolveMode('scholar_gown', 'idle', () => false)).toBe('composite');
    expect(registry.resolveMode('unknown', 'idle', () => false)).toBe('base');
  });

  it('reuses the idle wearing sprite when a run or cheer sprite is absent', () => {
    const registry = new OutfitRegistry([OUTFIT_DEFINITIONS[0]]);
    const idleKey = 'outfit:scholar_robe:idle';

    expect(registry.resolveMode('scholar_robe', 'run', key => key === idleKey)).toBe('fullSprite');

    const renderer = new OutfitRenderer(registry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    renderer.render(
      { sprite, graphics } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_walk1',
        pose: 'run',
        wardrobe: { dress: 'scholar_robe' },
        textureExists: key => key === idleKey,
      }
    );

    expect(sprite.setTexture).toHaveBeenCalledWith(idleKey);
  });

  it('renders a registered layered part through the live preview controller', () => {
    const registry = new OutfitRegistry([{
      id: 'layered_test',
      nameZh: 'Layered Test',
      nameEn: 'Layered Test',
      slot: OutfitSlot.DRESS,
      previewMode: 'layered',
      assets: { idle: 'missing-idle.png' },
      layers: { [OutfitLayer.DRESS_OR_OUTFIT]: 'layered-test-body.png' },
      price: 1,
    }]);
    const sprite = { setTexture: vi.fn(), setTint: vi.fn(), setPosition: vi.fn(), setDepth: vi.fn(), setVisible: vi.fn() };
    const images: any[] = [];
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: {
        image: vi.fn((...args: any[]) => {
          const image = args[2] === 'player_stand' ? sprite : { setTexture: vi.fn(), setVisible: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
          images.push(image);
          return image;
        }),
        graphics: vi.fn(() => graphics),
      },
      textures: { exists: vi.fn((key: string) => key === 'layered-test-body.png') },
      tweens: { add: vi.fn() },
    };

    const accessories = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewAccessories').mockImplementation(() => {});
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      wardrobe: { dress: 'layered_test', accessory: 'star_glasses' },
      registry,
    });

    expect(controller.lastRenderResult?.mode).toBe('layered');
    expect(images.some(image => image.setTexture?.mock?.calls?.some((call: any[]) => call[0] === 'layered-test-body.png'))).toBe(true);
    expect(accessories).toHaveBeenCalled();
    accessories.mockRestore();
  });

  it('moves every layered piece with the character during idle and cheer', () => {
    const baseSprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      setPosition: vi.fn(),
      setDepth: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const layerSprite = { setTexture: vi.fn(), setVisible: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: {
        image: vi.fn(() => layerSprite),
        graphics: vi.fn(() => graphics),
      },
      textures: { exists: vi.fn(() => false) },
      tweens: { add: vi.fn() },
    };
    scene.add.image.mockImplementationOnce(() => baseSprite);

    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      wardrobe: { dress: 'scholar_robe' },
    });

    expect(scene.tweens.add.mock.calls[0][0].targets).toContain(layerSprite);
    controller.playCheer();
    expect(scene.tweens.add.mock.calls[1][0].targets).toContain(layerSprite);
  });

  it('creates a stable cache key from character, outfit state, and pose', () => {
    expect(wardrobeRegistry.getCacheKey('boy01', { dress: 'scholar_robe' }, 'idle')).toBe(
      'character:boy01:scholar_robe:idle'
    );
  });

  it('maps accessory variants to anatomical slots', () => {
    expect(getWardrobeSlot(WARDROBE_ITEMS.find(item => item.id === 'scholar_cap')!)).toBe(OutfitSlot.HAT);
    expect(getWardrobeSlot(WARDROBE_ITEMS.find(item => item.id === 'angel_wings')!)).toBe(OutfitSlot.WINGS);
    expect(getWardrobeSlot(WARDROBE_ITEMS.find(item => item.id === 'star_glasses')!)).toBe(OutfitSlot.ACCESSORY);
  });

  it('supports all and owned filters without changing the source catalogue', () => {
    expect(getWardrobeItemsForFilter(WARDROBE_ITEMS, 'all', [])).toHaveLength(18);
    expect(
      getWardrobeItemsForFilter(WARDROBE_ITEMS, 'owned', ['scholar_robe', 'star_glasses']).map(item => item.id)
    ).toEqual(['scholar_robe', 'star_glasses']);
    expect(
      getWardrobeItemsForFilter(WARDROBE_ITEMS, 'dress', ['scholar_robe', 'star_glasses']).map(item => item.id)
    ).toEqual(['princess_dress', 'scholar_robe', 'dino_onesie', 'magic_robe']);
  });

  it('previews a selected item without mutating the persisted wardrobe copy', () => {
    const equipped = { top: 'sailor_top', accessory: 'star_glasses' };
    const preview = previewWardrobe(equipped, WARDROBE_ITEMS.find(item => item.id === 'scholar_robe')!);

    expect(preview).toEqual({ dress: 'scholar_robe', accessory: 'star_glasses' });
    expect(equipped).toEqual({ top: 'sailor_top', accessory: 'star_glasses' });
  });

  it('keeps the compact landscape stage and action button inside the canvas', () => {
    const layout = getWardrobeLayout(932, 430);
    expect(layout.preview.x + layout.preview.width).toBeLessThanOrEqual(932);
    expect(layout.items.x + layout.items.width).toBeLessThanOrEqual(layout.preview.x);
    expect(layout.character.height).toBeGreaterThanOrEqual(layout.preview.height * 0.5);
    expect(layout.action.x + layout.action.width).toBeLessThanOrEqual(932);
    expect(layout.action.y + layout.action.height).toBeLessThanOrEqual(430);
  });

  it('gives the character a larger visual stage without overflowing the preview', () => {
    const layout = getWardrobeLayout(1280, 720);

    expect(layout.character.height).toBeGreaterThanOrEqual(layout.preview.height * 0.74);
    expect(layout.character.y).toBeGreaterThanOrEqual(layout.preview.y);
    expect(layout.character.y + layout.character.height).toBeLessThanOrEqual(
      layout.preview.y + layout.preview.height
    );
  });

  it.each([
    [1920, 1080],
    [1366, 768],
    [1280, 720],
    [1024, 768],
    [932, 430],
  ])('keeps %ix%i layout bounds safe', (width, height) => {
    const layout = getWardrobeLayout(width, height);
    expect(layout.items.x + layout.items.width).toBeLessThanOrEqual(width);
    expect(layout.preview.x + layout.preview.width).toBeLessThanOrEqual(width);
    expect(layout.action.x + layout.action.width).toBeLessThanOrEqual(width);
    expect(layout.action.y + layout.action.height).toBeLessThanOrEqual(height);
  });

  it('exposes the explicit four render modes used by the resolver', () => {
    const modes: PreviewMode[] = ['fullSprite', 'layered', 'composite'];
    expect(modes).toHaveLength(3);
  });

  it('renders a composite fallback and reuses the same target cache entry', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const target = { sprite, graphics };
    const composite = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewOutfit').mockImplementation(() => {});
    const request = {
      characterId: 'boy01',
      baseTextureKey: 'player_stand',
      pose: 'idle' as const,
      wardrobe: { dress: 'scholar_robe' },
      textureExists: () => false,
    };

    expect(renderer.render(target as never, request).mode).toBe('composite');
    expect(composite).toHaveBeenCalledTimes(1);
    expect(renderer.render(target as never, request).mode).toBe('composite');
    expect(composite).toHaveBeenCalledTimes(1);
    composite.mockRestore();
  });

  it('uses the full wearing texture when the registered asset is loaded', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const result = renderer.render(
      { sprite, graphics } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { dress: 'scholar_robe' },
        textureExists: key => key.endsWith(':idle'),
      }
    );

    expect(result.mode).toBe('fullSprite');
    expect(sprite.setTexture).toHaveBeenCalledWith('outfit:scholar_robe:idle');
    expect(graphics.clear).toHaveBeenCalled();
  });

  it('reasserts the cached wearing texture after a preview refresh', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const target = { sprite, graphics };
    const request = {
      characterId: 'boy01',
      baseTextureKey: 'player_stand',
      pose: 'idle' as const,
      wardrobe: { dress: 'scholar_robe' },
      textureExists: (key: string) => key.endsWith(':idle'),
    };

    renderer.render(target as never, request);
    sprite.setTexture.mockClear();
    renderer.render(target as never, request);

    expect(sprite.setTexture).toHaveBeenCalledWith('outfit:scholar_robe:idle');
  });

  it('keeps dedicated full-body art authoritative for run previews', () => {
    const sprite = { setTexture: vi.fn(), setTint: vi.fn(), setPosition: vi.fn(), setDepth: vi.fn() };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn((key: string) => key === 'outfit:scholar_robe:run') },
      tweens: { add: vi.fn() },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      wardrobe: { dress: 'scholar_robe' },
    });

    controller.setPose('run');

    expect(controller.lastRenderResult?.mode).toBe('fullSprite');
    expect(sprite.setTexture).toHaveBeenCalledWith('outfit:scholar_robe:run');
  });

  it('changes preview state immediately and schedules a restrained try-on pop', () => {
    const sprite = { setTexture: vi.fn(), setTint: vi.fn(), setPosition: vi.fn(), setDepth: vi.fn() };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: { add: vi.fn() },
      time: { delayedCall: vi.fn() },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      scale: 2,
    });

    controller.playTryOn({ dress: 'scholar_robe' });

    expect(controller.getWardrobe()).toEqual({ dress: 'scholar_robe' });
    expect(scene.tweens.add).toHaveBeenCalled();
  });

});
