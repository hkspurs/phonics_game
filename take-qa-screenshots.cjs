const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync('./qa_screenshots')) {
    fs.mkdirSync('./qa_screenshots');
  }

  const takeScreenshot = async (url, name) => {
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ path: `./qa_screenshots/${name}` });
    console.log(`Captured ${name}`);
  };

  // 1. Gateway
  await takeScreenshot('http://localhost:5173/#/', '01_gateway.png');

  // Test Parent Gate modal
  console.log('Testing Parent Gate...');
  try {
    await page.locator('svg.lucide-settings').click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './qa_screenshots/02_parent_gate_modal.png' });
    console.log('Captured 02_parent_gate_modal.png');
    
    // Fill in the math question if we can find the input, or just cancel
    // We'll just take a screenshot and cancel for now
    await page.locator('button:has-text("Cancel")').click({ timeout: 2000 }).catch(() => {});
  } catch (e) {
    console.log('Could not test Parent Gate.', e.message);
  }

  // 2. Phonics Home
  await takeScreenshot('http://localhost:5173/#/phonics', '03_phonics_home.png');

  // 3. Phonics Map
  await takeScreenshot('http://localhost:5173/#/map', '04_phonics_map.png');

  // 4. Phonics Game (Sound Catcher)
  await takeScreenshot('http://localhost:5173/#/games/soundcatcher', '05_phonics_game_start.png');
  await page.waitForTimeout(1000);
  try {
    await page.locator('button:has-text("Start")').click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './qa_screenshots/06_phonics_game_play.png' });
  } catch (e) {
    console.log('Could not start Phonics Game.', e.message);
  }

  // 5. Math Home
  await takeScreenshot('http://localhost:5173/#/math', '07_math_home.png');

  // 6. Math Map
  await takeScreenshot('http://localhost:5173/#/math/map', '08_math_map.png');

  // 7. Math Gym (Game)
  await takeScreenshot('http://localhost:5173/#/math/gym', '09_math_gym.png');

  await browser.close();
  console.log('Screenshots captured in ./qa_screenshots');
})();
