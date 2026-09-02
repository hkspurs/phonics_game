import { QuizQuestion, ProgressiveHints } from '../types';

/**
 * PedagogyEngine
 * Generates age-appropriate 3-tier progressive hints, educational wrong-answer feedback,
 * knowledge-reinforcement sentences, and maps questions to Hong Kong P1 curriculum standards.
 */
export class PedagogyEngine {
  /**
   * Generates or retrieves 3-tier progressive hints for a given question.
   * Level 1 (Direction): Strategy prompt without changing choices.
   * Level 2 (Visual support): Highlights key patterns, sounds, letters, or radicals.
   * Level 3 (Guided solution): Explains the underlying rule and guides directly to the answer.
   */
  public static getProgressiveHints(question: QuizQuestion): ProgressiveHints {
    if (question.hints && question.hints.level1Direction && question.hints.level2VisualSupport && question.hints.level3GuidedSolution) {
      return question.hints;
    }

    const prompt = question.prompt || '';
    const subject = question.subject;
    const answer = String(question.correctAnswer || (question.options && question.correctOptionIndex !== undefined ? question.options[question.correctOptionIndex] : ''));

    if (subject === 'chinese') {
      if (prompt.includes('偏旁') || prompt.includes('部首')) {
        return {
          level1Direction: '觀察題目中字詞左邊或上方重複出現的部首特徵。',
          level2VisualSupport: '想想這個偏旁通常和甚麼事物或動作有關？（例如手、腳、水、口等）',
          level3GuidedSolution: `這些字都包含「${answer}」字旁，與其含義相關，請選擇「${answer}」。`,
        };
      }
      if (prompt.includes('重組') || question.type === 'sentence_scramble') {
        const tokens = question.correctTokens || [];
        const firstToken = tokens[0] || '人物';
        return {
          level1Direction: '先找出句子中的主語（誰在做事情？），將它放在最前面。',
          level2VisualSupport: `「${firstToken}」是句子的開頭，接著想想他/她在做甚麼動作？`,
          level3GuidedSolution: `完整排列順序為：「${tokens.join(' ')}」，請依序排列。`,
        };
      }
      if (prompt.includes('量詞')) {
        return {
          level1Direction: '回想日常生活中計算這種物品時會使用的量詞單位。',
          level2VisualSupport: '注意物品的形狀、大小或特點（例如一「隻」小狗、一「支」鉛筆）。',
          level3GuidedSolution: `計算這種物品正確的量詞是「${answer}」。`,
        };
      }
      return {
        level1Direction: '仔細閱讀題目的關鍵字詞，找出核心意思。',
        level2VisualSupport: '排除意思完全不相關的干擾選項。',
        level3GuidedSolution: `根據小一語文規則，正確答案是「${answer}」。`,
      };
    }

    if (subject === 'english') {
      if (prompt.toLowerCase().includes('rhyme') || prompt.toLowerCase().includes('sound') || prompt.includes('音')) {
        return {
          level1Direction: 'Listen carefully to the ending sound and word family.',
          level2VisualSupport: 'Look at the vowel and final letters in the words.',
          level3GuidedSolution: `The target word shares the same sound pattern with "${answer}".`,
        };
      }
      if (question.type === 'sentence_scramble') {
        const tokens = question.correctTokens || [];
        return {
          level1Direction: 'Look for the capitalised word to start the sentence.',
          level2VisualSupport: 'Identify the subject, followed by the action verb and object.',
          level3GuidedSolution: `The correct order is: "${tokens.join(' ')}".`,
        };
      }
      return {
        level1Direction: 'Read the question carefully and check the keyword clues.',
        level2VisualSupport: 'Eliminate choices that do not match the grammatical rule or meaning.',
        level3GuidedSolution: `The correct answer is "${answer}".`,
      };
    }

    // Math
    if (subject === 'math') {
      if (prompt.includes('-') || prompt.includes('減') || prompt.includes('剩下')) {
        return {
          level1Direction: '從總數中減去相應的數量，想想剩下多少？',
          level2VisualSupport: '可以倒數計數，或者想想甚麼數字加上減數會等於被減數。',
          level3GuidedSolution: `計算結果為：正確答案是 ${answer}。`,
        };
      }
      if (prompt.includes('+') || prompt.includes('加') || prompt.includes('合共')) {
        return {
          level1Direction: '從較大的數字開始往後順數，把兩個數量合併。',
          level2VisualSupport: '將兩個數字相加，可以用湊十法或手指輔助計數。',
          level3GuidedSolution: `計算結果為：正確答案是 ${answer}。`,
        };
      }
      if (prompt.includes('大') || prompt.includes('小') || prompt.includes('比較')) {
        return {
          level1Direction: '在數線上，越靠右的數字越大，越靠左的數字越小。',
          level2VisualSupport: '比較兩個數字的十位和個位數量。',
          level3GuidedSolution: `正確的比較結果是 ${answer}。`,
        };
      }
      return {
        level1Direction: '仔細看清題目的數字和運算符號。',
        level2VisualSupport: '一步步細心計算，留意進位或退位。',
        level3GuidedSolution: `計算答案是 ${answer}。`,
      };
    }

    return {
      level1Direction: '仔細審題，觀察關鍵線索。',
      level2VisualSupport: '對比各個選項的異同之處。',
      level3GuidedSolution: `正確答案是「${answer}」。`,
    };
  }

  /**
   * Generates concise, subject-specific positive reinforcement when answered correctly.
   */
  public static getReinforcementSentence(question: QuizQuestion): string {
    if (question.explanation) return question.explanation;

    const subject = question.subject;
    const prompt = question.prompt || '';
    const answer = String(question.correctAnswer || (question.options && question.correctOptionIndex !== undefined ? question.options[question.correctOptionIndex] : ''));

    if (subject === 'chinese') {
      if (prompt.includes('偏旁') || prompt.includes('部首')) {
        return `「${answer}」字旁的字通常與其字義屬性密切相關，掌握偏旁能幫助認識更多生字！`;
      }
      if (question.type === 'sentence_scramble') {
        return '太棒了！完整的中文句子通常由「誰 ＋ 在哪裡 ＋ 做甚麼」組成。';
      }
      if (prompt.includes('量詞')) {
        return `答對了！正確使用量詞「${answer}」能讓語言表達更生動準確。`;
      }
      return `答得好！成功掌握了「${answer}」的語文知識點！`;
    }

    if (subject === 'english') {
      if (prompt.toLowerCase().includes('rhyme') || prompt.toLowerCase().includes('sound')) {
        return `Great job! Words in the same phonics family share the same ending sound pattern.`;
      }
      if (question.type === 'sentence_scramble') {
        return `Awesome! An English sentence always begins with a capital letter and ends with punctuation.`;
      }
      return `Well done! You have mastered the keyword "${answer}"!`;
    }

    if (subject === 'math') {
      if (prompt.includes('-') || prompt.includes('減')) {
        return `計算正確！減法是從總數中扣除一部分，剩下 ${answer}。`;
      }
      if (prompt.includes('+') || prompt.includes('加')) {
        return `計算正確！加法是把兩個部分的數量合併起來，總共是 ${answer}。`;
      }
      if (prompt.includes('大') || prompt.includes('小')) {
        return `判斷正確！能準確比較數字大小與數量多少。`;
      }
      return `太聰明了！算式計算完全正確，答案就是 ${answer}！`;
    }

    return '答得好！繼續保持學習熱情！';
  }

  /**
   * Generates instructional, age-appropriate feedback when an incorrect answer is chosen.
   */
  public static getWrongAnswerFeedback(question: QuizQuestion, _selectedValue?: string | number): string {
    const subject = question.subject;
    const prompt = question.prompt || '';

    if (subject === 'chinese') {
      if (prompt.includes('偏旁') || prompt.includes('部首')) {
        return '再看看題目中的字，留意它們左邊或上方重複出現的相同部件。';
      }
      if (question.type === 'sentence_scramble') {
        return '句子順序有點小問題，試試先找出主語人物，再排動作和物件。';
      }
      if (prompt.includes('量詞')) {
        return '量詞搭配不正確喔，想想平時形容這種事物會用哪一個計量詞？';
      }
      return '這個選項不太合適，再讀一次題目，找找關鍵字線索。';
    }

    if (subject === 'english') {
      if (prompt.toLowerCase().includes('rhyme') || prompt.toLowerCase().includes('sound')) {
        return 'Listen carefully to the ending sound again and find the matching rhyme.';
      }
      if (question.type === 'sentence_scramble') {
        return 'Check the sentence word order: Subject + Verb + Object.';
      }
      return 'That is not quite right. Read the clue again and try another option!';
    }

    if (subject === 'math') {
      if (prompt.includes('-') || prompt.includes('減')) {
        const match = prompt.match(/(\d+)\s*[-減]\s*(\d+)/);
        if (match) {
          return `減法計算再檢查一下：從 ${match[1]} 減去 ${match[2]}，剩下多少？`;
        }
        return '減法計算再檢查一下，可以從被減數倒數或是用手指輔助計數。';
      }
      if (prompt.includes('+') || prompt.includes('加')) {
        const match = prompt.match(/(\d+)\s*[\+加]\s*(\d+)/);
        if (match) {
          return `加法計算再檢查一下：將 ${match[1]} 和 ${match[2]} 合併起來，總共有多少？`;
        }
        return '加法計算再檢查一下，將兩個數字合起來算算看。';
      }
      return '計算結果有偏差，請再細心算一次算式。';
    }

    return '再試一次，相信你一定能找到正確答案！';
  }

  /**
   * Resolves knowledge tag for report analytics.
   */
  public static getKnowledgeTag(question: QuizQuestion): string {
    if (question.knowledgeTag) return question.knowledgeTag;

    const prompt = question.prompt || '';
    if (question.subject === 'chinese') {
      if (prompt.includes('偏旁') || prompt.includes('部首')) return 'radicals';
      if (question.type === 'sentence_scramble') return 'sentence_order';
      if (prompt.includes('量詞')) return 'measure_words';
      if (prompt.includes('反義詞')) return 'antonyms';
      if (prompt.includes('標點')) return 'punctuation';
      return 'vocabulary';
    }

    if (question.subject === 'english') {
      if (prompt.toLowerCase().includes('rhyme') || prompt.includes('押韻')) return 'phonics_rhyme';
      if (prompt.toLowerCase().includes('sound') || prompt.includes('讀音')) return 'phonics_sound';
      if (question.type === 'sentence_scramble') return 'sentence_order';
      if (prompt.toLowerCase().includes('plural')) return 'plurals';
      return 'vocabulary';
    }

    if (question.subject === 'math') {
      if (prompt.includes('-') || prompt.includes('減')) return 'subtraction_10';
      if (prompt.includes('+') || prompt.includes('加')) return 'addition_10';
      if (prompt.includes('大') || prompt.includes('小') || prompt.includes('比較')) return 'comparison';
      if (prompt.includes('形狀') || prompt.includes('圖形')) return 'shapes';
      return 'calculation';
    }

    return 'general';
  }
}
