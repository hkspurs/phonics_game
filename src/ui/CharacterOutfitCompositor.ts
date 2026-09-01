import Phaser from 'phaser';
import { EquippedWardrobe } from '../types';

export type PreviewCoordinateSpace = 'base' | 'fullSprite';

/** The authored wearing sprites use the shared 512px canvas contract. */
export const FULL_SPRITE_LOCAL_SCALE = 0.23;
export const FULL_SPRITE_CANVAS_CENTER = 256;
export const FULL_SPRITE_GROUND_BASELINE = 460;

/**
 * CharacterOutfitCompositor
 *
 * Dynamically draws bespoke, high-DPI vector-sharp outfit apparel directly onto characters
 * according to equipped wardrobe combinations (Dresses, Tops, Bottoms, Hats, Glasses, Wings, Backpacks).
 * Replaces floating text emojis with beautifully rendered graphical garments that fit character anatomy.
 */
export class CharacterOutfitCompositor {
  /**
   * Renders the complete layered outfit for a character at (x, y) with given scale.
   * Creates or updates a Phaser.GameObjects.Graphics instance.
   */
  public static renderOutfit(
    graphics: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    options: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      flipX?: boolean;
      isAirborne?: boolean;
      includeBackAccessories?: boolean;
    } = {}
  ): void {
    if (!graphics || typeof graphics.clear !== 'function') return;

    graphics.clear();
    const scale = options.scale ?? 1.0;
    const ox = options.offsetX ?? 0;
    const oy = options.offsetY ?? 0;
    const flip = options.flipX ? -1 : 1;
    const includeBackAccessories = options.includeBackAccessories ?? true;

    // 1. Wings Layer (Rendered behind body)
    if (includeBackAccessories && (equipped.wings || (equipped as any).accessory === 'angel_wings')) {
      this.drawAngelWings(graphics, ox, oy, scale, flip);
    }

    // 2. Dress / Robe (Mutually exclusive with Top & Bottom)
    if (equipped.dress) {
      this.drawDress(graphics, equipped.dress, ox, oy, scale, flip);
    } else {
      // 3. Top / Shirt
      if (equipped.top) {
        this.drawTop(graphics, equipped.top, ox, oy, scale, flip);
      }
      // 4. Bottom / Skirt / Shorts
      if (equipped.bottom) {
        this.drawBottom(graphics, equipped.bottom, ox, oy, scale, flip);
      }
    }

    // 5. Backpack (Over shoulder)
    if (includeBackAccessories && ((equipped as any).backpack === 'star_backpack' || (equipped as any).accessory === 'star_backpack')) {
      this.drawStarBackpack(graphics, ox, oy, scale, flip);
    }

    // 6. Glasses (Over face)
    if ((equipped as any).glasses === 'star_glasses' || (equipped as any).accessory === 'star_glasses') {
      this.drawSmartGlasses(graphics, ox, oy, scale, flip);
    }

    // 7. Hat / Headwear (On head)
    const hatId = (equipped as any).hat || (['cat_ears', 'scholar_cap', 'tram_hat'].includes((equipped as any).accessory || '') ? (equipped as any).accessory : undefined);
    if (hatId) {
      this.drawHat(graphics, hatId, ox, oy, scale, flip);
    }
  }

  /**
   * Preview-only fallback. It keeps the legacy Runner coordinates untouched while
   * fitting the fallback garments to the larger dressing-room character.
   */
  public static renderPreviewOutfit(
    graphics: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    options: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      flipX?: boolean;
      includeBackAccessories?: boolean;
    } = {}
  ): void {
    if (!graphics || typeof graphics.clear !== 'function') return;

    graphics.clear();
    const scale = options.scale ?? 1;
    const ox = options.offsetX ?? 0;
    const oy = options.offsetY ?? 0;
    const flip = options.flipX ? -1 : 1;
    const includeBackAccessories = options.includeBackAccessories ?? true;
    // The Kenney base's neck starts around local y=-2 (the image is 110px high).
    // Moving garments down to this anchor keeps collars below the face and leaves hands visible.
    const fittedY = oy + 17 * scale;

    // Preserve the intended depth order: back pieces, garment, then face/head pieces.
    if (includeBackAccessories && (equipped.wings || equipped.accessory === 'angel_wings')) {
      this.drawAngelWings(graphics, ox, fittedY, scale, flip);
    }
    if (includeBackAccessories && ((equipped as any).backpack === 'star_backpack' || equipped.accessory === 'star_backpack')) {
      this.drawStarBackpack(graphics, ox, fittedY, scale, flip);
    }

    if (equipped.dress) {
      this.drawDress(graphics, equipped.dress, ox, fittedY, scale, flip);
    } else {
      if (equipped.top) this.drawTop(graphics, equipped.top, ox, fittedY, scale, flip);
      if (equipped.bottom) this.drawBottom(graphics, equipped.bottom, ox, fittedY, scale, flip);
    }

    this.drawPreviewFrontAccessories(graphics, equipped, scale, ox, oy, flip);
  }

  /** Draws only optional accessories over a dedicated full-body outfit sprite. */
  public static renderPreviewAccessories(
    graphics: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    options: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      flipX?: boolean;
      coordinateSpace?: PreviewCoordinateSpace;
    } = {}
  ): void {
    if (!graphics || typeof graphics.clear !== 'function') return;

    graphics.clear();
    const scale = options.scale ?? 1;
    const ox = options.offsetX ?? 0;
    const oy = options.offsetY ?? 0;
    const flip = options.flipX ? -1 : 1;
    const coordinateSpace = options.coordinateSpace ?? 'base';
    if (coordinateSpace === 'fullSprite') {
      this.drawFullSpriteBackAccessories(graphics, equipped, scale, ox, oy, flip);
      this.drawFullSpriteFrontAccessories(graphics, equipped, scale, ox, oy, flip);
      return;
    }
    this.drawPreviewAccessories(graphics, equipped, scale, ox, oy, flip);
  }

  /**
   * Renders modular BACK accessories (Angel Wings, Star Backpack) behind the character sprite
   */
  public static renderPreviewBackAccessories(
    graphics: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    options: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      flipX?: boolean;
      coordinateSpace?: PreviewCoordinateSpace;
    } = {}
  ): void {
    if (!graphics || typeof graphics.clear !== 'function') return;

    graphics.clear();
    const scale = options.scale ?? 1;
    const ox = options.offsetX ?? 0;
    const oy = options.offsetY ?? 0;
    const flip = options.flipX ? -1 : 1;

    if (options.coordinateSpace === 'fullSprite') {
      this.drawFullSpriteBackAccessories(graphics, equipped, scale, ox, oy, flip);
      return;
    }

    if (equipped.wings || equipped.accessory === 'angel_wings') {
      this.drawAngelWings(graphics, ox, oy + 5 * scale, scale, flip);
    }
    if ((equipped as any).backpack === 'star_backpack' || equipped.accessory === 'star_backpack') {
      this.drawStarBackpack(graphics, ox, oy + 5 * scale, scale, flip);
    }
  }

  /**
   * Renders modular FRONT accessories (Glasses, Hats) in front of the character sprite
   */
  public static renderPreviewFrontAccessories(
    graphics: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    options: {
      scale?: number;
      offsetX?: number;
      offsetY?: number;
      flipX?: boolean;
      coordinateSpace?: PreviewCoordinateSpace;
    } = {}
  ): void {
    if (!graphics || typeof graphics.clear !== 'function') return;

    graphics.clear();
    const scale = options.scale ?? 1;
    const ox = options.offsetX ?? 0;
    const oy = options.offsetY ?? 0;
    const flip = options.flipX ? -1 : 1;

    if (options.coordinateSpace === 'fullSprite') {
      this.drawFullSpriteFrontAccessories(graphics, equipped, scale, ox, oy, flip);
      return;
    }

    this.drawPreviewFrontAccessories(graphics, equipped, scale, ox, oy, flip);
  }

  private static drawFullSpriteBackAccessories(
    g: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    scale: number,
    ox: number,
    oy: number,
    flip: number
  ): void {
    const s = FULL_SPRITE_LOCAL_SCALE * scale;
    const pointX = (sourceX: number) => ox + (sourceX - FULL_SPRITE_CANVAS_CENTER) * s * flip;
    const pointY = (sourceY: number) => oy + (sourceY - FULL_SPRITE_CANVAS_CENTER) * s;

    if (equipped.wings || equipped.accessory === 'angel_wings') {
      g.fillStyle(0xffffff, 0.95);
      g.lineStyle(3 * s, 0x93c5fd, 0.9);
      g.beginPath();
      g.moveTo(pointX(220), pointY(286));
      g.lineTo(pointX(143), pointY(220));
      g.lineTo(pointX(112), pointY(245));
      g.lineTo(pointX(126), pointY(296));
      g.lineTo(pointX(164), pointY(330));
      g.lineTo(pointX(208), pointY(316));
      g.closePath();
      g.fillPath();
      g.strokePath();

      g.beginPath();
      g.moveTo(pointX(292), pointY(286));
      g.lineTo(pointX(369), pointY(220));
      g.lineTo(pointX(400), pointY(245));
      g.lineTo(pointX(386), pointY(296));
      g.lineTo(pointX(348), pointY(330));
      g.lineTo(pointX(304), pointY(316));
      g.closePath();
      g.fillPath();
      g.strokePath();

      g.fillStyle(0xe0f2fe, 0.85);
      g.fillCircle(pointX(165), pointY(268), 12 * s);
      g.fillCircle(pointX(347), pointY(268), 12 * s);
    }

    if ((equipped as any).backpack === 'star_backpack' || equipped.accessory === 'star_backpack') {
      const bpX = pointX(356);
      const bpY = pointY(278);
      g.fillStyle(0xeab308, 1.0);
      g.lineStyle(3 * s, 0xca8a04, 1.0);
      g.fillCircle(bpX, bpY, 24 * s);
      if (typeof (g as any).strokeCircle === 'function') {
        (g as any).strokeCircle(bpX, bpY, 24 * s);
      } else if (typeof g.strokeCircleShape === 'function') {
        g.strokeCircleShape(new Phaser.Geom.Circle(bpX, bpY, 24 * s));
      }
      g.fillStyle(0xffffff, 1.0);
      g.fillCircle(pointX(356), pointY(274), 9 * s);
      g.fillStyle(0xeab308, 1.0);
      g.fillCircle(pointX(356), pointY(274), 4 * s);
      g.lineStyle(3 * s, 0x854d0e, 0.9);
      this.drawLine(g, pointX(332), pointY(255), pointX(349), pointY(296));
    }
  }

  private static drawFullSpriteFrontAccessories(
    g: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    scale: number,
    ox: number,
    oy: number,
    flip: number
  ): void {
    const s = FULL_SPRITE_LOCAL_SCALE * scale;
    const pointX = (sourceX: number) => ox + (sourceX - FULL_SPRITE_CANVAS_CENTER) * s * flip;
    const pointY = (sourceY: number) => oy + (sourceY - FULL_SPRITE_CANVAS_CENTER) * s;

    if ((equipped as any).glasses === 'star_glasses' || equipped.accessory === 'star_glasses') {
      const glassY = pointY(185);
      g.lineStyle(2.5 * s, 0xf59e0b, 1.0);
      g.fillStyle(0x0f172a, 0.35);
      g.fillCircle(pointX(221), glassY, 18 * s);
      if (typeof (g as any).strokeCircle === 'function') {
        (g as any).strokeCircle(pointX(221), glassY, 18 * s);
      } else if (typeof g.strokeCircleShape === 'function') {
        g.strokeCircleShape(new Phaser.Geom.Circle(pointX(221), glassY, 18 * s));
      }
      g.fillCircle(pointX(291), glassY, 18 * s);
      if (typeof (g as any).strokeCircle === 'function') {
        (g as any).strokeCircle(pointX(291), glassY, 18 * s);
      } else if (typeof g.strokeCircleShape === 'function') {
        g.strokeCircleShape(new Phaser.Geom.Circle(pointX(291), glassY, 18 * s));
      }
      this.drawLine(g, pointX(241), glassY, pointX(271), glassY);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(pointX(228), pointY(179), 4 * s);
      g.fillCircle(pointX(298), pointY(179), 4 * s);
    }

    const hatId = equipped.hat || (['cat_ears', 'scholar_cap', 'tram_hat'].includes(equipped.accessory || '') ? equipped.accessory : undefined);
    if (!hatId) return;

    switch (hatId) {
      case 'scholar_cap': {
        g.fillStyle(0x0f172a, 1.0);
        g.lineStyle(3 * s, 0x334155, 1.0);
        g.beginPath();
        g.moveTo(pointX(256), pointY(84));
        g.lineTo(pointX(337), pointY(108));
        g.lineTo(pointX(256), pointY(132));
        g.lineTo(pointX(175), pointY(108));
        g.closePath();
        g.fillPath();
        g.strokePath();
        const capBase = this.mirroredRectBounds(pointX, 218, 294);
        g.fillRect(capBase.x, pointY(119), capBase.width, 16 * s);
        g.fillStyle(0xf59e0b, 1.0);
        g.fillCircle(pointX(256), pointY(106), 6 * s);
        g.lineStyle(3 * s, 0xf59e0b, 1.0);
        this.drawLine(g, pointX(256), pointY(106), pointX(314), pointY(145));
        g.fillCircle(pointX(314), pointY(145), 5 * s);
        break;
      }
      case 'cat_ears': {
        g.fillStyle(0xec4899, 1.0);
        g.lineStyle(3 * s, 0xbe185d, 1.0);
        g.beginPath();
        g.moveTo(pointX(183), pointY(124));
        g.lineTo(pointX(204), pointY(54));
        g.lineTo(pointX(246), pointY(116));
        g.closePath();
        g.fillPath();
        g.strokePath();
        g.beginPath();
        g.moveTo(pointX(266), pointY(116));
        g.lineTo(pointX(308), pointY(54));
        g.lineTo(pointX(329), pointY(124));
        g.closePath();
        g.fillPath();
        g.strokePath();
        g.fillStyle(0xfbcfe8, 1.0);
        g.beginPath();
        g.moveTo(pointX(194), pointY(113));
        g.lineTo(pointX(205), pointY(70));
        g.lineTo(pointX(232), pointY(113));
        g.closePath();
        g.fillPath();
        g.beginPath();
        g.moveTo(pointX(277), pointY(113));
        g.lineTo(pointX(307), pointY(70));
        g.lineTo(pointX(318), pointY(113));
        g.closePath();
        g.fillPath();
        break;
      }
      case 'tram_hat': {
        g.fillStyle(0x065f46, 1.0);
        g.lineStyle(3 * s, 0x042f2e, 1.0);
        const hatBody = this.mirroredRectBounds(pointX, 192, 320);
        g.fillRoundedRect(hatBody.x, pointY(101), hatBody.width, 48 * s, 8 * s);
        g.strokeRoundedRect(hatBody.x, pointY(101), hatBody.width, 48 * s, 8 * s);
        g.fillStyle(0xf59e0b, 1.0);
        const hatBand = this.mirroredRectBounds(pointX, 200, 312);
        g.fillRect(hatBand.x, pointY(128), hatBand.width, 9 * s);
        g.fillStyle(0x0f172a, 1.0);
        const hatBrim = this.mirroredRectBounds(pointX, 180, 332);
        g.fillRoundedRect(hatBrim.x, pointY(137), hatBrim.width, 17 * s, 5 * s);
        break;
      }
    }
  }

  private static drawPreviewAccessories(
    graphics: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    scale: number,
    ox: number,
    oy: number,
    flip: number
  ): void {
    if (equipped.wings || equipped.accessory === 'angel_wings') {
      this.drawAngelWings(graphics, ox, oy + 5 * scale, scale, flip);
    }
    if ((equipped as any).backpack === 'star_backpack' || equipped.accessory === 'star_backpack') {
      this.drawStarBackpack(graphics, ox, oy + 5 * scale, scale, flip);
    }
    this.drawPreviewFrontAccessories(graphics, equipped, scale, ox, oy, flip);
  }

  private static drawPreviewFrontAccessories(
    graphics: Phaser.GameObjects.Graphics,
    equipped: EquippedWardrobe,
    scale: number,
    ox: number,
    oy: number,
    flip: number
  ): void {
    if ((equipped as any).glasses === 'star_glasses' || equipped.accessory === 'star_glasses') {
      this.drawSmartGlasses(graphics, ox, oy, scale, flip);
    }
    const hatId = equipped.hat || (['cat_ears', 'scholar_cap', 'tram_hat'].includes(equipped.accessory || '') ? equipped.accessory : undefined);
    if (hatId) this.drawHat(graphics, hatId, ox, oy, scale, flip);
  }

  // --- 🪽 Wings (Angel Wings) ---
  private static drawAngelWings(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
    s: number,
    flip: number
  ): void {
    const wingY = oy - 4 * s;

    // Left Wing
    g.fillStyle(0xffffff, 0.95);
    g.lineStyle(2 * s, 0x93c5fd, 0.9);

    g.beginPath();
    g.moveTo(ox - 10 * s * flip, wingY);
    g.lineTo(ox - 42 * s * flip, wingY - 26 * s);
    g.lineTo(ox - 48 * s * flip, wingY - 14 * s);
    g.lineTo(ox - 44 * s * flip, wingY + 4 * s);
    g.lineTo(ox - 32 * s * flip, wingY + 16 * s);
    g.lineTo(ox - 12 * s * flip, wingY + 8 * s);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Right Wing
    g.beginPath();
    g.moveTo(ox + 10 * s * flip, wingY);
    g.lineTo(ox + 42 * s * flip, wingY - 26 * s);
    g.lineTo(ox + 48 * s * flip, wingY - 14 * s);
    g.lineTo(ox + 44 * s * flip, wingY + 4 * s);
    g.lineTo(ox + 32 * s * flip, wingY + 16 * s);
    g.lineTo(ox + 12 * s * flip, wingY + 8 * s);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Inner Feather Fluff
    g.fillStyle(0xe0f2fe, 0.85);
    g.fillCircle(ox - 24 * s * flip, wingY - 6 * s, 8 * s);
    g.fillCircle(ox + 24 * s * flip, wingY - 6 * s, 8 * s);
  }

  // --- 👗 Dresses & Full-body Robes ---
  private static drawDress(
    g: Phaser.GameObjects.Graphics,
    dressId: string,
    ox: number,
    oy: number,
    s: number,
    flip: number
  ): void {
    const bodyY = oy + 2 * s;

    switch (dressId) {
      case 'princess_dress': {
        // Main Gown Flare
        g.fillStyle(0xffb6c1, 0.95);
        g.lineStyle(2 * s, 0xf472b6, 1.0);
        g.beginPath();
        g.moveTo(ox - 14 * s * flip, bodyY - 14 * s);
        g.lineTo(ox + 14 * s * flip, bodyY - 14 * s);
        g.lineTo(ox + 26 * s * flip, bodyY + 28 * s);
        g.lineTo(ox - 26 * s * flip, bodyY + 28 * s);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // White Lace Waist Sash
        g.fillStyle(0xffffff, 1.0);
        g.fillRoundedRect(ox - 15 * s, bodyY - 2 * s, 30 * s, 6 * s, 3 * s);

        // Golden Heart / Star Brooch
        g.fillStyle(0xfbbf24, 1.0);
        g.fillCircle(ox, bodyY - 8 * s, 4 * s);

        // Pink Gown Ruffles
        g.lineStyle(1.5 * s, 0xf43f5e, 0.8);
        g.strokeCircle(ox - 12 * s, bodyY + 20 * s, 6 * s);
        g.strokeCircle(ox, bodyY + 20 * s, 6 * s);
        g.strokeCircle(ox + 12 * s, bodyY + 20 * s, 6 * s);
        break;
      }
      case 'scholar_robe': {
        // Royal Navy Graduation Gown
        g.fillStyle(0x1e3a8a, 0.95);
        g.lineStyle(2 * s, 0x172554, 1.0);
        g.beginPath();
        g.moveTo(ox - 16 * s * flip, bodyY - 16 * s);
        g.lineTo(ox + 16 * s * flip, bodyY - 16 * s);
        g.lineTo(ox + 24 * s * flip, bodyY + 30 * s);
        g.lineTo(ox - 24 * s * flip, bodyY + 30 * s);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Golden Embroidered Lapels
        g.fillStyle(0xf59e0b, 1.0);
        g.fillRect(ox - 4 * s, bodyY - 16 * s, 8 * s, 44 * s);

        // Gold Crest Collar
        g.fillStyle(0xfcd34d, 1.0);
        g.fillCircle(ox, bodyY - 10 * s, 5 * s);
        break;
      }
      case 'dino_onesie': {
        // Emerald Dinosaur Onesie Body
        g.fillStyle(0x22c55e, 0.95);
        g.lineStyle(2 * s, 0x15803d, 1.0);
        g.fillRoundedRect(ox - 18 * s, bodyY - 16 * s, 36 * s, 44 * s, 10 * s);
        g.strokeRoundedRect(ox - 18 * s, bodyY - 16 * s, 36 * s, 44 * s, 10 * s);

        // Soft Yellow Dino Belly
        g.fillStyle(0xfef08a, 0.95);
        g.fillEllipse(ox, bodyY + 6 * s, 22 * s, 26 * s);

        // Dino Back Ridge Spikes
        g.fillStyle(0xeab308, 1.0);
        g.beginPath();
        g.moveTo(ox - 18 * s * flip, bodyY - 6 * s);
        g.lineTo(ox - 26 * s * flip, bodyY);
        g.lineTo(ox - 18 * s * flip, bodyY + 6 * s);
        g.closePath();
        g.fillPath();

        g.beginPath();
        g.moveTo(ox - 18 * s * flip, bodyY + 8 * s);
        g.lineTo(ox - 26 * s * flip, bodyY + 14 * s);
        g.lineTo(ox - 18 * s * flip, bodyY + 20 * s);
        g.closePath();
        g.fillPath();
        break;
      }
      case 'magic_robe': {
        // Mystic Celestial Indigo Robe
        g.fillStyle(0x4c1d95, 0.95);
        g.lineStyle(2 * s, 0x311068, 1.0);
        g.beginPath();
        g.moveTo(ox - 16 * s * flip, bodyY - 16 * s);
        g.lineTo(ox + 16 * s * flip, bodyY - 16 * s);
        g.lineTo(ox + 26 * s * flip, bodyY + 30 * s);
        g.lineTo(ox - 26 * s * flip, bodyY + 30 * s);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Golden Runes & Star Trim
        g.fillStyle(0xfde047, 1.0);
        g.fillCircle(ox - 10 * s, bodyY + 14 * s, 3 * s);
        g.fillCircle(ox + 10 * s, bodyY + 14 * s, 3 * s);
        g.fillCircle(ox, bodyY + 24 * s, 3.5 * s);

        // Mystic Belt
        g.fillStyle(0x7c3aed, 1.0);
        g.fillRect(ox - 16 * s, bodyY - 2 * s, 32 * s, 5 * s);
        break;
      }
    }
  }

  // --- 👕 Tops & Shirts ---
  private static drawTop(
    g: Phaser.GameObjects.Graphics,
    topId: string,
    ox: number,
    oy: number,
    s: number,
    flip: number
  ): void {
    const topY = oy - 4 * s;

    switch (topId) {
      case 'sailor_top': {
        // White Sailor Shirt Body
        g.fillStyle(0xf8fafc, 0.98);
        g.lineStyle(2 * s, 0x1e3a8a, 1.0);
        g.fillRoundedRect(ox - 16 * s, topY - 10 * s, 32 * s, 22 * s, 5 * s);
        g.strokeRoundedRect(ox - 16 * s, topY - 10 * s, 32 * s, 22 * s, 5 * s);

        // Navy Sailor Collar
        g.fillStyle(0x1e3a8a, 1.0);
        g.beginPath();
        g.moveTo(ox - 14 * s, topY - 10 * s);
        g.lineTo(ox + 14 * s, topY - 10 * s);
        g.lineTo(ox + 6 * s, topY + 2 * s);
        g.lineTo(ox - 6 * s, topY + 2 * s);
        g.closePath();
        g.fillPath();

        // Red Sailor Ribbon / Bowtie
        g.fillStyle(0xef4444, 1.0);
        g.beginPath();
        g.moveTo(ox - 6 * s, topY + 2 * s);
        g.lineTo(ox + 6 * s, topY + 2 * s);
        g.lineTo(ox, topY + 8 * s);
        g.closePath();
        g.fillPath();
        break;
      }
      case 'hk_school_shirt': {
        // Crisp White School Uniform Body
        g.fillStyle(0xffffff, 0.98);
        g.lineStyle(1.5 * s, 0x94a3b8, 1.0);
        g.fillRoundedRect(ox - 15 * s, topY - 10 * s, 30 * s, 22 * s, 4 * s);
        g.strokeRoundedRect(ox - 15 * s, topY - 10 * s, 30 * s, 22 * s, 4 * s);

        // School Tie
        g.fillStyle(0x1e40af, 1.0);
        g.fillRect(ox - 2.5 * s, topY - 8 * s, 5 * s, 14 * s);

        // School Pocket & Crest Badge
        g.fillStyle(0x3b82f6, 1.0);
        g.fillRoundedRect(ox + 4 * s * flip, topY - 3 * s, 6 * s, 6 * s, 2 * s);
        break;
      }
      case 'sport_jersey': {
        // Athletic Cyan Jersey Body
        g.fillStyle(0x06b6d4, 0.95);
        g.lineStyle(2 * s, 0x0891b2, 1.0);
        g.fillRoundedRect(ox - 16 * s, topY - 10 * s, 32 * s, 22 * s, 5 * s);
        g.strokeRoundedRect(ox - 16 * s, topY - 10 * s, 32 * s, 22 * s, 5 * s);

        // White Speed Racing Stripes
        g.fillStyle(0xffffff, 1.0);
        g.fillRect(ox - 14 * s, topY - 10 * s, 3 * s, 22 * s);
        g.fillRect(ox + 11 * s, topY - 10 * s, 3 * s, 22 * s);

        // Number 1 Badge
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(ox, topY, 5 * s);
        g.fillStyle(0x0e7490, 1.0);
        g.fillRect(ox - 1 * s, topY - 3 * s, 2 * s, 6 * s);
        break;
      }
    }
  }

  // --- 👖 Bottoms / Skirts / Shorts ---
  private static drawBottom(
    g: Phaser.GameObjects.Graphics,
    bottomId: string,
    ox: number,
    oy: number,
    s: number,
    _flip: number
  ): void {
    const bottomY = oy + 12 * s;

    switch (bottomId) {
      case 'pleated_skirt': {
        // British Navy Pleated Skirt
        g.fillStyle(0x1e293b, 0.98);
        g.lineStyle(2 * s, 0x0f172a, 1.0);
        g.beginPath();
        g.moveTo(ox - 15 * s, bottomY - 4 * s);
        g.lineTo(ox + 15 * s, bottomY - 4 * s);
        g.lineTo(ox + 22 * s, bottomY + 14 * s);
        g.lineTo(ox - 22 * s, bottomY + 14 * s);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Pleat Folds
        g.lineStyle(1.5 * s, 0x334155, 1.0);
        this.drawLine(g, ox - 8 * s, bottomY - 2 * s, ox - 11 * s, bottomY + 14 * s);
        this.drawLine(g, ox, bottomY - 2 * s, ox, bottomY + 14 * s);
        this.drawLine(g, ox + 8 * s, bottomY - 2 * s, ox + 11 * s, bottomY + 14 * s);
        break;
      }
      case 'denim_shorts': {
        // Casual Blue Denim Shorts
        g.fillStyle(0x3b82f6, 0.98);
        g.lineStyle(2 * s, 0x1d4ed8, 1.0);
        g.fillRoundedRect(ox - 14 * s, bottomY - 4 * s, 28 * s, 14 * s, 4 * s);
        g.strokeRoundedRect(ox - 14 * s, bottomY - 4 * s, 28 * s, 14 * s, 4 * s);

        // Rivets & Stitching
        g.fillStyle(0xd97706, 1.0);
        g.fillCircle(ox - 10 * s, bottomY, 1.5 * s);
        g.fillCircle(ox + 10 * s, bottomY, 1.5 * s);
        break;
      }
      case 'sport_shorts': {
        // Dark Athletic Shorts
        g.fillStyle(0x111827, 0.98);
        g.lineStyle(1.5 * s, 0x374151, 1.0);
        g.fillRoundedRect(ox - 14 * s, bottomY - 4 * s, 28 * s, 13 * s, 4 * s);
        g.strokeRoundedRect(ox - 14 * s, bottomY - 4 * s, 28 * s, 13 * s, 4 * s);

        // White Athletic Trim
        g.fillStyle(0xffffff, 1.0);
        g.fillRect(ox - 13 * s, bottomY + 6 * s, 26 * s, 2 * s);
        break;
      }
      case 'magic_tutu': {
        // Starry Violet Ballet Tutu
        g.fillStyle(0xd946ef, 0.9);
        g.lineStyle(2 * s, 0xa21caf, 1.0);
        g.beginPath();
        g.moveTo(ox - 14 * s, bottomY - 4 * s);
        g.lineTo(ox + 14 * s, bottomY - 4 * s);
        g.lineTo(ox + 24 * s, bottomY + 12 * s);
        g.lineTo(ox - 24 * s, bottomY + 12 * s);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Glistening Sparkle Dots
        g.fillStyle(0xfdf4ff, 1.0);
        g.fillCircle(ox - 12 * s, bottomY + 4 * s, 2 * s);
        g.fillCircle(ox, bottomY + 6 * s, 2.5 * s);
        g.fillCircle(ox + 12 * s, bottomY + 4 * s, 2 * s);
        break;
      }
    }
  }

  private static drawLine(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number): void {
    if (typeof (g as any).lineBetween === 'function') {
      (g as any).lineBetween(x1, y1, x2, y2);
    } else {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
    }
  }

  private static mirroredRectBounds(
    pointX: (sourceX: number) => number,
    left: number,
    right: number
  ): { x: number; width: number } {
    const x1 = pointX(left);
    const x2 = pointX(right);
    return { x: Math.min(x1, x2), width: Math.abs(x2 - x1) };
  }

  // --- 🎒 Backpack (Star Backpack) ---
  private static drawStarBackpack(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
    s: number,
    flip: number
  ): void {
    const bpX = ox + 18 * s * flip;
    const bpY = oy - 2 * s;

    // Golden Star Shape Backpack Sphere
    g.fillStyle(0xeab308, 1.0);
    g.lineStyle(2 * s, 0xca8a04, 1.0);
    g.fillCircle(bpX, bpY, 11 * s);
    if (typeof (g as any).strokeCircle === 'function') {
      (g as any).strokeCircle(bpX, bpY, 11 * s);
    } else if (typeof g.strokeCircleShape === 'function') {
      g.strokeCircleShape(new Phaser.Geom.Circle(bpX, bpY, 11 * s));
    }

    // Star Emblem
    g.fillStyle(0xffffff, 1.0);
    g.fillCircle(bpX, bpY - 2 * s, 4 * s);
    g.fillStyle(0xeab308, 1.0);
    g.fillCircle(bpX, bpY - 2 * s, 2 * s);

    // Shoulder Strap
    g.lineStyle(2.5 * s, 0x854d0e, 0.9);
    this.drawLine(g, bpX - 4 * s * flip, bpY - 10 * s, ox + 6 * s * flip, oy - 14 * s);
  }

  // --- 👓 Glasses (Smart Glasses) ---
  private static drawSmartGlasses(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
    s: number,
    _flip: number
  ): void {
    const glassY = oy - 22 * s;

    // Golden Round Frames
    g.lineStyle(2 * s, 0xf59e0b, 1.0);
    g.fillStyle(0x0f172a, 0.35);

    // Left Lens
    g.fillCircle(ox - 8 * s, glassY, 6 * s);
    if (typeof (g as any).strokeCircle === 'function') {
      (g as any).strokeCircle(ox - 8 * s, glassY, 6 * s);
    } else if (typeof g.strokeCircleShape === 'function') {
      g.strokeCircleShape(new Phaser.Geom.Circle(ox - 8 * s, glassY, 6 * s));
    }

    // Right Lens
    g.fillCircle(ox + 8 * s, glassY, 6 * s);
    if (typeof (g as any).strokeCircle === 'function') {
      (g as any).strokeCircle(ox + 8 * s, glassY, 6 * s);
    } else if (typeof g.strokeCircleShape === 'function') {
      g.strokeCircleShape(new Phaser.Geom.Circle(ox + 8 * s, glassY, 6 * s));
    }

    // Nose Bridge
    this.drawLine(g, ox - 2 * s, glassY, ox + 2 * s, glassY);

    // Lens Glimmer
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(ox - 6 * s, glassY - 2 * s, 1.5 * s);
    g.fillCircle(ox + 10 * s, glassY - 2 * s, 1.5 * s);
  }

  // --- 🎓 Hats & Headwear ---
  private static drawHat(
    g: Phaser.GameObjects.Graphics,
    hatId: string,
    ox: number,
    oy: number,
    s: number,
    flip: number
  ): void {
    const headY = oy - 42 * s;

    switch (hatId) {
      case 'scholar_cap': {
        // Black Mortarboard Diamond
        g.fillStyle(0x0f172a, 1.0);
        g.lineStyle(2 * s, 0x334155, 1.0);
        g.beginPath();
        g.moveTo(ox, headY - 8 * s);
        g.lineTo(ox + 22 * s, headY - 1 * s);
        g.lineTo(ox, headY + 6 * s);
        g.lineTo(ox - 22 * s, headY - 1 * s);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Skull Cap Base
        g.fillRect(ox - 10 * s, headY + 3 * s, 20 * s, 6 * s);

        // Gold Button & Tassel
        g.fillStyle(0xf59e0b, 1.0);
        g.fillCircle(ox, headY - 1 * s, 3 * s);
        g.lineStyle(2 * s, 0xf59e0b, 1.0);
        this.drawLine(g, ox, headY - 1 * s, ox + 16 * s * flip, headY + 8 * s);
        g.fillCircle(ox + 16 * s * flip, headY + 8 * s, 2.5 * s);
        break;
      }
      case 'cat_ears': {
        // Adorable Pink Cat Ears
        g.fillStyle(0xec4899, 1.0);
        g.lineStyle(2 * s, 0xbe185d, 1.0);

        // Left Ear
        g.beginPath();
        g.moveTo(ox - 18 * s, headY + 4 * s);
        g.lineTo(ox - 14 * s, headY - 14 * s);
        g.lineTo(ox - 4 * s, headY);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Right Ear
        g.beginPath();
        g.moveTo(ox + 4 * s, headY);
        g.lineTo(ox + 14 * s, headY - 14 * s);
        g.lineTo(ox + 18 * s, headY + 4 * s);
        g.closePath();
        g.fillPath();
        g.strokePath();

        // Inner Soft Pink Fluff
        g.fillStyle(0xfbcfe8, 1.0);
        g.beginPath();
        g.moveTo(ox - 15 * s, headY + 2 * s);
        g.lineTo(ox - 13 * s, headY - 9 * s);
        g.lineTo(ox - 7 * s, headY);
        g.closePath();
        g.fillPath();

        g.beginPath();
        g.moveTo(ox + 7 * s, headY);
        g.lineTo(ox + 13 * s, headY - 9 * s);
        g.lineTo(ox + 15 * s, headY + 2 * s);
        g.closePath();
        g.fillPath();
        break;
      }
      case 'tram_hat': {
        // Vintage HK Tram Captain Visor Cap
        g.fillStyle(0x065f46, 1.0);
        g.lineStyle(2 * s, 0x042f2e, 1.0);
        g.fillRoundedRect(ox - 16 * s, headY - 4 * s, 32 * s, 14 * s, 4 * s);
        g.strokeRoundedRect(ox - 16 * s, headY - 4 * s, 32 * s, 14 * s, 4 * s);

        // Gold Captain Braid
        g.fillStyle(0xf59e0b, 1.0);
        g.fillRect(ox - 14 * s, headY + 3 * s, 28 * s, 3 * s);

        // Dark Visor / Brim
        g.fillStyle(0x0f172a, 1.0);
        g.fillRoundedRect(ox - 18 * s, headY + 6 * s, 36 * s, 5 * s, 2 * s);
        break;
      }
    }
  }
}
