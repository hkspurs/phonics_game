import Phaser from 'phaser';
import type { EquippedWardrobe } from '../types';
import { OUTFIT_LAYER_ORDER, OutfitLayer, PreviewPose } from '../config/outfits';
import { OutfitRenderer, OutfitRenderResult } from './OutfitRenderer';
import { OutfitRegistry, wardrobeRegistry } from './OutfitRegistry';

export interface PreviewCharacterDefinition {
  id: string;
  idle: string;
  run: string | string[];
  cheer: string;
  tint?: number;
}

export interface CharacterPreviewControllerOptions {
  container: Phaser.GameObjects.Container;
  character: PreviewCharacterDefinition;
  wardrobe?: EquippedWardrobe;
  scale?: number;
  registry?: OutfitRegistry;
}

export class CharacterPreviewController {
  public readonly sprite: Phaser.GameObjects.Image;
  public readonly layerSprites: Partial<Record<OutfitLayer, Phaser.GameObjects.Image>> = {};
  public readonly wardrobeGraphics: Phaser.GameObjects.Graphics;
  public currentPose: PreviewPose = 'idle';
  public lastRenderResult: OutfitRenderResult | null = null;

  private readonly renderer: OutfitRenderer;
  private character: PreviewCharacterDefinition;
  private wardrobe: EquippedWardrobe;
  private readonly baseScale: number;
  private tryOnTween?: Phaser.Tweens.Tween;
  private idleTween?: Phaser.Tweens.Tween;
  private cheerTween?: Phaser.Tweens.Tween;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CharacterPreviewControllerOptions
  ) {
    this.renderer = new OutfitRenderer(options.registry ?? wardrobeRegistry);
    this.character = options.character;
    this.wardrobe = { ...(options.wardrobe ?? {}) };
    this.baseScale = options.scale ?? 1;
    this.sprite = scene.add.image(0, 0, this.character.idle);
    this.wardrobeGraphics = scene.add.graphics();
    if (typeof this.sprite.setOrigin === 'function') this.sprite.setOrigin(0.5, 0.5);
    if (typeof this.sprite.setDepth === 'function') this.sprite.setDepth(40);
    OUTFIT_LAYER_ORDER.forEach((layer, index) => {
      const layerSprite = scene.add.image(0, 0, this.character.idle);
      if (typeof layerSprite.setOrigin === 'function') layerSprite.setOrigin(0.5, 0.5);
      if (typeof layerSprite.setDepth === 'function') layerSprite.setDepth(41 + index);
      if (typeof layerSprite.setVisible === 'function') layerSprite.setVisible(false);
      this.layerSprites[layer] = layerSprite;
    });
    if (typeof this.wardrobeGraphics.setDepth === 'function') this.wardrobeGraphics.setDepth(45);
    options.container.add([
      this.sprite,
      ...Object.values(this.layerSprites).filter(
        (layer): layer is Phaser.GameObjects.Image => Boolean(layer)
      ),
      this.wardrobeGraphics,
    ]);
    if (this.character.tint !== undefined && typeof this.sprite.setTint === 'function') {
      this.sprite.setTint(this.character.tint);
    }
    this.options.container.setScale(this.baseScale);
    this.render();
    this.startIdleMotion();
  }

  setCharacter(character: PreviewCharacterDefinition): void {
    this.character = character;
    this.currentPose = 'idle';
    if (typeof this.sprite.setTexture === 'function') this.sprite.setTexture(character.idle);
    if (character.tint !== undefined && typeof this.sprite.setTint === 'function') this.sprite.setTint(character.tint);
    this.render();
  }

  setWardrobe(wardrobe: EquippedWardrobe): void {
    this.wardrobe = { ...wardrobe };
    this.render();
  }

  getWardrobe(): EquippedWardrobe {
    return { ...this.wardrobe };
  }

  setPose(pose: PreviewPose): void {
    this.currentPose = pose;
    const textureKey = this.getPoseTexture(pose);
    if (typeof this.sprite.setTexture === 'function') this.sprite.setTexture(textureKey);
    this.render();
  }

  playTryOn(wardrobe: EquippedWardrobe): void {
    this.setWardrobe(wardrobe);
    if (this.tryOnTween && typeof this.tryOnTween.stop === 'function') this.tryOnTween.stop();
    if (!this.scene.tweens || typeof this.scene.tweens.add !== 'function') return;

    this.options.container.setScale(this.baseScale * 0.96);
    this.tryOnTween = this.scene.tweens.add({
      targets: this.options.container,
      scaleX: this.baseScale * 1.04,
      scaleY: this.baseScale * 1.04,
      duration: 150,
      ease: Phaser.Math.Easing.Quadratic.Out,
      yoyo: true,
      hold: 0,
      repeat: 0,
      onComplete: () => this.options.container.setScale(this.baseScale),
    });
  }

  playCheer(): void {
    this.setPose('cheer');
    if (!this.scene.tweens || typeof this.scene.tweens.add !== 'function') return;
    this.cheerTween?.stop();
    this.cheerTween = this.scene.tweens.add({
      targets: this.getMotionTargets(),
      y: -8,
      duration: 250,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => this.setPose('idle'),
    });
  }

  destroy(): void {
    this.tryOnTween?.stop();
    this.idleTween?.stop();
    this.cheerTween?.stop();
    this.renderer.clearCache();
    if (typeof this.sprite.destroy === 'function') this.sprite.destroy();
    Object.values(this.layerSprites).forEach(layer => layer?.destroy());
    if (typeof this.wardrobeGraphics.destroy === 'function') this.wardrobeGraphics.destroy();
  }

  private render(): void {
    this.lastRenderResult = this.renderer.render(
      { sprite: this.sprite, graphics: this.wardrobeGraphics, layerSprites: this.layerSprites },
      {
        characterId: this.character.id,
        baseTextureKey: this.getPoseTexture(this.currentPose),
        pose: this.currentPose,
        wardrobe: this.wardrobe,
        textureExists: key => this.scene.textures.exists(key),
        scale: 1,
      }
    );
  }

  private getPoseTexture(pose: PreviewPose): string {
    if (pose === 'idle') return this.character.idle;
    if (pose === 'cheer') return this.character.cheer || this.character.idle;
    return Array.isArray(this.character.run) ? this.character.run[0] || this.character.idle : this.character.run;
  }

  private startIdleMotion(): void {
    if (!this.scene.tweens || typeof this.scene.tweens.add !== 'function') return;
    this.idleTween = this.scene.tweens.add({
      targets: this.getMotionTargets(),
      y: -2,
      duration: 2100,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private getMotionTargets(): Phaser.GameObjects.GameObject[] {
    return [this.sprite, ...Object.values(this.layerSprites), this.wardrobeGraphics].filter(Boolean) as Phaser.GameObjects.GameObject[];
  }
}
