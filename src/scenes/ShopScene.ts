import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { CanvasButton } from '../ui/CanvasButton';

export interface SkinDefinition {
  id: string;
  name: string;
  englishName: string;
  costGems: number;
  costCoins: number;
  description: string;
  perkDescription: string;
  speedBonus: number;
  jumpBonus: number;
  magnetBonus: number;
  waterGlide?: boolean;
  standSprite: string;
  walkSprites: string[];
  cheerSprite: string;
  tint?: number;
  themeColor: number;
}

export const CHARACTER_SKINS: readonly SkinDefinition[] = [
  {
    id: 'adventurer',
    name: '冒險家',
    englishName: 'Adventurer',
    costGems: 0,
    costCoins: 0,
    description: '活力充沛的探險小英雄，踏上小一升夢之旅。',
    perkDescription: '基礎跑跳能力',
    speedBonus: 0,
    jumpBonus: 0,
    magnetBonus: 100,
    standSprite: 'adventurer_stand',
    walkSprites: ['adventurer_walk1', 'adventurer_walk2'],
    cheerSprite: 'adventurer_cheer1',
    themeColor: 0x2b82c9,
  },
  {
    id: 'heroine',
    name: '女英雄',
    englishName: 'Heroine',
    costGems: 30,
    costCoins: 300,
    description: '身手矯健的勇敢女孩，彈跳與吸金兼備。',
    perkDescription: '跑速 +10% / 跳躍 +10% / 磁力 130px',
    speedBonus: 0.10,
    jumpBonus: 0.10,
    magnetBonus: 130,
    standSprite: 'female_stand',
    walkSprites: ['female_walk1', 'female_walk2'],
    cheerSprite: 'female_cheer1',
    themeColor: 0xe04343,
  },
  {
    id: 'soldier',
    name: '戰士',
    englishName: 'Soldier',
    costGems: 60,
    costCoins: 600,
    description: '訓練有素的皇家侍衛，奔跑疾如迅風。',
    perkDescription: '跑速 +15% / 跳躍 +15% / 磁力 140px',
    speedBonus: 0.15,
    jumpBonus: 0.15,
    magnetBonus: 140,
    standSprite: 'soldier_stand',
    walkSprites: ['soldier_walk1', 'soldier_walk2'],
    cheerSprite: 'soldier_cheer1',
    themeColor: 0x48b64e,
  },
  {
    id: 'knight',
    name: '騎士',
    englishName: 'Knight',
    costGems: 100,
    costCoins: 1000,
    description: '身披榮耀重甲的守護騎士，超高跳躍力。',
    perkDescription: '跑速 +10% / 跳躍 +25% / 磁力 160px',
    speedBonus: 0.10,
    jumpBonus: 0.25,
    magnetBonus: 160,
    standSprite: 'player_stand',
    walkSprites: ['player_walk1', 'player_walk2'],
    cheerSprite: 'player_cheer1',
    tint: 0xc8e6ff,
    themeColor: 0xf5a623,
  },
  {
    id: 'ninja',
    name: '忍者',
    englishName: 'Ninja',
    costGems: 150,
    costCoins: 1500,
    description: '來去無蹤的夜行刺客，擁有極限跑速與超大吸金磁場！',
    perkDescription: '跑速 +30% / 跳躍 +20% / 磁力 190px',
    speedBonus: 0.30,
    jumpBonus: 0.20,
    magnetBonus: 190,
    waterGlide: true,
    standSprite: 'player_stand',
    walkSprites: ['player_walk1', 'player_walk2'],
    cheerSprite: 'player_cheer1',
    tint: 0x4a4a5a,
    themeColor: 0x8e44ad,
  },
];

export class ShopScene extends Phaser.Scene {
  public skins: readonly SkinDefinition[] = CHARACTER_SKINS;
  public selectedSkinIndex: number = 0;

  // UI Buttons
  public backButton: CanvasButton | null = null;
  public homeButton: CanvasButton | null = null;
  public mapButton: CanvasButton | null = null;
  public actionButton: CanvasButton | null = null;
  public skinCardButtons: CanvasButton[] = [];

  // Top Bar Display Text
  public coinText: Phaser.GameObjects.Text | null = null;
  public gemText: Phaser.GameObjects.Text | null = null;
  public starText: Phaser.GameObjects.Text | null = null;

  // Preview Display Elements
  public previewContainer: Phaser.GameObjects.Container | null = null;
  public previewSprite: Phaser.GameObjects.Image | null = null;
  public previewNameText: Phaser.GameObjects.Text | null = null;
  public previewDescText: Phaser.GameObjects.Text | null = null;
  public previewPerkBadge: Phaser.GameObjects.Text | null = null;
  public previewSpeedText: Phaser.GameObjects.Text | null = null;
  public previewJumpText: Phaser.GameObjects.Text | null = null;
  public previewSpecialText: Phaser.GameObjects.Text | null = null;

  private walkAnimTimer: Phaser.Time.TimerEvent | null = null;
  private currentWalkFrame: number = 0;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    // Reset collections
    this.skinCardButtons = [];

    // Find initially equipped skin to select
    const equipped = DataManager.getInstance().getProfile().equippedSkin || 'adventurer';
    const foundIdx = this.skins.findIndex((s) => s.id === equipped);
    this.selectedSkinIndex = foundIdx !== -1 ? foundIdx : 0;

    // 1. Background
    this.createBackground(width, height);

    // 2. Top Header & Currency Bar
    this.createHeaderHUD(width);

    // 3. Left Skin Card Grid / List
    this.createSkinSelectionList(width, height);

    // 4. Right Live Character Preview Showcase
    this.createLivePreviewShowcase(width, height);

    // 5. Update Preview Content & Action Button
    this.updatePreviewDisplay();

    // 6. Bind shutdown cleanup
    if (this.events && typeof this.events.once === 'function') {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    }
  }

  private createBackground(width: number, height: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();
      // Luxurious shop gradient background
      g.fillGradientStyle(0x231a2e, 0x231a2e, 0x140e1b, 0x140e1b, 1);
      g.fillRect(0, 0, width, height);

      // Gold shimmer accent circles
      g.fillStyle(0xf5a623, 0.06);
      g.fillCircle(width * 0.75, height * 0.45, 340);
      g.fillStyle(0x8e44ad, 0.08);
      g.fillCircle(width * 0.25, height * 0.6, 280);

      // Outer border stroke
      g.lineStyle(2, 0x3e2b52, 0.8);
      g.strokeRect(0, 0, width, height);
    } else if (this.add.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x231a2e);
    }
  }

  private createHeaderHUD(width: number): void {
    if (!this.add) return;

    const barY = 38;

    // 1. ◀ 返回主頁 (TitleScene)
    this.homeButton = new CanvasButton(this, {
      x: 100,
      y: barY,
      width: 140,
      height: 44,
      text: '◀ 返回主頁',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });

    // 2. 🗺️ 前往地圖 (MapScene)
    this.mapButton = new CanvasButton(this, {
      x: 250,
      y: barY,
      width: 140,
      height: 44,
      text: '🗺️ 前往地圖',
      color: 'green',
      fontSize: '18px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('MapScene');
        }
      },
    });

    // 3. Shop Title
    if (this.add.text) {
      const title = this.add.text(width / 2 - 40, barY, '🛒 冒險島造型商店 (Hero Shop)', {
        fontSize: '24px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof title.setOrigin === 'function') title.setOrigin(0.5);
    }

    // 4. Top Currency Pill (Coins, Gems, Stars)
    let profile: any;
    let totalStars = 0;
    try {
      const dm = DataManager.getInstance();
      profile = dm.getProfile();
      totalStars = dm.getTotalStars();
    } catch {
      profile = { coins: 0, gems: 0 };
    }

    const currX = width - 190;
    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(0x0f121d, 0.85);
      g.fillRoundedRect(currX - 160, barY - 20, 320, 40, 20);
      g.lineStyle(1.5, 0x4a90e2, 0.8);
      g.strokeRoundedRect(currX - 160, barY - 20, 320, 40, 20);
    }

    if (this.add.text) {
      this.coinText = this.add.text(currX - 105, barY, `🪙 ${profile.coins}`, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof this.coinText.setOrigin === 'function') this.coinText.setOrigin(0.5);

      this.gemText = this.add.text(currX + 5, barY, `💎 ${profile.gems}`, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#00e5ff',
        fontStyle: 'bold',
      });
      if (typeof this.gemText.setOrigin === 'function') this.gemText.setOrigin(0.5);

      this.starText = this.add.text(currX + 105, barY, `⭐ ${totalStars}`, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffdd59',
        fontStyle: 'bold',
      });
      if (typeof this.starText.setOrigin === 'function') this.starText.setOrigin(0.5);
    }
  }

  public skinCardTextObjects: {
    name: Phaser.GameObjects.Text;
    perk: Phaser.GameObjects.Text;
    status: Phaser.GameObjects.Text;
  }[] = [];

  private createSkinSelectionList(_width: number, _height: number): void {
    if (!this.add) return;

    this.skinCardTextObjects = [];
    const listX = 300;
    const startY = 130;
    const spacing = 105;

    this.skins.forEach((skin, idx) => {
      const y = startY + idx * spacing;
      const isSelected = idx === this.selectedSkinIndex;

      const cardBtn = new CanvasButton(this, {
        x: listX,
        y: y + 25,
        width: 520,
        height: 90,
        color: isSelected ? 'yellow' : 'grey',
        onClick: () => {
          this.selectSkin(idx);
        },
      });

      this.skinCardButtons.push(cardBtn);
      this.populateCardDetails(skin, listX, y + 25, idx);
    });
  }

  private populateCardDetails(skin: SkinDefinition, cx: number, cy: number, idx: number): void {
    if (!this.add) return;

    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const isOwned = profile.ownedSkins.includes(skin.id);
    const isEquipped = profile.equippedSkin === skin.id;
    const isSelected = idx === this.selectedSkinIndex;

    // Mini Avatar Thumbnail
    if (this.textures?.exists && this.textures.exists(skin.standSprite)) {
      const avatar = this.add.image(cx - 210, cy, skin.standSprite);
      if (typeof avatar.setScale === 'function') avatar.setScale(0.55);
      if (skin.tint && typeof avatar.setTint === 'function') avatar.setTint(skin.tint);
    }

    if (this.add.text) {
      // Skin Name
      const nameTxt = this.add.text(cx - 155, cy - 18, `${skin.name} (${skin.englishName})`, {
        fontSize: '20px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isSelected ? '#1f1505' : '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);

      // Perk text
      const perkTxt = this.add.text(cx - 155, cy + 14, `✨ ${skin.perkDescription}`, {
        fontSize: '15px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: isSelected ? '#3d2503' : '#ffd166',
        fontStyle: isSelected ? 'bold' : 'normal',
      });
      if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);

      // Cost / Status Badge on Right
      let statusLabel = `💎 ${skin.costGems}`;
      let statusColor = isSelected ? '#03416e' : '#00e5ff';
      if (isEquipped) {
        statusLabel = '✅ 使用中';
        statusColor = isSelected ? '#065f24' : '#76d67c';
      } else if (isOwned) {
        statusLabel = '📦 已擁有';
        statusColor = isSelected ? '#1e3a8a' : '#a0c4ff';
      }

      const statusTxt = this.add.text(cx + 195, cy, statusLabel, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: statusColor,
        fontStyle: 'bold',
      });
      if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);

      this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt });
    }
  }

  private createLivePreviewShowcase(width: number, height: number): void {
    if (!this.add) return;

    const panelW = 560;
    const panelH = 550;
    const panelX = width - panelW / 2 - 40;
    const panelY = height / 2 + 35;

    const showcase = this.add.container
      ? this.add.container(panelX, panelY)
      : new Phaser.GameObjects.Container(this, panelX, panelY);

    showcase.setDepth(40);

    // 1. Pedestal Showcase Background
    if (this.add.graphics) {
      const g = this.add.graphics();
      // Drop shadow
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(-panelW / 2 + 4, -panelH / 2 + 8, panelW, panelH, 20);

      // Main body
      g.fillStyle(0x1a2133, 0.95);
      g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

      // Glistening stage circle
      g.fillStyle(0x28354f, 0.8);
      g.fillEllipse(0, -50, 280, 70);
      g.fillStyle(0x38bdf8, 0.2);
      g.fillEllipse(0, -50, 240, 50);

      // Outer gold border
      g.lineStyle(3, 0xf5a623, 1.0);
      g.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

      showcase.add(g);
    }

    // 2. Character Sprite Display
    const initSkin = this.skins[this.selectedSkinIndex];
    const initialTex =
      this.textures?.exists && this.textures.exists(initSkin.standSprite)
        ? initSkin.standSprite
        : 'player_stand';

    const sprite = this.add.image(0, -90, initialTex);
    if (typeof sprite.setOrigin === 'function') sprite.setOrigin(0.5, 0.5);
    if (typeof sprite.setScale === 'function') sprite.setScale(1.4);
    if (initSkin.tint && typeof sprite.setTint === 'function') sprite.setTint(initSkin.tint);

    this.previewSprite = sprite;
    showcase.add(sprite);

    // Live Character Bobbing Tween
    if (this.tweens?.add) {
      this.tweens.add({
        targets: sprite,
        y: -102,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Walking / Idle Frame Switcher Timer
    if (this.time?.addEvent) {
      this.walkAnimTimer = this.time.addEvent({
        delay: 350,
        loop: true,
        callback: () => {
          this.cyclePreviewAnimation();
        },
      });
    }

    // 3. Skin Name & Details Texts
    if (this.add.text) {
      this.previewNameText = this.add.text(0, 15, `${initSkin.name} (${initSkin.englishName})`, {
        fontSize: '26px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof this.previewNameText.setOrigin === 'function') this.previewNameText.setOrigin(0.5);
      showcase.add(this.previewNameText);

      this.previewDescText = this.add.text(0, 48, initSkin.description, {
        fontSize: '15px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#a0c4ff',
        align: 'center',
      });
      if (typeof this.previewDescText.setOrigin === 'function') this.previewDescText.setOrigin(0.5);
      showcase.add(this.previewDescText);

      // 4. Stats Pills Container
      this.previewSpeedText = this.add.text(
        -160,
        95,
        `🏃 跑速加成: +${Math.round(initSkin.speedBonus * 100)}%`,
        {
          fontSize: '16px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#ffffff',
          fontStyle: 'bold',
        }
      );
      if (typeof this.previewSpeedText.setOrigin === 'function') this.previewSpeedText.setOrigin(0, 0.5);
      showcase.add(this.previewSpeedText);

      this.previewJumpText = this.add.text(
        40,
        95,
        `🦘 跳躍加成: +${Math.round(initSkin.jumpBonus * 100)}%`,
        {
          fontSize: '16px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#ffffff',
          fontStyle: 'bold',
        }
      );
      if (typeof this.previewJumpText.setOrigin === 'function') this.previewJumpText.setOrigin(0, 0.5);
      showcase.add(this.previewJumpText);

      this.previewSpecialText = this.add.text(
        0,
        132,
        initSkin.waterGlide ? '🌊 特殊能力：水面輕功滑行 (不沉水)' : `✨ 專屬特技：${initSkin.perkDescription}`,
        {
          fontSize: '15px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#ffd166',
          fontStyle: 'bold',
          align: 'center',
        }
      );
      if (typeof this.previewSpecialText.setOrigin === 'function') this.previewSpecialText.setOrigin(0.5);
      showcase.add(this.previewSpecialText);
    }

    // 5. Action Button (Buy / Equip / Equipped)
    this.actionButton = new CanvasButton(this, {
      x: panelX,
      y: panelY + 205,
      width: 380,
      height: 60,
      text: '👕 換上造型',
      color: 'green',
      fontSize: '22px',
      onClick: () => {
        this.handleActionClick();
      },
    });

    this.previewContainer = showcase;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(showcase);
    }
  }

  private cyclePreviewAnimation(): void {
    if (!this.previewSprite) return;

    const currentSkin = this.skins[this.selectedSkinIndex];
    if (!currentSkin || !currentSkin.walkSprites || currentSkin.walkSprites.length === 0) return;

    this.currentWalkFrame = (this.currentWalkFrame + 1) % currentSkin.walkSprites.length;
    const targetKey = currentSkin.walkSprites[this.currentWalkFrame];

    if (this.textures?.exists && this.textures.exists(targetKey)) {
      if (typeof this.previewSprite.setTexture === 'function') {
        this.previewSprite.setTexture(targetKey);
      }
    }
  }

  public selectSkin(index: number): void {
    if (index < 0 || index >= this.skins.length) return;
    this.selectedSkinIndex = index;
    SoundManager.play('click');

    const dm = DataManager.getInstance();
    const profile = dm.getProfile();

    // Update selection highlight on cards
    this.skinCardButtons.forEach((btn, idx) => {
      const isSelected = idx === index;
      btn.setColor(isSelected ? 'yellow' : 'grey');

      const textObj = this.skinCardTextObjects[idx];
      const skin = this.skins[idx];
      if (textObj && skin) {
        const isOwned = profile.ownedSkins.includes(skin.id);
        const isEquipped = profile.equippedSkin === skin.id;

        if (typeof textObj.name.setColor === 'function') {
          textObj.name.setColor(isSelected ? '#1f1505' : '#ffffff');
        }
        if (typeof textObj.perk.setColor === 'function') {
          textObj.perk.setColor(isSelected ? '#3d2503' : '#ffd166');
        }

        let statusColor = isSelected ? '#03416e' : '#00e5ff';
        if (isEquipped) {
          statusColor = isSelected ? '#065f24' : '#76d67c';
        } else if (isOwned) {
          statusColor = isSelected ? '#1e3a8a' : '#a0c4ff';
        }
        if (typeof textObj.status.setColor === 'function') {
          textObj.status.setColor(statusColor);
        }
      }
    });

    this.updatePreviewDisplay();
  }

  public updatePreviewDisplay(): void {
    const skin = this.skins[this.selectedSkinIndex];
    if (!skin) return;

    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const isOwned = profile.ownedSkins.includes(skin.id);
    const isEquipped = profile.equippedSkin === skin.id;

    // 1. Update Sprite & Tint
    if (this.previewSprite) {
      if (this.textures?.exists && this.textures.exists(skin.standSprite)) {
        if (typeof this.previewSprite.setTexture === 'function') {
          this.previewSprite.setTexture(skin.standSprite);
        }
      }
      if (typeof this.previewSprite.clearTint === 'function') {
        this.previewSprite.clearTint();
      }
      if (skin.tint && typeof this.previewSprite.setTint === 'function') {
        this.previewSprite.setTint(skin.tint);
      }
    }

    // 2. Update Texts
    if (this.previewNameText && typeof this.previewNameText.setText === 'function') {
      this.previewNameText.setText(`${skin.name} (${skin.englishName})`);
    }

    if (this.previewDescText && typeof this.previewDescText.setText === 'function') {
      this.previewDescText.setText(skin.description);
    }

    if (this.previewSpeedText && typeof this.previewSpeedText.setText === 'function') {
      this.previewSpeedText.setText(`🏃 跑速加成: +${Math.round(skin.speedBonus * 100)}%`);
    }

    if (this.previewJumpText && typeof this.previewJumpText.setText === 'function') {
      this.previewJumpText.setText(`🦘 跳躍加成: +${Math.round(skin.jumpBonus * 100)}%`);
    }

    if (this.previewSpecialText && typeof this.previewSpecialText.setText === 'function') {
      const spec = skin.waterGlide
        ? '🌊 特殊能力：水面輕功滑行 (不沉水)'
        : `✨ 專屬特技：${skin.perkDescription}`;
      this.previewSpecialText.setText(spec);
    }

    // 3. Update Action Button
    if (this.actionButton) {
      if (isEquipped) {
        this.actionButton.setText('✅ 當前使用中');
        this.actionButton.setColor('grey');
        this.actionButton.setEnabled(false);
      } else if (isOwned) {
        this.actionButton.setText('👕 立即換裝');
        this.actionButton.setColor('blue');
        this.actionButton.setEnabled(true);
      } else {
        const canAffordGems = profile.gems >= skin.costGems;
        const canAffordCoins = profile.coins >= (skin.costCoins || 999999);
        if (canAffordGems || canAffordCoins) {
          const costText = canAffordGems ? `💎 ${skin.costGems}` : `🪙 ${skin.costCoins}`;
          this.actionButton.setText(`${costText} 購買解鎖`);
          this.actionButton.setColor('yellow');
          this.actionButton.setEnabled(true);
        } else {
          this.actionButton.setText(`💎 ${skin.costGems} 寶石不足`);
          this.actionButton.setColor('grey');
          this.actionButton.setEnabled(false);
        }
      }
    }

    // 4. Refresh Top Currency Bar
    this.refreshCurrencyHUD();
  }

  public handleActionClick(): void {
    const skin = this.skins[this.selectedSkinIndex];
    if (!skin) return;

    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const isOwned = profile.ownedSkins.includes(skin.id);

    if (isOwned) {
      // Equip Skin
      dm.equipSkin(skin.id);
      SoundManager.play('click');
      this.refreshSceneState();
    } else {
      // Purchase Skin (Support both Gems and Coins)
      let success = false;
      if (profile.gems >= skin.costGems) {
        success = dm.unlockSkin(skin.id, skin.costGems, 0);
      } else if (skin.costCoins && profile.coins >= skin.costCoins) {
        success = dm.unlockSkin(skin.id, 0, skin.costCoins);
      }

      if (success) {
        dm.equipSkin(skin.id);
        dm.checkTrophies();
        SoundManager.play('victory');
        this.refreshSceneState();
      } else {
        SoundManager.play('wrong');
      }
    }
  }

  public refreshSceneState(): void {
    // Refresh UI
    this.updatePreviewDisplay();

    // Re-render selection cards status
    if (this.scene) {
      this.scene.restart();
    }
  }

  public refreshCurrencyHUD(): void {
    try {
      const dm = DataManager.getInstance();
      const profile = dm.getProfile();
      const totalStars = dm.getTotalStars();

      if (this.coinText && typeof this.coinText.setText === 'function') {
        this.coinText.setText(`🪙 ${profile.coins}`);
      }
      if (this.gemText && typeof this.gemText.setText === 'function') {
        this.gemText.setText(`💎 ${profile.gems}`);
      }
      if (this.starText && typeof this.starText.setText === 'function') {
        this.starText.setText(`⭐ ${totalStars}`);
      }
    } catch {
      // Ignore
    }
  }

  public cleanup(): void {
    if (this.walkAnimTimer) {
      this.walkAnimTimer.remove();
      this.walkAnimTimer = null;
    }
  }
}

