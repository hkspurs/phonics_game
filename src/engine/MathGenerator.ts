import type { MathQuestion } from '../types';

/**
 * MathGenerator
 * Dynamic Hong Kong Primary 1 (P.1) Math Question Generator.
 * Supports:
 * - Level 1: Within 10 (Addition, Subtraction, Comparison)
 * - Level 2: Within 20 (Addition, Subtraction, Comparison)
 * - Level 3: Hong Kong primary themed word problems (within 20)
 * - Level 4: Mixed operations (3 operands) & Fill-in-the-blank (within 20)
 */
export class MathGenerator {
  /**
   * Main entry point to generate a MathQuestion based on difficulty.
   * @param difficulty Level 1-4 (defaults to 1)
   */
  static generate(difficulty: number = 1): MathQuestion {
    const level = Math.min(Math.max(Math.floor(difficulty || 1), 1), 4);

    switch (level) {
      case 1:
        return this.generateLevel1();
      case 2:
        return this.generateLevel2();
      case 3:
        return this.generateWordProblem(20);
      case 4:
        return this.generateLevel4();
      default:
        return this.generateLevel1();
    }
  }

  /**
   * Level 1: Within 10 (Addition, Subtraction, Comparison)
   */
  private static generateLevel1(): MathQuestion {
    const roll = Math.random();
    if (roll < 0.45) {
      return this.generateAddition(10);
    } else if (roll < 0.85) {
      return this.generateSubtraction(10);
    } else {
      return this.generateComparison(10);
    }
  }

  /**
   * Level 2: Within 20 (Addition, Subtraction, Comparison)
   */
  private static generateLevel2(): MathQuestion {
    const roll = Math.random();
    if (roll < 0.45) {
      return this.generateAddition(20, 10);
    } else if (roll < 0.85) {
      return this.generateSubtraction(20, 10);
    } else {
      return this.generateComparison(20);
    }
  }

  /**
   * Level 4: Mixed operations & Fill-in-the-blank
   */
  private static generateLevel4(): MathQuestion {
    const roll = Math.random();
    if (roll < 0.45) {
      return this.generateFillInBlank(20);
    } else if (roll < 0.8) {
      return this.generateMixedOperation(20);
    } else {
      return this.generateTwoStepWordProblem(20);
    }
  }

  /**
   * Generates an addition question (a + b = ?)
   */
  static generateAddition(maxSum: number = 10, minSum: number = 2): MathQuestion {
    const sum = this.randomInt(minSum, maxSum);
    const a = this.randomInt(1, sum - 1);
    const b = sum - a;
    const correctAnswer = sum;
    const expression = `${a} + ${b} = ?`;
    const prompt = `計算以下加法算式：`;

    const distractors = this.generateDistractors(correctAnswer, [a, b], 3, 0, maxSum + 2);
    const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

    return {
      id: this.generateId('math_add'),
      type: 'addition',
      prompt,
      expression,
      correctAnswer,
      options,
    };
  }

  /**
   * Generates a subtraction question (a - b = ?)
   * Ensures non-negative result (a >= b).
   */
  static generateSubtraction(maxMinuend: number = 10, minMinuend: number = 2): MathQuestion {
    const a = this.randomInt(minMinuend, maxMinuend);
    const b = this.randomInt(0, a);
    const correctAnswer = a - b;
    const expression = `${a} - ${b} = ?`;
    const prompt = `計算以下減法算式：`;

    const distractors = this.generateDistractors(correctAnswer, [a, b], 3, 0, maxMinuend + 2);
    const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

    return {
      id: this.generateId('math_sub'),
      type: 'subtraction',
      prompt,
      expression,
      correctAnswer,
      options,
    };
  }

  /**
   * Generates a comparison question
   */
  static generateComparison(maxVal: number = 10): MathQuestion {
    const comparisonTypes = ['diff_more', 'diff_less', 'target_more', 'target_less'];
    const chosenType = comparisonTypes[this.randomInt(0, comparisonTypes.length - 1)];

    let prompt = '';
    let expression = '';
    let correctAnswer = 0;
    let operands: number[] = [];

    if (chosenType === 'diff_more') {
      const a = this.randomInt(3, maxVal);
      const b = this.randomInt(1, a - 1);
      correctAnswer = a - b;
      operands = [a, b];
      prompt = `${a} 比 ${b} 大多少？`;
      expression = `${a} - ${b} = ?`;
    } else if (chosenType === 'diff_less') {
      const a = this.randomInt(1, maxVal - 2);
      const b = this.randomInt(a + 1, maxVal);
      correctAnswer = b - a;
      operands = [b, a];
      prompt = `${a} 比 ${b} 少多少？`;
      expression = `${b} - ${a} = ?`;
    } else if (chosenType === 'target_more') {
      const a = this.randomInt(1, Math.max(1, maxVal - 5));
      const delta = this.randomInt(1, Math.min(5, maxVal - a));
      correctAnswer = a + delta;
      operands = [a, delta];
      prompt = `比 ${a} 大 ${delta} 的數是多少？`;
      expression = `${a} + ${delta} = ?`;
    } else {
      const a = this.randomInt(3, maxVal);
      const delta = this.randomInt(1, a - 1);
      correctAnswer = a - delta;
      operands = [a, delta];
      prompt = `比 ${a} 少 ${delta} 的數是多少？`;
      expression = `${a} - ${delta} = ?`;
    }

    const distractors = this.generateDistractors(correctAnswer, operands, 3, 0, maxVal + 3);
    const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

    return {
      id: this.generateId('math_comp'),
      type: 'comparison',
      prompt,
      expression,
      correctAnswer,
      options,
    };
  }

  /**
   * Generates authentic Hong Kong P.1 Word Problems
   */
  static generateWordProblem(maxBound: number = 20): MathQuestion {
    const isAddition = Math.random() < 0.5;

    interface WordProblemTemplate {
      template: (name: string, a: number, b: number) => string;
      item: string;
      unit: string;
    }

    const additionTemplates: WordProblemTemplate[] = [
      {
        template: (name, a, b) => `${name}有 ${a} 粒糖果，媽媽再給他 ${b} 粒，${name}現在共有糖果多少粒？`,
        item: '糖果',
        unit: '粒',
      },
      {
        template: (name, a, b) => `${name}的文具盒裡有 ${a} 支鉛筆和 ${b} 支蠟筆，文具盒裡共有筆多少支？`,
        item: '鉛筆',
        unit: '支',
      },
      {
        template: (name, a, b) => `${name}搭乘巴士，車上有 ${a} 位乘客，到站後又有 ${b} 位乘客上車，現在車上有乘客多少位？`,
        item: '巴士',
        unit: '位',
      },
      {
        template: (name, a, b) => `${name}的果籃裡有 ${a} 個蘋果和 ${b} 個橙，果籃裡共有水果多少個？`,
        item: '水果',
        unit: '個',
      },
      {
        template: (name, a, b) => `${name}的玩具箱裡有 ${a} 隻公仔，小華再放入 ${b} 隻，現在共有玩具多少件？`,
        item: '玩具',
        unit: '件',
      },
      {
        template: (name, a, b) => `${name}有 ${a} 張貼紙，老師獎勵了 ${b} 張，${name}現在共有貼紙多少張？`,
        item: '貼紙',
        unit: '張',
      },
      {
        template: (name, a, b) => `${name}的書架上有 ${a} 本故事書和 ${b} 本繪本，書架上共有書本多少本？`,
        item: '書本',
        unit: '本',
      },
      {
        template: (name, a, b) => `${name}的盤子裡有 ${a} 塊餅乾，哥哥再放了 ${b} 塊，盤子裡共有餅乾多少塊？`,
        item: '餅乾',
        unit: '塊',
      },
      {
        template: (name, a, b) => `${name}的生日派對上有 ${a} 個紅氣球和 ${b} 個藍氣球，共有氣球多少個？`,
        item: '氣球',
        unit: '個',
      },
    ];

    const subtractionTemplates: WordProblemTemplate[] = [
      {
        template: (name, a, b) => `${name}有 ${a} 粒糖果，吃了 ${b} 粒，還剩下糖果多少粒？`,
        item: '糖果',
        unit: '粒',
      },
      {
        template: (name, a, b) => `${name}的筆筒裡有 ${a} 支鉛筆，借給同學 ${b} 支，還剩下鉛筆多少支？`,
        item: '鉛筆',
        unit: '支',
      },
      {
        template: (_name, a, b) => `巴士上有 ${a} 位乘客，到站後有 ${b} 位乘客下車，現在車上有乘客多少位？`,
        item: '巴士',
        unit: '位',
      },
      {
        template: (name, a, b) => `${name}的果籃裡有 ${a} 個水果，吃了 ${b} 個蘋果，還剩下水果多少個？`,
        item: '水果',
        unit: '個',
      },
      {
        template: (name, a, b) => `${name}有 ${a} 塊積木，弟弟拿走了 ${b} 塊，${name}還剩下積木多少塊？`,
        item: '積木',
        unit: '塊',
      },
      {
        template: (name, a, b) => `${name}有 ${a} 張貼紙，送給朋友 ${b} 張，還剩下貼紙多少張？`,
        item: '貼紙',
        unit: '張',
      },
      {
        template: (name, a, b) => `${name}家裡的桌上有 ${a} 個蛋撻，全家人吃了 ${b} 個，還剩下蛋撻多少個？`,
        item: '蛋撻',
        unit: '個',
      },
      {
        template: (name, a, b) => `${name}的花園裡有 ${a} 朵花，採摘了 ${b} 朵，還剩下花朵多少朵？`,
        item: '花朵',
        unit: '朵',
      },
    ];

    const names = ['小明', '小華', '小美', '心怡', '子軒', '家豪', '樂樂', '晞晞'];
    const chosenName = names[this.randomInt(0, names.length - 1)];

    if (isAddition) {
      const templateObj = additionTemplates[this.randomInt(0, additionTemplates.length - 1)];
      const total = this.randomInt(4, maxBound);
      const a = this.randomInt(1, total - 1);
      const b = total - a;
      const correctAnswer = total;
      const prompt = templateObj.template(chosenName, a, b);
      const expression = `${a} + ${b} = ${correctAnswer}`;

      const distractors = this.generateDistractors(correctAnswer, [a, b], 3, 0, maxBound + 2);
      const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

      return {
        id: this.generateId('math_word'),
        type: 'word_problem',
        prompt,
        expression,
        correctAnswer,
        options,
      };
    } else {
      const templateObj = subtractionTemplates[this.randomInt(0, subtractionTemplates.length - 1)];
      const a = this.randomInt(3, maxBound);
      const b = this.randomInt(1, a);
      const correctAnswer = a - b;
      const prompt = templateObj.template(chosenName, a, b);
      const expression = `${a} - ${b} = ${correctAnswer}`;

      const distractors = this.generateDistractors(correctAnswer, [a, b], 3, 0, maxBound + 2);
      const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

      return {
        id: this.generateId('math_word'),
        type: 'word_problem',
        prompt,
        expression,
        correctAnswer,
        options,
      };
    }
  }

  /**
   * Fill-in-the-blank questions (e.g. 7 + ( ) = 15 or 16 - ( ) = 9)
   */
  static generateFillInBlank(maxVal: number = 20): MathQuestion {
    const fillTypes = ['add_first', 'add_second', 'sub_first', 'sub_second'];
    const chosenType = fillTypes[this.randomInt(0, fillTypes.length - 1)];

    let expression = '';
    let correctAnswer = 0;
    let operands: number[] = [];

    if (chosenType === 'add_second') {
      // a + ( ) = c
      const c = this.randomInt(5, maxVal);
      const a = this.randomInt(1, c - 1);
      correctAnswer = c - a;
      operands = [a, c];
      expression = `${a} + ( ) = ${c}`;
    } else if (chosenType === 'add_first') {
      // ( ) + b = c
      const c = this.randomInt(5, maxVal);
      const b = this.randomInt(1, c - 1);
      correctAnswer = c - b;
      operands = [b, c];
      expression = `( ) + ${b} = ${c}`;
    } else if (chosenType === 'sub_second') {
      // a - ( ) = c
      const a = this.randomInt(5, maxVal);
      const c = this.randomInt(0, a - 1);
      correctAnswer = a - c;
      operands = [a, c];
      expression = `${a} - ( ) = ${c}`;
    } else {
      // ( ) - b = c
      const b = this.randomInt(1, Math.floor(maxVal / 2));
      const c = this.randomInt(1, maxVal - b);
      correctAnswer = b + c;
      operands = [b, c];
      expression = `( ) - ${b} = ${c}`;
    }

    const prompt = `在 ( ) 括號內填入正確的數字：`;
    const distractors = this.generateDistractors(correctAnswer, operands, 3, 0, maxVal + 2);
    const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

    return {
      id: this.generateId('math_fill'),
      type: 'addition', // mapped to standard math types
      prompt,
      expression,
      correctAnswer,
      options,
    };
  }

  /**
   * Mixed 3-operand operations (e.g. 5 + 4 - 3 = ? or 12 - 4 + 5 = ?)
   */
  static generateMixedOperation(maxVal: number = 20): MathQuestion {
    const patterns = ['add_sub', 'sub_add', 'add_add', 'sub_sub'];
    const pattern = patterns[this.randomInt(0, patterns.length - 1)];

    let expression = '';
    let correctAnswer = 0;
    let operands: number[] = [];

    if (pattern === 'add_sub') {
      // a + b - c
      const a = this.randomInt(2, Math.floor(maxVal / 2));
      const b = this.randomInt(2, maxVal - a);
      const sum = a + b;
      const c = this.randomInt(1, sum);
      correctAnswer = sum - c;
      operands = [a, b, c];
      expression = `${a} + ${b} - ${c} = ?`;
    } else if (pattern === 'sub_add') {
      // a - b + c
      const a = this.randomInt(4, maxVal);
      const b = this.randomInt(1, a - 1);
      const diff = a - b;
      const c = this.randomInt(1, maxVal - diff);
      correctAnswer = diff + c;
      operands = [a, b, c];
      expression = `${a} - ${b} + ${c} = ?`;
    } else if (pattern === 'add_add') {
      // a + b + c
      const total = this.randomInt(6, maxVal);
      const a = this.randomInt(1, total - 2);
      const b = this.randomInt(1, total - a - 1);
      const c = total - a - b;
      correctAnswer = total;
      operands = [a, b, c];
      expression = `${a} + ${b} + ${c} = ?`;
    } else {
      // a - b - c
      const a = this.randomInt(6, maxVal);
      const b = this.randomInt(1, a - 2);
      const c = this.randomInt(1, a - b);
      correctAnswer = a - b - c;
      operands = [a, b, c];
      expression = `${a} - ${b} - ${c} = ?`;
    }

    const prompt = `計算以下混合運算算式：`;
    const distractors = this.generateDistractors(correctAnswer, operands, 3, 0, maxVal + 2);
    const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

    return {
      id: this.generateId('math_mixed'),
      type: 'addition',
      prompt,
      expression,
      correctAnswer,
      options,
    };
  }

  /**
   * Two-step word problem (mixed operations in text)
   */
  private static generateTwoStepWordProblem(maxBound: number = 20): MathQuestion {
    const a = this.randomInt(5, 10);
    const b = this.randomInt(2, 6);
    const c = this.randomInt(1, 4);
    const correctAnswer = a + b - c;
    const prompt = `巴士上原本有 ${a} 位乘客，第一站上了 ${b} 位乘客，第二站下了 ${c} 位乘客，現在車上有乘客多少位？`;
    const expression = `${a} + ${b} - ${c} = ${correctAnswer}`;

    const distractors = this.generateDistractors(correctAnswer, [a, b, c], 3, 0, maxBound + 2);
    const options = this.fisherYatesShuffle([correctAnswer, ...distractors]);

    return {
      id: this.generateId('math_word2'),
      type: 'word_problem',
      prompt,
      expression,
      correctAnswer,
      options,
    };
  }

  /**
   * Smart Distractor Generator
   * Generates realistic student error options:
   * 1. Off-by-one (±1)
   * 2. Off-by-two (±2)
   * 3. Off-by-ten (±10)
   * 4. Operand distraction (a, b)
   * 5. Inversion / partial calculation
   * Guarantees strictly unique, non-negative integers not equal to correctAnswer.
   */
  static generateDistractors(
    correctAnswer: number,
    operands: number[] = [],
    count: number = 3,
    minVal: number = 0,
    maxVal: number = 20
  ): number[] {
    const distractors = new Set<number>();
    const candidates: number[] = [];

    // Off-by-one
    candidates.push(correctAnswer + 1);
    if (correctAnswer - 1 >= minVal) candidates.push(correctAnswer - 1);

    // Off-by-two
    candidates.push(correctAnswer + 2);
    if (correctAnswer - 2 >= minVal) candidates.push(correctAnswer - 2);

    // Off-by-ten
    if (correctAnswer + 10 <= maxVal + 10) candidates.push(correctAnswer + 10);
    if (correctAnswer - 10 >= minVal) candidates.push(correctAnswer - 10);

    // Operand distraction
    for (const op of operands) {
      if (op !== correctAnswer && op >= minVal) {
        candidates.push(op);
      }
    }

    // Inverted or alternative combo if 2 operands
    if (operands.length === 2) {
      const sum = operands[0] + operands[1];
      const diff = Math.abs(operands[0] - operands[1]);
      if (sum !== correctAnswer && sum <= maxVal + 5) candidates.push(sum);
      if (diff !== correctAnswer && diff >= minVal) candidates.push(diff);
    }

    // Shuffle candidate pool
    const shuffledCandidates = this.fisherYatesShuffle(candidates);
    for (const c of shuffledCandidates) {
      if (c !== correctAnswer && c >= minVal && Number.isInteger(c)) {
        distractors.add(c);
        if (distractors.size >= count) break;
      }
    }

    // Fallback if not enough unique distractors (e.g. low boundary edge cases)
    let offset = 3;
    while (distractors.size < count) {
      const higher = correctAnswer + offset;
      const lower = correctAnswer - offset;
      if (higher !== correctAnswer && higher >= minVal && !distractors.has(higher)) {
        distractors.add(higher);
      }
      if (distractors.size < count && lower !== correctAnswer && lower >= minVal && !distractors.has(lower)) {
        distractors.add(lower);
      }
      offset++;
    }

    return Array.from(distractors).slice(0, count);
  }

  /**
   * Fisher-Yates array shuffle
   */
  static fisherYatesShuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static generateId(prefix: string = 'math'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}
