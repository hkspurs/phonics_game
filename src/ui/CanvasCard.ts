import Phaser from 'phaser';
import { SoundManager } from '../services/SoundManager';

export type CardState = 'normal' | 'hover' | 'selected' | 'placed' | 'disabled' | 'correct' | 'wrong';

export type CardColorTheme = 'white' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | string;

export interface CanvasCardConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text: string;
  value?: any;
  fontSize?: string | number;
  fontFamily?: string;
  textColor?: string;
  color?: CardColorTheme;
  draggable?: boolean;
  tappable?: boolean;
  cornerRadius?: number;
  onTap?: (card: CanvasCard) => void;
  onDragStart?: (card: CanvasCard, pointer: Phaser.Input.Pointer) => void;
  onDrag?: (card: CanvasCard, pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => void;
  onDragEnd?: (card: CanvasCard, pointer: Phaser.Input.Pointer) => void;
  onDrop?: (card: CanvasCard, target: any) => void;
}

interface CardPalette {
  bg: number;
  border: number;
  shadow: number;
  textColor: string;
}

const CARD_THEMES: Record<string, CardPalette> = {
  white: { bg: 0xfafafa, border: 0x4a90e2, shadow: 0x223344, textColor: '#1a1a2e' },
  blue: { bg: 0xe8f4fd, border: 0x2b82c9, shadow: 0x19578c, textColor: '#14436c' },
  green: { bg: 0xebfbee, border: 0x48b64e, shadow: 0x2e8233, textColor: '#1f5c24' },
  yellow: { bg: 0xfff9db, border: 0xf5a623, shadow: 0xb5730a, textColor: '#5c3a00' },
  purple: { bg: 0xf3ebfa, border: 0x8e44ad, shadow: 0x602677, textColor: '#431754' },
  orange: { bg: 0xfff0e6, border: 0xff7a00, shadow: 0xb35500, textColor: '#663100' },
};

export class CanvasCard extends Phaser.GameObjects.Container {
  private config: CanvasCardConfig;
  private cardWidth: number;
  private cardHeight: number;
  private cardValue: any;
  private cardText: string;
  private currentState: CardState = 'normal';
  private colorTheme: CardColorTheme;
  private homeX: number;
  private homeY: number;
  private currentSlot: any = null;
  private hasDraggedCard: boolean = false;
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;

  private bgGraphics: Phaser.GameObjects.Graphics | null = null;
  private labelText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, config: CanvasCardConfig) {
    super(scene, config.x ?? 0, config.y ?? 0);

    this.config = config;
    this.cardWidth = config.width ?? 140;
    this.cardHeight = config.height ?? 64;
    this.cardText = config.text;
    this.cardValue = config.value !== undefined ? config.value : config.text;
    this.colorTheme = config.color ?? 'white';
    this.homeX = config.x ?? 0;
    this.homeY = config.y ?? 0;

    this.setSize(this.cardWidth, this.cardHeight);

    this.createBackground();
    this.createLabel();
    this.setupInteractions();

    if (scene.add && typeof scene.add.existing === 'function') {
      scene.add.existing(this);
    }
  }

  private getThemePalette(): CardPalette {
    if (CARD_THEMES[this.colorTheme]) {
      return CARD_THEMES[this.colorTheme];
    }
    return CARD_THEMES.white;
  }

  private createBackground(): void {
    if (this.bgGraphics) {
      this.bgGraphics.destroy();
      this.bgGraphics = null;
    }

    const palette = this.getThemePalette();
    const w = this.cardWidth;
    const h = this.cardHeight;
    const radius = this.config.cornerRadius ?? 12;
    const halfW = w / 2;
    const halfH = h / 2;

    const g = this.scene.add.graphics();

    let bgColor = palette.bg;
    let borderColor = palette.border;
    let borderWidth = 2.5;
    let bgAlpha = 1.0;

    switch (this.currentState) {
      case 'hover':
        borderColor = 0x00d2ff;
        borderWidth = 3.5;
        break;
      case 'selected':
        borderColor = 0xffcc00;
        bgColor = 0xfffae6;
        borderWidth = 3.5;
        break;
      case 'placed':
        bgAlpha = 0.95;
        borderColor = 0x51a4e8;
        break;
      case 'disabled':
        bgAlpha = 0.5;
        borderColor = 0x999999;
        break;
      case 'correct':
        borderColor = 0x2ecc71;
        bgColor = 0xe8f8f0;
        borderWidth = 3.5;
        break;
      case 'wrong':
        borderColor = 0xe74c3c;
        bgColor = 0xfdedec;
        borderWidth = 3.5;
        break;
      case 'normal':
      default:
        break;
    }

    // 1. Drop shadow
    g.fillStyle(0x000000, 0.15);
    g.fillRoundedRect(-halfW + 1, -halfH + 3, w, h, radius);

    // 2. Card body fill
    g.fillStyle(bgColor, bgAlpha);
    g.fillRoundedRect(-halfW, -halfH, w, h, radius);

    // 3. Crisp border stroke
    g.lineStyle(borderWidth, borderColor, 1.0);
    g.strokeRoundedRect(-halfW, -halfH, w, h, radius);

    // 4. Subtle top gloss
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(-halfW + 2, -halfH + 2, w - 4, (h - 4) / 2, Math.max(2, radius - 2));

    this.bgGraphics = g;
    if (this.length > 0) {
      this.addAt(g, 0);
    } else {
      this.add(g);
    }
  }

  private createLabel(): void {
    if (this.labelText) {
      this.labelText.destroy();
      this.labelText = null;
    }

    const palette = this.getThemePalette();
    let defaultFontSize = '30px';
    if (this.cardText.length <= 2) {
      defaultFontSize = '34px';
    } else if (this.cardText.length <= 4) {
      defaultFontSize = '28px';
    } else {
      defaultFontSize = '22px';
    }

    const fontSize = typeof this.config.fontSize === 'number' ? `${this.config.fontSize}px` : this.config.fontSize ?? defaultFontSize;
    const fontFamily = this.config.fontFamily ?? "'PingFang HK', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    const textColor = this.config.textColor ?? palette.textColor;

    const text = this.scene.add.text(0, 0, this.cardText, {
      fontSize,
      fontFamily,
      color: textColor,
      fontStyle: 'bold',
      align: 'center',
      resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
    });

    if (typeof text.setOrigin === 'function') {
      text.setOrigin(0.5, 0.5);
    }

    this.labelText = text;
    this.add(text);
  }

  private setupInteractions(): void {
    const hitPadX = 12;
    const hitPadY = 12;
    const hitW = this.cardWidth + hitPadX * 2;
    const hitH = this.cardHeight + hitPadY * 2;
    const hitRect = (Phaser && Phaser.Geom && Phaser.Geom.Rectangle)
      ? new Phaser.Geom.Rectangle(-this.cardWidth / 2 - hitPadX, -this.cardHeight / 2 - hitPadY, hitW, hitH)
      : undefined;

    if (hitRect) {
      this.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
    } else {
      this.setInteractive({ useHandCursor: true });
    }

    if (this.config.draggable && this.scene.input && typeof this.scene.input.setDraggable === 'function') {
      this.scene.input.setDraggable(this);
    }

    this.on('pointerover', () => {
      if (this.currentState === 'disabled') return;
      if (this.currentState === 'normal') {
        this.setState('hover');
      }
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.04,
          scaleY: 1.04,
          duration: 80,
          ease: 'Quad.easeOut',
        });
      }
    });

    this.on('pointerout', () => {
      if (this.currentState === 'disabled') return;
      if (this.currentState === 'hover') {
        this.setState('normal');
      }
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 80,
          ease: 'Quad.easeOut',
        });
      }
    });

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.currentState === 'disabled') return;
      this.hasDraggedCard = false;
      this.pointerDownX = pointer?.x ?? this.x;
      this.pointerDownY = pointer?.y ?? this.y;

      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(this);
        this.setScale(1.0, 1.0);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.08,
          scaleY: 0.92,
          duration: 70,
          yoyo: true,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            this.setScale(1.0, 1.0);
          },
        });
      }

      // If card is in multiple-choice mode (not draggable), trigger tap on pointerdown for instant zero-latency feedback
      if (!this.config.draggable && this.config.tappable !== false && typeof this.config.onTap === 'function') {
        SoundManager.playCardSnap();
        this.config.onTap(this);
      }
    });

    this.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.currentState === 'disabled') return;

      const px = pointer?.x ?? this.pointerDownX;
      const py = pointer?.y ?? this.pointerDownY;
      const moveDist = Math.hypot(px - this.pointerDownX, py - this.pointerDownY);

      if (!this.hasDraggedCard || moveDist <= 16) {
        if (this.config.tappable !== false && typeof this.config.onTap === 'function') {
          if (this.config.draggable || !pointer) {
            SoundManager.playCardSnap();
            this.config.onTap(this);
          }
        }
      }
      this.hasDraggedCard = false;
    });

    this.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      if (this.currentState === 'disabled') return;
      this.hasDraggedCard = true;
      this.setState('selected');
      this.setDepth(100);
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(this);
        this.setScale(1.08, 1.08);
      }
      if (typeof this.config.onDragStart === 'function') {
        this.config.onDragStart(this, pointer);
      }
    });

    this.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.currentState === 'disabled') return;
      this.hasDraggedCard = true;
      this.x = dragX;
      this.y = dragY;
      if (typeof this.config.onDrag === 'function') {
        this.config.onDrag(this, pointer, dragX, dragY);
      }
    });

    this.on('dragend', (pointer: Phaser.Input.Pointer) => {
      if (this.currentState === 'disabled') return;
      this.setDepth(10);

      if (typeof this.config.onDragEnd === 'function') {
        this.config.onDragEnd(this, pointer);
      }
      this.hasDraggedCard = false;
    });

    this.on('drop', (_pointer: Phaser.Input.Pointer, target: any) => {
      if (this.currentState === 'disabled') return;
      if (typeof this.config.onDrop === 'function') {
        this.config.onDrop(this, target);
      }
    });
  }

  public setState(state: CardState): this {
    this.currentState = state;
    if (state === 'disabled') {
      this.setAlpha(0.5);
    } else {
      this.setAlpha(1.0);
    }
    this.createBackground();
    return this;
  }

  public getState(): CardState {
    return this.currentState;
  }

  public setSelected(selected: boolean): this {
    return this.setState(selected ? 'selected' : 'normal');
  }

  public setDisabled(disabled: boolean): this {
    return this.setState(disabled ? 'disabled' : 'normal');
  }

  public setHomePosition(x: number, y: number): this {
    this.homeX = x;
    this.homeY = y;
    return this;
  }

  public getHomePosition(): { x: number; y: number } {
    return { x: this.homeX, y: this.homeY };
  }

  public snapBack(duration: number = 250, onComplete?: () => void): this {
    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.add({
        targets: this,
        x: this.homeX,
        y: this.homeY,
        scaleX: 1.0,
        scaleY: 1.0,
        duration,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.setState('normal');
          if (onComplete) onComplete();
        },
      });
    } else {
      this.x = this.homeX;
      this.y = this.homeY;
      this.setState('normal');
      if (onComplete) onComplete();
    }
    return this;
  }

  public wobble(): this {
    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(this);
    }
    const priorState = this.currentState;
    this.setState('wrong');
    const startX = this.currentSlot ? this.currentSlot.getCenterPosition().x : (this.homeX || this.x);
    this.x = startX;

    if (this.scene?.tweens) {
      this.scene.tweens.add({
        targets: this,
        x: startX + 8,
        duration: 45,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.x = startX;
          if (priorState === 'disabled' || this.currentState === 'disabled') {
            this.setState('disabled');
          } else if (this.currentSlot) {
            this.setState('placed');
          } else {
            this.setState('normal');
          }
        },
      });
    }
    return this;
  }

  public pulse(): this {
    if (this.scene?.tweens) {
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 150,
        yoyo: true,
        repeat: 1,
        ease: 'Quad.easeInOut',
      });
    }
    return this;
  }

  public setText(text: string): this {
    this.cardText = text;
    if (this.labelText) {
      if (typeof this.labelText.setText === 'function') {
        this.labelText.setText(text);
      } else {
        (this.labelText as any).text = text;
      }
    } else {
      this.createLabel();
    }
    return this;
  }

  public getText(): string {
    return this.cardText;
  }

  public setValue(val: any): this {
    this.cardValue = val;
    return this;
  }

  public getValue(): any {
    return this.cardValue;
  }

  public setCurrentSlot(slot: any): this {
    this.currentSlot = slot;
    return this;
  }

  public getCurrentSlot(): any {
    return this.currentSlot;
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
    if (this.labelText && typeof this.labelText.setScrollFactor === 'function') {
      this.labelText.setScrollFactor(x, sy);
    }
    return this;
  }

  public override destroy(fromScene?: boolean): void {
    if (this.scene?.tweens?.killTweensOf) {
      this.scene.tweens.killTweensOf(this);
    }
    super.destroy(fromScene);
  }
}
