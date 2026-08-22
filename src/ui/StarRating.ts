import Phaser from 'phaser';
import { SoundManager } from '../services/SoundManager';

export interface StarRatingConfig {
  x?: number;
  y?: number;
  maxStars?: number;
  initialStars?: number;
  starSize?: number;
  spacing?: number;
  soundKey?: 'coin' | 'correct' | 'victory';
}

export class StarRating extends Phaser.GameObjects.Container {
  private maxStars: number;
  private currentStars: number;
  private starSize: number;
  private spacing: number;
  private soundKey: 'coin' | 'correct' | 'victory';
  private starIcons: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, config: StarRatingConfig = {}) {
    super(scene, config.x ?? 0, config.y ?? 0);

    this.maxStars = Math.max(1, config.maxStars ?? 3);
    this.currentStars = Phaser.Math.Clamp(config.initialStars ?? 0, 0, this.maxStars);
    this.starSize = config.starSize ?? 48;
    this.spacing = config.spacing ?? 16;
    this.soundKey = config.soundKey ?? 'coin';

    this.createStars();
    scene.add.existing(this);
  }

  private createStars(): void {
    const totalWidth = this.maxStars * this.starSize + (this.maxStars - 1) * this.spacing;
    const startX = -totalWidth / 2 + this.starSize / 2;

    for (let i = 0; i < this.maxStars; i++) {
      const x = startX + i * (this.starSize + this.spacing);
      const isLit = i < this.currentStars;
      const textureKey = isLit ? 'star_gold' : 'star_gray';

      const starImg = this.scene.add.image(x, 0, textureKey);
      starImg.setDisplaySize(this.starSize, this.starSize);
      starImg.setOrigin(0.5, 0.5);

      if (!this.scene?.textures?.exists || !this.scene.textures.exists(textureKey)) {
        // Fallback tint/alpha if texture not preloaded
        starImg.setTint(isLit ? 0xffcc00 : 0x666666);
      }

      this.add(starImg);
      this.starIcons.push(starImg);
    }
  }

  public getMaxStars(): number {
    return this.maxStars;
  }

  public getRating(): number {
    return this.currentStars;
  }

  public setRating(stars: number, animate = false, onComplete?: () => void): void {
    const clampedStars = Phaser.Math.Clamp(stars, 0, this.maxStars);
    this.currentStars = clampedStars;

    if (!animate) {
      for (let i = 0; i < this.maxStars; i++) {
        const star = this.starIcons[i];
        const isLit = i < clampedStars;
        const textureKey = isLit ? 'star_gold' : 'star_gray';
        star.setTexture(textureKey);
        if (!this.scene?.textures?.exists || !this.scene.textures.exists(textureKey)) {
          star.setTint(isLit ? 0xffcc00 : 0x666666);
        }
        star.setScale(1);
        star.setAlpha(1);
      }
      if (onComplete) onComplete();
      return;
    }

    // Animated sequential pop
    let completedAnimations = 0;
    for (let i = 0; i < this.maxStars; i++) {
      const star = this.starIcons[i];
      const isLit = i < clampedStars;

      if (isLit) {
        star.setScale(0);
        this.scene.tweens.add({
          targets: star,
          scaleX: 1.25,
          scaleY: 1.25,
          duration: 250,
          delay: i * 200,
          ease: 'Back.easeOut',
          onStart: () => {
            const textureKey = 'star_gold';
            star.setTexture(textureKey);
            if (!this.scene.textures.exists(textureKey)) {
              star.setTint(0xffcc00);
            }
            SoundManager.play(this.soundKey);
          },
          onComplete: () => {
            this.scene.tweens.add({
              targets: star,
              scaleX: 1,
              scaleY: 1,
              duration: 120,
              ease: 'Quad.easeInOut',
              onComplete: () => {
                completedAnimations++;
                if (completedAnimations === clampedStars && onComplete) {
                  onComplete();
                }
              },
            });
          },
        });
      } else {
        const textureKey = 'star_gray';
        star.setTexture(textureKey);
        if (!this.scene.textures.exists(textureKey)) {
          star.setTint(0x666666);
        }
        star.setScale(1);
      }
    }

    if (clampedStars === 0 && onComplete) {
      onComplete();
    }
  }

  public reset(): void {
    this.setRating(0, false);
  }

  public destroy(fromScene?: boolean): void {
    this.starIcons.forEach((star) => {
      this.scene.tweens.killTweensOf(star);
    });
    super.destroy(fromScene);
  }
}
