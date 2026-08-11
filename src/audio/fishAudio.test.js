import { describe, expect, it } from 'vitest';

import {
  buildFishRequest,
  FISH_MODEL,
  FISH_REFERENCE_ID,
} from '../../scripts/fish-audio.cjs';

describe('Fish Audio request', () => {
  it('defaults to the selected young narrator and app-compatible WAV output', () => {
    const request = buildFishRequest('map', { speed: 0.8 });

    expect(FISH_MODEL).toBe('s2.1-pro-free');
    expect(FISH_REFERENCE_ID).toBe('1e39b1998ce842c6b5ffcfd9be6a5456');
    expect(request.text).toBe('map');
    expect(request.reference_id).toBe(FISH_REFERENCE_ID);
    expect(request.format).toBe('wav');
    expect(request.sample_rate).toBe(24000);
    expect(request.prosody.speed).toBe(0.8);
  });
});
