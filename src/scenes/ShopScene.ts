import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DataManager, PET_DEFINITIONS, GADGET_DEFINITIONS } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { CanvasButton } from '../ui/CanvasButton';
import { WARDROBE_ITEMS, WardrobeItem, WardrobeCategory } from '../config/wardrobe';
import { EquippedWardrobe } from '../types';

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

export type ShopTab = 'skins' | 'wardrobe' | 'pets' | 'gadgets';

export class ShopScene extends Phaser.Scene {
  public skins: readonly SkinDefinition[] = CHARACTER_SKINS;
  public selectedSkinIndex: number = 0;

  // Tabs & Navigation State
  public currentTab: ShopTab = 'skins';
  public currentWardrobeCategory: WardrobeCategory = 'dress';
  public selectedWardrobeIndex: number = 0;
  public selectedPetIndex: number = 0;
  public selectedGadgetIndex: number = 0;
  public currentPose: 'stand' | 'walk' | 'cheer' = 'stand';

  // UI Buttons
  public backButton: CanvasButton | null = null;
  public homeButton: CanvasButton | null = null;
  public mapButton: CanvasButton | null = null;
  public actionButton: CanvasButton | null = null;
  public ootdButton: CanvasButton | null = null;
  public ttsButton: CanvasButton | null = null;
  public skinCardButtons: CanvasButton[] = [];
  public tabButtons: CanvasButton[] = [];
  public subCategoryButtons: CanvasButton[] = [];
  public poseButtons: CanvasButton[] = [];

  // Top Bar Display Text
  public coinText: Phaser.GameObjects.Text | null = null;
  public gemText: Phaser.GameObjects.Text | null = null;
  public starText: Phaser.GameObjects.Text | null = null;

  // Preview Display Elements
  public previewContainer: Phaser.GameObjects.Container | null = null;
  public previewSprite: Phaser.GameObjects.Image | null = null;
  public previewWardrobeOverlay: Phaser.GameObjects.Text | null = null;
  public previewNameText: Phaser.GameObjects.Text | null = null;
  public previewDescText: Phaser.GameObjects.Text | null = null;
  public previewPerkBadge: Phaser.GameObjects.Text | null = null;
  public previewSpeedText: Phaser.GameObjects.Text | null = null;
  public previewJumpText: Phaser.GameObjects.Text | null = null;
  public previewSpecialText: Phaser.GameObjects.Text | null = null;

  // Card Text Collections
  public skinCardTextObjects: {
    name: Phaser.GameObjects.Text;
    perk: Phaser.GameObjects.Text;
    status: Phaser.GameObjects.Text;
  }[] = [];

  // Item List Containers
  private listContainer: Phaser.GameObjects.Container | null = null;
  private ootdModal: Phaser.GameObjects.Container | null = null;

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
    this.tabButtons = [];
    this.subCategoryButtons = [];
    this.poseButtons = [];
    this.skinCardTextObjects = [];

    // Find initially equipped skin
    const equipped = DataManager.getInstance().getProfile().equippedSkin || 'adventurer';
    const foundIdx = this.skins.findIndex((s) => s.id === equipped);
    this.selectedSkinIndex = foundIdx !== -1 ? foundIdx : 0;

    // 1. Background
    this.createBackground(width, height);

    // 2. Top Header & Currency Bar
    this.createHeaderHUD(width);

    // 3. Tab Bar (Skins, Wardrobe, Pets, Gadgets)
    this.createTabBar(width);

    // 4. Right Live Character Preview Showcase (Fitting Room)
    this.createLivePreviewShowcase(width, height);

    // 5. Left Items Grid / List
    this.renderCurrentTabList(width, height);

    // 6. Update Preview Content & Action Button
    this.updatePreviewDisplay();

    // 7. Bind shutdown cleanup
    if (this.events && typeof this.events.once === 'function') {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    }
  }

  private createBackground(width: number, height: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillGradientStyle(0x231a2e, 0x231a2e, 0x140e1b, 0x140e1b, 1);
      g.fillRect(0, 0, width, height);

      // Gold shimmer accent circles
      g.fillStyle(0xf5a623, 0.06);
      g.fillCircle(width * 0.75, height * 0.45, 340);
      g.fillStyle(0x8e44ad, 0.08);
      g.fillCircle(width * 0.25, height * 0.6, 280);

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
      x: 95,
      y: barY,
      width: 130,
      height: 42,
      text: '◀ 返回主頁',
      color: 'blue',
      fontSize: '16px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });

    // 2. 🗺️ 前往地圖 (MapScene)
    this.mapButton = new CanvasButton(this, {
      x: 235,
      y: barY,
      width: 130,
      height: 42,
      text: '🗺️ 前往地圖',
      color: 'green',
      fontSize: '16px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('MapScene');
        }
      },
    });

    // 3. Shop Title
    if (this.add.text) {
      const title = this.add.text(width / 2 - 20, barY, '🛒 夢幻衣櫥與冒險商店 (Dream Wardrobe)', {
        fontSize: '22px',
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

    const currX = width - 180;
    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(0x0f121d, 0.85);
      g.fillRoundedRect(currX - 150, barY - 20, 300, 40, 20);
      g.lineStyle(1.5, 0x4a90e2, 0.8);
      g.strokeRoundedRect(currX - 150, barY - 20, 300, 40, 20);
    }

    if (this.add.text) {
      this.coinText = this.add.text(currX - 95, barY, `🪙 ${profile.coins}`, {
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

      this.starText = this.add.text(currX + 95, barY, `⭐ ${totalStars}`, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffdd59',
        fontStyle: 'bold',
      });
      if (typeof this.starText.setOrigin === 'function') this.starText.setOrigin(0.5);
    }
  }

  private createTabBar(_width: number): void {
    if (!this.add) return;

    const tabs: { key: ShopTab; label: string }[] = [
      { key: 'skins', label: '👕 角色造型' },
      { key: 'wardrobe', label: '👗 夢幻衣櫥' },
      { key: 'pets', label: '🐾 萌寵伴侶' },
      { key: 'gadgets', label: '🎒 冒險道具' },
    ];

    const startX = 100;
    const tabY = 88;
    const tabW = 125;
    const spacing = 135;

    this.tabButtons = [];
    tabs.forEach((t, idx) => {
      const btn = new CanvasButton(this, {
        x: startX + idx * spacing,
        y: tabY,
        width: tabW,
        height: 38,
        text: t.label,
        color: this.currentTab === t.key ? 'yellow' : 'grey',
        fontSize: '15px',
        onClick: () => {
          this.switchTab(t.key);
        },
      });
      this.tabButtons.push(btn);
    });
  }

  public switchTab(tab: ShopTab): void {
    if (this.currentTab === tab) return;
    this.currentTab = tab;
    SoundManager.play('click');

    // Update Tab button colors
    this.tabButtons.forEach((btn, idx) => {
      const keys: ShopTab[] = ['skins', 'wardrobe', 'pets', 'gadgets'];
      btn.setColor(keys[idx] === tab ? 'yellow' : 'grey');
    });

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  private renderCurrentTabList(width: number, height: number): void {
    if (this.listContainer) {
      this.listContainer.destroy();
      this.listContainer = null;
    }

    this.skinCardButtons = [];
    this.subCategoryButtons = [];
    this.skinCardTextObjects = [];

    this.listContainer = this.add.container ? this.add.container(0, 0) : null;

    if (this.currentTab === 'skins') {
      this.createSkinSelectionList(width, height);
    } else if (this.currentTab === 'wardrobe') {
      this.createWardrobeSelectionList(width, height);
    } else if (this.currentTab === 'pets') {
      this.createPetSelectionList(width, height);
    } else if (this.currentTab === 'gadgets') {
      this.createGadgetSelectionList(width, height);
    }
  }

  private createSkinSelectionList(_width: number, _height: number): void {
    if (!this.add) return;

    this.skinCardTextObjects = [];
    const listX = 300;
    const startY = 150;
    const spacing = 95;

    this.skins.forEach((skin, idx) => {
      const y = startY + idx * spacing;
      const isSelected = idx === this.selectedSkinIndex;

      const cardBtn = new CanvasButton(this, {
        x: listX,
        y: y + 25,
        width: 520,
        height: 84,
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
      if (typeof avatar.setScale === 'function') avatar.setScale(0.52);
      if (skin.tint && typeof avatar.setTint === 'function') avatar.setTint(skin.tint);
    }

    if (this.add.text) {
      const nameTxt = this.add.text(cx - 155, cy - 16, `${skin.name} (${skin.englishName})`, {
        fontSize: '19px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isSelected ? '#1f1505' : '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);

      const perkTxt = this.add.text(cx - 155, cy + 14, `✨ ${skin.perkDescription}`, {
        fontSize: '14px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: isSelected ? '#3d2503' : '#ffd166',
        fontStyle: isSelected ? 'bold' : 'normal',
      });
      if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);

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
        fontSize: '17px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: statusColor,
        fontStyle: 'bold',
      });
      if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);

      this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt });
    }
  }

  // --- 👗 Wardrobe Selection List ---
  private createWardrobeSelectionList(_width: number, _height: number): void {
    if (!this.add) return;

    // 1. Sub-category pills: Dresses, Tops, Bottoms, Accessories
    const subCategories: { key: WardrobeCategory; label: string }[] = [
      { key: 'dress', label: '👗 洋裝/套裝' },
      { key: 'top', label: '👕 潮流上衣' },
      { key: 'bottom', label: '👖 褲子/短裙' },
      { key: 'accessory', label: '🎀 萌趣配件' },
    ];

    const startX = 85;
    const subY = 135;
    const subW = 120;
    const spacingX = 130;

    this.subCategoryButtons = [];
    subCategories.forEach((sc) => {
      const isSelected = this.currentWardrobeCategory === sc.key;
      const btn = new CanvasButton(this, {
        x: startX + this.subCategoryButtons.length * spacingX,
        y: subY,
        width: subW,
        height: 34,
        text: sc.label,
        color: isSelected ? 'green' : 'grey',
        fontSize: '14px',
        onClick: () => {
          this.switchWardrobeCategory(sc.key);
        },
      });
      this.subCategoryButtons.push(btn);
    });

    // 2. Render items in current category
    const items = DataManager.getInstance().getWardrobeItems(this.currentWardrobeCategory);
    const listX = 300;
    const startY = 195;
    const spacingY = 88;

    items.forEach((item, idx) => {
      const y = startY + idx * spacingY;
      const isSelected = idx === this.selectedWardrobeIndex;

      const cardBtn = new CanvasButton(this, {
        x: listX,
        y: y + 25,
        width: 520,
        height: 78,
        color: isSelected ? 'yellow' : 'grey',
        onClick: () => {
          this.selectWardrobeItem(idx);
        },
      });

      this.skinCardButtons.push(cardBtn);
      this.populateWardrobeCard(item, listX, y + 25, idx);
    });
  }

  private populateWardrobeCard(item: WardrobeItem, cx: number, cy: number, idx: number): void {
    if (!this.add) return;

    const dm = DataManager.getInstance();
    const isOwned = dm.isWardrobeOwned(item.id);
    const equipped = dm.getEquippedWardrobe();
    const isEquipped = Object.values(equipped).includes(item.id);
    const isSelected = idx === this.selectedWardrobeIndex;

    if (this.add.text) {
      // Big Emoji Icon
      const iconTxt = this.add.text(cx - 210, cy, item.icon, { fontSize: '32px' });
      if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);

      // Name
      const nameTxt = this.add.text(cx - 165, cy - 14, `${item.name} (${item.nameEn})`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isSelected ? '#1f1505' : '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);

      // Perk
      const perkTxt = this.add.text(cx - 165, cy + 14, item.perkDescription, {
        fontSize: '14px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: isSelected ? '#3d2503' : '#ffd166',
      });
      if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);

      // Status label
      let statusLabel = `🪙 ${item.costCoins}`;
      let statusColor = isSelected ? '#7a4f01' : '#ffd700';
      if (isEquipped) {
        statusLabel = '✅ 已穿戴';
        statusColor = isSelected ? '#065f24' : '#76d67c';
      } else if (isOwned) {
        statusLabel = '📦 已擁有';
        statusColor = isSelected ? '#1e3a8a' : '#a0c4ff';
      }

      const statusTxt = this.add.text(cx + 195, cy, statusLabel, {
        fontSize: '17px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: statusColor,
        fontStyle: 'bold',
      });
      if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);

      this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt });
    }
  }

  public switchWardrobeCategory(cat: WardrobeCategory): void {
    if (this.currentWardrobeCategory === cat) return;
    this.currentWardrobeCategory = cat;
    this.selectedWardrobeIndex = 0;
    SoundManager.play('click');

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  public selectWardrobeItem(idx: number): void {
    this.selectedWardrobeIndex = idx;
    SoundManager.playClothSnap();

    const items = DataManager.getInstance().getWardrobeItems(this.currentWardrobeCategory);
    const item = items[idx];
    if (item) {
      this.speakItemBilingual(item);
    }

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  // --- 🐾 Pet Selection List ---
  private createPetSelectionList(_width: number, _height: number): void {
    if (!this.add) return;

    const listX = 300;
    const startY = 150;
    const spacingY = 110;

    PET_DEFINITIONS.forEach((pet, idx) => {
      const y = startY + idx * spacingY;
      const isSelected = idx === this.selectedPetIndex;

      const cardBtn = new CanvasButton(this, {
        x: listX,
        y: y + 25,
        width: 520,
        height: 96,
        color: isSelected ? 'yellow' : 'grey',
        onClick: () => {
          this.selectPet(idx);
        },
      });
      this.skinCardButtons.push(cardBtn);

      const dm = DataManager.getInstance();
      const profile = dm.getProfile();
      const isOwned = profile.ownedPets?.includes(pet.id);
      const isEquipped = profile.equippedPet === pet.id;

      if (this.add.text) {
        const iconTxt = this.add.text(listX - 210, y + 25, pet.icon, { fontSize: '38px' });
        if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);

        const nameTxt = this.add.text(listX - 160, y + 10, `${pet.name} (${pet.nameEn})`, {
          fontSize: '20px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: isSelected ? '#1f1505' : '#ffffff',
          fontStyle: 'bold',
        });
        if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);

        const perkTxt = this.add.text(listX - 160, y + 40, `🐾 ${pet.perkDescription}`, {
          fontSize: '15px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: isSelected ? '#3d2503' : '#ffd166',
        });
        if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);

        let statusLabel = `🪙 ${pet.costCoins}`;
        let statusColor = isSelected ? '#7a4f01' : '#ffd700';
        if (isEquipped) {
          statusLabel = '✅ 出戰中';
          statusColor = isSelected ? '#065f24' : '#76d67c';
        } else if (isOwned) {
          statusLabel = '📦 已擁有';
          statusColor = isSelected ? '#1e3a8a' : '#a0c4ff';
        }

        const statusTxt = this.add.text(listX + 195, y + 25, statusLabel, {
          fontSize: '18px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: statusColor,
          fontStyle: 'bold',
        });
        if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);

        this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt });
      }
    });
  }

  public selectPet(idx: number): void {
    this.selectedPetIndex = idx;
    SoundManager.play('click');
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  // --- 🎒 Gadget Selection List ---
  private createGadgetSelectionList(_width: number, _height: number): void {
    if (!this.add) return;

    const listX = 300;
    const startY = 150;
    const spacingY = 110;

    GADGET_DEFINITIONS.forEach((gadget, idx) => {
      const y = startY + idx * spacingY;
      const isSelected = idx === this.selectedGadgetIndex;

      const cardBtn = new CanvasButton(this, {
        x: listX,
        y: y + 25,
        width: 520,
        height: 96,
        color: isSelected ? 'yellow' : 'grey',
        onClick: () => {
          this.selectGadget(idx);
        },
      });
      this.skinCardButtons.push(cardBtn);

      const dm = DataManager.getInstance();
      const count = dm.getGadgetCount(gadget.id);

      if (this.add.text) {
        const iconTxt = this.add.text(listX - 210, y + 25, gadget.icon, { fontSize: '38px' });
        if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);

        const nameTxt = this.add.text(listX - 160, y + 10, `${gadget.name}`, {
          fontSize: '20px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: isSelected ? '#1f1505' : '#ffffff',
          fontStyle: 'bold',
        });
        if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);

        const perkTxt = this.add.text(listX - 160, y + 40, `🎒 ${gadget.description}`, {
          fontSize: '15px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: isSelected ? '#3d2503' : '#ffd166',
        });
        if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);

        const statusTxt = this.add.text(listX + 195, y + 25, `持有: x${count}\n🪙 ${gadget.costCoins}`, {
          fontSize: '16px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: isSelected ? '#7a4f01' : '#ffd700',
          align: 'right',
          fontStyle: 'bold',
        });
        if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);

        this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt });
      }
    });
  }

  public selectGadget(idx: number): void {
    this.selectedGadgetIndex = idx;
    SoundManager.play('click');
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  // --- 🪞 Live Fitting Room Mirror Showcase ---
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
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(-panelW / 2 + 4, -panelH / 2 + 8, panelW, panelH, 20);

      g.fillStyle(0x1a2133, 0.95);
      g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

      // Glistening stage circle
      g.fillStyle(0x28354f, 0.8);
      g.fillEllipse(0, -50, 280, 70);
      g.fillStyle(0x38bdf8, 0.2);
      g.fillEllipse(0, -50, 240, 50);

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

    // Wardrobe Layer Overlay Text (Shows equipped hats/dresses/accessories)
    if (this.add.text) {
      this.previewWardrobeOverlay = this.add.text(0, -115, '', {
        fontSize: '36px',
        align: 'center',
      });
      if (typeof this.previewWardrobeOverlay.setOrigin === 'function') {
        this.previewWardrobeOverlay.setOrigin(0.5, 0.5);
      }
      showcase.add(this.previewWardrobeOverlay);
    }

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

    // 3. Pose Switcher Buttons (Stand, Run, Cheer)
    const poseStand = new CanvasButton(this, {
      x: panelX - 140,
      y: panelY - 185,
      width: 75,
      height: 32,
      text: '🧍 站立',
      color: this.currentPose === 'stand' ? 'yellow' : 'grey',
      fontSize: '13px',
      onClick: () => this.switchPose('stand'),
    });
    const poseWalk = new CanvasButton(this, {
      x: panelX - 50,
      y: panelY - 185,
      width: 75,
      height: 32,
      text: '🏃 奔跑',
      color: this.currentPose === 'walk' ? 'yellow' : 'grey',
      fontSize: '13px',
      onClick: () => this.switchPose('walk'),
    });
    const poseCheer = new CanvasButton(this, {
      x: panelX + 40,
      y: panelY - 185,
      width: 75,
      height: 32,
      text: '🎉 歡呼',
      color: this.currentPose === 'cheer' ? 'yellow' : 'grey',
      fontSize: '13px',
      onClick: () => this.switchPose('cheer'),
    });

    // 4. OOTD Photo Button
    this.ootdButton = new CanvasButton(this, {
      x: panelX + 160,
      y: panelY - 185,
      width: 120,
      height: 32,
      text: '📸 今日穿搭',
      color: 'blue',
      fontSize: '13px',
      onClick: () => this.showOOTDPhotoModal(),
    });

    this.poseButtons = [poseStand, poseWalk, poseCheer];

    // 5. Skin / Wardrobe Name & Details Texts
    if (this.add.text) {
      this.previewNameText = this.add.text(0, 15, `${initSkin.name} (${initSkin.englishName})`, {
        fontSize: '24px',
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

      // Stats Pills
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

    // 6. Action Button (Buy / Equip / Unequip)
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
    if (typeof this.actionButton.setDepth === 'function') {
      this.actionButton.setDepth(60);
    }

    this.previewContainer = showcase;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(showcase);
    }
  }

  public switchPose(pose: 'stand' | 'walk' | 'cheer'): void {
    this.currentPose = pose;
    SoundManager.play('click');

    const poses: ('stand' | 'walk' | 'cheer')[] = ['stand', 'walk', 'cheer'];
    this.poseButtons.forEach((btn, idx) => {
      btn.setColor(poses[idx] === pose ? 'yellow' : 'grey');
    });

    this.updatePreviewDisplay();
  }

  private cyclePreviewAnimation(): void {
    if (!this.previewSprite) return;
    if (this.currentPose !== 'walk') return;

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
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();

    if (this.currentTab === 'skins') {
      this.updateSkinPreviewDisplay(profile);
    } else if (this.currentTab === 'wardrobe') {
      this.updateWardrobePreviewDisplay(dm, profile);
    } else if (this.currentTab === 'pets') {
      this.updatePetPreviewDisplay(profile);
    } else if (this.currentTab === 'gadgets') {
      this.updateGadgetPreviewDisplay(dm, profile);
    }

    this.refreshCurrencyHUD();
  }

  private updateSkinPreviewDisplay(profile: any): void {
    const skin = this.skins[this.selectedSkinIndex];
    if (!skin) return;

    const isOwned = profile.ownedSkins.includes(skin.id);
    const isEquipped = profile.equippedSkin === skin.id;

    // Sprite texture based on pose
    if (this.previewSprite) {
      let texKey = skin.standSprite;
      if (this.currentPose === 'walk') {
        texKey = skin.walkSprites[0] || skin.standSprite;
      } else if (this.currentPose === 'cheer') {
        texKey = skin.cheerSprite || skin.standSprite;
      }

      if (this.textures?.exists && this.textures.exists(texKey)) {
        if (typeof this.previewSprite.setTexture === 'function') {
          this.previewSprite.setTexture(texKey);
        }
      }
      if (typeof this.previewSprite.clearTint === 'function') {
        this.previewSprite.clearTint();
      }
      if (skin.tint && typeof this.previewSprite.setTint === 'function') {
        this.previewSprite.setTint(skin.tint);
      }
    }

    // Overlay wardrobe symbols
    this.updateWardrobeOverlay();

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

    // Action Button
    if (this.actionButton) {
      if (typeof this.actionButton.setDepth === 'function') this.actionButton.setDepth(60);
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
  }

  private updateWardrobePreviewDisplay(dm: DataManager, profile: any): void {
    const items = dm.getWardrobeItems(this.currentWardrobeCategory);
    const item = items[this.selectedWardrobeIndex];
    if (!item) return;

    const isOwned = dm.isWardrobeOwned(item.id);
    const equipped = dm.getEquippedWardrobe();
    const isEquipped = Object.values(equipped).includes(item.id);

    // Overlay wardrobe symbols
    this.updateWardrobeOverlay();

    if (this.previewNameText && typeof this.previewNameText.setText === 'function') {
      this.previewNameText.setText(`${item.icon} ${item.name} (${item.nameEn})`);
    }

    if (this.previewDescText && typeof this.previewDescText.setText === 'function') {
      this.previewDescText.setText(item.description);
    }

    if (this.previewSpeedText && typeof this.previewSpeedText.setText === 'function') {
      this.previewSpeedText.setText(`✨ 部位: ${item.category.toUpperCase()}`);
    }

    if (this.previewJumpText && typeof this.previewJumpText.setText === 'function') {
      this.previewJumpText.setText(`🪙 ${item.costCoins} / 💎 ${item.costGems}`);
    }

    if (this.previewSpecialText && typeof this.previewSpecialText.setText === 'function') {
      this.previewSpecialText.setText(`🎀 ${item.perkDescription}`);
    }

    if (this.actionButton) {
      if (typeof this.actionButton.setDepth === 'function') this.actionButton.setDepth(60);
      if (isEquipped) {
        this.actionButton.setText('❌ 脫下衣物');
        this.actionButton.setColor('red');
        this.actionButton.setEnabled(true);
      } else if (isOwned) {
        this.actionButton.setText('👗 立即換上');
        this.actionButton.setColor('green');
        this.actionButton.setEnabled(true);
      } else {
        const canAffordCoins = profile.coins >= item.costCoins;
        const canAffordGems = profile.gems >= item.costGems;
        if (canAffordCoins || canAffordGems) {
          const costTxt = canAffordCoins ? `🪙 ${item.costCoins}` : `💎 ${item.costGems}`;
          this.actionButton.setText(`${costTxt} 立即購買`);
          this.actionButton.setColor('yellow');
          this.actionButton.setEnabled(true);
        } else {
          this.actionButton.setText(`🪙 ${item.costCoins} 金幣不足`);
          this.actionButton.setColor('grey');
          this.actionButton.setEnabled(false);
        }
      }
    }
  }

  private updatePetPreviewDisplay(profile: any): void {
    const pet = PET_DEFINITIONS[this.selectedPetIndex];
    if (!pet) return;

    const isOwned = profile.ownedPets?.includes(pet.id);
    const isEquipped = profile.equippedPet === pet.id;

    if (this.previewNameText && typeof this.previewNameText.setText === 'function') {
      this.previewNameText.setText(`${pet.icon} ${pet.name} (${pet.nameEn})`);
    }

    if (this.previewDescText && typeof this.previewDescText.setText === 'function') {
      this.previewDescText.setText(pet.description);
    }

    if (this.previewSpeedText && typeof this.previewSpeedText.setText === 'function') {
      this.previewSpeedText.setText(`🧲 磁力加成: +${pet.magnetBonus}px`);
    }

    if (this.previewJumpText && typeof this.previewJumpText.setText === 'function') {
      this.previewJumpText.setText(`🪙 ${pet.costCoins} / 💎 ${pet.costGems}`);
    }

    if (this.previewSpecialText && typeof this.previewSpecialText.setText === 'function') {
      this.previewSpecialText.setText(`🐾 ${pet.perkDescription}`);
    }

    if (this.actionButton) {
      if (typeof this.actionButton.setDepth === 'function') this.actionButton.setDepth(60);
      if (isEquipped) {
        this.actionButton.setText('✅ 出戰中');
        this.actionButton.setColor('grey');
        this.actionButton.setEnabled(false);
      } else if (isOwned) {
        this.actionButton.setText('🐾 派出寵物');
        this.actionButton.setColor('green');
        this.actionButton.setEnabled(true);
      } else {
        const canAffordCoins = profile.coins >= pet.costCoins;
        const canAffordGems = profile.gems >= pet.costGems;
        if (canAffordCoins || canAffordGems) {
          const costTxt = canAffordCoins ? `🪙 ${pet.costCoins}` : `💎 ${pet.costGems}`;
          this.actionButton.setText(`${costTxt} 領養寵物`);
          this.actionButton.setColor('yellow');
          this.actionButton.setEnabled(true);
        } else {
          this.actionButton.setText(`🪙 ${pet.costCoins} 金幣不足`);
          this.actionButton.setColor('grey');
          this.actionButton.setEnabled(false);
        }
      }
    }
  }

  private updateGadgetPreviewDisplay(dm: DataManager, profile: any): void {
    const gadget = GADGET_DEFINITIONS[this.selectedGadgetIndex];
    if (!gadget) return;

    const count = dm.getGadgetCount(gadget.id);

    if (this.previewNameText && typeof this.previewNameText.setText === 'function') {
      this.previewNameText.setText(`${gadget.icon} ${gadget.name}`);
    }

    if (this.previewDescText && typeof this.previewDescText.setText === 'function') {
      this.previewDescText.setText(gadget.description);
    }

    if (this.previewSpeedText && typeof this.previewSpeedText.setText === 'function') {
      this.previewSpeedText.setText(`📦 當前庫存: x${count}`);
    }

    if (this.previewJumpText && typeof this.previewJumpText.setText === 'function') {
      this.previewJumpText.setText(`🪙 ${gadget.costCoins} / 💎 ${gadget.costGems}`);
    }

    if (this.previewSpecialText && typeof this.previewSpecialText.setText === 'function') {
      this.previewSpecialText.setText(`🎒 冒險必備輔助道具`);
    }

    if (this.actionButton) {
      if (typeof this.actionButton.setDepth === 'function') this.actionButton.setDepth(60);
      const canAffordCoins = profile.coins >= gadget.costCoins;
      const canAffordGems = profile.gems >= gadget.costGems;
      if (canAffordCoins || canAffordGems) {
        const costTxt = canAffordCoins ? `🪙 ${gadget.costCoins}` : `💎 ${gadget.costGems}`;
        this.actionButton.setText(`${costTxt} 購買 1 個`);
        this.actionButton.setColor('yellow');
        this.actionButton.setEnabled(true);
      } else {
        this.actionButton.setText(`🪙 ${gadget.costCoins} 金幣不足`);
        this.actionButton.setColor('grey');
        this.actionButton.setEnabled(false);
      }
    }
  }

  private updateWardrobeOverlay(): void {
    if (!this.previewWardrobeOverlay) return;

    const eq = DataManager.getInstance().getEquippedWardrobe();
    const icons: string[] = [];

    if (eq.hat) {
      const w = WARDROBE_ITEMS.find((item) => item.id === eq.hat);
      if (w) icons.push(w.icon);
    }
    if (eq.dress) {
      const w = WARDROBE_ITEMS.find((item) => item.id === eq.dress);
      if (w) icons.push(w.icon);
    }
    if (eq.top) {
      const w = WARDROBE_ITEMS.find((item) => item.id === eq.top);
      if (w) icons.push(w.icon);
    }
    if (eq.bottom) {
      const w = WARDROBE_ITEMS.find((item) => item.id === eq.bottom);
      if (w) icons.push(w.icon);
    }
    if (eq.wings) {
      const w = WARDROBE_ITEMS.find((item) => item.id === eq.wings);
      if (w) icons.push(w.icon);
    }

    if (typeof this.previewWardrobeOverlay.setText === 'function') {
      this.previewWardrobeOverlay.setText(icons.join(' '));
    }
  }

  public speakItemBilingual(item: WardrobeItem): void {
    try {
      SpeechService.speak(`${item.speakEn}, ${item.speakZh}`, 'zh-HK');
    } catch {
      // Safe ignore
    }
  }

  private speakCantonesePraise(): void {
    try {
      const praises = [
        '哇！條裙好靚呀！',
        '好襯你喎！',
        '真係好有型！',
        '太得意啦！',
        '好靚嘅小博士！',
      ];
      const randomPraise = praises[Math.floor(Math.random() * praises.length)];
      SpeechService.speak(randomPraise, 'zh-HK');
    } catch {
      // Safe ignore
    }
  }

  public handleActionClick(): void {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();

    if (this.currentTab === 'skins') {
      const skin = this.skins[this.selectedSkinIndex];
      if (!skin) return;

      const isOwned = profile.ownedSkins.includes(skin.id);
      if (isOwned) {
        dm.equipSkin(skin.id);
        SoundManager.play('click');
        this.refreshSceneState();
      } else {
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
    } else if (this.currentTab === 'wardrobe') {
      const items = dm.getWardrobeItems(this.currentWardrobeCategory);
      const item = items[this.selectedWardrobeIndex];
      if (!item) return;

      const isOwned = dm.isWardrobeOwned(item.id);
      const equipped = dm.getEquippedWardrobe();
      const isEquipped = Object.values(equipped).includes(item.id);

      if (isEquipped) {
        // Unequip
        const slot = Object.keys(equipped).find((k) => equipped[k as keyof EquippedWardrobe] === item.id) as keyof EquippedWardrobe;
        if (slot) dm.unequipWardrobeItem(slot);
        SoundManager.playClothSnap();
        this.refreshSceneState();
      } else if (isOwned) {
        // Equip
        let slot: keyof EquippedWardrobe = 'dress';
        if (item.category === 'top') slot = 'top';
        else if (item.category === 'bottom') slot = 'bottom';
        else if (item.category === 'accessory') {
          slot = item.id.includes('wings') ? 'wings' : 'hat';
        }

        dm.equipWardrobeItem(slot, item.id);
        SoundManager.playMagicTransform();
        this.speakCantonesePraise();
        this.refreshSceneState();
      } else {
        // Buy
        const currency = profile.coins >= item.costCoins ? 'coins' : 'gems';
        const ok = dm.buyWardrobeItem(item.id, currency);
        if (ok) {
          let slot: keyof EquippedWardrobe = 'dress';
          if (item.category === 'top') slot = 'top';
          else if (item.category === 'bottom') slot = 'bottom';
          else if (item.category === 'accessory') {
            slot = item.id.includes('wings') ? 'wings' : 'hat';
          }
          dm.equipWardrobeItem(slot, item.id);
          SoundManager.playMagicTransform();
          this.speakCantonesePraise();
          this.refreshSceneState();
        } else {
          SoundManager.play('wrong');
        }
      }
    } else if (this.currentTab === 'pets') {
      const pet = PET_DEFINITIONS[this.selectedPetIndex];
      if (!pet) return;

      const isOwned = profile.ownedPets?.includes(pet.id);
      if (isOwned) {
        dm.equipPet(pet.id);
        SoundManager.play('click');
        this.refreshSceneState();
      } else {
        const currency = profile.coins >= pet.costCoins ? 'coins' : 'gems';
        const ok = dm.buyPet(pet.id, currency);
        if (ok) {
          dm.equipPet(pet.id);
          SoundManager.play('victory');
          this.refreshSceneState();
        } else {
          SoundManager.play('wrong');
        }
      }
    } else if (this.currentTab === 'gadgets') {
      const gadget = GADGET_DEFINITIONS[this.selectedGadgetIndex];
      if (!gadget) return;

      const currency = profile.coins >= gadget.costCoins ? 'coins' : 'gems';
      const ok = dm.buyGadget(gadget.id, 1, currency);
      if (ok) {
        SoundManager.play('coin');
        this.refreshSceneState();
      } else {
        SoundManager.play('wrong');
      }
    }
  }

  // --- 📸 OOTD Photo Booth Modal (Item 10) ---
  public showOOTDPhotoModal(): void {
    if (this.ootdModal) return;

    SoundManager.playCameraSnap();
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    const modal = this.add.container
      ? this.add.container(width / 2, height / 2)
      : new Phaser.GameObjects.Container(this, width / 2, height / 2);

    modal.setDepth(200);

    // Dim Background
    if (this.add.graphics) {
      const dim = this.add.graphics();
      dim.fillStyle(0x000000, 0.75);
      dim.fillRect(-width / 2, -height / 2, width, height);
      modal.add(dim);

      // Polaroid Card Body
      const card = this.add.graphics();
      card.fillStyle(0xffffff, 1.0);
      card.fillRoundedRect(-220, -260, 440, 520, 16);
      card.lineStyle(3, 0xf5a623, 1.0);
      card.strokeRoundedRect(-220, -260, 440, 520, 16);

      // Inner Photo Area
      card.fillStyle(0x1a2133, 1.0);
      card.fillRect(-190, -230, 380, 320);

      modal.add(card);
    }

    // Polaroid Character Display
    const currentSkin = this.skins[this.selectedSkinIndex];
    const texKey = currentSkin?.standSprite || 'player_stand';
    if (this.textures?.exists && this.textures.exists(texKey)) {
      const spr = this.add.image(0, -90, texKey);
      if (typeof spr.setScale === 'function') spr.setScale(1.5);
      if (currentSkin?.tint && typeof spr.setTint === 'function') spr.setTint(currentSkin.tint);
      modal.add(spr);
    }

    if (this.add.text) {
      // Photo Header Tag
      const headerTxt = this.add.text(0, -210, '📸 升夢小達人 • 今日穿搭 (OOTD)', {
        fontSize: '17px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof headerTxt.setOrigin === 'function') headerTxt.setOrigin(0.5);
      modal.add(headerTxt);

      // Photo Footer Title & Date
      const titleTxt = this.add.text(0, 120, `🌟 ${currentSkin?.name || '小探險家'}`, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#1a2133',
        fontStyle: 'bold',
      });
      if (typeof titleTxt.setOrigin === 'function') titleTxt.setOrigin(0.5);
      modal.add(titleTxt);

      const subTxt = this.add.text(0, 155, `🎉 榮譽星數: ⭐ ${DataManager.getInstance().getTotalStars()} 顆星 | 潮流達人`, {
        fontSize: '15px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#555555',
      });
      if (typeof subTxt.setOrigin === 'function') subTxt.setOrigin(0.5);
      modal.add(subTxt);
    }

    // Close Button
    const closeBtn = new CanvasButton(this, {
      x: width / 2,
      y: height / 2 + 205,
      width: 200,
      height: 44,
      text: '❌ 關閉相片',
      color: 'blue',
      fontSize: '16px',
      onClick: () => {
        this.closeOOTDPhotoModal();
      },
    });
    if (typeof closeBtn.setDepth === 'function') closeBtn.setDepth(210);

    this.ootdModal = modal;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(modal);
    }
  }

  public closeOOTDPhotoModal(): void {
    if (this.ootdModal) {
      this.ootdModal.destroy();
      this.ootdModal = null;
      SoundManager.play('click');
    }
  }

  public refreshSceneState(): void {
    this.updatePreviewDisplay();
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
    if (this.ootdModal) {
      this.ootdModal.destroy();
      this.ootdModal = null;
    }
  }
}
