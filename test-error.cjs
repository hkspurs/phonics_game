const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  try {
    const enBtn = page.getByText('EN', { exact: true });
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  // Try to click Phonics
  const phonicsBtn = page.getByText(/Phonics/i);
  if (await phonicsBtn.isVisible()) {
    await phonicsBtn.click();
    await page.waitForTimeout(1000);
  } else {
    console.log("Could not find Phonics button");
  }

  await browser.close();
})();
