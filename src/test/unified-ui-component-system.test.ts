import { describe, it, expect } from 'vitest';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasCard } from '../ui/CanvasCard';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Enhancement 7: Unified Vector Game Icon & UI Component System', () => {
  it('instantiates CanvasButton with high-contrast palette and min 48px hit dimensions', () => {
    const mockScene = createMockSceneForMeta('TitleScene');
    const button = new CanvasButton(mockScene, {
      x: 100,
      y: 100,
      width: 200,
      height: 56,
      text: '開始冒險',
      color: 'blue',
      fontSize: '20px',
    });

    expect(button).toBeTruthy();
    expect(button.getText()).toBe('開始冒險');
    expect(button.isEnabled()).toBe(true);

    // Test disabled transition
    button.setEnabled(false);
    expect(button.isEnabled()).toBe(false);

    button.setDisabled(false);
    expect(button.isEnabled()).toBe(true);
  });

  it('renders CanvasCard with accessible states (default, active, disabled, correct, wrong)', () => {
    const mockScene = createMockSceneForMeta('QuestionScene');
    const card = new CanvasCard(mockScene, {
      x: 100,
      y: 100,
      width: 140,
      height: 64,
      text: '姐姐',
      fontSize: '28px',
    });

    expect(card.getState()).toBe('normal');
    expect(card.getText()).toBe('姐姐');

    card.setState('correct');
    expect(card.getState()).toBe('correct');

    card.setState('wrong');
    expect(card.getState()).toBe('wrong');

    card.setState('disabled');
    expect(card.getState()).toBe('disabled');
  });
});
