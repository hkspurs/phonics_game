/**
 * Comprehensive TypeScript definitions for Dream Wardrobe & Hybrid Character Outfit System
 */

export type OutfitSlot =
  | 'dress'
  | 'top'
  | 'bottom'
  | 'hat'
  | 'glasses'
  | 'backpack'
  | 'wings'
  | 'accessory'
  | 'shoes';

export type OutfitPreviewMode = 'fullSprite' | 'layered' | 'composite';

export enum OutfitLayerDepth {
  BACKGROUND = 10,
  WINGS = 35,
  BODY_BACK = 38,
  LEGS = 39,
  BODY_BASE = 40,
  DRESS_OR_OUTFIT = 44,
  TOP = 45,
  BOTTOM = 46,
  BACKPACK = 47,
  GLASSES = 48,
  HAT = 49,
  FRONT_ACCESSORY = 50,
  FX = 55,
  UI_CONTROLS = 60,
  MODAL_POPUP = 200,
}

export interface AnchorOffset {
  x: number;
  y: number;
  scale?: number;
}

export interface CharacterAnchor {
  head?: AnchorOffset;
  neck?: AnchorOffset;
  chest?: AnchorOffset;
  waist?: AnchorOffset;
  feet?: AnchorOffset;
  back?: AnchorOffset;
  eyes?: AnchorOffset;
}

export interface OutfitEffect {
  type:
    | 'correct_answer_coin_bonus'
    | 'magnet_radius_bonus'
    | 'obstacle_slow_reduction'
    | 'speed_bonus'
    | 'star_trail'
    | 'double_jump_boost'
    | 'cosmetic';
  value: number;
  description: string;
}

export interface OutfitAssets {
  thumbnail?: string;
  idle?: string;
  run?: string;
  cheer?: string;
  layers?: Record<string, string>;
}

export interface OutfitDefinition {
  id: string;
  nameZh: string;
  nameEn: string;
  slot: OutfitSlot;
  category: 'dress' | 'top' | 'bottom' | 'accessory';
  previewMode: OutfitPreviewMode;
  assets: OutfitAssets;
  anchors?: CharacterAnchor;
  priceCoins: number;
  priceGems: number;
  description: string;
  perkDescription: string;
  effect?: OutfitEffect;
  speakEn: string;
  speakZh: string;
  tint?: number;
  icon: string;
}

export interface ExpandedEquippedWardrobe {
  dress?: string;
  top?: string;
  bottom?: string;
  hat?: string;
  glasses?: string;
  backpack?: string;
  wings?: string;
  accessory?: string;
  shoes?: string;
}
