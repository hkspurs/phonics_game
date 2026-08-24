import { VoiceLanguage } from '../types';
import { DataManager } from './DataManager';

/**
 * SpeechService provides Web Speech API (SpeechSynthesis) speech synthesis
 * tailored for Hong Kong Primary 1 learners.
 *
 * Features:
 * - Priority fallback for Cantonese (zh-HK -> yue-HK -> zh-TW -> zh-CN)
 * - English (en-US -> en-GB -> en) and Mandarin (zh-CN -> cmn -> zh)
 * - Safe execution in non-browser/SSR/test environments
 * - Autoplay gesture unlock for mobile Safari & Chrome
 * - Rate & pitch tuning optimized for P.1 kids' clarity
 */
export class SpeechService {
  private static unlocked: boolean = false;
  private static voices: SpeechSynthesisVoice[] = [];
  private static defaultRate: number = 0.9; // Slower rate for early childhood comprehension
  private static defaultPitch: number = 1.0;
  private static defaultVolume: number = 1.0;
  private static initialized: boolean = false;

  /**
   * Initialize speech synthesis listeners
   */
  public static init(): void {
    this.unlocked = false;
    if (!this.isAvailable()) return;

    try {
      this.refreshVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.refreshVoices();
        };
      }
      this.initialized = true;
    } catch {
      // Ignore in restricted environments
    }
  }

  /**
   * Check if SpeechService has been initialized
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if Web Speech Synthesis is available in the current environment
   */
  public static isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.speechSynthesis !== 'undefined' &&
      (typeof SpeechSynthesisUtterance !== 'undefined' || typeof (window as any).SpeechSynthesisUtterance !== 'undefined')
    );
  }

  /**
   * Check if audio has been gesture-unlocked
   */
  public static isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Unlock Web Speech and AudioContext on first user interaction / touch / click
   */
  public static unlockAudio(): void {
    if (!this.isAvailable() || this.unlocked) {
      return;
    }

    try {
      const UtteranceClass = (typeof SpeechSynthesisUtterance !== 'undefined')
        ? SpeechSynthesisUtterance
        : (window as any).SpeechSynthesisUtterance;

      if (UtteranceClass && window.speechSynthesis) {
        const unlockUtterance = new UtteranceClass(' ');
        unlockUtterance.volume = 0;
        unlockUtterance.rate = 2.0;
        window.speechSynthesis.speak(unlockUtterance);
      }
      this.unlocked = true;
    } catch {
      this.unlocked = true;
    }
  }

  /**
   * Get all voices from SpeechSynthesis
   */
  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.isAvailable()) return [];
    this.refreshVoices();
    return this.voices;
  }

  /**
   * Refresh the internal voice cache
   */
  private static refreshVoices(): void {
    if (!this.isAvailable()) return;
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        this.voices = v;
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Find the optimal voice for the specified language
   */
  public static getBestVoice(lang?: VoiceLanguage | string): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    const targetLang = (lang || DataManager.getInstance().getProfile().settings.voiceLanguage || 'zh-HK').toLowerCase();

    // Cantonese matching priority: zh-HK -> yue-HK -> zh-TW -> zh-CN
    if (targetLang.includes('hk') || targetLang.includes('yue') || targetLang.includes('cantonese')) {
      const zhHkVoice = voices.find((v) => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l === 'zh-hk' || l === 'zh_hk' || n.includes('cantonese') || n.includes('hong kong') || n.includes('sin-ji') || n.includes('粵語') || n.includes('廣東話');
      });
      if (zhHkVoice) return zhHkVoice;

      const yueVoice = voices.find((v) => v.lang.toLowerCase().startsWith('yue') || v.name.toLowerCase().includes('yue'));
      if (yueVoice) return yueVoice;

      const zhTwVoice = voices.find((v) => v.lang.toLowerCase().includes('zh-tw') || v.lang.toLowerCase().includes('zh_tw') || v.name.toLowerCase().includes('taiwan'));
      if (zhTwVoice) return zhTwVoice;

      const zhCnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
      if (zhCnVoice) return zhCnVoice;
    }

    // English matching priority: en-US -> en-GB -> en
    if (targetLang.startsWith('en') || targetLang.includes('english')) {
      const enUsVoice = voices.find((v) => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l === 'en-us' || l === 'en_us' || n.includes('samantha') || n.includes('us english') || n.includes('united states');
      });
      if (enUsVoice) return enUsVoice;

      const enGbVoice = voices.find((v) => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l === 'en-gb' || l === 'en_gb' || n.includes('daniel') || n.includes('uk english') || n.includes('united kingdom');
      });
      if (enGbVoice) return enGbVoice;

      const anyEnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (anyEnVoice) return anyEnVoice;
    }

    // Mandarin matching priority: zh-CN -> cmn -> zh
    if (targetLang.includes('cn') || targetLang.includes('mandarin') || targetLang.includes('cmn')) {
      const zhCnVoice = voices.find((v) => {
        const l = v.lang.toLowerCase();
        const n = v.name.toLowerCase();
        return l === 'zh-cn' || l === 'zh_cn' || l === 'cmn-hans-cn' || n.includes('mandarin') || n.includes('ting-ting') || n.includes('putonghua') || n.includes('普通話');
      });
      if (zhCnVoice) return zhCnVoice;

      const anyZhVoice = voices.find((v) => v.lang.toLowerCase().startsWith('zh') || v.lang.toLowerCase().startsWith('cmn'));
      if (anyZhVoice) return anyZhVoice;
    }

    // Fallback: any voice matching start of targetLang, or default voice, or first voice
    const fallbackPrefix = targetLang.slice(0, 2);
    const prefixVoice = voices.find((v) => v.lang.toLowerCase().startsWith(fallbackPrefix));
    if (prefixVoice) return prefixVoice;

    const defaultVoice = voices.find((v) => (v as any).default);
    return defaultVoice || voices[0] || null;
  }

  /**
   * Normalizes text for speech synthesis, replacing mathematical and special symbols
   * with natural spoken words in the target language (e.g. + -> 加/plus, - -> 減/minus, = ? -> 等於幾多？/equals what?)
   */
  public static normalizeSpeechText(text: string, lang: VoiceLanguage | string = 'zh-HK'): string {
    if (!text) return '';
    const isZh = lang.toLowerCase().startsWith('zh') || lang.toLowerCase().startsWith('yue') || lang.toLowerCase().startsWith('cmn');
    if (isZh) {
      return text
        .replace(/(\d+)\s*-\s*(\d+)/g, '$1 減 $2')
        .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 加 $2')
        .replace(/(\d+)\s*[×*]\s*(\d+)/g, '$1 乘 $2')
        .replace(/(\d+)\s*[÷/]\s*(\d+)/g, '$1 除以 $2')
        .replace(/\s*=\s*(\?|多少|幾多|\？)/g, ' 等於幾多？')
        .replace(/\s*=\s*/g, ' 等於 ');
    } else {
      return text
        .replace(/(\d+)\s*-\s*(\d+)/g, '$1 minus $2')
        .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 plus $2')
        .replace(/(\d+)\s*[×*]\s*(\d+)/g, '$1 times $2')
        .replace(/(\d+)\s*[÷/]\s*(\d+)/g, '$1 divided by $2')
        .replace(/\s*=\s*\?/g, ' equals what?')
        .replace(/\s*=\s*/g, ' equals ');
    }
  }

  /**
   * Speak the given text with language fallback and cancellation of previous speech
   */
  public static speak(
    text: string,
    lang?: VoiceLanguage | string,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): SpeechSynthesisUtterance | null {
    if (!this.isAvailable() || !text || !text.trim()) {
      return null;
    }

    try {
      this.stop();

      const UtteranceClass = (typeof SpeechSynthesisUtterance !== 'undefined')
        ? SpeechSynthesisUtterance
        : (window as any).SpeechSynthesisUtterance;

      if (!UtteranceClass) return null;

      const targetLang = (lang || DataManager.getInstance().getProfile().settings.voiceLanguage || 'zh-HK') as VoiceLanguage;
      const processedText = this.normalizeSpeechText(text, targetLang);

      const utterance = new UtteranceClass(processedText);
      utterance.text = processedText;
      utterance.lang = targetLang;
      utterance.rate = this.defaultRate;
      utterance.pitch = this.defaultPitch;
      utterance.volume = this.defaultVolume;

      const bestVoice = this.getBestVoice(targetLang);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang || targetLang;
      }

      if (onEnd) {
        utterance.onend = () => {
          onEnd();
        };
      }

      if (onError) {
        utterance.onerror = (e: any) => {
          onError(e);
        };
      }

      window.speechSynthesis.speak(utterance);
      return utterance;
    } catch (e) {
      if (onError) onError(e);
      return null;
    }
  }

  /**
   * Stop any current speech playback
   */
  public static stop(): void {
    if (!this.isAvailable()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }

  /**
   * Configure default speech rate (0.1 to 2.0)
   */
  public static setRate(rate: number): void {
    this.defaultRate = Math.max(0.1, Math.min(2.0, rate));
  }

  /**
   * Configure default speech pitch (0.0 to 2.0)
   */
  public static setPitch(pitch: number): void {
    this.defaultPitch = Math.max(0.0, Math.min(2.0, pitch));
  }

  /**
   * Configure default speech volume (0.0 to 1.0)
   */
  public static setVolume(volume: number): void {
    this.defaultVolume = Math.max(0.0, Math.min(1.0, volume));
  }
}
