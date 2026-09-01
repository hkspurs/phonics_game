export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_TITLE = '升夢大冒險 —— 香港小一學科闖關';
export const GAME_VERSION = '1.1.0';

export type StationId = number | string;

const STATION_ID_ALIASES: Record<string, number> = {
  st_central: 1,
  st_green: 2,
  st_cherry: 3,
  st_firefly: 4,
  st_ocean: 5,
};

/** Keep scene payloads compatible with the legacy string station IDs. */
export function normalizeStationId(stationId?: StationId): number {
  const key = String(stationId ?? 'st_central');
  const numeric = Number(key);
  if (Number.isInteger(numeric) && numeric >= 1) return numeric;
  return STATION_ID_ALIASES[key] || 1;
}

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
