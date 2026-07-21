import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import audioManifest from '../../data/audio_manifest.json';
import { SIMPLE_WORDS, shuffleWords } from './simpleWords';

const EXPECTED_WORDS = [
  'BUS', 'COT', 'DIG', 'FOG',
  'GOD', 'HIT', 'JET', 'KEN',
  'LIP', 'MET', 'NUT', 'POT',
  'RED', 'SUM', 'TUG', 'VET',
];

const REVIEWED_CUT_WINDOWS_MS = [
  [5922, 6287], [9658, 9949], [13421, 13788], [17261, 17650],
  [21124, 21502], [25050, 25355], [28879, 29163], [32776, 32891],
  [36347, 36598], [40087, 40286], [43921, 44063], [47819, 48082],
  [51678, 51993], [55695, 55780], [59291, 59619], [63114, 63326],
];

describe('Simple Word audio corpus', () => {
  it('contains all 16 reviewed teacher clips in teaching order', () => {
    const clips = Object.values(audioManifest)
      .filter((item) => item.curriculum === 'simple_word')
      .sort((a, b) => a.sequence - b.sequence);

    expect(clips.map((item) => item.expectedText)).toEqual(EXPECTED_WORDS);
    expect(new Set(clips.map((item) => item.id)).size).toBe(16);

    clips.forEach((clip, index) => {
      const [previousSoundEndMs, finalWordStartMs] = REVIEWED_CUT_WINDOWS_MS[index];
      expect(clip.sourceStartMs).toBeGreaterThan(previousSoundEndMs);
      expect(clip.sourceStartMs).toBeLessThan(finalWordStartMs);
      expect(clip.type).toBe('phonics_target');
      expect(clip.generatedBy).toBe('teacher_recording');
      expect(clip.qaStatus).toBe('pass');
      expect(clip.sourceFile).toBe('videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov');
      expect(clip.sourceEndMs).toBeGreaterThan(clip.sourceStartMs);
      expect(existsSync(resolve('public', clip.file))).toBe(true);
    });
  });
});

describe('Simple Word queue', () => {
  it('loads all words and shuffles a copy deterministically', () => {
    expect(SIMPLE_WORDS.map((item) => item.word)).toEqual(EXPECTED_WORDS);

    const original = SIMPLE_WORDS.slice(0, 4);
    const random = () => 0;
    const shuffled = shuffleWords(original, random);

    expect(shuffled.map((item) => item.word)).toEqual(['COT', 'DIG', 'FOG', 'BUS']);
    expect(original.map((item) => item.word)).toEqual(['BUS', 'COT', 'DIG', 'FOG']);
    expect(new Set(shuffleWords(SIMPLE_WORDS).map((item) => item.id)).size).toBe(16);
  });
});
