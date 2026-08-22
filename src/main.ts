import Phaser from 'phaser';
import { DEFAULT_GAME_SETTINGS } from './config';

export const phaserGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: DEFAULT_GAME_SETTINGS.parent,
  width: DEFAULT_GAME_SETTINGS.width,
  height: DEFAULT_GAME_SETTINGS.height,
  backgroundColor: DEFAULT_GAME_SETTINGS.backgroundColor,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: {
    preload() {
      // Scaffolding preload placeholder
    },
    create() {
      // Scaffolding create placeholder
      const text = this.add.text(640, 360, '升夢大冒險 - P1 Adventure', {
        fontSize: '36px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
    },
  },
};

// Auto-instantiate Phaser when running in browser DOM environment
if (typeof window !== 'undefined' && document.getElementById(DEFAULT_GAME_SETTINGS.parent)) {
  new Phaser.Game(phaserGameConfig);
}
