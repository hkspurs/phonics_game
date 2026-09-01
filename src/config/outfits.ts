import type { EquippedWardrobe } from '../types';
import type { WardrobeItem } from './wardrobe';

export type PreviewPose = 'idle' | 'run' | 'cheer';
export type OutfitPose = PreviewPose | 'jump';
export type OutfitPoseAvailability = 'authored' | 'idleFallback';
export type PreviewMode = 'fullSprite' | 'layered' | 'composite';

export enum OutfitLayer {
  BACKGROUND = 'background',
  BACK_ACCESSORY = 'back_accessory',
  BODY_BACK = 'body_back',
  LEGS = 'legs',
  SHOES = 'shoes',
  BODY_BASE = 'body_base',
  DRESS_OR_OUTFIT = 'dress_or_outfit',
  ARM_BACK = 'arm_back',
  ARM_FRONT = 'arm_front',
  HAIR_BACK = 'hair_back',
  HEAD = 'head',
  HAIR_FRONT = 'hair_front',
  HAT = 'hat',
  FACE_ACCESSORY = 'face_accessory',
  FRONT_ACCESSORY = 'front_accessory',
  FX = 'fx',
}

export enum OutfitSlot {
  DRESS = 'dress',
  TOP = 'top',
  BOTTOM = 'bottom',
  HAT = 'hat',
  ACCESSORY = 'accessory',
  SHOES = 'shoes',
  WINGS = 'wings',
}

export enum CharacterAnchor {
  HEAD = 'head',
  NECK = 'neck',
  SHOULDER = 'shoulder',
  CHEST = 'chest',
  WAIST = 'waist',
  HIP = 'hip',
  LEFT_HAND = 'left_hand',
  RIGHT_HAND = 'right_hand',
  LEFT_FOOT = 'left_foot',
  RIGHT_FOOT = 'right_foot',
  CROWN = 'crown',
}

export const OUTFIT_LAYER_ORDER: readonly OutfitLayer[] = [
  OutfitLayer.BACKGROUND,
  OutfitLayer.BACK_ACCESSORY,
  OutfitLayer.BODY_BACK,
  OutfitLayer.LEGS,
  OutfitLayer.SHOES,
  OutfitLayer.BODY_BASE,
  OutfitLayer.DRESS_OR_OUTFIT,
  OutfitLayer.ARM_BACK,
  OutfitLayer.ARM_FRONT,
  OutfitLayer.HAIR_BACK,
  OutfitLayer.HEAD,
  OutfitLayer.HAIR_FRONT,
  OutfitLayer.HAT,
  OutfitLayer.FACE_ACCESSORY,
  OutfitLayer.FRONT_ACCESSORY,
  OutfitLayer.FX,
];

export interface AnchorOffset {
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

export interface OutfitDefinition {
  id: string;
  nameZh: string;
  nameEn: string;
  slot: OutfitSlot;
  previewMode: PreviewMode;
  /** Explicit art handoff state; placeholder outfits stay safe and unavailable in the shop. */
  artworkStatus?: 'ready' | 'placeholder';
  /** Catalogue art can be delivered independently of the character-wearing art. */
  thumbnailStatus?: 'ready' | 'placeholder';
  /** Dedicated full-body art must not replace a different selected character skin. */
  supportedCharacterIds?: readonly string[];
  /** Pose files marked idleFallback are intentionally not treated as authored motion art. */
  poseArtwork?: Partial<Record<OutfitPose, OutfitPoseAvailability>>;
  aliases?: string[];
  assets: {
    idle?: string;
    run?: string;
    jump?: string;
    cheer?: string;
    thumbnail?: string;
  };
  layers?: Partial<Record<OutfitLayer, string>>;
  anchors?: Partial<Record<CharacterAnchor, AnchorOffset>>;
  price: number;
  effect?: {
    type: string;
    value: number;
  };
}

const makeFullSpriteDefinition = (definition: OutfitDefinition): OutfitDefinition => ({ ...definition });

export const OUTFIT_DEFINITIONS: readonly OutfitDefinition[] = [
  makeFullSpriteDefinition({
    id: 'scholar_robe',
    aliases: ['scholar_gown'],
    nameZh: '升小一榮譽學士袍',
    nameEn: 'Scholar Gown',
    slot: OutfitSlot.DRESS,
    previewMode: 'fullSprite',
    supportedCharacterIds: ['adventurer'],
    assets: {
      thumbnail: 'assets/outfits/scholar_gown/thumbnail.png',
      idle: 'assets/character/outfits/scholar_gown/idle.png',
      run: 'assets/character/outfits/scholar_gown/run.png',
      cheer: 'assets/character/outfits/scholar_gown/cheer.png',
    },
    poseArtwork: { run: 'idleFallback', cheer: 'idleFallback' },
    anchors: {
      [CharacterAnchor.HEAD]: { x: 0, y: -1 },
      [CharacterAnchor.NECK]: { x: 0, y: 2 },
      [CharacterAnchor.WAIST]: { x: 0, y: 8 },
      [CharacterAnchor.CROWN]: { x: 0, y: -4 },
    },
    price: 300,
    effect: { type: 'correct_answer_coin_bonus', value: 1 },
  }),
  makeFullSpriteDefinition({
    id: 'princess_dress',
    nameZh: '夢幻粉紅公主裙',
    nameEn: 'Princess Dress',
    slot: OutfitSlot.DRESS,
    previewMode: 'fullSprite',
    supportedCharacterIds: ['adventurer'],
    assets: {
      thumbnail: 'assets/outfits/princess_dress/thumbnail.png',
      idle: 'assets/character/outfits/princess_dress/idle.png',
      run: 'assets/character/outfits/princess_dress/run.png',
      cheer: 'assets/character/outfits/princess_dress/cheer.png',
    },
    poseArtwork: { run: 'idleFallback', cheer: 'idleFallback' },
    anchors: {
      [CharacterAnchor.HEAD]: { x: 0, y: -1 },
      [CharacterAnchor.NECK]: { x: 0, y: 2 },
      [CharacterAnchor.WAIST]: { x: 0, y: 7 },
    },
    price: 250,
    effect: { type: 'pink_star_trail', value: 1 },
  }),
  makeFullSpriteDefinition({
    id: 'dino_onesie',
    nameZh: '萌萌小恐龍連身衣',
    nameEn: 'Dino Onesie',
    slot: OutfitSlot.DRESS,
    previewMode: 'fullSprite',
    supportedCharacterIds: ['adventurer'],
    assets: {
      thumbnail: 'assets/outfits/dino_onesie/thumbnail.png',
      idle: 'assets/character/outfits/dino_onesie/idle.png',
      run: 'assets/character/outfits/dino_onesie/run.png',
      cheer: 'assets/character/outfits/dino_onesie/cheer.png',
    },
    poseArtwork: { run: 'idleFallback', cheer: 'idleFallback' },
    anchors: {
      [CharacterAnchor.HEAD]: { x: 0, y: -1 },
      [CharacterAnchor.NECK]: { x: 0, y: 2 },
      [CharacterAnchor.WAIST]: { x: 0, y: 8 },
    },
    price: 200,
    effect: { type: 'rock_slowdown_reduction', value: 30 },
  }),
  makeFullSpriteDefinition({
    id: 'magic_robe',
    nameZh: '星光魔法學徒袍',
    nameEn: 'Magic Robe',
    slot: OutfitSlot.DRESS,
    previewMode: 'fullSprite',
    supportedCharacterIds: ['adventurer'],
    assets: {
      thumbnail: 'assets/outfits/magic_robe/thumbnail.png',
      idle: 'assets/character/outfits/magic_robe/idle.png',
      run: 'assets/character/outfits/magic_robe/run.png',
      cheer: 'assets/character/outfits/magic_robe/cheer.png',
    },
    poseArtwork: { run: 'idleFallback', cheer: 'idleFallback' },
    anchors: {
      [CharacterAnchor.HEAD]: { x: 0, y: -1 },
      [CharacterAnchor.NECK]: { x: 0, y: 2 },
      [CharacterAnchor.WAIST]: { x: 0, y: 8 },
      [CharacterAnchor.CROWN]: { x: 0, y: -4 },
    },
    price: 280,
    effect: { type: 'coin_magnet_radius', value: 30 },
  }),
  makeFullSpriteDefinition({
    id: 'star_hoodie',
    aliases: ['hoodie_star'],
    nameZh: '閃爍星光連帽衛衣',
    nameEn: 'Star Hoodie',
    slot: OutfitSlot.TOP,
    previewMode: 'fullSprite',
    supportedCharacterIds: ['adventurer'],
    artworkStatus: 'placeholder',
    thumbnailStatus: 'placeholder',
    assets: {
      thumbnail: 'assets/outfits/star_hoodie/star_hoodie_thumbnail.png',
      idle: 'assets/character/outfits/star_hoodie/star_hoodie_wearing.png',
      run: 'assets/character/outfits/star_hoodie/star_hoodie_run.png',
      cheer: 'assets/character/outfits/star_hoodie/star_hoodie_cheer.png',
    },
    anchors: {
      [CharacterAnchor.HEAD]: { x: 0, y: -1 },
      [CharacterAnchor.NECK]: { x: 0, y: 2 },
      [CharacterAnchor.SHOULDER]: { x: 0, y: 5 },
      [CharacterAnchor.WAIST]: { x: 0, y: 18 },
      [CharacterAnchor.LEFT_HAND]: { x: -18, y: 18 },
      [CharacterAnchor.RIGHT_HAND]: { x: 18, y: 18 },
    },
    price: 90,
    effect: { type: 'star_jump_sparkle', value: 1 },
  }),
  makeFullSpriteDefinition({
    id: 'school_uniform',
    aliases: ['hk_school_shirt'],
    nameZh: '經典名校白色校服',
    nameEn: 'School Uniform',
    slot: OutfitSlot.TOP,
    previewMode: 'fullSprite',
    supportedCharacterIds: ['adventurer'],
    assets: {
      thumbnail: 'assets/outfits/school_uniform/thumbnail.png',
      idle: 'assets/character/outfits/school_uniform/idle.png',
      run: 'assets/character/outfits/school_uniform/run.png',
      cheer: 'assets/character/outfits/school_uniform/cheer.png',
    },
    anchors: {
      [CharacterAnchor.HEAD]: { x: 0, y: -1 },
      [CharacterAnchor.NECK]: { x: 0, y: 2 },
      [CharacterAnchor.SHOULDER]: { x: 0, y: 5 },
      [CharacterAnchor.WAIST]: { x: 0, y: 18 },
    },
    price: 60,
    effect: { type: 'school_uniform_bonus', value: 1 },
  }),
];

/**
 * Returns only assets that are safe to request during the initial preload.
 * A placeholder may expose its catalogue thumbnail before its wearing art is
 * delivered, but no missing wearing path should be promoted or requested.
 */
export function getWardrobePreloadPaths(
  definitions: readonly OutfitDefinition[] = OUTFIT_DEFINITIONS
): readonly string[] {
  const paths = new Set<string>();
  definitions.forEach(definition => {
    const thumbnailIsConfirmed = definition.thumbnailStatus === 'ready'
      || (definition.thumbnailStatus === undefined && definition.artworkStatus !== 'placeholder');
    if (definition.assets.thumbnail && thumbnailIsConfirmed) {
      paths.add(definition.assets.thumbnail);
    }
    if (definition.artworkStatus === 'placeholder') return;
    Object.entries(definition.assets).forEach(([assetName, path]) => {
      if (assetName !== 'thumbnail' && path) paths.add(path);
    });
    Object.values(definition.layers ?? {}).forEach(path => {
      if (path) paths.add(path);
    });
  });
  return [...paths];
}

export function getWardrobeSlot(item: WardrobeItem): OutfitSlot {
  if (item.category === 'dress') return OutfitSlot.DRESS;
  if (item.category === 'top') return OutfitSlot.TOP;
  if (item.category === 'bottom') return OutfitSlot.BOTTOM;
  if (item.id === 'angel_wings') return OutfitSlot.WINGS;
  if (item.id === 'cat_ears' || item.id === 'scholar_cap' || item.id === 'tram_hat') {
    return OutfitSlot.HAT;
  }
  return OutfitSlot.ACCESSORY;
}

export function previewWardrobe(
  equipped: EquippedWardrobe,
  item: WardrobeItem
): EquippedWardrobe {
  const next = { ...equipped };
  const slot = getWardrobeSlot(item);

  if (slot === OutfitSlot.DRESS) {
    delete next.top;
    delete next.bottom;
    next.dress = item.id;
  } else if (slot === OutfitSlot.TOP || slot === OutfitSlot.BOTTOM) {
    delete next.dress;
    next[slot] = item.id;
  } else if (slot === OutfitSlot.HAT || slot === OutfitSlot.ACCESSORY || slot === OutfitSlot.WINGS) {
    next[slot] = item.id;
  }

  return next;
}
