import { SKILL_IDS } from './mathCurriculum';
import { mathQuestionEngine } from '../engine/MathQuestionEngine';
import { createRandom } from '../engine/random';

const getSampleQuestion = (skillId) => {
  const seed = skillId.length * 42;
  try {
    return mathQuestionEngine.generateQuestion(skillId, { 
      difficulty: 1, 
      random: createRandom(seed)
    });
  } catch(e) {
    console.warn("Failed generating sample for", skillId, e);
    return null;
  }
};

/**
 * Metadata for Parent Dashboard Skill Details
 */
export const SKILL_METADATA = {
  [SKILL_IDS.NUMBER_COUNTING]: {
    id: SKILL_IDS.NUMBER_COUNTING,
    unitId: 'numbers-1-20',
    titleZh: '數數 1-20',
    titleEn: 'Counting 1-20',
    parentDescriptionZh: '讓小朋友學習正確地點數物件，理解數字代表的數量，避免漏數或重複數同一個物件。',
    questionTypes: ['counting'],
    levels: [1, 2, 3],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.NUMBER_COUNTING)
  },
  [SKILL_IDS.NUMBER_ORDERING]: {
    id: SKILL_IDS.NUMBER_ORDERING,
    unitId: 'numbers-1-20',
    titleZh: '數字排序',
    titleEn: 'Number Ordering',
    parentDescriptionZh: '學習數字的先後次序，例如「3 之後是 4」，以及分辨由小到大或由大到小排列。',
    questionTypes: ['missing_number', 'sequence'],
    levels: [1, 2, 3],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.NUMBER_ORDERING)
  },
  [SKILL_IDS.COMPARE_QUANTITY]: {
    id: SKILL_IDS.COMPARE_QUANTITY,
    unitId: 'numbers-1-20',
    titleZh: '比較數量',
    titleEn: 'Compare Quantity',
    parentDescriptionZh: '分辨哪一組物件較多或較少，建立對大小的基本概念。',
    questionTypes: ['compare_quantity'],
    levels: [1, 2, 3],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.COMPARE_QUANTITY)
  },
  [SKILL_IDS.ORDINAL_POSITION]: {
    id: SKILL_IDS.ORDINAL_POSITION,
    unitId: 'ordinal-world',
    titleZh: '序數與位置',
    titleEn: 'Ordinal Position',
    parentDescriptionZh: '理解「第幾個」、前面及後面的人數，分辨「基數」(例如3個人) 與「序數」(例如第3個)。',
    questionTypes: ['queue_position', 'who_is_first'],
    levels: [1, 2],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.ORDINAL_POSITION)
  },
  [SKILL_IDS.NUMBER_BONDS]: {
    id: SKILL_IDS.NUMBER_BONDS,
    unitId: 'number-bonds',
    titleZh: '數的組合',
    titleEn: 'Number Bonds',
    parentDescriptionZh: '明白一個數字可以拆分成兩個小數字（例如 5 可以分成 2 和 3），這是加減法的基礎。',
    questionTypes: ['number_bond'],
    levels: [1, 2, 3],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.NUMBER_BONDS)
  },
  [SKILL_IDS.ADDITION]: {
    id: SKILL_IDS.ADDITION,
    unitId: 'add-subtract',
    titleZh: '基本加法',
    titleEn: 'Addition basics',
    parentDescriptionZh: '將兩組物件合併計算總數。',
    questionTypes: ['addition'],
    levels: [1, 2, 3],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.ADDITION)
  },
  [SKILL_IDS.SUBTRACTION]: {
    id: SKILL_IDS.SUBTRACTION,
    unitId: 'add-subtract',
    titleZh: '基本減法',
    titleEn: 'Subtraction basics',
    parentDescriptionZh: '從一組物件中拿走一部分，計算剩下的數量。',
    questionTypes: ['subtraction'],
    levels: [1, 2, 3],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.SUBTRACTION)
  },
  [SKILL_IDS.SHAPE_PATTERN]: {
    id: SKILL_IDS.SHAPE_PATTERN,
    unitId: 'patterns',
    titleZh: '圖形與規律',
    titleEn: 'Shapes & Patterns',
    parentDescriptionZh: '觀察並預測重複出現的圖案或形狀序列。',
    questionTypes: ['pattern'],
    levels: [1, 2],
    sampleQuestionFactory: () => getSampleQuestion(SKILL_IDS.SHAPE_PATTERN)
  }
};
