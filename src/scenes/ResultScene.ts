import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, normalizeStationId, StationId } from '../config';
import { QuizQuestion } from '../types';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasModal } from '../ui/CanvasModal';
import { StarRating } from '../ui/StarRating';
import { STATIONS } from './MapScene';
import { QuestionSessionStats } from './QuestionScene';

export interface ResultSceneInitData {
  stationId?: StationId;
  stationName?: string;
  totalQuestions?: number;
  questions?: QuizQuestion[];
  sessionStats?: QuestionSessionStats;
  runnerCoins?: number;
}

export class ResultScene extends Phaser.Scene {
  public stationId: number = 1;
  public stationName: string = '小木屋';
  public totalQuestions: number = 3;
  public questions: QuizQuestion[] = [];
  public sessionStats: QuestionSessionStats = {
    hintsUsed: 0,
    mistakes: 0,
    correctCount: 3,
    startTime: Date.now(),
  };
  public runnerCoins: number = 0;

  public starsEarned: number = 3;
  public rewardCoins: number = 50;
  public rewardGems: number = 5;
  public newlyUnlockedTrophies: string[] = [];

  // UI Components
  public starRating: StarRating | null = null;
  public mapButton: CanvasButton | null = null;
  public retryButton: CanvasButton | null = null;
  public nextStationButton: CanvasButton | null = null;
  public homeButton: CanvasButton | null = null;
  public trophyModal: CanvasModal | null = null;

  // Containers & Display
  public panelContainer: Phaser.GameObjects.Container | null = null;
  public confettiParticles: Phaser.GameObjects.GameObject[] = [];
  public prefersReducedMotion = false;

  constructor() {
    super({ key: 'ResultScene' });
  }

  public init(data?: ResultSceneInitData): void {
    this.stationId = normalizeStationId(data?.stationId);
    this.stationName =
      data?.stationName ??
      STATIONS.find((s) => s.id === this.stationId)?.name ??
      '冒險關卡';

    this.totalQuestions = data?.totalQuestions ?? (data?.questions?.length || 3);
    this.questions = data?.questions ? [...data.questions] : [];
    this.sessionStats = data?.sessionStats ?? {
      hintsUsed: 0,
      mistakes: 0,
      correctCount: this.totalQuestions,
      startTime: Date.now(),
    };
    this.runnerCoins = data?.runnerCoins ?? 0;

    // 1. Calculate 3-Star Rating
    this.starsEarned = this.calculateStars(
      this.sessionStats.hintsUsed,
      this.sessionStats.mistakes
    );

    // 2. Calculate Settlement Rewards
    this.calculateRewards();

    // 3. Update DataManager
    this.applySettlementProgress();
  }

  public calculateStars(hintsUsed: number, mistakes: number): number {
    const totalFlaws = hintsUsed + mistakes;
    if (totalFlaws === 0) {
      return 3; // 3 stars: 0 hints, 0 mistakes (Perfect)
    } else if (totalFlaws === 1) {
      return 2; // 2 stars: 1 hint or 1 mistake (Great)
    } else {
      return 1; // 1 star: Cleared with 2+ hints/mistakes (Passed)
    }
  }

  public getItemisedRewardBreakdown(): {
    learningCoins: number;
    runnerCoins: number;
    runnerGems: number;
    firstClearGems: number;
    totalCoins: number;
    totalGems: number;
  } {
    const learningCoins = this.starsEarned === 3 ? 50 : this.starsEarned === 2 ? 30 : 20;
    const runnerCoins = Number(this.sessionStats.collectedCoins || this.runnerCoins || 0);
    const runnerGems = Number(this.sessionStats.collectedGems || 0);
    const isFirstClear = !DataManager.getInstance().isStationCompleted(this.stationId);
    const firstClearGems = isFirstClear ? (this.starsEarned === 3 ? 5 : this.starsEarned === 2 ? 3 : 1) : 0;

    return {
      learningCoins,
      runnerCoins,
      runnerGems,
      firstClearGems,
      totalCoins: learningCoins + runnerCoins,
      totalGems: runnerGems + firstClearGems,
    };
  }

  private calculateRewards(): void {
    const breakdown = this.getItemisedRewardBreakdown();
    this.rewardCoins = breakdown.totalCoins;
    this.rewardGems = breakdown.totalGems;
  }

  private isSettled: boolean = false;

  public applySettlementProgress(): void {
    if (this.isSettled) return;
    this.isSettled = true;
    try {
      const dm = DataManager.getInstance();
      const breakdown = this.getItemisedRewardBreakdown();

      // Record itemised atomic transactions in ledger
      dm.recordTransaction('learning', `station_${this.stationId}_clear`, 'coins', breakdown.learningCoins);
      if (breakdown.runnerCoins > 0) {
        dm.recordTransaction('runner_pickups', `station_${this.stationId}_runner_coins`, 'coins', breakdown.runnerCoins);
      }
      if (breakdown.runnerGems > 0) {
        dm.recordTransaction('runner_pickups', `station_${this.stationId}_runner_gems`, 'gems', breakdown.runnerGems);
      }
      if (breakdown.firstClearGems > 0) {
        dm.recordTransaction('first_clear', `station_${this.stationId}_first_clear_gems`, 'gems', breakdown.firstClearGems);
      }

      // Update station stars & unlock next station
      dm.markStationCompleted(this.stationId);
      dm.setStationStars(this.stationId, this.starsEarned);
      dm.unlockNextStation(this.stationId);

      // Unlock Hong Kong landmark stamp
      dm.unlockStamp(`station_${this.stationId}`);

      // Check for newly unlocked trophies
      this.newlyUnlockedTrophies = dm.checkTrophies();
    } catch (e) {
      console.warn('[ResultScene] Failed to update DataManager settlement:', e);
    }
  }

  public create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.prefersReducedMotion = this.prefersReducedMotion || this.detectReducedMotionPreference();

    // 1. Festive Background & Confetti
    this.createFestiveBackground(width, height);
    this.spawnConfettiParticles(width, height);

    // 2. Play Victory Fanfare Sound
    SoundManager.play('victory');

    // 3. Central Settlement Card Panel
    this.createSettlementPanel(width, height);

    // 4. Action Navigation Buttons
    this.createActionButtons(width, height);

    // 5. Newly Unlocked Trophy Popup (if any)
    if (this.newlyUnlockedTrophies.length > 0) {
      if (this.time?.delayedCall) {
        this.time.delayedCall(800, () => {
          this.showTrophyUnlockBanner();
        });
      } else {
        this.showTrophyUnlockBanner();
      }
    }
  }

  private createFestiveBackground(width: number, height: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();
      // Celebratory night gradient
      g.fillGradientStyle(0x1a1e36, 0x1a1e36, 0x0f1124, 0x0f1124, 1);
      g.fillRect(0, 0, width, height);

      // Golden celebratory radial glow in center
      g.fillStyle(0xffd700, 0.08);
      g.fillCircle(width / 2, height / 2 - 30, 360);
      g.fillStyle(0x38bdf8, 0.06);
      g.fillCircle(width / 2, height / 2 - 30, 480);
    } else if (this.add.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x1a1e36);
    }
  }

  private spawnConfettiParticles(width: number, height: number): void {
    if (this.prefersReducedMotion || !this.add?.text || !this.tweens?.add) return;

    this.confettiParticles = [];
    const emojis = ['🎉', '✨', '⭐', '🎊', '💫', '🌟', '🪙', '💎'];

    for (let i = 0; i < 22; i++) {
      const startX = Phaser.Math.Between(40, width - 40);
      const startY = Phaser.Math.Between(-50, height * 0.6);
      const emoji = emojis[i % emojis.length];

      const p = this.add.text(startX, startY, emoji, {
        fontSize: `${Phaser.Math.Between(18, 30)}px`,
      });
      if (typeof p.setOrigin === 'function') p.setOrigin(0.5);

      this.confettiParticles.push(p);

      // Drift down smoothly
      this.tweens.add({
        targets: p,
        y: height + 60,
        x: startX + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(2200, 4000),
        repeat: 0,
        delay: Phaser.Math.Between(0, 900),
        ease: 'Linear',
        onComplete: () => {
          if (typeof p.destroy === 'function') p.destroy();
          this.confettiParticles = this.confettiParticles.filter(particle => particle !== p);
        },
      });
    }
  }

  private createSettlementPanel(width: number, height: number): void {
    if (!this.add) return;

    const panelW = 760;
    const panelH = 460;
    const panelX = width / 2;
    const panelY = height / 2 - 25;

    const panel = this.add.container
      ? this.add.container(panelX, panelY)
      : new Phaser.GameObjects.Container(this, panelX, panelY);

    panel.setDepth(50);

    // 1. Panel Background Card
    if (this.add.graphics) {
      const g = this.add.graphics();
      // Drop Shadow
      g.fillStyle(0x000000, 0.45);
      g.fillRoundedRect(-panelW / 2 + 6, -panelH / 2 + 10, panelW, panelH, 20);

      // Main Panel Body
      g.fillStyle(0x1e2638, 0.96);
      g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

      // Header Top Highlight Strip
      g.fillStyle(0x2d3a56, 1.0);
      g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, 70, { tl: 20, tr: 20, bl: 0, br: 0 });

      // Gold Outer Border
      g.lineStyle(3, 0xf5a623, 1.0);
      g.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

      panel.add(g);
    }

    // 2. Victory Header Text
    if (this.add.text) {
      const title = this.add.text(0, -panelH / 2 + 35, '🎉 恭 喜 通 關！', {
        fontSize: '32px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof title.setOrigin === 'function') title.setOrigin(0.5);
      if (typeof title.setShadow === 'function') {
        title.setShadow(2, 2, 'rgba(0,0,0,0.6)', 3, true, true);
      }
      panel.add(title);

      // Station Subtitle
      const subTitle = this.add.text(
        0,
        -panelH / 2 + 88,
        `${STATIONS.find((station) => station.id === this.stationId)?.icon || '🏁'} 第 ${this.stationId} 關 —— ${this.stationName}`,
        {
          fontSize: '20px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#a0c4ff',
          fontStyle: 'bold',
          align: 'center',
        }
      );
      if (typeof subTitle.setOrigin === 'function') subTitle.setOrigin(0.5);
      panel.add(subTitle);
    }

    // 3. Interactive StarRating Display (3 Stars)
    this.starRating = new StarRating(this, {
      x: panelX,
      y: panelY - 70,
      maxStars: 3,
      initialStars: 0,
      starSize: 58,
      spacing: 24,
      soundKey: 'victory',
    });
    this.starRating.setDepth(60);

    // Animate star rating pop
    if (!this.prefersReducedMotion && this.time?.delayedCall) {
      this.time.delayedCall(300, () => {
        this.starRating?.setRating(this.starsEarned, true);
      });
    } else {
      this.starRating.setRating(this.starsEarned, false);
    }

    // Star Encouragement Text
    if (this.add.text) {
      let starComment = '⭐⭐⭐ 完美無瑕！學霸小天才！';
      let commentColor = '#ffd700';
      if (this.starsEarned === 2) {
        starComment = '⭐⭐ 表現出色！再接再厲！';
        commentColor = '#76d67c';
      } else if (this.starsEarned === 1) {
        starComment = '⭐ 順利通關！繼續加油！';
        commentColor = '#a0c4ff';
      }

      const commentText = this.add.text(0, -25, starComment, {
        fontSize: '20px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: commentColor,
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof commentText.setOrigin === 'function') commentText.setOrigin(0.5);
      panel.add(commentText);
    }

    // 4. Statistics Breakdown Grid (2x2 Stats Badges)
    this.createStatsBreakdown(panel, panelW);

    // Gentle bounce entrance for panel
    if (!this.prefersReducedMotion && this.tweens?.add) {
      panel.setScale(0.85);
      panel.setAlpha(0);
      this.tweens.add({
        targets: panel,
        scaleX: 1.0,
        scaleY: 1.0,
        alpha: 1.0,
        duration: 350,
        ease: 'Back.easeOut',
      });
    }

    this.panelContainer = panel;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(panel);
    }
  }

  private createStatsBreakdown(panel: Phaser.GameObjects.Container, panelW: number): void {
    if (!this.add) return;

    const cardsData = [
      {
        icon: '📝',
        label: '答對題數',
        val: `${this.sessionStats.correctCount} / ${this.totalQuestions} 題`,
        color: '#ffffff',
        sub: '100% 正確率',
      },
      {
        icon: '💡',
        label: '提示使用',
        val: `${this.sessionStats.hintsUsed} 次`,
        color: this.sessionStats.hintsUsed === 0 ? '#76d67c' : '#ffd166',
        sub: this.sessionStats.hintsUsed === 0 ? '未使用提示' : '獲得提示指引',
      },
      {
        icon: '❌',
        label: '失誤次數',
        val: `${this.sessionStats.mistakes} 次`,
        color: this.sessionStats.mistakes === 0 ? '#76d67c' : '#ff6b6b',
        sub: this.sessionStats.mistakes === 0 ? '零失誤通關' : '稍有失誤',
      },
      {
        icon: '🎁',
        label: '獲得獎勵',
        val: `+${this.rewardCoins} 🪙  +${this.rewardGems} 💎`,
        color: '#ffd700',
        sub: '金幣與鑽石獎勵',
      },
    ];

    const boxW = 320;
    const boxH = 68;
    const row1Y = 32;
    const row2Y = 112;
    const col1X = -panelW / 4;
    const col2X = panelW / 4;

    const positions = [
      { x: col1X, y: row1Y },
      { x: col2X, y: row1Y },
      { x: col1X, y: row2Y },
      { x: col2X, y: row2Y },
    ];

    cardsData.forEach((item, idx) => {
      const pos = positions[idx];

      if (this.add.graphics) {
        const bg = this.add.graphics();
        bg.fillStyle(0x131926, 0.85);
        bg.fillRoundedRect(pos.x - boxW / 2, pos.y - boxH / 2, boxW, boxH, 12);
        bg.lineStyle(1.5, 0x384a6c, 0.8);
        bg.strokeRoundedRect(pos.x - boxW / 2, pos.y - boxH / 2, boxW, boxH, 12);
        panel.add(bg);
      }

      if (this.add.text) {
        // Icon
        const iconTxt = this.add.text(pos.x - boxW / 2 + 28, pos.y, item.icon, {
          fontSize: '26px',
        });
        if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);
        panel.add(iconTxt);

        // Label
        const labelTxt = this.add.text(
          pos.x - boxW / 2 + 56,
          pos.y - 12,
          item.label,
          {
            fontSize: '16px',
            fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
            color: '#94a3b8',
          }
        );
        if (typeof labelTxt.setOrigin === 'function') labelTxt.setOrigin(0, 0.5);
        panel.add(labelTxt);

        // Value
        const valTxt = this.add.text(pos.x - boxW / 2 + 56, pos.y + 13, item.val, {
          fontSize: '18px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: item.color,
          fontStyle: 'bold',
        });
        if (typeof valTxt.setOrigin === 'function') valTxt.setOrigin(0, 0.5);
        panel.add(valTxt);
      }
    });

    // Total Stars In Progress Footer
    let totalStars = 0;
    try {
      totalStars = DataManager.getInstance().getTotalStars();
    } catch {
      totalStars = this.starsEarned;
    }

    if (this.add.text) {
      const totalStarsText = this.add.text(
        0,
        185,
        `🌟 累積冒險星星：${totalStars} / 30 顆  |  連續學習：${DataManager.getInstance().getProfile().stats.streakDays} 天`,
        {
          fontSize: '17px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#ffd166',
          fontStyle: 'bold',
          align: 'center',
        }
      );
      if (typeof totalStarsText.setOrigin === 'function') totalStarsText.setOrigin(0.5);
      panel.add(totalStarsText);
    }
  }

  private createActionButtons(width: number, height: number): void {
    const btnY = height - 60;
    const isNextAvailable = this.stationId < 10;

    // 1. 🔄 重新挑戰 (Retry Current Station)
    this.retryButton = new CanvasButton(this, {
      x: isNextAvailable ? width / 2 - 250 : width / 2 - 180,
      y: btnY,
      width: 170,
      height: 52,
      text: '🔄 重新挑戰',
      color: 'yellow',
      fontSize: '20px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('QuestionScene', {
            stationId: this.stationId,
            stationName: this.stationName,
            questionIndex: 0,
          });
        }
      },
    });

    // 2. 🗺️ 返回地圖 (Return to MapScene)
    this.mapButton = new CanvasButton(this, {
      x: isNextAvailable ? width / 2 - 60 : width / 2 + 180,
      y: btnY,
      width: 170,
      height: 52,
      text: '🗺️ 返回地圖',
      color: 'blue',
      fontSize: '20px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('MapScene');
        }
      },
    });

    // 3. ▶ 下一關卡 (Next Station Button if stationId < 10)
    if (isNextAvailable) {
      const nextStationId = this.stationId + 1;
      const nextStation = STATIONS.find((s) => s.id === nextStationId);
      const nextName = nextStation?.name || `第 ${nextStationId} 關`;

      this.nextStationButton = new CanvasButton(this, {
        x: width / 2 + 130,
        y: btnY,
        width: 170,
        height: 52,
        text: '▶ 下一關卡',
        color: 'green',
        fontSize: '20px',
        onClick: () => {
          SoundManager.play('click');
          if (this.scene) {
            this.scene.start('QuestionScene', {
              stationId: nextStationId,
              stationName: nextName,
              questionIndex: 0,
            });
          }
        },
      });
    }

    // 4. 🏠 返回主頁 (TitleScene Button in Top-Left)
    this.homeButton = new CanvasButton(this, {
      x: 100,
      y: 42,
      width: 140,
      height: 44,
      text: '◀ 返回主頁',
      color: 'grey',
      fontSize: '18px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });
  }

  public shutdown(): void {
    this.confettiParticles.forEach(particle => {
      this.tweens?.killTweensOf?.(particle);
      particle.destroy?.();
    });
    this.confettiParticles = [];
    if (this.panelContainer) this.tweens?.killTweensOf?.(this.panelContainer);
    this.time?.removeAllEvents?.();
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

  public showTrophyUnlockBanner(): void {
    if (this.newlyUnlockedTrophies.length === 0) return;

    const trophies = DataManager.getInstance().getTrophies();
    const unlockedDefs = trophies.filter((t) =>
      this.newlyUnlockedTrophies.includes(t.id)
    );

    if (unlockedDefs.length === 0) return;

    SoundManager.play('victory');

    const modal = new CanvasModal(this, {
      title: '🏆 恭喜解鎖全新榮譽獎盃！',
      width: 580,
      height: 380,
      theme: 'gold',
      onClose: () => {
        this.trophyModal = null;
      },
    });

    const startY = -60;
    const spacing = 65;

    unlockedDefs.slice(0, 3).forEach((trophy, idx) => {
      const y = startY + idx * spacing;

      if (this.add.text) {
        const titleTxt = this.add.text(
          0,
          y,
          `🏆 【${trophy.name}】`,
          {
            fontSize: '22px',
            fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
            color: '#ffd700',
            fontStyle: 'bold',
            align: 'center',
          }
        );
        if (typeof titleTxt.setOrigin === 'function') titleTxt.setOrigin(0.5);
        modal.addContent(titleTxt);

        const descTxt = this.add.text(
          0,
          y + 24,
          `${trophy.description}  (獎勵: +${trophy.rewardCoins || 0} 🪙 +${trophy.rewardGems || 0} 💎)`,
          {
            fontSize: '16px',
            fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
            color: '#ffffff',
            align: 'center',
          }
        );
        if (typeof descTxt.setOrigin === 'function') descTxt.setOrigin(0.5);
        modal.addContent(descTxt);
      }
    });

    this.trophyModal = modal;
    modal.show();
  }
}
