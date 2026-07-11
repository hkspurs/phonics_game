/**
 * Seedable pseudo-random number generator (PRNG) using a Linear Congruential Generator.
 * Produces deterministic sequences for reproducible question generation.
 *
 * @param {number} seed - Integer seed value
 * @returns {{ next: () => number, int: (min: number, max: number) => number, shuffle: (arr: any[]) => any[], pick: (arr: any[]) => any }}
 */
export function createRandom(seed) {
  let value = seed >>> 0;
  return {
    next() {
      value = (1664525 * value + 1013904223) >>> 0;
      return value / 4294967296;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    shuffle(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
  };
}
