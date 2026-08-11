import { describe, expect, it } from 'vitest';
import {
  BLEND_TEMPO,
  buildRawBlendText,
  mergeManifest,
} from '../../scripts/generate-simple-word-blend-audio.cjs';

describe('simple word blend audio input', () => {
  it('creates one raw-phoneme utterance instead of spelling letter names', () => {
    expect(buildRawBlendText('MAP')).toBe('[[mmmææp]]');
  });

  it('does not sustain a stop consonant or drop the /g/ sound', () => {
    expect(buildRawBlendText('CAT')).toBe('[[kææt]]');
    expect(buildRawBlendText('PIG')).toBe('[[pɪɪɡ]]');
    expect(buildRawBlendText('DOG')).toBe('[[dɒɒɡ]]');
  });

  it('slows generated blends without using runtime pitch-shifting', () => {
    expect(BLEND_TEMPO).toBe(0.8);
  });

  it('replaces blend entries without reordering the manifest', () => {
    const merged = mergeManifest(
      { WORD_A: { value: 'word' }, BLEND_A: { value: 'old' }, WORD_B: { value: 'word' } },
      { BLEND_A: { value: 'new' }, BLEND_NEW: { value: 'new' } },
    );

    expect(Object.keys(merged)).toEqual(['WORD_A', 'BLEND_A', 'WORD_B', 'BLEND_NEW']);
    expect(merged.BLEND_A.value).toBe('new');
  });
});
