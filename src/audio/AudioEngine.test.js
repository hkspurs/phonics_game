import { afterEach, describe, expect, it, vi } from 'vitest';
import { audioEngine } from './AudioEngine';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

describe('AudioEngine cancellation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not start a target clip after stop cancels a cold load', async () => {
    const load = deferred();
    vi.spyOn(audioEngine, '_loadBuffer').mockReturnValueOnce(load.promise);
    const play = vi.spyOn(audioEngine, 'play').mockResolvedValue();

    const pending = audioEngine.playAudioById('WORD_BUS_01');
    audioEngine.stop();
    load.resolve({});

    await expect(pending).resolves.toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it('fails closed for missing phonics blend audio without TTS fallback', async () => {
    vi.spyOn(audioEngine, '_loadBuffer').mockResolvedValue(null);
    const fallback = vi.spyOn(audioEngine, '_playSpeechSynthesis');

    await expect(audioEngine.playAudioById('BLEND_BUS_SLOW')).resolves.toBe(false);
    expect(fallback).not.toHaveBeenCalled();
  });
});
