import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DataManager, PET_DEFINITIONS, GADGET_DEFINITIONS } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasModal } from '../ui/CanvasModal';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import {
  WARDROBE_ITEMS,
  WardrobeItem,
  WardrobeCategory,
  WardrobeFilter,
  getWardrobeItemsForFilter,
} from '../config/wardrobe';
import { EquippedWardrobe, PetDefinition } from '../types';
import { getWardrobeSlot as getItemWardrobeSlot, previewWardrobe, PreviewPose } from '../config/outfits';
import { CharacterPreviewController, PreviewCharacterDefinition } from '../ui/CharacterPreviewController';
import { getWardrobeLayout } from '../ui/wardrobeLayout';
import { wardrobeRegistry } from '../ui/OutfitRegistry';

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
    costCoins: 0,
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
    costCoins: 0,
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
    costCoins: 0,
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
    costCoins: 0,
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
  public currentWardrobeFilter: WardrobeFilter = 'dress';
  public selectedWardrobeIndex: number = 0;
  public selectedPetIndex: number = 0;
  public selectedGadgetIndex: number = 0;
  public currentPose: 'stand' | 'walk' | 'cheer' = 'stand';
  public prefersReducedMotion: boolean = false;

  // UI Buttons
  public backButton: CanvasButton | null = null;
  public homeButton: CanvasButton | null = null;
  public mapButton: CanvasButton | null = null;
  public actionButton: CanvasButton | null = null;
  public ootdButton: CanvasButton | null = null;
  public ootdCloseButton: CanvasButton | null = null;
  public ttsButton: CanvasButton | null = null;
  public skinCardButtons: CanvasButton[] = [];
  public tabButtons: CanvasButton[] = [];
  public subCategoryButtons: CanvasButton[] = [];
  public wardrobeFilterButtons: CanvasButton[] = [];
  public wardrobeItemButtons: CanvasButton[] = [];
  public poseButtons: CanvasButton[] = [];

  // Top Bar Display Text
  public coinText: Phaser.GameObjects.Text | null = null;
  public gemText: Phaser.GameObjects.Text | null = null;
  public starText: Phaser.GameObjects.Text | null = null;

  // Preview Display Elements
  public previewContainer: Phaser.GameObjects.Container | null = null;
  public previewSprite: Phaser.GameObjects.Image | null = null;
  public previewWardrobeOverlay: Phaser.GameObjects.Text | null = null;
  public wardrobeGraphics: Phaser.GameObjects.Graphics | null = null;
  public wardrobeHatLayer: Phaser.GameObjects.Text | null = null;
  public wardrobeGlassesLayer: Phaser.GameObjects.Text | null = null;
  public wardrobeTopLayer: Phaser.GameObjects.Text | null = null;
  public wardrobeBottomLayer: Phaser.GameObjects.Text | null = null;
  public wardrobeDressLayer: Phaser.GameObjects.Text | null = null;
  public wardrobeWingsLayer: Phaser.GameObjects.Text | null = null;
  public wardrobeBackpackLayer: Phaser.GameObjects.Text | null = null;
  public previewNameText: Phaser.GameObjects.Text | null = null;
  public previewDescText: Phaser.GameObjects.Text | null = null;
  public previewPerkBadge: Phaser.GameObjects.Text | null = null;
  public previewSpeedText: Phaser.GameObjects.Text | null = null;
  public previewJumpText: Phaser.GameObjects.Text | null = null;
  public previewSpecialText: Phaser.GameObjects.Text | null = null;
  public petPreviewLayer: Phaser.GameObjects.Container | null = null;

  // Card Text Collections
  public skinCardTextObjects: {
    name: Phaser.GameObjects.Text;
    perk: Phaser.GameObjects.Text;
    status: Phaser.GameObjects.Text;
    marker?: Phaser.GameObjects.Text;
  }[] = [];

  // Item List Containers
  private listContainer: Phaser.GameObjects.Container | null = null;
  private tabGameObjects: Phaser.GameObjects.GameObject[] = [];
  private ootdModal: Phaser.GameObjects.Container | null = null;
  private purchaseModal: CanvasModal | null = null;
  private wardrobePurchasePending = false;
  private previewController: CharacterPreviewController | null = null;
  private previewWardrobeState: EquippedWardrobe | null = null;
  private previewIsCompact = false;
  private wardrobePage = 0;
  private wardrobePageStart = 0;

  private walkAnimTimer: Phaser.Time.TimerEvent | null = null;
  private currentWalkFrame: number = 0;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(data?: {
    currentTab?: ShopTab;
    currentWardrobeCategory?: WardrobeCategory;
    currentWardrobeFilter?: WardrobeFilter;
    selectedWardrobeIndex?: number;
    selectedSkinIndex?: number;
    selectedPetIndex?: number;
    selectedGadgetIndex?: number;
    currentPose?: 'stand' | 'walk' | 'cheer';
    wardrobePage?: number;
    previewWardrobe?: EquippedWardrobe;
  }): void {
    if (data) {
      this.currentTab = data.currentTab ?? this.currentTab;
      this.currentWardrobeCategory = data.currentWardrobeCategory ?? this.currentWardrobeCategory;
      this.currentWardrobeFilter = data.currentWardrobeFilter ?? this.currentWardrobeFilter;
      this.selectedWardrobeIndex = data.selectedWardrobeIndex ?? this.selectedWardrobeIndex;
      this.selectedSkinIndex = data.selectedSkinIndex ?? this.selectedSkinIndex;
      this.selectedPetIndex = data.selectedPetIndex ?? this.selectedPetIndex;
      this.selectedGadgetIndex = data.selectedGadgetIndex ?? this.selectedGadgetIndex;
      this.currentPose = data.currentPose ?? this.currentPose;
    }
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.prefersReducedMotion = this.prefersReducedMotion || this.detectReducedMotionPreference();

    // Reset collections
    this.skinCardButtons = [];
    this.tabButtons = [];
    this.subCategoryButtons = [];
    this.wardrobeFilterButtons = [];
    this.wardrobeItemButtons = [];
    this.poseButtons = [];
    this.skinCardTextObjects = [];
    this.wardrobePage = Number.isInteger(data?.wardrobePage) && (data?.wardrobePage ?? 0) >= 0
      ? data!.wardrobePage as number
      : 0;
    this.wardrobePageStart = 0;

    // Find initially equipped skin
    const equipped = DataManager.getInstance().getProfile().equippedSkin || 'adventurer';
    const foundIdx = this.skins.findIndex((s) => s.id === equipped);
    const restoredSkinIndex = data?.selectedSkinIndex;
    const hasRestoredSkin = typeof restoredSkinIndex === 'number'
      && Number.isInteger(restoredSkinIndex)
      && restoredSkinIndex >= 0
      && restoredSkinIndex < this.skins.length;
    this.selectedSkinIndex = hasRestoredSkin
      ? restoredSkinIndex as number
      : foundIdx !== -1 ? foundIdx : 0;
    this.previewWardrobeState = data?.previewWardrobe
      ? { ...data.previewWardrobe }
      : DataManager.getInstance().getEquippedWardrobe();

    // 1. Background
    this.createBackground(width, height);

    // 2. Top Header & Currency Bar
    this.createHeaderHUD(width);

    // 3. Tab Bar (Skins, Wardrobe, Pets, Gadgets)
    this.createTabBar(width, height);

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
    if (this.scale && typeof (this.scale as any).on === 'function') {
      (this.scale as any).on(Phaser.Scale.Events.RESIZE, this.handleScaleResize, this);
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
      x: 100,
      y: barY,
      width: 145,
      height: 46,
      text: '◀ 返回主頁',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        if (this.wardrobePurchasePending) return;
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });
    this.homeButton.setDepth(60);

    // 2. 🗺️ 前往地圖 (MapScene)
    this.mapButton = new CanvasButton(this, {
      x: 255,
      y: barY,
      width: 145,
      height: 46,
      text: '🗺️ 前往地圖',
      color: 'green',
      fontSize: '18px',
      onClick: () => {
        if (this.wardrobePurchasePending) return;
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('MapScene');
        }
      },
    });
    this.mapButton.setDepth(60);

    // 3. Shop Title
    if (this.add.text) {
      const title = this.add.text(width / 2 - 20, barY, '🛒 夢幻衣櫥與冒險商店 (Dream Wardrobe)', {
        fontSize: '24px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof title.setOrigin === 'function') title.setOrigin(0.5);
      if (typeof title.setDepth === 'function') title.setDepth(55);
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

    const currX = width - 195;
    if (this.add.graphics) {
      const g = this.add.graphics();
      // Drop Shadow
      g.fillStyle(0x000000, 0.35);
      g.fillRoundedRect(currX - 175, barY - 21, 350, 46, 23);
      // Dark Blue Glass Body
      g.fillStyle(0x0f172a, 0.94);
      g.fillRoundedRect(currX - 175, barY - 23, 350, 46, 23);
      // Golden Rim Border
      g.lineStyle(2.5, 0xf59e0b, 0.9);
      g.strokeRoundedRect(currX - 175, barY - 23, 350, 46, 23);
      // Inner Light Sheen
      g.lineStyle(1.2, 0xffffff, 0.35);
      g.strokeRoundedRect(currX - 173, barY - 21, 346, 42, 21);
      if (typeof g.setDepth === 'function') g.setDepth(55);
    }

    if (this.add.text) {
      this.coinText = this.add.text(currX - 110, barY, `🪙 ${profile.coins}`, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#fde047',
        fontStyle: 'bold',
      });
      if (typeof this.coinText.setOrigin === 'function') this.coinText.setOrigin(0.5);
      if (typeof this.coinText.setDepth === 'function') this.coinText.setDepth(56);

      this.gemText = this.add.text(currX, barY, `💎 ${profile.gems}`, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#38bdf8',
        fontStyle: 'bold',
      });
      if (typeof this.gemText.setOrigin === 'function') this.gemText.setOrigin(0.5);
      if (typeof this.gemText.setDepth === 'function') this.gemText.setDepth(56);

      this.starText = this.add.text(currX + 110, barY, `⭐ ${totalStars}`, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#fbbf24',
        fontStyle: 'bold',
      });
      if (typeof this.starText.setOrigin === 'function') this.starText.setOrigin(0.5);
      if (typeof this.starText.setDepth === 'function') this.starText.setDepth(56);
    }
  }

  private createTabBar(width: number, height: number): void {
    if (!this.add) return;

    const tabs: { key: ShopTab; label: string; icon: string }[] = [
      { key: 'skins', label: '角色造型', icon: 'vec_icon_rocket_20' },
      { key: 'wardrobe', label: '夢幻衣櫥', icon: 'vec_icon_wardrobe_20' },
      { key: 'pets', label: '萌寵伴侶', icon: 'vec_icon_pet_20' },
      { key: 'gadgets', label: '冒險道具', icon: 'vec_icon_star_20' },
    ];

    const compact = this.getResponsiveWardrobeLayout(width, height).compact;
    const legacyDesktop = width >= 1200 && !compact;
    const leftPanelWidth = width * 0.4;
    const tabW = legacyDesktop ? 145 : compact ? Math.max(70, leftPanelWidth * 0.21) : Math.min(145, leftPanelWidth * 0.2);
    const spacing = legacyDesktop ? 152 : tabW + (compact ? 5 : 8);
    const startX = legacyDesktop ? 95 : Math.max(12, width * 0.015) + tabW / 2;
    const tabY = legacyDesktop ? 90 : compact ? 86 : 92;

    this.tabButtons = [];
    tabs.forEach((t, idx) => {
      const btn = new CanvasButton(this, {
        x: startX + idx * spacing,
        y: tabY,
        width: tabW,
        height: 44,
        text: t.label,
        icon: t.icon,
        color: this.currentTab === t.key ? 'yellow' : 'card_selected',
        fontSize: legacyDesktop ? '19px' : compact ? '16px' : '17px',
        scaleOnHover: 1.02,
        scaleOnDown: 0.97,
        onClick: () => {
          this.switchTab(t.key);
        },
      });
      btn.setDepth(55);
      this.tabButtons.push(btn);
    });
  }

  public switchTab(tab: ShopTab): void {
    if (this.wardrobePurchasePending) return;
    if (this.currentTab === tab) return;
    this.currentTab = tab;
    SoundManager.play('click');

    if (tab === 'wardrobe') this.previewSelectedWardrobeItem();

    // Update Tab button colors
    this.tabButtons.forEach((btn, idx) => {
      const keys: ShopTab[] = ['skins', 'wardrobe', 'pets', 'gadgets'];
      btn.setColor(keys[idx] === tab ? 'yellow' : 'card_selected');
    });

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  private renderCurrentTabList(width: number, height: number): void {
    if (this.tabGameObjects) {
      this.tabGameObjects.forEach((obj) => {
        if (obj && typeof (obj as any).destroy === 'function') {
          (obj as any).destroy();
        }
      });
      this.tabGameObjects = [];
    }

    if (this.listContainer) {
      this.listContainer.destroy();
      this.listContainer = null;
    }

    this.skinCardButtons = [];
    this.subCategoryButtons = [];
    this.wardrobeFilterButtons = [];
    this.wardrobeItemButtons = [];
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
    const spacing = 98;

    this.skins.forEach((skin, idx) => {
      const y = startY + idx * spacing;
      const isSelected = idx === this.selectedSkinIndex;

      const cardBtn = new CanvasButton(this, {
        x: listX,
        y: y + 25,
        width: 520,
        height: 88,
        color: isSelected ? 'card_selected' : 'grey',
        onClick: () => {
          this.selectSkin(idx);
        },
      });

      this.skinCardButtons.push(cardBtn);
      this.tabGameObjects.push(cardBtn);
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

    // 1. Large Portrait Box Frame (64x64)
    if (this.add.graphics) {
      const pBox = this.add.graphics();
      pBox.fillStyle(skin.tint || 0x38bdf8, isSelected ? 0.28 : 0.15);
      pBox.fillRoundedRect(cx - 232, cy - 32, 64, 64, 14);
      pBox.lineStyle(1.5, isSelected ? 0xf59e0b : 0x475569, 0.85);
      pBox.strokeRoundedRect(cx - 232, cy - 32, 64, 64, 14);
      this.tabGameObjects.push(pBox);
    }

    // Mini Avatar Thumbnail inside portrait frame
    if (this.textures?.exists && this.textures.exists(skin.standSprite)) {
      const avatar = this.add.image(cx - 200, cy, skin.standSprite);
      if (typeof avatar.setScale === 'function') avatar.setScale(0.72);
      if (skin.tint && typeof avatar.setTint === 'function') avatar.setTint(skin.tint);
      this.tabGameObjects.push(avatar);
    }

    if (this.add.text) {
      // 2. Clear Two-Line Hierarchy: Title + Subtitle
      const nameTxt = this.add.text(cx - 150, cy - 18, `${skin.name}  •  ${skin.englishName}`, {
        fontSize: '24px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);
      this.tabGameObjects.push(nameTxt);

      // 3. Structured Stat Chips Row (Clean components, no string clutter)
      const perkTxt = this.add.text(
        cx - 150,
        cy + 16,
        `🏃 +${Math.round(skin.speedBonus * 100)}%   🦘 +${Math.round(skin.jumpBonus * 100)}%   🧲 ${skin.magnetBonus || 120}px`,
        {
          fontSize: '17px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: isSelected ? '#fde047' : '#cbd5e1',
          fontStyle: 'bold',
        }
      );
      if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);
      this.tabGameObjects.push(perkTxt);

      // 4. Fixed Right-Aligned Price Tag
      let statusLabel = `💎 ${skin.costGems}`;
      let statusColor = isSelected ? '#38bdf8' : '#00e5ff';
      if (isEquipped) {
        statusLabel = '✅ 使用中';
        statusColor = isSelected ? '#86efac' : '#76d67c';
      } else if (isOwned) {
        statusLabel = '📦 已擁有';
        statusColor = isSelected ? '#93c5fd' : '#a0c4ff';
      }

      const statusTxt = this.add.text(cx + 205, cy + 14, statusLabel, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: statusColor,
        fontStyle: 'bold',
      });
      if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);
      this.tabGameObjects.push(statusTxt);

      // 5. Independent Top-Right Status Badge (Zero collision with stats!)
      const marker = this.addSelectedPreviewMarker(cx + 205, cy - 20, isSelected && !isEquipped);
      this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt, marker });
    }
  }

  private addSelectedPreviewMarker(
    x: number,
    y: number,
    visible: boolean
  ): Phaser.GameObjects.Text | undefined {
    if (!this.add.text) return undefined;

    const marker = this.add.text(x, y, '👀 預覽中', {
      fontSize: '16px',
      fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
      color: '#7a4f01',
      fontStyle: 'bold',
    });
    if (typeof marker.setOrigin === 'function') marker.setOrigin(1, 0.5);
    if (typeof marker.setDepth === 'function') marker.setDepth(61);
    if (typeof marker.setVisible === 'function') marker.setVisible(visible);
    else (marker as any).visible = visible;
    this.tabGameObjects.push(marker);
    return marker;
  }

  // --- 👗 Wardrobe Selection List ---
  private createWardrobeSelectionList(width: number, height: number): void {
    if (!this.add) return;

    const layout = this.getResponsiveWardrobeLayout(width, height);
    const filters: { key: 'all' | 'owned'; label: string }[] = [
      { key: 'all', label: '全部' },
      { key: 'owned', label: '已擁有' },
    ];
    const subCategories: { key: WardrobeCategory; label: string }[] = [
      { key: 'dress', label: '👗 洋裝' },
      { key: 'top', label: '👕 上衣' },
      { key: 'bottom', label: '👖 下身' },
      { key: 'accessory', label: '🎀 配件' },
    ];
    const buttonWidth = layout.items.width / (filters.length + subCategories.length);
    const categoryY = layout.items.y + 50;

    this.wardrobeFilterButtons = [];
    filters.forEach((filter, idx) => {
      const btn = new CanvasButton(this, {
        x: layout.items.x + buttonWidth * (idx + 0.5),
        y: categoryY,
        width: Math.max(1, buttonWidth - 4),
        height: 44,
        text: filter.label,
        color: this.currentWardrobeFilter === filter.key ? 'yellow' : 'grey',
        fontSize: layout.compact ? '16px' : '17px',
        scaleOnHover: 1.02,
        scaleOnDown: 0.97,
        onClick: () => this.switchWardrobeFilter(filter.key),
      });
      btn.setDepth(60);
      this.wardrobeFilterButtons.push(btn);
      this.tabGameObjects.push(btn);
    });

    this.subCategoryButtons = [];
    subCategories.forEach((category, idx) => {
      const btn = new CanvasButton(this, {
        x: layout.items.x + buttonWidth * (idx + filters.length + 0.5),
        y: categoryY,
        width: Math.max(1, buttonWidth - 4),
        height: 44,
        text: category.label,
        color: this.currentWardrobeFilter === category.key ? 'yellow' : 'grey',
        fontSize: layout.compact ? '16px' : '17px',
        scaleOnHover: 1.02,
        scaleOnDown: 0.97,
        onClick: () => this.switchWardrobeCategory(category.key),
      });
      btn.setDepth(60);
      this.subCategoryButtons.push(btn);
      this.tabGameObjects.push(btn);
    });

    const listTop = layout.items.y + (layout.compact ? 92 : 78);
    const denseCatalog = this.currentWardrobeFilter === 'all' || this.currentWardrobeFilter === 'owned';
    const columns = layout.compact ? 1 : denseCatalog ? 3 : 1;
    const cardGap = layout.compact ? 7 : 9;
    const cardWidth = (layout.items.width - cardGap * (columns - 1)) / columns;
    const allItems = this.getVisibleWardrobeItems();
    const pageSize = layout.compact
      ? columns * (denseCatalog ? 2 : 3)
      : Math.max(1, allItems.length);
    const pageCount = Math.max(1, Math.ceil(allItems.length / pageSize));
    this.wardrobePage = Math.min(this.wardrobePage, pageCount - 1);
    this.wardrobePageStart = this.wardrobePage * pageSize;
    const items = allItems.slice(this.wardrobePageStart, this.wardrobePageStart + pageSize);
    const showPager = layout.compact && pageCount > 1;
    const pagerPadding = showPager ? 54 : 0;
    const rows = Math.max(1, Math.ceil(items.length / columns));
    const cardHeight = Math.max(58, Math.min(denseCatalog ? (layout.compact ? 108 : 78) : (layout.compact ? 106 : 92), (layout.items.height - (listTop - layout.items.y) - pagerPadding - cardGap * (rows - 1)) / rows));

    items.forEach((item, idx) => {
      const globalIdx = this.wardrobePageStart + idx;
      const col = idx % columns;
      const row = Math.floor(idx / columns);
      const x = layout.items.x + cardWidth * (col + 0.5) + cardGap * (col - (columns - 1) / 2);
      const y = listTop + cardHeight * (row + 0.5) + cardGap * row;
      const isSelected = globalIdx === this.selectedWardrobeIndex;
      const cardBtn = new CanvasButton(this, {
        x,
        y,
        width: Math.max(1, cardWidth),
        height: cardHeight,
        color: isSelected ? 'yellow' : 'grey',
        fontSize: layout.compact ? '12px' : '14px',
        scaleOnHover: 1.015,
        scaleOnDown: 0.97,
        onClick: () => this.selectWardrobeItem(globalIdx),
      });
      cardBtn.setDepth(60);
      this.skinCardButtons.push(cardBtn);
      this.wardrobeItemButtons.push(cardBtn);
      this.tabGameObjects.push(cardBtn);
      if (isSelected && this.add.graphics) {
        const glow = this.add.graphics();
        glow.fillStyle(0xf5bd42, 0.08);
        glow.fillRoundedRect(x - cardWidth / 2 - 3, y - cardHeight / 2 - 3, cardWidth + 6, cardHeight + 6, 14);
        glow.lineStyle(2, 0xffdf70, 0.5);
        glow.strokeRoundedRect(x - cardWidth / 2 - 3, y - cardHeight / 2 - 3, cardWidth + 6, cardHeight + 6, 14);
        if (typeof glow.setDepth === 'function') glow.setDepth(59);
        this.tabGameObjects.push(glow);
      }
      this.populateWardrobeCard(item, x, y, globalIdx, cardWidth, cardHeight, layout.compact, denseCatalog);
    });

    if (showPager) {
      const pagerY = layout.items.y + layout.items.height - 26;
      const prevButton = new CanvasButton(this, {
        x: layout.items.x + 28,
        y: pagerY,
        width: 48,
        height: 44,
        text: '‹',
        color: 'blue',
        fontSize: '20px',
        disabled: this.wardrobePage === 0,
        onClick: () => {
          if (this.wardrobePurchasePending) return;
          this.wardrobePage = Math.max(0, this.wardrobePage - 1);
          this.renderCurrentTabList(width, height);
        },
      });
      const nextButton = new CanvasButton(this, {
        x: layout.items.x + layout.items.width - 28,
        y: pagerY,
        width: 48,
        height: 44,
        text: '›',
        color: 'blue',
        fontSize: '20px',
        disabled: this.wardrobePage >= pageCount - 1,
        onClick: () => {
          if (this.wardrobePurchasePending) return;
          this.wardrobePage = Math.min(pageCount - 1, this.wardrobePage + 1);
          this.renderCurrentTabList(width, height);
        },
      });
      prevButton.setDepth(60);
      nextButton.setDepth(60);
      this.tabGameObjects.push(prevButton, nextButton);
      if (this.add.text) {
        const pageLabel = this.add.text(layout.items.x + layout.items.width / 2, pagerY, `第 ${this.wardrobePage + 1} / ${pageCount} 頁`, {
          fontSize: '14px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#c8d5ff',
          fontStyle: 'bold',
        });
        if (typeof pageLabel.setOrigin === 'function') pageLabel.setOrigin(0.5);
        if (typeof pageLabel.setDepth === 'function') pageLabel.setDepth(60);
        this.tabGameObjects.push(pageLabel);
      }
    }
  }

  private populateWardrobeCard(
    item: WardrobeItem,
    cx: number,
    cy: number,
    idx: number,
    cardWidth: number = 520,
    cardHeight: number = 84,
    compact: boolean = false,
    denseCatalog: boolean = false
  ): void {
    if (!this.add) return;

    const dm = DataManager.getInstance();
    const isOwned = dm.isWardrobeOwned(item.id);
    const equipped = dm.getEquippedWardrobe();
    const isEquipped = Object.values(equipped).includes(item.id);
    const isArtworkReady = this.isWardrobePreviewReady(item);
    const isSelected = idx === this.selectedWardrobeIndex;

    if (denseCatalog) {
      const iconY = cy - cardHeight * (compact ? 0.23 : 0.22);
      const thumbnail = wardrobeRegistry.get(item.id)?.assets.thumbnail;
      const thumbnailSize = Math.min(compact ? 54 : 42, cardHeight * 0.56);
      if (thumbnail && this.textures?.exists && this.textures.exists(thumbnail) && this.add.image) {
        const thumb = this.add.image(cx, iconY, thumbnail);
        if (typeof thumb.setOrigin === 'function') thumb.setOrigin(0.5);
        if (typeof thumb.setDisplaySize === 'function') thumb.setDisplaySize(thumbnailSize, thumbnailSize);
        else if (typeof thumb.setScale === 'function') thumb.setScale(compact ? 0.42 : 0.42);
        if (typeof thumb.setDepth === 'function') thumb.setDepth(61);
        this.tabGameObjects.push(thumb);
      } else if (this.add.text) {
        const iconTxt = this.add.text(cx, iconY, item.icon, { fontSize: compact ? '38px' : '30px' });
        if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);
        if (typeof iconTxt.setDepth === 'function') iconTxt.setDepth(61);
        this.tabGameObjects.push(iconTxt);
      }

      const nameTxt = this.add.text(cx, cy + (compact ? 15 : 8), item.name, {
        fontSize: compact ? '22px' : '15px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isSelected ? '#1f1505' : '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: Math.max(40, cardWidth - 10) },
      });
      if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0.5);
      if (typeof nameTxt.setDepth === 'function') nameTxt.setDepth(61);
      this.tabGameObjects.push(nameTxt);

      // Dense catalogue cards keep the Chinese item name and one status line;
      // secondary English is intentionally omitted to prevent table-like overlap.
      const zhTxt = this.add.text(cx, cy + (compact ? 37 : 27), '', {
        fontSize: compact ? '15px' : '10px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: isSelected ? '#3d2503' : '#d9e2ff',
        align: 'center',
        wordWrap: { width: Math.max(40, cardWidth - 10) },
      });
      if (typeof zhTxt.setOrigin === 'function') zhTxt.setOrigin(0.5);
      if (typeof zhTxt.setDepth === 'function') zhTxt.setDepth(61);
      this.tabGameObjects.push(zhTxt);

      const statusLabel = !isArtworkReady
        ? '🎨 美術準備中'
        : isEquipped ? '✅ 已穿戴' : isSelected ? '👀 試穿中' : isOwned ? '📦 已擁有' : `🪙 ${item.costCoins}`;
      const statusTxt = this.add.text(cx, cy + cardHeight * 0.34, statusLabel, {
        fontSize: compact ? '18px' : '12px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: !isArtworkReady ? '#c8d5ff' : isEquipped ? '#065f24' : isSelected ? '#7a4f01' : isOwned ? '#1e3a8a' : '#ffd700',
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(0.5);
      if (typeof statusTxt.setDepth === 'function') statusTxt.setDepth(61);
      this.tabGameObjects.push(statusTxt);

      this.skinCardTextObjects.push({ name: nameTxt, perk: zhTxt, status: statusTxt });
      if (isSelected) {
        const check = this.add.text(cx + cardWidth / 2 - 10, cy - cardHeight / 2 + 11, isArtworkReady && isEquipped ? '✓' : '✦', {
          fontSize: compact ? '14px' : '17px',
          color: '#fff3c4',
          fontStyle: 'bold',
        });
        if (typeof check.setOrigin === 'function') check.setOrigin(0.5);
        if (typeof check.setDepth === 'function') check.setDepth(61);
        this.tabGameObjects.push(check);
      }
      return;
    }

    if (this.add.text) {
      const iconX = cx - cardWidth / 2 + (compact ? 48 : 40);
      const thumbnail = wardrobeRegistry.get(item.id)?.assets.thumbnail;
      if (thumbnail && this.textures?.exists && this.textures.exists(thumbnail) && this.add.image) {
        const thumb = this.add.image(iconX, cy, thumbnail);
        if (typeof thumb.setOrigin === 'function') thumb.setOrigin(0.5);
        if (typeof thumb.setDisplaySize === 'function') thumb.setDisplaySize(compact ? 68 : 72, compact ? 68 : 72);
        else if (typeof thumb.setScale === 'function') thumb.setScale(compact ? 0.52 : 0.66);
        if (typeof thumb.setDepth === 'function') thumb.setDepth(61);
        this.tabGameObjects.push(thumb);
      } else {
        // Temporary catalog art only; this is never passed to the wearing renderer.
        const iconTxt = this.add.text(iconX, cy, item.icon, { fontSize: compact ? '30px' : '42px' });
        if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);
        if (typeof iconTxt.setDepth === 'function') iconTxt.setDepth(61);
        this.tabGameObjects.push(iconTxt);
      }

      // Name
      const textX = cx - cardWidth / 2 + (compact ? 106 : denseCatalog ? 42 : 76);
      const textWidth = Math.max(40, cardWidth - (compact ? 148 : compact || denseCatalog ? 78 : 152));
      const nameTxt = this.add.text(textX, cy - (compact ? 17 : 15), denseCatalog ? item.nameEn : item.name, {
        fontSize: denseCatalog ? (compact ? '18px' : '15px') : compact ? '24px' : '26px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isSelected ? '#1f1505' : '#ffffff',
        fontStyle: 'bold',
        wordWrap: { width: textWidth },
      });
      if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);
      if (typeof nameTxt.setDepth === 'function') nameTxt.setDepth(61);
      this.tabGameObjects.push(nameTxt);

      // Perk
      const perkTxt = this.add.text(textX, cy + (compact ? 16 : 15), denseCatalog ? item.name : item.perkDescription, {
        fontSize: denseCatalog ? (compact ? '14px' : '11px') : compact ? '16px' : '17px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: isSelected ? '#3d2503' : '#d9e2ff',
        wordWrap: { width: textWidth },
      });
      if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);
      if (typeof perkTxt.setDepth === 'function') perkTxt.setDepth(61);
      this.tabGameObjects.push(perkTxt);

      // Status label
      let statusLabel = !isArtworkReady ? '🎨 美術準備中' : `🪙 ${item.costCoins}`;
      let statusColor = !isArtworkReady ? '#c8d5ff' : isSelected ? '#7a4f01' : '#ffd700';
      if (isArtworkReady && isEquipped) {
        statusLabel = '✅ 已穿戴';
        statusColor = isSelected ? '#065f24' : '#76d67c';
      } else if (isArtworkReady && isSelected) {
        statusLabel = '👀 試穿中';
        statusColor = '#7a4f01';
      } else if (isArtworkReady && isOwned) {
        statusLabel = '📦 已擁有';
        statusColor = isSelected ? '#1e3a8a' : '#a0c4ff';
      }

      const statusTxt = this.add.text(cx + cardWidth / 2 - (compact ? 12 : 12), cy + cardHeight * 0.29, statusLabel, {
        fontSize: compact ? '16px' : '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: statusColor,
        fontStyle: 'bold',
      });
      if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);
      if (typeof statusTxt.setDepth === 'function') statusTxt.setDepth(61);
      this.tabGameObjects.push(statusTxt);

      if (isSelected) {
        const check = this.add.text(cx + cardWidth / 2 - (compact ? 22 : 28), cy - cardHeight * 0.28, isArtworkReady && isEquipped ? '✓' : '✦', {
          fontSize: compact ? '15px' : '22px',
          color: '#fff3c4',
          fontStyle: 'bold',
        });
        if (typeof check.setOrigin === 'function') check.setOrigin(0.5);
        if (typeof check.setDepth === 'function') check.setDepth(61);
        this.tabGameObjects.push(check);
      }

      this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt });
    }
  }

  public switchWardrobeCategory(cat: WardrobeCategory): void {
    if (this.wardrobePurchasePending) return;
    if (this.currentWardrobeCategory === cat && this.currentWardrobeFilter === cat) return;
    this.currentWardrobeCategory = cat;
    this.currentWardrobeFilter = cat;
    this.selectedWardrobeIndex = 0;
    this.wardrobePage = 0;
    this.previewSelectedWardrobeItem();
    SoundManager.play('click');

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  public switchWardrobeFilter(filter: 'all' | 'owned'): void {
    if (this.wardrobePurchasePending) return;
    if (this.currentWardrobeFilter === filter) return;
    this.currentWardrobeFilter = filter;
    this.selectedWardrobeIndex = 0;
    this.wardrobePage = 0;
    this.previewSelectedWardrobeItem();
    SoundManager.play('click');

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.renderCurrentTabList(width, height);
    this.updatePreviewDisplay();
  }

  public selectWardrobeItem(idx: number): void {
    if (this.wardrobePurchasePending) return;
    this.selectedWardrobeIndex = idx;
    SoundManager.playClothSnap();

    const items = this.getVisibleWardrobeItems();
    const item = items[idx];
    if (item) {
      const baseWardrobe = this.previewWardrobeState ?? this.getPersistedWardrobe();
      this.previewWardrobeState = previewWardrobe(baseWardrobe, item);
      this.speakItemBilingual(item);
    }

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.renderCurrentTabList(width, height);
    this.playWardrobeSelectionFeedback();
    this.updatePreviewDisplay();
    if (item && this.previewController) this.previewController.playTryOn(this.getPreviewWardrobe());
  }

  private playWardrobeSelectionFeedback(): void {
    const button = this.wardrobeItemButtons[this.selectedWardrobeIndex - this.wardrobePageStart];
    if (!button) return;

    button.setColor('yellow');
    if (this.prefersReducedMotion) return;
    if (!this.tweens || typeof this.tweens.add !== 'function') return;
    if (typeof this.tweens.killTweensOf === 'function') this.tweens.killTweensOf(button);
    button.setScale(0.995);
    this.tweens.add({
      targets: button,
      scaleX: 1.025,
      scaleY: 1.025,
      duration: 140,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => button.setScale(1),
    });
  }

  public getPreviewWardrobe(): EquippedWardrobe {
    return { ...(this.previewWardrobeState ?? this.getPersistedWardrobe()) };
  }

  public getWardrobeSlot(item: WardrobeItem): keyof EquippedWardrobe {
    return getItemWardrobeSlot(item) as keyof EquippedWardrobe;
  }

  private getPersistedWardrobe(): EquippedWardrobe {
    return DataManager.getInstance().getEquippedWardrobe();
  }

  private getVisibleWardrobeItems(): readonly WardrobeItem[] {
    const dm = DataManager.getInstance();
    const owned = dm.getProfile().ownedWardrobe ?? [];
    return getWardrobeItemsForFilter(WARDROBE_ITEMS, this.currentWardrobeFilter, owned);
  }

  private isWardrobePreviewReady(item: WardrobeItem): boolean {
    const textureExists = this.isLiveScene() && this.textures?.exists
      ? (key: string) => this.textures.exists(key)
      : undefined;
    return wardrobeRegistry.isWearingArtworkReady(item.id, textureExists);
  }

  private getResponsiveWardrobeLayout(width: number, height: number) {
    const compactOverride = typeof window !== 'undefined'
      ? window.innerWidth < 1100 || window.innerHeight < 620
      : undefined;
    return getWardrobeLayout(width, height, compactOverride);
  }

  private handleScaleResize = (): void => {
    if (this.currentTab !== 'wardrobe' || this.wardrobePurchasePending || !this.scene?.restart) return;

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    const nextCompact = this.getResponsiveWardrobeLayout(width, height).compact;
    if (nextCompact === this.previewIsCompact) return;

    // Scale.FIT changes the canvas, but it does not rebuild scene-owned layout
    // objects. Restart only at the compact breakpoint and carry UI state over.
    this.scene.restart({
      currentTab: this.currentTab,
      currentWardrobeCategory: this.currentWardrobeCategory,
      currentWardrobeFilter: this.currentWardrobeFilter,
      selectedWardrobeIndex: this.selectedWardrobeIndex,
      selectedSkinIndex: this.selectedSkinIndex,
      selectedPetIndex: this.selectedPetIndex,
      selectedGadgetIndex: this.selectedGadgetIndex,
      currentPose: this.currentPose,
      wardrobePage: this.wardrobePage,
      previewWardrobe: this.getPreviewWardrobe(),
    });
  };

  private previewSelectedWardrobeItem(): void {
    const item = this.getVisibleWardrobeItems()[this.selectedWardrobeIndex];
    const baseWardrobe = this.previewWardrobeState ?? this.getPersistedWardrobe();
    this.previewWardrobeState = item
      ? previewWardrobe(baseWardrobe, item)
      : baseWardrobe;
  }

  private getPreviewCharacter(skin: SkinDefinition): PreviewCharacterDefinition {
    return {
      id: skin.id,
      idle: skin.standSprite,
      run: skin.walkSprites,
      cheer: skin.cheerSprite,
      tint: skin.tint,
    };
  }

  // --- 🐾 Pet Selection List ---
  private createPetSelectionList(_width: number, _height: number): void {
    if (!this.add) return;

    this.skinCardTextObjects = [];
    const listX = 300;
    const startY = 150;
    const spacingY = 114;

    PET_DEFINITIONS.forEach((pet, idx) => {
      const y = startY + idx * spacingY;
      const isSelected = idx === this.selectedPetIndex;

      const cardBtn = new CanvasButton(this, {
        x: listX,
        y: y + 25,
        width: 520,
        height: 102,
        color: isSelected ? 'card_selected' : 'grey',
        onClick: () => {
          this.selectPet(idx);
        },
      });
      this.skinCardButtons.push(cardBtn);
      this.tabGameObjects.push(cardBtn);

      const dm = DataManager.getInstance();
      const profile = dm.getProfile();
      const isOwned = profile.ownedPets?.includes(pet.id);
      const isEquipped = profile.equippedPet === pet.id;

      // 1. Dedicated Portrait Frame (64x64)
      const portraitX = listX - 200;
      const portraitY = y + 25;
      if (this.add.graphics) {
        const frame = this.add.graphics();
        frame.fillStyle(pet.tint, isSelected ? 0.28 : 0.16);
        frame.fillRoundedRect(portraitX - 32, portraitY - 32, 64, 64, 14);
        frame.lineStyle(1.5, isSelected ? 0xf59e0b : pet.tint, 0.85);
        frame.strokeRoundedRect(portraitX - 32, portraitY - 32, 64, 64, 14);
        this.tabGameObjects.push(frame);
      }

      // Portrait Image / Texture
      const portraitKey = `icon_pet_${pet.id}_portrait`;
      if (this.textures?.exists && this.textures.exists(portraitKey)) {
        const portrait = this.add.image(portraitX, portraitY, portraitKey);
        portrait.setDisplaySize(54, 54);
        portrait.setOrigin(0.5);
        this.tabGameObjects.push(portrait);
      } else if (this.add.text) {
        const iconTxt = this.add.text(portraitX, portraitY, pet.icon, { fontSize: '38px' });
        if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);
        this.tabGameObjects.push(iconTxt);
      }

      if (this.add.text) {
        // 2. Clean Typography (Chinese Title + English Subtitle)
        const cnName = pet.name.includes('(') ? pet.name.split('(')[0].trim() : pet.name;
        const nameTxt = this.add.text(listX - 150, y + 2, cnName, {
          fontSize: '24px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: '#ffffff',
          fontStyle: 'bold',
        });
        if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0);
        this.tabGameObjects.push(nameTxt);

        const enTxt = this.add.text(listX - 150, y + 27, pet.nameEn, {
          fontSize: '14px',
          fontFamily: "'Kenney Future', sans-serif",
          color: '#94a3b8',
        });
        if (typeof enTxt.setOrigin === 'function') enTxt.setOrigin(0, 0);
        this.tabGameObjects.push(enTxt);

        // 3. Scan-Friendly Perk Tag
        const perkTxt = this.add.text(listX - 150, y + 44, `🐾 ${pet.perkDescription}`, {
          fontSize: '17px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: isSelected ? '#fde047' : '#cbd5e1',
          fontStyle: 'bold',
          wordWrap: { width: 190 },
        });
        if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0);
        this.tabGameObjects.push(perkTxt);

        // 4. Fixed Right-Aligned Price Tag
        let statusLabel = `🪙 ${pet.costCoins}`;
        let statusColor = isSelected ? '#fde047' : '#ffd700';
        if (isEquipped) {
          statusLabel = '✅ 出戰中';
          statusColor = isSelected ? '#86efac' : '#76d67c';
        } else if (isOwned) {
          statusLabel = '📦 已擁有';
          statusColor = isSelected ? '#93c5fd' : '#a0c4ff';
        }

        const statusTxt = this.add.text(listX + 215, y + 48, statusLabel, {
          fontSize: '22px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: statusColor,
          fontStyle: 'bold',
        });
        if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);
        this.tabGameObjects.push(statusTxt);

        // 5. Independent Top-Right Status Badge
        const marker = this.addSelectedPreviewMarker(listX + 215, y + 4, isSelected && !isEquipped);
        this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt, marker });
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
        height: 98,
        color: isSelected ? 'yellow' : 'grey',
        onClick: () => {
          this.selectGadget(idx);
        },
      });
      this.skinCardButtons.push(cardBtn);
      this.tabGameObjects.push(cardBtn);

      const dm = DataManager.getInstance();
      const count = dm.getGadgetCount(gadget.id);

      if (this.add.text) {
        const iconTxt = this.add.text(listX - 210, y + 25, gadget.icon, { fontSize: '42px' });
        if (typeof iconTxt.setOrigin === 'function') iconTxt.setOrigin(0.5);
        this.tabGameObjects.push(iconTxt);

        const nameTxt = this.add.text(listX - 160, y + 10, `${gadget.name}`, {
          fontSize: '24px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: isSelected ? '#1f1505' : '#ffffff',
          fontStyle: 'bold',
        });
        if (typeof nameTxt.setOrigin === 'function') nameTxt.setOrigin(0, 0.5);
        this.tabGameObjects.push(nameTxt);

        const perkTxt = this.add.text(listX - 160, y + 42, `🎒 ${gadget.description}`, {
          fontSize: '17px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: isSelected ? '#3d2503' : '#ffd166',
        });
        if (typeof perkTxt.setOrigin === 'function') perkTxt.setOrigin(0, 0.5);
        this.tabGameObjects.push(perkTxt);

        const statusTxt = this.add.text(listX + 195, y + 25, `持有: x${count}\n🪙 ${gadget.costCoins}`, {
          fontSize: '20px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: isSelected ? '#7a4f01' : '#ffd700',
          align: 'right',
          fontStyle: 'bold',
        });
        if (typeof statusTxt.setOrigin === 'function') statusTxt.setOrigin(1, 0.5);
        this.tabGameObjects.push(statusTxt);

        this.skinCardTextObjects.push({ name: nameTxt, perk: perkTxt, status: statusTxt });
        if (isSelected) {
          this.addSelectedPreviewMarker(listX + 195, y - 3, true);
        }
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

    const layout = this.getResponsiveWardrobeLayout(width, height);
    const panelX = layout.preview.x + layout.preview.width / 2;
    const panelY = layout.preview.y + layout.preview.height / 2;
    const panelW = layout.preview.width;
    const panelH = layout.preview.height;
    const compact = layout.compact;
    this.previewIsCompact = compact;
    const showcase = this.add.container
      ? this.add.container(panelX, panelY)
      : new Phaser.GameObjects.Container(this, panelX, panelY);
    showcase.setDepth(40);

    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(0x080612, 0.45);
      g.fillRoundedRect(-panelW / 2 + 5, -panelH / 2 + 8, panelW, panelH, 22);
      g.fillStyle(0x131127, 0.98);
      g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 22);
      g.lineStyle(3, 0xf5bd42, 0.95);
      g.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 22);

      const stageX = layout.stage.x - panelX;
      const stageY = layout.stage.y - panelY;
      g.fillStyle(0x151b3b, 0.95);
      g.fillRoundedRect(stageX, stageY, layout.stage.width, layout.stage.height, 18);

      // Soft magical ambient gradient
      g.fillStyle(0x4338ca, 0.20);
      g.fillEllipse(stageX + layout.stage.width / 2, stageY + layout.stage.height * 0.42, layout.stage.width * 0.9, layout.stage.height * 0.85);

      // Soft Feathered Spotlight Texture (Feathered, Non-intrusive)
      if (this.textures?.exists && this.textures.exists('tex_feathered_spotlight')) {
        const spot = this.add.image(stageX + layout.stage.width / 2, stageY + layout.stage.height * 0.38, 'tex_feathered_spotlight');
        spot.setDisplaySize(layout.stage.width * 0.88, layout.stage.height * 0.82);
        spot.setAlpha(0.65);
        showcase.add(spot);
      }

      // Golden inner border
      g.lineStyle(1.5, 0x818cf8, 0.35);
      g.strokeRoundedRect(stageX + 7, stageY + 7, Math.max(1, layout.stage.width - 14), Math.max(1, layout.stage.height - 14), 14);

      // 3D Stepped Pedestal Base & Glowing Disc (Proportional Hero Platform)
      const pedestalCenterY = stageY + layout.stage.height * 0.72;
      const pedestalWidth = Math.min(300, layout.stage.width * 0.48);

      // Soft Floor Light Pool Texture
      if (this.textures?.exists && this.textures.exists('tex_floor_glow')) {
        const floorGlow = this.add.image(stageX + layout.stage.width / 2, pedestalCenterY, 'tex_floor_glow');
        floorGlow.setDisplaySize(pedestalWidth * 1.35, 54);
        floorGlow.setAlpha(0.65);
        showcase.add(floorGlow);
      }

      // Cyan / Gold Ambient Under-Glow
      g.fillStyle(0x38bdf8, 0.16);
      g.fillEllipse(stageX + layout.stage.width / 2, pedestalCenterY + 4, pedestalWidth * 1.15, compact ? 24 : 32);

      // 3D Stepped Pedestal Base Shadow
      g.fillStyle(0x020617, 0.85);
      g.fillEllipse(stageX + layout.stage.width / 2, pedestalCenterY + 8, pedestalWidth * 1.05, compact ? 20 : 28);

      // Stepped Brass Rim Step
      g.fillStyle(0xb45309, 0.95);
      g.fillEllipse(stageX + layout.stage.width / 2, pedestalCenterY + 5, pedestalWidth * 0.96, compact ? 18 : 24);
      g.fillStyle(0xf59e0b, 0.95);
      g.fillEllipse(stageX + layout.stage.width / 2, pedestalCenterY + 2, pedestalWidth * 0.94, compact ? 17 : 22);

      // Top Royal Velvet Platform Disc
      g.fillStyle(0x1e1b4b, 0.98);
      g.fillEllipse(stageX + layout.stage.width / 2, pedestalCenterY, pedestalWidth * 0.88, compact ? 15 : 20);

      // Pedestal golden glowing ring
      g.lineStyle(2.2, 0xfde047, 0.85);
      if (typeof (g as any).strokeEllipse === 'function') {
        (g as any).strokeEllipse(stageX + layout.stage.width / 2, pedestalCenterY, pedestalWidth * 0.86, compact ? 14 : 19);
      } else {
        g.strokeRoundedRect(stageX + layout.stage.width / 2 - (pedestalWidth * 0.43), pedestalCenterY - (compact ? 7 : 10), pedestalWidth * 0.86, compact ? 14 : 20, 10);
      }

      // Soft twinkle star particles
      g.fillStyle(0xfef08a, 0.85);
      g.fillCircle(stageX + layout.stage.width * 0.16, stageY + 22, 2.5);
      g.fillCircle(stageX + layout.stage.width * 0.84, stageY + 36, 2.5);
      g.fillCircle(stageX + layout.stage.width * 0.78, stageY + layout.stage.height * 0.28, 3);
      g.fillCircle(stageX + layout.stage.width * 0.22, stageY + layout.stage.height * 0.24, 2.5);
      g.fillCircle(stageX + layout.stage.width * 0.12, stageY + layout.stage.height * 0.48, 2);
      g.fillCircle(stageX + layout.stage.width * 0.88, stageY + layout.stage.height * 0.46, 2.5);

      // Detail & Action Dock Plate
      const dockX = layout.details.x - panelX;
      const dockY = layout.details.y - panelY;
      const dockW = layout.details.width;
      const dockH = layout.details.height + layout.action.height + (compact ? 14 : 22);
      g.fillStyle(0x0a0f1d, 0.94);
      g.fillRoundedRect(dockX - 8, dockY - 6, dockW + 16, dockH, 16);
      g.lineStyle(1.8, 0x334155, 0.85);
      g.strokeRoundedRect(dockX - 8, dockY - 6, dockW + 16, dockH, 16);
      showcase.add(g);
    }

    // Stage-Level 預覽中 / Preview Badge
    const stageX = layout.stage.x - panelX;
    const stageY = layout.stage.y - panelY;
    const badgeContainer = this.add.container ? this.add.container(stageX + layout.stage.width / 2, stageY + 26) : null;
    if (badgeContainer) {
      if (this.add.graphics) {
        const bG = this.add.graphics();
        bG.fillStyle(0x0f172a, 0.85);
        bG.fillRoundedRect(-95, -16, 190, 32, 16);
        bG.lineStyle(1.5, 0xf59e0b, 0.95);
        bG.strokeRoundedRect(-95, -16, 190, 32, 16);
        badgeContainer.add(bG);
      }
      if (this.add.text) {
        const badgeTxt = this.add.text(0, 0, '👀 預覽中 · PREVIEW', {
          fontSize: '13px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: '#ffd700',
          fontStyle: 'bold',
        });
        if (typeof badgeTxt.setOrigin === 'function') badgeTxt.setOrigin(0.5);
        badgeContainer.add(badgeTxt);
      }
      showcase.add(badgeContainer);
    }

    const initSkin = this.skins[this.selectedSkinIndex];
    const characterLayer = this.add.container ? this.add.container(0, 0) : new Phaser.GameObjects.Container(this, 0, 0);
    if (typeof characterLayer.setDepth === 'function') characterLayer.setDepth(42);
    showcase.add(characterLayer);
    const controller = new CharacterPreviewController(this, {
      container: characterLayer,
      character: this.getPreviewCharacter(initSkin),
      wardrobe: this.getPreviewWardrobe(),
      scale: layout.character.scale,
      reducedMotion: this.prefersReducedMotion,
    });
    const characterX = layout.character.x + layout.character.width / 2 - panelX;
    const pedestalCenterY = stageY + layout.stage.height * 0.72;
    // Ground character feet precisely on top of the velvet platform disc (pedestalCenterY - 4)
    const characterY = pedestalCenterY - 4 - (55 * layout.character.scale);
    characterLayer.setPosition(characterX, characterY);
    this.previewController = controller;
    this.previewSprite = controller.sprite;
    this.wardrobeGraphics = controller.wardrobeGraphics;

    // Dedicated Companion Pet Hero Stage Layer (Hovering in upper-right composition triangle)
    const petLayer = this.add.container ? this.add.container(characterX + 130, characterY - 35) : new Phaser.GameObjects.Container(this, characterX + 130, characterY - 35);
    if (typeof petLayer.setDepth === 'function') petLayer.setDepth(43);
    showcase.add(petLayer);
    this.petPreviewLayer = petLayer;

    // Kept as invisible compatibility handles for older scene integrations/tests.
    this.wardrobeWingsLayer = this.createLegacyPreviewLayer(showcase, characterX, characterY, 35);
    this.wardrobeDressLayer = this.createLegacyPreviewLayer(showcase, characterX, characterY, 44);
    this.wardrobeTopLayer = this.createLegacyPreviewLayer(showcase, characterX, characterY, 45);
    this.wardrobeBottomLayer = this.createLegacyPreviewLayer(showcase, characterX, characterY, 46);
    this.wardrobeBackpackLayer = this.createLegacyPreviewLayer(showcase, characterX, characterY, 47);
    this.wardrobeGlassesLayer = this.createLegacyPreviewLayer(showcase, characterX, characterY, 48);
    this.wardrobeHatLayer = this.createLegacyPreviewLayer(showcase, characterX, characterY, 49);
    this.previewWardrobeOverlay = this.wardrobeHatLayer;

    // Legacy sync contract retained for old integrations; the controller owns the live 2px idle motion.
    if (!this.prefersReducedMotion && this.tweens?.add) {
      this.tweens.add({
        targets: [
          this.previewSprite,
          this.wardrobeGraphics,
          this.wardrobeWingsLayer,
          this.wardrobeDressLayer,
          this.wardrobeTopLayer,
          this.wardrobeBottomLayer,
          this.wardrobeBackpackLayer,
          this.wardrobeGlassesLayer,
          this.wardrobeHatLayer,
        ].filter(Boolean),
        y: '-=12',
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        paused: true,
      });
    }

    if (!this.prefersReducedMotion && this.time?.addEvent) {
      this.walkAnimTimer = this.time.addEvent({
        delay: 350,
        loop: true,
        callback: () => this.cyclePreviewAnimation(),
      });
    } else if (this.prefersReducedMotion && this.walkAnimTimer) {
      this.walkAnimTimer.remove();
      this.walkAnimTimer = null;
    }

    const poseY = layout.stage.y + Math.min(18, layout.stage.height * 0.08);
    const poseWidth = Math.min(76, Math.max(58, layout.preview.width * 0.13));
    const poseStartX = layout.preview.x + 18 + poseWidth / 2;
    const poseGap = 5;
    const poseStand = new CanvasButton(this, {
      x: poseStartX,
      y: poseY,
      width: poseWidth,
      height: 44,
      text: '🧍 站立',
      color: this.currentPose === 'stand' ? 'yellow' : 'grey',
      fontSize: '16px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => this.switchPose('stand'),
    });
    poseStand.setDepth(60);
    const poseWalk = new CanvasButton(this, {
      x: poseStartX + poseWidth + poseGap,
      y: poseY,
      width: poseWidth,
      height: 44,
      text: '🏃 奔跑',
      color: this.currentPose === 'walk' ? 'yellow' : 'grey',
      fontSize: '16px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => this.switchPose('walk'),
    });
    poseWalk.setDepth(60);
    const poseCheer = new CanvasButton(this, {
      x: poseStartX + (poseWidth + poseGap) * 2,
      y: poseY,
      width: poseWidth,
      height: 44,
      text: '🎉 歡呼',
      color: this.currentPose === 'cheer' ? 'yellow' : 'grey',
      fontSize: '16px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => this.switchPose('cheer'),
    });
    poseCheer.setDepth(60);
    this.ootdButton = new CanvasButton(this, {
      x: layout.preview.x + layout.preview.width - 66,
      y: poseY,
      width: 112,
      height: 44,
      text: '📸 今日穿搭',
      color: 'blue',
      fontSize: '16px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => this.showOOTDPhotoModal(),
    });
    this.ootdButton.setDepth(60);
    this.poseButtons = [poseStand, poseWalk, poseCheer];

    const detailX = layout.details.x + layout.details.width / 2 - panelX;
    const detailY = layout.details.y - panelY;
    const detailFont = compact ? '14px' : '18px';
    const detailTextScale = compact ? 1 : 0.85;
    if (this.add.text) {
      this.previewNameText = this.add.text(detailX, detailY + (compact ? 12 : 16), compact ? initSkin.name : `${initSkin.name} (${initSkin.englishName})`, {
        fontSize: compact ? '20px' : '26px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd45b',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: layout.details.width },
      });
      if (typeof this.previewNameText.setOrigin === 'function') this.previewNameText.setOrigin(0.5);
      showcase.add(this.previewNameText);

      this.previewDescText = this.add.text(detailX, detailY + (compact ? 32 : 38), initSkin.description, {
        fontSize: detailFont,
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#cbd5e1',
        align: 'center',
        wordWrap: { width: layout.details.width - 12 },
      });
      if (typeof this.previewDescText.setOrigin === 'function') this.previewDescText.setOrigin(0.5);
      showcase.add(this.previewDescText);

      this.previewSpeedText = this.add.text(detailX - layout.details.width * 0.40, detailY + (compact ? 52 : 62), `🏃 跑速加成: +${Math.round(initSkin.speedBonus * 100)}%`, {
        fontSize: detailFont,
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof this.previewSpeedText.setOrigin === 'function') this.previewSpeedText.setOrigin(0, 0.5);
      showcase.add(this.previewSpeedText);

      this.previewJumpText = this.add.text(detailX + layout.details.width * 0.08, detailY + (compact ? 52 : 62), `🦘 跳躍加成: +${Math.round(initSkin.jumpBonus * 100)}%`, {
        fontSize: detailFont,
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof this.previewJumpText.setOrigin === 'function') this.previewJumpText.setOrigin(0, 0.5);
      showcase.add(this.previewJumpText);

      this.previewSpecialText = this.add.text(detailX, detailY + (compact ? 72 : 84), initSkin.waterGlide ? '🌊 特殊能力：水面輕功滑行 (不沉水)' : `✨ 專屬特技：${initSkin.perkDescription}`, {
        fontSize: detailFont,
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#ffd166',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: layout.details.width - 12 },
      });
      if (typeof this.previewSpecialText.setOrigin === 'function') this.previewSpecialText.setOrigin(0.5);
      showcase.add(this.previewSpecialText);

      if (detailTextScale < 1) {
        [
          this.previewNameText,
          this.previewDescText,
          this.previewSpeedText,
          this.previewJumpText,
          this.previewSpecialText,
        ].forEach(text => text?.setScale?.(detailTextScale));
      }
    }

    this.actionButton = new CanvasButton(this, {
      x: layout.action.x + layout.action.width / 2,
      y: layout.action.y + layout.action.height / 2,
      width: layout.action.width,
      height: layout.action.height,
      text: '👕 換上造型',
      color: 'green',
      fontSize: compact ? '18px' : '24px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => this.handleActionClick(),
    });
    this.actionButton.setDepth(60);

    this.previewContainer = showcase;
    if (this.add && typeof this.add.existing === 'function') this.add.existing(showcase);
  }

  private createLegacyPreviewLayer(
    showcase: Phaser.GameObjects.Container,
    x: number,
    y: number,
    depth: number
  ): Phaser.GameObjects.Text | null {
    if (!this.add.text) return null;
    const layer = this.add.text(x, y, '', { fontSize: '1px' });
    if (typeof layer.setOrigin === 'function') layer.setOrigin(0.5);
    if (typeof layer.setDepth === 'function') layer.setDepth(depth);
    if (typeof layer.setAlpha === 'function') layer.setAlpha(0);
    showcase.add(layer);
    return layer;
  }

  public switchPose(pose: 'stand' | 'walk' | 'cheer'): void {
    this.currentPose = pose;
    SoundManager.play('click');

    const poses: ('stand' | 'walk' | 'cheer')[] = ['stand', 'walk', 'cheer'];
    this.poseButtons.forEach((btn, idx) => {
      btn.setColor(poses[idx] === pose ? 'yellow' : 'grey');
    });

    this.updatePreviewDisplay();
    if (pose === 'cheer') this.previewController?.playCheer();
  }

  private cyclePreviewAnimation(): void {
    if (!this.previewSprite) return;
    if (this.currentPose !== 'walk') return;
    // A dedicated Outfit run texture is already authoritative; do not let the
    // legacy base-character frame timer paint it away.
    if (this.previewController?.lastRenderResult?.mode === 'fullSprite') {
      if (this.previewController.lastRenderResult.poseFallback) {
        this.previewController.playRunFallbackStep();
      }
      return;
    }

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
      btn.setColor(isSelected ? 'card_selected' : 'grey');

      const textObj = this.skinCardTextObjects[idx];
      const skin = this.skins[idx];
      if (textObj && skin) {
        const isOwned = profile.ownedSkins.includes(skin.id);
        const isEquipped = profile.equippedSkin === skin.id;

        if (typeof textObj.name.setColor === 'function') {
          textObj.name.setColor('#ffffff');
        }
        if (typeof textObj.perk.setColor === 'function') {
          textObj.perk.setColor(isSelected ? '#fde047' : '#ffd166');
        }

        let statusColor = isSelected ? '#38bdf8' : '#00e5ff';
        if (isEquipped) {
          statusColor = isSelected ? '#86efac' : '#76d67c';
        } else if (isOwned) {
          statusColor = isSelected ? '#93c5fd' : '#a0c4ff';
        }
        if (typeof textObj.status.setColor === 'function') {
          textObj.status.setColor(statusColor);
        }
        if (textObj.marker) {
          const shouldShowPreview = isSelected && !isEquipped;
          if (typeof textObj.marker.setVisible === 'function') {
            textObj.marker.setVisible(shouldShowPreview);
          } else {
            (textObj.marker as any).visible = shouldShowPreview;
          }
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

    this.updatePetCompanionStage();
    this.refreshCurrencyHUD();
  }

  private updatePetCompanionStage(): void {
    if (!this.petPreviewLayer) return;
    if (typeof this.petPreviewLayer.removeAll === 'function') {
      this.petPreviewLayer.removeAll(true);
    }

    const dm = DataManager.getInstance();
    const profile = dm.getProfile();

    // In 'pets' tab, show currently selected pet; in other tabs, show player's equipped pet (if any)
    let targetPetId: string | undefined;
    if (this.currentTab === 'pets') {
      targetPetId = PET_DEFINITIONS[this.selectedPetIndex]?.id;
    } else {
      targetPetId = profile.equippedPet || undefined;
    }

    if (!targetPetId) return;

    const pet = PET_DEFINITIONS.find((p) => p.id === targetPetId);
    if (!pet) return;

    // Ambient Ethereal Glow Disc
    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(pet.tint, 0.22);
      g.fillCircle(0, 0, 34);
      g.fillStyle(pet.tint, 0.38);
      g.fillCircle(0, 0, 22);
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(0, 0, 10);
      this.petPreviewLayer.add(g);
    }

    // Vector Portrait Sprite
    const portraitKey = `icon_pet_${pet.id}_portrait`;
    if (this.textures?.exists && this.textures.exists(portraitKey)) {
      const img = this.add.image(0, 0, portraitKey);
      img.setDisplaySize(56, 56);
      img.setOrigin(0.5, 0.5);
      this.petPreviewLayer.add(img);
    } else if (this.add.text) {
      const txt = this.add.text(0, 0, pet.icon, { fontSize: '40px' });
      txt.setOrigin(0.5, 0.5);
      this.petPreviewLayer.add(txt);
    }

    // Gentle breathing float tween
    if (!this.prefersReducedMotion && this.tweens?.add) {
      this.tweens.add({
        targets: this.petPreviewLayer,
        y: '-=6',
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private updateSkinPreviewDisplay(profile: any): void {
    const skin = this.skins[this.selectedSkinIndex];
    if (!skin) return;

    const isOwned = profile.ownedSkins.includes(skin.id);
    const isEquipped = profile.equippedSkin === skin.id;

    // Sprite texture based on pose. The controller keeps the outfit and body on the same rig.
    if (this.previewController) {
      this.previewController.setCharacter(this.getPreviewCharacter(skin));
      this.previewController.setWardrobe(this.getPreviewWardrobe());
      this.previewController.setPose(this.getPreviewPose());
    } else if (this.previewSprite) {
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
      this.previewNameText.setText(this.previewIsCompact ? skin.name : `${skin.name}  •  ${skin.englishName}`);
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
        this.actionButton.setIcon?.('vec_icon_check_24');
        this.actionButton.setColor('grey');
        this.actionButton.setEnabled(false);
      } else if (isOwned) {
        this.actionButton.setText('👕 立即換裝');
        this.actionButton.setIcon?.('vec_icon_wardrobe_24');
        this.actionButton.setColor('blue');
        this.actionButton.setEnabled(true);
      } else {
        const canAffordGems = profile.gems >= skin.costGems;
        if (canAffordGems) {
          this.actionButton.setText(`💎 ${skin.costGems} 購買解鎖`);
          this.actionButton.setIcon?.('vec_icon_gem_24');
          this.actionButton.setColor('yellow');
          this.actionButton.setEnabled(true);
        } else {
          this.actionButton.setText(`💎 ${skin.costGems} 寶石不足`);
          this.actionButton.setIcon?.('vec_icon_lock_24');
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

    const cnName = pet.name.includes('(') ? pet.name.split('(')[0].trim() : pet.name;
    if (this.previewNameText && typeof this.previewNameText.setText === 'function') {
      this.previewNameText.setText(`${cnName}  •  ${pet.nameEn}`);
    }

    if (this.previewDescText && typeof this.previewDescText.setText === 'function') {
      this.previewDescText.setText(pet.description);
    }

    if (this.previewSpeedText && typeof this.previewSpeedText.setText === 'function') {
      this.previewSpeedText.setText(`🧲 磁力加成: +${pet.magnetBonus}px`);
    }

    if (this.previewJumpText && typeof this.previewJumpText.setText === 'function') {
      if (pet.jumpBonus) {
        this.previewJumpText.setText(`🪶 浮空加成: +${Math.round(pet.jumpBonus * 100)}%`);
      } else if (pet.bonusCoinRate) {
        this.previewJumpText.setText(`🪙 跳石獎勵: +${pet.bonusCoinRate} 金幣`);
      } else {
        this.previewJumpText.setText(`⚡ 障礙偵測: 自動雷達預警`);
      }
    }

    if (this.previewSpecialText && typeof this.previewSpecialText.setText === 'function') {
      this.previewSpecialText.setText(`🐾 專屬特技：${pet.perkDescription}`);
    }

    if (this.actionButton) {
      if (typeof this.actionButton.setDepth === 'function') this.actionButton.setDepth(60);
      if (isEquipped) {
        this.actionButton.setText('✅ 出戰中');
        this.actionButton.setIcon?.('vec_icon_check_24');
        this.actionButton.setColor('grey');
        this.actionButton.setEnabled(false);
      } else if (isOwned) {
        this.actionButton.setText('🐾 派出寵物');
        this.actionButton.setIcon?.('vec_icon_pet_24');
        this.actionButton.setColor('green');
        this.actionButton.setEnabled(true);
      } else {
        const canAffordCoins = profile.coins >= pet.costCoins;
        const canAffordGems = profile.gems >= pet.costGems;
        if (canAffordCoins || canAffordGems) {
          const costTxt = canAffordCoins ? `🪙 ${pet.costCoins}` : `💎 ${pet.costGems}`;
          this.actionButton.setText(`${costTxt} 領養寵物`);
          this.actionButton.setIcon?.(canAffordCoins ? 'vec_icon_coin_24' : 'vec_icon_gem_24');
          this.actionButton.setColor('yellow');
          this.actionButton.setEnabled(true);
        } else {
          this.actionButton.setText(`🪙 ${pet.costCoins} 金幣不足`);
          this.actionButton.setIcon?.('vec_icon_lock_24');
          this.actionButton.setColor('grey');
          this.actionButton.setEnabled(false);
        }
      }
    }
  }

  private updateWardrobePreviewDisplay(dm: DataManager, profile: any): void {
    const items = this.getVisibleWardrobeItems();
    const item = items[this.selectedWardrobeIndex];
    if (!item) {
      if (this.previewController) {
        const skin = this.skins[this.selectedSkinIndex];
        if (skin) this.previewController.setCharacter(this.getPreviewCharacter(skin));
        this.previewController.setWardrobe(this.getPreviewWardrobe());
        this.previewController.setPose(this.getPreviewPose());
      }
      this.updateWardrobeOverlay();
      this.previewNameText?.setText?.('🧺 你的衣櫥還是空的');
      this.previewDescText?.setText?.('先到商品分類挑選一件喜歡的服裝吧！');
      this.previewSpeedText?.setText?.('✨ 尚未擁有任何服裝');
      this.previewJumpText?.setText?.('');
      this.previewSpecialText?.setText?.('');
      if (this.actionButton) {
        this.actionButton.setText('🛍️ 挑選第一套服裝 ➔');
        this.actionButton.setColor('yellow');
        this.actionButton.setEnabled(false);
      }
      return;
    }

    const isOwned = dm.isWardrobeOwned(item.id);
    const equipped = dm.getEquippedWardrobe();
    const isEquipped = Object.values(equipped).includes(item.id);
    const isArtworkReady = this.isWardrobePreviewReady(item);

    if (this.previewController) {
      const skin = this.skins[this.selectedSkinIndex];
      if (skin) this.previewController.setCharacter(this.getPreviewCharacter(skin));
      this.previewController.setWardrobe(this.getPreviewWardrobe());
      this.previewController.setPose(this.getPreviewPose());
    }

    // Overlay wardrobe symbols
    this.updateWardrobeOverlay();

    if (this.previewNameText && typeof this.previewNameText.setText === 'function') {
      this.previewNameText.setText(this.previewIsCompact
        ? `${item.icon} ${item.name}`
        : `${item.icon} ${item.name} (${item.nameEn})`);
    }

    if (this.previewDescText && typeof this.previewDescText.setText === 'function') {
      this.previewDescText.setText(item.description);
    }

    if (this.previewSpeedText && typeof this.previewSpeedText.setText === 'function') {
      this.previewSpeedText.setText(this.previewIsCompact
        ? `✨ ${item.category.toUpperCase()} · 🪙 ${item.costCoins} / 💎 ${item.costGems}`
        : `✨ 部位: ${item.category.toUpperCase()}`);
    }

    if (this.previewJumpText && typeof this.previewJumpText.setText === 'function') {
      this.previewJumpText.setText(this.previewIsCompact ? '' : `🪙 ${item.costCoins} / 💎 ${item.costGems}`);
    }

    if (this.previewSpecialText && typeof this.previewSpecialText.setText === 'function') {
      this.previewSpecialText.setText(isArtworkReady ? `🎀 ${item.perkDescription}` : '🎨 正式穿戴圖製作中，暫不開放購買');
    }

    if (this.actionButton) {
      if (typeof this.actionButton.setDepth === 'function') this.actionButton.setDepth(60);
      if (!isArtworkReady) {
        this.actionButton.setText('🎨 美術準備中');
        this.actionButton.setIcon?.('vec_icon_lock_24');
        this.actionButton.setColor('grey');
        this.actionButton.setEnabled(false);
      } else if (isEquipped) {
        this.actionButton.setText('❌ 脫下衣物');
        this.actionButton.setIcon?.('vec_icon_close_24');
        this.actionButton.setColor('red');
        this.actionButton.setEnabled(true);
      } else if (isOwned) {
        this.actionButton.setText('👗 立即換上');
        this.actionButton.setIcon?.('vec_icon_wardrobe_24');
        this.actionButton.setColor('green');
        this.actionButton.setEnabled(true);
      } else {
        const canAffordCoins = profile.coins >= item.costCoins;
        const canAffordGems = profile.gems >= item.costGems;
        if (canAffordCoins || canAffordGems) {
          const costTxt = canAffordCoins ? `🪙 ${item.costCoins}` : `💎 ${item.costGems}`;
          this.actionButton.setText(`${costTxt} 立即購買`);
          this.actionButton.setIcon?.(canAffordCoins ? 'vec_icon_coin_24' : 'vec_icon_gem_24');
          this.actionButton.setColor('yellow');
          this.actionButton.setEnabled(true);
        } else {
          this.actionButton.setText(`🪙 ${item.costCoins} 金幣不足`);
          this.actionButton.setIcon?.('vec_icon_lock_24');
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
    const eq = this.getPreviewWardrobe();

    // 1. Hat / Headwear (cat_ears, scholar_cap, tram_hat)
    if (this.wardrobeHatLayer && typeof this.wardrobeHatLayer.setText === 'function') {
      let hatIcon = '';
      if (eq.hat) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.hat);
        if (item) hatIcon = item.icon;
      } else if (eq.accessory && ['cat_ears', 'scholar_cap', 'tram_hat'].includes(eq.accessory)) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.accessory);
        if (item) hatIcon = item.icon;
      }
      this.wardrobeHatLayer.setText(hatIcon);
    }

    // 2. Glasses (star_glasses)
    if (this.wardrobeGlassesLayer && typeof this.wardrobeGlassesLayer.setText === 'function') {
      let glassesIcon = '';
      if (eq.accessory === 'star_glasses') {
        const item = WARDROBE_ITEMS.find((w) => w.id === 'star_glasses');
        if (item) glassesIcon = item.icon;
      }
      this.wardrobeGlassesLayer.setText(glassesIcon);
    }

    // 3. Backpack (star_backpack)
    if (this.wardrobeBackpackLayer && typeof this.wardrobeBackpackLayer.setText === 'function') {
      let backpackIcon = '';
      if (eq.accessory === 'star_backpack') {
        const item = WARDROBE_ITEMS.find((w) => w.id === 'star_backpack');
        if (item) backpackIcon = item.icon;
      }
      this.wardrobeBackpackLayer.setText(backpackIcon);
    }

    // 4. Wings (angel_wings)
    if (this.wardrobeWingsLayer && typeof this.wardrobeWingsLayer.setText === 'function') {
      let wingsIcon = '';
      if (eq.wings) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.wings);
        if (item) wingsIcon = item.icon;
      } else if (eq.accessory === 'angel_wings') {
        const item = WARDROBE_ITEMS.find((w) => w.id === 'angel_wings');
        if (item) wingsIcon = item.icon;
      }
      this.wardrobeWingsLayer.setText(wingsIcon);
    }

    // 5. Dress / Robe / Onesie
    if (this.wardrobeDressLayer && typeof this.wardrobeDressLayer.setText === 'function') {
      let dressIcon = '';
      if (eq.dress) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.dress);
        if (item) dressIcon = item.icon;
      }
      this.wardrobeDressLayer.setText(dressIcon);
    }

    // 6. Top / Shirt
    if (this.wardrobeTopLayer && typeof this.wardrobeTopLayer.setText === 'function') {
      let topIcon = '';
      if (eq.top) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.top);
        if (item) topIcon = item.icon;
      }
      this.wardrobeTopLayer.setText(topIcon);
    }

    // 7. Bottom / Skirt / Shorts
    if (this.wardrobeBottomLayer && typeof this.wardrobeBottomLayer.setText === 'function') {
      let bottomIcon = '';
      if (eq.bottom) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.bottom);
        if (item) bottomIcon = item.icon;
      }
      this.wardrobeBottomLayer.setText(bottomIcon);
    }

    // Backward compatibility for legacy tests inspecting previewWardrobeOverlay
    if (this.previewWardrobeOverlay && this.previewWardrobeOverlay !== this.wardrobeHatLayer && typeof this.previewWardrobeOverlay.setText === 'function') {
      const allIcons: string[] = [];
      if (eq.hat) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.hat);
        if (item) allIcons.push(item.icon);
      }
      if (eq.dress) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.dress);
        if (item) allIcons.push(item.icon);
      }
      if (eq.top) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.top);
        if (item) allIcons.push(item.icon);
      }
      if (eq.bottom) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.bottom);
        if (item) allIcons.push(item.icon);
      }
      if (eq.wings) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.wings);
        if (item) allIcons.push(item.icon);
      }
      if (eq.accessory) {
        const item = WARDROBE_ITEMS.find((w) => w.id === eq.accessory);
        if (item) allIcons.push(item.icon);
      }
      this.previewWardrobeOverlay.setText(allIcons.join(' '));
    }

    // The CharacterPreviewController owns the live graphics target and its cache.
  }

  private getPreviewPose(): PreviewPose {
    if (this.currentPose === 'walk') return 'run';
    if (this.currentPose === 'cheer') return 'cheer';
    return 'idle';
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
        this.showGlobalSyncToast(`✨ 已換上「${skin.name}」，已套用至全遊戲！`);
        try {
          SpeechService.speak('換好裝啦！出發去探險咯！', 'zh-HK');
        } catch {}
        this.refreshSceneState();
      } else {
        if (this.isLiveScene()) {
          this.showSkinPurchaseConfirm(skin);
        } else {
          this.purchaseSkinDirect(skin);
        }
      }
    } else if (this.currentTab === 'wardrobe') {
      const items = this.getVisibleWardrobeItems();
      const item = items[this.selectedWardrobeIndex];
      if (!item) return;

      const isOwned = dm.isWardrobeOwned(item.id);
      const equipped = dm.getEquippedWardrobe();
      const isEquipped = Object.values(equipped).includes(item.id);
      if (!this.isWardrobePreviewReady(item)) return;

      if (isEquipped) {
        // Unequip
        const slot = Object.keys(equipped).find((k) => equipped[k as keyof EquippedWardrobe] === item.id) as keyof EquippedWardrobe;
        if (slot) dm.unequipWardrobeItem(slot);
        this.previewWardrobeState = dm.getEquippedWardrobe();
        SoundManager.playClothSnap();
        this.showGlobalSyncToast(`✨ 已脫下「${item.name}」`);
        this.refreshSceneState();
      } else if (isOwned) {
        // Equip
        const slot = this.getWardrobeSlot(item);

        dm.equipWardrobeItem(slot, item.id);
        this.previewWardrobeState = dm.getEquippedWardrobe();
        dm.checkTrophies();
        SoundManager.playMagicTransform();
        this.speakCantonesePraise();
        this.showGlobalSyncToast(`✨ 已換上「${item.name}」，已套用至全遊戲！`);
        this.refreshSceneState();
      } else {
        // Buy
        if (this.isLiveScene()) {
          this.showWardrobePurchaseConfirm(item);
        } else {
          this.purchaseWardrobeItem(item);
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
        if (this.isLiveScene()) {
          this.showPetPurchaseConfirm(pet);
        } else {
          this.purchasePetDirect(pet);
        }
      }
    } else if (this.currentTab === 'gadgets') {
      const gadget = GADGET_DEFINITIONS[this.selectedGadgetIndex];
      if (!gadget) return;

      const currency = profile.coins >= gadget.costCoins ? 'coins' : 'gems';
      const ok = dm.buyGadget(gadget.id, 1, currency);
      if (ok) {
        dm.checkTrophies();
        SoundManager.play('coin');
        this.refreshSceneState();
      } else {
        SoundManager.play('wrong');
      }
    }
  }

  private purchaseSkinDirect(skin: SkinDefinition): void {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    if (profile.gems < skin.costGems) {
      SoundManager.play('wrong');
      return;
    }
    const success = dm.unlockSkin(skin.id, skin.costGems, 0);
    if (success) {
      dm.equipSkin(skin.id);
      dm.checkTrophies();
      SoundManager.play('victory');
      this.showGlobalSyncToast(`✨ 成功解鎖並換上「${skin.name}」！`);
      try {
        SpeechService.speak('換好裝啦！出發去探險咯！', 'zh-HK');
      } catch {}
      this.refreshSceneState();
    } else {
      SoundManager.play('wrong');
    }
  }

  private showSkinPurchaseConfirm(skin: SkinDefinition): void {
    if (this.purchaseModal || this.wardrobePurchasePending || !this.add) return;
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const canAfford = profile.gems >= skin.costGems;
    if (!canAfford) {
      SoundManager.play('wrong');
      return;
    }

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    const modalWidth = Math.min(520, width * 0.68);
    const modalHeight = Math.min(300, height * 0.52);
    const modal = new CanvasModal(this, {
      x: width / 2,
      y: height / 2,
      width: modalWidth,
      height: modalHeight,
      title: '🛒 確認解鎖角色',
      theme: 'gold',
      borderColor: 0xf5bd42,
      onClose: () => {
        this.purchaseModal = null;
      },
    });

    const newGems = profile.gems - skin.costGems;
    const content = this.add.text(
      0,
      -35,
      `確定要解鎖角色造型「${skin.name}」嗎？\n${skin.englishName}\n\n價格：💎 ${skin.costGems} 寶石\n當前餘額：💎 ${profile.gems} ➔ 解鎖後：💎 ${newGems}`,
      {
        fontSize: width < 1000 ? '15px' : '18px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#fff7df',
        align: 'center',
        lineSpacing: 4,
      }
    );
    if (typeof content.setOrigin === 'function') content.setOrigin(0.5);

    const confirmButton = new CanvasButton(this, {
      x: 0,
      y: modalHeight / 2 - 52,
      width: Math.min(250, modalWidth - 64),
      height: 48,
      text: '✅ 確認購買',
      color: 'yellow',
      fontSize: width < 1000 ? '16px' : '19px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => {
        if (this.wardrobePurchasePending) return;
        this.wardrobePurchasePending = true;
        this.actionButton?.setText?.('⏳ 解鎖中…');
        this.actionButton?.setColor?.('grey');
        this.actionButton?.setEnabled?.(false);
        modal.close();

        const completePurchase = () => {
          this.wardrobePurchasePending = false;
          this.purchaseSkinDirect(skin);
        };

        if (this.time?.delayedCall) this.time.delayedCall(180, completePurchase);
        else completePurchase();
      },
    });
    confirmButton.setDepth(60);
    modal.addContent([content, confirmButton]);
    this.purchaseModal = modal;
    modal.show(true);
  }

  private purchasePetDirect(pet: PetDefinition): void {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const currency = 'coins';
    if (profile.coins < pet.costCoins) {
      SoundManager.play('wrong');
      return;
    }
    const ok = dm.buyPet(pet.id, currency);
    if (ok) {
      dm.equipPet(pet.id);
      dm.checkTrophies();
      SoundManager.play('victory');
      const cnName = pet.name.includes('(') ? pet.name.split('(')[0].trim() : pet.name;
      this.showGlobalSyncToast(`✨ 成功領養「${cnName}」並派出出戰！`);
      this.refreshSceneState();
    } else {
      SoundManager.play('wrong');
    }
  }

  private showPetPurchaseConfirm(pet: PetDefinition): void {
    if (this.purchaseModal || this.wardrobePurchasePending || !this.add) return;
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const canAffordCoins = profile.coins >= pet.costCoins;
    if (!canAffordCoins) {
      SoundManager.play('wrong');
      return;
    }

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    const modalWidth = Math.min(520, width * 0.68);
    const modalHeight = Math.min(300, height * 0.52);
    const modal = new CanvasModal(this, {
      x: width / 2,
      y: height / 2,
      width: modalWidth,
      height: modalHeight,
      title: '🐾 領養寵物夥伴',
      theme: 'gold',
      borderColor: 0xf5bd42,
      onClose: () => {
        this.purchaseModal = null;
      },
    });

    const cnName = pet.name.includes('(') ? pet.name.split('(')[0].trim() : pet.name;
    const newCoins = profile.coins - pet.costCoins;
    const content = this.add.text(
      0,
      -35,
      `確定要領養「${cnName}」嗎？\n${pet.nameEn}\n\n價格：🪙 ${pet.costCoins} 金幣\n當前餘額：🪙 ${profile.coins} ➔ 領養後：🪙 ${newCoins}`,
      {
        fontSize: width < 1000 ? '15px' : '18px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#fff7df',
        align: 'center',
        lineSpacing: 4,
      }
    );
    if (typeof content.setOrigin === 'function') content.setOrigin(0.5);

    const confirmButton = new CanvasButton(this, {
      x: 0,
      y: modalHeight / 2 - 52,
      width: Math.min(250, modalWidth - 64),
      height: 48,
      text: '✅ 確認領養',
      color: 'yellow',
      fontSize: width < 1000 ? '16px' : '19px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => {
        if (this.wardrobePurchasePending) return;
        this.wardrobePurchasePending = true;
        this.actionButton?.setText?.('⏳ 領養中…');
        this.actionButton?.setColor?.('grey');
        this.actionButton?.setEnabled?.(false);
        modal.close();

        const completePurchase = () => {
          this.wardrobePurchasePending = false;
          this.purchasePetDirect(pet);
        };

        if (this.time?.delayedCall) this.time.delayedCall(180, completePurchase);
        else completePurchase();
      },
    });
    confirmButton.setDepth(60);
    modal.addContent([content, confirmButton]);
    this.purchaseModal = modal;
    modal.show(true);
  }

  private purchaseWardrobeItem(item: WardrobeItem): void {
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const currency = item.costCoins > 0 ? 'coins' : 'gems';
    const cost = item.costCoins > 0 ? item.costCoins : item.costGems;
    const canAfford = currency === 'coins' ? profile.coins >= cost : profile.gems >= cost;
    if (!canAfford) {
      SoundManager.play('wrong');
      this.updatePreviewDisplay();
      return;
    }
    const ok = dm.buyWardrobeItem(item.id, currency);
    if (!ok) {
      SoundManager.play('wrong');
      this.updatePreviewDisplay();
      return;
    }

    dm.equipWardrobeItem(this.getWardrobeSlot(item), item.id);
    this.previewWardrobeState = dm.getEquippedWardrobe();
    dm.checkTrophies();
    SoundManager.playMagicTransform();
    this.speakCantonesePraise();
    this.refreshSceneState();
    this.showWardrobePurchaseSuccess(item);
  }

  private showWardrobePurchaseConfirm(item: WardrobeItem): void {
    if (this.purchaseModal || this.wardrobePurchasePending || !this.add) return;
    const dm = DataManager.getInstance();
    const profile = dm.getProfile();
    const currency = item.costCoins > 0 ? 'coins' : 'gems';
    const cost = item.costCoins > 0 ? item.costCoins : item.costGems;
    const canAfford = currency === 'coins' ? profile.coins >= cost : profile.gems >= cost;
    if (!canAfford) {
      SoundManager.play('wrong');
      return;
    }

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    const modalWidth = Math.min(520, width * 0.68);
    const modalHeight = Math.min(300, height * 0.52);
    const modal = new CanvasModal(this, {
      x: width / 2,
      y: height / 2,
      width: modalWidth,
      height: modalHeight,
      title: '🛒 確認購買',
      theme: 'gold',
      borderColor: 0xf5bd42,
      onClose: () => {
        this.purchaseModal = null;
      },
    });

    const priceLabel = currency === 'coins' ? `🪙 ${cost} 金幣` : `💎 ${cost} 寶石`;
    const balanceBefore = currency === 'coins' ? profile.coins : profile.gems;
    const balanceAfter = balanceBefore - cost;
    const sym = currency === 'coins' ? '🪙' : '💎';

    const content = this.add.text(
      0,
      -35,
      `確定要購買「${item.name}」嗎？\n${item.nameEn}\n\n價格：${priceLabel}\n當前餘額：${sym} ${balanceBefore} ➔ 購買後：${sym} ${balanceAfter}`,
      {
        fontSize: width < 1000 ? '15px' : '18px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#fff7df',
        align: 'center',
        lineSpacing: 4,
      }
    );
    if (typeof content.setOrigin === 'function') content.setOrigin(0.5);
    const confirmButton = new CanvasButton(this, {
      x: 0,
      y: modalHeight / 2 - 52,
      width: Math.min(250, modalWidth - 64),
      height: 48,
      text: '✅ 確認購買',
      color: 'yellow',
      fontSize: width < 1000 ? '16px' : '19px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => {
        if (this.wardrobePurchasePending) return;
        this.wardrobePurchasePending = true;
        this.actionButton?.setText?.('⏳ 購買中…');
        this.actionButton?.setColor?.('grey');
        this.actionButton?.setEnabled?.(false);
        modal.close();
        const completePurchase = () => {
          this.wardrobePurchasePending = false;
          this.purchaseWardrobeItem(item);
        };
        if (this.time?.delayedCall) this.time.delayedCall(180, completePurchase);
        else completePurchase();
      },
    });
    confirmButton.setDepth(60);
    modal.addContent([content, confirmButton]);
    this.purchaseModal = modal;
    modal.show(true);
  }

  private showWardrobePurchaseSuccess(item: WardrobeItem): void {
    if (this.purchaseModal || !this.add) return;
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    const modalWidth = Math.min(560, width * 0.72);
    const modalHeight = Math.min(320, height * 0.54);
    const modal = new CanvasModal(this, {
      x: width / 2,
      y: height / 2,
      width: modalWidth,
      height: modalHeight,
      title: '✨ 購買成功！',
      theme: 'gold',
      borderColor: 0xf5bd42,
      onClose: () => {
        this.purchaseModal = null;
      },
    });
    const content = this.add.text(0, -45, `✅ 已購買並穿上！\n${item.name}\n${item.nameEn}\n\n已加入你的夢幻衣櫥。`, {
      fontSize: width < 1000 ? '16px' : '21px',
      fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
      color: '#fff7df',
      align: 'center',
      lineSpacing: 5,
    });
    if (typeof content.setOrigin === 'function') content.setOrigin(0.5);
    const wearButton = new CanvasButton(this, {
      x: 0,
      y: modalHeight / 2 - 55,
      width: Math.min(260, modalWidth - 64),
      height: 48,
      text: '✅ 繼續探索',
      color: 'yellow',
      fontSize: width < 1000 ? '17px' : '20px',
      scaleOnHover: 1.02,
      scaleOnDown: 0.97,
      onClick: () => modal.close(),
    });
    wearButton.setDepth(60);
    modal.addContent([content, this.createPurchaseCelebration(modalWidth), wearButton]);
    this.purchaseModal = modal;
    modal.show(true);
  }

  private createPurchaseCelebration(modalWidth: number): Phaser.GameObjects.Container {
    const burst = this.add.container
      ? this.add.container(0, -82)
      : new Phaser.GameObjects.Container(this, 0, -82);
    if (this.prefersReducedMotion) return burst;

    const particles = ['✦', '✧', '•', '◇', '✨', '🪙'];
    particles.forEach((symbol, index) => {
      const direction = index % 2 === 0 ? -1 : 1;
      const particle = this.add.text(
        (index - 2.5) * Math.min(54, modalWidth * 0.1),
        index % 3 * 8,
        symbol,
        { fontSize: symbol === '🪙' ? '25px' : '22px', color: '#ffd45b' }
      );
      if (typeof particle.setOrigin === 'function') particle.setOrigin(0.5);
      burst.add(particle);
      if (this.tweens?.add) {
        this.tweens.add({
          targets: particle,
          x: particle.x + direction * 24,
          y: particle.y - 34 - index * 3,
          alpha: 0,
          scale: 1.15,
          duration: 720,
          delay: index * 35,
          ease: 'Cubic.easeOut',
        });
      }
    });
    return burst;
  }

  // --- 📸 OOTD Photo Booth Modal (Item 10) ---
  public showOOTDPhotoModal(): void {
    if (this.ootdModal || this.wardrobePurchasePending) return;

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
      if (typeof dim.setInteractive === 'function' && Phaser?.Geom?.Rectangle) {
        dim.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
      }
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

      // Top-Left Washi Tape (Diagonal pastel coral tape - Item 10)
      card.fillStyle(0xff8a80, 0.88);
      card.beginPath();
      card.moveTo(-205, -260);
      card.lineTo(-150, -260);
      card.lineTo(-170, -232);
      card.lineTo(-225, -232);
      card.closePath();
      card.fillPath();

      // Top-Right Washi Tape (Diagonal pastel mint tape - Item 10)
      card.fillStyle(0x80cbc4, 0.88);
      card.beginPath();
      card.moveTo(150, -260);
      card.lineTo(205, -260);
      card.lineTo(225, -232);
      card.lineTo(170, -232);
      card.closePath();
      card.fillPath();

      modal.add(card);
    }

    // Render the saved outfit through the same wearing-art fallback contract as the live preview.
    const eq = DataManager.getInstance().getEquippedWardrobe();
    const renderEq = { ...eq };
    const textureExists = typeof this.textures?.exists === 'function'
      ? (key: string) => this.textures.exists(key)
      : undefined;
    const savedOutfitId = renderEq.dress || renderEq.top || renderEq.bottom;
    const savedOutfit = savedOutfitId ? wardrobeRegistry.get(savedOutfitId) : undefined;
    if (savedOutfitId && savedOutfit && !wardrobeRegistry.isWearingTextureReady(savedOutfitId, textureExists)) {
      delete renderEq[savedOutfit.slot as keyof EquippedWardrobe];
    }

    // Polaroid Character Display
    const currentSkin = this.skins[this.selectedSkinIndex];
    let texKey = currentSkin?.standSprite || 'player_stand';
    let isFullOutfit = false;

    const outfitId = wardrobeRegistry.getSingleBodyOutfitId(renderEq);
    if (outfitId) {
      const def = wardrobeRegistry.get(outfitId);
      if (
        def?.assets?.idle &&
        wardrobeRegistry.isCharacterArtworkCompatible(outfitId, currentSkin?.id) &&
        wardrobeRegistry.isWearingTextureReady(outfitId, textureExists) &&
        this.textures?.exists(def.assets.idle)
      ) {
        texKey = def.assets.idle;
        isFullOutfit = true;
      }
    }

    if (this.textures?.exists && this.textures.exists(texKey)) {
      const spr = this.add.image(0, isFullOutfit ? -70 : -90, texKey);
      if (typeof spr.setDepth === 'function') spr.setDepth(15);
      if (typeof spr.setScale === 'function') {
        spr.setScale(isFullOutfit ? 0.42 : 1.5);
      }
      if (!isFullOutfit && currentSkin?.tint && typeof spr.setTint === 'function') {
        spr.setTint(currentSkin.tint);
      }
      modal.add(spr);
    }

    // Dynamic tailored graphics: keep back accessories behind the wearing sprite
    // and front/garment graphics in front for every rendering mode.
    if (this.add.graphics) {
      if (isFullOutfit) {
        // OutfitRenderer maps the 512px wearing art to 0.23 * request.scale;
        // use the same equivalent scale here instead of the base-sprite scale.
        const fullOutfitAccessoryScale = 0.42 / 0.23;
        const backGraphics = this.add.graphics();
        if (typeof backGraphics.setDepth === 'function') backGraphics.setDepth(14);
        CharacterOutfitCompositor.renderPreviewBackAccessories(backGraphics, renderEq, {
          scale: fullOutfitAccessoryScale,
          coordinateSpace: 'fullSprite',
          offsetX: 0,
          offsetY: -70,
        });
        modal.add(backGraphics);

        const frontGraphics = this.add.graphics();
        if (typeof frontGraphics.setDepth === 'function') frontGraphics.setDepth(16);
        CharacterOutfitCompositor.renderPreviewFrontAccessories(frontGraphics, renderEq, {
          scale: fullOutfitAccessoryScale,
          coordinateSpace: 'fullSprite',
          offsetX: 0,
          offsetY: -70,
        });
        modal.add(frontGraphics);
      } else {
        const backGraphics = this.add.graphics();
        if (typeof backGraphics.setDepth === 'function') backGraphics.setDepth(14);
        CharacterOutfitCompositor.renderPreviewBackAccessories(backGraphics, renderEq, {
          scale: 1.5,
          offsetX: 0,
          offsetY: -90,
        });
        modal.add(backGraphics);

        const ootdGraphics = this.add.graphics();
        if (typeof ootdGraphics.setDepth === 'function') ootdGraphics.setDepth(16);
        CharacterOutfitCompositor.renderOutfit(ootdGraphics, renderEq, {
          scale: 1.5,
          offsetX: 0,
          offsetY: -90,
          includeBackAccessories: false,
        });
        modal.add(ootdGraphics);
      }
    }

    if (this.add.text) {
      // Photo Header Tag
      const headerTxt = this.add.text(0, -210, '📸 升夢小達人 • 今日穿搭 (OOTD)', {
        fontSize: '20px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof headerTxt.setOrigin === 'function') headerTxt.setOrigin(0.5);
      modal.add(headerTxt);

      // Photo Footer Title & Date
      const titleTxt = this.add.text(0, 120, `🌟 ${currentSkin?.name || '小探險家'}`, {
        fontSize: '26px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#1a2133',
        fontStyle: 'bold',
      });
      if (typeof titleTxt.setOrigin === 'function') titleTxt.setOrigin(0.5);
      modal.add(titleTxt);

      const subTxt = this.add.text(0, 155, `🎉 榮譽星數: ⭐ ${DataManager.getInstance().getTotalStars()} 顆星 | 潮流達人`, {
        fontSize: '17px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#555555',
        fontStyle: 'bold',
      });
      if (typeof subTxt.setOrigin === 'function') subTxt.setOrigin(0.5);
      modal.add(subTxt);

      // Golden Stamp
      if (this.add.graphics && this.add.text) {
        const stampG = this.add.graphics();
        stampG.lineStyle(2, 0xd97706, 0.9);
        stampG.strokeRoundedRect(68, 85, 100, 42, 8);
        modal.add(stampG);

        const stampText = this.add.text(118, 106, '🏆 潮流之星\n  滿分穿搭', {
          fontSize: '12px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#b45309',
          fontStyle: 'bold',
          align: 'center',
        });
        if (typeof stampText.setOrigin === 'function') stampText.setOrigin(0.5);
        if (typeof stampText.setRotation === 'function') stampText.setRotation(-0.10);
        modal.add(stampText);
      }
    }

    // Close Button
    const closeBtn = new CanvasButton(this, {
      x: 0,
      y: 205,
      width: 240,
      height: 52,
      text: '❌ 關閉相片',
      color: 'blue',
      fontSize: '20px',
      onClick: () => {
        this.closeOOTDPhotoModal();
      },
    });
    if (typeof closeBtn.setDepth === 'function') closeBtn.setDepth(210);
    modal.add(closeBtn);

    this.ootdCloseButton = closeBtn;
    this.ootdModal = modal;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(modal);
    }
  }

  public closeOOTDPhotoModal(): void {
    if (this.ootdCloseButton) {
      this.ootdCloseButton.destroy();
      this.ootdCloseButton = null;
    }
    if (this.ootdModal) {
      this.ootdModal.destroy();
      this.ootdModal = null;
      SoundManager.play('click');
    }
  }

  public refreshSceneState(): void {
    this.previewWardrobeState = this.getPersistedWardrobe();
    this.updatePreviewDisplay();
    if (!this.isLiveScene() && this.scene && typeof this.scene.restart === 'function') {
      // Compatibility for headless scene adapters; live Phaser keeps the modal and preview in place.
      this.scene.restart();
    }
  }

  private isLiveScene(): boolean {
    const systems = this.sys as unknown as { isActive?: () => boolean; settings?: { active?: boolean } };
    return typeof systems?.isActive === 'function'
      ? systems.isActive()
      : systems?.settings?.active === true;
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

  public showGlobalSyncToast(message: string = '✨ 已套用至全遊戲（地圖、跑酷與答題）'): void {
    if (!this.add) return;
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const compact = typeof window !== 'undefined'
      && (window.innerWidth < 1100 || window.innerHeight < 620);
    const toastY = compact ? 130 : 88;
    const toastContainer = this.add.container
      ? this.add.container(width / 2, toastY - 13)
      : new Phaser.GameObjects.Container(this, width / 2, toastY - 13);
    if (toastContainer.setDepth) toastContainer.setDepth(300);

    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(0x0f172a, 0.94);
      g.fillRoundedRect(-240, -22, 480, 44, 22);
      g.lineStyle(2, 0xf59e0b, 1.0);
      g.strokeRoundedRect(-240, -22, 480, 44, 22);
      toastContainer.add(g);
    }

    if (this.add.text) {
      const txt = this.add.text(0, 0, message, {
        fontSize: '17px',
        color: '#fef08a',
        fontStyle: 'bold',
        fontFamily: "'Noto Sans TC', sans-serif",
      });
      if (typeof txt.setOrigin === 'function') txt.setOrigin(0.5);
      toastContainer.add(txt);
    }

    if (this.prefersReducedMotion) {
      if (typeof toastContainer.setAlpha === 'function') toastContainer.setAlpha(1);
      if (this.time?.delayedCall) {
        this.time.delayedCall(1600, () => toastContainer.destroy());
      }
      return;
    }

    if (this.tweens?.add) {
      this.tweens.add({
        targets: toastContainer,
        alpha: { from: 0, to: 1 },
        y: toastY,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.time?.delayedCall) {
            this.time.delayedCall(1600, () => {
              if (this.tweens?.add && toastContainer) {
                this.tweens.add({
                  targets: toastContainer,
                  alpha: 0,
                  y: toastY - 23,
                  duration: 350,
                  onComplete: () => toastContainer.destroy(),
                });
              }
            });
          }
        },
      });
    }
  }

  public cleanup(): void {
    if (this.scale && typeof (this.scale as any).off === 'function') {
      (this.scale as any).off(Phaser.Scale.Events.RESIZE, this.handleScaleResize, this);
    }
    if (this.tabGameObjects) {
      this.tabGameObjects.forEach((obj) => {
        if (obj && typeof (obj as any).destroy === 'function') {
          (obj as any).destroy();
        }
      });
      this.tabGameObjects = [];
    }
    if (this.walkAnimTimer) {
      this.walkAnimTimer.remove();
      this.walkAnimTimer = null;
    }
    if (this.ootdModal) {
      this.ootdModal.destroy();
      this.ootdModal = null;
    }
    if (this.purchaseModal) {
      this.purchaseModal.destroy();
      this.purchaseModal = null;
    }
    this.wardrobePurchasePending = false;
    this.previewController?.destroy();
    this.previewController = null;
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
}
