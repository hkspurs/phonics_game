import { describe, expect, it, vi } from 'vitest';
import { CHINESE_SPACE_COPY, createChineseSpaceScene, normalizeChineseSpaceQuestions } from './ChineseSpaceScene';

class FakeScene {}

const Phaser = { Scene: FakeScene };

function makeCallbacks() {
  return {
    audio: { playWord: vi.fn(), playSfx: vi.fn(), stop: vi.fn() },
    store: {
      getState: vi.fn(() => ({ spaceGems: 0, ownedBadgeIds: [], tutorialComplete: false })),
      addGems: vi.fn(),
      markTutorialComplete: vi.fn(),
      redeemBadge: vi.fn(),
    },
    onExit: vi.fn(),
    onSessionComplete: vi.fn(),
    onUiStateChange: vi.fn(),
  };
}

describe('Chinese Space scene factory', () => {
  it('returns a Phaser scene with the public lifecycle controls', () => {
    const Scene = createChineseSpaceScene(Phaser, makeCallbacks());

    expect(Scene.prototype).toBeInstanceOf(Object);
    expect(new Scene()).toBeInstanceOf(FakeScene);
    for (const method of ['showHome', 'showChapterSelect', 'startChapter', 'showBadges', 'destroyAudio']) {
      expect(Scene.prototype[method]).toEqual(expect.any(Function));
    }
  });

  it('stops current word audio when the scene is destroyed', () => {
    const callbacks = makeCallbacks();
    const Scene = createChineseSpaceScene(Phaser, callbacks);

    new Scene().destroyAudio();

    expect(callbacks.audio.stop).toHaveBeenCalledOnce();
  });

  it('keeps the scene copy in traditional Chinese', () => {
    const copy = Object.values(CHINESE_SPACE_COPY).join(' ');

    expect(copy).toContain('中文字');
    expect(copy).not.toMatch(/[学长门园儿课书妈爸]/);
  });

  it('normalizes catalog text into reducer target objects', () => {
    expect(normalizeChineseSpaceQuestions('school', [{
      id: 'school-teacher',
      answer: '老師',
      distractors: ['校長', '同學'],
    }])).toEqual([{
      id: 'school-teacher',
      answer: { id: 'school-teacher', text: '老師' },
      distractors: [
        { id: 'school-principal', text: '校長' },
        { id: 'school-classmate', text: '同學' },
      ],
    }]);
  });
});
