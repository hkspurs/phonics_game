/**
 * FeedbackPanel.ts
 * Specification V2 — Educational Feedback Panel Component
 * 
 * Renders structured educational feedback:
 * - Success (Green background with concept reinforcement)
 * - Error (Red background with instructional explanation)
 * - Hint (Amber background with progressive hint guidance)
 */

import Phaser from 'phaser';
import { RADIUS, TYPOGRAPHY, COLORS } from './DesignTokens';
import { getIconTextureKey } from './CanvasIcon';

export type FeedbackType = 'success' | 'error' | 'hint';

export interface FeedbackPanelConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  type: FeedbackType;
  title: string;
  message: string;
  conceptHighlight?: string;
  onNextClick?: () => void;
  nextButtonLabel?: string;
}

export class FeedbackPanel extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private iconImage: Phaser.GameObjects.Image | null = null;
  private titleText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private panelWidth: number;
  private panelHeight: number;
  private feedbackType: FeedbackType;

  constructor(scene: Phaser.Scene, config: FeedbackPanelConfig) {
    super(scene, config.x, config.y);

    this.panelWidth = config.width || 680;
    this.panelHeight = config.height || 140;
    this.feedbackType = config.type;

    this.bgGraphics = scene.add.graphics();
    this.add(this.bgGraphics);

    this.renderBackground();

    // Icon
    const iconKey = config.type === 'success' ? 'check' : config.type === 'error' ? 'cross' : 'hint';
    const textureKey = getIconTextureKey(iconKey as any, 32);
    const iconX = -this.panelWidth / 2 + 36;
    const iconY = -this.panelHeight / 2 + 36;

    if (scene.textures?.exists && scene.textures.exists(textureKey) && scene.add.image) {
      this.iconImage = scene.add.image(iconX, iconY, textureKey);
      this.iconImage.setOrigin(0.5);
      this.add(this.iconImage);
    }

    // Title
    const titleX = iconX + 28;
    this.titleText = scene.add.text(titleX, iconY, config.title, {
      fontSize: TYPOGRAPHY.sectionHeading.fontSize,
      fontFamily: TYPOGRAPHY.fontFamilyContent,
      color: COLORS.text.primary,
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0, 0.5);
    this.add(this.titleText);

    // Message
    const msgY = iconY + 36;
    const fullMessage = config.conceptHighlight
      ? `${config.message} 【${config.conceptHighlight}】`
      : config.message;

    this.messageText = scene.add.text(iconX - 10, msgY, fullMessage, {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontFamily: TYPOGRAPHY.fontFamilyContent,
      color: COLORS.text.secondary,
      wordWrap: { width: this.panelWidth - 52 },
      lineSpacing: 4,
    });
    this.messageText.setOrigin(0, 0);
    this.add(this.messageText);

    scene.add.existing(this);
  }

  private renderBackground(): void {
    this.bgGraphics.clear();
    const halfW = this.panelWidth / 2;
    const halfH = this.panelHeight / 2;

    let bgColor = 0x1e293b;
    let borderColor = 0x475569;

    switch (this.feedbackType) {
      case 'success':
        bgColor = 0x064e3b;
        borderColor = 0x22c55e;
        break;
      case 'error':
        bgColor = 0x450a0a;
        borderColor = 0xef4444;
        break;
      case 'hint':
        bgColor = 0x451a03;
        borderColor = 0xf59e0b;
        break;
    }

    this.bgGraphics.fillStyle(bgColor, 0.95);
    this.bgGraphics.fillRoundedRect(-halfW, -halfH, this.panelWidth, this.panelHeight, RADIUS.lg);

    this.bgGraphics.lineStyle(2, borderColor, 0.9);
    this.bgGraphics.strokeRoundedRect(-halfW, -halfH, this.panelWidth, this.panelHeight, RADIUS.lg);
  }
}
