import Phaser from 'phaser';
import type { EquippedWardrobe } from '../types';
import type { OutfitLayer, PreviewMode, PreviewPose } from '../config/outfits';
import { CharacterOutfitCompositor, FULL_SPRITE_LOCAL_SCALE } from './CharacterOutfitCompositor';
import type { PreviewCoordinateSpace } from './CharacterOutfitCompositor';
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
  poseFallback?: boolean;
}

export class OutfitRenderer {
  private readonly targetCache = new WeakMap<object, { result: OutfitRenderResult; signature: string }>();
  private readonly trackedTargets = new Set<OutfitRenderTarget>();

  constructor(private readonly registry: OutfitRegistry = wardrobeRegistry) {}

  render(target: OutfitRenderTarget, request: OutfitRenderRequest): OutfitRenderResult {
    this.trackedTargets.add(target);
    const cacheKey = this.registry.getCacheKey(request.characterId, request.wardrobe, request.pose);
    const bodyOutfitId = request.wardrobe.dress || request.wardrobe.top || request.wardrobe.bottom;
    const singleBodyOutfitId = this.registry.getSingleBodyOutfitId(request.wardrobe);
    const outfitId = singleBodyOutfitId ?? bodyOutfitId;
    const fullLogicalKeys = singleBodyOutfitId ? this.registry.getAssetKeys(singleBodyOutfitId, request.pose) : [];
    const fullPaths = singleBodyOutfitId ? this.registry.getAssetPaths(singleBodyOutfitId, request.pose) : [];
    const layerLogicalKeys = singleBodyOutfitId ? this.registry.getLayerAssetKeys(singleBodyOutfitId) : [];
    const layerPaths = singleBodyOutfitId ? this.registry.getLayerAssetPaths(singleBodyOutfitId) : [];
    const assetSignature = this.getAssetSignature(request, [
      ...fullLogicalKeys,
      ...fullPaths,
      ...layerLogicalKeys,
      ...layerPaths,
    ]);
    let mode = bodyOutfitId
      ? singleBodyOutfitId
        ? this.registry.resolveMode(
            singleBodyOutfitId,
            request.pose,
            request.textureExists,
            request.characterId
          )
        : 'composite'
      : 'base';
    const fullTextureKey = [...fullLogicalKeys, ...fullPaths].find(request.textureExists);
    const textureKey = mode === 'fullSprite'
      ? fullTextureKey ?? request.baseTextureKey
      : request.baseTextureKey;
    const signature = `${request.baseTextureKey}|${request.scale ?? 1}|${assetSignature}`;
    const previous = this.targetCache.get(target);
    if (
      previous?.result.cacheKey === cacheKey
      && previous.result.mode === mode
      && previous.result.textureKey === textureKey
      && previous.signature === signature
    ) {
      if (target.sprite && typeof target.sprite.setTexture === 'function') {
        target.sprite.setTexture(previous.result.textureKey);
        if (typeof target.sprite.setVisible === 'function') target.sprite.setVisible(true);
      }
      return previous.result;
    }

    if (target.sprite && typeof target.sprite.setTexture === 'function') {
      target.sprite.setTexture(textureKey);
      if (mode === 'fullSprite') {
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

    if (mode === 'fullSprite') {
      this.renderAccessoryPasses(target, request, 'fullSprite');
      if (target.graphics) {
        CharacterOutfitCompositor.renderPreviewFrontAccessories(target.graphics, request.wardrobe, {
          scale: request.scale ?? 1,
          coordinateSpace: 'fullSprite',
        });
      }
      this.hideLayers(target);
    } else if (mode === 'layered') {
      if (this.renderLayered(target, outfitId, request)) {
        this.renderAccessoryPasses(target, request);
        if (target.graphics) {
          CharacterOutfitCompositor.renderPreviewFrontAccessories(target.graphics, request.wardrobe, {
            scale: request.scale ?? 1,
          });
        }
      } else {
        // A partially available layered outfit is not a valid render mode.
        // Hide any pieces already mounted before using the composite fallback.
        mode = 'composite';
        this.hideLayers(target);
        if (target.backGraphics) this.renderAccessoryPasses(target, request);
        if (target.graphics) {
          CharacterOutfitCompositor.renderPreviewOutfit(target.graphics, request.wardrobe, {
            scale: request.scale ?? 1,
            includeBackAccessories: !target.backGraphics,
          });
        }
      }
    } else {
      if (target.backGraphics) this.renderAccessoryPasses(target, request);
      if (target.graphics) {
        CharacterOutfitCompositor.renderPreviewOutfit(target.graphics, request.wardrobe, {
          scale: request.scale ?? 1,
          includeBackAccessories: !target.backGraphics,
        });
      }
      this.hideLayers(target);
    }

    const requestedPoseAvailable = request.pose === 'idle' || Boolean(
      outfitId
      && this.registry.isPoseArtworkReady(outfitId, request.pose)
      && [
        this.registry.getAssetKey(outfitId, request.pose),
        this.registry.get(outfitId)?.assets[request.pose],
      ].some((key) => Boolean(key) && request.textureExists(key!))
    );
    const poseFallback = mode === 'fullSprite' && request.pose !== 'idle' && Boolean(outfitId)
      && !requestedPoseAvailable;
    const result: OutfitRenderResult = { mode, cacheKey, textureKey, poseFallback };
    this.targetCache.set(target, { result, signature });
    return result;
  }

  private getAssetSignature(request: OutfitRenderRequest, candidates: string[]): string {
    return [...new Set(candidates)]
      .map(key => `${key}:${request.textureExists(key) ? '1' : '0'}`)
      .join('|');
  }

  private renderAccessoryPasses(
    target: OutfitRenderTarget,
    request: OutfitRenderRequest,
    coordinateSpace: PreviewCoordinateSpace = 'base'
  ): void {
    if (!target.backGraphics) return;
    CharacterOutfitCompositor.renderPreviewBackAccessories(target.backGraphics, request.wardrobe, {
      scale: request.scale ?? 1,
      coordinateSpace,
    });
  }

  clearCache(): void {
    for (const target of this.trackedTargets) {
      this.targetCache.delete(target);
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
      // Layered parts share the 512px master canvas with full-sprite art.
      if (typeof layerSprite.setScale === 'function') {
        layerSprite.setScale(FULL_SPRITE_LOCAL_SCALE * (request.scale ?? 1));
      }
      if (layerSprite.texture?.setFilter) {
        layerSprite.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
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
