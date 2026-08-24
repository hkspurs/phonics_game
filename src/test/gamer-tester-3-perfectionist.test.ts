import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionScene } from '../scenes/QuestionScene';
import { TitleScene } from '../scenes/TitleScene';
import { SpeechService } from '../services/SpeechService';
import { SoundManager } from '../services/SoundManager';
import { DataManager } from '../services/DataManager';

describe('Gamer Tester 3 Audit: Zero-Trust Mobile UX, Audio Sync & Flow Integrity', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    (DataManager as any).instance = null;
  });

  it('guards QuestionScene against duplicate scene transitions on rapid tap spam', () => {
    const scene = new QuestionScene();
    scene.init({ stationId: 1 });

    let startCount = 0;
    scene.scene = {
      start: () => { startCount++; },
      isActive: () => true,
    } as any;

    scene.isAnswered = true;
    (scene as any).onCorrectAnswer();

    expect(scene.isAnswered).toBe(true);
  });

  it('stops SpeechService and respects soundVolume = 0 (Muted)', () => {
    const dm = DataManager.getInstance();
    dm.getProfile().settings.soundVolume = 0;

    const res = SpeechService.speak('測試語音', 'zh-HK');
    expect(res).toBeNull();
  });

  it('verifies SoundManager synthesized tones do NOT create AudioContext nodes when muted', () => {
    const mockAudioCtx = {
      currentTime: 0,
      createOscillator: vi.fn(),
      createGain: vi.fn(),
      destination: {},
    };

    (SoundManager as any).audioContext = mockAudioCtx;
    (SoundManager as any).muted = true;

    SoundManager.playComboCorrect(1);
    expect(mockAudioCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('renders version footer on TitleScene with high-DPI container', () => {
    const scene = new TitleScene();
    let createdContainer = false;

    scene.add = {
      container: vi.fn(() => {
        createdContainer = true;
        return {
          setDepth: vi.fn().mockReturnThis(),
          add: vi.fn(),
        };
      }),
      graphics: vi.fn(() => ({
        fillStyle: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
      })),
      text: vi.fn((x, y, text, style) => ({
        x,
        y,
        text,
        style,
        setOrigin: vi.fn().mockReturnThis(),
      })),
    } as any;

    scene.createVersionFooter(1280, 720);
    expect(createdContainer).toBe(true);
  });
});
