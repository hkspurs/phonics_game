import { describe, expect, it } from 'vitest';
import {
  CHINESE_SPACE_CHAPTERS,
  getChineseSpaceChapter,
  getChineseSpaceWord,
} from './chineseSpaceWords';
import {
  CHINESE_SPACE_BADGES,
  CHINESE_SPACE_QUESTION_COUNT,
  buildChineseSpaceSession,
  calculateAverageReactionTime,
  canRedeemChineseSpaceBadge,
  getChineseSpaceBadge,
} from './chineseSpaceGame';

describe('Chinese space word catalog', () => {
  it('contains the three 28-word chapters and 84 unique word ids', () => {
    expect(CHINESE_SPACE_CHAPTERS).toHaveLength(3);
    expect(CHINESE_SPACE_CHAPTERS.map((chapter) => chapter.words)).toEqual([
      expect.arrayContaining([
        expect.objectContaining({ id: 'school-teacher', text: '老師' }),
        expect.objectContaining({ id: 'school-tomorrow', text: '明天' }),
      ]),
      expect.arrayContaining([
        expect.objectContaining({ id: 'park-older-brother', text: '哥哥' }),
        expect.objectContaining({ id: 'park-outdoors', text: '户外' }),
      ]),
      expect.arrayContaining([
        expect.objectContaining({ id: 'family-family', text: '家人' }),
        expect.objectContaining({ id: 'family-evening', text: '晚上' }),
      ]),
    ]);
    expect(CHINESE_SPACE_CHAPTERS.every((chapter) => chapter.words)).toBe(true);
    expect(CHINESE_SPACE_CHAPTERS.map((chapter) => chapter.words.length)).toEqual([28, 28, 28]);
    expect(new Set(CHINESE_SPACE_CHAPTERS.flatMap((chapter) => chapter.words.map((word) => word.id))).size).toBe(84);
    expect(getChineseSpaceChapter('school').label).toBe('學校篇');
    expect(getChineseSpaceWord('family-family')).toEqual({ id: 'family-family', text: '家人' });
  });
});

describe('Chinese space session rules', () => {
  it('builds ten unique questions with same-chapter, non-repeating distractors', () => {
    const session = buildChineseSpaceSession('school', () => 0, CHINESE_SPACE_QUESTION_COUNT);
    const chapterWords = new Set(getChineseSpaceChapter('school').words.map((word) => word.text));

    expect(session).toHaveLength(10);
    expect(new Set(session.map((question) => question.id)).size).toBe(10);
    session.forEach((question) => {
      expect(Object.keys(question).sort()).toEqual(['answer', 'distractors', 'id']);
      expect(question.distractors).toHaveLength(2);
      expect(new Set([question.answer, ...question.distractors]).size).toBe(3);
      expect(chapterWords.has(question.answer)).toBe(true);
      question.distractors.forEach((word) => expect(chapterWords.has(word)).toBe(true));
    });
  });
});

describe('Chinese space rewards and results', () => {
  it('rounds average reaction time and returns zero for no reactions', () => {
    expect(calculateAverageReactionTime([])).toBe(0);
    expect(calculateAverageReactionTime([801, 1200, 1999])).toBe(1333);
  });

  it('lists nine chapter badges at the required prices', () => {
    expect(CHINESE_SPACE_BADGES).toHaveLength(9);
    expect(CHINESE_SPACE_BADGES.map((badge) => badge.price)).toEqual([5, 15, 30, 5, 15, 30, 5, 15, 30]);
    expect(new Set(CHINESE_SPACE_BADGES.map((badge) => `${badge.chapterId}-${badge.tier}`)).size).toBe(9);
    expect(getChineseSpaceBadge('school-special')).toMatchObject({
      chapterId: 'school', label: '學校銀河守護者', tier: 'special', price: 30,
    });
  });

  it('allows redemption only with enough gems and without ownership', () => {
    expect(canRedeemChineseSpaceBadge('school-common', 5, [])).toBe(true);
    expect(canRedeemChineseSpaceBadge('school-common', 4, [])).toBe(false);
    expect(canRedeemChineseSpaceBadge('school-common', 5, ['school-common'])).toBe(false);
    expect(canRedeemChineseSpaceBadge('missing', 100, [])).toBe(false);
  });
});
