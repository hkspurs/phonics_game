import Phaser from 'phaser';
import { DataManager } from '../services/DataManager';
import { SpeechService } from '../services/SpeechService';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  init(): void {
    // Configure scale settings if scale manager is present
    if (this.scale) {
      if (this.scale.scaleMode !== Phaser.Scale.FIT) {
        this.scale.scaleMode = Phaser.Scale.FIT;
      }
      if (this.scale.autoCenter !== Phaser.Scale.CENTER_BOTH) {
        this.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
      }
    }
  }

  create(): void {
    // 1. Initialize persistent data manager
    try {
      DataManager.getInstance();
    } catch (e) {
      console.warn('[BootScene] Failed to initialize DataManager:', e);
    }

    // 2. Initialize speech service and bind audio unlocking on first user interaction
    try {
      SpeechService.init();
      if (this.input) {
        this.input.once('pointerdown', () => {
          SpeechService.unlockAudio();
        });
      }
    } catch (e) {
      console.warn('[BootScene] Failed to setup SpeechService:', e);
    }

    // 3. Immediately transition to PreloadScene
    if (this.scene) {
      this.scene.start('PreloadScene');
    }
  }
}
