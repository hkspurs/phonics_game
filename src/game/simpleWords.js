import audioManifest from '../../data/audio_manifest.json';

const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXZ';

export function isRegularCvc(word) {
  return typeof word === 'string'
    && word.length === 3
    && CONSONANTS.includes(word[0])
    && 'AEIOU'.includes(word[1])
    && CONSONANTS.includes(word[2]);
}

const simpleEntries = Object.values(audioManifest)
  .filter((item) => item.curriculum === 'simple_word' && item.qaStatus !== 'fail' && isRegularCvc(item.expectedText));
const generatedWords = new Set(simpleEntries
  .filter((item) => item.generatedBy !== 'teacher_recording')
  .map((item) => item.expectedText));

export const SIMPLE_WORDS = simpleEntries
  .filter((item) => item.generatedBy !== 'teacher_recording' || !generatedWords.has(item.expectedText))
  .sort((a, b) => a.sequence - b.sequence)
  .map((item) => ({ id: item.id, word: item.expectedText }));

export function shuffleWords(words, random = Math.random) {
  const shuffled = [...words];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
