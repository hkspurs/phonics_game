export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_TITLE = '升夢大冒險 —— 香港小一學科闖關';
export const GAME_VERSION = '1.1.0';

export interface GameSettings {
  width: number;
  height: number;
  title: string;
  parent: string;
  backgroundColor: string;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  title: GAME_TITLE,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
};
