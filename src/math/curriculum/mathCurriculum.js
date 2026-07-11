/**
 * Mathematics Curriculum Definition
 * 
 * Defines the progression of mathematical skills in themed units.
 * Data-driven — no route logic here.
 * 
 * MVP covers: counting, ordering, comparison, ordinal position,
 * number bonds, addition, subtraction, shapes and patterns.
 */

export const SKILL_IDS = {
  NUMBER_COUNTING: 'number_counting_1_20',
  NUMBER_ORDERING: 'number_ordering_1_20',
  COMPARE_QUANTITY: 'compare_quantity_1_20',
  ORDINAL_POSITION: 'ordinal_position_1_10',
  NUMBER_BONDS: 'number_bonds_to_10',
  ADDITION: 'addition_within_10',
  SUBTRACTION: 'subtraction_within_10',
  SHAPE_PATTERN: 'shape_and_pattern_basics',
};

export const SKILL_LABELS = {
  [SKILL_IDS.NUMBER_COUNTING]: { en: 'Counting', zh: '數數' },
  [SKILL_IDS.NUMBER_ORDERING]: { en: 'Ordering', zh: '排列' },
  [SKILL_IDS.COMPARE_QUANTITY]: { en: 'Comparing', zh: '比較' },
  [SKILL_IDS.ORDINAL_POSITION]: { en: 'Position', zh: '位置' },
  [SKILL_IDS.NUMBER_BONDS]: { en: 'Number Bonds', zh: '湊數' },
  [SKILL_IDS.ADDITION]: { en: 'Addition', zh: '加法' },
  [SKILL_IDS.SUBTRACTION]: { en: 'Subtraction', zh: '減法' },
  [SKILL_IDS.SHAPE_PATTERN]: { en: 'Patterns', zh: '規律' },
};

export const SKILL_EMOJIS = {
  [SKILL_IDS.NUMBER_COUNTING]: '🔢',
  [SKILL_IDS.NUMBER_ORDERING]: '📊',
  [SKILL_IDS.COMPARE_QUANTITY]: '⚖️',
  [SKILL_IDS.ORDINAL_POSITION]: '🏃',
  [SKILL_IDS.NUMBER_BONDS]: '🤝',
  [SKILL_IDS.ADDITION]: '➕',
  [SKILL_IDS.SUBTRACTION]: '➖',
  [SKILL_IDS.SHAPE_PATTERN]: '🔷',
};

/**
 * Difficulty ranges per skill.
 * level 1 = easiest, level 3 = hardest within MVP.
 */
export const SKILL_DIFFICULTY_RANGE = {
  [SKILL_IDS.NUMBER_COUNTING]: { min: 1, max: 3 },
  [SKILL_IDS.NUMBER_ORDERING]: { min: 1, max: 3 },
  [SKILL_IDS.COMPARE_QUANTITY]: { min: 1, max: 3 },
  [SKILL_IDS.ORDINAL_POSITION]: { min: 1, max: 2 },
  [SKILL_IDS.NUMBER_BONDS]: { min: 1, max: 3 },
  [SKILL_IDS.ADDITION]: { min: 1, max: 3 },
  [SKILL_IDS.SUBTRACTION]: { min: 1, max: 3 },
  [SKILL_IDS.SHAPE_PATTERN]: { min: 1, max: 2 },
};

/**
 * Curriculum units — ordered progression.
 * Each unit groups related skills and defines unlock requirements.
 */
export const mathCurriculum = [
  {
    id: 'numbers-1-20',
    title: 'Number Meadow',
    titleZh: '數字草原',
    emoji: '🌻',
    color: '#22c55e',
    skills: [
      SKILL_IDS.NUMBER_COUNTING,
      SKILL_IDS.NUMBER_ORDERING,
      SKILL_IDS.COMPARE_QUANTITY,
    ],
    unlockRequirement: null, // First unit — always unlocked
  },
  {
    id: 'ordinal-world',
    title: 'Position Park',
    titleZh: '位置公園',
    emoji: '🎠',
    color: '#8b5cf6',
    skills: [
      SKILL_IDS.ORDINAL_POSITION,
    ],
    unlockRequirement: {
      masteredSkills: [SKILL_IDS.NUMBER_COUNTING],
    },
  },
  {
    id: 'number-bonds',
    title: 'Bond Bridge',
    titleZh: '湊數橋',
    emoji: '🌉',
    color: '#f59e0b',
    skills: [
      SKILL_IDS.NUMBER_BONDS,
    ],
    unlockRequirement: {
      masteredSkills: [SKILL_IDS.NUMBER_COUNTING, SKILL_IDS.NUMBER_ORDERING],
    },
  },
  {
    id: 'add-subtract',
    title: 'Calculation Castle',
    titleZh: '計算城堡',
    emoji: '🏰',
    color: '#ef4444',
    skills: [
      SKILL_IDS.ADDITION,
      SKILL_IDS.SUBTRACTION,
    ],
    unlockRequirement: {
      masteredSkills: [SKILL_IDS.NUMBER_BONDS],
    },
  },
  {
    id: 'patterns',
    title: 'Pattern Palace',
    titleZh: '圖案宮殿',
    emoji: '🎨',
    color: '#ec4899',
    skills: [
      SKILL_IDS.SHAPE_PATTERN,
    ],
    unlockRequirement: {
      masteredSkills: [SKILL_IDS.NUMBER_COUNTING],
    },
  },
];

/**
 * Get the unit that a skill belongs to.
 */
export function getUnitForSkill(skillId) {
  return mathCurriculum.find(unit => unit.skills.includes(skillId)) || null;
}

/**
 * Check if a unit is unlocked given the current mastered skills.
 * @param {object} unit - curriculum unit
 * @param {function} getSkillStatus - function that returns status for a skillId
 * @returns {boolean}
 */
export function isUnitUnlocked(unit, getSkillStatus) {
  if (!unit.unlockRequirement) return true;
  return unit.unlockRequirement.masteredSkills.every(
    skillId => getSkillStatus(skillId) === 'mastered'
  );
}

/**
 * Get all skills from all unlocked units.
 */
export function getUnlockedSkills(getSkillStatus) {
  const skills = [];
  for (const unit of mathCurriculum) {
    if (isUnitUnlocked(unit, getSkillStatus)) {
      skills.push(...unit.skills);
    }
  }
  return [...new Set(skills)];
}
