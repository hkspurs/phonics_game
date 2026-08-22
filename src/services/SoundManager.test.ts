import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SoundManager } from './SoundManager';
import { DataManager } from './DataManager';

describe('SoundManager', () => {
  let mockScene: any;
  let mockPhaserSound: any;

  beforeEach(() => {
    DataManager.getInstance().reset();
    SoundManager.reset();

    mockPhaserSound = {
      volume: 1,
      mute: false,
      play: vi.fn(),
      stopByKey: vi.fn(),
      stopAll: vi.fn(),
      setVolume: vi.fn((v: number) => {
        mockPhaserSound.volume = v;
      }),
      setMute: vi.fn((m: boolean) => {
        mockPhaserSound.mute = m;
      }),
      get: vi.fn((key: string) => ({ key, play: vi.fn(), stop: vi.fn() })),
      locked: false,
      unlock: vi.fn(),
    };

    mockScene = {
      sound: mockPhaserSound,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Uninitialized State', () => {
    it('should report isAvailable as false when not initialized', () => {
      expect(SoundManager.isAvailable()).toBe(false);
    });

    it('should not throw error when play() is called before init', () => {
      expect(() => {
        SoundManager.play('click');
        SoundManager.stop('click');
        SoundManager.stopAll();
      }).not.toThrow();
    });
  });

  describe('Initialization & Playback', () => {
    it('should initialize successfully with a Phaser.Scene', () => {
      SoundManager.init(mockScene);
      expect(SoundManager.isAvailable()).toBe(true);
    });

    it('should initialize successfully with Phaser.Sound.BaseSoundManager directly', () => {
      SoundManager.init(mockPhaserSound);
      expect(SoundManager.isAvailable()).toBe(true);
    });

    it('should play valid sound keys', () => {
      SoundManager.init(mockScene);
      const keys: Array<'click' | 'correct' | 'wrong' | 'coin' | 'chest' | 'victory' | 'jump'> = [
        'click',
        'correct',
        'wrong',
        'coin',
        'chest',
        'victory',
        'jump',
      ];

      for (const key of keys) {
        SoundManager.play(key);
        expect(mockPhaserSound.play).toHaveBeenCalledWith(
          key,
          expect.objectContaining({ volume: expect.any(Number) })
        );
      }
    });

    it('should calculate volume based on DataManager settings', () => {
      DataManager.getInstance().updateSettings({ soundVolume: 0.6 });
      SoundManager.init(mockScene);

      SoundManager.play('coin');
      expect(mockPhaserSound.play).toHaveBeenCalledWith('coin', expect.objectContaining({ volume: 0.6 }));

      // With custom config volume
      SoundManager.play('victory', { volume: 0.5 });
      expect(mockPhaserSound.play).toHaveBeenCalledWith('victory', expect.objectContaining({ volume: 0.3 }));
    });

    it('should gracefully catch and handle play errors if sound key is missing in Phaser cache', () => {
      mockPhaserSound.play.mockImplementationOnce(() => {
        throw new Error('Missing audio key in cache');
      });

      SoundManager.init(mockScene);
      expect(() => {
        SoundManager.play('wrong');
      }).not.toThrow();
    });
  });

  describe('Volume & Mute Controls', () => {
    it('should get and set volume, updating DataManager settings', () => {
      SoundManager.init(mockScene);
      SoundManager.setVolume(0.4);

      expect(mockPhaserSound.setVolume).toHaveBeenCalledWith(0.4);
      expect(SoundManager.getVolume()).toBe(0.4);
      expect(DataManager.getInstance().getProfile().settings.soundVolume).toBe(0.4);
    });

    it('should clamp volume between 0.0 and 1.0', () => {
      SoundManager.init(mockScene);
      SoundManager.setVolume(1.5);
      expect(SoundManager.getVolume()).toBe(1.0);

      SoundManager.setVolume(-0.5);
      expect(SoundManager.getVolume()).toBe(0.0);
    });

    it('should toggle mute state', () => {
      SoundManager.init(mockScene);
      SoundManager.setMute(true);
      expect(mockPhaserSound.setMute).toHaveBeenCalledWith(true);
      expect(SoundManager.isMuted()).toBe(true);

      SoundManager.setMute(false);
      expect(mockPhaserSound.setMute).toHaveBeenCalledWith(false);
      expect(SoundManager.isMuted()).toBe(false);
    });

    it('should stop specific sounds and stop all sounds', () => {
      SoundManager.init(mockScene);
      SoundManager.stop('coin');
      expect(mockPhaserSound.stopByKey).toHaveBeenCalledWith('coin');

      SoundManager.stop();
      expect(mockPhaserSound.stopAll).toHaveBeenCalled();

      SoundManager.stopAll();
      expect(mockPhaserSound.stopAll).toHaveBeenCalledTimes(2);
    });
  });
});
