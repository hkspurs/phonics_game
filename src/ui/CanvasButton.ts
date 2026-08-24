import Phaser from 'phaser';
import { SoundManager } from '../services/SoundManager';

export type ButtonColorName = 'blue' | 'green' | 'red' | 'yellow' | 'grey' | 'gray' | 'purple' | string;

export interface CanvasButtonConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  icon?: string;
  iconScale?: number;
  iconPosition?: 'left' | 'right' | 'center';
  color?: ButtonColorName | number;
  variant?: 'rectangle' | 'round' | 'square';
  fontSize?: string | number;
  fontFamily?: string;
  textColor?: string;
  onClick?: (button: CanvasButton) => void;
  disabled?: boolean;
  soundKey?: string;
  scaleOnHover?: number;
  scaleOnDown?: number;
  cornerRadius?: number;
  nineSlice?: boolean;
}

interface ColorPalette {
  base: number;
  dark: number;
  light: number;
  border: number;
  textColor: string;
}

const COLOR_MAP: Record<string, ColorPalette> = {
  blue: { base: 0x2b82c9, dark: 0x19578c, light: 0x51a4e8, border: 0x14436c, textColor: '#ffffff' },
  green: { base: 0x48b64e, dark: 0x2e8233, light: 0x6dd173, border: 0x1f5c24, textColor: '#ffffff' },
  red: { base: 0xe04343, dark: 0x9e2424, light: 0xf26b6b, border: 0x751616, textColor: '#ffffff' },
  yellow: { base: 0xf5a623, dark: 0xb5730a, light: 0xfbc45f, border: 0x8a5300, textColor: '#4a2f00' },
  grey: { base: 0x757d8a, dark: 0x4a515c, light: 0x9aa2af, border: 0x333942, textColor: '#ffffff' },
  gray: { base: 0x757d8a, dark: 0x4a515c, light: 0x9aa2af, border: 0x333942, textColor: '#ffffff' },
  purple: { base: 0x8e44ad, dark: 0x602677, light: 0xaa5fd1, border: 0x431754, textColor: '#ffffff' },
};

export class CanvasButton extends Phaser.GameObjects.Container {
  private config: CanvasButtonConfig;
  private btnWidth: number;
  private btnHeight: number;
  private isBtnEnabled: boolean = true;
  private colorKey: string | number;
  private bgGraphics: Phaser.GameObjects.Graphics | null = null;
  private labelText: Phaser.GameObjects.Text | null = null;
  private iconImage: Phaser.GameObjects.Image | null = null;
  private soundKey: string;
  private scaleOnHover: number;
  private scaleOnDown: number;

  constructor(scene: Phaser.Scene, config: CanvasButtonConfig = {}) {
    super(scene, config.x ?? 0, config.y ?? 0);

    this.config = config;
    this.btnWidth = config.width ?? (config.variant === 'round' || config.variant === 'square' ? 60 : 200);
    this.btnHeight = config.height ?? 60;
    this.colorKey = config.color ?? 'blue';
    this.soundKey = config.soundKey ?? 'click';
    this.scaleOnHover = config.scaleOnHover ?? 1.05;
    this.scaleOnDown = config.scaleOnDown ?? 0.95;
    this.isBtnEnabled = config.disabled !== true;

    this.setSize(this.btnWidth, this.btnHeight);

    this.createBackground();
    this.createContents();
    this.setupInteractivity();

    if (!this.isBtnEnabled) {
      this.applyDisabledVisuals();
    }

    if (scene.add && typeof scene.add.existing === 'function') {
      scene.add.existing(this);
    }
  }

  private getColorPalette(): ColorPalette {
    if (typeof this.colorKey === 'string' && COLOR_MAP[this.colorKey.toLowerCase()]) {
      return COLOR_MAP[this.colorKey.toLowerCase()];
    }

    if (typeof this.colorKey === 'number') {
      return {
        base: this.colorKey,
        dark: Math.max(0, this.colorKey - 0x222222),
        light: Math.min(0xffffff, this.colorKey + 0x222222),
        border: Math.max(0, this.colorKey - 0x333333),
        textColor: '#ffffff',
      };
    }

    return COLOR_MAP.blue;
  }

  private createBackground(): void {
    if (this.bgGraphics) {
      this.bgGraphics.destroy();
      this.bgGraphics = null;
    }

    const palette = this.getColorPalette();
    const w = this.btnWidth;
    const h = this.btnHeight;
    const radius = this.config.cornerRadius ?? (this.config.variant === 'round' ? Math.min(w, h) / 2 : 12);
    const depth = 4;

    const g = this.scene.add.graphics();
    const halfW = w / 2;
    const halfH = h / 2;

    // 1. Drop shadow / bottom 3D bevel
    g.fillStyle(palette.dark, 0.9);
    g.fillRoundedRect(-halfW, -halfH + depth, w, h, radius);

    // 2. Main face
    g.fillStyle(palette.base, 1.0);
    g.fillRoundedRect(-halfW, -halfH, w, h - depth, radius);

    // 3. Top specular gloss highlight
    g.fillStyle(palette.light, 0.4);
    g.fillRoundedRect(-halfW + 2, -halfH + 2, w - 4, (h - depth) / 2 - 2, Math.max(2, radius - 2));

    // 4. Outer border stroke
    g.lineStyle(2, palette.border, 0.8);
    g.strokeRoundedRect(-halfW, -halfH, w, h, radius);

    this.bgGraphics = g;
    if (this.length > 0) {
      this.addAt(g, 0);
    } else {
      this.add(g);
    }
  }

  private createContents(): void {
    const palette = this.getColorPalette();
    const textStr = this.config.text ?? '';
    const fontSize = typeof this.config.fontSize === 'number' ? `${this.config.fontSize}px` : this.config.fontSize ?? '24px';
    const fontFamily = this.config.fontFamily ?? "'Kenney Future', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";
    const textColor = this.config.textColor ?? palette.textColor;

    if (this.labelText) {
      this.labelText.destroy();
      this.labelText = null;
    }

    if (textStr || !this.config.icon) {
      const text = this.scene.add.text(0, -2, textStr, {
        fontSize,
        fontFamily,
        color: textColor,
        align: 'center',
      });
      if (typeof text.setOrigin === 'function') {
        text.setOrigin(0.5, 0.5);
      }
      if (typeof text.setShadow === 'function') {
        text.setShadow(1, 2, 'rgba(0,0,0,0.4)', 2, true, true);
      }
      this.labelText = text;
      this.add(text);
    }

    if (this.config.icon) {
      this.createOrUpdateIcon(this.config.icon);
    }

    this.layoutContents();
  }

  private createOrUpdateIcon(iconKey: string): void {
    if (this.iconImage) {
      this.iconImage.destroy();
      this.iconImage = null;
    }

    const img = this.scene.add.image(0, -2, iconKey);
    if (typeof img.setOrigin === 'function') {
      img.setOrigin(0.5, 0.5);
    }
    if (typeof img.setScale === 'function' && this.config.iconScale) {
      img.setScale(this.config.iconScale);
    }
    this.iconImage = img;
    this.add(img);
  }

  private layoutContents(): void {
    if (this.labelText && this.iconImage) {
      const spacing = 10;
      const textW = this.labelText.width ?? 60;
      const iconW = (this.iconImage.displayWidth ?? 32) * (this.config.iconScale ?? 1);
      const totalW = iconW + spacing + textW;

      if (this.config.iconPosition === 'right') {
        this.labelText.x = -totalW / 2 + textW / 2;
        this.iconImage.x = totalW / 2 - iconW / 2;
      } else {
        // default left
        this.iconImage.x = -totalW / 2 + iconW / 2;
        this.labelText.x = totalW / 2 - textW / 2;
      }
    } else if (this.labelText) {
      this.labelText.x = 0;
      this.labelText.y = -2;
    } else if (this.iconImage) {
      this.iconImage.x = 0;
      this.iconImage.y = -2;
    }
  }

  private setupInteractivity(): void {
    const hitRect = (Phaser && Phaser.Geom && Phaser.Geom.Rectangle)
      ? new Phaser.Geom.Rectangle(-this.btnWidth / 2, -this.btnHeight / 2, this.btnWidth, this.btnHeight)
      : undefined;

    if (hitRect) {
      this.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
    } else {
      this.setInteractive({ useHandCursor: true });
    }

    this.on('pointerover', () => {
      if (!this.isBtnEnabled) return;
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
          targets: this,
          scaleX: this.scaleOnHover,
          scaleY: this.scaleOnHover,
          duration: 80,
          ease: 'Quad.easeOut',
        });
      }
    });

    this.on('pointerout', () => {
      if (!this.isBtnEnabled) return;
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

    this.on('pointerdown', () => {
      if (!this.isBtnEnabled) return;
      SoundManager.play(this.soundKey);
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
          targets: this,
          scaleX: this.scaleOnDown,
          scaleY: this.scaleOnDown,
          duration: 50,
          ease: 'Quad.easeIn',
        });
      }
    });

    this.on('pointerup', () => {
      if (!this.isBtnEnabled) return;
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 80,
          ease: 'Back.easeOut',
        });
      }
      if (typeof this.config.onClick === 'function') {
        this.config.onClick(this);
      }
    });
  }

  private applyDisabledVisuals(): void {
    this.setAlpha(0.5);
    if (typeof this.disableInteractive === 'function') {
      // In Phaser, disabling interaction stops pointer events
    }
  }

  public setEnabled(enabled: boolean): this {
    this.isBtnEnabled = enabled;
    if (enabled) {
      this.setAlpha(1.0);
    } else {
      this.setAlpha(0.5);
    }
    return this;
  }

  public isEnabled(): boolean {
    return this.isBtnEnabled;
  }

  public setText(text: string): this {
    this.config.text = text;
    if (this.labelText) {
      if (typeof this.labelText.setText === 'function') {
        this.labelText.setText(text);
      } else {
        (this.labelText as any).text = text;
      }
    } else {
      this.createContents();
    }
    this.layoutContents();
    return this;
  }

  public getText(): string {
    return this.labelText?.text ?? this.config.text ?? '';
  }

  public setIcon(iconKey: string): this {
    this.config.icon = iconKey;
    this.createOrUpdateIcon(iconKey);
    this.layoutContents();
    return this;
  }

  public setColor(color: ButtonColorName | number): this {
    this.colorKey = color;
    this.createBackground();
    if (this.labelText && this.config.textColor === undefined) {
      const palette = this.getColorPalette();
      if (typeof this.labelText.setColor === 'function') {
        this.labelText.setColor(palette.textColor);
      }
    }
    return this;
  }

  public getColor(): string | number {
    return this.colorKey;
  }

  public getButtonWidth(): number {
    return this.btnWidth;
  }

  public getButtonHeight(): number {
    return this.btnHeight;
  }

  public triggerClick(): void {
    if (this.isBtnEnabled && typeof this.config.onClick === 'function') {
      this.config.onClick(this);
    }
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
    if (this.iconImage && typeof this.iconImage.setScrollFactor === 'function') {
      this.iconImage.setScrollFactor(x, sy);
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

