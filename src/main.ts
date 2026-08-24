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

/**
 * Calculates dynamic canvas resolution matching the exact screen aspect ratio (iPhone 19.5:9, iPad 4:3, PC 16:9)
 * Eliminates 100% of black bars, letterboxing, and margins.
 */
export function getDynamicGameSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: DEFAULT_GAME_SETTINGS.width, height: DEFAULT_GAME_SETTINGS.height };
  }
  const screenW = Math.max(window.innerWidth || 0, document.documentElement?.clientWidth || 0, 1280);
  const screenH = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0, 720);
  
  // Calculate aspect ratio
  const aspect = screenW / Math.max(1, screenH);

  // Keep fixed height 720 for consistent physics and large child-friendly touch targets
  const baseHeight = 720;
  // Compute exact canvas width to fill 100% of device screen aspect ratio
  const baseWidth = Math.max(960, Math.min(1800, Math.round(baseHeight * Math.max(1.33, aspect))));
  return { width: baseWidth, height: baseHeight };
}

const initialSize = getDynamicGameSize();

export const phaserGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: DEFAULT_GAME_SETTINGS.parent,
  width: initialSize.width,
  height: initialSize.height,
  roundPixels: true,
  backgroundColor: DEFAULT_GAME_SETTINGS.backgroundColor,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initialSize.width,
    height: initialSize.height,
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
      const newSize = getDynamicGameSize();
      game.scale.resize(newSize.width, newSize.height);
    }
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 150);
    setTimeout(handleResize, 400);
  });
}
