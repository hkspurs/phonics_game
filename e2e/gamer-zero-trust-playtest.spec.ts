import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Gamer Zero-Trust Playtest & Visual Inspection Suite', () => {
  const artifactDir = path.resolve(process.cwd(), 'playtest-artifacts/gamer-zero-trust');

  test.beforeAll(() => {
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  });

  test('comprehensive gamer playtest across all scenes with custom wardrobe & pet', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const mockProfile = {
        name: 'GamerAuditor',
        stars: 120,
        diamonds: 80,
        gems: 80,
        coins: 650,
        level: 8,
        equippedSkin: 'adventurer',
        ownedSkins: ['adventurer', 'heroine', 'soldier', 'knight', 'ninja'],
        ownedWardrobe: ['hk_school_shirt', 'sailor_top', 'pleated_skirt', 'star_backpack', 'cat_ears', 'princess_dress', 'dino_onesie'],
        equippedWardrobe: {
          top: 'hk_school_shirt',
          bottom: 'pleated_skirt',
          accessory: 'star_backpack',
          hat: '',
          wings: '',
          dress: '',
        },
        equippedPet: 'dino',
        ownedPets: ['dino', 'cat', 'owl', 'dragon'],
        unlockedStations: 3,
        stationStars: { 1: 3, 2: 2, 3: 1 },
        unlockedSublevels: { 'st_central': ['c1', 'm1', 'e1'] },
        stats: {
          chineseCorrect: 20,
          mathCorrect: 20,
          englishCorrect: 20,
        },
        volume: 0.8,
        bgmVolume: 0.5,
        sfxVolume: 0.8,
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(mockProfile));
    });

    await page.reload();
    await page.waitForTimeout(1800);

    // 1. Capture Title Scene
    await page.screenshot({ path: path.join(artifactDir, '01_title_scene.png') });

    // 2. Open Shop Scene (Dream Wardrobe)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('TitleScene');
        game.scene.start('ShopScene');
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '02_shop_scene_fitting_room.png') });

    // Switch to 🏃 奔跑 (Walk) pose in Shop
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.switchPose === 'function') {
          shop.switchPose('walk');
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '03_shop_walk_pose.png') });

    // Switch to 🎉 歡呼 (Cheer) pose in Shop
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.switchPose === 'function') {
          shop.switchPose('cheer');
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '04_shop_cheer_pose.png') });

    // 3. Open Map Scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('ShopScene');
        game.scene.start('MapScene');
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '05_map_scene_avatar.png') });

    // 4. Open Question Scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('MapScene');
        game.scene.start('QuestionScene', {
          stationId: 'st_central',
          sublevelId: 'c1',
          mode: 'choice',
        });
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '06_question_scene_hud.png') });

    // 5. Open Runner Scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('QuestionScene');
        game.scene.start('RunnerScene', {
          stationId: 'st_central',
          targetScore: 100,
        });
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '07_runner_scene_track_run.png') });

    // Trigger Jump
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const runner = game.scene.getScene('RunnerScene');
        if (runner && typeof runner.handleJumpInput === 'function') {
          runner.handleJumpInput();
        }
      }
    });
    await page.waitForTimeout(220);
    await page.screenshot({ path: path.join(artifactDir, '08_runner_scene_airborne_jump.png') });

    expect(fs.existsSync(path.join(artifactDir, '01_title_scene.png'))).toBe(true);
    expect(fs.existsSync(path.join(artifactDir, '02_shop_scene_fitting_room.png'))).toBe(true);
    expect(fs.existsSync(path.join(artifactDir, '07_runner_scene_track_run.png'))).toBe(true);
  });
});
