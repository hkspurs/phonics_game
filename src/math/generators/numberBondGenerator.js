/**
 * Number bonds generator: Find the missing part.
 * Difficulty 1: bonds to 5.
 * Difficulty 2-3: bonds to 10.
 * Given target and one part, find the other.
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */
export function generate(config) {
  const { difficulty, random } = config;

  // Target based on difficulty
  const target = difficulty <= 1 ? 5 : 10;

  // Generate a valid given part (0 to target)
  const givenPart = random.int(0, target);
  const missingPart = target - givenPart;

  // Generate 4 choices including the correct answer
  const choices = new Set([missingPart]);
  while (choices.size < 4) {
    const distractor = random.int(0, target);
    if (distractor !== missingPart) {
      choices.add(distractor);
    }
  }

  // Build ten-frame visual representation
  // Filled slots = givenPart, empty slots = missingPart
  const tenFrame = [];
  for (let i = 0; i < target; i++) {
    tenFrame.push(i < givenPart ? 'filled' : 'empty');
  }

  const fingerprint = `number_bonds_to_10:${target}:${givenPart}`;

  return {
    id: fingerprint,
    skillId: 'number_bonds_to_10',
    type: 'number_bonds',
    answer: missingPart,
    choices: random.shuffle([...choices]),
    values: {
      target,
      givenPart,
      missingPart,
      tenFrame,
    },
    fingerprint,
  };
}
