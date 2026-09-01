import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GAME_TITLE } from '../config';
import { getWardrobePreloadPaths } from '../config/outfits';
import { SoundManager } from '../services/SoundManager';

export const LEARNING_TIPS: string[] = [
  '小提示：每天朗讀 10 分鐘，語文能力更出色！',
  '小提示：數學加減法可以用數手指或數粒幫手喔！',
  '小提示：遇到新英文單字，跟著語音多讀幾次！',
  '小提示：過關可以獲得金幣和寶石，去商店換新造型吧！',
  '小提示：保持連續學習，可以解鎖稀有獎盃！',
  '小提示：答題時仔細看清楚題目，不明白可以按語音發音按鈕！',
];

export class PreloadScene extends Phaser.Scene {
  private progressBar: Phaser.GameObjects.Graphics | null = null;
  private progressBox: Phaser.GameObjects.Graphics | null = null;
  private percentText: Phaser.GameObjects.Text | null = null;
  private tipText: Phaser.GameObjects.Text | null = null;
  private tipTimer: Phaser.Time.TimerEvent | null = null;
  private currentTipIndex: number = 0;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    this.createLoadingUI(width, height);
    this.registerLoaderEvents(width, height);
    this.loadKenneyAssets();
    this.loadWardrobeAssets();
    this.generateProceduralTextures();
  }

  private createLoadingUI(width: number, height: number): void {
    if (!this.add) return;

    // 1. Background
    if (this.add.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x1e2438);
    }

    // 2. Title
    if (this.add.text) {
      const title = this.add.text(width / 2, height / 2 - 120, GAME_TITLE, {
        fontSize: '34px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
        align: 'center',
      });
      if (typeof title.setOrigin === 'function') {
        title.setOrigin(0.5);
      }
      if (typeof title.setShadow === 'function') {
        title.setShadow(2, 2, 'rgba(0,0,0,0.5)', 4, true, true);
      }
    }

    // 3. Progress box outline & fill bar
    const barWidth = 460;
    const barHeight = 28;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 - 20;

    if (this.add.graphics) {
      this.progressBox = this.add.graphics();
      this.progressBox.fillStyle(0x0e1320, 0.8);
      this.progressBox.fillRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 12);
      this.progressBox.lineStyle(3, 0x4a90e2, 1.0);
      this.progressBox.strokeRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 12);

      this.progressBar = this.add.graphics();
    }

    // 4. Loading percentage text
    if (this.add.text) {
      this.percentText = this.add.text(width / 2, barY + barHeight / 2, '0%', {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof this.percentText.setOrigin === 'function') {
        this.percentText.setOrigin(0.5);
      }

      // 5. Children Learning Tip text
      this.currentTipIndex = Math.floor(Math.random() * LEARNING_TIPS.length);
      this.tipText = this.add.text(width / 2, height / 2 + 60, LEARNING_TIPS[this.currentTipIndex], {
        fontSize: '20px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#a0c4ff',
        align: 'center',
      });
      if (typeof this.tipText.setOrigin === 'function') {
        this.tipText.setOrigin(0.5);
      }
    }

    // Tip rotation timer
    if (this.time?.addEvent) {
      this.tipTimer = this.time.addEvent({
        delay: 2800,
        loop: true,
        callback: () => {
          if (!this.tipText) return;
          this.currentTipIndex = (this.currentTipIndex + 1) % LEARNING_TIPS.length;
          if (typeof this.tipText.setText === 'function') {
            this.tipText.setText(LEARNING_TIPS[this.currentTipIndex]);
          }
        },
      });
    }
  }

  private registerLoaderEvents(width: number, height: number): void {
    if (!this.load) return;

    const barWidth = 460;
    const barHeight = 28;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 - 20;

    this.load.on('progress', (value: number) => {
      const percentage = Math.floor(value * 100);
      if (this.percentText && typeof this.percentText.setText === 'function') {
        this.percentText.setText(`${percentage}%`);
      }

      if (this.progressBar) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x48b64e, 1.0);
        this.progressBar.fillRoundedRect(barX, barY, Math.max(8, barWidth * value), barHeight, 8);
        this.progressBar.fillStyle(0x76d67c, 0.4);
        this.progressBar.fillRoundedRect(barX, barY, Math.max(8, barWidth * value), barHeight / 2, 4);
      }
    });

    this.load.on('complete', () => {
      if (this.percentText && typeof this.percentText.setText === 'function') {
        this.percentText.setText('100% 準備完成！');
      }
    });
  }

  private loadKenneyAssets(): void {
    if (!this.load) return;

    // Interface Audio (Kenney interface sounds)
    const audioMap: Record<string, string> = {
      click: 'assets/kenney/interface-sounds/Audio/click_001.ogg',
      click_001: 'assets/kenney/interface-sounds/Audio/click_001.ogg',
      click_002: 'assets/kenney/interface-sounds/Audio/click_002.ogg',
      click_003: 'assets/kenney/interface-sounds/Audio/click_003.ogg',
      click_004: 'assets/kenney/interface-sounds/Audio/click_004.ogg',
      click_005: 'assets/kenney/interface-sounds/Audio/click_005.ogg',
      correct: 'assets/kenney/interface-sounds/Audio/confirmation_001.ogg',
      confirmation_001: 'assets/kenney/interface-sounds/Audio/confirmation_001.ogg',
      confirmation_002: 'assets/kenney/interface-sounds/Audio/confirmation_002.ogg',
      confirmation_003: 'assets/kenney/interface-sounds/Audio/confirmation_003.ogg',
      confirmation_004: 'assets/kenney/interface-sounds/Audio/confirmation_004.ogg',
      wrong: 'assets/kenney/interface-sounds/Audio/error_001.ogg',
      error_001: 'assets/kenney/interface-sounds/Audio/error_001.ogg',
      error_002: 'assets/kenney/interface-sounds/Audio/error_002.ogg',
      error_003: 'assets/kenney/interface-sounds/Audio/error_003.ogg',
      coin: 'assets/kenney/interface-sounds/Audio/pluck_001.ogg',
      pluck_001: 'assets/kenney/interface-sounds/Audio/pluck_001.ogg',
      pluck_002: 'assets/kenney/interface-sounds/Audio/pluck_002.ogg',
      victory: 'assets/kenney/interface-sounds/Audio/confirmation_002.ogg',
      chest: 'assets/kenney/interface-sounds/Audio/open_001.ogg',
      open_001: 'assets/kenney/interface-sounds/Audio/open_001.ogg',
      open_002: 'assets/kenney/interface-sounds/Audio/open_002.ogg',
      jump: 'assets/kenney/interface-sounds/Audio/switch_001.ogg',
      switch_001: 'assets/kenney/interface-sounds/Audio/switch_001.ogg',
      drop_001: 'assets/kenney/interface-sounds/Audio/drop_001.ogg',
      drop_002: 'assets/kenney/interface-sounds/Audio/drop_002.ogg',
      drop_003: 'assets/kenney/interface-sounds/Audio/drop_003.ogg',
      toggle_001: 'assets/kenney/interface-sounds/Audio/toggle_001.ogg',
      glass_001: 'assets/kenney/interface-sounds/Audio/glass_001.ogg',
    };

    for (const [key, path] of Object.entries(audioMap)) {
      if (typeof this.load.audio === 'function') {
        this.load.audio(key, path);
      }
    }

    // Platformer Character Sprites
    const spriteMap: Record<string, string> = {
      player_stand: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_stand.png',
      player_walk1: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_walk1.png',
      player_walk2: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_walk2.png',
      player_jump: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_jump.png',
      player_cheer1: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_cheer1.png',
      player_cheer2: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_cheer2.png',
      player_idle: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_idle.png',
      player_slide: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_slide.png',
      player_fall: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_fall.png',
      player_duck: 'assets/kenney/platformer-characters/PNG/Player/Poses/player_duck.png',
      female_stand: 'assets/kenney/platformer-characters/PNG/Female/Poses/female_stand.png',
      female_walk1: 'assets/kenney/platformer-characters/PNG/Female/Poses/female_walk1.png',
      female_walk2: 'assets/kenney/platformer-characters/PNG/Female/Poses/female_walk2.png',
      female_jump: 'assets/kenney/platformer-characters/PNG/Female/Poses/female_jump.png',
      female_cheer1: 'assets/kenney/platformer-characters/PNG/Female/Poses/female_cheer1.png',
      female_cheer2: 'assets/kenney/platformer-characters/PNG/Female/Poses/female_cheer2.png',
      adventurer_stand: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_stand.png',
      adventurer_walk1: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_walk1.png',
      adventurer_walk2: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_walk2.png',
      adventurer_jump: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_jump.png',
      adventurer_cheer1: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_cheer1.png',
      adventurer_cheer2: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_cheer2.png',
      soldier_stand: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_stand.png',
      soldier_walk1: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_walk1.png',
      soldier_walk2: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_walk2.png',
      soldier_jump: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_jump.png',
      soldier_cheer1: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_cheer1.png',
      soldier_cheer2: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_cheer2.png',
      zombie_stand: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_stand.png',
      zombie_walk1: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_walk1.png',
      zombie_walk2: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_walk2.png',
      zombie_jump: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_jump.png',
      zombie_cheer1: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_cheer1.png',
      zombie_cheer2: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_cheer2.png',
    };

    for (const [key, path] of Object.entries(spriteMap)) {
      if (typeof this.load.image === 'function') {
        this.load.image(key, path);
      }
    }

    // UI Pack & Game Icons
    const uiMap: Record<string, string> = {
      icon_checkmark: 'assets/kenney/ui-pack/PNG/Blue/Default/icon_checkmark.png',
      icon_cross: 'assets/kenney/ui-pack/PNG/Blue/Default/icon_cross.png',
      icon_circle: 'assets/kenney/ui-pack/PNG/Blue/Default/icon_circle.png',
      star: 'assets/kenney/ui-pack/PNG/Blue/Default/star.png',
      star_outline: 'assets/kenney/ui-pack/PNG/Blue/Default/star_outline.png',
      button_rectangle_flat: 'assets/kenney/ui-pack/PNG/Blue/Default/button_rectangle_flat.png',
      cart: 'assets/kenney/game-icons/PNG/Black/1x/cart.png',
      medal2: 'assets/kenney/game-icons/PNG/Black/1x/medal2.png',
      audioOn: 'assets/kenney/game-icons/PNG/Black/1x/audioOn.png',
      audioOff: 'assets/kenney/game-icons/PNG/Black/1x/audioOff.png',
      barsHorizontal: 'assets/kenney/game-icons/PNG/Black/1x/barsHorizontal.png',
      checkmark: 'assets/kenney/game-icons/PNG/Black/1x/checkmark.png',
      cross: 'assets/kenney/game-icons/PNG/Black/1x/cross.png',
      arrowRight: 'assets/kenney/game-icons/PNG/Black/1x/arrowRight.png',
      arrowLeft: 'assets/kenney/game-icons/PNG/Black/1x/arrowLeft.png',
      arrowUp: 'assets/kenney/game-icons/PNG/Black/1x/arrowUp.png',
      arrowDown: 'assets/kenney/game-icons/PNG/Black/1x/arrowDown.png',
    };

    for (const [key, path] of Object.entries(uiMap)) {
      if (typeof this.load.image === 'function') {
        this.load.image(key, path);
      }
    }
  }

  private loadWardrobeAssets(): void {
    if (!this.load || typeof this.load.image !== 'function') return;

    // Optional art is loaded under its path key. Missing files simply stay absent;
    // OutfitRenderer then selects layered/composite/base fallback without crashing.
    getWardrobePreloadPaths().forEach(path => this.load.image(path, path));
  }

  public generateProceduralTextures(): void {
    if (!this.textures) return;

    // Helper to generate canvas texture safely
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

    // 1. Procedural Cloud
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

    // 2. Procedural Gold Star
    createSafeCanvasTexture('star_procedural', 48, 48, (ctx) => {
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#b5730a';
      ctx.lineWidth = 2;
      const cx = 24;
      const cy = 24;
      const spikes = 5;
      const outerR = 20;
      const innerR = 9;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerR;
        let y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 3. Procedural Empty Star
    createSafeCanvasTexture('star_empty_procedural', 48, 48, (ctx) => {
      ctx.fillStyle = '#4a515c';
      ctx.strokeStyle = '#2b334d';
      ctx.lineWidth = 2;
      const cx = 24;
      const cy = 24;
      const spikes = 5;
      const outerR = 20;
      const innerR = 9;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerR;
        let y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 4. Procedural Airship
    createSafeCanvasTexture('airship_procedural', 180, 100, (ctx) => {
      // Main balloon
      ctx.fillStyle = '#e04343';
      ctx.beginPath();
      ctx.ellipse(90, 42, 75, 34, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden side stripe
      ctx.fillStyle = '#f5a623';
      ctx.beginPath();
      ctx.ellipse(90, 42, 75, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cabin / Gondola
      ctx.fillStyle = '#6b4f2c';
      ctx.fillRect(70, 74, 40, 18);

      // Cabin ropes
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 56);
      ctx.lineTo(72, 74);
      ctx.moveTo(120, 56);
      ctx.lineTo(108, 74);
      ctx.stroke();

      // Little propeller
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(15, 42, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Procedural Coin (3D Metallic Star Gold Coin)
    createSafeCanvasTexture('coin_procedural', 44, 44, (ctx) => {
      // Outer drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(22, 24, 19, 0, Math.PI * 2);
      ctx.fill();

      // Outer golden rim
      const rimGrad = ctx.createLinearGradient(4, 4, 40, 40);
      rimGrad.addColorStop(0, '#fff494');
      rimGrad.addColorStop(0.3, '#f59e0b');
      rimGrad.addColorStop(0.7, '#d97706');
      rimGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(22, 22, 19, 0, Math.PI * 2);
      ctx.fill();

      // Inner coin bevel face
      const faceGrad = ctx.createRadialGradient(16, 16, 2, 22, 22, 16);
      faceGrad.addColorStop(0, '#fffbeb');
      faceGrad.addColorStop(0.4, '#fcd34d');
      faceGrad.addColorStop(0.85, '#f59e0b');
      faceGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.arc(22, 22, 15, 0, Math.PI * 2);
      ctx.fill();

      // Coin rim groove notches
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(22, 22, 14.5, 0, Math.PI * 2);
      ctx.stroke();

      // Embossed Star Motif ★
      ctx.fillStyle = '#fffbeb';
      ctx.shadowColor = 'rgba(120, 53, 15, 0.5)';
      ctx.shadowOffsetY = 1.5;
      ctx.beginPath();
      const cx = 22, cy = 22, spikes = 5, outerRadius = 8, innerRadius = 3.8;
      let rot = (Math.PI / 2) * 3;
      let x = cx, y = cy;
      const step = Math.PI / spikes;
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Specular highlight crescent
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(17, 12, 8, 3, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Procedural Gem (Faceted Cyan Diamond Gem)
    createSafeCanvasTexture('gem_procedural', 44, 44, (ctx) => {
      // Soft radiant cyan glow
      const glow = ctx.createRadialGradient(22, 22, 6, 22, 22, 21);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      glow.addColorStop(0.7, 'rgba(2, 132, 199, 0.15)');
      glow.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 44, 44);

      // Diamond Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.moveTo(22, 41);
      ctx.lineTo(39, 18);
      ctx.lineTo(5, 18);
      ctx.closePath();
      ctx.fill();

      // Lower Pavilion facet
      const pavGrad = ctx.createLinearGradient(22, 16, 22, 38);
      pavGrad.addColorStop(0, '#0284c7');
      pavGrad.addColorStop(0.5, '#0369a1');
      pavGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = pavGrad;
      ctx.beginPath();
      ctx.moveTo(7, 16);
      ctx.lineTo(37, 16);
      ctx.lineTo(22, 38);
      ctx.closePath();
      ctx.fill();

      // Left lower facet
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(7, 16);
      ctx.lineTo(22, 16);
      ctx.lineTo(22, 38);
      ctx.closePath();
      ctx.fill();

      // Right lower facet
      ctx.fillStyle = '#075985';
      ctx.beginPath();
      ctx.moveTo(22, 16);
      ctx.lineTo(37, 16);
      ctx.lineTo(22, 38);
      ctx.closePath();
      ctx.fill();

      // Upper Crown
      const crownGrad = ctx.createLinearGradient(12, 6, 32, 16);
      crownGrad.addColorStop(0, '#bae6fd');
      crownGrad.addColorStop(0.5, '#38bdf8');
      crownGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = crownGrad;
      ctx.beginPath();
      ctx.moveTo(13, 6);
      ctx.lineTo(31, 6);
      ctx.lineTo(37, 16);
      ctx.lineTo(7, 16);
      ctx.closePath();
      ctx.fill();

      // Center Table Facet
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(16, 6);
      ctx.lineTo(28, 6);
      ctx.lineTo(24, 16);
      ctx.lineTo(20, 16);
      ctx.closePath();
      ctx.fill();

      // Specular Star Flare Gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 7, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Crisp Facet Edges
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(13, 6);
      ctx.lineTo(31, 6);
      ctx.lineTo(37, 16);
      ctx.lineTo(22, 38);
      ctx.lineTo(7, 16);
      ctx.closePath();
      ctx.stroke();
    });

    // 7. Procedural Sparkle Particle (Radiant 4-Point Lens Flare)
    createSafeCanvasTexture('particle_sparkle', 24, 24, (ctx) => {
      const grad = ctx.createRadialGradient(12, 12, 1, 12, 12, 12);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fef08a');
      grad.addColorStop(0.7, '#f59e0b');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(12, 12, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(12, 1);
      ctx.quadraticCurveTo(12, 12, 23, 12);
      ctx.quadraticCurveTo(12, 12, 12, 23);
      ctx.quadraticCurveTo(12, 12, 1, 12);
      ctx.quadraticCurveTo(12, 12, 12, 1);
      ctx.closePath();
      ctx.fill();
    });

    // 8. Procedural Closed Treasure Chest (Studded Oak & Gold)
    createSafeCanvasTexture('chest_closed', 68, 56, (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(34, 51, 28, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const woodGrad = ctx.createLinearGradient(6, 20, 62, 50);
      woodGrad.addColorStop(0, '#92400e');
      woodGrad.addColorStop(0.5, '#78350f');
      woodGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(6, 20, 56, 30, [0, 0, 8, 8]) : ctx.fillRect(6, 20, 56, 30);
      ctx.fill();

      const lidGrad = ctx.createLinearGradient(6, 6, 62, 22);
      lidGrad.addColorStop(0, '#b45309');
      lidGrad.addColorStop(0.5, '#92400e');
      lidGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = lidGrad;
      ctx.beginPath();
      ctx.arc(34, 22, 28, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      const goldGrad = ctx.createLinearGradient(0, 0, 0, 56);
      goldGrad.addColorStop(0, '#fef08a');
      goldGrad.addColorStop(0.5, '#f59e0b');
      goldGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = goldGrad;

      ctx.fillRect(6, 18, 56, 5);
      ctx.fillRect(16, 7, 8, 43);
      ctx.fillRect(44, 7, 8, 43);

      ctx.fillStyle = '#fffbeb';
      for (const rx of [20, 48]) {
        for (const ry of [11, 28, 42]) {
          ctx.beginPath();
          ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(28, 22, 12, 14, 3) : ctx.fillRect(28, 22, 12, 14);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(34, 27, 2, 0, Math.PI * 2);
      ctx.fillRect(33, 27, 2, 4);
      ctx.fill();

      ctx.strokeStyle = '#291403';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 20, 56, 30);
    });

    // 9. Procedural Open Treasure Chest (Glorious Radiant Light Burst)
    createSafeCanvasTexture('chest_open', 68, 64, (ctx) => {
      ctx.fillStyle = '#5c2c06';
      ctx.beginPath();
      ctx.ellipse(34, 14, 26, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      const glow = ctx.createRadialGradient(34, 24, 4, 34, 24, 32);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.3, '#fef08a');
      glow.addColorStop(0.7, '#f59e0b');
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(4, 0, 60, 36);

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(24, 20, 8, 0, Math.PI * 2);
      ctx.arc(44, 18, 9, 0, Math.PI * 2);
      ctx.arc(34, 22, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(34, 12);
      ctx.lineTo(40, 19);
      ctx.lineTo(34, 26);
      ctx.lineTo(28, 19);
      ctx.closePath();
      ctx.fill();

      const woodGrad = ctx.createLinearGradient(6, 26, 62, 58);
      woodGrad.addColorStop(0, '#92400e');
      woodGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(6, 26, 56, 32);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(16, 26, 8, 32);
      ctx.fillRect(44, 26, 8, 32);
      ctx.fillRect(6, 24, 56, 4);

      ctx.strokeStyle = '#291403';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 26, 56, 32);
    });

    // 10. Procedural Springboard Up (3D Coiled Spring & Brass Pad)
    createSafeCanvasTexture('springboard_up', 52, 40, (ctx) => {
      // Wood base plate
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 32, 44, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 33, 40, 6);

      // Coiled spring
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(18, 32);
      ctx.lineTo(34, 25);
      ctx.lineTo(18, 18);
      ctx.lineTo(34, 11);
      ctx.lineTo(26, 6);
      ctx.stroke();

      // Top bouncy pad with hazard chevrons
      const padGrad = ctx.createLinearGradient(6, 2, 46, 8);
      padGrad.addColorStop(0, '#fef08a');
      padGrad.addColorStop(0.5, '#f59e0b');
      padGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(6, 2, 40, 7, 3) : ctx.fillRect(6, 2, 40, 7);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 11. Procedural Springboard Down (compressed)
    createSafeCanvasTexture('springboard_down', 52, 26, (ctx) => {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(4, 18, 44, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 19, 40, 6);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(16, 18);
      ctx.lineTo(36, 14);
      ctx.lineTo(16, 10);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(6, 4, 40, 7, 3) : ctx.fillRect(6, 4, 40, 7);
      ctx.fill();
    });

    // 12. Procedural Obstacle Rock (Stylized Rounded Mossy Boulder)
    createSafeCanvasTexture('obstacle_rock', 52, 44, (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(26, 40, 22, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rounded Boulder Body
      const stoneGrad = ctx.createLinearGradient(8, 8, 46, 40);
      stoneGrad.addColorStop(0, '#94a3b8');
      stoneGrad.addColorStop(0.5, '#64748b');
      stoneGrad.addColorStop(1, '#334155');
      ctx.fillStyle = stoneGrad;
      ctx.beginPath();
      ctx.moveTo(8, 38);
      ctx.quadraticCurveTo(4, 18, 20, 10);
      ctx.quadraticCurveTo(26, 5, 36, 11);
      ctx.quadraticCurveTo(48, 18, 46, 38);
      ctx.closePath();
      ctx.fill();

      // Natural stone cracks & highlights
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(18, 13);
      ctx.quadraticCurveTo(26, 9, 32, 15);
      ctx.lineTo(28, 23);
      ctx.closePath();
      ctx.fill();

      // Lush Cartoon Moss Patch on Top
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(26, 11, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.ellipse(23, 10, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle golden warning indicator
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(26, 24, 20, Math.PI * 0.8, Math.PI * 1.2);
      ctx.stroke();
    });

    // 13. Procedural Platform Block
    createSafeCanvasTexture('runner_platform', 150, 40, (ctx) => {
      // Dirt body
      const dirtGrad = ctx.createLinearGradient(0, 10, 0, 40);
      dirtGrad.addColorStop(0, '#78350f');
      dirtGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = dirtGrad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(0, 10, 150, 30, [0, 0, 10, 10]) : ctx.fillRect(0, 10, 150, 30);
      ctx.fill();

      // Top lush grass
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, 150, 12);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 0, 150, 4);

      // Grass tufts
      ctx.fillStyle = '#86efac';
      for (let i = 8; i < 145; i += 18) {
        ctx.fillRect(i, 8, 4, 4);
      }
    });
  }

  create(): void {
    // Initialize SoundManager with current scene audio context
    try {
      SoundManager.init(this);
    } catch (e) {
      console.warn('[PreloadScene] Failed to initialize SoundManager:', e);
    }

    // Clean up timer if active
    if (this.tipTimer) {
      this.tipTimer.remove();
      this.tipTimer = null;
    }

    // Transition immediately to TitleScene
    if (this.scene) {
      this.scene.start('TitleScene');
    }
  }
}
