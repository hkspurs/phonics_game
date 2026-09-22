import { vi, type Mock } from 'vitest';

export interface GraphicsCallRecord {
  method: GraphicsMethodName;
  args: unknown[];
}

const GRAPHICS_METHODS = [
  'clear', 'fillStyle', 'fillGradientStyle', 'lineStyle',
  'fillRect', 'strokeRect', 'fillRoundedRect', 'strokeRoundedRect',
  'fillCircle', 'strokeCircle', 'strokeCircleShape',
  'fillEllipse', 'strokeEllipse', 'lineBetween',
  'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'arc',
  'closePath', 'fillPath', 'strokePath',
  'setDepth', 'setPosition', 'setAlpha', 'setVisible', 'setScale',
  'setScrollFactor', 'setRotation', 'setAngle', 'setBlendMode',
] as const;

export type GraphicsMethodName = typeof GRAPHICS_METHODS[number];

export type PhaserGraphicsMock = {
  [K in GraphicsMethodName]: Mock;
} & {
  calls: GraphicsCallRecord[];
  x: number;
  y: number;
  depth: number;
  destroy: Mock;
};

/** Explicit Phaser Graphics double: every supported method records arguments and chains. */
export function createPhaserGraphicsMock(config: { x?: number; y?: number } = {}): PhaserGraphicsMock {
  const calls: GraphicsCallRecord[] = [];
  const graphics = {
    calls,
    x: config.x ?? 0,
    y: config.y ?? 0,
    depth: 0,
    destroy: vi.fn(),
  } as unknown as PhaserGraphicsMock;

  for (const method of GRAPHICS_METHODS) {
    graphics[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      if (method === 'setDepth') graphics.depth = Number(args[0]);
      if (method === 'setPosition') {
        graphics.x = Number(args[0]);
        graphics.y = Number(args[1]);
      }
      return graphics;
    });
  }
  return graphics;
}

export const PHASER_GRAPHICS_METHODS: readonly GraphicsMethodName[] = GRAPHICS_METHODS;
