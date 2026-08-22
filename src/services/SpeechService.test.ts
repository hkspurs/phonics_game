import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpeechService } from './SpeechService';
import { DataManager } from './DataManager';

describe('SpeechService', () => {
  let mockSpeechSynthesis: any;
  let mockVoices: any[];
  let originalSpeechSynthesis: any;
  let originalUtterance: any;

  beforeEach(() => {
    DataManager.getInstance().reset();

    // Mock SpeechSynthesisVoice list
    mockVoices = [
      { name: 'Sin-Ji (Cantonese)', lang: 'zh-HK', default: false, localService: true, voiceURI: 'zh-HK-sinji' },
      { name: 'Ting-Ting (Mandarin)', lang: 'zh-CN', default: false, localService: true, voiceURI: 'zh-CN-tingting' },
      { name: 'Mei-Jia (Taiwanese)', lang: 'zh-TW', default: false, localService: true, voiceURI: 'zh-TW-meijia' },
      { name: 'Samantha (US English)', lang: 'en-US', default: true, localService: true, voiceURI: 'en-US-samantha' },
      { name: 'Daniel (UK English)', lang: 'en-GB', default: false, localService: true, voiceURI: 'en-GB-daniel' },
      { name: 'Yue voice', lang: 'yue-HK', default: false, localService: true, voiceURI: 'yue-HK-custom' },
    ];

    mockSpeechSynthesis = {
      speaking: false,
      paused: false,
      pending: false,
      speak: vi.fn((_utterance: any) => {
        mockSpeechSynthesis.speaking = true;
      }),
      cancel: vi.fn(() => {
        mockSpeechSynthesis.speaking = false;
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => mockVoices),
      onvoiceschanged: null,
    };

    class MockSpeechSynthesisUtterance {
      text: string;
      lang: string = '';
      voice: any = null;
      volume: number = 1;
      rate: number = 1;
      pitch: number = 1;
      onend: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      onstart: ((e: any) => void) | null = null;

      constructor(text: string = '') {
        this.text = text;
      }
    }

    originalSpeechSynthesis = (globalThis as any).window?.speechSynthesis;
    originalUtterance = (globalThis as any).SpeechSynthesisUtterance;

    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.speechSynthesis = mockSpeechSynthesis;
    (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    (globalThis as any).window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

    SpeechService.init();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalSpeechSynthesis) {
      (globalThis as any).window.speechSynthesis = originalSpeechSynthesis;
    } else {
      delete (globalThis as any).window.speechSynthesis;
    }
    if (originalUtterance) {
      (globalThis as any).SpeechSynthesisUtterance = originalUtterance;
      (globalThis as any).window.SpeechSynthesisUtterance = originalUtterance;
    } else {
      delete (globalThis as any).SpeechSynthesisUtterance;
      delete (globalThis as any).window.SpeechSynthesisUtterance;
    }
  });

  describe('Availability & Environment Safety', () => {
    it('should report available when window.speechSynthesis is present', () => {
      expect(SpeechService.isAvailable()).toBe(true);
    });

    it('should report unavailable and not throw when speechSynthesis is undefined', () => {
      delete (globalThis as any).window.speechSynthesis;
      expect(SpeechService.isAvailable()).toBe(false);

      expect(() => {
        SpeechService.speak('測試句子');
        SpeechService.stop();
        SpeechService.unlockAudio();
        SpeechService.getVoices();
      }).not.toThrow();
    });
  });

  describe('Voice Selection & Fallback Priority', () => {
    it('should return available voices from getVoices()', () => {
      const voices = SpeechService.getVoices();
      expect(voices).toHaveLength(6);
      expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
    });

    it('should match Cantonese voices in order: zh-HK, yue-HK, zh-TW, then zh-CN', () => {
      const voice = SpeechService.getBestVoice('zh-HK');
      expect(voice).toBeDefined();
      expect(voice?.lang).toBe('zh-HK');

      // Test fallback to yue-HK when zh-HK not present
      mockSpeechSynthesis.getVoices.mockReturnValueOnce([
        { name: 'Yue voice', lang: 'yue-HK' },
        { name: 'Samantha', lang: 'en-US' },
      ]);
      const yueVoice = SpeechService.getBestVoice('zh-HK');
      expect(yueVoice?.lang).toBe('yue-HK');

      // Test fallback to zh-TW when zh-HK / yue-HK not present
      mockSpeechSynthesis.getVoices.mockReturnValueOnce([
        { name: 'Mei-Jia', lang: 'zh-TW' },
        { name: 'Samantha', lang: 'en-US' },
      ]);
      const twVoice = SpeechService.getBestVoice('zh-HK');
      expect(twVoice?.lang).toBe('zh-TW');
    });

    it('should match English voices in order: en-US, en-GB, en', () => {
      const voice = SpeechService.getBestVoice('en-US');
      expect(voice?.lang).toBe('en-US');

      mockSpeechSynthesis.getVoices.mockReturnValueOnce([
        { name: 'Daniel', lang: 'en-GB' },
        { name: 'Sin-Ji', lang: 'zh-HK' },
      ]);
      const gbVoice = SpeechService.getBestVoice('en-US');
      expect(gbVoice?.lang).toBe('en-GB');
    });

    it('should match Mandarin voices in order: zh-CN, cmn, zh', () => {
      const voice = SpeechService.getBestVoice('zh-CN');
      expect(voice?.lang).toBe('zh-CN');
    });
  });

  describe('Speech Playback & Utterance Configuration', () => {
    it('should cancel previous speech before speaking new text', () => {
      SpeechService.speak('第一句話', 'zh-HK');
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(1);

      SpeechService.speak('第二句話', 'zh-HK');
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(2);
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should configure utterance with correct voice, rate, pitch, and lang', () => {
      SpeechService.speak('Apple', 'en-US');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const lastCallUtterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(lastCallUtterance.text).toBe('Apple');
      expect(lastCallUtterance.lang).toBe('en-US');
      expect(lastCallUtterance.voice.lang).toBe('en-US');
      expect(lastCallUtterance.rate).toBeCloseTo(0.9, 1);
    });

    it('should use default language from DataManager if lang is not supplied', () => {
      DataManager.getInstance().updateSettings({ voiceLanguage: 'en-US' });
      SpeechService.speak('Good morning');
      const lastCallUtterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(lastCallUtterance.lang).toBe('en-US');
    });

    it('should trigger onEnd callback when utterance completes', () => {
      const onEndSpy = vi.fn();
      SpeechService.speak('測試', 'zh-HK', onEndSpy);

      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.onend).toBeDefined();
      utterance.onend({} as any);
      expect(onEndSpy).toHaveBeenCalledTimes(1);
    });

    it('should stop speaking when stop() is called', () => {
      SpeechService.stop();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gesture Unlock', () => {
    it('should perform unlock by speaking a silent utterance on user gesture', () => {
      SpeechService.unlockAudio();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const unlockUtterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(unlockUtterance.volume).toBe(0);
      expect(SpeechService.isUnlocked()).toBe(true);
    });

    it('should only perform unlock once', () => {
      SpeechService.unlockAudio();
      const countAfterFirst = mockSpeechSynthesis.speak.mock.calls.length;
      SpeechService.unlockAudio();
      expect(mockSpeechSynthesis.speak.mock.calls.length).toBe(countAfterFirst);
    });
  });
});
