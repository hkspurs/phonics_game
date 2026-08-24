import { describe, it, expect, beforeEach } from 'vitest';
import { RunnerScene } from '../scenes/RunnerScene';

describe('Gamer Tester 1: Hardcore Speedrunner & Physics Edge-Case Audit', () => {
  let scene: RunnerScene;

  beforeEach(() => {
    scene = new RunnerScene();
    scene.init();
    scene.playerSprite = {
      y: 540,
      setY: (y: number) => { scene.playerY = y; },
      setTexture: () => {},
      setScale: () => {},
    } as any;
  });

  it('sets isGrounded to false when player runs off a floating platform edge', () => {
    scene.worldItems = [{ id: 'plat', type: 'platform', worldX: 260, worldY: 440 }];
    scene.playerY = 440;
    scene.currentGroundY = 440;
    scene.isGrounded = true;

    // Move player past the platform
    scene.distanceRun = 200; // Platform moves away
    scene.update(16, 16);

    expect(scene.isGrounded).toBe(false);
  });

  it('prevents multi-triggering springboard across consecutive frames via cooldown', () => {
    let triggerCount = 0;
    const originalTrigger = scene.triggerSpringboard.bind(scene);
    scene.triggerSpringboard = (item: any) => {
      triggerCount++;
      originalTrigger(item);
    };

    scene.worldItems = [{ id: 'spring_1', type: 'springboard', worldX: 260, worldY: 540 }];
    scene.distanceRun = 0;

    // Frame 1
    scene.update(0, 16);
    expect(triggerCount).toBe(1);

    // Frame 2 & 3 within cooldown
    scene.update(16, 16);
    scene.update(32, 16);
    expect(triggerCount).toBe(1);
  });

  it('prevents player rising from below platform from teleporting to top', () => {
    scene.worldItems = [{ id: 'plat_1', type: 'platform', worldX: 260, worldY: 440 }];
    scene.playerY = 450; // Below platform top
    scene.playerVelocityY = 100;
    scene.distanceRun = 0;

    scene.update(16, 16);

    expect(scene.playerY).toBeGreaterThan(440);
    expect(scene.isGrounded).toBe(false);
  });
});
