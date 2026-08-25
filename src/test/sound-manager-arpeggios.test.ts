import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundManager } from '../services/SoundManager';

describe('SoundManager Arpeggios & Audio Synthesis', () => {
  let mockAudioContext: any;
  let mockOscillator: any;
  let mockGain: any;

  beforeEach(() => {
    SoundManager.reset();

    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      currentTime: 0,
      state: 'running',
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
    };

    (globalThis as any).window = {
      AudioContext: vi.fn(() => mockAudioContext),
    };
    (SoundManager as any).audioCtx = mockAudioContext;
  });

  it('synthesizes progressive arpeggiated coin notes across steps', () => {
    SoundManager.playCoinArpeggio(0);
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 0);

    SoundManager.playCoinArpeggio(2);
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 0);
  });

  it('synthesizes double jump audio', () => {
    expect(() => SoundManager.playDoubleJump()).not.toThrow();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('synthesizes shield break audio', () => {
    expect(() => SoundManager.playShieldBreak()).not.toThrow();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('synthesizes rock jump bonus audio', () => {
    expect(() => SoundManager.playRockJumpBonus()).not.toThrow();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('synthesizes clothing snap ASMR sound', () => {
    expect(() => SoundManager.playClothSnap()).not.toThrow();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('synthesizes magic transform chime', () => {
    expect(() => SoundManager.playMagicTransform()).not.toThrow();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('synthesizes camera shutter sound', () => {
    expect(() => SoundManager.playCameraSnap()).not.toThrow();
    expect(mockOscillator.start).toHaveBeenCalled();
  });
});
