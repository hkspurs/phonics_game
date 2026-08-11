import { isRegularCvc, shuffleWords } from './simpleWords';

const VOWEL_PHONEMES = {
  A: 'æ',
  E: 'ɛ',
  I: 'ɪ',
  O: 'ɒ',
  U: 'ʌ',
};

const CONSONANT_PHONEMES = {
  B: 'b',
  C: 'k',
  D: 'd',
  F: 'f',
  G: 'ɡ',
  H: 'h',
  J: 'dʒ',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  P: 'p',
  Q: 'k',
  R: 'ɹ',
  S: 's',
  T: 't',
  V: 'v',
  W: 'w',
  X: 'ks',
  Y: 'j',
  Z: 'z',
};

const CONTINUOUS_INITIALS = new Set(['f', 'h', 'l', 'm', 'n', 'r', 's', 'v', 'w', 'z']);

export function getWordValue(wordOrItem) {
  return typeof wordOrItem === 'string' ? wordOrItem.toUpperCase() : wordOrItem?.word?.toUpperCase();
}

export function getBlendAudioId(wordOrItem) {
  const word = getWordValue(wordOrItem);
  return `BLEND_${word}_SLOW`;
}

export function getBlendPhonemes(wordOrItem) {
  const word = getWordValue(wordOrItem);
  if (!isRegularCvc(word)) {
    throw new Error(`Cannot blend non-CVC word: ${word}`);
  }

  const initial = CONSONANT_PHONEMES[word[0]];
  const vowel = VOWEL_PHONEMES[word[1]];
  const final = CONSONANT_PHONEMES[word[2]];
  const heldInitial = CONTINUOUS_INITIALS.has(initial) ? initial.repeat(3) : initial;

  return `[[${heldInitial}${vowel.repeat(2)}${final}]]`;
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
