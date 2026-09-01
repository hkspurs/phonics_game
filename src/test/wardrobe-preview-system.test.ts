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
import { CharacterOutfitCompositor, FULL_SPRITE_LOCAL_SCALE } from '../ui/CharacterOutfitCompositor';
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
  strokeCircle: vi.fn(),
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
    expect(wardrobeRegistry.get('school_uniform')?.assets.thumbnail)
      .toBe('assets/outfits/school_uniform/thumbnail.png');
  });

  it('keeps Star Hoodie thumbnail and transparent wearing assets separate', () => {
    const hoodie = wardrobeRegistry.get('hoodie_star');

    expect(hoodie?.id).toBe('star_hoodie');
    expect(hoodie?.aliases).toContain('hoodie_star');
    expect(hoodie?.assets.thumbnail).toContain('star_hoodie_thumbnail.png');
    expect(hoodie?.assets.idle).toContain('star_hoodie_wearing.png');
    expect(hoodie?.assets.thumbnail).not.toBe(hoodie?.assets.idle);
    expect(hoodie?.thumbnailStatus).toBe('placeholder');
  });

  it('rejects a catalog thumbnail if metadata accidentally reuses it as idle wearing art', () => {
    const registry = new OutfitRegistry([{
      ...OUTFIT_DEFINITIONS[0],
      id: 'catalog-copy-regression',
      assets: {
        ...OUTFIT_DEFINITIONS[0].assets,
        thumbnail: 'assets/outfits/catalog-copy/thumbnail.png',
        idle: 'assets/outfits/catalog-copy/thumbnail.png',
      },
    }]);

    expect(registry.getAssetPaths('catalog-copy-regression', 'idle')).toEqual([]);
    expect(
      registry.isWearingArtworkReady(
        'catalog-copy-regression',
        key => key === 'assets/outfits/catalog-copy/thumbnail.png'
      )
    ).toBe(false);
    expect(
      registry.resolveMode(
        'catalog-copy-regression',
        'idle',
        key => key === 'assets/outfits/catalog-copy/thumbnail.png'
      )
    ).toBe('composite');
    expect(
      registry.resolveMode(
        'catalog-copy-regression',
        'idle',
        key => key === 'outfit:catalog-copy-regression:idle'
      )
    ).toBe('composite');
  });

  it('marks Star Hoodie unavailable until formal wearing artwork is delivered', () => {
    expect(wardrobeRegistry.isWearingArtworkReady('hoodie_star')).toBe(false);
    expect(wardrobeRegistry.isWearingArtworkReady('scholar_robe')).toBe(true);
  });

  it('does not expose placeholder wearing paths to direct registry callers', () => {
    expect(wardrobeRegistry.getAssetPaths('hoodie_star', 'idle')).toEqual([]);
    expect(wardrobeRegistry.getAssetPath('hoodie_star', 'idle')).toBeUndefined();
    expect(wardrobeRegistry.getAssetKeys('hoodie_star', 'idle')).toEqual([]);
  });

  it('does not expose placeholder layered candidates to direct callers', () => {
    const registry = new OutfitRegistry([{
      ...OUTFIT_DEFINITIONS.find(definition => definition.id === 'star_hoodie')!,
      layers: { [OutfitLayer.DRESS_OR_OUTFIT]: 'stale-hoodie-layer.png' },
    }]);

    expect(registry.getLayerAssetPaths('star_hoodie')).toEqual([]);
    expect(registry.getLayerAssetKeys('star_hoodie')).toEqual([]);
    expect(registry.resolveMode('star_hoodie', 'idle', key => key.includes('layer'))).toBe('composite');
  });

  it('never promotes a catalog thumbnail through layered fallback', () => {
    const thumbnail = 'assets/outfits/layered-copy/thumbnail.png';
    const registry = new OutfitRegistry([{
      ...OUTFIT_DEFINITIONS.find(definition => definition.id === 'scholar_robe')!,
      id: 'layered-catalog-copy',
      previewMode: 'layered',
      assets: {
        ...OUTFIT_DEFINITIONS.find(definition => definition.id === 'scholar_robe')!.assets,
        thumbnail,
      },
      layers: { [OutfitLayer.DRESS_OR_OUTFIT]: thumbnail },
    }]);

    expect(registry.getLayerAssetPaths('layered-catalog-copy')).toEqual([]);
    expect(registry.getLayerAssetKeys('layered-catalog-copy')).toEqual([]);
    expect(
      registry.resolveMode(
        'layered-catalog-copy',
        'idle',
        key => key.includes('thumbnail') || key.includes(':layer:')
      )
    ).toBe('composite');
  });

  it('treats an unknown outfit as compositor-backed but not wearing texture-ready', () => {
    expect(wardrobeRegistry.isWearingArtworkReady('stale-outfit-id')).toBe(true);
    expect(wardrobeRegistry.isWearingTextureReady('stale-outfit-id')).toBe(false);
  });

  it('keeps wearing readiness independent from a missing catalog thumbnail', () => {
    expect(
      wardrobeRegistry.isWearingTextureReady(
        'scholar_robe',
        key => key.endsWith('/idle.png')
      )
    ).toBe(true);
    expect(
      wardrobeRegistry.isWearingArtworkReady(
        'scholar_robe',
        key => key.endsWith('/idle.png')
      )
    ).toBe(false);
  });

  it('requires both thumbnail and idle wearing textures when live art is checked', () => {
    expect(wardrobeRegistry.isWearingArtworkReady('scholar_robe', () => false)).toBe(false);
    expect(
      wardrobeRegistry.isWearingArtworkReady(
        'scholar_robe',
        key => key.includes('thumbnail') || key.includes('/idle.png')
      )
    ).toBe(true);
  });

  it('fits layered 512px outfit parts to the same local scale as full-sprite art', () => {
    const layerPath = 'assets/character/outfits/layered_sample/dress_front.png';
    const registry = new OutfitRegistry([{
      id: 'layered-sample',
      nameZh: '分層測試服裝',
      nameEn: 'Layered Sample',
      slot: OutfitSlot.DRESS,
      previewMode: 'layered',
      assets: { thumbnail: 'assets/outfits/layered_sample/thumbnail.png' },
      layers: { [OutfitLayer.DRESS_OR_OUTFIT]: layerPath },
      price: 0,
    }]);
    const renderer = new OutfitRenderer(registry);
    const sprite = { setTexture: vi.fn(), setScale: vi.fn(), setVisible: vi.fn() };
    const layerSprite = { setTexture: vi.fn(), setScale: vi.fn(), setVisible: vi.fn() };

    const result = renderer.render(
      {
        sprite,
        graphics: mockGraphics(),
        layerSprites: { [OutfitLayer.DRESS_OR_OUTFIT]: layerSprite },
      } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { dress: 'layered-sample' },
        textureExists: key => key === layerPath,
        scale: 2,
      }
    );

    expect(result.mode).toBe('layered');
    expect(layerSprite.setScale).toHaveBeenCalledWith(FULL_SPRITE_LOCAL_SCALE * 2);
    expect(layerSprite.setVisible).toHaveBeenCalledWith(true);
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

  it('keeps placeholder wearing paths out of the full-sprite mode', () => {
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
        textureExists: key => key.includes('star_hoodie_wearing'),
      }
    );

    expect(result.mode).toBe('composite');
    expect(sprite.setTexture).toHaveBeenCalledWith('player_stand');
    expect(sprite.setTexture).not.toHaveBeenCalledWith(expect.stringContaining('star_hoodie_wearing'));
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
    expect(registry.resolveMode('scholar_gown', 'idle', () => false)).toBe('composite');
    expect(registry.resolveMode('unknown', 'idle', () => false)).toBe('base');

    const layeredRegistry = new OutfitRegistry([{
      ...OUTFIT_DEFINITIONS[0],
      previewMode: 'layered',
      layers: { [OutfitLayer.DRESS_OR_OUTFIT]: 'scholar-gown-layer.png' },
    }]);
    expect(layeredRegistry.resolveMode('scholar_robe', 'idle', key => key.includes(':layer:'))).toBe('layered');
  });

  it('does not replace an incompatible selected skin with dedicated outfit art', () => {
    expect(wardrobeRegistry.get('scholar_robe')?.supportedCharacterIds).toEqual(['adventurer']);
    expect(
      wardrobeRegistry.resolveMode(
        'scholar_robe',
        'idle',
        key => key.endsWith(':idle'),
        'heroine'
      )
    ).toBe('composite');
    expect(
      wardrobeRegistry.resolveMode(
        'scholar_robe',
        'idle',
        key => key.endsWith(':idle'),
        'adventurer'
      )
    ).toBe('fullSprite');

    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn(), setScale: vi.fn() };
    const result = renderer.render(
      { sprite, graphics: mockGraphics() } as never,
      {
        characterId: 'heroine',
        baseTextureKey: 'female_stand',
        pose: 'idle',
        wardrobe: { dress: 'scholar_robe' },
        textureExists: key => key.endsWith(':idle'),
      }
    );

    expect(result.mode).toBe('composite');
    expect(sprite.setTexture).toHaveBeenCalledWith('female_stand');
    expect(sprite.setTexture).not.toHaveBeenCalledWith('outfit:scholar_robe:idle');
  });

  it('does not hide a selected bottom behind a full-body top sprite', () => {
    expect(wardrobeRegistry.getSingleBodyOutfitId({ top: 'hk_school_shirt' })).toBe('school_uniform');
    expect(wardrobeRegistry.getSingleBodyOutfitId({ top: 'hk_school_shirt', bottom: 'denim_shorts' })).toBeUndefined();

    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn(), setScale: vi.fn() };
    const graphics = mockGraphics();
    const result = renderer.render(
      { sprite, graphics } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { top: 'hk_school_shirt', bottom: 'denim_shorts' },
        textureExists: key => key.includes('school_uniform/idle.png'),
      }
    );

    expect(result.mode).toBe('composite');
    expect(sprite.setTexture).toHaveBeenCalledWith('player_stand');
    expect(graphics.fillRoundedRect).toHaveBeenCalled();
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

  it('marks duplicate production motion files as idle-tween fallback art', () => {
    expect(wardrobeRegistry.isPoseArtworkReady('scholar_robe', 'run')).toBe(false);
    expect(wardrobeRegistry.isPoseArtworkReady('scholar_robe', 'cheer')).toBe(false);
    expect(wardrobeRegistry.isPoseArtworkReady('school_uniform', 'run')).toBe(true);
    expect(wardrobeRegistry.getAssetPaths('scholar_robe', 'run')).toEqual([
      'assets/character/outfits/scholar_gown/idle.png',
    ]);
  });

  it('adds a restrained run motion when a dedicated outfit reuses idle art', () => {
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn((key: string) => key.includes(':idle')) },
      tweens: { add: vi.fn(() => ({ stop: vi.fn() })) },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      wardrobe: { dress: 'scholar_robe' },
    });

    controller.setPose('run');
    const before = scene.tweens.add.mock.calls.length;
    controller.playRunFallbackStep();

    expect(controller.lastRenderResult?.poseFallback).toBe(true);
    expect(scene.tweens.add.mock.calls.length).toBe(before + 1);
    const runConfig = (scene.tweens.add.mock.calls.at(-1) as any[])?.[0];
    expect(runConfig).toEqual(expect.objectContaining({
      duration: 150,
      repeat: 0,
      yoyo: true,
    }));

    const runTween = scene.tweens.add.mock.results.at(-1)?.value as { stop: ReturnType<typeof vi.fn> };
    controller.playTryOn({ dress: 'dino_onesie' });
    expect(runTween.stop).toHaveBeenCalled();
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

    const accessories = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewFrontAccessories').mockImplementation(() => {});
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

  it('hides partial layered pieces before falling back to the base renderer', () => {
    const registry = new OutfitRegistry([{
      id: 'partial_layered_test',
      nameZh: 'Partial Layered Test',
      nameEn: 'Partial Layered Test',
      slot: OutfitSlot.DRESS,
      previewMode: 'layered',
      assets: { idle: 'missing-idle.png' },
      layers: {
        [OutfitLayer.BODY_BASE]: 'layered-body.png',
        [OutfitLayer.DRESS_OR_OUTFIT]: 'missing-garment.png',
      },
      price: 1,
    }]);
    const bodyLayer = { setTexture: vi.fn(), setVisible: vi.fn() };
    const garmentLayer = { setTexture: vi.fn(), setVisible: vi.fn() };
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn(), setScale: vi.fn() };
    let garmentAvailable = false;
    const renderer = new OutfitRenderer(registry);

    const result = renderer.render(
      {
        sprite,
        layerSprites: {
          [OutfitLayer.BODY_BASE]: bodyLayer,
          [OutfitLayer.DRESS_OR_OUTFIT]: garmentLayer,
        },
      } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { dress: 'partial_layered_test' },
        textureExists: key => key === 'layered-body.png'
          || (key === 'missing-garment.png' && garmentAvailable),
      }
    );

    expect(result.mode).toBe('composite');
    expect(bodyLayer.setVisible).toHaveBeenLastCalledWith(false);
    expect(garmentLayer.setVisible).toHaveBeenLastCalledWith(false);

    garmentAvailable = true;
    const recovered = renderer.render(
      {
        sprite,
        layerSprites: {
          [OutfitLayer.BODY_BASE]: bodyLayer,
          [OutfitLayer.DRESS_OR_OUTFIT]: garmentLayer,
        },
      } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { dress: 'partial_layered_test' },
        textureExists: key => key === 'layered-body.png'
          || (key === 'missing-garment.png' && garmentAvailable),
      }
    );

    expect(recovered.mode).toBe('layered');
    expect(bodyLayer.setVisible).toHaveBeenLastCalledWith(true);
    expect(garmentLayer.setVisible).toHaveBeenLastCalledWith(true);
  });

  it('renders dedicated outfits with one back pass and one front pass', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const backGraphics = mockGraphics();
    const back = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewBackAccessories').mockImplementation(() => {});
    const front = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewFrontAccessories').mockImplementation(() => {});
    const all = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewAccessories').mockImplementation(() => {});

    renderer.render(
      { sprite, graphics, backGraphics } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { dress: 'scholar_robe', accessory: 'star_glasses' },
        textureExists: key => key.endsWith(':idle'),
      }
    );

    expect(back).toHaveBeenCalledTimes(1);
    expect(front).toHaveBeenCalledTimes(1);
    expect(all).not.toHaveBeenCalled();

    back.mockRestore();
    front.mockRestore();
    all.mockRestore();
  });

  it('routes modular accessories through the full-sprite wearing rig', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const backGraphics = mockGraphics();
    const back = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewBackAccessories').mockImplementation(() => {});
    const front = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewFrontAccessories').mockImplementation(() => {});

    try {
      renderer.render(
        { sprite, graphics, backGraphics } as never,
        {
          characterId: 'boy01',
          baseTextureKey: 'player_stand',
          pose: 'idle',
          wardrobe: { dress: 'scholar_robe', accessory: 'star_glasses' },
          textureExists: key => key.endsWith(':idle'),
          scale: 1.8,
        }
      );

      expect(back.mock.calls[0]?.[2]).toEqual(expect.objectContaining({
        scale: 1.8,
        coordinateSpace: 'fullSprite',
      }));
      expect(front.mock.calls[0]?.[2]).toEqual(expect.objectContaining({
        scale: 1.8,
        coordinateSpace: 'fullSprite',
      }));
    } finally {
      back.mockRestore();
      front.mockRestore();
    }
  });

  it('anchors full-sprite glasses to the canonical eyes level', () => {
    const graphics = mockGraphics();

    CharacterOutfitCompositor.renderPreviewFrontAccessories(
      graphics as never,
      { accessory: 'star_glasses' },
      { scale: 1, coordinateSpace: 'fullSprite' } as never
    );

    const firstLens = graphics.fillCircle.mock.calls[0];
    expect(firstLens?.[0]).toBeCloseTo((221 - 256) * 0.23);
    expect(firstLens?.[1]).toBeCloseTo((185 - 256) * 0.23);
  });

  it('does not duplicate back accessories in the composite fallback', () => {
    const graphics = mockGraphics();
    const backpack = vi.spyOn(CharacterOutfitCompositor as any, 'drawStarBackpack').mockImplementation(() => {});

    CharacterOutfitCompositor.renderPreviewOutfit(graphics as never, { accessory: 'star_backpack' });

    expect(backpack).toHaveBeenCalledTimes(1);
    backpack.mockRestore();
  });

  it('keeps composite fallback back accessories behind the body graphics', () => {
    const renderer = new OutfitRenderer(new OutfitRegistry([{
      ...OUTFIT_DEFINITIONS[0],
      assets: { idle: 'missing-idle.png' },
    }]));
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const backGraphics = mockGraphics();
    const back = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewBackAccessories').mockImplementation(() => {});
    const outfit = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewOutfit');

    renderer.render(
      { sprite, graphics, backGraphics } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_stand',
        pose: 'idle',
        wardrobe: { dress: 'scholar_robe', accessory: 'star_backpack' },
        textureExists: () => false,
      }
    );

    expect(back).toHaveBeenCalledTimes(1);
    expect(outfit).toHaveBeenCalledTimes(1);
    expect(outfit.mock.calls[0][2]).toEqual(expect.objectContaining({ includeBackAccessories: false }));

    back.mockRestore();
    outfit.mockRestore();
  });

  it('allows the legacy compositor to omit back accessories when a rear pass exists', () => {
    const graphics = mockGraphics();
    const backpack = vi.spyOn(CharacterOutfitCompositor as any, 'drawStarBackpack').mockImplementation(() => {});

    CharacterOutfitCompositor.renderOutfit(
      graphics as never,
      { accessory: 'star_backpack' },
      { includeBackAccessories: false }
    );

    expect(backpack).not.toHaveBeenCalled();
    backpack.mockRestore();
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

  it('reuses the preview render target across unchanged refreshes', () => {
    const sprite = {
      setTexture: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      clearTint: vi.fn(),
    };
    const graphics = { ...mockGraphics() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: {
        image: vi.fn(() => sprite),
        graphics: vi.fn(() => graphics),
      },
      textures: { exists: vi.fn(() => false) },
      tweens: { add: vi.fn() },
    };
    const composite = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewOutfit').mockImplementation(() => {});

    try {
      const controller = new CharacterPreviewController(scene as never, {
        container: container as never,
        character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
        wardrobe: { top: 'sailor_top' },
      });

      controller.setWardrobe({ top: 'sailor_top' });

      expect(composite).toHaveBeenCalledTimes(1);
    } finally {
      composite.mockRestore();
    }
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

  it('caps low-resolution base preview upscaling and keeps the fallback on the stage baseline', () => {
    const sprite: any = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setPosition: vi.fn(),
      setDepth: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
      texture: {},
    };
    const graphics: any = { ...mockGraphics(), setDepth: vi.fn(), destroy: vi.fn() };
    const container: any = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene: any = {
      add: {
        image: vi.fn((_: number, __: number, key: string) => key === 'player_stand'
          ? sprite
          : { setTexture: vi.fn(), setVisible: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() }),
        graphics: vi.fn(() => graphics),
      },
      textures: {
        exists: vi.fn(() => false),
        get: vi.fn(() => ({ getSourceImage: () => ({ width: 80, height: 110 }) })),
      },
      tweens: { add: vi.fn() },
    };

    new CharacterPreviewController(scene, {
      container,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      scale: 4,
    });

    expect(sprite.setScale).toHaveBeenCalledWith(0.625);
    expect(sprite.y).toBeCloseTo(20.625, 3);
  });

  it('keeps fallback idle and cheer motion relative to the fitted stage baseline', () => {
    const sprite: any = {
      setTexture: vi.fn(), setTint: vi.fn(), clearTint: vi.fn(), setScale: vi.fn(),
      setVisible: vi.fn(), destroy: vi.fn(), texture: {},
    };
    const graphics: any = { ...mockGraphics(), setDepth: vi.fn(), destroy: vi.fn() };
    const container: any = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene: any = {
      add: {
        image: vi.fn((_: number, __: number, key: string) => key === 'player_stand'
          ? sprite
          : { setTexture: vi.fn(), setVisible: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() }),
        graphics: vi.fn(() => graphics),
      },
      textures: {
        exists: vi.fn(() => false),
        get: vi.fn(() => ({ getSourceImage: () => ({ width: 80, height: 110 }) })),
      },
      tweens: { add: vi.fn((config: any) => ({ ...config, stop: vi.fn(), pause: vi.fn(), resume: vi.fn() })) },
    };

    const controller = new CharacterPreviewController(scene, {
      container,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      scale: 4,
    });

    expect(scene.tweens.add.mock.calls[0][0].y).toBeCloseTo(18.625, 3);
    controller.playCheer();
    expect(scene.tweens.add.mock.calls[1][0].y).toBeCloseTo(12.625, 3);
  });

  it('keeps a restarted idle tween playing when the previous tween was active', () => {
    const sprite: any = {
      setTexture: vi.fn(), setTint: vi.fn(), clearTint: vi.fn(), setScale: vi.fn(),
      setVisible: vi.fn(), destroy: vi.fn(), texture: {},
    };
    const graphics: any = { ...mockGraphics(), setDepth: vi.fn(), destroy: vi.fn() };
    const container: any = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const idleTweens: any[] = [];
    const scene: any = {
      add: {
        image: vi.fn((_: number, __: number, key: string) => key === 'player_stand'
          ? sprite
          : { setTexture: vi.fn(), setVisible: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() }),
        graphics: vi.fn(() => graphics),
      },
      textures: {
        exists: vi.fn((key: string) => key === 'outfit:scholar_robe:idle'),
        get: vi.fn(() => ({ getSourceImage: () => ({ width: 80, height: 110 }) })),
      },
      tweens: {
        add: vi.fn(() => {
          const tween = {
            stop: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            isPaused: vi.fn(() => false),
          };
          idleTweens.push(tween);
          return tween;
        }),
      },
    };

    const controller = new CharacterPreviewController(scene, {
      container,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      scale: 4,
    });

    controller.setWardrobe({ dress: 'scholar_robe' });

    expect(idleTweens).toHaveLength(2);
    expect(idleTweens[1].pause).not.toHaveBeenCalled();
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

  it('re-evaluates a cached fallback when wearing art becomes available', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const target = { sprite, graphics };
    let wearingAvailable = false;
    const request = {
      characterId: 'boy01',
      baseTextureKey: 'player_stand',
      pose: 'idle' as const,
      wardrobe: { dress: 'scholar_robe' },
      textureExists: (key: string) => wearingAvailable && key.endsWith(':idle'),
    };

    expect(renderer.render(target as never, request).mode).toBe('composite');
    wearingAvailable = true;

    expect(renderer.render(target as never, request).mode).toBe('fullSprite');
    expect(sprite.setTexture).toHaveBeenLastCalledWith('outfit:scholar_robe:idle');
  });

  it('invalidates the target cache when the renderer is cleared', () => {
    const renderer = new OutfitRenderer(wardrobeRegistry);
    const sprite = { setTexture: vi.fn(), setVisible: vi.fn() };
    const graphics = mockGraphics();
    const composite = vi.spyOn(CharacterOutfitCompositor, 'renderPreviewOutfit').mockImplementation(() => {});
    const request = {
      characterId: 'boy01',
      baseTextureKey: 'player_stand',
      pose: 'idle' as const,
      wardrobe: { top: 'sailor_top' },
      textureExists: () => false,
    };
    const target = { sprite, graphics };

    renderer.render(target as never, request);
    renderer.clearCache();
    renderer.render(target as never, request);

    expect(composite).toHaveBeenCalledTimes(2);
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
    const registry = new OutfitRegistry([{
      ...OUTFIT_DEFINITIONS[0],
      poseArtwork: { run: 'authored' },
    }]);
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
      registry,
    });

    controller.setPose('run');

    expect(controller.lastRenderResult?.mode).toBe('fullSprite');
    expect(sprite.setTexture).toHaveBeenCalledWith('outfit:scholar_robe:run');
  });

  it('marks a missing authored pose asset as a safe full-sprite fallback', () => {
    const registry = new OutfitRegistry([{
      ...OUTFIT_DEFINITIONS[0],
      poseArtwork: { run: 'authored' },
    }]);
    const renderer = new OutfitRenderer(registry);
    const sprite = { setTexture: vi.fn(), setScale: vi.fn(), setVisible: vi.fn() };

    const result = renderer.render(
      { sprite, graphics: mockGraphics() } as never,
      {
        characterId: 'boy01',
        baseTextureKey: 'player_walk1',
        pose: 'run',
        wardrobe: { dress: 'scholar_robe' },
        textureExists: key => key === 'outfit:scholar_robe:idle',
      }
    );

    expect(result.mode).toBe('fullSprite');
    expect(result.poseFallback).toBe(true);
    expect(sprite.setTexture).toHaveBeenCalledWith('outfit:scholar_robe:idle');
  });

  it('clears a previous skin tint when switching to an untinted character', () => {
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setPosition: vi.fn(),
      setDepth: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: { add: vi.fn() },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: {
        id: 'knight',
        idle: 'player_stand',
        run: 'player_walk1',
        cheer: 'player_cheer',
        tint: 0xc8e6ff,
      },
    });

    controller.setCharacter({ id: 'adventurer', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' });

    expect(sprite.clearTint).toHaveBeenCalled();
  });

  it('does not tint dedicated full-body outfit artwork with the selected skin tint', () => {
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      texture: { setFilter: vi.fn() },
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn((key: string) => key === 'outfit:scholar_robe:idle') },
      tweens: { add: vi.fn() },
    };

    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: {
        id: 'adventurer',
        idle: 'player_stand',
        run: 'player_walk1',
        cheer: 'player_cheer',
        tint: 0x4a90e2,
      },
      wardrobe: { dress: 'scholar_robe' },
    });

    expect(controller.lastRenderResult?.mode).toBe('fullSprite');
    expect(sprite.clearTint).toHaveBeenCalled();
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

  it('does not start optional preview motion when reduced motion is requested', () => {
    const sprite = { setTexture: vi.fn(), setTint: vi.fn(), setPosition: vi.fn(), setDepth: vi.fn() };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: { add: vi.fn() },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      reducedMotion: true,
    });

    controller.playTryOn({ dress: 'scholar_robe' });
    controller.playCheer();

    expect(scene.tweens.add).not.toHaveBeenCalled();
    expect(controller.currentPose).toBe('idle');
  });

  it('pauses idle motion while a try-on or cheer animation is active', () => {
    const idleTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const actionTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      setPosition: vi.fn(),
      setDepth: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: {
        add: vi.fn((config: any) => config.repeat === -1 ? idleTween : actionTween),
      },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
    });

    controller.playTryOn({ dress: 'scholar_robe' });
    controller.playCheer();

    expect(idleTween.pause).toHaveBeenCalled();
  });

  it('cancels the previous preview action before starting another', () => {
    const idleTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const tryOnTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const cheerTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const actionTweens = [tryOnTween, cheerTween];
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      setPosition: vi.fn(),
      setDepth: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: {
        add: vi.fn((config: any) => config.repeat === -1 ? idleTween : actionTweens.shift()),
      },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
    });

    controller.playTryOn({ dress: 'scholar_robe' });
    controller.playCheer();

    expect(tryOnTween.stop).toHaveBeenCalled();

    controller.playTryOn({ dress: 'princess_dress' });
    expect(cheerTween.stop).toHaveBeenCalled();
  });

  it('cancels cheer when a different preview pose is selected', () => {
    const idleTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const cheerTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: {
        add: vi.fn((config: any) => config.repeat === -1 ? idleTween : cheerTween),
      },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
    });

    controller.playCheer();
    const cheerConfig = scene.tweens.add.mock.calls.at(-1)?.[0] as { onComplete: () => void };
    controller.setPose('run');

    expect(cheerTween.stop).toHaveBeenCalled();
    cheerConfig.onComplete();
    expect(controller.currentPose).toBe('run');
  });

  it('invalidates cheer when the preview character is refreshed', () => {
    const idleTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const cheerTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: {
        add: vi.fn((config: any) => config.repeat === -1 ? idleTween : cheerTween),
      },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
    });

    controller.playCheer();
    const staleCheerComplete = scene.tweens.add.mock.calls.at(-1)?.[0]?.onComplete as () => void;
    controller.setCharacter({ id: 'girl01', idle: 'female_stand', run: 'female_walk1', cheer: 'female_cheer' });
    controller.setPose('cheer');

    expect(cheerTween.stop).toHaveBeenCalled();
    staleCheerComplete();
    expect(controller.currentPose).toBe('cheer');
  });

  it('cancels run fallback and resumes idle when the preview character is refreshed', () => {
    const idleTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const runTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn((key: string) => key.includes(':idle')) },
      tweens: {
        add: vi.fn((config: any) => config.repeat === -1 ? idleTween : runTween),
      },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
      wardrobe: { dress: 'scholar_robe' },
    });

    controller.setPose('run');
    controller.playRunFallbackStep();
    controller.setCharacter({ id: 'girl01', idle: 'female_stand', run: 'female_walk1', cheer: 'female_cheer' });

    expect(runTween.stop).toHaveBeenCalled();
    expect(idleTween.resume).toHaveBeenCalled();
    expect(controller.currentPose).toBe('idle');
  });

  it('resets try-on scale when the preview character is refreshed', () => {
    const idleTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const tryOnTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: {
        add: vi.fn((config: any) => config.repeat === -1 ? idleTween : tryOnTween),
      },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
    });

    controller.playTryOn({ dress: 'scholar_robe' });
    controller.setCharacter({ id: 'girl01', idle: 'female_stand', run: 'female_walk1', cheer: 'female_cheer' });

    expect(tryOnTween.stop).toHaveBeenCalled();
    expect(container.setScale).toHaveBeenLastCalledWith(1);
  });

  it('cancels an active try-on pop when a direct pose is selected', () => {
    const idleTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const tryOnTween = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    const sprite = {
      setTexture: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setScale: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const graphics = { ...mockGraphics(), setPosition: vi.fn(), setDepth: vi.fn() };
    const container = { add: vi.fn(), setScale: vi.fn(), setDepth: vi.fn() };
    const scene = {
      add: { image: vi.fn(() => sprite), graphics: vi.fn(() => graphics) },
      textures: { exists: vi.fn(() => false) },
      tweens: {
        add: vi.fn((config: any) => config.repeat === -1 ? idleTween : tryOnTween),
      },
    };
    const controller = new CharacterPreviewController(scene as never, {
      container: container as never,
      character: { id: 'boy01', idle: 'player_stand', run: 'player_walk1', cheer: 'player_cheer' },
    });

    controller.playTryOn({ dress: 'scholar_robe' });
    const staleTryOnComplete = scene.tweens.add.mock.calls.at(-1)?.[0]?.onComplete as () => void;
    controller.setPose('run');

    expect(tryOnTween.stop).toHaveBeenCalled();
    expect(container.setScale).toHaveBeenLastCalledWith(1);
    staleTryOnComplete();
    expect(idleTween.resume).not.toHaveBeenCalled();
    expect(controller.currentPose).toBe('run');
  });

});
