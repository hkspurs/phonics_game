import Phaser from 'phaser';
import type { EquippedWardrobe } from '../types';
import { OUTFIT_LAYER_ORDER, OutfitLayer, PreviewPose } from '../config/outfits';
import { OutfitRenderer, OutfitRenderResult, OutfitRenderTarget } from './OutfitRenderer';
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
  reducedMotion?: boolean;
}

export class CharacterPreviewController {
  public readonly sprite: Phaser.GameObjects.Image;
  public readonly layerSprites: Partial<Record<OutfitLayer, Phaser.GameObjects.Image>> = {};
  public readonly wardrobeGraphics: Phaser.GameObjects.Graphics;
  public readonly backWardrobeGraphics: Phaser.GameObjects.Graphics;
  public currentPose: PreviewPose = 'idle';
  public lastRenderResult: OutfitRenderResult | null = null;

  private readonly renderer: OutfitRenderer;
  private readonly registry: OutfitRegistry;
  private readonly renderTarget: OutfitRenderTarget;
  private character: PreviewCharacterDefinition;
  private wardrobe: EquippedWardrobe;
  private readonly baseScale: number;
  private readonly reducedMotion: boolean;
  private basePreviewOffsetY = 0;
  private tryOnTween?: Phaser.Tweens.Tween;
  private idleTween?: Phaser.Tweens.Tween;
  private runFallbackTween?: Phaser.Tweens.Tween;
  private cheerTween?: Phaser.Tweens.Tween;
  private cheerGeneration = 0;
  private tryOnGeneration = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: CharacterPreviewControllerOptions
  ) {
    this.registry = options.registry ?? wardrobeRegistry;
    this.renderer = new OutfitRenderer(this.registry);
    this.character = options.character;
    this.wardrobe = { ...(options.wardrobe ?? {}) };
    this.baseScale = options.scale ?? 1;
    this.reducedMotion = options.reducedMotion ?? this.detectReducedMotionPreference();
    this.backWardrobeGraphics = scene.add.graphics();
    this.sprite = scene.add.image(0, 0, this.character.idle);
    this.wardrobeGraphics = scene.add.graphics();
    if (typeof this.backWardrobeGraphics.setDepth === 'function') this.backWardrobeGraphics.setDepth(35);
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
    this.renderTarget = {
      sprite: this.sprite,
      graphics: this.wardrobeGraphics,
      backGraphics: this.backWardrobeGraphics,
      layerSprites: this.layerSprites,
    };
    options.container.add([
      this.backWardrobeGraphics,
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
    this.tryOnGeneration += 1;
    this.tryOnTween?.stop?.();
    this.tryOnTween = undefined;
    this.cheerTween?.stop?.();
    this.cheerTween = undefined;
    this.runFallbackTween?.stop?.();
    this.runFallbackTween = undefined;
    this.cheerGeneration += 1;
    this.options.container.setScale(this.baseScale);
    this.character = character;
    this.currentPose = 'idle';
    if (typeof this.sprite.setTexture === 'function') this.sprite.setTexture(character.idle);
    if (character.tint !== undefined && typeof this.sprite.setTint === 'function') this.sprite.setTint(character.tint);
    else if (typeof this.sprite.clearTint === 'function') this.sprite.clearTint();
    this.render();
    this.idleTween?.resume?.();
  }

  setWardrobe(wardrobe: EquippedWardrobe): void {
    this.wardrobe = { ...wardrobe };
    this.render();
  }

  getWardrobe(): EquippedWardrobe {
    return { ...this.wardrobe };
  }

  setPose(pose: PreviewPose): void {
    if (this.tryOnTween) {
      this.tryOnGeneration += 1;
      this.tryOnTween.stop?.();
      this.tryOnTween = undefined;
      this.options.container.setScale(this.baseScale);
    }
    if (pose !== 'cheer') {
      this.cheerTween?.stop?.();
      this.cheerTween = undefined;
      this.cheerGeneration += 1;
    }
    if (pose !== 'run') {
      this.runFallbackTween?.stop?.();
      this.runFallbackTween = undefined;
      if (pose === 'idle') this.idleTween?.resume?.();
    }
    this.currentPose = pose;
    const textureKey = this.getPoseTexture(pose);
    if (typeof this.sprite.setTexture === 'function') this.sprite.setTexture(textureKey);
    this.render();
  }

  /**
   * Keeps a full-sprite outfit lively when its run file is an intentional
   * idle fallback. The existing Wardrobe timer supplies the cadence.
   */
  playRunFallbackStep(): void {
    if (
      this.reducedMotion ||
      this.currentPose !== 'run' ||
      !this.lastRenderResult?.poseFallback ||
      !this.scene.tweens ||
      typeof this.scene.tweens.add !== 'function'
    ) return;

    this.runFallbackTween?.stop?.();
    this.idleTween?.pause?.();
    this.runFallbackTween = this.scene.tweens.add({
      targets: this.getMotionTargets(),
      y: this.basePreviewOffsetY - 3,
      duration: 150,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        this.runFallbackTween = undefined;
        if (this.currentPose === 'run') this.idleTween?.resume?.();
      },
    });
  }

  playTryOn(wardrobe: EquippedWardrobe): void {
    this.tryOnGeneration += 1;
    this.cheerTween?.stop?.();
    this.cheerTween = undefined;
    this.runFallbackTween?.stop?.();
    this.runFallbackTween = undefined;
    this.setWardrobe(wardrobe);
    this.idleTween?.pause?.();
    if (this.tryOnTween && typeof this.tryOnTween.stop === 'function') this.tryOnTween.stop();
    this.tryOnTween = undefined;
    if (this.reducedMotion) {
      this.options.container.setScale(this.baseScale);
      return;
    }
    if (!this.scene.tweens || typeof this.scene.tweens.add !== 'function') {
      this.idleTween?.resume?.();
      return;
    }

    this.options.container.setScale(this.baseScale * 0.96);
    const tryOnGeneration = this.tryOnGeneration;
    this.tryOnTween = this.scene.tweens.add({
      targets: this.options.container,
      scaleX: this.baseScale * 1.04,
      scaleY: this.baseScale * 1.04,
      duration: 150,
      ease: Phaser.Math.Easing.Quadratic.Out,
      yoyo: true,
      hold: 0,
      repeat: 0,
      onComplete: () => {
        if (tryOnGeneration !== this.tryOnGeneration) return;
        this.options.container.setScale(this.baseScale);
        this.idleTween?.resume?.();
      },
    });
  }

  playCheer(): void {
    this.idleTween?.pause?.();
    this.tryOnGeneration += 1;
    this.tryOnTween?.stop?.();
    this.tryOnTween = undefined;
    this.setPose('cheer');
    if (this.reducedMotion) {
      this.setPose('idle');
      this.idleTween?.resume?.();
      return;
    }
    if (!this.scene.tweens || typeof this.scene.tweens.add !== 'function') {
      this.setPose('idle');
      this.idleTween?.resume?.();
      return;
    }
    this.cheerTween?.stop();
    this.cheerTween = undefined;
    const cheerGeneration = ++this.cheerGeneration;
    this.cheerTween = this.scene.tweens.add({
      targets: this.getMotionTargets(),
      y: this.basePreviewOffsetY - 8,
      duration: 250,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.cheerTween = undefined;
        if (this.currentPose !== 'cheer' || cheerGeneration !== this.cheerGeneration) return;
        this.setPose('idle');
        this.idleTween?.resume?.();
      },
    });
  }

  destroy(): void {
    this.tryOnGeneration += 1;
    this.cheerGeneration += 1;
    this.tryOnTween?.stop();
    this.idleTween?.stop();
    this.runFallbackTween?.stop();
    this.cheerTween?.stop();
    this.renderer.clearCache();
    this.sprite.texture?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
    if (typeof this.sprite.destroy === 'function') this.sprite.destroy();
    Object.values(this.layerSprites).forEach(layer => layer?.destroy());
    if (typeof this.wardrobeGraphics.destroy === 'function') this.wardrobeGraphics.destroy();
    if (typeof this.backWardrobeGraphics.destroy === 'function') this.backWardrobeGraphics.destroy();
  }

  private render(): void {
    const baseTextureKey = this.getPoseTexture(this.currentPose);
    const textureExists = (key: string) => !this.scene.textures?.exists || this.scene.textures.exists(key);
    const renderScale = this.getBaseTextureScale(baseTextureKey, textureExists);
    const result = this.renderer.render(
      this.renderTarget,
      {
        characterId: this.character.id,
        baseTextureKey,
        pose: this.currentPose,
        wardrobe: this.wardrobe,
        textureExists,
        scale: renderScale,
      }
    );

    const previewOffsetY = result.mode === 'fullSprite' ? 0 : this.getBaseTextureOffset(baseTextureKey, renderScale);
    const offsetChanged = Math.abs(this.basePreviewOffsetY - previewOffsetY) > 0.001;
    this.applyBasePreviewOffset(previewOffsetY);
    if (offsetChanged && this.idleTween) this.restartIdleMotion();

    // Dedicated wearing art already contains the character's authored colours;
    // only the base sprite should receive a selectable skin tint.
    if (result.mode === 'fullSprite') {
      this.sprite.clearTint?.();
    } else if (this.character.tint !== undefined) {
      this.sprite.setTint?.(this.character.tint);
    } else {
      this.sprite.clearTint?.();
    }
    this.lastRenderResult = result;
  }

  private getBaseTextureScale(
    baseTextureKey: string,
    textureExists: (key: string) => boolean
  ): number {
    const outfitId = this.registry.getSingleBodyOutfitId(this.wardrobe);
    if (
      outfitId
      && this.registry.resolveMode(outfitId, this.currentPose, textureExists, this.character.id) === 'fullSprite'
    ) {
      return 1;
    }

    const sourceHeight = this.getTextureSourceHeight(baseTextureKey);
    if (!sourceHeight || sourceHeight >= 256) {
      return sourceHeight ? 110 / sourceHeight : 1;
    }

    // Keep legacy 80x110 art readable until the high-resolution base set exists.
    // The outer preview scale still gives the fallback a clear stage presence.
    const nativeScale = 110 / sourceHeight;
    const maxDisplayUpscale = 2.5;
    return Math.min(nativeScale, maxDisplayUpscale / Math.max(1, this.baseScale));
  }

  private getBaseTextureOffset(baseTextureKey: string, renderScale: number): number {
    const sourceHeight = this.getTextureSourceHeight(baseTextureKey);
    if (!sourceHeight) return 0;
    // The layout reserves the equivalent of a 110px base sprite. Keep the
    // fallback's feet on that same stage baseline after the scale cap.
    return (110 - sourceHeight * renderScale) / 2;
  }

  private getTextureSourceHeight(textureKey: string): number | undefined {
    try {
      const texture = (this.scene.textures as any)?.get?.(textureKey);
      const sourceImage = texture?.getSourceImage?.() ?? texture?.source?.[0]?.image;
      const sourceHeight = Number(sourceImage?.naturalHeight || sourceImage?.height);
      return Number.isFinite(sourceHeight) && sourceHeight > 0 ? sourceHeight : undefined;
    } catch {
      return undefined;
    }
  }

  private applyBasePreviewOffset(offsetY: number): void {
    this.basePreviewOffsetY = offsetY;
    const targets = [
      this.backWardrobeGraphics,
      this.sprite,
      ...Object.values(this.layerSprites),
      this.wardrobeGraphics,
    ].filter(Boolean) as Phaser.GameObjects.GameObject[];

    targets.forEach(target => {
      if (typeof (target as any).setY === 'function') {
        (target as any).setY(offsetY);
      } else {
        (target as any).y = offsetY;
      }
    });
  }

  private getPoseTexture(pose: PreviewPose): string {
    if (pose === 'idle') return this.character.idle;
    if (pose === 'cheer') return this.character.cheer || this.character.idle;
    return Array.isArray(this.character.run) ? this.character.run[0] || this.character.idle : this.character.run;
  }

  private startIdleMotion(): void {
    if (this.reducedMotion || !this.scene.tweens || typeof this.scene.tweens.add !== 'function') return;
    this.idleTween = this.scene.tweens.add({
      targets: this.getMotionTargets(),
      y: this.basePreviewOffsetY - 2,
      duration: 2100,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private restartIdleMotion(): void {
    const isPaused = (this.idleTween as any)?.isPaused;
    const wasPaused = typeof isPaused === 'function'
      ? isPaused.call(this.idleTween)
      : Boolean(isPaused);
    this.idleTween?.stop?.();
    this.idleTween = undefined;
    this.startIdleMotion();
    const nextIdleTween = this.idleTween as Phaser.Tweens.Tween | undefined;
    if (wasPaused) nextIdleTween?.pause?.();
  }

  private getMotionTargets(): Phaser.GameObjects.GameObject[] {
    return [
      this.backWardrobeGraphics,
      this.sprite,
      ...Object.values(this.layerSprites),
      this.wardrobeGraphics,
    ].filter(Boolean) as Phaser.GameObjects.GameObject[];
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
