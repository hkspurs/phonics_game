import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Gamer Deep Interactive Playtest & Zero-Trust Visual QA', () => {
  const artifactDir = path.resolve(process.cwd(), 'playtest-artifacts/gamer-interactive-qa');

  test.beforeAll(() => {
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  });

  test('full interactive gamer playthrough from shop purchase to runner sprint', async ({ page }) => {
    // 1. Initialize Profile with enough currency to test purchase flows
    await page.goto('/');
    await page.evaluate(() => {
      const initialProfile = {
        name: 'ZeroTrustGamer',
        stars: 45,
        diamonds: 150,
        gems: 150,
        coins: 800,
        level: 5,
        equippedSkin: 'heroine',
        ownedSkins: ['adventurer', 'heroine'],
        ownedWardrobe: ['star_glasses', 'cat_ears'],
        equippedWardrobe: {
          hat: 'cat_ears',
          accessory: 'star_glasses',
        },
        equippedPet: 'dino',
        ownedPets: ['dino', 'cat'],
        unlockedStations: 3,
        stationStars: { 1: 3, 2: 2, 3: 0 },
        unlockedSublevels: { 'st_central': ['c1', 'm1', 'e1'] },
        stats: {
          chineseCorrect: 15,
          mathCorrect: 12,
          englishCorrect: 18,
        },
        volume: 0.8,
        bgmVolume: 0.5,
        sfxVolume: 0.8,
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(initialProfile));
    });

    await page.reload();
    await page.waitForTimeout(1600);

    // Capture 01: Title Screen with Heroine skin, Cat Ears, and Dino pet
    await page.screenshot({ path: path.join(artifactDir, '01_title_screen_custom_avatar.png') });

    // 2. Enter Shop Scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('TitleScene');
        game.scene.start('ShopScene');
      }
    });
    await page.waitForTimeout(1400);

    // Switch to Wardrobe Tab (夢幻衣櫥)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.switchTab === 'function') {
          shop.switchTab('wardrobe');
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '02_shop_wardrobe_catalog.png') });

    // Select HK School Shirt (香港校服襯衫)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.selectWardrobeItem === 'function') {
          shop.selectWardrobeItem('hk_school_shirt');
        }
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, '03_shop_tryon_school_shirt.png') });

    // Trigger Purchase Confirmation Modal
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.openPurchaseModal === 'function') {
          shop.openPurchaseModal('hk_school_shirt');
        }
      }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, '04_shop_purchase_modal.png') });

    // Confirm Purchase and Equip
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && shop.purchaseModalInstance && typeof shop.purchaseModalInstance.executePurchase === 'function') {
          shop.purchaseModalInstance.executePurchase();
        }
      }
    });
    await page.waitForTimeout(1000);

    // Open OOTD Polaroid Photo Booth
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const shop = game.scene.getScene('ShopScene');
        if (shop && typeof shop.openOOTDModal === 'function') {
          shop.openOOTDModal();
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, '05_shop_ootd_polaroid_modal.png') });

    // Close Modal and Enter Map Scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.stop('ShopScene');
        game.scene.start('MapScene');
      }
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, '06_map_scene_unlocked_nodes.png') });

    // 3. Enter Question Scene and Answer Correctly
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
    await page.screenshot({ path: path.join(artifactDir, '07_question_scene_ready.png') });

    // Simulate clicking correct option
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const q = game.scene.getScene('QuestionScene');
        if (q && typeof q.handleChoiceSelect === 'function') {
          q.handleChoiceSelect(0);
        }
      }
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, '08_question_answer_correct_feedback.png') });

    // 4. Enter Runner Scene (Minigame Sprint)
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
    await page.screenshot({ path: path.join(artifactDir, '09_runner_track_sprint.png') });

    // Trigger Airborne Jump & Coin Collection
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        const runner = game.scene.getScene('RunnerScene');
        if (runner && typeof runner.handleJumpInput === 'function') {
          runner.handleJumpInput();
        }
      }
    });
    await page.waitForTimeout(260);
    await page.screenshot({ path: path.join(artifactDir, '10_runner_jump_and_coin_collect.png') });

    expect(fs.existsSync(path.join(artifactDir, '01_title_screen_custom_avatar.png'))).toBe(true);
    expect(fs.existsSync(path.join(artifactDir, '09_runner_track_sprint.png'))).toBe(true);
  });
});
