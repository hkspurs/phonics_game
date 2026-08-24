/**
 * Core TypeScript definitions for P1 Adventure (升夢大冒險)
 */

export type SubjectType = 'chinese' | 'math' | 'english';

export type QuestionType =
  | 'sentence_scramble'
  | 'multiple_choice'
  | 'math_calc'
  | 'comparison'
  | 'word_problem';

export type VoiceLanguage = 'zh-HK' | 'en-US' | 'zh-CN';

export interface GameSettings {
  chineseEnabled: boolean;
  mathEnabled: boolean;
  englishEnabled: boolean;
  voiceLanguage: VoiceLanguage;
  difficulty: number; // 1: Beginner, 2: Intermediate, 3: Advanced, 4: Challenge
  soundVolume: number; // 0.0 to 1.0
}

export type Settings = GameSettings;

export interface UserStats {
  chineseCorrect: number;
  mathCorrect: number;
  englishCorrect: number;
  streakDays: number;
  lastPlayedDate: string; // YYYY-MM-DD
}

export interface UserProfile {
  coins: number;
  gems: number;
  unlockedStations: number;
  stationStars: Record<number, number>; // stationId -> stars (0-3)
  equippedSkin: string;
  ownedSkins: string[];
  trophies: Record<string, boolean>; // trophyId -> boolean
  stats: UserStats;
  settings: GameSettings;
  stamps?: string[]; // unlocked HK landmark stamp IDs
  dailyQuest?: {
    date: string;
    completed: boolean;
    spinClaimed: boolean;
  };
}

export interface Station {
  id: number;
  name: string;
  englishName: string;
  description: string;
  biome: string;
  requiredStars?: number;
}

export interface QuizQuestion {
  id: string;
  subject: SubjectType;
  type: QuestionType;
  prompt: string;
  speakText: string;
  // For sentence scramble:
  correctTokens?: string[];
  shuffledTokens?: string[];
  // For choice quiz / math:
  options?: (string | number)[];
  correctOptionIndex?: number;
  correctAnswer?: number | string;
  hintText?: string;
}

export interface MathQuestion {
  id: string;
  type: 'addition' | 'subtraction' | 'comparison' | 'word_problem' | 'money' | 'time' | 'shape' | 'pattern' | 'mixed';
  prompt: string;
  expression: string;
  correctAnswer: number | string;
  options: (number | string)[]; // 3-4 randomized choices
}

export interface SentenceQuestion {
  id: string;
  subject: 'chinese' | 'english';
  prompt: string;
  correctOrder: string[];
  shuffledChips: string[];
}

export type TrophyCategory =
  | 'consistency'
  | 'chinese'
  | 'math'
  | 'english'
  | 'adventure'
  | 'wealth';

export interface Trophy {
  id: string;
  name: string;
  description: string;
  category: TrophyCategory;
  condition: (profile: UserProfile) => boolean;
  rewardGems?: number;
  rewardCoins?: number;
  icon?: string;
}

export type ItemCategory = 'character' | 'effect' | 'upgrade';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  costGems: number;
  costCoins?: number;
  perkDescription?: string;
  speedBonus?: number; // e.g. 0.15 = +15%
  jumpBonus?: number; // e.g. 0.10 = +10%
  magnetEffect?: boolean;
  waterGlide?: boolean;
  icon?: string;
}
