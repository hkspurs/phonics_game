import { test, expect } from '@playwright/test';

test.describe('Dream Wardrobe Hybrid Character Outfit & Shop UI Visual Audit', () => {
  test('renders Dream Wardrobe shop across Desktop, iPad, and iPhone viewports with clean preview', async ({ page }) => {
    // 1. Desktop 1920x1080
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?test=true');
    await page.waitForTimeout(2000);

    // Navigate to Shop
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game && game.scene) {
        game.scene.start('ShopScene');
      }
    });
    await page.waitForTimeout(1500);

    // Switch to 夢幻衣櫥 tab
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      if (shop && typeof shop.switchTab === 'function') {
        shop.switchTab('wardrobe');
      }
    });
    await page.waitForTimeout(1000);

    // Select Scholar Gown (升小一榮譽學士袍)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      if (shop && typeof shop.selectWardrobeItem === 'function') {
        shop.selectWardrobeItem(1); // scholar_robe
      }
    });
    await page.waitForTimeout(1000);

    // Take Desktop Screenshot
    await page.screenshot({ path: 'uat-report-screenshots/01_Dream_Wardrobe_Scholar_Gown_Desktop.png' });

    // Switch to Accessories & Select Star Backpack
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      if (shop && typeof shop.switchWardrobeCategory === 'function') {
        shop.switchWardrobeCategory('accessory');
      }
    });
    await page.waitForTimeout(1000);

    // Take Accessories Screenshot
    await page.screenshot({ path: 'uat-report-screenshots/02_Dream_Wardrobe_Accessories_Desktop.png' });

    // Test iPad Viewport (1024x768)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'uat-report-screenshots/03_Dream_Wardrobe_iPad_Landscape.png' });

    // Test iPhone Viewport (932x430)
    await page.setViewportSize({ width: 932, height: 430 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'uat-report-screenshots/04_Dream_Wardrobe_iPhone_Landscape.png' });
  });
});
