import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import audioManifest from '../../data/audio_manifest.json';
import simpleWordCorpus from '../../data/simple_words.json';
import { isRegularCvc, SIMPLE_WORDS, shuffleWords } from './simpleWords';

const EXPECTED_WORDS = [
  'BUS', 'COT', 'DIG', 'FOG',
  'GOD', 'HIT', 'JET', 'KEN',
  'LIP', 'MET', 'NUT', 'POT',
  'RED', 'SUM', 'TUG', 'VET',
];

describe('Simple Word audio corpus', () => {
  it('contains a broad, unique regular CVC source corpus', () => {
    expect(simpleWordCorpus.length).toBeGreaterThan(16);
    expect(new Set(simpleWordCorpus.map((item) => item.word)).size).toBe(simpleWordCorpus.length);
    simpleWordCorpus.forEach((item) => expect(isRegularCvc(item.word)).toBe(true));
  });

  it('uses only Fish whole-word audio and no teacher or blend entries', () => {
    expect(Object.values(audioManifest).filter((item) => item.generatedBy === 'teacher_recording' && item.curriculum === 'simple_word')).toHaveLength(0);
    expect(Object.values(audioManifest).filter((item) => item.curriculum === 'simple_word_blend')).toHaveLength(0);
    const generated = Object.values(audioManifest)
      .filter((item) => item.curriculum === 'simple_word' && item.generatedBy !== 'teacher_recording');
    expect(new Set(generated.map((item) => item.expectedText))).toEqual(new Set(simpleWordCorpus.map((item) => item.word)));
    generated.forEach((item) => {
      expect(item.language).toBe('en');
      expect(item.generatedBy).toBe('fish-audio');
      expect(item.voice).toBe('young-narrator');
      expect(item.qaStatus).toMatch(/^(review_required|pass)$/);
      expect(item.license).toBeTruthy();
      expect(existsSync(resolve('public', item.file))).toBe(true);
    });
    expect(new Set(SIMPLE_WORDS.map((item) => item.word))).toEqual(new Set(simpleWordCorpus.map((item) => item.word)));
  });
});

describe('Simple Word queue', () => {
  it('loads all words and shuffles a copy deterministically', () => {
    expect(SIMPLE_WORDS.map((item) => item.word)).toEqual(expect.arrayContaining(EXPECTED_WORDS));
    expect(new Set(SIMPLE_WORDS.map((item) => item.word)).size).toBe(SIMPLE_WORDS.length);

    const original = SIMPLE_WORDS.slice(0, 4);
    const random = () => 0;
    const shuffled = shuffleWords(original, random);

    expect(shuffled.map((item) => item.word)).toEqual(['COT', 'DIG', 'FOG', 'BUS']);
    expect(original.map((item) => item.word)).toEqual(['BUS', 'COT', 'DIG', 'FOG']);
    expect(new Set(shuffleWords(SIMPLE_WORDS).map((item) => item.id)).size).toBe(SIMPLE_WORDS.length);
  });
});
