import type { QuizQuestion } from '../types';

/**
 * SentenceEngine
 * Handles tokenization, guaranteed non-identity shuffling, and order verification
 * for Chinese and English sentence scrambling puzzles.
 */
export class SentenceEngine {
  /**
   * Tokenizes a sentence into constituent word chips and punctuation marks.
   */
  static tokenize(sentence: string, subject: 'chinese' | 'english' | 'auto' = 'auto'): string[] {
    const trimmed = sentence.trim();
    if (!trimmed) return [];

    let detectedSubject = subject;
    if (detectedSubject === 'auto') {
      detectedSubject = /[\u4e00-\u9fa5]/.test(trimmed) ? 'chinese' : 'english';
    }

    if (detectedSubject === 'chinese') {
      return this.tokenizeChinese(trimmed);
    } else {
      return this.tokenizeEnglish(trimmed);
    }
  }

  /**
   * Tokenizes Chinese sentences.
   * If space-delimited (e.g. "姐姐 吃 餅乾 。"), splits by whitespace.
   * Otherwise, splits characters and preserves punctuation.
   */
  static tokenizeChinese(sentence: string): string[] {
    const trimmed = sentence.trim();
    if (!trimmed) return [];

    if (/\s+/.test(trimmed)) {
      return trimmed.split(/\s+/).filter((t) => t.length > 0);
    }

    // Split into characters while grouping punctuation
    const tokens: string[] = [];
    for (const char of trimmed) {
      if (char.trim()) {
        tokens.push(char);
      }
    }
    return tokens;
  }

  /**
   * Tokenizes English sentences into words and punctuation marks.
   * Separates terminal and intermediate punctuation (. , ! ?) into distinct tokens.
   */
  static tokenizeEnglish(sentence: string): string[] {
    const trimmed = sentence.trim();
    if (!trimmed) return [];

    // Split by whitespace first, then separate attached punctuation
    const rawTokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
    const tokens: string[] = [];

    for (const raw of rawTokens) {
      // Check if ends with punctuation (. ! ? ,)
      const match = raw.match(/^(.+?)([.,!?])$/);
      if (match) {
        if (match[1]) tokens.push(match[1]);
        if (match[2]) tokens.push(match[2]);
      } else {
        tokens.push(raw);
      }
    }

    return tokens;
  }

  /**
   * Shuffles an array of tokens using Fisher-Yates algorithm,
   * guaranteeing that the output is NOT identical in order to the input array (for length >= 2).
   */
  static shuffleTokens(tokens: string[]): string[] {
    if (tokens.length <= 1) {
      return [...tokens];
    }

    // If all tokens are identical, we cannot produce a different array
    const allSame = tokens.every((t) => t === tokens[0]);
    if (allSame) {
      return [...tokens];
    }

    const result = [...tokens];
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      attempts++;
      // Fisher-Yates
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      // Check if different from original
      const isIdentical = result.every((t, idx) => t === tokens[idx]);
      if (!isIdentical) {
        return result;
      }
    }

    // Guaranteed fallback: find two distinct elements and swap them
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (result[i] !== result[j]) {
          [result[i], result[j]] = [result[j], result[i]];
          // Ensure it's not identical to original
          if (!result.every((t, idx) => t === tokens[idx])) {
            return result;
          }
        }
      }
    }

    return result;
  }

  /**
   * Verifies if placed tokens match expected order completely.
   */
  static verifyOrder(placedTokens: string[], expectedOrder: string[]): boolean {
    if (placedTokens.length !== expectedOrder.length) {
      return false;
    }
    return placedTokens.every((token, index) => token === expectedOrder[index]);
  }

  /**
   * Checks if placed partial tokens match the prefix of expected order.
   */
  static isPrefixMatch(placedTokens: string[], expectedOrder: string[]): boolean {
    if (placedTokens.length > expectedOrder.length) {
      return false;
    }
    return placedTokens.every((token, index) => token === expectedOrder[index]);
  }

  /**
   * Helper to construct a QuizQuestion for a sentence scramble puzzle.
   */
  static createSentenceQuestion(params: {
    id: string;
    subject: 'chinese' | 'english';
    sentence: string;
    prompt?: string;
    speakText?: string;
    hintText?: string;
  }): QuizQuestion {
    const correctTokens = this.tokenize(params.sentence, params.subject);
    const shuffledTokens = this.shuffleTokens(correctTokens);

    const defaultPrompt =
      params.subject === 'chinese'
        ? '重組句子：請把字詞排列成通順的句子。'
        : 'Sentence Scramble: Arrange the words in the correct order.';

    const defaultSpeakText = params.sentence.replace(/\s+/g, params.subject === 'chinese' ? '' : ' ');

    return {
      id: params.id,
      subject: params.subject,
      type: 'sentence_scramble',
      prompt: params.prompt || defaultPrompt,
      speakText: params.speakText || defaultSpeakText,
      correctTokens,
      shuffledTokens,
      hintText: params.hintText,
    };
  }
}
