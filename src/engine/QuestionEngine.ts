import type { QuizQuestion, SubjectType, GameSettings } from '../types';
import { CurriculumBank, CurriculumItem } from './CurriculumBank';
import { SentenceEngine } from './SentenceEngine';
import { MathGenerator } from './MathGenerator';
import { DataManager } from '../services/DataManager';

/**
 * QuestionEngine
 * Dispatches questions for roadmap stations, balancing subjects (Chinese, Math, English),
 * dynamically generating math problems, retrieving curriculum items with anti-repetition memory,
 * and preparing sentence scramble puzzles with non-identity shuffling.
 */
export class QuestionEngine {
  private static readonly MAX_HISTORY_SIZE = 20;
  private static recentHistory: string[] = [];

  /**
   * Resets the anti-repetition question memory buffer.
   */
  static resetHistory(): void {
    this.recentHistory = [];
  }

  /**
   * Retrieves the current list of recently served question IDs.
   */
  static getRecentHistory(): string[] {
    return [...this.recentHistory];
  }

  /**
   * Records a question ID into the circular buffer.
   */
  private static recordHistory(id: string): void {
    this.recentHistory.push(id);
    if (this.recentHistory.length > this.MAX_HISTORY_SIZE) {
      this.recentHistory.shift();
    }
  }

  /**
   * Generates a single question for a given subject and difficulty.
   */
  static generateSingleQuestion(subject: SubjectType, difficulty: number = 1): QuizQuestion {
    const diff = Math.min(Math.max(Math.floor(difficulty || 1), 1), 4);

    if (subject === 'math') {
      return this.generateMathQuestion(diff);
    } else {
      return this.generateCurriculumQuestion(subject, diff);
    }
  }

  /**
   * Dispatches questions for a specific station.
   * Default: 3 questions per station (1 Chinese, 1 Math, 1 English).
   * Respects enabled subject preferences in user settings.
   */
  static getStationQuestions(
    _stationId: number,
    difficulty: number = 1,
    options?: { settings?: Partial<GameSettings>; count?: number }
  ): QuizQuestion[] {
    const diff = Math.min(Math.max(Math.floor(difficulty || 1), 1), 4);
    const targetCount = options?.count ?? 3;

    // Resolve user settings
    let currentSettings: GameSettings;
    try {
      currentSettings = DataManager.getInstance().getProfile().settings;
    } catch {
      currentSettings = {
        chineseEnabled: true,
        mathEnabled: true,
        englishEnabled: true,
        voiceLanguage: 'zh-HK',
        difficulty: 1,
        soundVolume: 1.0,
      };
    }

    const effectiveSettings = {
      ...currentSettings,
      ...(options?.settings || {}),
    };

    // Determine available subjects
    const enabledSubjects: SubjectType[] = [];
    if (effectiveSettings.chineseEnabled) enabledSubjects.push('chinese');
    if (effectiveSettings.mathEnabled) enabledSubjects.push('math');
    if (effectiveSettings.englishEnabled) enabledSubjects.push('english');

    // Fallback if none enabled
    if (enabledSubjects.length === 0) {
      enabledSubjects.push('chinese', 'math', 'english');
    }

    // Build subject distribution sequence
    const subjectSequence: SubjectType[] = [];
    if (
      enabledSubjects.length === 3 &&
      targetCount === 3
    ) {
      // Standard station progression: Chinese -> Math -> English
      subjectSequence.push('chinese', 'math', 'english');
    } else {
      for (let i = 0; i < targetCount; i++) {
        subjectSequence.push(enabledSubjects[i % enabledSubjects.length]);
      }
    }

    // Generate questions for the sequence
    const stationQuestions: QuizQuestion[] = [];
    for (const subj of subjectSequence) {
      stationQuestions.push(this.generateSingleQuestion(subj, diff));
    }

    return stationQuestions;
  }

  /**
   * Generates a math QuizQuestion from MathGenerator.
   */
  private static generateMathQuestion(difficulty: number): QuizQuestion {
    const mathQ = MathGenerator.generate(difficulty);

    const options = mathQ.options.map((opt) => String(opt));
    const correctOptionIndex = mathQ.options.indexOf(mathQ.correctAnswer);

    // Format speak text with explicit Chinese operators to prevent TTS mispronouncing "-" as "至"
    const mathSpokenExpr = mathQ.expression
      .replace(/\+/g, ' 加 ')
      .replace(/-/g, ' 減 ')
      .replace(/[×*]/g, ' 乘 ')
      .replace(/[÷/]/g, ' 除以 ')
      .replace(/\s*=\s*\?/g, ' 等於幾多？')
      .replace(/\s*=\s*/g, ' 等於 ')
      .replace(/\(\s*\)/g, '幾多')
      .trim();

    const speakText = mathQ.type === 'word_problem'
      ? mathQ.prompt
      : `${mathQ.prompt} ${mathSpokenExpr}`;

    return {
      id: mathQ.id,
      subject: 'math',
      type: mathQ.type === 'word_problem' ? 'word_problem' : 'multiple_choice',
      prompt: mathQ.type === 'word_problem' ? mathQ.prompt : `${mathQ.prompt} ${mathQ.expression}`,
      speakText,
      options,
      correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
      correctAnswer: mathQ.correctAnswer,
      hintText: `提示：仔細計算算式 ${mathQ.expression}`,
    };
  }

  /**
   * Retrieves and formats a question from CurriculumBank with anti-repetition memory.
   */
  private static generateCurriculumQuestion(
    subject: 'chinese' | 'english',
    difficulty: number
  ): QuizQuestion {
    let pool = CurriculumBank.getItems(subject, difficulty);
    if (pool.length === 0) {
      pool = CurriculumBank.getItems(subject);
    }

    // Filter out recently served questions
    const historySet = new Set(this.recentHistory);
    let eligible = pool.filter((item) => !historySet.has(item.id));

    if (eligible.length === 0) {
      // If all items were recently used, relax history restriction
      eligible = pool;
    }

    // Pick random item
    const chosenIndex = Math.floor(Math.random() * eligible.length);
    const item: CurriculumItem = eligible[chosenIndex] || pool[0];

    // Record to history
    this.recordHistory(item.id);

    // Build QuizQuestion
    if (item.type === 'sentence_scramble') {
      const correctTokens = item.tokens && item.tokens.length > 0
        ? [...item.tokens]
        : SentenceEngine.tokenize(item.speakText, item.subject);

      const shuffledTokens = SentenceEngine.shuffleTokens(correctTokens);

      return {
        id: item.id,
        subject: item.subject,
        type: 'sentence_scramble',
        prompt: item.prompt,
        speakText: item.speakText,
        correctTokens,
        shuffledTokens,
        hintText: item.hintText,
      };
    } else {
      return {
        id: item.id,
        subject: item.subject,
        type: 'multiple_choice',
        prompt: item.prompt,
        speakText: item.speakText,
        options: item.options ? [...item.options] : [],
        correctOptionIndex: item.correctOptionIndex ?? 0,
        correctAnswer: item.correctAnswer,
        hintText: item.hintText,
      };
    }
  }

  /**
   * Generates a remedial question targeting a specific subject or knowledge tag for reinforcement.
   */
  public static generateRemedialQuestion(
    subject: SubjectType,
    _knowledgeTag?: string,
    difficulty: number = 1
  ): QuizQuestion {
    return this.generateSingleQuestion(subject, difficulty);
  }
}
