import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpeechService } from '../services/SpeechService';
import { QuestionScene } from '../scenes/QuestionScene';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

function voice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe('SpeechService lifecycle', () => {
  let availableVoices: SpeechSynthesisVoice[];
  let spoken: FakeUtterance[];
  let speak: ReturnType<typeof vi.fn>;
  let cancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    availableVoices = [];
    spoken = [];
    speak = vi.fn((utterance: FakeUtterance) => spoken.push(utterance));
    cancel = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { getVoices: () => availableVoices, speak, cancel, onvoiceschanged: null },
    });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    SpeechService.init();
  });

  it('does not substitute a Mandarin voice for a Cantonese request', () => {
    availableVoices = [voice('Mandarin', 'zh-CN')];
    expect(SpeechService.getBestVoice('zh-HK')).toBeNull();
  });

  it('clears a stale voice cache when the browser reports no voices', () => {
    availableVoices = [voice('Cantonese', 'zh-HK')];
    expect(SpeechService.getBestVoice('zh-HK')?.name).toBe('Cantonese');
    availableVoices = [];
    window.speechSynthesis.onvoiceschanged?.(new Event('voiceschanged'));
    expect(SpeechService.getVoices()).toEqual([]);
  });

  it('does not report audio unlocked when the unlock utterance throws', () => {
    speak.mockImplementation(() => { throw new Error('permission denied'); });
    SpeechService.unlockAudio();
    expect(SpeechService.isUnlocked()).toBe(false);
  });

  it('invalidates an old completion callback when speech is stopped', () => {
    const ended = vi.fn();
    SpeechService.speak('第一題', 'zh-HK', ended);
    expect(spoken).toHaveLength(1);
    SpeechService.stop();
    spoken[0].onend?.();
    expect(ended).not.toHaveBeenCalled();
  });

  it('cancels question-owned speech when the question scene shuts down', () => {
    const stop = vi.spyOn(SpeechService, 'stop');
    const scene = new QuestionScene();
    scene.shutdown();
    expect(stop).toHaveBeenCalledOnce();
  });

});
