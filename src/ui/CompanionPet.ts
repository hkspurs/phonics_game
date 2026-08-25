import Phaser from 'phaser';
import { PetDefinition } from '../types';
import { PET_DEFINITIONS } from '../services/DataManager';

export interface CompanionPetConfig {
  petId: string;
  x?: number;
  y?: number;
}

export class CompanionPet extends Phaser.GameObjects.Container {
  public petDefinition: PetDefinition;
  private iconText: Phaser.GameObjects.Text;
  private auraGraphics: Phaser.GameObjects.Graphics;
  private bobOffset: number = 0;

  constructor(scene: Phaser.Scene, config: CompanionPetConfig) {
    super(scene, config.x ?? 0, config.y ?? 0);

    const found = PET_DEFINITIONS.find((p) => p.id === config.petId);
    this.petDefinition = found || PET_DEFINITIONS[0];

    // Aura Glow Circle
    this.auraGraphics = scene.add.graphics();
    this.auraGraphics.fillStyle(this.petDefinition.tint, 0.35);
    this.auraGraphics.fillCircle(0, 0, 26);
    this.auraGraphics.lineStyle(2, this.petDefinition.tint, 0.85);
    this.auraGraphics.strokeCircle(0, 0, 26);
    this.add(this.auraGraphics);

    // Pet Icon Emoji / Graphic
    this.iconText = scene.add.text(0, -2, this.petDefinition.icon, {
      fontSize: '32px',
    });
    this.iconText.setOrigin(0.5, 0.5);
    this.add(this.iconText);

    this.setDepth(35);
    scene.add.existing(this);

    // Subtle breathing pulse
    scene.tweens.add({
      targets: this.auraGraphics,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public updatePet(
    dtSeconds: number,
    targetPlayerX: number,
    targetPlayerY: number,
    flipX: boolean = false
  ): void {
    this.bobOffset += dtSeconds * 4;
    const floatY = Math.sin(this.bobOffset) * 6;

    const followOffsetX = flipX ? 45 : -45;
    const targetX = targetPlayerX + followOffsetX;
    const targetY = targetPlayerY - 32 + floatY;

    // Smooth lerp follow
    this.x += (targetX - this.x) * Math.min(1, dtSeconds * 8);
    this.y += (targetY - this.y) * Math.min(1, dtSeconds * 8);

    if (this.iconText) {
      this.iconText.setFlipX(flipX);
    }
  }

  public playVictoryDance(): void {
    if (this.scene?.tweens) {
      this.scene.tweens.add({
        targets: this,
        angle: 360,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 600,
        ease: 'Back.easeOut',
        yoyo: true,
      });
    }
  }

  public getMagnetBonus(): number {
    return this.petDefinition?.magnetBonus ?? 60;
  }
}
