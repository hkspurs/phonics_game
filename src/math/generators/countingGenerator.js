import { objectThemes } from '../data/objectThemes.js';

/**
 * Counting generator: Count 1-20 objects.
 * Difficulty 1: 1-5, Difficulty 2: 5-10, Difficulty 3: 10-20.
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */
export function generate(config) {
  const { difficulty, random } = config;

  // Determine count range based on difficulty
  let min, max;
  if (difficulty <= 1) {
    min = 2; max = 9;
  } else if (difficulty === 2) {
    min = 6; max = 15;
  } else {
    min = 12; max = 20;
  }

  const count = random.int(min, max);
  const theme = random.pick(objectThemes);

  // Generate 4 choices including the correct answer
  const choices = new Set([count]);
  while (choices.size < 4) {
    // Generate distractors near the correct answer for challenge
    const offset = random.int(1, Math.max(3, Math.floor(max / 2)));
    const sign = random.next() > 0.5 ? 1 : -1;
    const distractor = count + sign * offset;
    if (distractor >= 1 && distractor <= 20 && distractor !== count) {
      choices.add(distractor);
    }
  }

  const fingerprint = `number_counting_1_20:${count}`;

  return {
    id: fingerprint,
    skillId: 'number_counting_1_20',
    type: 'counting',
    answer: count,
    choices: random.shuffle([...choices]),
    values: {
      count,
      theme: theme.id,
      emoji: theme.emoji,
      imgUrl: theme.imgUrl,
      label: theme.label,
    },
    fingerprint,
  };
}
