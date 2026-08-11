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

    const pending = audioEngine.playAudioById('WORD_BUS_GEN_01');
    audioEngine.stop();
    load.resolve({});

    await expect(pending).resolves.toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it('fails closed for missing phonics audio without TTS fallback', async () => {
    vi.spyOn(audioEngine, '_loadBuffer').mockResolvedValue(null);
    const fallback = vi.spyOn(audioEngine, '_playSpeechSynthesis');

    await expect(audioEngine.playAudioById('WORD_BUS_GEN_01')).resolves.toBe(false);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('cache-busts Fish word audio after a replacement', async () => {
    const load = vi.spyOn(audioEngine, '_loadBuffer').mockResolvedValue({});
    vi.spyOn(audioEngine, 'play').mockResolvedValue();

    await expect(audioEngine.playAudioById('WORD_HID_GEN_01')).resolves.toBe(true);

    expect(load).toHaveBeenCalledWith(
      expect.stringMatching(/assets\/simple-words\/generated\/080_hid\.mp3\?v=fish-young-narrator-1$/),
      0,
    );
  });
});
