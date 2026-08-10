export const SIMPLE_WORD_SESSION_SIZE = 16;
export const DAY_MS = 86400000;

export function updateSimpleWordStats(previous = {}, firstTry, hintLevel = 0, now = Date.now()) {
  const attempts = (previous.attempts || 0) + 1;
  const firstTryHits = (previous.firstTryHits || 0) + (firstTry ? 1 : 0);
  const streak = firstTry ? (previous.streak || 0) + 1 : 0;
  const intervalDays = firstTry ? [1, 3, 7][Math.min(streak, 3) - 1] : 1;

  return {
    attempts,
    firstTryHits,
    hintLevel,
    streak,
    nextDue: now + intervalDays * DAY_MS,
  };
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildSimpleWordQueue(words, stats = {}, random = Math.random, now = Date.now(), size = SIMPLE_WORD_SESSION_SIZE) {
  const buckets = [[], [], [], []];
  words.forEach((word) => {
    const item = stats[word.id] || {};
    const weak = item.attempts > 0 && (item.firstTryHits || 0) / item.attempts < 0.7;
    const due = item.attempts > 0 && (item.nextDue || 0) <= now;
    const bucket = weak ? 0 : due ? 1 : item.attempts ? 3 : 2;
    buckets[bucket].push(word);
  });

  const ordered = buckets.flatMap((bucket) => shuffle(bucket, random));
  return ordered.slice(0, Math.min(size, ordered.length));
}

export function scheduleDelayedReview(queue, index) {
  if (index >= queue.length - 3) return [...queue];
  const result = [...queue];
  const word = result[index];
  result.splice(index + 3, 0, word);
  result.pop();
  return result;
}
