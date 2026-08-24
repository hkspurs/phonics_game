import Phaser from 'phaser';
import { CanvasButton } from './CanvasButton';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export interface CanvasModalConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  title?: string;
  backdropColor?: number;
  backdropAlpha?: number;
  panelColor?: number;
  borderColor?: number;
  cornerRadius?: number;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  onClose?: (modal: CanvasModal) => void;
  theme?: 'dark' | 'wood' | 'gold' | 'glass';
}

export class CanvasModal extends Phaser.GameObjects.Container {
  private config: CanvasModalConfig;
  private modalWidth: number;
  private modalHeight: number;
  private modalTitle: string;
  private isModalOpen: boolean = true;

  private backdropRect: Phaser.GameObjects.Rectangle | null = null;
  private panelContainer: Phaser.GameObjects.Container;
  private panelBg: Phaser.GameObjects.Graphics | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private closeBtn: CanvasButton | null = null;
  private contentContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: CanvasModalConfig = {}) {
    const centerX = config.x ?? (scene.sys?.game?.config ? Number(scene.sys.game.config.width) / 2 : GAME_WIDTH / 2);
    const centerY = config.y ?? (scene.sys?.game?.config ? Number(scene.sys.game.config.height) / 2 : GAME_HEIGHT / 2);
    super(scene, centerX, centerY);

    this.config = config;
    this.modalWidth = config.width ?? 600;
    this.modalHeight = config.height ?? 440;
    this.modalTitle = config.title ?? '';

    // Create backdrop to block clicks behind modal
    this.createBackdrop();

    // Create panel container for scaling animations
    this.panelContainer = scene.add.container ? scene.add.container(0, 0) : new Phaser.GameObjects.Container(scene, 0, 0);
    this.add(this.panelContainer);

    this.createPanelBackground();
    this.createHeader();

    // Content container placed inside panel container
    const contentYOffset = this.modalTitle ? 30 : 0;
    this.contentContainer = scene.add.container ? scene.add.container(0, contentYOffset) : new Phaser.GameObjects.Container(scene, 0, contentYOffset);
    this.panelContainer.add(this.contentContainer);

    if (config.showCloseButton !== false) {
      this.createCloseButton();
    }

    this.setDepth(1000);

    if (scene.add && typeof scene.add.existing === 'function') {
      scene.add.existing(this);
    }
  }

  private createBackdrop(): void {
    const gameW = this.scene.sys?.game?.config ? Number(this.scene.sys.game.config.width) : GAME_WIDTH;
    const gameH = this.scene.sys?.game?.config ? Number(this.scene.sys.game.config.height) : GAME_HEIGHT;
    const color = this.config.backdropColor ?? 0x000000;
    const alpha = this.config.backdropAlpha ?? 0.65;

    const rect = this.scene.add.rectangle(0, 0, gameW * 2, gameH * 2, color, alpha);
    if (rect && typeof (rect as any).setScrollFactor === 'function') {
      (rect as any).setScrollFactor(0);
    }
    if (typeof rect.setInteractive === 'function') {
      rect.setInteractive();
      if (this.config.closeOnBackdropClick) {
        rect.on('pointerup', (pointer: any) => {
          if (pointer) {
            const px = pointer.x !== undefined ? pointer.x : (pointer.position ? pointer.position.x : 0);
            const py = pointer.y !== undefined ? pointer.y : (pointer.position ? pointer.position.y : 0);
            const localX = px - this.x;
            const localY = py - this.y;
            const halfW = this.modalWidth / 2;
            const halfH = this.modalHeight / 2;
            // If click was inside panel bounding box, do not close
            if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
              return;
            }
          }
          this.close();
        });
      }
    }

    this.backdropRect = rect;
    this.add(rect);
  }

  private createPanelBackground(): void {
    if (this.panelBg) {
      this.panelBg.destroy();
      this.panelBg = null;
    }

    const w = this.modalWidth;
    const h = this.modalHeight;
    const radius = this.config.cornerRadius ?? 16;
    const halfW = w / 2;
    const halfH = h / 2;

    // Panel hit blocker rectangle to prevent clicks inside dialog from passing to backdrop
    const blocker = this.scene.add.rectangle(0, 0, w, h, 0x000000, 0.0001);
    if (blocker && typeof (blocker as any).setScrollFactor === 'function') {
      (blocker as any).setScrollFactor(0);
    }
    if (typeof blocker.setInteractive === 'function') {
      blocker.setInteractive();
      blocker.on('pointerup', (_p: any, _lx: number, _ly: number, event: any) => {
        if (event && typeof event.stopPropagation === 'function') {
          event.stopPropagation();
        }
      });
      blocker.on('pointerdown', (_p: any, _lx: number, _ly: number, event: any) => {
        if (event && typeof event.stopPropagation === 'function') {
          event.stopPropagation();
        }
      });
    }
    this.panelContainer.add(blocker);

    const g = this.scene.add.graphics();

    let bgColor = this.config.panelColor ?? 0x1e2438;
    let borderColor = this.config.borderColor ?? 0x4a90e2;
    let headerColor = 0x2b334d;

    if (this.config.theme === 'wood') {
      bgColor = 0x5c3d2e;
      borderColor = 0xb5804c;
      headerColor = 0x472f23;
    } else if (this.config.theme === 'gold') {
      bgColor = 0x2e251b;
      borderColor = 0xf5a623;
      headerColor = 0x3d3122;
    }

    // 1. Heavy shadow
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-halfW + 4, -halfH + 8, w, h, radius);

    // 2. Main panel background
    g.fillStyle(bgColor, 0.98);
    g.fillRoundedRect(-halfW, -halfH, w, h, radius);

    // 3. Header bar if title exists
    if (this.modalTitle) {
      const headerHeight = 64;
      g.fillStyle(headerColor, 1.0);
      g.fillRoundedRect(-halfW, -halfH, w, headerHeight, { tl: radius, tr: radius, bl: 0, br: 0 });

      // Header divider line
      g.lineStyle(2, borderColor, 0.6);
      g.beginPath();
      g.moveTo(-halfW, -halfH + headerHeight);
      g.lineTo(halfW, -halfH + headerHeight);
      g.strokePath();
    }

    // 4. Outer border stroke
    g.lineStyle(3.5, borderColor, 1.0);
    g.strokeRoundedRect(-halfW, -halfH, w, h, radius);

    // 5. Inner decorative highlight line
    g.lineStyle(1, 0xffffff, 0.15);
    g.strokeRoundedRect(-halfW + 4, -halfH + 4, w - 8, h - 8, Math.max(4, radius - 4));

    this.panelBg = g;
    this.panelContainer.add(g);
  }

  private createHeader(): void {
    if (!this.modalTitle) return;

    if (this.titleText) {
      this.titleText.destroy();
      this.titleText = null;
    }

    const halfH = this.modalHeight / 2;
    const text = this.scene.add.text(0, -halfH + 32, this.modalTitle, {
      fontSize: '28px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang HK', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
      color: '#ffd700',
      fontStyle: 'bold',
      align: 'center',
      resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
    });

    if (typeof text.setOrigin === 'function') {
      text.setOrigin(0.5, 0.5);
    }
    if (typeof text.setShadow === 'function') {
      text.setShadow(1, 2, 'rgba(0,0,0,0.6)', 3, true, true);
    }

    this.titleText = text;
    this.panelContainer.add(text);
  }

  private createCloseButton(): void {
    if (this.closeBtn) {
      this.closeBtn.destroy();
      this.closeBtn = null;
    }

    const halfW = this.modalWidth / 2;
    const halfH = this.modalHeight / 2;

    const btn = new CanvasButton(this.scene, {
      x: halfW - 28,
      y: -halfH + 28,
      width: 44,
      height: 44,
      variant: 'round',
      text: '✕',
      color: 'red',
      fontSize: '22px',
      onClick: () => this.close(),
    });
    if (btn && typeof (btn as any).setScrollFactor === 'function') {
      (btn as any).setScrollFactor(0);
    }

    this.closeBtn = btn;
    this.panelContainer.add(btn);
  }

  public show(animate: boolean = true, onComplete?: () => void): this {
    this.isModalOpen = true;
    this.setVisible(true);
    this.setAlpha(1.0);

    if (animate && this.scene?.tweens) {
      this.panelContainer.setScale(0.8);
      this.panelContainer.setAlpha(0.0);
      if (this.backdropRect) {
        this.backdropRect.setAlpha(0.0);
      }

      this.scene.tweens.add({
        targets: this.panelContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 1.0,
        duration: 220,
        ease: 'Back.easeOut',
        onComplete: () => {
          if (onComplete) onComplete();
        },
      });

      if (this.backdropRect) {
        this.scene.tweens.add({
          targets: this.backdropRect,
          alpha: this.config.backdropAlpha ?? 0.65,
          duration: 180,
          ease: 'Linear',
        });
      }
    } else {
      this.panelContainer.setScale(1.0);
      this.panelContainer.setAlpha(1.0);
      if (this.backdropRect) {
        this.backdropRect.setAlpha(this.config.backdropAlpha ?? 0.65);
      }
      if (onComplete) onComplete();
    }

    return this;
  }

  public hide(animate: boolean = true, onComplete?: () => void): this {
    this.isModalOpen = false;

    if (animate && this.scene?.tweens) {
      this.scene.tweens.add({
        targets: this.panelContainer,
        scaleX: 0.8,
        scaleY: 0.8,
        alpha: 0.0,
        duration: 180,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.setVisible(false);
          if (onComplete) onComplete();
        },
      });

      if (this.backdropRect) {
        this.scene.tweens.add({
          targets: this.backdropRect,
          alpha: 0.0,
          duration: 160,
          ease: 'Linear',
        });
      }
    } else {
      this.setVisible(false);
      if (onComplete) onComplete();
    }

    return this;
  }

  public close(): void {
    if (typeof this.config.onClose === 'function') {
      this.config.onClose(this);
    }
    this.hide();
  }

  public setTitle(title: string): this {
    this.modalTitle = title;
    if (this.titleText) {
      if (typeof this.titleText.setText === 'function') {
        this.titleText.setText(title);
      } else {
        (this.titleText as any).text = title;
      }
    } else {
      this.createHeader();
    }
    this.createPanelBackground();
    return this;
  }

  public getTitle(): string {
    return this.modalTitle;
  }

  public getContentContainer(): Phaser.GameObjects.Container {
    return this.contentContainer;
  }

  public addContent(gameObject: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): this {
    const items = Array.isArray(gameObject) ? gameObject : [gameObject];
    for (const item of items) {
      if (item && typeof (item as any).setScrollFactor === 'function') {
        (item as any).setScrollFactor(this.scrollFactorX, this.scrollFactorY);
      }
      this.contentContainer.add(item);
    }
    return this;
  }

  public override setScrollFactor(x: number, y?: number, updateChildren: boolean = true): this {
    if (typeof super.setScrollFactor === 'function') {
      super.setScrollFactor(x, y, updateChildren);
    } else {
      this.scrollFactorX = x;
      this.scrollFactorY = y !== undefined ? y : x;
    }
    const sy = y !== undefined ? y : x;
    if (this.backdropRect && typeof this.backdropRect.setScrollFactor === 'function') {
      this.backdropRect.setScrollFactor(x, sy);
    }
    if (this.panelContainer && typeof this.panelContainer.setScrollFactor === 'function') {
      this.panelContainer.setScrollFactor(x, sy, updateChildren);
    }
    if (this.contentContainer && typeof this.contentContainer.setScrollFactor === 'function') {
      this.contentContainer.setScrollFactor(x, sy, updateChildren);
    }
    if (this.closeBtn && typeof this.closeBtn.setScrollFactor === 'function') {
      this.closeBtn.setScrollFactor(x, sy, updateChildren);
    }
    return this;
  }

  public isOpen(): boolean {
    return this.isModalOpen;
  }

  public override destroy(fromScene?: boolean): void {
    if (this.scene?.tweens?.killTweensOf) {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.killTweensOf(this.panelContainer);
    }
    super.destroy(fromScene);
  }
}
