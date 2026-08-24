import Phaser from 'phaser';
import { CanvasCard } from './CanvasCard';

export interface SlotBoxConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  expectedValue?: string | number;
  placeholder?: string;
  cornerRadius?: number;
  borderColor?: number;
  fillColor?: number;
  highlightColor?: number;
}

export class SlotBox extends Phaser.GameObjects.Container {
  private config: SlotBoxConfig;
  private slotWidth: number;
  private slotHeight: number;
  private slotIndex: number;
  private expectedVal?: string | number;
  private placedCard: CanvasCard | null = null;
  private isHighlightedState: boolean = false;
  private isErrorState: boolean = false;

  private bgGraphics: Phaser.GameObjects.Graphics | null = null;
  private placeholderText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, config: SlotBoxConfig = {}) {
    super(scene, config.x ?? 0, config.y ?? 0);

    this.config = config;
    this.slotWidth = config.width ?? 140;
    this.slotHeight = config.height ?? 64;
    this.slotIndex = config.index ?? 0;
    this.expectedVal = config.expectedValue;

    this.setSize(this.slotWidth, this.slotHeight);

    this.createBackground();
    this.createPlaceholder();

    if (scene.add && typeof scene.add.existing === 'function') {
      scene.add.existing(this);
    }
  }

  private createBackground(): void {
    if (this.bgGraphics) {
      this.bgGraphics.destroy();
      this.bgGraphics = null;
    }

    const w = this.slotWidth;
    const h = this.slotHeight;
    const radius = this.config.cornerRadius ?? 12;
    const halfW = w / 2;
    const halfH = h / 2;

    const g = this.scene.add.graphics();

    let fillColor = this.config.fillColor ?? 0x1e2433;
    let fillAlpha = this.placedCard ? 0.9 : 0.45;
    let borderColor = this.config.borderColor ?? 0x5a6578;
    let borderWidth = 2;
    let borderAlpha = 0.8;

    if (this.isErrorState) {
      borderColor = 0xe74c3c;
      borderWidth = 3;
      borderAlpha = 1.0;
      fillColor = 0x3d1b1e;
    } else if (this.isHighlightedState) {
      borderColor = this.config.highlightColor ?? 0x00d2ff;
      borderWidth = 3.5;
      borderAlpha = 1.0;
      fillAlpha = 0.7;
    } else if (this.placedCard) {
      borderColor = 0x2b82c9;
      borderWidth = 2;
      borderAlpha = 0.9;
    }

    // 1. Fill
    g.fillStyle(fillColor, fillAlpha);
    g.fillRoundedRect(-halfW, -halfH, w, h, radius);

    // 2. Stroke
    g.lineStyle(borderWidth, borderColor, borderAlpha);
    g.strokeRoundedRect(-halfW, -halfH, w, h, radius);

    this.bgGraphics = g;
    if (this.length > 0) {
      this.addAt(g, 0);
    } else {
      this.add(g);
    }
  }

  private createPlaceholder(): void {
    if (this.placeholderText) {
      this.placeholderText.destroy();
      this.placeholderText = null;
    }

    const placeholderLabel = this.config.placeholder ?? (this.config.index !== undefined ? `${this.config.index + 1}` : '·');

    const text = this.scene.add.text(0, 0, placeholderLabel, {
      fontSize: '20px',
      fontFamily: "'Kenney Future Narrow', 'Noto Sans TC', sans-serif",
      color: '#657388',
      fontStyle: 'bold',
      align: 'center',
      resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
    });

    if (typeof text.setOrigin === 'function') {
      text.setOrigin(0.5, 0.5);
    }

    this.placeholderText = text;
    this.add(text);

    // If card is already placed, hide placeholder
    if (this.placedCard && typeof text.setVisible === 'function') {
      text.setVisible(false);
    }
  }

  public setPlacedCard(card: CanvasCard | null): boolean {
    if (!card) {
      this.removePlacedCard();
      return true;
    }

    // If slot already holds a card, remove the old one first
    if (this.placedCard && this.placedCard !== card) {
      this.placedCard.setCurrentSlot(null);
    }

    this.placedCard = card;
    card.setCurrentSlot(this);

    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(card);
    }
    // Snap card coordinates to slot position with smooth spring ease
    const center = this.getCenterPosition();
    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(card);
      card.setScale(1.08);
      this.scene.tweens.add({
        targets: card,
        x: center.x,
        y: center.y,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 110,
        ease: 'Back.easeOut',
      });
    } else {
      card.x = center.x;
      card.y = center.y;
      if (typeof card.setScale === 'function') {
        card.setScale(1.0);
      }
    }
    card.setState('placed');

    if (this.placeholderText && typeof this.placeholderText.setVisible === 'function') {
      this.placeholderText.setVisible(false);
    }

    this.createBackground();
    return true;
  }

  public removePlacedCard(): CanvasCard | null {
    const card = this.placedCard;
    if (card) {
      card.setCurrentSlot(null);
      card.setState('normal');
      this.placedCard = null;
    }

    if (this.placeholderText && typeof this.placeholderText.setVisible === 'function') {
      this.placeholderText.setVisible(true);
    }

    this.createBackground();
    return card;
  }

  public clearCard(): CanvasCard | null {
    return this.removePlacedCard();
  }

  public hasCard(): boolean {
    return this.placedCard !== null;
  }

  public getPlacedCard(): CanvasCard | null {
    return this.placedCard;
  }

  public getIndex(): number {
    return this.slotIndex;
  }

  public setExpectedValue(val: string | number): this {
    this.expectedVal = val;
    return this;
  }

  public getExpectedValue(): string | number | undefined {
    return this.expectedVal;
  }

  public isCorrect(): boolean {
    if (!this.placedCard || this.expectedVal === undefined) {
      return false;
    }
    const cardVal = this.placedCard.getValue();
    const cardText = this.placedCard.getText();
    return cardVal === this.expectedVal || cardText === this.expectedVal;
  }

  public setHighlighted(highlighted: boolean): this {
    this.isHighlightedState = highlighted;
    this.createBackground();
    return this;
  }

  public isHighlighted(): boolean {
    return this.isHighlightedState;
  }

  public setError(isError: boolean): this {
    this.isErrorState = isError;
    this.createBackground();
    return this;
  }

  public hasError(): boolean {
    return this.isErrorState;
  }

  public getCenterPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getSlotWidth(): number {
    return this.slotWidth;
  }

  public getSlotHeight(): number {
    return this.slotHeight;
  }

  public override setScrollFactor(x: number, y?: number, updateChildren: boolean = true): this {
    if (typeof super.setScrollFactor === 'function') {
      super.setScrollFactor(x, y, updateChildren);
    } else {
      this.scrollFactorX = x;
      this.scrollFactorY = y !== undefined ? y : x;
    }
    const sy = y !== undefined ? y : x;
    if (this.bgGraphics && typeof this.bgGraphics.setScrollFactor === 'function') {
      this.bgGraphics.setScrollFactor(x, sy);
    }
    if (this.placeholderText && typeof this.placeholderText.setScrollFactor === 'function') {
      this.placeholderText.setScrollFactor(x, sy);
    }
    return this;
  }

  public override destroy(fromScene?: boolean): void {
    if (this.placedCard) {
      this.placedCard.setCurrentSlot(null);
      this.placedCard = null;
    }
    super.destroy(fromScene);
  }
}
