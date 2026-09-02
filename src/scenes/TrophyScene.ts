import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Trophy, TrophyCategory, UserProfile } from '../types';
import { DataManager, TROPHY_DEFINITIONS } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { CanvasButton } from '../ui/CanvasButton';

export interface TrophyCategoryTab {
  key: TrophyCategory;
  name: string;
  icon: string;
}

export const TROPHY_CATEGORIES: readonly TrophyCategoryTab[] = [
  { key: 'consistency', name: '持之以恆', icon: '⭐' },
  { key: 'chinese', name: '中文名師', icon: '📕' },
  { key: 'math', name: '數學之星', icon: '📐' },
  { key: 'english', name: '英語達人', icon: '🔤' },
  { key: 'adventure', name: '冒險王者', icon: '🗺️' },
  { key: 'wealth', name: '寶藏大亨', icon: '💎' },
];

export const TROPHIES_PER_PAGE = 6;

export class TrophyScene extends Phaser.Scene {
  public selectedCategory: TrophyCategory = 'consistency';
  public currentPage: number = 0;
  public allTrophies: readonly Trophy[] = TROPHY_DEFINITIONS;

  // UI Buttons
  public homeButton: CanvasButton | null = null;
  public prevPageButton: CanvasButton | null = null;
  public nextPageButton: CanvasButton | null = null;
  public categoryTabButtons: CanvasButton[] = [];

  // Top Bar Display Text
  public totalTrophyText: Phaser.GameObjects.Text | null = null;
  public pageIndicatorText: Phaser.GameObjects.Text | null = null;
  public coinText: Phaser.GameObjects.Text | null = null;
  public gemText: Phaser.GameObjects.Text | null = null;

  // Trophy Cards Container
  public cardsContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'TrophyScene' });
  }

  create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    this.categoryTabButtons = [];

    // 1. Background
    this.createBackground(width, height);

    // 2. Top Header HUD & Total Stats
    this.createHeaderHUD(width);

    // 3. Category Tabs Bar
    this.createCategoryTabs(width);

    // 4. Trophy Cards Grid Container
    this.createTrophyCardsGrid(width, height);

    // 5. Pagination Controls
    this.createPaginationControls(width, height);

    // 6. Initial Render of Trophy Cards
    this.renderCurrentTrophyPage(width);
  }

  private createBackground(width: number, height: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();
      // Regal purple / dark navy gradient
      g.fillGradientStyle(0x1e152a, 0x1e152a, 0x0f0b17, 0x0f0b17, 1);
      g.fillRect(0, 0, width, height);

      // Gold halo glow
      g.fillStyle(0xffd700, 0.05);
      g.fillCircle(width / 2, 200, 420);
      g.fillStyle(0x9b5de5, 0.06);
      g.fillCircle(width / 2, height / 2 + 50, 360);

      // Border line
      g.lineStyle(2, 0x3d2757, 0.8);
      g.strokeRect(0, 0, width, height);
    } else if (this.add.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x1e152a);
    }
  }

  private createHeaderHUD(width: number): void {
    if (!this.add) return;

    const barY = 36;

    // 1. 返回 (TitleScene)
    this.homeButton = new CanvasButton(this, {
      x: 100,
      y: barY,
      width: 140,
      height: 44,
      text: '返回',
      icon: 'vec_icon_back_24',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });

    // 2. Title Text
    if (this.add.text) {
      const title = this.add.text(width / 2 - 80, barY, '榮譽殿堂 (Hall of Fame)', {
        fontSize: '24px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof title.setOrigin === 'function') title.setOrigin(0.5);
    }

    // 3. Unlocked Count & Top Currency
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const totalTrophies = this.allTrophies.length;
    const unlockedCount = Object.values(profile.trophies || {}).filter(Boolean).length;
    const percent = Math.round((unlockedCount / Math.max(1, totalTrophies)) * 100);

    const rightX = width - 210;

    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(0x0e111d, 0.85);
      g.fillRoundedRect(rightX - 170, barY - 20, 340, 40, 20);
      g.lineStyle(1.5, 0x9b5de5, 0.8);
      g.strokeRoundedRect(rightX - 170, barY - 20, 340, 40, 20);
    }

    if (this.add.text) {
      this.totalTrophyText = this.add.text(
        rightX - 90,
        barY,
        `🏆 ${unlockedCount}/${totalTrophies} (${percent}%)`,
        {
          fontSize: '18px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: '#ffd700',
          fontStyle: 'bold',
        }
      );
      if (typeof this.totalTrophyText.setOrigin === 'function') this.totalTrophyText.setOrigin(0.5);

      this.coinText = this.add.text(rightX + 40, barY, `🪙 ${profile.coins}`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#fbbf24',
        fontStyle: 'bold',
      });
      if (typeof this.coinText.setOrigin === 'function') this.coinText.setOrigin(0.5);

      this.gemText = this.add.text(rightX + 125, barY, `💎 ${profile.gems}`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#38bdf8',
        fontStyle: 'bold',
      });
      if (typeof this.gemText.setOrigin === 'function') this.gemText.setOrigin(0.5);
    }
  }

  private createCategoryTabs(width: number): void {
    const tabY = 92;
    const tabW = 180;
    const tabH = 46;
    const spacing = 14;
    const totalW = TROPHY_CATEGORIES.length * tabW + (TROPHY_CATEGORIES.length - 1) * spacing;
    const startX = width / 2 - totalW / 2 + tabW / 2;

    TROPHY_CATEGORIES.forEach((cat, idx) => {
      const xPos = startX + idx * (tabW + spacing);
      const isSelected = cat.key === this.selectedCategory;

      const btn = new CanvasButton(this, {
        x: xPos,
        y: tabY,
        width: tabW,
        height: tabH,
        text: `${cat.name}`,
        icon: 'vec_icon_trophy_20',
        color: isSelected ? 'yellow' : 'card_selected',
        fontSize: '16px',
        onClick: () => {
          this.switchCategory(cat.key);
        },
      });

      this.categoryTabButtons.push(btn);
    });
  }

  private createTrophyCardsGrid(_width: number, _height: number): void {
    if (!this.add) return;

    const container = this.add.container
      ? this.add.container(0, 0)
      : new Phaser.GameObjects.Container(this, 0, 0);

    container.setDepth(30);
    this.cardsContainer = container;

    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(container);
    }
  }

  public switchCategory(category: TrophyCategory): void {
    if (this.selectedCategory === category) return;
    this.selectedCategory = category;
    this.currentPage = 0;
    SoundManager.play('click');

    // Update tab highlights
    TROPHY_CATEGORIES.forEach((cat, idx) => {
      const btn = this.categoryTabButtons[idx];
      if (btn) {
        btn.setColor(cat.key === category ? 'yellow' : 'card_selected');
      }
    });

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    this.renderCurrentTrophyPage(width);
  }

  public getFilteredTrophies(): Trophy[] {
    return this.allTrophies.filter((t) => t.category === this.selectedCategory);
  }

  public renderCurrentTrophyPage(width: number): void {
    if (!this.cardsContainer) return;

    // Clear existing cards
    if (typeof this.cardsContainer.removeAll === 'function') {
      this.cardsContainer.removeAll(true);
    }

    const trophies = this.getFilteredTrophies();
    const totalPages = Math.max(1, Math.ceil(trophies.length / TROPHIES_PER_PAGE));
    if (this.currentPage >= totalPages) this.currentPage = totalPages - 1;
    if (this.currentPage < 0) this.currentPage = 0;

    const startIndex = this.currentPage * TROPHIES_PER_PAGE;
    const pageTrophies = trophies.slice(startIndex, startIndex + TROPHIES_PER_PAGE);

    const dm = DataManager.getInstance();
    const profile = dm.getProfile();

    // 2 columns x 3 rows grid
    const cardW = 560;
    const cardH = 135;
    const col1X = width / 2 - cardW / 2 - 14;
    const col2X = width / 2 + cardW / 2 + 14;
    const startY = 195;
    const rowSpacing = 150;

    pageTrophies.forEach((trophy, idx) => {
      const isCol2 = idx % 2 === 1;
      const row = Math.floor(idx / 2);
      const cardX = isCol2 ? col2X : col1X;
      const cardY = startY + row * rowSpacing;

      this.createSingleTrophyCard(trophy, cardX, cardY, cardW, cardH, profile);
    });

    this.updatePaginationUI(totalPages, trophies.length);
  }

  private createSingleTrophyCard(
    trophy: Trophy,
    x: number,
    y: number,
    w: number,
    h: number,
    profile: any
  ): void {
    if (!this.add || !this.cardsContainer) return;

    const isUnlocked = Boolean(profile.trophies && profile.trophies[trophy.id]);
    const { current, target } = this.calculateTrophyProgress(trophy, profile);
    const progressRatio = Math.min(1.0, Math.max(0, current / Math.max(1, target)));

    // 1. Background Box Graphics
    if (this.add.graphics) {
      const g = this.add.graphics();
      // Drop Shadow
      g.fillStyle(0x000000, 0.35);
      g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 6, w, h, 14);

      // Card Fill
      if (isUnlocked) {
        g.fillStyle(0x231c38, 0.95);
      } else {
        g.fillStyle(0x131622, 0.9);
      }
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);

      // Border
      if (isUnlocked) {
        g.lineStyle(2.5, 0xffd700, 1.0);
      } else {
        g.lineStyle(1.5, 0x3a4256, 0.8);
      }
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);

      // Medal background circle
      g.fillStyle(isUnlocked ? 0x3d2b63 : 0x1e2433, 1.0);
      g.fillCircle(x - w / 2 + 50, y, 34);
      g.lineStyle(1.5, isUnlocked ? 0xf5a623 : 0x4a5568, 0.9);
      g.strokeCircle(x - w / 2 + 50, y, 34);

      this.cardsContainer.add(g);
    }

    if (this.add.text) {
      // 2. Icon / Medal
      const iconEmoji = isUnlocked ? (trophy.icon || '🏆') : '🔒';
      const iconTxt = this.add.text(x - w / 2 + 50, y, iconEmoji, {
        fontSize: '32px',
      });
      if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);
      this.cardsContainer.add(iconTxt);

      // 3. Trophy Title & Reward Badge
      const titleTxt = this.add.text(x - w / 2 + 98, y - 36, trophy.name, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isUnlocked ? '#ffd700' : '#e2e8f0',
        fontStyle: 'bold',
      });
      if (typeof titleTxt.setOrigin === 'function') titleTxt.setOrigin(0, 0.5);
      this.cardsContainer.add(titleTxt);

      // Rewards Tag on Top Right
      const rewardCoins = trophy.rewardCoins || 0;
      const rewardGems = trophy.rewardGems || 0;
      const rewardLabel = `+${rewardCoins} 🪙  +${rewardGems} 💎`;
      const rewardTxt = this.add.text(x + w / 2 - 20, y - 36, rewardLabel, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isUnlocked ? '#76d67c' : '#ffd166',
        fontStyle: 'bold',
      });
      if (typeof rewardTxt.setOrigin === 'function') rewardTxt.setOrigin(1, 0.5);
      this.cardsContainer.add(rewardTxt);

      // 4. Trophy Description
      const descTxt = this.add.text(x - w / 2 + 98, y - 6, trophy.description, {
        fontSize: '16px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: isUnlocked ? '#cbd5e1' : '#94a3b8',
      });
      if (typeof descTxt.setOrigin === 'function') descTxt.setOrigin(0, 0.5);
      this.cardsContainer.add(descTxt);

      // 5. Unlocked Status Badge or Progress Bar
      if (isUnlocked) {
        const badgeTxt = this.add.text(x - w / 2 + 98, y + 26, '✅ 已獲得 (榮譽解鎖)', {
          fontSize: '16px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#76d67c',
          fontStyle: 'bold',
        });
        if (typeof badgeTxt.setOrigin === 'function') badgeTxt.setOrigin(0, 0.5);
        this.cardsContainer.add(badgeTxt);
      } else {
        // Draw progress fill bar
        const barW = 300;
        const barH = 10;
        const barStartX = x - w / 2 + 98;
        const barStartY = y + 26;

        if (this.add.graphics) {
          const barG = this.add.graphics();
          barG.fillStyle(0x1a2130, 1.0);
          barG.fillRoundedRect(barStartX, barStartY - barH / 2, barW, barH, 5);
          barG.lineStyle(1, 0x3d4b66, 0.8);
          barG.strokeRoundedRect(barStartX, barStartY - barH / 2, barW, barH, 5);

          const fillW = Math.max(4, barW * progressRatio);
          barG.fillStyle(0x38bdf8, 1.0);
          barG.fillRoundedRect(barStartX, barStartY - barH / 2, fillW, barH, 5);
          this.cardsContainer.add(barG);
        }

        const progressLabel = `${Math.min(target, current)} / ${target}`;
        const progTxt = this.add.text(barStartX + barW + 16, barStartY, progressLabel, {
          fontSize: '16px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: '#94a3b8',
          fontStyle: 'bold',
        });
        if (typeof progTxt.setOrigin === 'function') progTxt.setOrigin(0, 0.5);
        this.cardsContainer.add(progTxt);
      }
    }
  }

  public calculateTrophyProgress(trophy: Trophy, profile: UserProfile): { current: number; target: number } {
    const id = trophy.id;
    const stats = profile.stats;

    // 1. Consistency: total questions
    if (id.startsWith('total_questions_')) {
      const target = parseInt(id.replace('total_questions_', ''), 10) || 1;
      const current = stats.chineseCorrect + stats.mathCorrect + stats.englishCorrect;
      return { current, target };
    }
    if (id === 'first_question') {
      const current = stats.chineseCorrect + stats.mathCorrect + stats.englishCorrect;
      return { current, target: 1 };
    }

    // 2. Consistency: streaks
    if (id.startsWith('streak_')) {
      const target = parseInt(id.replace('streak_', '').replace('_days', ''), 10) || 1;
      return { current: stats.streakDays, target };
    }

    // 3. Consistency: tri master
    if (id.startsWith('tri_master_')) {
      const target = parseInt(id.replace('tri_master_', ''), 10) || 1;
      const current = Math.min(stats.chineseCorrect, stats.mathCorrect, stats.englishCorrect);
      return { current, target };
    }

    // 4. Subject counts
    if (id.startsWith('chinese_')) {
      const target = parseInt(id.replace('chinese_', ''), 10) || 1;
      return { current: stats.chineseCorrect, target };
    }
    if (id.startsWith('math_')) {
      const target = parseInt(id.replace('math_', ''), 10) || 1;
      return { current: stats.mathCorrect, target };
    }
    if (id.startsWith('english_')) {
      const target = parseInt(id.replace('english_', ''), 10) || 1;
      return { current: stats.englishCorrect, target };
    }

    // 5. Adventure stations / stars
    if (id.startsWith('adv_station_')) {
      const target = parseInt(id.replace('adv_station_', ''), 10) || 1;
      return { current: profile.unlockedStations, target };
    }
    if (id.startsWith('adv_stars_')) {
      const target = parseInt(id.replace('adv_stars_', ''), 10) || 1;
      const dm = DataManager.getInstance();
      return { current: dm.getTotalStars(), target };
    }

    // 6. Wealth coins / gems
    if (id.startsWith('wealth_coin_')) {
      const target = parseInt(id.replace('wealth_coin_', ''), 10) || 100;
      return { current: profile.coins, target };
    }
    if (id.startsWith('wealth_gem_')) {
      const target = parseInt(id.replace('wealth_gem_', ''), 10) || 5;
      return { current: profile.gems, target };
    }

    // Default fallback
    const isCompleted = trophy.condition(profile);
    return { current: isCompleted ? 1 : 0, target: 1 };
  }

  private createPaginationControls(width: number, height: number): void {
    const navY = height - 42;

    // 1. ◀ 上一頁 Button
    this.prevPageButton = new CanvasButton(this, {
      x: width / 2 - 190,
      y: navY,
      width: 140,
      height: 44,
      text: '◀ 上一頁',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          SoundManager.play('click');
          this.renderCurrentTrophyPage(width);
        }
      },
    });

    // 2. Page Indicator Text
    if (this.add?.text) {
      this.pageIndicatorText = this.add.text(width / 2, navY, '第 1 / 1 頁', {
        fontSize: '17px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof this.pageIndicatorText.setOrigin === 'function') {
        this.pageIndicatorText.setOrigin(0.5);
      }
    }

    // 3. 下一頁 ▶ Button
    this.nextPageButton = new CanvasButton(this, {
      x: width / 2 + 190,
      y: navY,
      width: 140,
      height: 44,
      text: '下一頁 ▶',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        const trophies = this.getFilteredTrophies();
        const totalPages = Math.max(1, Math.ceil(trophies.length / TROPHIES_PER_PAGE));
        if (this.currentPage < totalPages - 1) {
          this.currentPage++;
          SoundManager.play('click');
          this.renderCurrentTrophyPage(width);
        }
      },
    });
  }

  private updatePaginationUI(totalPages: number, totalTrophies: number): void {
    if (this.pageIndicatorText && typeof this.pageIndicatorText.setText === 'function') {
      this.pageIndicatorText.setText(
        `第 ${this.currentPage + 1} / ${totalPages} 頁 (本類別共 ${totalTrophies} 個)`
      );
    }

    if (this.prevPageButton) {
      this.prevPageButton.setEnabled(this.currentPage > 0);
    }

    if (this.nextPageButton) {
      this.nextPageButton.setEnabled(this.currentPage < totalPages - 1);
    }
  }
}

