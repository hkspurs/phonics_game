import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import audioManifest from '../../data/audio_manifest.json';

const EXPECTED_WORDS = [
  'BUS', 'COT', 'DIG', 'FOG',
  'GOD', 'HIT', 'JET', 'KEN',
  'LIP', 'MET', 'NUT', 'POT',
  'RED', 'SUM', 'TUG', 'VET',
];

describe('Simple Word audio corpus', () => {
  it('contains all 16 reviewed teacher clips in teaching order', () => {
    const clips = Object.values(audioManifest)
      .filter((item) => item.curriculum === 'simple_word')
      .sort((a, b) => a.sequence - b.sequence);

    expect(clips.map((item) => item.expectedText)).toEqual(EXPECTED_WORDS);
    expect(new Set(clips.map((item) => item.id)).size).toBe(16);

    for (const clip of clips) {
      expect(clip.type).toBe('phonics_target');
      expect(clip.generatedBy).toBe('teacher_recording');
      expect(clip.qaStatus).toBe('pass');
      expect(clip.sourceFile).toBe('videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov');
      expect(clip.sourceEndMs).toBeGreaterThan(clip.sourceStartMs);
      expect(existsSync(resolve('public', clip.file))).toBe(true);
    }
  });
});
