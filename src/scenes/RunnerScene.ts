import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { QuizQuestion } from '../types';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { CanvasButton } from '../ui/CanvasButton';
import { CompanionPet } from '../ui/CompanionPet';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { PlayerAvatarService } from '../services/PlayerAvatarService';

export interface RunnerSessionStats {
  hintsUsed: number;
  mistakes: number;
  correctCount: number;
  startTime: number;
  collectedCoins?: number;
  collectedGems?: number;
}

export interface RunnerSceneInitData {
  stationId?: number;
  stationName?: string;
  questionIndex?: number;
  isStationComplete?: boolean;
  totalQuestions?: number;
  questions?: QuizQuestion[];
  sessionStats?: RunnerSessionStats;
  isRainbowRush?: boolean;
}

export interface SkinConfig {
  id: string;
  name: string;
  walk1Key: string;
  walk2Key: string;
  jumpKey: string;
  standKey: string;
  cheerKey: string;
  tint?: number;
  speedMultiplier: number;
  jumpMultiplier: number;
  magnetRadius: number;
}

export const SKIN_CONFIGS: Record<string, SkinConfig> = {
  adventurer: {
    id: 'adventurer',
    name: '冒險家 (Adventurer)',
    walk1Key: 'adventurer_walk1',
    walk2Key: 'adventurer_walk2',
    jumpKey: 'adventurer_jump',
    standKey: 'adventurer_stand',
    cheerKey: 'adventurer_cheer1',
    speedMultiplier: 1.0,
    jumpMultiplier: 1.0,
    magnetRadius: 100,
  },
  heroine: {
    id: 'heroine',
    name: '女英雄 (Heroine)',
    walk1Key: 'female_walk1',
    walk2Key: 'female_walk2',
    jumpKey: 'female_jump',
    standKey: 'female_stand',
    cheerKey: 'female_cheer1',
    speedMultiplier: 1.10,
    jumpMultiplier: 1.10,
    magnetRadius: 130,
  },
  female: {
    id: 'female',
    name: '女英雄 (Heroine)',
    walk1Key: 'female_walk1',
    walk2Key: 'female_walk2',
    jumpKey: 'female_jump',
    standKey: 'female_stand',
    cheerKey: 'female_cheer1',
    speedMultiplier: 1.10,
    jumpMultiplier: 1.10,
    magnetRadius: 130,
  },
  soldier: {
    id: 'soldier',
    name: '皇家士兵 (Soldier)',
    walk1Key: 'soldier_walk1',
    walk2Key: 'soldier_walk2',
    jumpKey: 'soldier_jump',
    standKey: 'soldier_stand',
    cheerKey: 'soldier_cheer1',
    speedMultiplier: 1.15,
    jumpMultiplier: 1.15,
    magnetRadius: 140,
  },
  knight: {
    id: 'knight',
    name: '聖光騎士 (Knight)',
    walk1Key: 'player_walk1',
    walk2Key: 'player_walk2',
    jumpKey: 'player_jump',
    standKey: 'player_stand',
    cheerKey: 'player_cheer1',
    tint: 0xc8e6ff, // Glistening cyan-silver armor tint
    speedMultiplier: 1.10,
    jumpMultiplier: 1.25,
    magnetRadius: 160,
  },
  ninja: {
    id: 'ninja',
    name: '影之忍者 (Ninja)',
    walk1Key: 'player_walk1',
    walk2Key: 'player_walk2',
    jumpKey: 'player_jump',
    standKey: 'player_stand',
    cheerKey: 'player_cheer1',
    tint: 0x4a4a5a, // Dark shadow stealth tint
    speedMultiplier: 1.30,
    jumpMultiplier: 1.20,
    magnetRadius: 190,
  },
  zombie: {
    id: 'zombie',
    name: '古堡殭屍 (Zombie)',
    walk1Key: 'zombie_walk1',
    walk2Key: 'zombie_walk2',
    jumpKey: 'zombie_jump',
    standKey: 'zombie_stand',
    cheerKey: 'zombie_cheer1',
    speedMultiplier: 0.95,
    jumpMultiplier: 1.15,
    magnetRadius: 140,
  },
};

export interface RunnerWorldItem {
  id: string;
  type: 'coin' | 'gem' | 'obstacle' | 'springboard' | 'platform' | 'chest';
  worldX: number;
  worldY: number;
  collected?: boolean;
  gameObject?: Phaser.GameObjects.GameObject | any;
}

/**
 * RunnerScene
 * 2D Platformer Runner Reward Scene for P1 Adventure (升夢大冒險).
 * Runs an exhilarating 4-6 second reward sequence between questions with:
 * - Parallax scrolling background (sky gradient, drifting clouds, distant hills, floating platforms, ground layer)
 * - Animated player character using equipped skins (Adventurer, Heroine, Soldier, Knight, Ninja) with stat perks
 * - Collectible floating coins (🪙) and gems (💎) with magnet pull & sparkle burst feedback
 * - Springboards launching the player into super-jumps
 * - Final victory treasure chest with explosion of rewards and celebration audio
 * - Round-trip navigation returning to QuestionScene (next question) or ResultScene (station complete)
 */
export class RunnerScene extends Phaser.Scene {
  // Navigation & Session Payload
  public stationId: number = 1;
  public stationName: string = '冒險關卡';
  public questionIndex: number = 0;
  public isStationComplete: boolean = false;
  public totalQuestions: number = 3;
  public questions: QuizQuestion[] = [];
  public sessionStats: RunnerSessionStats = {
    hintsUsed: 0,
    mistakes: 0,
    correctCount: 0,
    startTime: 0,
    collectedCoins: 0,
    collectedGems: 0,
  };

  // State & Kinematic Platformer Physics
  public isTransitioning: boolean = false;
  public isCelebrating: boolean = false;
  public isJumping: boolean = false;
  public isSuperJumping: boolean = false;
  public isGrounded: boolean = true;
  public springboardCooldown: number = 0;
  public playerVelocityY: number = 0;
  public playerY: number = 540;
  public currentGroundY: number = 540;
  public coyoteTimer: number = 0;
  public jumpBufferTimer: number = 0;
  public distanceRun: number = 0;
  public targetTrackDistance: number = 2800;
  public baseSpeed: number = 380;
  public currentSpeed: number = 380;
  public playerBaselineY: number = 540;
  public playerScreenX: number = 260;
  public isLeftDown: boolean = false;
  public isRightDown: boolean = false;
  public joystickActive: boolean = false;
  public joystickPointerId: number | null = null;
  public joystickBaseX: number = 130;
  public joystickBaseY: number = 610;
  public joystickRadius: number = 52;
  public joystickAxisX: number = 0;
  public joystickBaseGraphics: Phaser.GameObjects.Graphics | any = null;
  public joystickThumbGraphics: Phaser.GameObjects.Graphics | any = null;
  public virtualGamepadContainer: Phaser.GameObjects.Container | any = null;
  public leftBtn: CanvasButton | null = null;
  public rightBtn: CanvasButton | null = null;
  public jumpBtn: CanvasButton | null = null;
  public petCompanionObject: Phaser.GameObjects.Text | any = null;
  public companionPet: CompanionPet | any = null;
  public hasDoubleJumped: boolean = false;
  public hasShield: boolean = false;
  public shieldGraphics: Phaser.GameObjects.Graphics | any = null;
  public coinComboCount: number = 0;

  // Skin & Perks
  public skinConfig: SkinConfig = SKIN_CONFIGS.adventurer;
  public currentWalkFrame: number = 1;
  public stepTimer: number = 0;
  public stumbleTimer: number = 0;

  // Game Objects & Layers
  public playerSprite: Phaser.GameObjects.Image | any = null;
  public runnerWardrobeGraphics: Phaser.GameObjects.Graphics | any = null;
  public runnerWardrobeWings: Phaser.GameObjects.Text | any = null;
  public runnerWardrobeDress: Phaser.GameObjects.Text | any = null;
  public runnerWardrobeTop: Phaser.GameObjects.Text | any = null;
  public runnerWardrobeBottom: Phaser.GameObjects.Text | any = null;
  public runnerWardrobeBackpack: Phaser.GameObjects.Text | any = null;
  public runnerWardrobeGlasses: Phaser.GameObjects.Text | any = null;
  public runnerWardrobeHat: Phaser.GameObjects.Text | any = null;
  public playerShadow: Phaser.GameObjects.Graphics | any = null;
  public skyBackground: Phaser.GameObjects.Rectangle | any = null;
  public clouds: (Phaser.GameObjects.Image | any)[] = [];
  public hillsGraphics: Phaser.GameObjects.Graphics | any = null;
  public groundGraphics: Phaser.GameObjects.Graphics | any = null;
  public worldItems: RunnerWorldItem[] = [];
  public chestObject: Phaser.GameObjects.Image | any = null;

  // HUD
  public hudContainer: Phaser.GameObjects.Container | any = null;
  public coinCounterText: Phaser.GameObjects.Text | any = null;
  public gemCounterText: Phaser.GameObjects.Text | any = null;
  public progressBarFill: Phaser.GameObjects.Graphics | any = null;
  public miniRunnerIcon: Phaser.GameObjects.Image | Phaser.GameObjects.Text | any = null;
  public skipButton: CanvasButton | null = null;
  public celebrationBanner: Phaser.GameObjects.Container | any = null;
  public isRainbowRush: boolean = false;

  constructor() {
    super({ key: 'RunnerScene' });
  }

  /**
   * Scene initialization hook with payload from QuestionScene
   */
  public init(data?: RunnerSceneInitData): void {
    this.stationId = data?.stationId ?? 1;
    this.stationName = data?.stationName ?? '冒險關卡';
    this.questionIndex = data?.questionIndex ?? 0;
    this.isStationComplete = data?.isStationComplete ?? false;
    this.totalQuestions = data?.totalQuestions ?? 3;
    this.questions = data?.questions ? [...data.questions] : [];
    this.isRainbowRush = Boolean(data?.isRainbowRush);
    this.sessionStats = data?.sessionStats
      ? { ...data.sessionStats }
      : {
          hintsUsed: 0,
          mistakes: 0,
          correctCount: 0,
          startTime: Date.now(),
          collectedCoins: 0,
          collectedGems: 0,
        };

    if (this.sessionStats.collectedCoins === undefined) {
      this.sessionStats.collectedCoins = 0;
    }
    if (this.sessionStats.collectedGems === undefined) {
      this.sessionStats.collectedGems = 0;
    }

    // Reset runtime states
    this.isTransitioning = false;
    this.isCelebrating = false;
    this.isJumping = false;
    this.isSuperJumping = false;
    this.hasDoubleJumped = false;
    this.stumbleTimer = 0;

    try {
      this.hasShield = DataManager.getInstance().getGadgetCount('shield') > 0;
    } catch {
      this.hasShield = false;
    }
    this.playerScreenX = 260;
    this.isLeftDown = false;
    this.isRightDown = false;
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickAxisX = 0;
    this.worldItems = [];
    this.clouds = [];
    this.stepTimer = 0;
    this.currentWalkFrame = 1;

    // Resolve skin perks
    this.resolveEquippedSkin();
  }

  /**
   * Resolves skin perks and animation keys based on DataManager profile
   */
  public resolveEquippedSkin(): void {
    try {
      const profile = DataManager.getInstance().getProfile();
      const skinId = (profile?.equippedSkin || 'adventurer').toLowerCase();
      this.skinConfig = SKIN_CONFIGS[skinId] || SKIN_CONFIGS.adventurer;
    } catch {
      this.skinConfig = SKIN_CONFIGS.adventurer;
    }

    this.currentSpeed = this.baseSpeed * this.skinConfig.speedMultiplier;
  }

  /**
   * Main Scene creation hook
   */
  public create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    // 0. Ensure procedural fallback textures exist
    this.generateProceduralTextures();

    // 1. Build Parallax Environment
    this.createParallaxBackground(width, height);

    // 2. Build Track Course Entities (Coins, Gems, Obstacles, Springboards, Chest)
    this.buildTrackCourse();

    // 3. Build Player Character & Animation Shadows
    this.createPlayerCharacter();

    // 3.1 Initialize Shield & Companion Pet
    try {
      this.hasShield = DataManager.getInstance().getGadgetCount('shield') > 0;
      if (this.hasShield && this.add?.graphics) {
        this.shieldGraphics = this.add.graphics();
        this.shieldGraphics.lineStyle(3, 0x00ffff, 0.85);
        this.shieldGraphics.fillStyle(0x00ffff, 0.25);
        this.shieldGraphics.fillCircle(this.playerScreenX, this.playerBaselineY - 30, 48);
        this.shieldGraphics.strokeCircle(this.playerScreenX, this.playerBaselineY - 30, 48);
        this.shieldGraphics.setDepth(32);
      }
    } catch {
      this.hasShield = false;
    }

    try {
      const equippedPet = DataManager.getInstance().getProfile().equippedPet;
      if (equippedPet) {
        this.companionPet = new CompanionPet(this, {
          petId: equippedPet,
          x: this.playerScreenX - 45,
          y: this.playerBaselineY - 35,
        });
      }
    } catch {}

    // 4. Build HUD & Controls (Currency, Progress Bar, Skip Button)
    this.createHUD(width, height);

    // 5. Build Mobile Virtual Gamepad (Left/Right Steering & Jump Button)
    this.createVirtualGamepad(width, height);

    // Enable multi-touch for 2+ simultaneous fingers (Left joystick + Right jump)
    if (this.input && typeof (this.input as any).addPointer === 'function') {
      try {
        (this.input as any).addPointer(2);
      } catch {
        // Safe ignore if pointers already exist
      }
    }

    // 6. Register Touch & Keyboard Controls (Dual Steering & Kinematic Jump)
    if (this.input) {
      this.input.on('pointerdown', (pointer: any) => {
        // Exclude skip button area (top-right) and virtual gamepad area (bottom left/right)
        if (pointer && pointer.y < 80 && pointer.x > width - 160) return; // Skip button
        if (pointer && pointer.x <= 340 && pointer.y >= height - 210) return; // Virtual Joystick area
        if (pointer && pointer.x >= width - 180 && pointer.y >= height - 150) return; // Jump button area
        if (pointer && pointer.y > height - 110) return; // Virtual D-pad / Jump area
        this.handleJumpInput();
      });

      if (this.input.keyboard) {
        // Horizontal Movement Keys (A / D / Left / Right)
        this.input.keyboard.on('keydown-A', () => { this.isLeftDown = true; });
        this.input.keyboard.on('keyup-A', () => { this.isLeftDown = false; });
        this.input.keyboard.on('keydown-LEFT', () => { this.isLeftDown = true; });
        this.input.keyboard.on('keyup-LEFT', () => { this.isLeftDown = false; });

        this.input.keyboard.on('keydown-D', () => { this.isRightDown = true; });
        this.input.keyboard.on('keyup-D', () => { this.isRightDown = false; });
        this.input.keyboard.on('keydown-RIGHT', () => { this.isRightDown = true; });
        this.input.keyboard.on('keyup-RIGHT', () => { this.isRightDown = false; });

        // Jump Keys
        this.input.keyboard.on('keydown-SPACE', () => this.handleJumpInput());
        this.input.keyboard.on('keydown-UP', () => this.handleJumpInput());
        this.input.keyboard.on('keydown-W', () => this.handleJumpInput());
      }
    }

    // 6. Play startup runner sound
    try {
      SoundManager.play('jump');
    } catch {
      // Safe ignore
    }
  }

  /**
   * Generates procedural fallback textures if missing
   */
  public generateProceduralTextures(): void {
    if (!this.textures) return;

    const createSafeCanvasTexture = (
      key: string,
      w: number,
      h: number,
      drawFn: (ctx: CanvasRenderingContext2D) => void
    ) => {
      try {
        if (this.textures.exists && this.textures.exists(key)) return;
        if (typeof document === 'undefined' || !document.createElement) return;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawFn(ctx);
          if (typeof this.textures.addCanvas === 'function') {
            this.textures.addCanvas(key, canvas);
          }
        }
      } catch {
        // Safe ignore in headless/test environments
      }
    };

    // Cloud
    createSafeCanvasTexture('cloud_procedural', 140, 80, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(45, 50, 26, 0, Math.PI * 2);
      ctx.arc(75, 40, 32, 0, Math.PI * 2);
      ctx.arc(105, 50, 24, 0, Math.PI * 2);
      ctx.arc(30, 56, 18, 0, Math.PI * 2);
      ctx.arc(115, 56, 16, 0, Math.PI * 2);
      ctx.fill();
    });

    // Coin
    createSafeCanvasTexture('coin_procedural', 36, 36, (ctx) => {
      ctx.fillStyle = '#f5a623';
      ctx.beginPath();
      ctx.arc(18, 18, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(18, 18, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b5730a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 18, 19);
    });

    // Gem
    createSafeCanvasTexture('gem_procedural', 36, 36, (ctx) => {
      ctx.fillStyle = '#00c6ff';
      ctx.beginPath();
      ctx.moveTo(18, 4);
      ctx.lineTo(32, 14);
      ctx.lineTo(18, 32);
      ctx.lineTo(4, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(18, 7);
      ctx.lineTo(26, 14);
      ctx.lineTo(18, 26);
      ctx.closePath();
      ctx.fill();
    });

    // Sparkle
    createSafeCanvasTexture('particle_sparkle', 20, 20, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(10, 20);
      ctx.moveTo(0, 10);
      ctx.lineTo(20, 10);
      ctx.stroke();
    });

    // Closed Chest
    createSafeCanvasTexture('chest_closed', 64, 52, (ctx) => {
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(6, 16, 52, 32);
      ctx.fillStyle = '#a06a35';
      ctx.beginPath();
      ctx.arc(32, 18, 26, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(6, 14, 52, 6);
      ctx.fillRect(16, 8, 8, 40);
      ctx.fillRect(40, 8, 8, 40);
      ctx.fillStyle = '#ffe066';
      ctx.fillRect(28, 22, 8, 12);
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(30, 26, 4, 6);
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 16, 52, 32);
    });

    // Open Chest
    createSafeCanvasTexture('chest_open', 64, 58, (ctx) => {
      ctx.fillStyle = '#6d431d';
      ctx.beginPath();
      ctx.ellipse(32, 12, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      const glow = ctx.createRadialGradient(32, 22, 4, 32, 22, 26);
      glow.addColorStop(0, '#ffffa0');
      glow.addColorStop(0.7, '#ffd700');
      glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(8, 0, 48, 30);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(24, 20, 7, 0, Math.PI * 2);
      ctx.arc(38, 18, 8, 0, Math.PI * 2);
      ctx.arc(32, 22, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(32, 12);
      ctx.lineTo(37, 18);
      ctx.lineTo(32, 24);
      ctx.lineTo(27, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(6, 24, 52, 28);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(16, 24, 8, 28);
      ctx.fillRect(40, 24, 8, 28);
      ctx.fillRect(6, 22, 52, 4);
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 24, 52, 28);
    });

    // Springboard Up
    createSafeCanvasTexture('springboard_up', 48, 36, (ctx) => {
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(4, 30, 40, 6);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, 30);
      ctx.lineTo(32, 24);
      ctx.lineTo(16, 18);
      ctx.lineTo(32, 12);
      ctx.lineTo(24, 6);
      ctx.stroke();
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(6, 2, 36, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(18, 4, 12, 2);
    });

    // Springboard Down
    createSafeCanvasTexture('springboard_down', 48, 24, (ctx) => {
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(4, 18, 40, 6);
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 18);
      ctx.lineTo(34, 14);
      ctx.lineTo(14, 10);
      ctx.stroke();
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(6, 4, 36, 6);
    });

    // Obstacle Rock
    createSafeCanvasTexture('obstacle_rock', 48, 40, (ctx) => {
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.moveTo(6, 38);
      ctx.lineTo(14, 14);
      ctx.lineTo(26, 6);
      ctx.lineTo(40, 18);
      ctx.lineTo(44, 38);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#95a5a6';
      ctx.beginPath();
      ctx.moveTo(16, 16);
      ctx.lineTo(26, 8);
      ctx.lineTo(32, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(10, 34, 12, 4);
    });

    // Platform
    createSafeCanvasTexture('runner_platform', 140, 36, (ctx) => {
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(0, 8, 140, 28, [0, 0, 8, 8]) : ctx.fillRect(0, 8, 140, 28);
      ctx.fill();
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, 0, 140, 10);
      ctx.fillStyle = '#81c784';
      ctx.fillRect(0, 0, 140, 3);
    });
  }

  /**
   * Creates the multi-layer parallax scrolling background
   */
  public createParallaxBackground(width: number, height: number): void {
    if (!this.add) return;

    // 1. Sky Theme based on stationId
    let skyTop = 0x3a7bd5;

    if (this.stationId <= 3) {
      // Daybreak Island
      skyTop = 0x2193b0;
    } else if (this.stationId <= 6) {
      // Sunset Valley
      skyTop = 0xcc2b5e;
    } else {
      // Cosmic Night
      skyTop = 0x0f2027;
    }

    if (this.add.rectangle) {
      this.skyBackground = this.add.rectangle(width / 2, height / 2, width, height, skyTop);
    }

    // 2. Distant Clouds Layer
    const cloudYPositions = [100, 150, 190, 120, 170];
    const cloudXPositions = [120, 380, 680, 980, 1220];

    for (let i = 0; i < cloudXPositions.length; i++) {
      let cloud: any = null;
      if (this.add.image) {
        cloud = this.add.image(cloudXPositions[i], cloudYPositions[i], 'cloud_procedural');
        if (cloud.setAlpha) cloud.setAlpha(0.65);
        if (cloud.setScale) cloud.setScale(0.8 + (i % 3) * 0.2);
        this.clouds.push(cloud);
      }
    }

    // 3. Distant Mountain Ridges / Hills Layer
    if (this.add.graphics) {
      this.hillsGraphics = this.add.graphics();
      this.redrawDistantHills(0, width, height);
    }

    // 4. Foreground Ground & Track Layer
    if (this.add.graphics) {
      this.groundGraphics = this.add.graphics();
      this.redrawGroundLayer(0, width, height);
    }
  }

  /**
   * Draws distant mountains & hills
   */
  public redrawDistantHills(offsetX: number, width: number, height: number): void {
    if (!this.hillsGraphics) return;
    this.hillsGraphics.clear();

    const baseY = height - 200;
    this.hillsGraphics.fillStyle(0x2d5a3d, 0.45);
    this.hillsGraphics.beginPath();
    this.hillsGraphics.moveTo(0, height);

    const step = 160;
    const hillPoints = Math.ceil(width / step) + 3;
    for (let i = 0; i <= hillPoints; i++) {
      const x = i * step - (offsetX % step);
      const hillHeight = Math.sin((i + Math.floor(offsetX / step)) * 1.3) * 55 + 60;
      this.hillsGraphics.lineTo(x, baseY - hillHeight);
    }

    this.hillsGraphics.lineTo(width + 100, height);
    this.hillsGraphics.closePath();
    this.hillsGraphics.fillPath();

    // Midground Hills
    this.hillsGraphics.fillStyle(0x1e4620, 0.7);
    this.hillsGraphics.beginPath();
    this.hillsGraphics.moveTo(0, height);

    const midStep = 120;
    const midPoints = Math.ceil(width / midStep) + 3;
    for (let i = 0; i <= midPoints; i++) {
      const x = i * midStep - ((offsetX * 1.5) % midStep);
      const hillHeight = Math.cos((i + Math.floor((offsetX * 1.5) / midStep)) * 1.1) * 40 + 40;
      this.hillsGraphics.lineTo(x, baseY + 40 - hillHeight);
    }

    this.hillsGraphics.lineTo(width + 100, height);
    this.hillsGraphics.closePath();
    this.hillsGraphics.fillPath();
  }

  /**
   * Draws foreground ground track
   */
  public redrawGroundLayer(offsetX: number, width: number, height: number): void {
    if (!this.groundGraphics) return;
    this.groundGraphics.clear();

    const groundY = this.playerBaselineY + 36;
    const groundDepth = height - groundY;

    // Dirt Layer
    this.groundGraphics.fillStyle(0x5c3d2e, 1.0);
    this.groundGraphics.fillRect(0, groundY, width, groundDepth);

    // Deep Dirt Texture Stripes
    this.groundGraphics.fillStyle(0x442a1e, 0.4);
    const tileW = 60;
    const count = Math.ceil(width / tileW) + 2;
    for (let i = 0; i < count; i++) {
      const x = i * tileW - (offsetX % tileW);
      this.groundGraphics.fillRect(x, groundY + 16, tileW - 10, groundDepth);
    }

    // Lush Top Grass
    this.groundGraphics.fillStyle(0x43a047, 1.0);
    this.groundGraphics.fillRect(0, groundY, width, 14);

    // Bright Grass Highlight
    this.groundGraphics.fillStyle(0x66bb6a, 1.0);
    this.groundGraphics.fillRect(0, groundY, width, 4);

    // Grass Tuft Blades
    this.groundGraphics.fillStyle(0x81c784, 1.0);
    for (let i = 0; i < count * 2; i++) {
      const tuftX = i * (tileW / 2) - (offsetX % (tileW / 2));
      this.groundGraphics.fillRect(tuftX, groundY - 4, 4, 4);
    }
  }

  /**
   * Spawns course entities along the virtual track
   */
  public buildTrackCourse(): void {
    this.worldItems = [];

    // 1. Initial sprint coins (3 coins in arc)
    this.addCoin(500, this.playerBaselineY - 10);
    this.addCoin(570, this.playerBaselineY - 35);
    this.addCoin(640, this.playerBaselineY - 10);

    // 2. Obstacle 1 (Rock) + Jump Coins
    this.addObstacle(820, this.playerBaselineY + 12);
    this.addCoin(800, this.playerBaselineY - 60);
    this.addCoin(860, this.playerBaselineY - 75);
    this.addCoin(920, this.playerBaselineY - 60);

    // 3. Springboard 1 -> Floating Platform -> Gem 1
    this.addSpringboard(1200, this.playerBaselineY + 16);
    this.addPlatform(1340, this.playerBaselineY - 100);
    this.addGem(1340, this.playerBaselineY - 150);
    this.addCoin(1270, this.playerBaselineY - 110);
    this.addCoin(1410, this.playerBaselineY - 110);

    // 4. Obstacle 2 + Midground Coin Arc
    this.addObstacle(1720, this.playerBaselineY + 12);
    this.addCoin(1680, this.playerBaselineY - 50);
    this.addCoin(1740, this.playerBaselineY - 70);
    this.addCoin(1800, this.playerBaselineY - 50);

    // 5. Springboard 2 -> Super Jump to Gem 2
    this.addSpringboard(2050, this.playerBaselineY + 16);
    this.addGem(2120, this.playerBaselineY - 160);
    this.addCoin(2080, this.playerBaselineY - 110);
    this.addCoin(2160, this.playerBaselineY - 110);

    // 6. Goal Podium & Golden Treasure Chest
    this.addChest(this.targetTrackDistance - 200, this.playerBaselineY + 8);
  }

  public addCoin(worldX: number, worldY: number): void {
    let img: any = null;
    if (this.add?.image) {
      img = this.add.image(worldX, worldY, 'coin_procedural');
      if (img.setScale) img.setScale(0.9);
      if (img.setDepth) img.setDepth(10);
    }
    this.worldItems.push({
      id: `coin_${worldX}`,
      type: 'coin',
      worldX,
      worldY,
      collected: false,
      gameObject: img,
    });
  }

  public addGem(worldX: number, worldY: number): void {
    let img: any = null;
    if (this.add?.image) {
      img = this.add.image(worldX, worldY, 'gem_procedural');
      if (img.setScale) img.setScale(1.1);
      if (img.setDepth) img.setDepth(10);
    }
    this.worldItems.push({
      id: `gem_${worldX}`,
      type: 'gem',
      worldX,
      worldY,
      collected: false,
      gameObject: img,
    });
  }

  public addObstacle(worldX: number, worldY: number): void {
    let img: any = null;
    if (this.add?.image) {
      img = this.add.image(worldX, worldY, 'obstacle_rock');
      if (img.setScale) img.setScale(1.0);
      if (img.setDepth) img.setDepth(8);
    }
    this.worldItems.push({
      id: `obstacle_${worldX}`,
      type: 'obstacle',
      worldX,
      worldY,
      gameObject: img,
    });
  }

  public addSpringboard(worldX: number, worldY: number): void {
    let img: any = null;
    if (this.add?.image) {
      img = this.add.image(worldX, worldY, 'springboard_up');
      if (img.setScale) img.setScale(1.0);
      if (img.setDepth) img.setDepth(8);
    }
    this.worldItems.push({
      id: `springboard_${worldX}`,
      type: 'springboard',
      worldX,
      worldY,
      gameObject: img,
    });
  }

  public addPlatform(worldX: number, worldY: number): void {
    let img: any = null;
    if (this.add?.image) {
      img = this.add.image(worldX, worldY, 'runner_platform');
      if (img.setScale) img.setScale(1.0);
      if (img.setDepth) img.setDepth(7);
    }
    this.worldItems.push({
      id: `platform_${worldX}`,
      type: 'platform',
      worldX,
      worldY,
      gameObject: img,
    });
  }

  public addChest(worldX: number, worldY: number): void {
    let img: any = null;
    if (this.add?.image) {
      img = this.add.image(worldX, worldY, 'chest_closed');
      if (img.setScale) img.setScale(1.2);
      if (img.setDepth) img.setDepth(12);
    }
    this.chestObject = img;
    this.worldItems.push({
      id: `chest_${worldX}`,
      type: 'chest',
      worldX,
      worldY,
      gameObject: img,
    });
  }

  /**
   * Creates the player character sprite, shadows, and applies skin perks/tints
   */
  public createPlayerCharacter(): void {
    if (!this.add) return;

    // 1. Player Drop Shadow
    if (this.add.graphics) {
      this.playerShadow = this.add.graphics();
      this.playerShadow.fillStyle(0x000000, 0.28);
      this.playerShadow.fillEllipse(this.playerScreenX, this.playerBaselineY + 36, 44, 14);
      if (this.playerShadow.setDepth) this.playerShadow.setDepth(5);
    }

    // 2. Player Sprite
    if (this.add.image) {
      const textureInfo = PlayerAvatarService.getInstance().getTextureKey('run', this);
      this.playerSprite = this.add.image(
        this.playerScreenX,
        this.playerBaselineY,
        textureInfo.textureKey
      );

      if (this.playerSprite.setDepth) {
        this.playerSprite.setDepth(15);
      }
      if (this.playerSprite.setScale) {
        if (textureInfo.isFullSprite) {
          this.playerSprite.setScale(0.48);
        } else {
          this.playerSprite.setScale(0.9);
        }
      }

      // Apply skin tint perk (e.g. Knight, Ninja)
      if (textureInfo.tint !== undefined && typeof this.playerSprite.setTint === 'function') {
        this.playerSprite.setTint(textureInfo.tint);
      }
    }

    // 2.1 Anatomical Wardrobe Layers for Player
    try {
      const dm = DataManager.getInstance();
      const eq = dm.getEquippedWardrobe();

      // Wings (behind player, depth 12)
      if (this.add.text) {
        let wingsIcon = '';
        if (eq.wings) {
          const w = dm.getWardrobeItems('accessory').find((i) => i.id === eq.wings) || { icon: '🪽' };
          wingsIcon = w.icon;
        } else if (eq.accessory === 'angel_wings') {
          wingsIcon = '🪽';
        }
        if (wingsIcon) {
          this.runnerWardrobeWings = this.add.text(this.playerScreenX, this.playerBaselineY + 2, wingsIcon, { fontSize: '28px' });
          if (this.runnerWardrobeWings.setOrigin) this.runnerWardrobeWings.setOrigin(0.5);
          if (this.runnerWardrobeWings.setDepth) this.runnerWardrobeWings.setDepth(12);
        }

        // Dress (depth 16)
        if (eq.dress) {
          const w = dm.getWardrobeItems('dress').find((i) => i.id === eq.dress);
          if (w) {
            this.runnerWardrobeDress = this.add.text(this.playerScreenX, this.playerBaselineY + 12, w.icon, { fontSize: '26px' });
            if (this.runnerWardrobeDress.setOrigin) this.runnerWardrobeDress.setOrigin(0.5);
            if (this.runnerWardrobeDress.setDepth) this.runnerWardrobeDress.setDepth(16);
          }
        }

        // Top (depth 16)
        if (eq.top) {
          const w = dm.getWardrobeItems('top').find((i) => i.id === eq.top);
          if (w) {
            this.runnerWardrobeTop = this.add.text(this.playerScreenX, this.playerBaselineY + 6, w.icon, { fontSize: '24px' });
            if (this.runnerWardrobeTop.setOrigin) this.runnerWardrobeTop.setOrigin(0.5);
            if (this.runnerWardrobeTop.setDepth) this.runnerWardrobeTop.setDepth(16);
          }
        }

        // Bottom (depth 17)
        if (eq.bottom) {
          const w = dm.getWardrobeItems('bottom').find((i) => i.id === eq.bottom);
          if (w) {
            this.runnerWardrobeBottom = this.add.text(this.playerScreenX, this.playerBaselineY + 20, w.icon, { fontSize: '22px' });
            if (this.runnerWardrobeBottom.setOrigin) this.runnerWardrobeBottom.setOrigin(0.5);
            if (this.runnerWardrobeBottom.setDepth) this.runnerWardrobeBottom.setDepth(17);
          }
        }

        // Backpack (depth 18)
        if (eq.accessory === 'star_backpack') {
          this.runnerWardrobeBackpack = this.add.text(this.playerScreenX + 18, this.playerBaselineY + 8, '🎒', { fontSize: '20px' });
          if (this.runnerWardrobeBackpack.setOrigin) this.runnerWardrobeBackpack.setOrigin(0.5);
          if (this.runnerWardrobeBackpack.setDepth) this.runnerWardrobeBackpack.setDepth(18);
        }

        // Glasses (depth 19)
        if (eq.accessory === 'star_glasses') {
          this.runnerWardrobeGlasses = this.add.text(this.playerScreenX, this.playerBaselineY - 14, '👓', { fontSize: '18px' });
          if (this.runnerWardrobeGlasses.setOrigin) this.runnerWardrobeGlasses.setOrigin(0.5);
          if (this.runnerWardrobeGlasses.setDepth) this.runnerWardrobeGlasses.setDepth(19);
        }

        // Hat (depth 20)
        let hatIcon = '';
        if (eq.hat) {
          const w = dm.getWardrobeItems('accessory').find((i) => i.id === eq.hat);
          if (w) hatIcon = w.icon;
        } else if (eq.accessory && ['cat_ears', 'scholar_cap', 'tram_hat'].includes(eq.accessory)) {
          const w = dm.getWardrobeItems('accessory').find((i) => i.id === eq.accessory);
          if (w) hatIcon = w.icon;
        }
        if (hatIcon) {
          this.runnerWardrobeHat = this.add.text(this.playerScreenX, this.playerBaselineY - 34, hatIcon, { fontSize: '26px' });
          if (this.runnerWardrobeHat.setOrigin) this.runnerWardrobeHat.setOrigin(0.5);
          if (this.runnerWardrobeHat.setDepth) this.runnerWardrobeHat.setDepth(20);
        }
      }

      // Dynamic Tailored Vector Graphics for Runner
      if (this.add.graphics) {
        this.runnerWardrobeGraphics = this.add.graphics();
        if (typeof this.runnerWardrobeGraphics.setDepth === 'function') this.runnerWardrobeGraphics.setDepth(16);
        CharacterOutfitCompositor.renderOutfit(this.runnerWardrobeGraphics, eq, {
          scale: 0.9,
          offsetX: this.playerScreenX,
          offsetY: this.playerBaselineY,
        });
      }
    } catch {}

    // 3. Companion Pet (if unlocked via 3-6-9 milestone and no shop pet equipped)
    try {
      if (!this.companionPet) {
        const petData = DataManager.getInstance().getPetCompanion();
        if (petData.stage !== 'none' && this.add.text) {
          const petObj = this.add.text(
            this.playerScreenX - 45,
            this.playerBaselineY - 35,
            petData.icon,
            { fontSize: '32px' }
          );
          if (petObj.setDepth) petObj.setDepth(18);
          this.petCompanionObject = petObj;
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Creates HUD: Currency counts, distance progress bar, station indicator, skip button
   */
  public createHUD(width: number, _height: number): void {
    if (!this.add) return;

    this.hudContainer = this.add.container
      ? this.add.container(0, 0)
      : new Phaser.GameObjects.Container(this, 0, 0);

    if (this.hudContainer.setDepth) {
      this.hudContainer.setDepth(100);
    }

    // 1. Top Left Currency Bar & Badge
    if (this.add.graphics) {
      const badgeG = this.add.graphics();
      badgeG.fillStyle(0x0a1128, 0.75);
      badgeG.fillRoundedRect(24, 20, 310, 54, 16);
      badgeG.lineStyle(2, 0x4a90e2, 0.9);
      badgeG.strokeRoundedRect(24, 20, 310, 54, 16);
      this.hudContainer.add(badgeG);
    }

    const currentCoins = DataManager.getInstance().getProfile().coins;
    const currentGems = DataManager.getInstance().getProfile().gems;

    if (this.add.text) {
      this.coinCounterText = this.add.text(42, 34, `🪙 ${currentCoins}`, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      this.hudContainer.add(this.coinCounterText);

      this.gemCounterText = this.add.text(180, 34, `💎 ${currentGems}`, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#00e5ff',
        fontStyle: 'bold',
      });
      this.hudContainer.add(this.gemCounterText);
    }

    // 2. Top Center Distance Progress Bar
    const barW = 340;
    const barH = 18;
    const barX = width / 2 - barW / 2;
    const barY = 32;

    if (this.add.graphics) {
      const progTrack = this.add.graphics();
      progTrack.fillStyle(0x0e1320, 0.75);
      progTrack.fillRoundedRect(barX, barY, barW, barH, 9);
      progTrack.lineStyle(2, 0xffd700, 0.85);
      progTrack.strokeRoundedRect(barX, barY, barW, barH, 9);
      this.hudContainer.add(progTrack);

      this.progressBarFill = this.add.graphics();
      this.hudContainer.add(this.progressBarFill);
    }

    if (this.add.text) {
      const flagText = this.add.text(barX + barW + 10, barY - 4, '🏆', {
        fontSize: '22px',
      });
      this.hudContainer.add(flagText);

      // Station badge
      const badgeText = this.add.text(
        width / 2,
        64,
        `🏝️ 第 ${this.stationId} 關 - 衝刺獎勵`,
        {
          fontSize: '18px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#ffffff',
          fontStyle: 'bold',
        }
      );
      if (badgeText.setOrigin) badgeText.setOrigin(0.5);
      this.hudContainer.add(badgeText);
    }

    // 3. Top Right Skip Button (⏩ 跳過)
    this.skipButton = new CanvasButton(this, {
      x: width - 110,
      y: 47,
      width: 145,
      height: 48,
      text: '⏩ 跳過',
      color: 'yellow',
      fontSize: '20px',
      onClick: () => {
        this.skipRunner();
      },
    });

    // 4. Interactive Jump Tutorial Prompt ("🕹️ 滑動搖桿左右移動 🦘 按跳躍鍵拾取寶石！")
    if (this.add.container) {
      const hintContainer = this.add.container(width / 2, _height - 54);
      if (this.add.graphics) {
        const hintBg = this.add.graphics();
        hintBg.fillStyle(0x0e1320, 0.75);
        hintBg.lineStyle(1.5, 0xffd700, 0.85);
        hintBg.fillRoundedRect(-165, -20, 330, 40, 20);
        hintBg.strokeRoundedRect(-165, -20, 330, 40, 20);
        hintContainer.add(hintBg);
      }

      if (this.add.text) {
        const hintText = this.add.text(0, 0, '🕹️ 滑動搖桿左右移動 🦘 按跳躍鍵拾取寶石！', {
          fontSize: '16px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#ffffff',
          fontStyle: 'bold',
        });
        if (typeof hintText.setOrigin === 'function') hintText.setOrigin(0.5);
        hintContainer.add(hintText);
      }

      this.hudContainer.add(hintContainer);

      if (this.tweens?.add) {
        this.tweens.add({
          targets: hintContainer,
          y: _height - 62,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        if (this.time?.delayedCall) {
          this.time.delayedCall(3200, () => {
            if (this.tweens?.add && hintContainer && hintContainer.active) {
              this.tweens.add({
                targets: hintContainer,
                alpha: 0,
                duration: 600,
                onComplete: () => {
                  try {
                    hintContainer.destroy();
                  } catch {
                    // Ignore
                  }
                },
              });
            }
          });
        }
      }
    }
  }

  /**
   * Handles Manual Player Jump Input (Touch / Keyboard) with 140ms Jump Buffering
   */
  public handleJumpInput(): void {
    if (this.isCelebrating || this.isTransitioning) {
      this.finishRunner();
      return;
    }

    this.jumpBufferTimer = 140;
    if (this.isGrounded || this.coyoteTimer > 0 || !this.hasDoubleJumped) {
      this.executeKinematicJump(1.0);
    }
  }

  /**
   * Executes kinematic jump impulse with double jump and squash & stretch feedback
   */
  public executeKinematicJump(multiplier: number = 1.0): void {
    if (!this.isGrounded && this.coyoteTimer <= 0) {
      if (!this.hasDoubleJumped) {
        this.hasDoubleJumped = true;
        this.isJumping = true;
        this.playerVelocityY = -600 * this.skinConfig.jumpMultiplier * multiplier;

        if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
          this.playerSprite.setTexture(this.skinConfig.jumpKey);
        }

        if (this.playerSprite && this.tweens?.add) {
          this.tweens.add({
            targets: this.playerSprite,
            scaleX: 1.18,
            scaleY: 0.82,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeOut',
          });
        }

        try {
          SoundManager.playDoubleJump();
        } catch {
          // Safe ignore
        }
        return;
      }
      return;
    }

    this.isGrounded = false;
    this.hasDoubleJumped = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isJumping = true;
    this.playerVelocityY = -660 * this.skinConfig.jumpMultiplier * multiplier;

    if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
      this.playerSprite.setTexture(this.skinConfig.jumpKey);
    }

    if (this.playerSprite && this.tweens?.add) {
      this.tweens.add({
        targets: this.playerSprite,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    try {
      SoundManager.play('jump');
    } catch {
      // Safe ignore
    }
  }

  /**
   * Handles rock obstacle collision with shield bubble protection
   */
  public hitObstacleWithShieldCheck(): void {
    if (this.hasShield) {
      this.hasShield = false;
      try {
        DataManager.getInstance().consumeGadget('shield');
        SoundManager.playShieldBreak();
      } catch {}
      if (this.shieldGraphics && typeof this.shieldGraphics.setVisible === 'function') {
        this.shieldGraphics.setVisible(false);
      }
      return;
    }

    this.stumbleTimer = 650;
    try {
      SoundManager.playSoftWrong();
    } catch {}
    if (this.playerSprite) {
      if (typeof (this.playerSprite as any).setTint === 'function') {
        (this.playerSprite as any).setTint(0xff6b6b);
      }
      if (this.tweens?.add) {
        this.tweens.add({
          targets: this.playerSprite,
          scaleY: 0.85,
          duration: 90,
          yoyo: true,
          onComplete: () => {
            if (this.playerSprite) {
              if (this.skinConfig.tint !== undefined && typeof (this.playerSprite as any).setTint === 'function') {
                (this.playerSprite as any).setTint(this.skinConfig.tint);
              } else if (typeof (this.playerSprite as any).clearTint === 'function') {
                (this.playerSprite as any).clearTint();
              }
            }
          },
        });
      }
    }
  }

  /**
   * Alias for backward compatibility
   */
  public triggerJump(multiplier: number = 1.0): void {
    this.executeKinematicJump(multiplier);
  }

  /**
   * Triggers springboard super-jump with physical compression
   */
  public triggerSpringboard(item: RunnerWorldItem): void {
    this.isSuperJumping = true;
    this.isGrounded = false;
    this.isJumping = true;
    this.playerVelocityY = -920 * this.skinConfig.jumpMultiplier;

    if (item.gameObject && typeof item.gameObject.setTexture === 'function') {
      item.gameObject.setTexture('springboard_down');
      if (this.time?.delayedCall) {
        this.time.delayedCall(220, () => {
          if (item.gameObject && typeof item.gameObject.setTexture === 'function') {
            item.gameObject.setTexture('springboard_up');
          }
        });
      }
    }

    if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
      this.playerSprite.setTexture(this.skinConfig.jumpKey);
    }

    if (this.playerSprite && this.tweens?.add) {
      this.tweens.add({
        targets: this.playerSprite,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    try {
      SoundManager.play('jump');
    } catch {
      // Safe ignore
    }
  }

  /**
   * Main Scene update loop: updates parallax, kinematics, platforms, triggers, and dynamic magnet
   */
  public update(_time: number, delta: number): void {
    if (this.isTransitioning || this.isCelebrating) {
      return;
    }

    const dtSeconds = Math.min(0.1, (delta || 16) / 1000);
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    // 0. Analog Joystick & Keyboard Steering (Seamless swipe left -> right)
    let moveX = this.joystickAxisX;
    if (this.isLeftDown) moveX -= 1;
    if (this.isRightDown) moveX += 1;
    moveX = Phaser.Math.Clamp(moveX, -1, 1);

    if (this.stumbleTimer > 0) {
      this.stumbleTimer = Math.max(0, this.stumbleTimer - delta);
    }

    const speedMod = this.stumbleTimer > 0 ? 0.55 : 1.0;
    const effectiveSpeed = (this.isRainbowRush ? this.currentSpeed * 1.35 : this.currentSpeed) * speedMod;
    const stepMove = moveX * effectiveSpeed * dtSeconds;

    if (Math.abs(moveX) > 0.08) {
      if (moveX > 0) {
        this.distanceRun += stepMove;
        if (this.playerSprite && typeof this.playerSprite.setFlipX === 'function') {
          this.playerSprite.setFlipX(false);
        }
      } else {
        this.distanceRun = Math.max(0, this.distanceRun + stepMove);
        if (this.playerSprite && typeof this.playerSprite.setFlipX === 'function') {
          this.playerSprite.setFlipX(true);
        }
      }
    }

    // 1. Gentle Cloud Drift + Parallax
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i];
      if (cloud && typeof cloud.x === 'number') {
        cloud.x -= (16 * dtSeconds) + (stepMove * 0.12);
        if (cloud.x < -100) {
          cloud.x = width + 100;
        }
      }
    }

    // 2. Parallax Distant Hills & Ground based on manual distanceRun
    this.redrawDistantHills(this.distanceRun * 0.35, width, height);
    this.redrawGroundLayer(this.distanceRun, width, height);

    // 3. Platform Detection (Solid One-Way Floating Platforms)
    let targetGroundY = this.playerBaselineY;
    for (let i = 0; i < this.worldItems.length; i++) {
      const item = this.worldItems[i];
      if (item && item.type === 'platform') {
        const screenX = item.worldX - this.distanceRun;
        if (Math.abs(screenX - this.playerScreenX) < 70) {
          if (this.playerY <= item.worldY + 5 && this.playerVelocityY >= 0) {
            targetGroundY = item.worldY;
            break;
          }
        }
      }
    }
    this.currentGroundY = targetGroundY;

    // Detect stepping off platform edge into free fall
    if (this.playerY < this.currentGroundY && this.isGrounded) {
      this.isGrounded = false;
      this.coyoteTimer = 100;
    }

    if (this.springboardCooldown > 0) {
      this.springboardCooldown = Math.max(0, this.springboardCooldown - delta);
    }

    // 4. Update Coyote Time & Jump Buffer
    if (this.isGrounded) {
      this.coyoteTimer = 100;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
      if (this.isGrounded || this.coyoteTimer > 0) {
        this.executeKinematicJump(1.0);
      }
    }

    // 5. Kinematic Gravity & Vertical Position Integration
    if (!this.isGrounded || this.playerY < this.currentGroundY) {
      // Asymmetric snappy gravity: falling accelerates faster than rising
      const gravity = this.playerVelocityY < 0 ? 1700 : 2600;
      this.playerVelocityY += gravity * dtSeconds;
      this.playerY += this.playerVelocityY * dtSeconds;

      if (this.playerY >= this.currentGroundY) {
        const wasAirborne = !this.isGrounded;
        this.playerY = this.currentGroundY;
        this.playerVelocityY = 0;
        this.isGrounded = true;
        this.hasDoubleJumped = false;
        this.isJumping = false;
        this.isSuperJumping = false;

        if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
          this.playerSprite.setTexture(this.skinConfig.walk1Key);
        }

        // Landing squash compression
        if (wasAirborne && this.playerSprite && this.tweens?.add) {
          this.tweens.add({
            targets: this.playerSprite,
            scaleX: 1.12,
            scaleY: 0.88,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeOut',
          });
        }
      }
    } else {
      this.playerY = this.currentGroundY;
      this.playerVelocityY = 0;
      this.isGrounded = true;
      this.hasDoubleJumped = false;
    }

    if (this.playerSprite && typeof this.playerSprite.setY === 'function') {
      this.playerSprite.setY(this.playerY);
    }

    // Update Anatomical Wardrobe Layers position
    const isFlip = Boolean(this.playerSprite?.flipX);
    const bpOffset = isFlip ? -18 : 18;
    if (this.runnerWardrobeWings && typeof this.runnerWardrobeWings.setPosition === 'function') {
      this.runnerWardrobeWings.setPosition(this.playerScreenX, this.playerY + 2);
    }
    if (this.runnerWardrobeDress && typeof this.runnerWardrobeDress.setPosition === 'function') {
      this.runnerWardrobeDress.setPosition(this.playerScreenX, this.playerY + 12);
    }
    if (this.runnerWardrobeTop && typeof this.runnerWardrobeTop.setPosition === 'function') {
      this.runnerWardrobeTop.setPosition(this.playerScreenX, this.playerY + 6);
    }
    if (this.runnerWardrobeBottom && typeof this.runnerWardrobeBottom.setPosition === 'function') {
      this.runnerWardrobeBottom.setPosition(this.playerScreenX, this.playerY + 20);
    }
    if (this.runnerWardrobeBackpack && typeof this.runnerWardrobeBackpack.setPosition === 'function') {
      this.runnerWardrobeBackpack.setPosition(this.playerScreenX + bpOffset, this.playerY + 8);
    }
    if (this.runnerWardrobeGlasses && typeof this.runnerWardrobeGlasses.setPosition === 'function') {
      this.runnerWardrobeGlasses.setPosition(this.playerScreenX, this.playerY - 14);
    }
    if (this.runnerWardrobeHat && typeof this.runnerWardrobeHat.setPosition === 'function') {
      this.runnerWardrobeHat.setPosition(this.playerScreenX, this.playerY - 34);
    }

    // Dynamic Tailored Vector Graphics for Runner Kinematics
    if (this.runnerWardrobeGraphics) {
      try {
        const dm = DataManager.getInstance();
        const eq = dm.getEquippedWardrobe();
        CharacterOutfitCompositor.renderOutfit(this.runnerWardrobeGraphics, eq, {
          scale: 0.9,
          offsetX: this.playerScreenX,
          offsetY: this.playerY,
          flipX: isFlip,
        });
      } catch {}
    }

    // Update Shield Graphics position
    if (this.shieldGraphics && typeof this.shieldGraphics.setPosition === 'function') {
      this.shieldGraphics.setPosition(this.playerScreenX, this.playerY - 30);
    }

    // Update Companion Pet follow kinematics
    if (this.companionPet && typeof this.companionPet.updatePet === 'function') {
      this.companionPet.updatePet(
        dtSeconds,
        this.playerScreenX,
        this.playerY,
        Boolean(this.playerSprite?.flipX)
      );
    } else if (this.petCompanionObject && typeof this.petCompanionObject.setPosition === 'function') {
      const followOffsetX = this.playerSprite?.flipX ? 45 : -45;
      this.petCompanionObject.setPosition(this.playerScreenX + followOffsetX, this.playerY - 35);
    }

    // 6. Update Course Items & Interactions
    for (let i = 0; i < this.worldItems.length; i++) {
      const item = this.worldItems[i];
      if (!item) continue;

      const screenX = item.worldX - this.distanceRun;
      if (item.gameObject && typeof item.gameObject.setPosition === 'function') {
        item.gameObject.setPosition(screenX, item.worldY);
      }

      // Check Coin/Gem Dynamic Magnet (scales with player speed)
      if (!item.collected && (item.type === 'coin' || item.type === 'gem')) {
        const dx = screenX - this.playerScreenX;
        const dy = item.worldY - this.playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.skinConfig.magnetRadius && dist > 1) {
          const pullSpeed = (effectiveSpeed * 1.8 + 260) * dtSeconds;
          item.worldX -= (dx / dist) * pullSpeed;
          item.worldY -= (dy / dist) * pullSpeed;
        }

        if (dist < 54) {
          if (item.type === 'coin') {
            this.collectCoin(item);
          } else {
            this.collectGem(item);
          }
        }
      }

      // Check Springboard Collision (with cooldown debounce)
      if (item.type === 'springboard') {
        const distToPlayer = screenX - this.playerScreenX;
        if (distToPlayer > -25 && distToPlayer < 45 && Math.abs(this.playerY - this.playerBaselineY) < 35 && this.springboardCooldown <= 0) {
          this.springboardCooldown = 350;
          this.triggerSpringboard(item);
        }
      }

      // Obstacle interaction: requires user to manual click jump to clear!
      if (item.type === 'obstacle') {
        const distToPlayer = screenX - this.playerScreenX;
        const isAirborne = this.playerY < this.playerBaselineY - 25;

        if (distToPlayer > -25 && distToPlayer < 45) {
          if (!isAirborne && this.isGrounded && this.stumbleTimer <= 0) {
            this.hitObstacleWithShieldCheck();
          }
        }
      }

      // Check Final Treasure Chest Goal Trigger
      if (item.type === 'chest') {
        const distToPlayer = screenX - this.playerScreenX;
        if (distToPlayer <= 110 && !this.isCelebrating) {
          this.onReachChest();
          return;
        }
      }
    }

    // 7. Update Character Texture & Step Animation (Idle Stand when not moving)
    if (this.isGrounded && !this.isJumping && !this.isSuperJumping) {
      if (Math.abs(moveX) > 0.08) {
        this.stepTimer += delta;
        const stepDuration = 130 / (this.isRainbowRush ? this.skinConfig.speedMultiplier * 1.35 : this.skinConfig.speedMultiplier);
        if (this.stepTimer >= stepDuration) {
          this.stepTimer = 0;
          this.currentWalkFrame = this.currentWalkFrame === 1 ? 2 : 1;
          const textureKey =
            this.currentWalkFrame === 1
              ? this.skinConfig.walk1Key
              : this.skinConfig.walk2Key;

          if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
            this.playerSprite.setTexture(textureKey);
          }
        }
      } else {
        // Idle Standing when no directional keys/buttons are pressed
        this.stepTimer = 0;
        if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
          this.playerSprite.setTexture(this.skinConfig.standKey);
        }
      }
    } else {
      // Airborne Jumping Texture
      if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
        this.playerSprite.setTexture(this.skinConfig.jumpKey);
      }
    }

    // 8. Update Distance Progress Bar
    this.updateProgressBar(width);
  }

  /**
   * Updates distance progress bar on HUD
   */
  public updateProgressBar(width: number): void {
    if (!this.progressBarFill) return;

    const barW = 340;
    const barH = 18;
    const barX = width / 2 - barW / 2;
    const barY = 32;
    const maxDist = this.targetTrackDistance - 300;
    const progress = Math.min(1.0, Math.max(0, this.distanceRun / maxDist));

    this.progressBarFill.clear();
    this.progressBarFill.fillStyle(0x48b64e, 1.0);
    this.progressBarFill.fillRoundedRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * progress), barH - 4, 7);
  }

  /**
   * Collects a floating coin, awards currency & plays effects
   */
  public collectCoin(item: RunnerWorldItem): void {
    if (item.collected) return;
    item.collected = true;

    // Update Session Stats & DataManager (2x if Rainbow Rush!)
    const coinValue = this.isRainbowRush ? 2 : 1;
    this.sessionStats.collectedCoins = (this.sessionStats.collectedCoins || 0) + coinValue;
    try {
      DataManager.getInstance().addCoins(coinValue);
    } catch {
      // Safe ignore
    }

    // Audio SFX with progressive arpeggio
    try {
      SoundManager.playCoinArpeggio(this.sessionStats.collectedCoins || 0);
    } catch {
      // Safe ignore
    }

    const itemX = item.gameObject?.x ?? this.playerScreenX;
    const itemY = item.gameObject?.y ?? this.playerBaselineY;

    // Pop item and destroy
    if (item.gameObject) {
      if (this.tweens?.add) {
        this.tweens.add({
          targets: item.gameObject,
          scaleX: 1.4,
          scaleY: 1.4,
          alpha: 0,
          duration: 180,
          onComplete: () => {
            if (typeof item.gameObject.destroy === 'function') {
              item.gameObject.destroy();
            }
          },
        });
      } else if (typeof item.gameObject.destroy === 'function') {
        item.gameObject.destroy();
      }
    }

    // Particle sparkle burst
    this.spawnSparkleParticles(itemX, itemY, 0xffd700, 5);

    // Floating text +1
    this.spawnFloatingFeedbackText(itemX, itemY - 20, '+1 🪙', '#ffd700');

    // Update HUD display
    this.refreshHUD();
  }

  /**
   * Collects a floating gem, awards currency & plays effects
   */
  public collectGem(item: RunnerWorldItem): void {
    if (item.collected) return;
    item.collected = true;

    // Update Session Stats & DataManager
    this.sessionStats.collectedGems = (this.sessionStats.collectedGems || 0) + 1;
    try {
      DataManager.getInstance().addGems(1);
    } catch {
      // Safe ignore
    }

    // Audio SFX
    try {
      SoundManager.play('victory');
    } catch {
      // Safe ignore
    }

    const itemX = item.gameObject?.x ?? this.playerScreenX;
    const itemY = item.gameObject?.y ?? this.playerBaselineY;

    // Pop item and destroy
    if (item.gameObject) {
      if (this.tweens?.add) {
        this.tweens.add({
          targets: item.gameObject,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            if (typeof item.gameObject.destroy === 'function') {
              item.gameObject.destroy();
            }
          },
        });
      } else if (typeof item.gameObject.destroy === 'function') {
        item.gameObject.destroy();
      }
    }

    // Particle burst
    this.spawnSparkleParticles(itemX, itemY, 0x00e5ff, 8);

    // Floating text +1 💎
    this.spawnFloatingFeedbackText(itemX, itemY - 20, '+1 💎', '#00e5ff');

    // Update HUD display
    this.refreshHUD();
  }

  /**
   * Refreshes HUD currency labels
   */
  public refreshHUD(): void {
    try {
      const profile = DataManager.getInstance().getProfile();
      if (this.coinCounterText && typeof this.coinCounterText.setText === 'function') {
        this.coinCounterText.setText(`🪙 ${profile.coins}`);
      }
      if (this.gemCounterText && typeof this.gemCounterText.setText === 'function') {
        this.gemCounterText.setText(`💎 ${profile.gems}`);
      }
    } catch {
      // Safe ignore
    }
  }

  /**
   * Spawns rising floating feedback score text (+1 🪙 / +1 💎)
   */
  public spawnFloatingFeedbackText(x: number, y: number, text: string, color: string): void {
    if (!this.add?.text) return;

    const popup = this.add.text(x, y, text, {
      fontSize: '22px',
      fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
      color: color,
      fontStyle: 'bold',
    });

    if (popup.setOrigin) popup.setOrigin(0.5);
    if (popup.setDepth) popup.setDepth(80);

    if (this.tweens?.add) {
      this.tweens.add({
        targets: popup,
        y: y - 45,
        alpha: 0,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 650,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (typeof popup.destroy === 'function') {
            popup.destroy();
          }
        },
      });
    }
  }

  /**
   * Spawns radiant sparkle particles at location
   */
  public spawnSparkleParticles(x: number, y: number, tintColor: number, count: number = 6): void {
    if (!this.add?.image && !this.add?.graphics) return;

    for (let i = 0; i < count; i++) {
      let p: any = null;
      if (this.add.image) {
        p = this.add.image(x, y, 'particle_sparkle');
        if (p.setDepth) p.setDepth(70);
        if (p.setScale) p.setScale(0.6 + Math.random() * 0.5);
        if (p.setTint) p.setTint(tintColor);
      }

      if (p && this.tweens?.add) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
        const dist = 35 + Math.random() * 35;
        this.tweens.add({
          targets: p,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 450 + Math.random() * 200,
          ease: 'Quad.easeOut',
          onComplete: () => {
            if (typeof p.destroy === 'function') {
              p.destroy();
            }
          },
        });
      }
    }
  }

  /**
   * Reaching the final treasure chest: cheers, opens chest, fountain explosion, bonus loot
   */
  public onReachChest(): void {
    if (this.isCelebrating) return;
    this.isCelebrating = true;

    // 1. Switch Player Pose to Cheer Celebration
    if (this.playerSprite && typeof this.playerSprite.setTexture === 'function') {
      this.playerSprite.setTexture(this.skinConfig.cheerKey);
    }

    if (this.companionPet && typeof this.companionPet.playVictoryDance === 'function') {
      this.companionPet.playVictoryDance();
    }

    if (this.playerSprite && this.tweens?.add) {
      this.tweens.add({
        targets: this.playerSprite,
        y: this.playerBaselineY - 30,
        duration: 250,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
      });
    }

    // 2. Open Treasure Chest
    if (this.chestObject && typeof this.chestObject.setTexture === 'function') {
      this.chestObject.setTexture('chest_open');
    }

    // 3. Audio Effects
    try {
      SoundManager.play('chest');
    } catch {
      // Safe ignore
    }

    // 4. Award Chest Bonus Loot (+5 coins, +1 gem)
    this.sessionStats.collectedCoins = (this.sessionStats.collectedCoins || 0) + 5;
    this.sessionStats.collectedGems = (this.sessionStats.collectedGems || 0) + 1;
    try {
      DataManager.getInstance().addCoins(5);
      DataManager.getInstance().addGems(1);
    } catch {
      // Safe ignore
    }
    this.refreshHUD();

    // 5. Fountain Burst of Gems & Sparkles from Chest
    const chestX = this.chestObject?.x ?? (this.playerScreenX + 110);
    const chestY = this.chestObject?.y ?? this.playerBaselineY;

    this.spawnFountainLoot(chestX, chestY);

    // 6. Celebration Banner
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    if (this.add?.text) {
      const banner = this.add.text(
        width / 2,
        180,
        '🎉 衝刺大成功！獲得寶箱獎勵！ (+5 🪙 +1 💎)',
        {
          fontSize: '28px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: '#ffd700',
          fontStyle: 'bold',
          align: 'center',
        }
      );
      if (banner.setOrigin) banner.setOrigin(0.5);
      if (banner.setDepth) banner.setDepth(120);

      if (this.tweens?.add) {
        banner.setScale ? banner.setScale(0.6) : null;
        this.tweens.add({
          targets: banner,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 350,
          yoyo: true,
          repeat: 1,
          ease: 'Back.easeOut',
        });
      }
    }

    // 7. Transition after celebration
    if (this.time?.delayedCall) {
      this.time.delayedCall(1500, () => {
        this.finishRunner();
      });
    } else {
      this.finishRunner();
    }
  }

  /**
   * Spawns an explosion fountain of coins, gems, and stars shooting out from the chest
   */
  public spawnFountainLoot(x: number, y: number): void {
    if (!this.add) return;

    for (let i = 0; i < 14; i++) {
      const texture = i % 2 === 0 ? 'coin_procedural' : 'gem_procedural';
      let loot: any = null;
      if (this.add.image) {
        loot = this.add.image(x, y - 10, texture);
        if (loot.setDepth) loot.setDepth(60);
        if (loot.setScale) loot.setScale(0.8);
      }

      if (loot && this.tweens?.add) {
        const spreadX = (Math.random() - 0.5) * 260;
        const targetY = y - 140 - Math.random() * 90;

        this.tweens.add({
          targets: loot,
          x: x + spreadX,
          y: targetY,
          duration: 400 + Math.random() * 200,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (this.tweens?.add && loot) {
              this.tweens.add({
                targets: loot,
                y: y + 20,
                alpha: 0,
                duration: 400 + Math.random() * 200,
                ease: 'Cubic.easeIn',
                onComplete: () => {
                  if (typeof loot.destroy === 'function') {
                    loot.destroy();
                  }
                },
              });
            }
          },
        });
      }
    }
  }

  /**
   * Skip / Fast-Forward: sweeps all visible coins/gems, awards chest bonus, and completes transition
   */
  public skipRunner(): void {
    if (this.isTransitioning) return;

    // Collect all uncollected items immediately
    for (let i = 0; i < this.worldItems.length; i++) {
      const item = this.worldItems[i];
      if (item && !item.collected) {
        if (item.type === 'coin') {
          this.sessionStats.collectedCoins = (this.sessionStats.collectedCoins || 0) + 1;
          try {
            DataManager.getInstance().addCoins(1);
          } catch {
            // Safe ignore
          }
        } else if (item.type === 'gem') {
          this.sessionStats.collectedGems = (this.sessionStats.collectedGems || 0) + 1;
          try {
            DataManager.getInstance().addGems(1);
          } catch {
            // Safe ignore
          }
        }
        item.collected = true;
      }
    }

    // Award chest bonus if chest wasn't opened yet
    if (!this.isCelebrating) {
      this.sessionStats.collectedCoins = (this.sessionStats.collectedCoins || 0) + 5;
      this.sessionStats.collectedGems = (this.sessionStats.collectedGems || 0) + 1;
      try {
        DataManager.getInstance().addCoins(5);
        DataManager.getInstance().addGems(1);
      } catch {
        // Safe ignore
      }
    }

    this.refreshHUD();
    this.finishRunner();
  }

  /**
   * Finalizes Runner scene and transitions to QuestionScene (next question) or ResultScene (station complete)
   */
  public finishRunner(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (!this.scene) return;

    if (this.isStationComplete) {
      // Station Complete -> ResultScene
      this.scene.start('ResultScene', {
        stationId: this.stationId,
        stationName: this.stationName,
        totalQuestions: this.totalQuestions,
        questions: this.questions,
        sessionStats: this.sessionStats,
      });
    } else {
      // Return to QuestionScene for next question (questionIndex + 1)
      this.scene.start('QuestionScene', {
        stationId: this.stationId,
        stationName: this.stationName,
        questionIndex: this.questionIndex + 1,
        totalQuestions: this.totalQuestions,
        questions: this.questions,
        sessionStats: this.sessionStats,
      });
    }
  }

  /**
   * Scene shutdown and resource cleanup
   */
  /**
   * Creates Mobile Virtual Analog Joystick (Left Thumb Drag / Slide) & Large Jump Button (Right Thumb)
   */
  public createVirtualGamepad(width: number, height: number): void {
    if (!this.add) return;

    this.virtualGamepadContainer = this.add.container
      ? this.add.container(0, 0)
      : new Phaser.GameObjects.Container(this, 0, 0);

    if (this.virtualGamepadContainer.setDepth) {
      this.virtualGamepadContainer.setDepth(150);
    }

    this.joystickBaseX = 130;
    this.joystickBaseY = height - 90;
    this.joystickRadius = 52;

    // 1. Draw Joystick Base (Translucent Cyber Ring with Directional Indicators)
    if (this.add.graphics) {
      const gBase = this.add.graphics();
      gBase.fillStyle(0x0f172a, 0.65);
      gBase.fillCircle(this.joystickBaseX, this.joystickBaseY, this.joystickRadius);
      gBase.lineStyle(3, 0x38bdf8, 0.85);
      if (typeof gBase.strokeCircle === 'function') gBase.strokeCircle(this.joystickBaseX, this.joystickBaseY, this.joystickRadius);

      // Inner guidelines
      gBase.lineStyle(1.5, 0x38bdf8, 0.35);
      if (typeof gBase.strokeCircle === 'function') gBase.strokeCircle(this.joystickBaseX, this.joystickBaseY, 26);
      if (typeof gBase.lineBetween === 'function') gBase.lineBetween(this.joystickBaseX - 44, this.joystickBaseY, this.joystickBaseX + 44, this.joystickBaseY);

      this.joystickBaseGraphics = gBase;
      this.virtualGamepadContainer.add(gBase);

      // 2. Draw Joystick Thumbstick Knob
      const gThumb = this.add.graphics();
      this.redrawJoystickThumb(gThumb, this.joystickBaseX, this.joystickBaseY);
      this.joystickThumbGraphics = gThumb;
      this.virtualGamepadContainer.add(gThumb);
    }

    // Directional labels on joystick base
    if (this.add.text) {
      const leftLabel = this.add.text(this.joystickBaseX - 36, this.joystickBaseY, '◀', {
        fontSize: '16px',
        color: '#38bdf8',
        fontStyle: 'bold',
      });
      if (typeof leftLabel.setOrigin === 'function') leftLabel.setOrigin(0.5);
      this.virtualGamepadContainer.add(leftLabel);

      const rightLabel = this.add.text(this.joystickBaseX + 36, this.joystickBaseY, '▶', {
        fontSize: '16px',
        color: '#38bdf8',
        fontStyle: 'bold',
      });
      if (typeof rightLabel.setOrigin === 'function') rightLabel.setOrigin(0.5);
      this.virtualGamepadContainer.add(rightLabel);

      const joystickTitle = this.add.text(this.joystickBaseX, this.joystickBaseY - this.joystickRadius - 14, '🕹️ 滑動搖桿移動', {
        fontSize: '16px',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: '#93c5fd',
        fontStyle: 'bold',
      });
      if (typeof joystickTitle.setOrigin === 'function') joystickTitle.setOrigin(0.5);
      this.virtualGamepadContainer.add(joystickTitle);
    }

    // 3. Register Left-Side Touch Joystick Drag / Slide Events
    if (this.input) {
      this.input.on('pointerdown', (pointer: any) => {
        // Left touch zone: X <= 320, Y >= height - 200
        if (pointer.x <= 320 && pointer.y >= height - 200) {
          this.joystickActive = true;
          this.joystickPointerId = pointer.id;
          this.updateJoystickFromPointer(pointer.x, pointer.y);
        }
      });

      this.input.on('pointermove', (pointer: any) => {
        if (this.joystickActive && (this.joystickPointerId === null || pointer.id === this.joystickPointerId)) {
          this.updateJoystickFromPointer(pointer.x, pointer.y);
        }
      });

      const releaseJoystick = (pointer: any) => {
        if (this.joystickActive && (this.joystickPointerId === null || pointer.id === this.joystickPointerId)) {
          this.resetJoystick();
        }
      };

      this.input.on('pointerup', releaseJoystick);
      this.input.on('pointerupoutside', releaseJoystick);
    }

    // 4. Large Right Action Jump Button (🦘 跳躍)
    const jumpBtnY = height - 76;
    this.jumpBtn = new CanvasButton(this, {
      x: width - 100,
      y: jumpBtnY,
      width: 140,
      height: 68,
      text: '🦘 跳躍',
      color: 'green',
      fontSize: '22px',
    });
    this.jumpBtn.on('pointerdown', () => {
      this.handleJumpInput();
    });
    this.virtualGamepadContainer.add(this.jumpBtn);
  }

  /**
   * Redraws the 3D shiny thumbstick knob at target coordinates
   */
  public redrawJoystickThumb(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    if (!g || typeof g.clear !== 'function') return;
    g.clear();

    const r = 26;
    // Drop shadow
    g.fillStyle(0x000000, 0.4);
    g.fillCircle(x + 2, y + 4, r);

    // Main knob gradient base
    g.fillStyle(0x0284c7, 0.95);
    g.fillCircle(x, y, r);

    // Specular gloss cap
    g.fillStyle(0x7dd3fc, 0.65);
    g.fillCircle(x - 4, y - 6, r * 0.55);

    // Inner glowing ring
    g.lineStyle(2, 0xffffff, 0.9);
    if (typeof g.strokeCircle === 'function') g.strokeCircle(x, y, r * 0.7);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x, y, 4);
  }

  /**
   * Updates joystick position and continuous axis (-1.0 to +1.0) from pointer drag coordinates
   */
  public updateJoystickFromPointer(pointerX: number, pointerY: number): void {
    const dx = pointerX - this.joystickBaseX;
    const dy = pointerY - this.joystickBaseY;
    const dist = Math.hypot(dx, dy);

    let knobX = pointerX;
    let knobY = pointerY;

    if (dist > this.joystickRadius) {
      const angle = Math.atan2(dy, dx);
      knobX = this.joystickBaseX + Math.cos(angle) * this.joystickRadius;
      knobY = this.joystickBaseY + Math.sin(angle) * this.joystickRadius;
    }

    if (this.joystickThumbGraphics) {
      this.redrawJoystickThumb(this.joystickThumbGraphics, knobX, knobY);
    }

    // Continuous X Axis mapped from -1.0 (full left) to +1.0 (full right)
    const clampedDistX = Math.max(-this.joystickRadius, Math.min(this.joystickRadius, dx));
    this.joystickAxisX = clampedDistX / this.joystickRadius;
  }

  /**
   * Resets joystick knob to center with elastic release
   */
  public resetJoystick(): void {
    this.joystickActive = false;
    this.joystickPointerId = null;
    this.joystickAxisX = 0;

    if (this.joystickThumbGraphics) {
      this.redrawJoystickThumb(this.joystickThumbGraphics, this.joystickBaseX, this.joystickBaseY);
    }
  }

  public shutdown(): void {
    this.resetJoystick();
    this.isLeftDown = false;
    this.isRightDown = false;
    if (this.tweens) {
      this.tweens.killAll();
    }
    if (this.time) {
      this.time.removeAllEvents();
    }
    if (this.input) {
      this.input.off('pointerdown');
      this.input.off('pointermove');
      this.input.off('pointerup');
      this.input.off('pointerupoutside');
      if (this.input.keyboard) {
        this.input.keyboard.off('keydown-A');
        this.input.keyboard.off('keyup-A');
        this.input.keyboard.off('keydown-LEFT');
        this.input.keyboard.off('keyup-LEFT');
        this.input.keyboard.off('keydown-D');
        this.input.keyboard.off('keyup-D');
        this.input.keyboard.off('keydown-RIGHT');
        this.input.keyboard.off('keyup-RIGHT');
        this.input.keyboard.off('keydown-SPACE');
        this.input.keyboard.off('keydown-UP');
        this.input.keyboard.off('keydown-W');
      }
    }
  }
}
