import Phaser from 'phaser';
import { DataManager } from '../services/DataManager';
import { CanvasButton } from './CanvasButton';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class DiagnosticReportModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private isShown: boolean = false;
  private onReviewCallback?: () => void;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, options?: { onReviewMistakes?: () => void; onClose?: () => void }) {
    this.scene = scene;
    this.onReviewCallback = options?.onReviewMistakes;
    this.onCloseCallback = options?.onClose;
  }

  public show(): void {
    if (this.isShown) return;
    this.isShown = true;

    const width = this.scene.sys?.game?.config ? Number(this.scene.sys.game.config.width) : GAME_WIDTH;
    const height = this.scene.sys?.game?.config ? Number(this.scene.sys.game.config.height) : GAME_HEIGHT;

    const summary = DataManager.getInstance().getDiagnosticSummary();

    const container = this.scene.add.container
      ? this.scene.add.container(width / 2, height / 2)
      : new Phaser.GameObjects.Container(this.scene, width / 2, height / 2);
    container.setDepth(300);

    const modalW = Math.min(width - 60, 880);
    const modalH = Math.min(height - 60, 560);

    if (this.scene.add.graphics) {
      const bg = this.scene.add.graphics();
      // Backdrop
      bg.fillStyle(0x000000, 0.75);
      bg.fillRect(-width / 2, -height / 2, width, height);

      // Card panel
      bg.fillStyle(0x0f172a, 0.98);
      bg.fillRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 20);
      bg.lineStyle(2, 0x38bdf8, 0.9);
      bg.strokeRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 20);
      container.add(bg);
    }

    if (this.scene.add.text) {
      // Title
      const title = this.scene.add.text(0, -modalH / 2 + 36, '📊 學習診斷報告 (Diagnostic Report)', {
        fontSize: '24px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#38bdf8',
        fontStyle: 'bold',
      });
      if (typeof title.setOrigin === 'function') title.setOrigin(0.5);
      container.add(title);

      // 4 Metric Badges
      const metrics = [
        { label: '📝 已完成題目', val: `${summary.totalQuestionsCompleted} 題`, color: '#f8fafc' },
        { label: '🎯 首次答對率', val: `${Math.round(summary.firstAttemptAccuracyRate * 100)}%`, color: '#86efac' },
        { label: '💡 提示使用', val: `${summary.totalHintsUsed} 次`, color: '#fde047' },
        { label: '❌ 累積失誤', val: `${summary.totalMistakes} 次`, color: '#f87171' },
      ];

      const badgeW = (modalW - 80) / 4;
      const startX = -modalW / 2 + 40 + badgeW / 2;
      metrics.forEach((m, idx) => {
        const bx = startX + idx * (badgeW + 10);
        const by = -modalH / 2 + 100;

        if (this.scene.add.graphics) {
          const bG = this.scene.add.graphics();
          bG.fillStyle(0x1e293b, 0.9);
          bG.fillRoundedRect(bx - badgeW / 2, by - 30, badgeW, 60, 10);
          bG.lineStyle(1, 0x475569, 0.6);
          bG.strokeRoundedRect(bx - badgeW / 2, by - 30, badgeW, 60, 10);
          container.add(bG);
        }

        const lbl = this.scene.add.text(bx, by - 12, m.label, {
          fontSize: '13px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#94a3b8',
        });
        if (typeof lbl.setOrigin === 'function') lbl.setOrigin(0.5);
        container.add(lbl);

        const val = this.scene.add.text(bx, by + 12, m.val, {
          fontSize: '18px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: m.color,
          fontStyle: 'bold',
        });
        if (typeof val.setOrigin === 'function') val.setOrigin(0.5);
        container.add(val);
      });

      // Subject Breakdown Cards
      const subjects = [
        { name: '中文科 (Chinese)', stats: summary.subjectBreakdown.chinese, color: '#f43f5e' },
        { name: '數學科 (Math)', stats: summary.subjectBreakdown.math, color: '#3b82f6' },
        { name: '英文科 (English)', stats: summary.subjectBreakdown.english, color: '#10b981' },
      ];

      const subjW = (modalW - 60) / 3;
      const sStartX = -modalW / 2 + 30 + subjW / 2;
      subjects.forEach((s, idx) => {
        const sx = sStartX + idx * (subjW + 10);
        const sy = 30;

        if (this.scene.add.graphics) {
          const sG = this.scene.add.graphics();
          sG.fillStyle(0x1e293b, 0.9);
          sG.fillRoundedRect(sx - subjW / 2, sy - 80, subjW, 160, 14);
          sG.lineStyle(2, Phaser.Display.Color.HexStringToColor(s.color).color, 0.8);
          sG.strokeRoundedRect(sx - subjW / 2, sy - 80, subjW, 160, 14);
          container.add(sG);
        }

        const sTitle = this.scene.add.text(sx, sy - 55, s.name, {
          fontSize: '16px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: s.color,
          fontStyle: 'bold',
        });
        if (typeof sTitle.setOrigin === 'function') sTitle.setOrigin(0.5);
        container.add(sTitle);

        const accPct = Math.round((s.stats.firstAttemptAccuracy || 0) * 100);
        const sAcc = this.scene.add.text(sx, sy - 15, `首次答對率：${accPct}%`, {
          fontSize: '15px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#f8fafc',
        });
        if (typeof sAcc.setOrigin === 'function') sAcc.setOrigin(0.5);
        container.add(sAcc);

        const sCompleted = this.scene.add.text(sx, sy + 15, `已完成題目：${s.stats.completed} 題`, {
          fontSize: '14px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#cbd5e1',
        });
        if (typeof sCompleted.setOrigin === 'function') sCompleted.setOrigin(0.5);
        container.add(sCompleted);

        const sAtt = this.scene.add.text(sx, sy + 45, `練習次數：${s.stats.totalAttempts} 次`, {
          fontSize: '13px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#94a3b8',
        });
        if (typeof sAtt.setOrigin === 'function') sAtt.setOrigin(0.5);
        container.add(sAtt);
      });
    }

    // Action Buttons: Review Mistakes & Close
    const mistakeCount = summary.mistakeQueue.length;
    const reviewBtnText = mistakeCount > 0 ? `🔄 錯題溫習 (${mistakeCount} 題)` : '✨ 目前無錯題';

    const reviewBtn = new CanvasButton(this.scene, {
      x: -120,
      y: modalH / 2 - 50,
      width: 220,
      height: 52,
      text: reviewBtnText,
      color: mistakeCount > 0 ? 'yellow' : 'grey',
      fontSize: '18px',
      disabled: mistakeCount === 0,
      onClick: () => {
        if (mistakeCount > 0 && typeof this.onReviewCallback === 'function') {
          this.hide();
          this.onReviewCallback();
        }
      },
    });
    container.add(reviewBtn);

    const closeBtn = new CanvasButton(this.scene, {
      x: 120,
      y: modalH / 2 - 50,
      width: 180,
      height: 52,
      text: '✖️ 關閉報告',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        this.hide();
      },
    });
    container.add(closeBtn);

    this.container = container;
    if (this.scene.add && typeof this.scene.add.existing === 'function') {
      this.scene.add.existing(container);
    }
  }

  public hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.isShown = false;
  }

  /** Alias for hide() to match CanvasModal interface used in tests */
  public close(): void {
    this.hide();
    this.onCloseCallback?.();
  }

  public isVisible(): boolean {
    return this.isShown;
  }

  /** CanvasModal-compatible alias for isVisible() */
  public isOpen(): boolean {
    return this.isShown;
  }

  /** Returns the fixed title of this diagnostic report modal */
  public getTitle(): string {
    return '📊 學習成績表';
  }

  public getMistakeCount(): number {
    return DataManager.getInstance().getMistakeReviewQueue().length;
  }
}
