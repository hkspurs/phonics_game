const { chromium } = require('@playwright/test');
const fs = require('fs');

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  
  // Wait for entrance animations
  await page.waitForTimeout(2000);
  
  // Try to click "EN" to switch language
  try {
    const enBtn = page.getByText('EN', { exact: true });
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log("Could not find EN button", e);
  }

  await page.screenshot({ path: 'screenshots/1_gateway_en.png' });
  
  // Try to click Phonics
  const phonicsBtn = page.getByText(/Phonics/i);
  if (await phonicsBtn.isVisible()) {
    console.log("Phonics visible");
    // Click it
    await phonicsBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/2_phonics_route.png' });
  } else {
    console.log("Phonics text not found on gateway");
  }

  // Go back to gateway
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  try {
    const enBtn2 = page.getByText('EN', { exact: true });
    if (await enBtn2.isVisible()) {
      await enBtn2.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  // Try to click Math
  const mathBtn = page.getByText(/Maths?/i);
  if (await mathBtn.isVisible()) {
    console.log("Math visible");
    // Click it
    await mathBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/3_math_route.png' });
  } else {
    console.log("Math text not found on gateway");
  }

  // Check SVG viewboxes
  const svgs = await page.$$eval('svg', svgs => svgs.map(s => s.getAttribute('viewBox')));
  console.log("SVG viewboxes:", svgs);

  // Take a full page screenshot
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/4_full_page.png', fullPage: true });

  await browser.close();
})();
