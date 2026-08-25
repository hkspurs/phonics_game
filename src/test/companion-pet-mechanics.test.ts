import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CompanionPet } from '../ui/CompanionPet';

function attachEventEmitter(obj: any): any {
  const listeners: Record<string, Function[]> = {};
  obj.on = vi.fn(function (ev: string, fn: Function) {
    (listeners[ev] = listeners[ev] || []).push(fn);
    return obj;
  });
  obj.once = vi.fn(function (ev: string, fn: Function) {
    const wrapper = (...args: any[]) => {
      obj.off(ev, wrapper);
      fn(...args);
    };
    (listeners[ev] = listeners[ev] || []).push(wrapper);
    return obj;
  });
  obj.off = vi.fn(function (ev: string, fn?: Function) {
    if (!fn) delete listeners[ev];
    else if (listeners[ev]) listeners[ev] = listeners[ev].filter((f: any) => f !== fn);
    return obj;
  });
  obj.removeListener = obj.off;
  obj.emit = vi.fn(function (ev: string, ...args: any[]) {
    (listeners[ev] || []).slice().forEach((fn: any) => fn(...args));
    return true;
  });
  obj.removeFromDisplayList = vi.fn().mockReturnThis();
  obj.addedToScene = vi.fn().mockReturnThis();
  return obj;
}

describe('CompanionPet Component & Kinematics', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = {
      sys: {
        queueDepthSort: vi.fn(),
        settings: { key: 'MockScene' },
        updateList: { add: vi.fn(), remove: vi.fn() },
      },
      add: {
        existing: vi.fn(),
        graphics: vi.fn(() => attachEventEmitter({
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
        })),
        text: vi.fn((x: number, y: number, text: string, style?: any) => attachEventEmitter({
          x,
          y,
          text,
          style: style || {},
          setOrigin: vi.fn().mockReturnThis(),
          setFlipX: vi.fn().mockReturnThis(),
        })),
      },
      tweens: {
        add: vi.fn(),
      },
    };
  });

  it('initializes CompanionPet with correct pet definition and magnet bonus', () => {
    const pet = new CompanionPet(mockScene, { petId: 'dino', x: 200, y: 500 });
    expect(pet.petDefinition.id).toBe('dino');
    expect(pet.getMagnetBonus()).toBe(60);
  });

  it('updates position smoothly via lerp towards target player coordinates', () => {
    const pet = new CompanionPet(mockScene, { petId: 'mecha_cat', x: 200, y: 500 });
    expect(pet.x).toBe(200);
    expect(pet.y).toBe(500);

    // Update with player at x=300, y=540
    pet.updatePet(0.1, 300, 540, false);

    // Follow target should move towards playerX - 45 = 255
    expect(pet.x).toBeGreaterThan(200);
    expect(pet.x).toBeLessThanOrEqual(255);
  });

  it('plays victory dance tween on celebration', () => {
    const pet = new CompanionPet(mockScene, { petId: 'pixie_dragon', x: 200, y: 500 });
    pet.playVictoryDance();
    expect(mockScene.tweens.add).toHaveBeenCalled();
  });
});
