import { objectThemes } from '../data/objectThemes.js';

/**
 * Addition generator: Visual addition within 10.
 * a + b = ? where result ≤ 10, a ≥ 0, b ≥ 0.
 * Difficulty 1: result ≤ 5. Difficulty 2: result ≤ 8. Difficulty 3: result ≤ 10.
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */
export function generate(config) {
  const { difficulty, random } = config;

  // Max result based on difficulty
  let maxResult;
  if (difficulty <= 1) {
    maxResult = 5;
  } else if (difficulty === 2) {
    maxResult = 8;
  } else {
    maxResult = 10;
  }

  // Generate a and b such that a + b ≤ maxResult
  const result = random.int(0, maxResult);
  const a = random.int(0, result);
  const b = result - a;

  const theme = random.pick(objectThemes);

  // Generate 4 choices including the correct answer
  const choices = new Set([result]);
  while (choices.size < 4) {
    const distractor = random.int(0, 10);
    if (distractor !== result) {
      choices.add(distractor);
    }
  }

  const fingerprint = `addition_within_10:${a}:${b}`;

  return {
    id: fingerprint,
    skillId: 'addition_within_10',
    type: 'addition',
    answer: result,
    choices: random.shuffle([...choices]),
    values: {
      a,
      b,
      result,
      theme: theme.id,
      emoji: theme.emoji,
      imgUrl: theme.imgUrl,
      label: theme.label,
    },
    fingerprint,
  };
}
