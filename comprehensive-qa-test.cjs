const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Record video to optionally see what happened if needed
    recordVideo: { dir: 'videos/' }
  });
  const page = await context.newPage();

  const qaDir = './qa_evidence';
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir);
  }

  let counter = 1;
  const takeScreenshot = async (name) => {
    await page.waitForTimeout(500); // give it a moment to render
    const padded = String(counter).padStart(2, '0');
    const filename = `${padded}_${name}.png`;
    await page.screenshot({ path: path.join(qaDir, filename), fullPage: true });
    console.log(`Captured ${filename}`);
    counter++;
  };

  const url = 'http://localhost:5173/#';

  try {
    // 1. Gateway
    console.log('Navigating to Gateway...');
    await page.goto(`${url}/`);
    await page.waitForTimeout(2000);
    await takeScreenshot('gateway_initial');

    // 2. Gateway Settings / Parent Gate
    console.log('Testing Settings / Parent Gate on Gateway...');
    // Look for settings icon
    const settingsBtn = page.locator('.lucide-settings, button:has(svg.lucide-settings), [aria-label="Settings"]');
    if (await settingsBtn.count() > 0) {
      await settingsBtn.first().click();
      await takeScreenshot('gateway_settings_parent_gate_modal');
      
      // Try to solve the parent gate if it's there
      // Usually it's something like "What is 7 x 8?" -> input -> submit
      // We will just take a screenshot and look at it, then close it.
      await page.keyboard.press('Escape'); // try to close
    }

    // Hover over Phonics button
    console.log('Hovering Phonics button...');
    const phonicsBtn = page.locator('a[href="#/phonics"], button:has-text("Phonics")');
    if (await phonicsBtn.count() > 0) {
      await phonicsBtn.first().hover();
      await takeScreenshot('gateway_phonics_hover');
      await phonicsBtn.first().click();
    } else {
      console.log('Phonics button not found, navigating directly');
      await page.goto(`${url}/phonics`);
    }

    // 3. Phonics Home
    console.log('On Phonics Home...');
    await page.waitForTimeout(1000);
    await takeScreenshot('phonics_home_initial');

    // Look for character/avatar buttons, navigation elements
    const playBtn = page.locator('a[href="#/map"], button:has-text("Play"), button:has-text("Start")');
    if (await playBtn.count() > 0) {
        await playBtn.first().hover();
        await takeScreenshot('phonics_home_play_hover');
        await playBtn.first().click();
    } else {
        await page.goto(`${url}/map`);
    }

    // 4. Phonics Map
    console.log('On Phonics Map...');
    await page.waitForTimeout(2000);
    await takeScreenshot('phonics_map_initial');

    // Click around the map to see paths and popups
    // Try to click first available node
    const mapNodes = page.locator('button.map-node, .map-node, [role="button"]'); // rough guess
    if (await mapNodes.count() > 0) {
        await mapNodes.first().hover();
        await takeScreenshot('phonics_map_node_hover');
        await mapNodes.first().click();
        await takeScreenshot('phonics_map_node_clicked');
        
        const startLevelBtn = page.locator('a[href*="/games/"], button:has-text("Start Level")');
        if (await startLevelBtn.count() > 0) {
            await startLevelBtn.first().click();
        } else {
            await page.goto(`${url}/games/soundcatcher`);
        }
    } else {
        await page.goto(`${url}/games/soundcatcher`);
    }

    // 5. Phonics Game (Sound Catcher)
    console.log('On Phonics Game...');
    await page.waitForTimeout(2000);
    await takeScreenshot('phonics_game_initial');

    const startGameBtn = page.locator('button:has-text("Start"), button:has-text("Play")');
    if (await startGameBtn.count() > 0) {
        await startGameBtn.first().click();
        await page.waitForTimeout(1500);
        await takeScreenshot('phonics_game_playing');
        
        // try to interact
        await page.mouse.click(640, 400); // click middle of screen
        await page.waitForTimeout(500);
        await takeScreenshot('phonics_game_interaction');
    }

    // Check game settings/pause menu
    const pauseBtn = page.locator('.lucide-pause, button:has-text("Pause")');
    if (await pauseBtn.count() > 0) {
        await pauseBtn.first().click();
        await takeScreenshot('phonics_game_paused');
        await page.keyboard.press('Escape');
    }

    // Navigate to Math Home
    console.log('Navigating to Math Home...');
    await page.goto(`${url}/math`);
    await page.waitForTimeout(2000);
    await takeScreenshot('math_home_initial');

    // Test any interactions on Math Home
    const mathPlayBtn = page.locator('a[href="#/math/map"], button:has-text("Play")');
    if (await mathPlayBtn.count() > 0) {
        await mathPlayBtn.first().hover();
        await takeScreenshot('math_home_play_hover');
        await mathPlayBtn.first().click();
    } else {
        await page.goto(`${url}/math/map`);
    }

    // Math Map
    console.log('On Math Map...');
    await page.waitForTimeout(2000);
    await takeScreenshot('math_map_initial');
    
    // Test clicking a level on math map
    if (await mapNodes.count() > 0) {
        await mapNodes.first().hover();
        await takeScreenshot('math_map_node_hover');
        await mapNodes.first().click();
        await takeScreenshot('math_map_node_clicked');
        
        const mathStartLevelBtn = page.locator('a[href*="/math/gym"], button:has-text("Start")');
        if (await mathStartLevelBtn.count() > 0) {
            await mathStartLevelBtn.first().click();
        } else {
            await page.goto(`${url}/math/gym`);
        }
    } else {
        await page.goto(`${url}/math/gym`);
    }

    // Math Gym
    console.log('On Math Gym...');
    await page.waitForTimeout(2000);
    await takeScreenshot('math_gym_initial');

    const mathStartGameBtn = page.locator('button:has-text("Start"), button:has-text("Play")');
    if (await mathStartGameBtn.count() > 0) {
        await mathStartGameBtn.first().click();
        await page.waitForTimeout(1500);
        await takeScreenshot('math_gym_playing');
        
        // try an input if it's there
        const mathInput = page.locator('input[type="number"], input[type="text"]');
        if (await mathInput.count() > 0) {
            await mathInput.first().fill('5');
            await takeScreenshot('math_gym_input');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
            await takeScreenshot('math_gym_after_submit');
        }
    }

    // Additional generic checks (Mobile view)
    console.log('Testing Mobile View...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${url}/`);
    await page.waitForTimeout(1000);
    await takeScreenshot('gateway_mobile');
    
    await page.goto(`${url}/phonics`);
    await page.waitForTimeout(1000);
    await takeScreenshot('phonics_home_mobile');

    await page.goto(`${url}/math`);
    await page.waitForTimeout(1000);
    await takeScreenshot('math_home_mobile');

  } catch (error) {
    console.error('Error during test execution:', error);
    await takeScreenshot('error_state');
  }

  await context.close();
  await browser.close();
  console.log('All done. Check ./qa_evidence');
})();
