import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GAME_TITLE } from '../config';
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
      adventurer_stand: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_stand.png',
      adventurer_walk1: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_walk1.png',
      adventurer_walk2: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_walk2.png',
      adventurer_jump: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_jump.png',
      adventurer_cheer1: 'assets/kenney/platformer-characters/PNG/Adventurer/Poses/adventurer_cheer1.png',
      soldier_stand: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_stand.png',
      soldier_walk1: 'assets/kenney/platformer-characters/PNG/Soldier/Poses/soldier_walk1.png',
      zombie_stand: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_stand.png',
      zombie_walk1: 'assets/kenney/platformer-characters/PNG/Zombie/Poses/zombie_walk1.png',
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

    // 5. Procedural Coin
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

    // 6. Procedural Gem
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

    // 7. Procedural Sparkle Particle
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
