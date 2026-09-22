import type { Page } from '@playwright/test';

export interface SpeechFixtureVoice {
  name: string;
  lang: string;
  default?: boolean;
}

export async function installSpeechFixture(
  page: Page,
  voices: SpeechFixtureVoice[] = [{ name: 'QA Cantonese', lang: 'zh-HK', default: true }],
): Promise<void> {
  await page.addInitScript((fixtureVoices) => {
    class FixtureUtterance {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    const completeVoices = fixtureVoices.map((item) => ({
      ...item,
      default: item.default ?? false,
      localService: true,
      voiceURI: `qa:${item.name}`,
    }));
    (window as any).__SPEECH_UTTERANCES__ = [];
    (window as any).__SPEECH_CANCEL_COUNT__ = 0;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FixtureUtterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        onvoiceschanged: null,
        getVoices: () => completeVoices,
        cancel: () => { (window as any).__SPEECH_CANCEL_COUNT__ += 1; },
        speak: (utterance: FixtureUtterance) => {
          (window as any).__SPEECH_UTTERANCES__.push({
            text: utterance.text,
            lang: utterance.lang,
            voiceName: (utterance.voice as any)?.name ?? null,
          });
        },
      },
    });
  }, voices);
}

export async function latestSpeech(page: Page): Promise<{ text: string; lang: string; voiceName: string | null } | null> {
  return page.evaluate(() => (window as any).__SPEECH_UTTERANCES__.at(-1) ?? null);
}

export async function clearSpeech(page: Page): Promise<void> {
  await page.evaluate(() => { (window as any).__SPEECH_UTTERANCES__ = []; });
}
