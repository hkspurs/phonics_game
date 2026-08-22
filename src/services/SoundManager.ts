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

  /**
   * Reset sound manager reference (useful for testing)
   */
  public static reset(): void {
    this.soundManager = null;
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
