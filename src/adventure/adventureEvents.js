export const ADVENTURE_EVENTS = Object.freeze({
  READY: 'READY',
  SESSION_START: 'SESSION_START',
  WORD_STARTED: 'WORD_STARTED',
  LETTER_PROGRESS: 'LETTER_PROGRESS',
  ANSWER_RESULT: 'ANSWER_RESULT',
  SESSION_COMPLETE: 'SESSION_COMPLETE',
  CONTINUE: 'CONTINUE',
  EXIT: 'EXIT',
  REDUCED_MOTION: 'REDUCED_MOTION',
});

export const ADVENTURE_STEPS = Object.freeze([
  { id: 'rabbit-house', label: 'Rabbit House', emoji: '🏠' },
  { id: 'river-bridge', label: 'River Bridge', emoji: '🌉' },
  { id: 'carrot-castle', label: 'Carrot Castle', emoji: '🏰' },
]);

export function clampAdventureStep(value) {
  return Math.max(0, Math.min(ADVENTURE_STEPS.length - 1, Number(value) || 0));
}

export function getAdventureStep(progress, total = 5) {
  const safeTotal = Math.max(1, Number(total) || 1);
  return clampAdventureStep(Math.floor((Math.max(0, progress) / safeTotal) * ADVENTURE_STEPS.length));
}
