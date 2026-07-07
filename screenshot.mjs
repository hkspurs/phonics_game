import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  console.log('Navigating to Map...');
  await page.goto('http://localhost:4173/#/map');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Wait for floating animations
  
  console.log('Taking full map screenshot...');
  await page.screenshot({ path: '/root/.gemini/antigravity-cli/brain/9f0c7502-5f73-4ce5-af18-f90171173475/mastery_map_full.png' });

  console.log('Clicking a node to open modal...');
  // Find a node that says 'EB'
  const loc = page.locator('text=EB').first();
  await loc.click();
  
  await page.waitForTimeout(500); // Wait for modal popIn
  
  console.log('Taking modal screenshot...');
  await page.screenshot({ path: '/root/.gemini/antigravity-cli/brain/9f0c7502-5f73-4ce5-af18-f90171173475/mastery_map_modal.png' });

  await browser.close();
  console.log('Done.');
})();
