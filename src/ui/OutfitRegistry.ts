import type { EquippedWardrobe } from '../types';
import {
  OUTFIT_DEFINITIONS,
  OutfitDefinition,
  OutfitLayer,
  OutfitPose,
  PreviewMode,
  PreviewPose,
} from '../config/outfits';

export type TextureExists = (key: string) => boolean;

export class OutfitRegistry {
  private readonly definitions = new Map<string, OutfitDefinition>();

  constructor(definitions: readonly OutfitDefinition[] = OUTFIT_DEFINITIONS) {
    for (const definition of definitions) {
      this.definitions.set(definition.id, definition);
      for (const alias of definition.aliases ?? []) this.definitions.set(alias, definition);
    }
  }

  get(id: string | undefined): OutfitDefinition | undefined {
    return id ? this.definitions.get(id) : undefined;
  }

  resolveId(id: string): string {
    return this.get(id)?.id ?? id;
  }

  /** Full-body art cannot represent a second dress/top/bottom selection. */
  getSingleBodyOutfitId(wardrobe: EquippedWardrobe): string | undefined {
    const bodyIds = [wardrobe.dress, wardrobe.top, wardrobe.bottom].filter(Boolean) as string[];
    return bodyIds.length === 1 ? this.resolveId(bodyIds[0]) : undefined;
  }

  isWearingArtworkReady(id: string, textureExists?: TextureExists): boolean {
    const definition = this.get(id);
    // Unregistered modular items are rendered by CharacterOutfitCompositor and
    // remain available through the existing Wardrobe purchase path.
    if (!definition) return true;
    if (definition.artworkStatus === 'placeholder') return false;
    if (!textureExists) return true;

    // A ready metadata flag is not enough for a live purchase gate: both the
    // catalog thumbnail and the idle wearing art must be available.
    const hasThumbnail = Boolean(
      definition.assets.thumbnail && textureExists(definition.assets.thumbnail)
    );
    return hasThumbnail && this.isWearingTextureReady(id, textureExists);
  }

  /** Runtime renderers only need the character-wearing source, not its catalog thumbnail. */
  isWearingTextureReady(id: string, textureExists?: TextureExists): boolean {
    const definition = this.get(id);
    if (!definition || definition.artworkStatus === 'placeholder') return false;
    const wearingPaths = this.getAssetPaths(id, 'idle');
    return textureExists ? wearingPaths.some(textureExists) : wearingPaths.length > 0;
  }

  isPoseArtworkReady(id: string, pose: OutfitPose): boolean {
    const definition = this.get(id);
    return !definition || definition.poseArtwork?.[pose] !== 'idleFallback';
  }

  isCharacterArtworkCompatible(id: string, characterId?: string): boolean {
    const supportedCharacterIds = this.get(id)?.supportedCharacterIds;
    if (!supportedCharacterIds || !characterId) return true;
    // Legacy preview integrations use boy01 for the same base boy as adventurer.
    const normalizedCharacterId = characterId === 'boy01' ? 'adventurer' : characterId;
    return supportedCharacterIds.includes(normalizedCharacterId);
  }

  getAssetKey(id: string, pose: PreviewPose): string {
    return `outfit:${this.resolveId(id)}:${pose}`;
  }

  getAssetKeys(id: string, pose: PreviewPose): string[] {
    const definition = this.get(id);
    if (!definition) return [];
    const poses: PreviewPose[] = pose === 'idle'
      ? ['idle']
      : [
          ...(this.isPoseArtworkReady(id, pose) ? [pose] : []),
          'idle',
        ];
    const wearingPaths = new Set(this.getAssetPaths(id, pose));
    return poses
      .filter(candidate => {
        const path = definition.assets[candidate];
        return Boolean(path && wearingPaths.has(path));
      })
      .map(candidate => this.getAssetKey(id, candidate));
  }

  getAssetPath(id: string, pose: PreviewPose): string | undefined {
    return this.getAssetPaths(id, pose)[0];
  }

  getAssetPaths(id: string, pose: PreviewPose): string[] {
    const definition = this.get(id);
    if (!definition || definition.artworkStatus === 'placeholder') return [];
    const requestedAsset = this.isPoseArtworkReady(id, pose) ? definition.assets[pose] : undefined;
    // A catalog image is never a wearing candidate, even if metadata is malformed.
    return [requestedAsset, definition.assets.idle].filter(
      (path, index, all): path is string => Boolean(path)
        && path !== definition.assets.thumbnail
        && all.indexOf(path) === index
    );
  }

  getLayerAssetKeys(id: string): string[] {
    const definition = this.get(id);
    if (
      !definition
      || definition.artworkStatus === 'placeholder'
      || this.hasCatalogThumbnailLayer(definition)
    ) return [];
    const layers = Object.keys(definition.layers ?? {}) as OutfitLayer[];
    return layers.map(layer => `outfit:${definition.id}:layer:${layer}`);
  }

  getLayerAssetPaths(id: string): string[] {
    const definition = this.get(id);
    return definition
      && definition.artworkStatus !== 'placeholder'
      && !this.hasCatalogThumbnailLayer(definition)
      ? Object.values(definition.layers ?? {})
      : [];
  }

  private hasCatalogThumbnailLayer(definition: OutfitDefinition): boolean {
    const thumbnail = definition.assets.thumbnail;
    return Boolean(
      thumbnail
      && Object.values(definition.layers ?? {}).some(path => path === thumbnail)
    );
  }

  resolveMode(
    id: string,
    pose: PreviewPose,
    textureExists: TextureExists,
    characterId?: string
  ): PreviewMode | 'base' {
    const definition = this.get(id);
    if (!definition) return 'base';

    if (
      definition.artworkStatus !== 'placeholder' &&
      this.isCharacterArtworkCompatible(id, characterId) &&
      (
        this.getAssetKeys(id, pose).some(textureExists) ||
        this.getAssetPaths(id, pose).some(textureExists)
      )
    ) return 'fullSprite';

    const layerKeys = this.getLayerAssetKeys(id);
    const layerPaths = this.getLayerAssetPaths(id);
    if (layerKeys.some(textureExists) || layerPaths.some(textureExists)) return 'layered';

    return 'composite';
  }

  getCacheKey(characterId: string, wardrobe: EquippedWardrobe, pose: PreviewPose): string {
    const parts = Object.entries(wardrobe)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([slot, id]) => `${slot}=${this.resolveId(id)}`);
    const outfitState = parts.length === 1 && parts[0].startsWith('dress=')
      ? parts[0].slice('dress='.length)
      : parts.join('|') || 'base';
    return `character:${characterId}:${outfitState}:${pose}`;
  }
}

export const wardrobeRegistry = new OutfitRegistry();
