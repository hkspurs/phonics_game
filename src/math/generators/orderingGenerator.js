/**
 * Ordering generator: Order numbers ascending or descending.
 * Difficulty 1: 3 numbers ascending only, range 1-10.
 * Difficulty 2: 4 numbers asc/desc, range 1-15.
 * Difficulty 3: 5-6 numbers, range 1-20.
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */
export function generate(config) {
  const { difficulty, random } = config;

  let numItems, rangeMax, direction;

  if (difficulty <= 1) {
    numItems = 3;
    rangeMax = 10;
    direction = 'ascending';
  } else if (difficulty === 2) {
    numItems = 4;
    rangeMax = 15;
    direction = random.next() > 0.5 ? 'ascending' : 'descending';
  } else {
    numItems = random.int(5, 6);
    rangeMax = 20;
    direction = random.next() > 0.5 ? 'ascending' : 'descending';
  }

  // Generate unique values
  const values = new Set();
  let attempts = 0;
  while (values.size < numItems && attempts < 100) {
    values.add(random.int(1, rangeMax));
    attempts++;
  }

  // Fallback: if we couldn't generate enough unique values, fill sequentially
  if (values.size < numItems) {
    for (let i = 1; i <= rangeMax && values.size < numItems; i++) {
      values.add(i);
    }
  }

  const items = [...values];
  const sorted = [...items].sort((a, b) =>
    direction === 'ascending' ? a - b : b - a
  );

  // Shuffle items for presentation (child needs to reorder them)
  const shuffled = random.shuffle(items);

  const fingerprint = `number_ordering_1_20:${items.sort((a, b) => a - b).join(',')}`;

  return {
    id: fingerprint,
    skillId: 'number_ordering_1_20',
    type: 'ordering',
    answer: sorted,
    choices: shuffled,
    values: {
      items,
      direction,
    },
    fingerprint,
  };
}
