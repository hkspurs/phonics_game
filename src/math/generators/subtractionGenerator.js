import { objectThemes } from '../data/objectThemes.js';

/**
 * Subtraction generator: Visual subtraction within 10.
 * a - b = ? where a ≤ 10, result ≥ 0.
 * Difficulty 1: a ≤ 5. Difficulty 2: a ≤ 8. Difficulty 3: a ≤ 10.
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */
export function generate(config) {
  const { difficulty, random } = config;

  // Max 'a' based on difficulty
  let maxA;
  if (difficulty <= 1) {
    maxA = 5;
  } else if (difficulty === 2) {
    maxA = 8;
  } else {
    maxA = 10;
  }

  // Generate a and b such that a - b ≥ 0
  const a = random.int(0, maxA);
  const b = random.int(0, a);
  const result = a - b;

  const theme = random.pick(objectThemes);

  // Generate 4 choices including the correct answer
  const choices = new Set([result]);
  while (choices.size < 4) {
    const distractor = random.int(0, 10);
    if (distractor !== result) {
      choices.add(distractor);
    }
  }

  const fingerprint = `subtraction_within_10:${a}:${b}`;

  return {
    id: fingerprint,
    skillId: 'subtraction_within_10',
    type: 'subtraction',
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
