import { isRegularCvc, shuffleWords } from './simpleWords';

export function getWordValue(wordOrItem) {
  return typeof wordOrItem === 'string' ? wordOrItem.toUpperCase() : wordOrItem?.word?.toUpperCase();
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
