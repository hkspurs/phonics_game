import Phaser from 'phaser';
import { DEFAULT_GAME_SETTINGS } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { QuestionScene } from './scenes/QuestionScene';
import { RunnerScene } from './scenes/RunnerScene';
import { ResultScene } from './scenes/ResultScene';
import { ShopScene } from './scenes/ShopScene';
import { TrophyScene } from './scenes/TrophyScene';
import { SettingsScene } from './scenes/SettingsScene';

export {
  BootScene,
  PreloadScene,
  TitleScene,
  MapScene,
  QuestionScene,
  RunnerScene,
  ResultScene,
  ShopScene,
  TrophyScene,
  SettingsScene,
};

export const gameScenes = [
  BootScene,
  PreloadScene,
  TitleScene,
  MapScene,
  QuestionScene,
  RunnerScene,
  ResultScene,
  ShopScene,
  TrophyScene,
  SettingsScene,
];

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
  scene: gameScenes,
};

// Auto-instantiate Phaser when running in browser DOM environment
if (typeof window !== 'undefined' && document.getElementById(DEFAULT_GAME_SETTINGS.parent)) {
  new Phaser.Game(phaserGameConfig);
}
