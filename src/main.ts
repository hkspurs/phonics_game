import Phaser from 'phaser';
import { DEFAULT_GAME_SETTINGS, GAME_WIDTH, GAME_HEIGHT } from './config';
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
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  roundPixels: true,
  backgroundColor: '#0b0f19',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
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
  const game = new Phaser.Game(phaserGameConfig);
  (window as any).__PHASER_GAME__ = game;

  const handleResize = () => {
    if (game && game.scale) {
      game.scale.refresh();
      if (typeof (game.scale as any).updateBounds === 'function') {
        (game.scale as any).updateBounds();
      }
    }
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 150);
    setTimeout(handleResize, 400);
  });
  window.addEventListener('fullscreenchange', () => {
    setTimeout(handleResize, 100);
  });
  window.addEventListener('webkitfullscreenchange', () => {
    setTimeout(handleResize, 100);
  });
}
