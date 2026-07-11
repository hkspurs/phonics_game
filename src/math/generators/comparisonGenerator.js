/**
 * Comparison generator: Compare two quantities.
 * Difficulty 1: obvious difference (diff ≥ 3).
 * Difficulty 2: closer values (diff ≥ 2).
 * Difficulty 3: adjacent values (diff can be 0 or 1).
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */
export function generate(config) {
  const { difficulty, random } = config;

  let a, b;

  if (difficulty <= 1) {
    // Obvious difference, diff ≥ 3
    a = random.int(4, 20);
    const diff = random.int(3, Math.min(6, a - 1));
    b = random.next() > 0.5 ? a - diff : a + diff;
    // Clamp b to valid range
    if (b < 1) b = a + diff;
    if (b > 20) b = a - diff;
  } else if (difficulty === 2) {
    // Closer values, diff ≥ 2
    a = random.int(3, 18);
    const diff = random.int(2, 4);
    b = random.next() > 0.5 ? a - diff : a + diff;
    if (b < 1) b = a + diff;
    if (b > 20) b = a - diff;
  } else {
    // Adjacent values or equal
    a = random.int(1, 20);
    const diff = random.int(0, 1);
    if (diff === 0) {
      b = a;
    } else {
      b = random.next() > 0.5 ? a - 1 : a + 1;
      if (b < 1) b = a + 1;
      if (b > 20) b = a - 1;
    }
  }

  // Determine correct answer
  let answer;
  if (a > b) {
    answer = 'bigger';
  } else if (a < b) {
    answer = 'smaller';
  } else {
    answer = 'equal';
  }

  const choices = [
    { value: 'bigger', label: '更多' },
    { value: 'smaller', label: '更少' },
    { value: 'equal', label: '一樣' },
  ];

  const fingerprint = `compare_quantity_1_20:${a}:${b}`;

  return {
    id: fingerprint,
    skillId: 'compare_quantity_1_20',
    type: 'comparison',
    answer,
    choices: choices.map(c => c.value),
    values: {
      a,
      b,
      choiceLabels: choices,
    },
    fingerprint,
  };
}
