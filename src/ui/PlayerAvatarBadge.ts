import Phaser from 'phaser';
import { PlayerAvatarService, PlayerAppearance } from '../services/PlayerAvatarService';
import { DataManager } from '../services/DataManager';

export interface AvatarBadgeOptions {
  x: number;
  y: number;
  size?: number; // Outer diameter, default 56px
  showPet?: boolean;
  showBorder?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export class PlayerAvatarBadge {
  public scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public bgGraphics?: Phaser.GameObjects.Graphics;
  public avatarSprite?: Phaser.GameObjects.Image;
  public petIcon?: Phaser.GameObjects.Text;
  public size: number;

  private bounceTween?: Phaser.Tweens.Tween;
  private appearance: PlayerAppearance;

  constructor(scene: Phaser.Scene, options: AvatarBadgeOptions) {
    this.scene = scene;
    this.size = options.size || 56;
    this.appearance = PlayerAvatarService.getInstance().getAppearance();

    this.container = scene.add.container
      ? scene.add.container(options.x, options.y)
      : new Phaser.GameObjects.Container(scene, options.x, options.y);

    this.buildBadge(options);
  }

  private buildBadge(options: AvatarBadgeOptions): void {
    const r = this.size / 2;

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

      this.container.add(this.bgGraphics);
    }

    // 2. Avatar Sprite (Level 1 Dedicated Full Sprite or Skin Base)
    if (this.scene.add?.image) {
      const textureInfo = PlayerAvatarService.getInstance().getTextureKey('idle', this.scene);
      this.avatarSprite = this.scene.add.image(0, r * 0.1, textureInfo.textureKey);

      if (this.avatarSprite.setOrigin) this.avatarSprite.setOrigin(0.5, 0.5);

      // Scale appropriately to fit inside circle
      const targetDiameter = this.size * 0.85;
      if (textureInfo.isFullSprite) {
        this.avatarSprite.setScale(targetDiameter / 256);
      } else {
        this.avatarSprite.setScale(targetDiameter / 110);
        if (textureInfo.tint !== undefined && typeof this.avatarSprite.setTint === 'function') {
          this.avatarSprite.setTint(textureInfo.tint);
        }
      }

      this.container.add(this.avatarSprite);
    }

    // 3. Companion Pet Badge (if equipped and requested)
    if (options.showPet !== false && this.appearance.petId && this.scene.add?.text) {
      const petDef = DataManager.getInstance().getPets().find((p) => p.id === this.appearance.petId);
      const petEmoji = petDef ? petDef.icon : '🐾';
      this.petIcon = this.scene.add.text(r * 0.65, r * 0.55, petEmoji, {
        fontSize: `${Math.max(14, Math.round(this.size * 0.35))}px`,
      });
      if (this.petIcon.setOrigin) this.petIcon.setOrigin(0.5);
      this.container.add(this.petIcon);
    }

    // 4. Interactive Click handler
    if (options.interactive && options.onClick) {
      this.container.setSize(this.size, this.size);
      this.container.setInteractive({ useHandCursor: true });
      this.container.on('pointerdown', options.onClick);
    }

    // Subtle gentle float
    this.startIdleFloat();
  }

  public startIdleFloat(): void {
    if (!this.scene.tweens?.add) return;
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
    if (!this.scene.tweens?.add) return;

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
    if (!this.scene.tweens?.add) return;

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
    this.container.destroy();
  }
}
