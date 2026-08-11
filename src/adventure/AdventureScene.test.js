import { describe, expect, it } from 'vitest';
import { createAdventureScene } from './AdventureScene';

class FakeScene {}

const labels = {
  steps: ['Rabbit House', 'River Bridge', 'Carrot Castle'],
  adventure: 'Adventure',
  greatWork: 'Great work!',
  keepGoing: 'Keep going!',
};

describe('AdventureScene captions', () => {
  it('does not reveal the word while the child is still trying', () => {
    const AdventureScene = createAdventureScene({ Scene: FakeScene }, { labels });
    const scene = new AdventureScene();
    scene.state = { ...scene.state, status: 'retry', word: 'CAT' };

    expect(scene.captionText()).toBe('Keep going!');
  });
});
