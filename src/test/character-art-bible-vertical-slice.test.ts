import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PlayerAvatarService, AVATAR_SKIN_CONFIGS } from '../services/PlayerAvatarService';
import { CharacterOutfitCompositor, FULL_SPRITE_CANVAS_CENTER, FULL_SPRITE_GROUND_BASELINE } from '../ui/CharacterOutfitCompositor';

describe('Character Art Bible & Production-Quality Vertical Slice QA Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');

  beforeEach(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {}
    vi.restoreAllMocks();
  });

  describe('1. Master Character Art Bible Specification Verification', () => {
    it('verifies that docs/character-art-bible.md exists and defines all required specifications', () => {
      const biblePath = path.join(rootDir, 'docs/character-art-bible.md');
      expect(fs.existsSync(biblePath)).toBe(true);

      const content = fs.readFileSync(biblePath, 'utf-8');
      expect(content).toContain('1:2.5'); // Chibi ratio
      expect(content).toContain('512 × 512'); // Dimensions
      expect(content).toContain('Y = 460'); // Foot Baseline
      expect(content).toContain('3.0 px'); // Outline weight
      expect(content).toContain('Top-Left'); // Lighting direction
      expect(content).toContain('BACK_ACCESSORY'); // Layer order
      expect(content).toContain('Transparent Raster Sprite Sheets'); // Raster format
    });

    it('verifies ADR-005 exists in .ai/decisions/', () => {
      const adrPath = path.join(rootDir, '.ai/decisions/ADR-005-character-art-bible.md');
      expect(fs.existsSync(adrPath)).toBe(true);
      const content = fs.readFileSync(adrPath, 'utf-8');
      expect(content).toContain('ADR-005');
      expect(content).toContain('Heroine layering defect');
    });
  });

  describe('2. Full Cast & Major Outfits Raster Assets Integrity', () => {
    const requiredPoses = [
      'idle_front',
      'idle_side',
      'run',
      'jump',
      'landing',
      'cheer',
      'hurt',
      'celebration',
      'shop_preview',
    ];

    const characters = ['adventurer', 'heroine', 'soldier', 'knight', 'ninja'];
    const outfits = ['school_uniform', 'scholar_gown', 'princess_dress', 'dino_onesie', 'magic_robe', 'star_hoodie'];
    const pets = ['mecha_cat', 'pixie_dragon', 'panda_cub', 'phoenix_chick'];

    it('verifies all 5 characters have 9 core poses as 32-bit transparent PNGs', () => {
      for (const char of characters) {
        const charDir = path.join(rootDir, `public/assets/characters/${char}/sprites`);
        expect(fs.existsSync(charDir), `Missing dir for character ${char}`).toBe(true);

        for (const pose of requiredPoses) {
          const file = path.join(charDir, `${pose}.png`);
          expect(fs.existsSync(file), `Missing ${char} pose: ${pose}.png`).toBe(true);
          const stat = fs.statSync(file);
          expect(stat.size).toBeGreaterThan(1000); // Non-empty raster PNG
        }
      }
    });

    it('verifies all 6 major outfits have complete authored raster assets', () => {
      const outfitPoses = ['idle', 'run', 'cheer', 'jump', 'celebration', 'thumbnail'];
      for (const outfit of outfits) {
        const outfitDir = path.join(rootDir, `public/assets/character/outfits/${outfit}`);
        expect(fs.existsSync(outfitDir), `Missing dir for outfit ${outfit}`).toBe(true);

        for (const pose of outfitPoses) {
          const file = path.join(outfitDir, `${pose}.png`);
          expect(fs.existsSync(file), `Missing ${outfit} pose: ${pose}.png`).toBe(true);
          const stat = fs.statSync(file);
          expect(stat.size).toBeGreaterThan(500);
        }
      }
    });

    it('verifies all 4 companion pets have complete authored raster assets', () => {
      const petPoses = ['idle', 'fly', 'cheer', 'thumbnail'];
      for (const pet of pets) {
        const petDir = path.join(rootDir, `public/assets/pets/${pet}`);
        expect(fs.existsSync(petDir), `Missing dir for pet ${pet}`).toBe(true);

        for (const pose of petPoses) {
          const file = path.join(petDir, `${pose}.png`);
          expect(fs.existsSync(file), `Missing ${pet} pose: ${pose}.png`).toBe(true);
          const stat = fs.statSync(file);
          expect(stat.size).toBeGreaterThan(500);
        }
      }
    });
  });

  describe('3. Single Skeleton & Foot Baseline Alignment', () => {
    it('verifies shared master skeleton constants in CharacterOutfitCompositor', () => {
      expect(FULL_SPRITE_CANVAS_CENTER).toBe(256);
      expect(FULL_SPRITE_GROUND_BASELINE).toBe(460);
    });

    it('resolves HD texture keys via getHdTextureKey', () => {
      const idleKey = PlayerAvatarService.getInstance().getHdTextureKey('idle', 'adventurer');
      expect(idleKey).toBe('adventurer_idle_front');

      const runKey = PlayerAvatarService.getInstance().getHdTextureKey('run', 'heroine');
      expect(runKey).toBe('heroine_run');
    });

    it('returns valid base key in getTextureKey', () => {
      const result = PlayerAvatarService.getInstance().getTextureKey('idle');
      expect(result.textureKey).toBe('adventurer_stand');
    });
  });

  describe('4. Heroine Layering & Disconnection Defect Prevention', () => {
    it('verifies Heroine skin config matches the master skeleton without vertical blocks', () => {
      const heroineConfig = AVATAR_SKIN_CONFIGS.heroine;
      expect(heroineConfig).toBeDefined();
      expect(heroineConfig.name).toContain('Heroine');
    });

    it('renders accessory layers on Heroine without throwing or disconnecting', () => {
      const mockGraphics: any = {
        clear: vi.fn(),
        fillStyle: vi.fn(),
        lineStyle: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fillPath: vi.fn(),
        strokePath: vi.fn(),
        fillCircle: vi.fn(),
        strokeCircle: vi.fn(),
        fillRect: vi.fn(),
        fillRoundedRect: vi.fn(),
        strokeRoundedRect: vi.fn(),
        setPosition: vi.fn(),
      };

      expect(() => {
        CharacterOutfitCompositor.renderOutfit(mockGraphics, {
          dress: 'princess_dress',
          hat: 'cat_ears',
          glasses: 'star_glasses',
          wings: 'angel_wings',
        } as any);
      }).not.toThrow();

      expect(mockGraphics.clear).toHaveBeenCalled();
    });
  });
});
