/**
 * Ordinal position generator: "Who is Nth in line?"
 * Queue size 3-10. Uses emoji characters for people.
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */

const PEOPLE_EMOJI = ['👦', '👧', '👨', '👩', '🧒', '👴', '👵', '🧑', '👶', '🤴'];

export function generate(config) {
  const { difficulty, random } = config;

  // Queue size scales with difficulty
  let minSize, maxSize;
  if (difficulty <= 1) {
    minSize = 3; maxSize = 5;
  } else if (difficulty === 2) {
    minSize = 4; maxSize = 7;
  } else {
    minSize = 5; maxSize = 10;
  }

  const queueSize = random.int(minSize, maxSize);
  const position = random.int(1, queueSize);

  // Pick unique emoji characters for the queue
  const availableEmoji = random.shuffle(PEOPLE_EMOJI);
  const queue = availableEmoji.slice(0, queueSize);

  // The answer is the character at the ordinal position (1-indexed)
  const answer = queue[position - 1];

  // Choices: 4 options from the queue
  const choices = new Set([answer]);
  const otherChars = queue.filter(c => c !== answer);
  const shuffledOthers = random.shuffle(otherChars);
  for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
    choices.add(shuffledOthers[i]);
  }

  const fingerprint = `ordinal_position_1_10:${position}:${queueSize}`;

  return {
    id: fingerprint,
    skillId: 'ordinal_position_1_10',
    type: 'ordinal',
    answer,
    choices: random.shuffle([...choices]),
    values: {
      position,
      queueSize,
      queue,
    },
    fingerprint,
  };
}
