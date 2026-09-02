/**
 * CurrencyPill.ts
 * Specification V2 — Shared High-Contrast Currency Pill Component
 * 
 * Renders an authoritative currency balance pill:
 * - Crisp rounded container with dark navy surface and soft border
 * - Procedural vector icon (coin, gem, star) at 24px
 * - Bold formatted numerical balance with WCAG AA compliant contrast
 * - Optional + / add button trigger
 */

import Phaser from 'phaser';
import { RADIUS, TYPOGRAPHY, COLORS } from './DesignTokens';
import { getIconTextureKey } from './CanvasIcon';

export interface CurrencyPillConfig {
  x: number;
  y: number;
  type: 'coins' | 'gems' | 'stars';
  amount: number;
  width?: number;
  height?: number;
  showAdd?: boolean;
  onAddClick?: () => void;
}

export class CurrencyPill extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private iconImage: Phaser.GameObjects.Image | null = null;
  private fallbackIconText: Phaser.GameObjects.Text | null = null;
  private amountText: Phaser.GameObjects.Text;
  private pillWidth: number;
  private pillHeight: number;
  private currencyType: 'coins' | 'gems' | 'stars';
  private currentAmount: number;

  constructor(scene: Phaser.Scene, config: CurrencyPillConfig) {
    super(scene, config.x, config.y);

    this.currencyType = config.type;
    this.currentAmount = config.amount;
    this.pillWidth = config.width || 135;
    this.pillHeight = config.height || 36;

    this.bgGraphics = scene.add.graphics();
    this.add(this.bgGraphics);

    this.renderBackground();

    // Icon setup
    const iconX = -this.pillWidth / 2 + 20;
    const iconKey = config.type === 'coins' ? 'coin' : config.type === 'gems' ? 'gem' : 'star';
    const textureKey = getIconTextureKey(iconKey as any, 24);

    if (scene.textures?.exists && scene.textures.exists(textureKey) && scene.add.image) {
      this.iconImage = scene.add.image(iconX, 0, textureKey);
      this.iconImage.setOrigin(0.5);
      this.add(this.iconImage);
    } else {
      // Fallback symbol
      const fallbackSymbol = config.type === 'coins' ? '🪙' : config.type === 'gems' ? '💎' : '⭐';
      this.fallbackIconText = scene.add.text(iconX, 0, fallbackSymbol, {
        fontSize: '20px',
      });
      this.fallbackIconText.setOrigin(0.5);
      this.add(this.fallbackIconText);
    }

    // Amount text
    const textX = iconX + 18;
    this.amountText = scene.add.text(textX, 0, this.formatAmount(this.currentAmount), {
      fontSize: TYPOGRAPHY.metadata.fontSize,
      fontFamily: TYPOGRAPHY.fontFamily,
      color: COLORS.text.primary,
      fontStyle: 'bold',
    });
    this.amountText.setOrigin(0, 0.5);
    this.add(this.amountText);

    scene.add.existing(this);
  }

  private renderBackground(): void {
    this.bgGraphics.clear();

    const halfW = this.pillWidth / 2;
    const halfH = this.pillHeight / 2;

    // Dark slate navy background
    this.bgGraphics.fillStyle(0x0e1726, 0.92);
    this.bgGraphics.fillRoundedRect(-halfW, -halfH, this.pillWidth, this.pillHeight, RADIUS.round);

    // Subtle golden/cyan/amber border
    const borderColor =
      this.currencyType === 'coins'
        ? COLORS.currency.coin
        : this.currencyType === 'gems'
        ? COLORS.currency.gem
        : COLORS.currency.star;

    this.bgGraphics.lineStyle(1.8, borderColor, 0.7);
    this.bgGraphics.strokeRoundedRect(-halfW, -halfH, this.pillWidth, this.pillHeight, RADIUS.round);
  }

  public setAmount(newAmount: number): void {
    if (this.currentAmount === newAmount) return;
    this.currentAmount = newAmount;
    this.amountText.setText(this.formatAmount(newAmount));
  }

  public getAmount(): number {
    return this.currentAmount;
  }

  private formatAmount(val: number): string {
    return val >= 10000 ? `${(val / 1000).toFixed(1)}k` : String(val);
  }
}
