import { getChineseSpaceChapter } from './chineseSpaceWords';

export const CHINESE_SPACE_QUESTION_COUNT = 10;
export const CHINESE_SPACE_STARTING_HP = 3;
export const CHINESE_SPACE_TIME_LIMIT_MS = 8000;
export const CHINESE_SPACE_FIRE_INTERVAL_MS = 220;
export const CHINESE_SPACE_GEM_REWARD = 5;
export const CHINESE_SPACE_BADGES = [
  { id: 'school-common', chapterId: 'school', label: '學校小飛行員', tier: 'common', price: 5 },
  { id: 'school-rare', chapterId: 'school', label: '學校星際隊長', tier: 'rare', price: 15 },
  { id: 'school-special', chapterId: 'school', label: '學校銀河守護者', tier: 'special', price: 30 },
  { id: 'park-common', chapterId: 'park', label: '公園小飛行員', tier: 'common', price: 5 },
  { id: 'park-rare', chapterId: 'park', label: '公園星際隊長', tier: 'rare', price: 15 },
  { id: 'park-special', chapterId: 'park', label: '公園銀河守護者', tier: 'special', price: 30 },
  { id: 'family-common', chapterId: 'family', label: '家庭小飛行員', tier: 'common', price: 5 },
  { id: 'family-rare', chapterId: 'family', label: '家庭星際隊長', tier: 'rare', price: 15 },
  { id: 'family-special', chapterId: 'family', label: '家庭銀河守護者', tier: 'special', price: 30 },
];

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildChineseSpaceSession(chapterId, random = Math.random, size = CHINESE_SPACE_QUESTION_COUNT) {
  const chapter = getChineseSpaceChapter(chapterId);
  if (!chapter) return [];

  return shuffle(chapter.words, random).slice(0, Math.min(size, chapter.words.length)).map((answerWord) => {
    const distractors = shuffle(chapter.words.filter((word) => word.id !== answerWord.id), random)
      .slice(0, 2)
      .map((word) => word.text);
    return { id: answerWord.id, answer: answerWord.text, distractors };
  });
}

export function calculateAverageReactionTime(reactionTimes) {
  if (reactionTimes.length === 0) return 0;
  return Math.round(reactionTimes.reduce((total, time) => total + time, 0) / reactionTimes.length);
}

export function getChineseSpaceBadge(badgeId) {
  return CHINESE_SPACE_BADGES.find((badge) => badge.id === badgeId);
}

export function canRedeemChineseSpaceBadge(badgeId, spaceGems, ownedBadgeIds) {
  const badge = getChineseSpaceBadge(badgeId);
  return Boolean(badge && spaceGems >= badge.price && !ownedBadgeIds.includes(badgeId));
}
