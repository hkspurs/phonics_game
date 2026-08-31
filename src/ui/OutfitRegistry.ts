import type { EquippedWardrobe } from '../types';
import {
  OUTFIT_DEFINITIONS,
  OutfitDefinition,
  OutfitLayer,
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

  isWearingArtworkReady(id: string): boolean {
    const definition = this.get(id);
    return !definition || definition.artworkStatus !== 'placeholder';
  }

  getAssetKey(id: string, pose: PreviewPose): string {
    return `outfit:${this.resolveId(id)}:${pose}`;
  }

  getAssetKeys(id: string, pose: PreviewPose): string[] {
    const poses: PreviewPose[] = pose === 'idle' ? ['idle'] : [pose, 'idle'];
    return poses.map(candidate => this.getAssetKey(id, candidate));
  }

  getAssetPath(id: string, pose: PreviewPose): string | undefined {
    return this.getAssetPaths(id, pose)[0];
  }

  getAssetPaths(id: string, pose: PreviewPose): string[] {
    const definition = this.get(id);
    if (!definition) return [];
    return [definition.assets[pose], definition.assets.idle].filter(
      (path, index, all): path is string => Boolean(path) && all.indexOf(path) === index
    );
  }

  getLayerAssetKeys(id: string): string[] {
    const definition = this.get(id);
    if (!definition) return [];
    const layers = Object.keys(definition.layers ?? {}) as OutfitLayer[];
    return layers.map(layer => `outfit:${definition.id}:layer:${layer}`);
  }

  getLayerAssetPaths(id: string): string[] {
    const definition = this.get(id);
    return Object.values(definition?.layers ?? {});
  }

  resolveMode(id: string, pose: PreviewPose, textureExists: TextureExists): PreviewMode | 'base' {
    const definition = this.get(id);
    if (!definition) return 'base';

    if (
      this.getAssetKeys(id, pose).some(textureExists) ||
      this.getAssetPaths(id, pose).some(textureExists)
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
