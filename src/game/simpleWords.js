import audioManifest from '../../data/audio_manifest.json';

export const SIMPLE_WORDS = Object.values(audioManifest)
  .filter((item) => item.curriculum === 'simple_word')
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
