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
  private starLabels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, config: StarRatingConfig = {}) {
    super(scene, config.x ?? 0, config.y ?? 0);

    this.maxStars = Math.max(1, config.maxStars ?? 3);
    this.currentStars = Phaser.Math.Clamp(config.initialStars ?? 0, 0, this.maxStars);
    this.starSize = config.starSize ?? 32;
    this.spacing = config.spacing ?? 16;
    this.soundKey = config.soundKey ?? 'coin';

    this.createStars();
    if (scene.add && typeof scene.add.existing === 'function') {
      scene.add.existing(this);
    }
  }

  private createStars(): void {
    const totalWidth = this.maxStars * this.starSize + (this.maxStars - 1) * this.spacing;
    const startX = -totalWidth / 2 + this.starSize / 2;

    for (let i = 0; i < this.maxStars; i++) {
      const x = startX + i * (this.starSize + this.spacing);
      const isLit = i < this.currentStars;

      const starText = this.scene.add.text(x, 0, isLit ? '⭐' : '☆', {
        fontSize: `${this.starSize}px`,
        color: isLit ? '#ffd700' : '#64748b',
        align: 'center',
      });
      if (typeof starText.setOrigin === 'function') {
        starText.setOrigin(0.5, 0.5);
      }

      this.add(starText);
      this.starLabels.push(starText);
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
        const star = this.starLabels[i];
        if (!star) continue;
        const isLit = i < clampedStars;
        if (typeof star.setText === 'function') star.setText(isLit ? '⭐' : '☆');
        if (typeof star.setColor === 'function') star.setColor(isLit ? '#ffd700' : '#64748b');
        if (typeof star.setScale === 'function') star.setScale(1);
        if (typeof star.setAlpha === 'function') star.setAlpha(1);
      }
      if (onComplete) onComplete();
      return;
    }

    // Animated sequential pop
    let completedAnimations = 0;
    for (let i = 0; i < this.maxStars; i++) {
      const star = this.starLabels[i];
      if (!star) continue;
      const isLit = i < clampedStars;

      if (isLit) {
        if (typeof star.setScale === 'function') star.setScale(0);
        if (this.scene?.tweens?.add) {
          this.scene.tweens.add({
            targets: star,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 250,
            delay: i * 200,
            ease: 'Back.easeOut',
            onStart: () => {
              if (typeof star.setText === 'function') star.setText('⭐');
              if (typeof star.setColor === 'function') star.setColor('#ffd700');
              SoundManager.play(this.soundKey);
            },
            onComplete: () => {
              if (this.scene?.tweens?.add) {
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
              } else {
                completedAnimations++;
                if (completedAnimations === clampedStars && onComplete) {
                  onComplete();
                }
              }
            },
          });
        } else {
          if (typeof star.setText === 'function') star.setText('⭐');
          if (typeof star.setColor === 'function') star.setColor('#ffd700');
          if (typeof star.setScale === 'function') star.setScale(1);
          completedAnimations++;
          if (completedAnimations === clampedStars && onComplete) {
            onComplete();
          }
        }
      } else {
        if (typeof star.setText === 'function') star.setText('☆');
        if (typeof star.setColor === 'function') star.setColor('#64748b');
        if (typeof star.setScale === 'function') star.setScale(1);
      }
    }

    if (clampedStars === 0 && onComplete) {
      onComplete();
    }
  }

  public reset(): void {
    this.setRating(0, false);
  }

  public override destroy(fromScene?: boolean): void {
    this.starLabels.forEach((star) => {
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(star);
      }
    });
    super.destroy(fromScene);
  }
}
