import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasModal } from '../ui/CanvasModal';

export class TitleScene extends Phaser.Scene {
  public startButton: CanvasButton | null = null;
  public shopButton: CanvasButton | null = null;
  public trophyButton: CanvasButton | null = null;
  public settingsButton: CanvasButton | null = null;
  public reportButton: CanvasButton | null = null;
  public dailyButton: CanvasButton | null = null;
  public stampButton: CanvasButton | null = null;
  public reportModal: CanvasModal | null = null;
  public dailyModal: CanvasModal | null = null;
  public stampModal: CanvasModal | null = null;

  private coinText: Phaser.GameObjects.Text | null = null;
  private gemText: Phaser.GameObjects.Text | null = null;
  private starText: Phaser.GameObjects.Text | null = null;
  public clouds: Phaser.GameObjects.GameObject[] = [];
  public airship: Phaser.GameObjects.GameObject | null = null;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    // 1. Sky & Cloudscape Background
    this.createSkyBackground(width, height);
    this.createFloatingClouds(width);
    this.createAirship(width);

    // 2. Top Currency & Status Header Bar
    this.createCurrencyBar(width);

    // 3. Title Logo & Subtitle
    this.createTitleLogo(width);

    // 4. Mascot Character
    this.createMascotCharacter();

    // 5. Navigation Buttons
    this.createNavigationButtons(width, height);
  }

  private createSkyBackground(width: number, height: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();
      // Draw atmospheric sky layers
      g.fillGradientStyle(0x3a7bd5, 0x3a7bd5, 0x86c5f7, 0xb8e2f2, 1);
      g.fillRect(0, 0, width, height);

      // Distant rolling mountain silhouette at the bottom
      g.fillStyle(0x76b885, 0.45);
      g.fillCircle(width * 0.25, height + 40, 220);
      g.fillCircle(width * 0.75, height + 60, 260);

      // Foreground lush green hill
      g.fillStyle(0x48b64e, 0.6);
      g.fillCircle(width * 0.15, height + 70, 240);
      g.fillCircle(width * 0.55, height + 90, 280);
      g.fillCircle(width * 0.9, height + 70, 250);
    } else if (this.add.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x3a7bd5);
    }
  }

  private createFloatingClouds(width: number): void {
    if (!this.add) return;

    this.clouds = [];
    const cloudConfigs = [
      { x: 150, y: 130, scale: 1.1, alpha: 0.85, speed: 18000 },
      { x: 480, y: 90, scale: 0.75, alpha: 0.7, speed: 24000 },
      { x: 820, y: 160, scale: 1.3, alpha: 0.9, speed: 15000 },
      { x: 1100, y: 110, scale: 0.85, alpha: 0.75, speed: 21000 },
      { x: 300, y: 240, scale: 0.6, alpha: 0.6, speed: 28000 },
    ];

    for (const conf of cloudConfigs) {
      let cloudObj: any = null;
      if (this.textures?.exists && (this.textures.exists('cloud_procedural') || this.textures.exists('cloud'))) {
        const texKey = this.textures.exists('cloud_procedural') ? 'cloud_procedural' : 'cloud';
        cloudObj = this.add.image(conf.x, conf.y, texKey);
      } else if (this.add.graphics) {
        // Fallback procedural graphics cloud
        const g = this.add.graphics({ x: conf.x, y: conf.y });
        g.fillStyle(0xffffff, 1.0);
        g.fillCircle(-25, 5, 20);
        g.fillCircle(0, -5, 26);
        g.fillCircle(25, 5, 20);
        g.fillRoundedRect(-35, 5, 70, 20, 10);
        cloudObj = g;
      }

      if (cloudObj) {
        if (typeof cloudObj.setScale === 'function') cloudObj.setScale(conf.scale);
        if (typeof cloudObj.setAlpha === 'function') cloudObj.setAlpha(conf.alpha);
        this.clouds.push(cloudObj);

        // Smooth continuous looping drift
        if (this.tweens?.add) {
          const remainingDistance = width + 150 - conf.x;
          const totalDistance = width + 300;
          const initialDuration = (remainingDistance / totalDistance) * conf.speed;

          this.tweens.add({
            targets: cloudObj,
            x: width + 150,
            duration: initialDuration,
            ease: 'Linear',
            onComplete: () => {
              cloudObj.x = -150;
              this.tweens.add({
                targets: cloudObj,
                x: width + 150,
                duration: conf.speed,
                ease: 'Linear',
                repeat: -1,
                onRepeat: () => {
                  cloudObj.x = -150;
                },
              });
            },
          });
        }
      }
    }
  }

  private createAirship(width: number): void {
    if (!this.add) return;

    const startX = width - 240;
    const startY = 160;

    let airshipObj: any = null;
    if (this.textures?.exists && (this.textures.exists('airship_procedural') || this.textures.exists('airship'))) {
      const texKey = this.textures.exists('airship_procedural') ? 'airship_procedural' : 'airship';
      airshipObj = this.add.image(startX, startY, texKey);
    } else if (this.add.graphics) {
      // Fallback graphics airship
      const g = this.add.graphics({ x: startX, y: startY });
      // Balloon
      g.fillStyle(0xe04343, 0.95);
      g.fillEllipse(0, 0, 110, 50);
      g.fillStyle(0xf5a623, 1.0);
      g.fillEllipse(0, 0, 110, 18);
      // Basket
      g.fillStyle(0x6b4f2c, 1.0);
      g.fillRoundedRect(-20, 26, 40, 18, 4);
      // Ropes
      g.lineStyle(1.5, 0x333333, 0.8);
      g.lineBetween(-15, 12, -10, 26);
      g.lineBetween(15, 12, 10, 26);
      airshipObj = g;
    }

    if (airshipObj) {
      this.airship = airshipObj;

      // Gentle floating bobbing tween
      if (this.tweens?.add) {
        this.tweens.add({
          targets: airshipObj,
          y: startY - 18,
          duration: 2200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        this.tweens.add({
          targets: airshipObj,
          x: startX - 25,
          duration: 3400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  private createCurrencyBar(width: number): void {
    if (!this.add) return;

    let profile: any;
    let totalStars = 0;
    try {
      const dm = DataManager.getInstance();
      profile = dm.getProfile();
      totalStars = dm.getTotalStars();
    } catch {
      profile = { coins: 0, gems: 0, stats: { streakDays: 0 } };
    }

    const barY = 36;

    // Container for Top Currency Header
    const headerContainer = this.add.container ? this.add.container(width / 2, barY) : null;

    // Background pill for header
    if (this.add.graphics && headerContainer) {
      const bg = this.add.graphics();
      bg.fillStyle(0x0e1320, 0.7);
      bg.fillRoundedRect(-380, -22, 760, 44, 22);
      bg.lineStyle(2, 0x4a90e2, 0.8);
      bg.strokeRoundedRect(-380, -22, 760, 44, 22);
      headerContainer.add(bg);
    }

    // 1. Coins Display
    if (this.add.text && headerContainer) {
      const coinLabel = this.add.text(-260, 0, `🪙 金幣: ${profile.coins}`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof coinLabel.setOrigin === 'function') coinLabel.setOrigin(0.5);
      this.coinText = coinLabel;
      headerContainer.add(coinLabel);

      // 2. Gems Display
      const gemLabel = this.add.text(-80, 0, `💎 寶石: ${profile.gems}`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#00e5ff',
        fontStyle: 'bold',
      });
      if (typeof gemLabel.setOrigin === 'function') gemLabel.setOrigin(0.5);
      this.gemText = gemLabel;
      headerContainer.add(gemLabel);

      // 3. Stars Display
      const starLabel = this.add.text(90, 0, `⭐ 星星: ${totalStars}/30`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffdd59',
        fontStyle: 'bold',
      });
      if (typeof starLabel.setOrigin === 'function') starLabel.setOrigin(0.5);
      this.starText = starLabel;
      headerContainer.add(starLabel);

      // 4. Streak Days Display
      const streakLabel = this.add.text(220, 0, `🔥 連續: ${profile.stats.streakDays} 天`, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ff6b6b',
        fontStyle: 'bold',
      });
      if (typeof streakLabel.setOrigin === 'function') streakLabel.setOrigin(0.5);
      headerContainer.add(streakLabel);

      // 5. Pet Companion Milestone Display
      const pet = DataManager.getInstance().getPetCompanion();
      const petLabel = this.add.text(325, 0, `${pet.icon} ${pet.stage === 'hatched' ? '萌寵' : '萌蛋'}: ${pet.progress}/${pet.target}`, {
        fontSize: '15px',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: '#a78bfa',
        fontStyle: 'bold',
      });
      if (typeof petLabel.setOrigin === 'function') petLabel.setOrigin(0.5);
      headerContainer.add(petLabel);
    }
  }

  private createTitleLogo(width: number): void {
    if (!this.add) return;

    const titleY = 175;
    const titleContainer = this.add.container ? this.add.container(width / 2, titleY) : null;

    // Title banner backing graphic
    if (this.add.graphics && titleContainer) {
      const banner = this.add.graphics();
      banner.fillStyle(0x1a2639, 0.85);
      banner.fillRoundedRect(-360, -50, 720, 100, 20);
      banner.lineStyle(3, 0xf5a623, 1.0);
      banner.strokeRoundedRect(-360, -50, 720, 100, 20);
      titleContainer.add(banner);
    }

    if (this.add.text && titleContainer) {
      // Main Chinese Game Title
      const mainTitle = this.add.text(0, -14, '升夢大冒險', {
        fontSize: '44px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof mainTitle.setOrigin === 'function') mainTitle.setOrigin(0.5);
      if (typeof mainTitle.setShadow === 'function') {
        mainTitle.setShadow(2, 4, 'rgba(0,0,0,0.6)', 4, true, true);
      }
      titleContainer.add(mainTitle);

      // Subtitle with Subject tags
      const subtitle = this.add.text(0, 26, '香港小一學科闖關 —— 廣東話・數學・英語', {
        fontSize: '20px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof subtitle.setOrigin === 'function') subtitle.setOrigin(0.5);
      titleContainer.add(subtitle);
    }

    // Title container breathing animation
    if (titleContainer && this.tweens?.add) {
      this.tweens.add({
        targets: titleContainer,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createMascotCharacter(): void {
    if (!this.add) return;

    const mascotX = 220;
    const mascotY = 430;

    let mascot: any = null;
    if (this.textures?.exists && (this.textures.exists('player_stand') || this.textures.exists('player_cheer1'))) {
      const tex = this.textures.exists('player_cheer1') ? 'player_cheer1' : 'player_stand';
      mascot = this.add.image(mascotX, mascotY, tex);
      if (typeof mascot.setScale === 'function') mascot.setScale(1.2);
    }

    if (mascot && this.tweens?.add) {
      this.tweens.add({
        targets: mascot,
        y: mascotY - 14,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createNavigationButtons(width: number, height: number): void {
    // 1. Primary Big Action: 開始遊戲 (Start Game) -> MapScene
    this.startButton = new CanvasButton(this, {
      x: width / 2,
      y: height / 2 + 35,
      width: 320,
      height: 74,
      text: '🚀 開始遊戲',
      color: 'green',
      fontSize: '32px',
      soundKey: 'click',
      onClick: () => {
        if (this.scene) {
          this.scene.start('MapScene');
        }
      },
    });

    // 2. Secondary Row Buttons: 成績表 | 商店 | 獎盃 | 設定
    const rowY = height / 2 + 135;
    const btnWidth = 160;
    const btnHeight = 56;

    // 成績表 (Report Card Modal)
    this.reportButton = new CanvasButton(this, {
      x: width / 2 - 270,
      y: rowY,
      width: btnWidth,
      height: btnHeight,
      text: '📊 成績表',
      color: 'blue',
      fontSize: '20px',
      soundKey: 'click',
      onClick: () => {
        this.openReportModal();
      },
    });

    // 商店 (ShopScene)
    this.shopButton = new CanvasButton(this, {
      x: width / 2 - 90,
      y: rowY,
      width: btnWidth,
      height: btnHeight,
      text: '🛒 商店',
      color: 'yellow',
      fontSize: '20px',
      soundKey: 'click',
      onClick: () => {
        if (this.scene) {
          this.scene.start('ShopScene');
        }
      },
    });

    // 獎盃 (TrophyScene)
    this.trophyButton = new CanvasButton(this, {
      x: width / 2 + 90,
      y: rowY,
      width: btnWidth,
      height: btnHeight,
      text: '🏆 獎盃',
      color: 'purple',
      fontSize: '20px',
      soundKey: 'click',
      onClick: () => {
        if (this.scene) {
          this.scene.start('TrophyScene');
        }
      },
    });

    // 設定 (SettingsScene)
    this.settingsButton = new CanvasButton(this, {
      x: width / 2 + 270,
      y: rowY,
      width: btnWidth,
      height: btnHeight,
      text: '⚙️ 設定',
      color: 'grey',
      fontSize: '20px',
      soundKey: 'click',
      onClick: () => {
        if (this.scene) {
          this.scene.start('SettingsScene');
        }
      },
    });
  }

  public openReportModal(): void {
    if (this.reportModal && this.reportModal.isOpen()) {
      return;
    }

    let profile: any;
    let totalStars = 0;
    try {
      const dm = DataManager.getInstance();
      profile = dm.getProfile();
      totalStars = dm.getTotalStars();
    } catch {
      profile = {
        coins: 0,
        gems: 0,
        unlockedStations: 1,
        stats: { chineseCorrect: 0, mathCorrect: 0, englishCorrect: 0, streakDays: 0 },
      };
    }

    const modal = new CanvasModal(this, {
      title: '📊 學習成績表',
      width: 620,
      height: 460,
      theme: 'dark',
      onClose: () => {
        this.reportModal = null;
      },
    });

    if (this.add.text) {
      const statLines = [
        `📕 粵語中文科：已答對 ${profile.stats.chineseCorrect} 題`,
        `📐 數學科運算：已答對 ${profile.stats.mathCorrect} 題`,
        `🔤 英語科單字：已答對 ${profile.stats.englishCorrect} 題`,
        `🌟 累積冒險星星：${totalStars} / 30 顆`,
        `🔥 連續學習天數：${profile.stats.streakDays} 天`,
        `🏝️ 當前解鎖關卡：第 ${profile.unlockedStations} 關 (共 10 關)`,
      ];

      const startY = -120;
      const lineSpacing = 38;

      statLines.forEach((text, i) => {
        const lineText = this.add.text(0, startY + i * lineSpacing, text, {
          fontSize: '20px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: i < 3 ? '#ffffff' : '#ffd700',
          fontStyle: i < 3 ? 'normal' : 'bold',
          align: 'center',
        });
        if (typeof lineText.setOrigin === 'function') {
          lineText.setOrigin(0.5);
        }
        modal.addContent(lineText);
      });

      // Encouraging footer text
      const cheerText = this.add.text(0, startY + statLines.length * lineSpacing + 15, '🌟 每天進步一點點，你就是最棒的小學生！', {
        fontSize: '18px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#a0c4ff',
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof cheerText.setOrigin === 'function') {
        cheerText.setOrigin(0.5);
      }
      modal.addContent(cheerText);
    }

    this.reportModal = modal;
    modal.show();
  }

  public refreshCurrencyBar(): void {
    try {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();
      const totalStars = dm.getTotalStars();

      if (this.coinText && typeof this.coinText.setText === 'function') {
        this.coinText.setText(`🪙 金幣: ${profile.coins}`);
      }
      if (this.gemText && typeof this.gemText.setText === 'function') {
        this.gemText.setText(`💎 寶石: ${profile.gems}`);
      }
      if (this.starText && typeof this.starText.setText === 'function') {
        this.starText.setText(`⭐ 星星: ${totalStars}/30`);
      }
    } catch {
      // Ignore
    }
  }

  public openDailyQuestModal(): void {
    if (this.dailyModal && this.dailyModal.isOpen()) return;

    const dm = DataManager.getInstance();
    const quest = dm.getDailyQuest();
    const totalCorrect = dm.getProfile().stats.chineseCorrect + dm.getProfile().stats.mathCorrect + dm.getProfile().stats.englishCorrect;

    const modal = new CanvasModal(this, {
      title: '🎁 每日 3 分鐘晨光任務',
      width: 640,
      height: 480,
      theme: 'gold',
      onClose: () => {
        this.dailyModal = null;
      },
    });

    if (this.add.text) {
      const intro = this.add.text(0, -110, '🌟 每天完成 3 題挑戰，養成好習慣，轉動幸運大輪盤！', {
        fontSize: '18px',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: '#ffffff',
        align: 'center',
      });
      if (typeof intro.setOrigin === 'function') intro.setOrigin(0.5);
      modal.addContent(intro);

      const statusBox = this.add.text(0, -50, quest.completed || totalCorrect >= 3 ? '✅ 今日 3 題挑戰已達成！' : `🎯 今日進度：已完成 ${Math.min(3, totalCorrect)} / 3 題`, {
        fontSize: '22px',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: quest.completed || totalCorrect >= 3 ? '#48b64e' : '#ffd700',
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof statusBox.setOrigin === 'function') statusBox.setOrigin(0.5);
      modal.addContent(statusBox);

      // Spin button or reward status
      if (quest.spinClaimed) {
        const claimed = this.add.text(0, 40, '🎉 今日幸運大輪盤獎勵已領取！明天繼續加油！', {
          fontSize: '20px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#00e5ff',
          fontStyle: 'bold',
          align: 'center',
        });
        if (typeof claimed.setOrigin === 'function') claimed.setOrigin(0.5);
        modal.addContent(claimed);
      } else {
        const spinBtn = new CanvasButton(this, {
          x: 0,
          y: 45,
          width: 280,
          height: 60,
          text: '🎰 轉動幸運大輪盤！',
          color: 'green',
          fontSize: '22px',
          soundKey: 'victory',
          onClick: () => {
            dm.claimDailySpin(50);
            this.refreshCurrencyBar();
            SoundManager.playComboCorrect(3);
            modal.close();
            this.openDailyQuestModal();
          },
        });
        modal.addContent(spinBtn);
      }
    }

    this.dailyModal = modal;
    modal.show();
  }

  public openStampBookModal(): void {
    if (this.stampModal && this.stampModal.isOpen()) return;

    const dm = DataManager.getInstance();
    const unlockedStamps = dm.getStamps();
    const profile = dm.getProfile();

    const modal = new CanvasModal(this, {
      title: '🏷️ 香港地標冒險集郵手帳',
      width: 720,
      height: 520,
      theme: 'dark',
      onClose: () => {
        this.stampModal = null;
      },
    });

    const stampList = [
      { id: 'station_1', name: '青草小木屋', icon: '🏡' },
      { id: 'station_2', name: '天星小輪碼頭', icon: '🚢' },
      { id: 'station_3', name: '香港太空館', icon: '🔭' },
      { id: 'station_4', name: '獅子山觀景台', icon: '🦁' },
      { id: 'station_5', name: '懷舊茶餐廳', icon: '🫖' },
      { id: 'station_6', name: '香港海洋公園', icon: '🐬' },
      { id: 'station_7', name: '港島叮叮車', icon: '🚋' },
      { id: 'station_8', name: '尖沙咀鐘樓', icon: '🔔' },
      { id: 'station_9', name: '奇妙童話城堡', icon: '🏰' },
      { id: 'station_10', name: '未來科技太空站', icon: '🚀' },
    ];

    if (this.add.text) {
      const subtitle = this.add.text(0, -145, `🎒 收集進度：${Math.min(10, profile.unlockedStations)} / 10 個香港地標印章`, {
        fontSize: '18px',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof subtitle.setOrigin === 'function') subtitle.setOrigin(0.5);
      modal.addContent(subtitle);

      // Render 5x2 grid of stamps
      const startX = -240;
      const startY = -80;
      const colSpacing = 120;
      const rowSpacing = 110;

      stampList.forEach((s, idx) => {
        const col = idx % 5;
        const row = Math.floor(idx / 5);
        const x = startX + col * colSpacing;
        const y = startY + row * rowSpacing;

        const isUnlocked = idx < profile.unlockedStations || unlockedStamps.includes(s.id);
        const iconText = this.add.text(x, y, isUnlocked ? s.icon : '🔒', {
          fontSize: '36px',
        });
        if (typeof iconText.setOrigin === 'function') iconText.setOrigin(0.5);
        modal.addContent(iconText);

        const nameText = this.add.text(x, y + 36, isUnlocked ? s.name : '未解鎖', {
          fontSize: '13px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: isUnlocked ? '#ffffff' : '#64748b',
          align: 'center',
        });
        if (typeof nameText.setOrigin === 'function') nameText.setOrigin(0.5);
        modal.addContent(nameText);
      });
    }

    this.stampModal = modal;
    modal.show();
  }

}
