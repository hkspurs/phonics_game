import { describe, expect, it } from 'vitest';
import { buildRawBlendText } from '../../scripts/generate-simple-word-blend-audio.cjs';

describe('simple word blend audio input', () => {
  it('creates one raw-phoneme utterance instead of spelling letter names', () => {
    expect(buildRawBlendText('MAP')).toBe('[[mmmææp]]');
  });

  it('does not sustain a stop consonant or drop the /g/ sound', () => {
    expect(buildRawBlendText('CAT')).toBe('[[kææt]]');
    expect(buildRawBlendText('PIG')).toBe('[[pɪɪɡ]]');
    expect(buildRawBlendText('DOG')).toBe('[[dɒɒɡ]]');
  });
});
