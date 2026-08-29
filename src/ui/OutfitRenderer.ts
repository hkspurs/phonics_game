import Phaser from 'phaser';
import type { EquippedWardrobe } from '../types';
import type { OutfitLayer, PreviewMode, PreviewPose } from '../config/outfits';
import { CharacterOutfitCompositor } from './CharacterOutfitCompositor';
import { OutfitRegistry, wardrobeRegistry } from './OutfitRegistry';

export interface OutfitRenderTarget {
  sprite?: Phaser.GameObjects.Image;
  graphics?: Phaser.GameObjects.Graphics;
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
  private readonly filteredTextures = new Set<Phaser.Textures.Texture>();

  constructor(private readonly registry: OutfitRegistry = wardrobeRegistry) {}

  render(target: OutfitRenderTarget, request: OutfitRenderRequest): OutfitRenderResult {
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
      const texture = target.sprite.texture;
      if (texture?.setFilter) {
        this.filteredTextures.add(texture);
        // The supplied Kenney fallback is pixel art enlarged for the dressing
        // room; nearest sampling keeps its outline crisp until high-res art lands.
        texture.setFilter(
          mode === 'fullSprite' ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST
        );
      }
      if (typeof target.sprite.setVisible === 'function') target.sprite.setVisible(true);
    }

    if (mode === 'fullSprite') {
      if (target.graphics) {
        if (request.wardrobe.hat || request.wardrobe.wings || request.wardrobe.accessory) {
          CharacterOutfitCompositor.renderPreviewAccessories(target.graphics, request.wardrobe, {
            scale: request.scale ?? 1,
          });
        } else if (typeof target.graphics.clear === 'function') {
          target.graphics.clear();
        }
      }
      this.hideLayers(target);
    } else if (mode === 'layered' && this.renderLayered(target, outfitId, request)) {
      if (target.graphics) {
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
    this.filteredTextures.forEach(texture => texture.setFilter(Phaser.Textures.FilterMode.LINEAR));
    this.filteredTextures.clear();
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
