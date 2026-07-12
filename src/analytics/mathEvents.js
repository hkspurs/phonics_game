/**
 * Standardize math analytics events
 */
export const createMathAttemptEvent = ({
  question,
  selectedAnswer,
  isCorrect,
  attemptNumber,
  hintLevel,
  responseTimeMs,
  misconceptionTag = null
}) => {
  return {
    id: crypto.randomUUID(),
    questionId: question.id,
    skillId: question.skillId,
    questionType: question.type,
    values: question.values || {},
    selectedAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    attemptNumber,
    hintLevel,
    misconceptionTag,
    responseTimeMs,
    occurredAt: Date.now()
  };
};
