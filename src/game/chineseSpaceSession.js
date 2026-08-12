export function createChineseSpaceSession(questions, now = 0) {
  return {
    phase: 'audio',
    questions,
    questionIndex: 0,
    hp: 3,
    activeStartedAt: null,
    activeTimeMs: 0,
    wrongTargetIds: [],
    reactionTimes: [],
    correctCount: 0,
  };
}

export function beginChineseSpaceCountdown(state, now) {
  if (state.phase !== 'audio') return state;
  return { ...state, phase: 'active', activeStartedAt: now };
}

function activeElapsed(state, now) {
  return Math.max(0, now - state.activeStartedAt);
}

function result(state, event) {
  return { state, event };
}

export function resolveChineseSpaceTarget(state, targetId, now, timeLimitMs = 8000) {
  if (state.phase !== 'active') return result(state, 'ignored');

  const question = state.questions[state.questionIndex];
  const targets = [question.answer, ...question.distractors];
  if (!targets.some((target) => target.id === targetId)) return result(state, 'ignored');
  if (state.wrongTargetIds.includes(targetId)) return result(state, 'ignored');

  const elapsed = activeElapsed(state, now);
  const activeTimeMs = state.activeTimeMs + elapsed;
  if (targetId === question.answer.id) {
    const correctCount = state.correctCount + 1;
    return result({
      ...state,
      phase: correctCount === state.questions.length ? 'complete' : 'correct',
      activeStartedAt: null,
      activeTimeMs,
      reactionTimes: [...state.reactionTimes, activeTimeMs],
      correctCount,
    }, 'correct');
  }

  const hp = state.hp - 1;
  return result({
    ...state,
    phase: hp === 0 ? 'gameOver' : 'audio',
    hp,
    activeStartedAt: null,
    activeTimeMs,
    wrongTargetIds: [...state.wrongTargetIds, targetId],
  }, hp === 0 ? 'gameOver' : 'wrong');
}

export function resolveChineseSpaceTimeout(state, now, timeLimitMs = 8000) {
  if (state.phase !== 'active') return result(state, 'ignored');

  const activeTimeMs = state.activeTimeMs + Math.min(activeElapsed(state, now), timeLimitMs);
  const hp = state.hp - 1;
  return result({
    ...state,
    phase: hp === 0 ? 'gameOver' : 'audio',
    hp,
    activeStartedAt: null,
    activeTimeMs,
  }, hp === 0 ? 'gameOver' : 'timeout');
}

export function advanceChineseSpaceQuestion(state) {
  if (state.phase !== 'correct' || state.questionIndex === state.questions.length - 1) return state;
  return {
    ...state,
    phase: 'audio',
    questionIndex: state.questionIndex + 1,
    activeStartedAt: null,
    activeTimeMs: 0,
    wrongTargetIds: [],
  };
}
