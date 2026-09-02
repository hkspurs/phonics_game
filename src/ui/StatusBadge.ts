/**
 * StatusBadge.ts
 * Specification V2 — Shared Status Badge Component
 * 
 * Supports:
 * - 'locked' (Grey with lock icon)
 * - 'available' (Blue/Gold outline with price or callout)
 * - 'owned' (Slate blue with check/box)
 * - 'equipped' (Vibrant emerald green with checkmark)
 * - 'completed' (Golden yellow with star)
 */

import Phaser from 'phaser';
import { RADIUS, TYPOGRAPHY, COLORS } from './DesignTokens';

export type StatusBadgeType = 'locked' | 'available' | 'owned' | 'equipped' | 'completed' | 'preview';

export interface StatusBadgeConfig {
  x: number;
  y: number;
  type: StatusBadgeType;
  label?: string;
  width?: number;
  height?: number;
  fontSize?: string;
}

export class StatusBadge extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private badgeWidth: number;
  private badgeHeight: number;
  private badgeType: StatusBadgeType;

  constructor(scene: Phaser.Scene, config: StatusBadgeConfig) {
    super(scene, config.x, config.y);

    this.badgeType = config.type;
    this.badgeWidth = config.width || 100;
    this.badgeHeight = config.height || 30;

    this.bgGraphics = scene.add.graphics();
    this.add(this.bgGraphics);

    const defaultLabel = this.getDefaultLabel(config.type);
    const label = config.label || defaultLabel;

    this.labelText = scene.add.text(0, 0, label, {
      fontSize: config.fontSize || TYPOGRAPHY.minRendered.fontSize,
      fontFamily: TYPOGRAPHY.fontFamilyContent,
      color: COLORS.text.primary,
      fontStyle: 'bold',
      align: 'center',
    });
    this.labelText.setOrigin(0.5);
    this.add(this.labelText);

    this.renderBadge();
    scene.add.existing(this);
  }

  private getDefaultLabel(type: StatusBadgeType): string {
    switch (type) {
      case 'locked':
        return '未解鎖';
      case 'available':
        return '可購買';
      case 'owned':
        return '已擁有';
      case 'equipped':
        return '使用中';
      case 'completed':
        return '已通關';
      case 'preview':
        return '試穿中';
    }
  }

  public setType(type: StatusBadgeType, label?: string): void {
    this.badgeType = type;
    this.labelText.setText(label || this.getDefaultLabel(type));
    this.renderBadge();
  }

  private renderBadge(): void {
    this.bgGraphics.clear();
    const halfW = this.badgeWidth / 2;
    const halfH = this.badgeHeight / 2;

    let bgColor = 0x334155;
    let bgAlpha = 0.9;
    let borderColor = 0x64748b;
    let textColor: string = COLORS.text.primary;

    switch (this.badgeType) {
      case 'locked':
        bgColor = 0x1e293b;
        borderColor = 0x475569;
        textColor = COLORS.text.muted;
        break;

      case 'available':
        bgColor = 0x1e3a8a;
        borderColor = 0x3b82f6;
        textColor = '#93c5fd';
        break;

      case 'owned':
        bgColor = 0x0f3b5f;
        borderColor = 0x0284c7;
        textColor = '#bae6fd';
        break;

      case 'equipped':
        bgColor = 0x064e3b;
        borderColor = 0x10b981;
        textColor = '#6ee7b7';
        break;

      case 'completed':
        bgColor = 0x78350f;
        borderColor = 0xf59e0b;
        textColor = '#fde68a';
        break;

      case 'preview':
        bgColor = 0x581c87;
        borderColor = 0xa855f7;
        textColor = '#e9d5ff';
        break;
    }

    this.bgGraphics.fillStyle(bgColor, bgAlpha);
    this.bgGraphics.fillRoundedRect(-halfW, -halfH, this.badgeWidth, this.badgeHeight, RADIUS.sm);

    this.bgGraphics.lineStyle(1.5, borderColor, 0.85);
    this.bgGraphics.strokeRoundedRect(-halfW, -halfH, this.badgeWidth, this.badgeHeight, RADIUS.sm);

    this.labelText.setColor(textColor);
  }
}
