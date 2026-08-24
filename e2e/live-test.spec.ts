import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Full Live UAT on https://hkspurs.github.io/phonics_game/', async ({ page }) => {
  const uatDir = path.join(process.cwd(), 'live-uat-screenshots');
  if (!fs.existsSync(uatDir)) fs.mkdirSync(uatDir, { recursive: true });

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
  expect(scriptSrcs.some(s => s.includes('index-DN3PcqRB.js'))).toBe(true);

  // Take live TitleScene screenshot
  await page.screenshot({ path: path.join(uatDir, '01_Live_TitleScene.png') });

  // 1. Click "開始遊戲"
  const canvas = page.locator('#game-container canvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;

  await page.mouse.click(box.x + 640, box.y + 360);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(uatDir, '02_Live_MapScene.png') });

  // 2. Click Station 1 node on the roadmap
  console.log('Clicking Station 1 node on live MapScene...');
  await page.mouse.click(box.x + 640, box.y + 450);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(uatDir, '03_Live_Station1_Modal.png') });

  // Verify modal is open on live site
  const isModalOpen = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const map = game.scene.getScene('MapScene');
    return map && map.activeModal && map.activeModal.visible;
  });
  expect(isModalOpen).toBe(true);

  // 3. Test Clicking Sub-level 1 [中]
  console.log('Clicking Sub-level 1 [中] on live site...');
  await page.mouse.click(box.x + 640, box.y + 295);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(uatDir, '04_Live_QuestionScene_Chinese.png') });

  let activeScene = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
  });
  console.log('Active scene after clicking [中]:', activeScene);
  expect(activeScene).toContain('QuestionScene');

  // Return to MapScene
  await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    const q = game.scene.getScene('QuestionScene');
    if (q) q.scene.start('MapScene');
  });
  await page.waitForTimeout(1200);

  // 4. Click Station 1 node again and test Enter Button (⚔️ 進入關卡 (進入))
  await page.mouse.click(box.x + 640, box.y + 450);
  await page.waitForTimeout(800);

  console.log('Clicking Enter button (⚔️ 進入關卡 (進入)) on live site...');
  await page.mouse.click(box.x + 640, box.y + 565);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(uatDir, '05_Live_QuestionScene_EnterBtn.png') });

  activeScene = await page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    return game.scene.scenes.filter((s: any) => s.scene.isActive()).map((s: any) => s.scene.key);
  });
  console.log('Active scene after clicking Enter button:', activeScene);
  expect(activeScene).toContain('QuestionScene');

  expect(pageErrors).toEqual([]);
});
