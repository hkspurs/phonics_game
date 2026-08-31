import Phaser from 'phaser';
import { DataManager } from './DataManager';
import type { EquippedWardrobe } from '../types';
import { OUTFIT_DEFINITIONS, OutfitDefinition } from '../config/outfits';

export interface AvatarSkinConfig {
  id: string;
  name: string;
  idleKey: string;
  runKey: string;
  cheerKey: string;
  tint?: number;
  speedMultiplier: number;
  jumpMultiplier: number;
  magnetRadius: number;
}

export const AVATAR_SKIN_CONFIGS: Record<string, AvatarSkinConfig> = {
  adventurer: {
    id: 'adventurer',
    name: '冒險家 (Adventurer)',
    idleKey: 'player_stand',
    runKey: 'player_walk1',
    cheerKey: 'player_cheer1',
    speedMultiplier: 1.0,
    jumpMultiplier: 1.0,
    magnetRadius: 100,
  },
  heroine: {
    id: 'heroine',
    name: '女英雄 (Heroine)',
    idleKey: 'female_stand',
    runKey: 'female_walk1',
    cheerKey: 'female_cheer1',
    speedMultiplier: 1.10,
    jumpMultiplier: 1.10,
    magnetRadius: 130,
  },
  female: {
    id: 'female',
    name: '女英雄 (Heroine)',
    idleKey: 'female_stand',
    runKey: 'female_walk1',
    cheerKey: 'female_cheer1',
    speedMultiplier: 1.10,
    jumpMultiplier: 1.10,
    magnetRadius: 130,
  },
  soldier: {
    id: 'soldier',
    name: '小戰士 (Soldier)',
    idleKey: 'soldier_stand',
    runKey: 'soldier_walk1',
    cheerKey: 'soldier_cheer1',
    speedMultiplier: 1.05,
    jumpMultiplier: 1.20,
    magnetRadius: 100,
  },
  knight: {
    id: 'knight',
    name: '皇家騎士 (Knight)',
    idleKey: 'player_stand',
    runKey: 'player_walk1',
    cheerKey: 'player_cheer1',
    tint: 0x4a90e2, // Royal Blue Armor Glow
    speedMultiplier: 1.15,
    jumpMultiplier: 1.15,
    magnetRadius: 150,
  },
  ninja: {
    id: 'ninja',
    name: '暗影忍者 (Ninja)',
    idleKey: 'player_stand',
    runKey: 'player_walk1',
    cheerKey: 'player_cheer1',
    tint: 0x222222, // Shadow Dark Cloak
    speedMultiplier: 1.25,
    jumpMultiplier: 1.25,
    magnetRadius: 180,
  },
};

export interface PlayerAppearance {
  skinId: string;
  skinConfig: AvatarSkinConfig;
  wardrobe: EquippedWardrobe;
  petId?: string;
  hasShield: boolean;
  hasMagnet: boolean;
  hasSpringShoes: boolean;
  hasDoubleCoin: boolean;
  outfitDefinition?: OutfitDefinition;
}

export class PlayerAvatarService {
  private static instance: PlayerAvatarService;

  public static getInstance(): PlayerAvatarService {
    if (!PlayerAvatarService.instance) {
      PlayerAvatarService.instance = new PlayerAvatarService();
    }
    return PlayerAvatarService.instance;
  }

  /**
   * Retrieves the comprehensive player appearance snapshot
   */
  public getAppearance(): PlayerAppearance {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const skinId = (profile?.equippedSkin || 'adventurer').toLowerCase();
    const skinConfig = AVATAR_SKIN_CONFIGS[skinId] || AVATAR_SKIN_CONFIGS.adventurer;
    const wardrobe = dm.getEquippedWardrobe();
    const petId = profile?.equippedPet || undefined;

    // Find active Level-1 dedicated outfit definition if equipped
    const outfitId = wardrobe.dress || wardrobe.top || wardrobe.bottom;
    const outfitDefinition = outfitId
      ? OUTFIT_DEFINITIONS.find(
          (d) => d.id === outfitId || (d.aliases && d.aliases.includes(outfitId))
        )
      : undefined;

    return {
      skinId,
      skinConfig,
      wardrobe,
      petId,
      hasShield: dm.getGadgetCount('shield') > 0,
      hasMagnet: dm.getGadgetCount('magnet') > 0,
      hasSpringShoes: dm.getGadgetCount('spring_shoes') > 0,
      hasDoubleCoin: dm.getGadgetCount('double_coin') > 0,
      outfitDefinition,
    };
  }

  /**
   * Resolves the primary texture key for a given pose
   */
  public getTextureKey(pose: 'idle' | 'run' | 'cheer' = 'idle', scene?: Phaser.Scene): {
    textureKey: string;
    isFullSprite: boolean;
    tint?: number;
  } {
    const appearance = this.getAppearance();

    // 1. Check for Level-1 Dedicated AI Outfit Sprite
    if (appearance.outfitDefinition) {
      const assetPath =
        appearance.outfitDefinition.assets[pose] ||
        appearance.outfitDefinition.assets.idle;

      if (assetPath) {
        // If scene textures are available, verify existence; otherwise default to path
        if (!scene || !scene.textures || scene.textures.exists(assetPath)) {
          return {
            textureKey: assetPath,
            isFullSprite: true,
            tint: undefined,
          };
        }
      }
    }

    // 2. Base Skin Sprite
    let baseKey = appearance.skinConfig.idleKey;
    if (pose === 'run') {
      baseKey = appearance.skinConfig.runKey || appearance.skinConfig.idleKey;
    } else if (pose === 'cheer') {
      baseKey = appearance.skinConfig.cheerKey || appearance.skinConfig.idleKey;
    }

    return {
      textureKey: baseKey,
      isFullSprite: false,
      tint: appearance.skinConfig.tint,
    };
  }
}
