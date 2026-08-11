import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import audioManifest from '../../data/audio_manifest.json';
import { SIMPLE_WORDS } from './simpleWords';
import {
  buildBlendingSession,
  buildBlendingTestSession,
  shuffleWordLetters,
} from './simpleWordLearning';

describe('Simple Word blending curriculum', () => {
  it('uses real unique CVC words and prepares a bounded session', () => {
    const session = buildBlendingSession(SIMPLE_WORDS, () => 0.999999, 16);

    expect(session).toHaveLength(16);
    expect(new Set(session.map((item) => item.word)).size).toBe(16);
    session.forEach((item) => expect(item.word).toMatch(/^[B-DF-HJ-NP-TV-XZ][AEIOU][B-DF-HJ-NP-TV-XZ]$/));
  });

  it('maps every CVC word to Fish whole-word audio and no blend audio', () => {
    for (const word of SIMPLE_WORDS) {
      const audio = audioManifest[word.id];
      expect(audio).toEqual(expect.objectContaining({
        type: 'phonics_target',
        curriculum: 'simple_word',
        expectedText: word.word,
        generatedBy: 'fish-audio',
        voice: 'young-narrator',
      }));
      expect(existsSync(resolve('public', audio.file))).toBe(true);
    }
    expect(Object.values(audioManifest).filter((item) => item.curriculum === 'simple_word_blend')).toHaveLength(0);
  });

  it('keeps transfer test words out of the learning set', () => {
    const learning = buildBlendingSession(SIMPLE_WORDS, () => 0.999999, 16);
    const test = buildBlendingTestSession(SIMPLE_WORDS, learning, () => 0.999999, 16);

    expect(test).toHaveLength(16);
    expect(new Set(test.map((item) => item.word)).size).toBe(16);
    expect(test.some((item) => learning.some((learned) => learned.word === item.word))).toBe(false);
  });

  it('shuffles the graphemes while keeping every letter', () => {
    const shuffled = shuffleWordLetters('NUT', () => 0.999999);

    expect(shuffled.join('')).not.toBe('NUT');
    expect([...shuffled].sort()).toEqual(['N', 'T', 'U'].sort());
  });
});
