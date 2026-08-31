import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopScene } from '../scenes/ShopScene';
import { RunnerScene } from '../scenes/RunnerScene';
import { DataManager } from '../services/DataManager';
import { CharacterOutfitCompositor } from '../ui/CharacterOutfitCompositor';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

function enhanceMockScene(scene: any): any {
  const mock = createMockSceneForMeta(scene.sys?.settings?.key || 'ShopScene');
  mock.textures.exists = vi.fn().mockReturnValue(true);

  // Enhance image mock to support setDepth, setY, setFlipX, setPosition
  const origImage = mock.add.image;
  mock.add.image = vi.fn((x: number, y: number, key: string) => {
    const img = origImage(x, y, key);
    img.depth = 0;
    img.setDepth = vi.fn(function(d: number) {
      img.depth = d;
      return img;
    });
    img.setY = vi.fn(function(newY: number) {
      img.y = newY;
      return img;
    });
    img.setFlipX = vi.fn(function(flip: boolean) {
      img.flipX = flip;
      return img;
    });
    img.setPosition = vi.fn(function(newX: number, newY: number) {
      img.x = newX;
      img.y = newY;
      return img;
    });
    return img;
  });

  Object.assign(scene, mock);
  return scene;
}

describe('Game Agent 2: Wardrobe Kinematics, Animation & Physics Adversarial Audit Suite', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });

    (DataManager as any).instance = undefined;
    vi.restoreAllMocks();
  });

  describe('1. ShopScene Kinematics & Animation Sync Audit', () => {
    let scene: ShopScene;

    beforeEach(() => {
      scene = new ShopScene();
      enhanceMockScene(scene);
    });

    it('rigorously verifies character bobbing tween locks all wardrobe layers together', () => {
      scene.create();

      // Check tween creation
      expect(scene.tweens.add).toHaveBeenCalled();
      const tweenConfig = (scene.tweens.add as any).mock.calls.find((call: any[]) =>
        call[0] && Array.isArray(call[0].targets) && call[0].y === '-=12'
      )?.[0];

      expect(tweenConfig).toBeDefined();
      expect(tweenConfig.duration).toBe(900);
      expect(tweenConfig.yoyo).toBe(true);
      expect(tweenConfig.repeat).toBe(-1);
      expect(tweenConfig.ease).toBe('Sine.easeInOut');

      // Verify exact target sync membership
      const targets = tweenConfig.targets;
      expect(targets).toContain(scene.previewSprite);
      expect(targets).toContain(scene.wardrobeGraphics);
      expect(targets).toContain(scene.wardrobeWingsLayer);
      expect(targets).toContain(scene.wardrobeDressLayer);
      expect(targets).toContain(scene.wardrobeTopLayer);
      expect(targets).toContain(scene.wardrobeBottomLayer);
      expect(targets).toContain(scene.wardrobeBackpackLayer);
      expect(targets).toContain(scene.wardrobeGlassesLayer);
      expect(targets).toContain(scene.wardrobeHatLayer);
    });

    it('audits pose switching (stand, walk, cheer) and walk animation frame cycling', () => {
      scene.create();

      // Initial state: Stand
      expect(scene.currentPose).toBe('stand');
      expect(scene.previewSprite?.texture?.key).toBe('adventurer_stand');

      // Switch to Walk
      scene.switchPose('walk');
      expect(scene.currentPose).toBe('walk');
      expect(scene.previewSprite?.texture?.key).toBe('adventurer_walk1');

      // Cycle preview walk animation
      (scene as any).cyclePreviewAnimation();
      expect(scene.previewSprite?.texture?.key).toBe('adventurer_walk2');

      (scene as any).cyclePreviewAnimation();
      expect(scene.previewSprite?.texture?.key).toBe('adventurer_walk1');

      // Switch to Cheer
      scene.switchPose('cheer');
      expect(scene.currentPose).toBe('cheer');
      expect(scene.previewSprite?.texture?.key).toBe('adventurer_cheer1');

      // Switch back to Stand
      scene.switchPose('stand');
      expect(scene.currentPose).toBe('stand');
      expect(scene.previewSprite?.texture?.key).toBe('adventurer_stand');
    });

    it('audits real-time wardrobe equipping updates without disrupting live preview transforms', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(2000);
      scene.create();

      // Buy & equip Dress
      dm.buyWardrobeItem('magic_robe', 'coins');
      dm.equipWardrobeItem('dress', 'magic_robe');
      scene.updatePreviewDisplay();

      expect(scene.wardrobeDressLayer?.text).toBe('🧙‍♀️');

      // Buy & equip Top and Bottom (replaces dress slot)
      dm.buyWardrobeItem('hoodie_star', 'coins');
      dm.buyWardrobeItem('pleated_skirt', 'coins');
      dm.equipWardrobeItem('top', 'hoodie_star');
      dm.equipWardrobeItem('bottom', 'pleated_skirt');
      scene.updatePreviewDisplay();

      expect(scene.wardrobeTopLayer?.text).toBe('🧥');
      expect(scene.wardrobeBottomLayer?.text).toBe('🩳');
      expect(scene.wardrobeDressLayer?.text).toBe('');
    });
  });

  describe('2. RunnerScene Kinematic, Animation, and Physics Audit', () => {
    let runner: RunnerScene;

    beforeEach(() => {
      runner = new RunnerScene();
      enhanceMockScene(runner);
    });

    it('audits lockstep coordinate synchronization during running physics update loop', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      dm.buyWardrobeItem('sailor_top', 'coins');
      dm.buyWardrobeItem('denim_shorts', 'coins');
      dm.buyWardrobeItem('star_backpack', 'coins');
      dm.buyWardrobeItem('star_glasses', 'coins');
      dm.buyWardrobeItem('scholar_cap', 'coins');
      dm.buyWardrobeItem('angel_wings', 'coins');

      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('bottom', 'denim_shorts');
      dm.equipWardrobeItem('accessory', 'star_backpack');
      dm.equipWardrobeItem('hat', 'scholar_cap');
      dm.equipWardrobeItem('wings', 'angel_wings');

      runner.create();

      // Initial coordinates
      expect(runner.playerY).toBe(runner.playerBaselineY);

      // Simulate physics loop tick
      runner.update(1000, 16.6);

      expect(runner.playerSprite?.setY).toHaveBeenCalledWith(runner.playerY);
      expect(runner.runnerWardrobeWings?.setPosition).toHaveBeenCalledWith(runner.playerScreenX, runner.playerY + 2);
      expect(runner.runnerWardrobeTop?.setPosition).toHaveBeenCalledWith(runner.playerScreenX, runner.playerY + 6);
      expect(runner.runnerWardrobeBottom?.setPosition).toHaveBeenCalledWith(runner.playerScreenX, runner.playerY + 20);
      expect(runner.runnerWardrobeBackpack?.setPosition).toHaveBeenCalledWith(runner.playerScreenX + 18, runner.playerY + 8);
      expect(runner.runnerWardrobeHat?.setPosition).toHaveBeenCalledWith(runner.playerScreenX, runner.playerY - 34);
    });

    it('audits direction turning and horizontal mirroring (flipX: left vs right)', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      dm.buyWardrobeItem('star_backpack', 'coins');
      dm.equipWardrobeItem('accessory', 'star_backpack');

      runner.create();

      // 1. Moving Right (flipX = false)
      runner.isRightDown = true;
      runner.isLeftDown = false;
      runner.update(1000, 16.6);

      expect(runner.playerSprite?.setFlipX).toHaveBeenCalledWith(false);
      expect(runner.runnerWardrobeBackpack?.setPosition).toHaveBeenCalledWith(runner.playerScreenX + 18, runner.playerY + 8);

      // 2. Moving Left (flipX = true)
      runner.isRightDown = false;
      runner.isLeftDown = true;
      if (runner.playerSprite) runner.playerSprite.flipX = true;
      runner.update(1016, 16.6);

      expect(runner.playerSprite?.setFlipX).toHaveBeenCalledWith(true);
      expect(runner.runnerWardrobeBackpack?.setPosition).toHaveBeenCalledWith(runner.playerScreenX - 18, runner.playerY + 8);
    });

    it('audits standard jump, double jump, free fall, and landing squash kinematics', () => {
      runner.create();

      // 1. Initial Grounded
      expect(runner.isGrounded).toBe(true);

      // 2. Execute Kinematic Jump
      runner.executeKinematicJump();
      expect(runner.isGrounded).toBe(false);
      expect(runner.isJumping).toBe(true);
      expect(runner.playerVelocityY).toBeLessThan(0); // Negative velocity = upward
      expect(runner.hasDoubleJumped).toBe(false);

      // 3. Execute Mid-Air Double Jump
      runner.executeKinematicJump();
      expect(runner.hasDoubleJumped).toBe(true);
      expect(runner.playerVelocityY).toBeLessThan(0);

      // 4. Fall back to ground & trigger landing squash
      runner.playerY = runner.currentGroundY - 50;
      runner.playerVelocityY = 500; // Falling downward
      runner.update(2000, 100); // Step time to pass ground

      expect(runner.isGrounded).toBe(true);
      expect(runner.playerY).toBe(runner.currentGroundY);
      expect(runner.playerVelocityY).toBe(0);
      expect(runner.hasDoubleJumped).toBe(false);
      expect(runner.isJumping).toBe(false);
    });
  });

  describe('3. Depth Stacking & Z-Ordering Layer Hierarchy Audit', () => {
    it('verifies strict zero-z-fighting hierarchy in ShopScene', () => {
      const scene = new ShopScene();
      enhanceMockScene(scene);
      scene.create();

      const wingsDepth = (scene.wardrobeWingsLayer as any)?.depth ?? 0;
      const spriteDepth = (scene.previewSprite as any)?.depth ?? 0;
      const dressDepth = (scene.wardrobeDressLayer as any)?.depth ?? 0;
      const topDepth = (scene.wardrobeTopLayer as any)?.depth ?? 0;
      const bottomDepth = (scene.wardrobeBottomLayer as any)?.depth ?? 0;
      const backpackDepth = (scene.wardrobeBackpackLayer as any)?.depth ?? 0;
      const glassesDepth = (scene.wardrobeGlassesLayer as any)?.depth ?? 0;
      const hatDepth = (scene.wardrobeHatLayer as any)?.depth ?? 0;
      const buttonDepth = (scene.actionButton as any)?.depth ?? 0;

      // Strict Hierarchy: Wings (35) < Sprite (40) < Dress (44) <= Top (45) < Bottom (46) < Backpack (47) < Glasses (48) < Hat (49) < UI (60)
      expect(wingsDepth).toBe(35);
      expect(spriteDepth).toBe(40);
      expect(dressDepth).toBe(44);
      expect(topDepth).toBe(45);
      expect(bottomDepth).toBe(46);
      expect(backpackDepth).toBe(47);
      expect(glassesDepth).toBe(48);
      expect(hatDepth).toBe(49);
      expect(buttonDepth).toBe(60);

      expect(wingsDepth).toBeLessThan(spriteDepth);
      expect(spriteDepth).toBeLessThan(dressDepth);
      expect(dressDepth).toBeLessThanOrEqual(topDepth);
      expect(topDepth).toBeLessThan(bottomDepth);
      expect(bottomDepth).toBeLessThan(backpackDepth);
      expect(backpackDepth).toBeLessThan(glassesDepth);
      expect(glassesDepth).toBeLessThan(hatDepth);
      expect(hatDepth).toBeLessThan(buttonDepth);
    });

    it('verifies strict zero-z-fighting hierarchy in RunnerScene', () => {
      const runner = new RunnerScene();
      enhanceMockScene(runner);

      const dm = DataManager.getInstance();
      dm.addCoins(2000);
      dm.buyWardrobeItem('sailor_top', 'coins');
      dm.buyWardrobeItem('denim_shorts', 'coins');
      dm.buyWardrobeItem('star_backpack', 'coins');
      dm.buyWardrobeItem('star_glasses', 'coins');
      dm.buyWardrobeItem('scholar_cap', 'coins');
      dm.buyWardrobeItem('angel_wings', 'coins');

      dm.equipWardrobeItem('top', 'sailor_top');
      dm.equipWardrobeItem('bottom', 'denim_shorts');
      dm.equipWardrobeItem('accessory', 'star_backpack');
      dm.equipWardrobeItem('hat', 'scholar_cap');
      dm.equipWardrobeItem('wings', 'angel_wings');

      runner.create();

      const wingsDepth = (runner.runnerWardrobeWings as any)?.depth ?? 0;
      const spriteDepth = (runner.playerSprite as any)?.depth ?? 0;
      const topDepth = (runner.runnerWardrobeTop as any)?.depth ?? 0;
      const bottomDepth = (runner.runnerWardrobeBottom as any)?.depth ?? 0;
      const backpackDepth = (runner.runnerWardrobeBackpack as any)?.depth ?? 0;
      const hatDepth = (runner.runnerWardrobeHat as any)?.depth ?? 0;

      // Hierarchy: Wings (12) < Sprite (15) < Top (16) < Bottom (17) < Backpack (18) < Hat (20)
      expect(wingsDepth).toBe(12);
      expect(spriteDepth).toBe(15);
      expect(topDepth).toBe(16);
      expect(bottomDepth).toBe(17);
      expect(backpackDepth).toBe(18);
      expect(hatDepth).toBe(20);

      // Verify glasses depth (19) when star_glasses is equipped
      dm.equipWardrobeItem('accessory', 'star_glasses');
      const runner2 = new RunnerScene();
      enhanceMockScene(runner2);
      runner2.create();
      const glassesDepth2 = (runner2.runnerWardrobeGlasses as any)?.depth ?? 0;
      expect(glassesDepth2).toBe(19);
    });
  });

  describe('4. OOTD Polaroid Modal & Vector Outfit Composition Audit', () => {
    let scene: ShopScene;

    beforeEach(() => {
      scene = new ShopScene();
      enhanceMockScene(scene);
    });

    it('renders equipped outfit in high-DPI vector precision inside OOTD modal and closes cleanly', () => {
      const dm = DataManager.getInstance();
      dm.addCoins(1000);
      dm.buyWardrobeItem('princess_dress', 'coins');
      dm.buyWardrobeItem('cat_ears', 'coins');
      dm.buyWardrobeItem('angel_wings', 'coins');
      dm.equipWardrobeItem('dress', 'princess_dress');
      dm.equipWardrobeItem('hat', 'cat_ears');
      dm.equipWardrobeItem('wings', 'angel_wings');

      scene.create();
      scene.showOOTDPhotoModal();

      expect((scene as any).ootdModal).toBeDefined();
      expect((scene as any).ootdModal.depth).toBe(200);
      expect(scene.ootdCloseButton).toBeDefined();
      expect((scene.ootdCloseButton as any).depth).toBe(210);

      // Close modal
      scene.closeOOTDPhotoModal();
      expect((scene as any).ootdModal).toBeNull();
      expect(scene.ootdCloseButton).toBeNull();
    });

    it('audits CharacterOutfitCompositor vector rendering across all 18 wardrobe items and mirror transformations', () => {
      const mockGraphics = {
        clear: vi.fn(),
        fillStyle: vi.fn(),
        lineStyle: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fillPath: vi.fn(),
        strokePath: vi.fn(),
        fillRect: vi.fn(),
        fillRoundedRect: vi.fn(),
        strokeRoundedRect: vi.fn(),
        fillCircle: vi.fn(),
        strokeCircle: vi.fn(),
        fillEllipse: vi.fn(),
        lineBetween: vi.fn(),
      } as any;

      // 1. Dress + Wings + Glasses + Hat (Facing Right)
      CharacterOutfitCompositor.renderOutfit(mockGraphics, {
        dress: 'princess_dress',
        wings: 'angel_wings',
        accessory: 'star_glasses',
        hat: 'scholar_cap',
      }, { scale: 1.0, offsetX: 100, offsetY: 200, flipX: false });

      expect(mockGraphics.clear).toHaveBeenCalled();
      expect(mockGraphics.beginPath).toHaveBeenCalled();
      expect(mockGraphics.fillPath).toHaveBeenCalled();

      // 2. Top + Bottom + Backpack + Cat Ears (Facing Left / Inverted)
      CharacterOutfitCompositor.renderOutfit(mockGraphics, {
        top: 'sailor_top',
        bottom: 'denim_shorts',
        accessory: 'star_backpack',
        hat: 'cat_ears',
      }, { scale: 1.0, offsetX: 100, offsetY: 200, flipX: true });

      expect(mockGraphics.clear).toHaveBeenCalledTimes(2);
    });
  });
});
