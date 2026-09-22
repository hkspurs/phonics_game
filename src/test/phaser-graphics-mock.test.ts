import { describe, expect, it } from 'vitest';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { createPhaserGraphicsMock, PHASER_GRAPHICS_METHODS } from './phaserGraphicsMock';

describe('explicit Phaser Graphics test harness', () => {
  it('exposes only named chainable methods and records exact geometry', () => {
    const graphics = createPhaserGraphicsMock({ x: 4, y: 8 });
    for (const method of PHASER_GRAPHICS_METHODS) expect(graphics[method]).toBeTypeOf('function');

    expect(graphics.fillRoundedRect(1, 2, 30, 40, 6)).toBe(graphics);
    expect(graphics.strokeCircle(12, 14, 9)).toBe(graphics);
    expect(graphics.strokeEllipse(20, 22, 36, 18)).toBe(graphics);
    expect(graphics.moveTo(5, 7).lineTo(11, 13).closePath().strokePath()).toBe(graphics);
    expect(graphics.fillGradientStyle(1, 2, 3, 4, 0.1, 0.2, 0.3, 0.4)).toBe(graphics);

    expect(graphics.calls).toEqual([
      { method: 'fillRoundedRect', args: [1, 2, 30, 40, 6] },
      { method: 'strokeCircle', args: [12, 14, 9] },
      { method: 'strokeEllipse', args: [20, 22, 36, 18] },
      { method: 'moveTo', args: [5, 7] },
      { method: 'lineTo', args: [11, 13] },
      { method: 'closePath', args: [] },
      { method: 'strokePath', args: [] },
      { method: 'fillGradientStyle', args: [1, 2, 3, 4, 0.1, 0.2, 0.3, 0.4] },
    ]);
    expect((graphics as any).unknownRendererMethod).toBeUndefined();
  });

  it('captures real compositor geometry instead of merely accepting calls', () => {
    const graphics = createPhaserGraphicsMock();
    CharacterOutfitCompositor.renderOutfit(graphics as never, { dress: 'princess_dress' }, {
      offsetX: 100,
      offsetY: 200,
      scale: 1,
    });

    expect(graphics.clear).toHaveBeenCalledOnce();
    expect(graphics.beginPath).toHaveBeenCalled();
    expect(graphics.fillPath).toHaveBeenCalled();
    expect(graphics.calls.some(call =>
      call.method === 'moveTo' && call.args.every(value => Number.isFinite(value))
    )).toBe(true);
  });
});
