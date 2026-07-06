const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/phonics_game/');
  await page.waitForTimeout(2000); // wait for load and animations
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
