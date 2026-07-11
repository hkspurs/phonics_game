/**
 * Pattern generator: Complete the pattern.
 * Templates: AB, AAB, ABB, ABC.
 * Show 4-8 items from the pattern, child picks the next.
 *
 * @param {{ difficulty: number, random: object, recentQuestionKeys: Set }} config
 * @returns {object} Normalised question object
 */

const PATTERN_SHAPES = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⬜', '🟤'];

const TEMPLATES = {
  AB:  [0, 1],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
  ABC: [0, 1, 2],
};

export function generate(config) {
  const { difficulty, random } = config;

  // Select template based on difficulty
  let availableTemplates;
  if (difficulty <= 1) {
    availableTemplates = ['AB'];
  } else if (difficulty === 2) {
    availableTemplates = ['AB', 'AAB', 'ABB'];
  } else {
    availableTemplates = ['AB', 'AAB', 'ABB', 'ABC'];
  }

  const templateName = random.pick(availableTemplates);
  const templatePattern = TEMPLATES[templateName];

  // Number of distinct shapes needed
  const numShapes = Math.max(...templatePattern) + 1;

  // Pick random shapes
  const shuffledShapes = random.shuffle(PATTERN_SHAPES);
  const selectedShapes = shuffledShapes.slice(0, numShapes);

  // Determine how many items to show (4-8)
  const numVisible = random.int(4, 8);

  // Generate the full pattern (visible + 1 for the answer)
  const totalItems = numVisible + 1;
  const fullPattern = [];
  for (let i = 0; i < totalItems; i++) {
    const patternIndex = templatePattern[i % templatePattern.length];
    fullPattern.push(selectedShapes[patternIndex]);
  }

  const visibleItems = fullPattern.slice(0, numVisible);
  const answer = fullPattern[numVisible];

  // Choices: include the correct answer and 3 distractors from shapes
  const choices = new Set([answer]);
  const allShapes = random.shuffle(PATTERN_SHAPES);
  for (const shape of allShapes) {
    if (choices.size >= 4) break;
    choices.add(shape);
  }

  const fingerprint = `shape_and_pattern_basics:${templateName}:${visibleItems.join('')}`;

  return {
    id: fingerprint,
    skillId: 'shape_and_pattern_basics',
    type: 'pattern',
    answer,
    choices: random.shuffle([...choices]),
    values: {
      template: templateName,
      visibleItems,
      selectedShapes,
      fullPattern,
    },
    fingerprint,
  };
}
