import type { QuizQuestion } from '../types';

/** Clone every mutable question field before crossing a persistence boundary. */
export function cloneQuizQuestion(question: QuizQuestion): QuizQuestion {
  return {
    ...question,
    options: question.options ? [...question.options] : undefined,
    correctTokens: question.correctTokens ? [...question.correctTokens] : undefined,
    shuffledTokens: question.shuffledTokens ? [...question.shuffledTokens] : undefined,
    hints: question.hints ? { ...question.hints } : undefined,
  };
}
