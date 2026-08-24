import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Diagnose Live GitHub Pages site directly', async ({ page }) => {
  const consoleLogs: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Go to live GitHub Pages
  console.log('Navigating to live GitHub Pages...');
  await page.goto('https://hkspurs.github.io/phonics_game/?_t=' + Date.now());
  await page.waitForTimeout(3000);

  const scriptSrcs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => s.src);
  });
  console.log('Live Scripts:', scriptSrcs);

  // Navigate to MapScene
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (game) {
      const title = game.scene.getScene('TitleScene');
      if (title) title.scene.start('MapScene');
    }
  });

  await page.waitForTimeout(1500);

  // Open Station 1 Modal
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    if (map) {
      const s1 = map.stations[0];
      map.openStationModal(s1);
    }
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'uat-screenshots/live_modal.png' });

  // Inspect modal in live site
  const liveModalInfo = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    if (!map || !map.activeModal) return { error: 'No active modal' };
    const modal = map.activeModal;
    const content = modal.getContentContainer();
    return {
      modalVisible: modal.visible,
      contentChildrenCount: content ? content.list.length : 0,
      contentChildren: content ? content.list.map((c: any) => ({
        type: c.type,
        y: c.y,
        input: c.input !== null,
        text: c.text,
      })) : [],
    };
  });

  console.log('Live Modal Info:', JSON.stringify(liveModalInfo, null, 2));
  console.log('Console logs:', consoleLogs);
  console.log('Page errors:', pageErrors);
});
