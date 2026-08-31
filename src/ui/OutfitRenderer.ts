import Phaser from 'phaser';
import type { EquippedWardrobe } from '../types';
import type { OutfitLayer, PreviewMode, PreviewPose } from '../config/outfits';
import { CharacterOutfitCompositor } from './CharacterOutfitCompositor';
import { OutfitRegistry, wardrobeRegistry } from './OutfitRegistry';

export interface OutfitRenderTarget {
  sprite?: Phaser.GameObjects.Image;
  graphics?: Phaser.GameObjects.Graphics;
  backGraphics?: Phaser.GameObjects.Graphics;
  layerSprites?: Partial<Record<OutfitLayer, Phaser.GameObjects.Image>>;
}

export interface OutfitRenderRequest {
  characterId: string;
  baseTextureKey: string;
  pose: PreviewPose;
  wardrobe: EquippedWardrobe;
  textureExists: (key: string) => boolean;
  scale?: number;
}

export interface OutfitRenderResult {
  mode: PreviewMode | 'base';
  cacheKey: string;
  textureKey: string;
}

export class OutfitRenderer {
  private readonly targetCache = new WeakMap<object, OutfitRenderResult>();
  private readonly trackedTargets = new Set<OutfitRenderTarget>();

  constructor(private readonly registry: OutfitRegistry = wardrobeRegistry) {}

  render(target: OutfitRenderTarget, request: OutfitRenderRequest): OutfitRenderResult {
    this.trackedTargets.add(target);
    const cacheKey = this.registry.getCacheKey(request.characterId, request.wardrobe, request.pose);
    const previous = this.targetCache.get(target);
    if (previous?.cacheKey === cacheKey) {
      if (target.sprite && typeof target.sprite.setTexture === 'function') {
        target.sprite.setTexture(previous.textureKey);
        if (typeof target.sprite.setVisible === 'function') target.sprite.setVisible(true);
      }
      return previous;
    }

    const mode = this.registry.resolveMode(
      request.wardrobe.dress || request.wardrobe.top || request.wardrobe.bottom || '',
      request.pose,
      request.textureExists
    );
    const outfitId = request.wardrobe.dress || request.wardrobe.top || request.wardrobe.bottom;
    const fullLogicalKeys = outfitId ? this.registry.getAssetKeys(outfitId, request.pose) : [];
    const fullPaths = outfitId ? this.registry.getAssetPaths(outfitId, request.pose) : [];
    const fullTextureKey = [...fullLogicalKeys, ...fullPaths].find(request.textureExists);
    const textureKey = mode === 'fullSprite'
      ? fullTextureKey ?? request.baseTextureKey
      : request.baseTextureKey;

    if (target.sprite && typeof target.sprite.setTexture === 'function') {
      target.sprite.setTexture(textureKey);
      if (mode === 'fullSprite' && (target.sprite.height > 150 || target.sprite.width > 150)) {
        if (typeof target.sprite.setScale === 'function') {
          target.sprite.setScale(0.23 * (request.scale ?? 1));
        }
      } else if (typeof target.sprite.setScale === 'function') {
        target.sprite.setScale(request.scale ?? 1);
      }
      if (target.sprite.texture?.setFilter) {
        target.sprite.texture.setFilter(
          mode === 'fullSprite' ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST
        );
      }
      if (typeof target.sprite.setVisible === 'function') target.sprite.setVisible(true);
    }

    // Render modular back accessories (Angel Wings, Star Backpack)
    if (target.backGraphics) {
      target.backGraphics.clear();
      CharacterOutfitCompositor.renderPreviewBackAccessories(target.backGraphics, request.wardrobe, {
        scale: request.scale ?? 1,
      });
    }

    if (mode === 'fullSprite') {
      if (target.graphics) {
        target.graphics.clear();
        CharacterOutfitCompositor.renderPreviewAccessories(target.graphics, request.wardrobe, {
          scale: request.scale ?? 1,
        });
      }
      this.hideLayers(target);
    } else if (mode === 'layered' && this.renderLayered(target, outfitId, request)) {
      if (target.graphics) {
        target.graphics.clear();
        CharacterOutfitCompositor.renderPreviewAccessories(target.graphics, request.wardrobe, {
          scale: request.scale ?? 1,
        });
      }
    } else if (target.graphics) {
      CharacterOutfitCompositor.renderPreviewOutfit(target.graphics, request.wardrobe, {
        scale: request.scale ?? 1,
      });
      this.hideLayers(target);
    }

    const result: OutfitRenderResult = { mode, cacheKey, textureKey };
    this.targetCache.set(target, result);
    return result;
  }

  clearCache(): void {
    for (const target of this.trackedTargets) {
      if (target.sprite?.texture?.setFilter) {
        target.sprite.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
    this.trackedTargets.clear();
  }

  private renderLayered(
    target: OutfitRenderTarget,
    outfitId: string | undefined,
    request: OutfitRenderRequest
  ): boolean {
    const definition = outfitId ? this.registry.get(outfitId) : undefined;
    if (!definition || !target.layerSprites) return false;

    this.hideLayers(target);
    const layers = Object.entries(definition.layers ?? {}) as [OutfitLayer, string][];
    for (const [layer, path] of layers) {
      const layerSprite = target.layerSprites[layer];
      if (!layerSprite || !request.textureExists(path)) return false;
      layerSprite.setTexture(path);
      if (typeof layerSprite.setVisible === 'function') layerSprite.setVisible(true);
    }
    return layers.length > 0;
  }

  private hideLayers(target: OutfitRenderTarget): void {
    for (const sprite of Object.values(target.layerSprites ?? {})) {
      if (sprite && typeof sprite.setVisible === 'function') sprite.setVisible(false);
    }
  }
}
