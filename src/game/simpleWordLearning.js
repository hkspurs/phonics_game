import { isRegularCvc, shuffleWords } from './simpleWords';

export const BLENDING_LEVELS = [
  { id: 1, titleKey: 'blendingLevelOne', descriptionKey: 'blendingLevelOneDescription' },
  { id: 2, titleKey: 'blendingLevelTwo', descriptionKey: 'blendingLevelTwoDescription' },
  { id: 3, titleKey: 'blendingLevelThree', descriptionKey: 'blendingLevelThreeDescription' },
  { id: 4, titleKey: 'blendingLevelFour', descriptionKey: 'blendingLevelFourDescription' },
];

export function getWordValue(wordOrItem) {
  return typeof wordOrItem === 'string' ? wordOrItem.toUpperCase() : wordOrItem?.word?.toUpperCase();
}

export function getLearningInputLength(level) {
  return level === 1 ? 0 : level === 4 ? 3 : level - 1;
}

export function getLearningTarget(wordOrItem, level) {
  const word = getWordValue(wordOrItem);
  const length = getLearningInputLength(level);
  return length ? word.slice(0, length) : null;
}

export function buildBlendingSession(words, random = Math.random, size = 16) {
  const uniqueWords = [];
  const seen = new Set();

  for (const word of words) {
    const value = getWordValue(word);
    if (isRegularCvc(value) && !seen.has(value)) {
      seen.add(value);
      uniqueWords.push(word);
    }
  }

  return shuffleWords(uniqueWords, random).slice(0, Math.min(size, uniqueWords.length));
}

export function buildBlendingTestSession(words, excludedWords = [], random = Math.random, size = 16) {
  const excluded = new Set(excludedWords.map(getWordValue));
  return buildBlendingSession(
    words.filter((word) => !excluded.has(getWordValue(word))),
    random,
    size,
  );
}

export function shuffleWordLetters(wordOrItem, random = Math.random) {
  const word = getWordValue(wordOrItem);
  const shuffled = shuffleWords(word.split(''), random);

  if (shuffled.length > 1 && shuffled.every((letter, index) => letter === word[index])) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled;
}
