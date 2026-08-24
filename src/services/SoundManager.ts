import { DataManager } from './DataManager';

export type SFXKey = 'click' | 'correct' | 'wrong' | 'coin' | 'chest' | 'victory' | 'jump';

/**
 * SoundManager provides a centralized sound effects controller wrapping Phaser 3's
 * BaseSoundManager, integrated with user volume preferences and persistent settings.
 */
export class SoundManager {
  private static soundManager: Phaser.Sound.BaseSoundManager | any = null;

  /**
   * Initialize SoundManager with a Phaser.Scene or BaseSoundManager instance
   */
  public static init(target: Phaser.Scene | Phaser.Sound.BaseSoundManager | any): void {
    if (!target) return;

    if (target.sound) {
      this.soundManager = target.sound;
    } else {
      this.soundManager = target;
    }

    try {
      const volume = DataManager.getInstance().getProfile().settings.soundVolume;
      if (this.soundManager && typeof this.soundManager.setVolume === 'function') {
        this.soundManager.setVolume(volume);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Check if sound manager instance is active and initialized
   */
  public static isAvailable(): boolean {
    return this.soundManager !== null;
  }

  private static comboCount: number = 0;
  private static audioCtx: AudioContext | null = null;

  /**
   * Safe AudioContext getter with auto-resume on first interaction
   */
  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Reset sound manager reference (useful for testing)
   */
  public static reset(): void {
    this.soundManager = null;
    this.comboCount = 0;
  }

  /**
   * Reset combo count
   */
  public static resetCombo(): void {
    this.comboCount = 0;
  }

  /**
   * Get current combo count
   */
  public static getCombo(): number {
    return this.comboCount;
  }

  /**
   * Play a registered SFX key with volume scaled by user settings
   */
  public static play(
    key: SFXKey | string,
    config?: Phaser.Types.Sound.SoundConfig
  ): Phaser.Sound.BaseSound | null | void {
    if (!this.soundManager) {
      return null;
    }

    try {
      const settingsVolume = DataManager.getInstance().getProfile().settings.soundVolume;
      const baseVol = config?.volume !== undefined ? config.volume : 1.0;
      const effectiveVolume = Math.max(0, Math.min(1, baseVol * settingsVolume));

      const mergedConfig: Phaser.Types.Sound.SoundConfig = {
        ...config,
        volume: effectiveVolume,
      };

      if (typeof this.soundManager.play === 'function') {
        return this.soundManager.play(key, mergedConfig);
      }
    } catch (e) {
      console.warn(`[SoundManager] Failed to play sound key "${key}":`, e);
      return null;
    }
  }

  /**
   * Progressive Do-Re-Mi Pitch-Shifted Combo Correct Sound (C5 -> E5 -> G5 -> C6 -> E6)
   */
  public static playComboCorrect(comboIndex?: number): void {
    if (comboIndex !== undefined) {
      this.comboCount = comboIndex;
    } else {
      this.comboCount++;
    }

    // First trigger standard correct SFX
    this.play('correct');

    // Layer with synthesized crystal tone for instant response
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      const noteIdx = Math.min(this.comboCount - 1, notes.length - 1);
      const freq = notes[Math.max(0, noteIdx)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Quick chime envelope
      const vol = Math.min(0.25, 0.15 * this.getVolume());
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Ignore
    }
  }

  /**
   * Gentle, soft water drop / bubble pop error sound (no harsh buzzer)
   */
  public static playSoftWrong(): void {
    this.resetCombo();
    this.play('wrong');

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch slide downwards gently (260Hz -> 170Hz)
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(170, ctx.currentTime + 0.18);

      const vol = Math.min(0.2, 0.12 * this.getVolume());
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.19);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  /**
   * ASMR crisp magnetic click for card slots
   */
  public static playCardSnap(): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      this.play('click');
      return;
    }

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.05);

      const vol = Math.min(0.25, 0.18 * this.getVolume());
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      this.play('click');
    }
  }

  /**
   * Arpeggiated coin collection tone in runner
   */
  public static playCoinArpeggio(step: number = 0): void {
    const ctx = this.getAudioContext();
    if (!ctx) {
      this.play('coin');
      return;
    }

    try {
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
      const freq = pentatonic[step % pentatonic.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const vol = Math.min(0.2, 0.15 * this.getVolume());
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      this.play('coin');
    }
  }

  /**
   * Stop playing sound by key, or stop all sounds if no key is provided
   */
  public static stop(key?: string): void {
    if (!this.soundManager) return;

    try {
      if (key) {
        if (typeof this.soundManager.stopByKey === 'function') {
          this.soundManager.stopByKey(key);
        } else if (typeof this.soundManager.stopAll === 'function') {
          this.soundManager.stopAll();
        }
      } else {
        if (typeof this.soundManager.stopAll === 'function') {
          this.soundManager.stopAll();
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Stop all currently playing sounds
   */
  public static stopAll(): void {
    this.stop();
  }

  /**
   * Set global SFX volume (0.0 to 1.0) and persist to DataManager settings
   */
  public static setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    try {
      DataManager.getInstance().updateSettings({ soundVolume: clamped });
    } catch {
      // Ignore
    }

    if (this.soundManager && typeof this.soundManager.setVolume === 'function') {
      this.soundManager.setVolume(clamped);
    }
  }

  /**
   * Get current volume setting
   */
  public static getVolume(): number {
    try {
      return DataManager.getInstance().getProfile().settings.soundVolume;
    } catch {
      return 1.0;
    }
  }

  /**
   * Check if sound is muted
   */
  public static isMuted(): boolean {
    if (!this.soundManager) return false;
    return Boolean(this.soundManager.mute);
  }

  /**
   * Set mute state
   */
  public static setMute(muted: boolean): void {
    if (!this.soundManager) return;
    if (typeof this.soundManager.setMute === 'function') {
      this.soundManager.setMute(muted);
    } else {
      this.soundManager.mute = muted;
    }
  }
}
