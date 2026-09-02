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

export interface EquippedWardrobe {
  dress?: string;
  top?: string;
  bottom?: string;
  hat?: string;
  accessory?: string;
  wings?: string;
}

export interface ProgressiveHints {
  level1Direction: string;
  level2VisualSupport: string;
  level3GuidedSolution: string;
}

export interface QuestionAttempt {
  questionId: string;
  stationId: number;
  subject: SubjectType;
  knowledgeTag: string;
  difficulty: number;
  selectedAnswerId: string | number;
  isCorrect: boolean;
  attemptNumber: number;
  hintLevelUsed: number;
  timestamp: number;
  responseTimeMs?: number;
}

export interface LearningAttemptRecord {
  attemptId: string;
  questionId: string;
  stationId: number;
  subject: SubjectType;
  knowledgeTags: string[];
  selectedAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  attemptIndexWithinQuestion: number;
  isFirstAttempt: boolean;
  highestHintLevelUsed: number;
  responseTimeMs?: number;
  createdAt: number;
  reviewOfAttemptId?: string;
}

export interface RewardTransaction {
  transactionId: string;
  sourceType: 'learning' | 'runner_pickups' | 'first_clear' | 'achievement' | 'shop_purchase' | 'migration' | 'daily_quest';
  sourceId: string;
  currencyType: 'coins' | 'gems' | 'stars';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: number;
}

export interface UserProfile {
  coins: number;
  gems: number;
  unlockedStations: number;
  completedStations?: number[];
  stationStars: Record<number, number>; // stationId -> stars (0-3)
  equippedSkin: string;
  ownedSkins: string[];
  equippedPet?: string;
  ownedPets?: string[];
  equippedWardrobe?: EquippedWardrobe;
  ownedWardrobe?: string[];
  inventory?: Record<string, number>; // gadgetId -> quantity
  trophies: Record<string, boolean>; // trophyId -> boolean
  stats: UserStats;
  settings: GameSettings;
  stamps?: string[]; // unlocked HK landmark stamp IDs
  dailyQuest?: {
    date: string;
    completed: boolean;
    spinClaimed: boolean;
  };
  rewardLedger?: RewardTransaction[];
  questionAttempts?: QuestionAttempt[];
  learningAttempts?: LearningAttemptRecord[];
  mistakeReviewQueue?: string[];
  runnerTutorialCompleted?: boolean;
  runnerSkippedCount?: number;
}

export interface PetDefinition {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  costCoins: number;
  costGems: number;
  perkDescription: string;
  magnetBonus: number; // +px radius
  jumpBonus?: number; // e.g. 0.15 = +15%
  bonusCoinRate?: number; // e.g. 1 extra coin on rock jump
  icon: string;
  tint: number;
}

export interface GadgetDefinition {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  costGems: number;
  effectType: 'shield' | 'magnet_potion' | 'hint_coupon' | 'double_coin';
  icon: string;
  duration?: number;
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
  knowledgeTag?: string;
  cognitiveLevel?: 1 | 2 | 3;
  explanation?: string;
  hints?: ProgressiveHints;
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
