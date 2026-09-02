import Phaser from 'phaser';
import { PlayerAvatarService, PlayerAppearance } from '../services/PlayerAvatarService';
import { DataManager } from '../services/DataManager';
import { OutfitRenderer } from './OutfitRenderer';

export interface AvatarBadgeOptions {
  x: number;
  y: number;
  size?: number; // Outer diameter, default 56px
  showPet?: boolean;
  showBorder?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  reducedMotion?: boolean;
}

export class PlayerAvatarBadge {
  public scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public bgGraphics?: Phaser.GameObjects.Graphics;
  public avatarSprite?: Phaser.GameObjects.Image;
  public backOutfitGraphics?: Phaser.GameObjects.Graphics;
  public outfitGraphics?: Phaser.GameObjects.Graphics;
  public petIcon?: Phaser.GameObjects.Text;
  public size: number;

  private bounceTween?: Phaser.Tweens.Tween;
  private appearance: PlayerAppearance;
  private readonly reducedMotion: boolean;
  private readonly outfitRenderer = new OutfitRenderer();

  constructor(scene: Phaser.Scene, options: AvatarBadgeOptions) {
    this.scene = scene;
    this.size = options.size || 56;
    this.reducedMotion = options.reducedMotion ?? this.detectReducedMotionPreference();
    this.appearance = PlayerAvatarService.getInstance().getAppearance();

    this.container = scene.add.container
      ? scene.add.container(options.x, options.y)
      : new Phaser.GameObjects.Container(scene, options.x, options.y);

    this.buildBadge(options);
  }

  private buildBadge(options: AvatarBadgeOptions): void {
    const r = this.size / 2;
    const avatarOffsetY = r * 0.1;

    // 1. Circular Backdrop & Glow
    if (options.showBorder !== false && this.scene.add?.graphics) {
      this.bgGraphics = this.scene.add.graphics();
      // Outer Golden Rim
      if (typeof this.bgGraphics.lineStyle === 'function') this.bgGraphics.lineStyle(3, 0xf59e0b, 0.95);
      this.bgGraphics.fillStyle(0x1e1b4b, 0.85);
      this.bgGraphics.fillCircle(0, 0, r);
      if (typeof this.bgGraphics.strokeCircle === 'function') this.bgGraphics.strokeCircle(0, 0, r);

      // Inner Highlight Ring
      if (typeof this.bgGraphics.lineStyle === 'function') this.bgGraphics.lineStyle(1.5, 0xfef08a, 0.6);
      if (typeof this.bgGraphics.strokeCircle === 'function') this.bgGraphics.strokeCircle(0, 0, r - 3);
      if (typeof this.bgGraphics.setDepth === 'function') this.bgGraphics.setDepth(-2);

      this.container.add(this.bgGraphics);
    }

    // 2. Avatar Sprite (Level 1 Dedicated Full Sprite or Skin Base)
    if (this.scene.add?.image) {
      const textureInfo = PlayerAvatarService.getInstance().getTextureKey('idle', this.scene);
      this.avatarSprite = this.scene.add.image(0, avatarOffsetY, textureInfo.textureKey);

      if (this.avatarSprite.setOrigin) this.avatarSprite.setOrigin(0.5, 0.5);

      // Scale appropriately to fit inside circle
      const targetDiameter = this.size * 0.85;
      let fullSpriteWidth = 256;
      if (textureInfo.isFullSprite) {
        try {
          const texture = (this.scene.textures as any)?.get?.(textureInfo.textureKey);
          const sourceImage = texture?.getSourceImage?.() ?? texture?.source?.[0]?.image;
          const sourceWidth = Number(sourceImage?.naturalWidth || sourceImage?.width);
          if (Number.isFinite(sourceWidth) && sourceWidth > 0) fullSpriteWidth = sourceWidth;
        } catch {
          // Keep the legacy 256px assumption for headless or incomplete textures.
        }
      }
      const renderScale = textureInfo.isFullSprite
        ? (targetDiameter / fullSpriteWidth) / 0.23
        : targetDiameter / 110;

      if (typeof this.avatarSprite.setDepth === 'function') this.avatarSprite.setDepth(1);
      if (textureInfo.tint !== undefined && typeof this.avatarSprite.setTint === 'function') {
        this.avatarSprite.setTint(textureInfo.tint);
      }

      this.container.add(this.avatarSprite);

      if (this.scene.add?.graphics) {
        this.backOutfitGraphics = this.scene.add.graphics();
        this.outfitGraphics = this.scene.add.graphics();
        this.backOutfitGraphics.setPosition?.(0, avatarOffsetY);
        this.outfitGraphics.setPosition?.(0, avatarOffsetY);
        if (typeof this.backOutfitGraphics.setDepth === 'function') this.backOutfitGraphics.setDepth(0);
        if (typeof this.outfitGraphics.setDepth === 'function') this.outfitGraphics.setDepth(2);
        this.container.add([this.backOutfitGraphics, this.outfitGraphics]);

        this.outfitRenderer.render(
          {
            sprite: this.avatarSprite,
            backGraphics: this.backOutfitGraphics,
            graphics: this.outfitGraphics,
          },
          {
            characterId: this.appearance.skinId,
            baseTextureKey: textureInfo.textureKey,
            pose: 'idle',
            wardrobe: this.appearance.wardrobe,
            textureExists: key => !this.scene.textures?.exists || this.scene.textures.exists(key),
            scale: renderScale,
          }
        );
      } else if (typeof this.avatarSprite.setScale === 'function') {
        this.avatarSprite.setScale(textureInfo.isFullSprite ? targetDiameter / 256 : renderScale);
      }
    }

    // 3. Companion Pet Badge (if equipped and requested)
    if (options.showPet !== false && this.appearance.petId && this.scene.add?.text) {
      const petDef = DataManager.getInstance().getPets().find((p) => p.id === this.appearance.petId);
      const petEmoji = petDef ? petDef.icon : '🐾';
      this.petIcon = this.scene.add.text(r * 0.65, r * 0.55, petEmoji, {
        fontSize: `${Math.max(14, Math.round(this.size * 0.35))}px`,
      });
      if (this.petIcon.setOrigin) this.petIcon.setOrigin(0.5);
      if (typeof this.petIcon.setDepth === 'function') this.petIcon.setDepth(3);
      this.container.add(this.petIcon);
    }

    // 4. Interactive Click handler
    if (options.interactive && options.onClick) {
      this.container.setSize(this.size, this.size);
      const hitRadius = (this.size / 2) + 4;
      const hitRect = (Phaser && Phaser.Geom && Phaser.Geom.Rectangle)
        ? new Phaser.Geom.Rectangle(-hitRadius, -hitRadius, hitRadius * 2, hitRadius * 2)
        : undefined;
      if (hitRect && typeof this.container.setInteractive === 'function') {
        this.container.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
      } else if (typeof this.container.setInteractive === 'function') {
        this.container.setInteractive({ useHandCursor: true });
      }
      this.container.on('pointerdown', options.onClick);
    }

    // Subtle gentle float
    this.startIdleFloat();
  }

  public startIdleFloat(): void {
    if (this.reducedMotion || !this.scene.tweens?.add) return;
    this.bounceTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Positive Cheer Reaction (e.g. answered correctly)
   */
  public cheer(): void {
    if (this.reducedMotion || !this.scene.tweens?.add) return;

    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.25,
      scaleY: 1.25,
      angle: -8,
      duration: 120,
      yoyo: true,
      repeat: 1,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (this.container) {
          this.container.setScale(1);
          this.container.setAngle(0);
        }
      },
    });

    // Spawn mini floating star
    if (this.scene.add?.text) {
      const star = this.scene.add.text(this.container.x, this.container.y - this.size * 0.5, '⭐', {
        fontSize: '22px',
      });
      if (star.setOrigin) star.setOrigin(0.5);
      if (star.setDepth) star.setDepth(100);

      this.scene.tweens.add({
        targets: star,
        y: star.y - 30,
        alpha: 0,
        scale: 1.4,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  /**
   * Thinking Reaction (e.g. answered wrongly or waiting)
   */
  public think(): void {
    if (this.reducedMotion || !this.scene.tweens?.add) return;

    this.scene.tweens.add({
      targets: this.container,
      angle: 12,
      duration: 180,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.container) this.container.setAngle(0);
      },
    });

    if (this.scene.add?.text) {
      const dots = this.scene.add.text(this.container.x + this.size * 0.4, this.container.y - this.size * 0.4, '💭', {
        fontSize: '18px',
      });
      if (dots.setOrigin) dots.setOrigin(0.5);
      if (dots.setDepth) dots.setDepth(100);

      this.scene.tweens.add({
        targets: dots,
        y: dots.y - 20,
        alpha: 0,
        duration: 800,
        onComplete: () => dots.destroy(),
      });
    }
  }

  public setDepth(depth: number): void {
    if (this.container.setDepth) this.container.setDepth(depth);
  }

  public destroy(): void {
    if (this.bounceTween) this.bounceTween.stop();
    this.outfitRenderer.clearCache();
    this.container.destroy();
  }

  private detectReducedMotionPreference(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    } catch {
      return false;
    }
  }
}
