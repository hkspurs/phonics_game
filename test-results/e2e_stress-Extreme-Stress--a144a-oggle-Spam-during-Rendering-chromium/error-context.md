# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e_stress.spec.js >> Extreme Stress Tests - Trust No State >> TC041: Language Toggle Spam during Rendering
- Location: tests/e2e_stress.spec.js:60:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("EN")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: ⭐ 45
      - generic [ref=e7]: 💎 12
      - generic [ref=e8]: 🎟️ 2
    - generic [ref=e9]:
      - generic [ref=e10] [cursor=pointer]:
        - generic [ref=e12]: 中
        - generic [ref=e13]: EN
      - button "Settings" [ref=e14] [cursor=pointer]:
        - img [ref=e15]
  - generic [ref=e18]:
    - img [ref=e21]
    - generic [ref=e61]:
      - heading "Ready to Learn" [level=1] [ref=e62]
      - button "Read Aloud" [ref=e63] [cursor=pointer]:
        - img [ref=e64]
    - paragraph [ref=e68]: Pick a Subject
  - generic [ref=e69]:
    - generic [ref=e70] [cursor=pointer]:
      - generic [ref=e71]: 🐱 🐶 🐰
      - heading "Phonics Forest" [level=2] [ref=e72]
      - button "Start ►" [ref=e73]
    - generic [ref=e74] [cursor=pointer]:
      - generic [ref=e75]: 🍎 🍎 🍎
      - heading "Math Kingdom" [level=2] [ref=e76]
      - button "Start ►" [ref=e77]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Extreme Stress Tests - Trust No State', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Clear localStorage to start fresh
  7  |     await page.goto('/');
  8  |     await page.evaluate(() => window.localStorage.clear());
  9  |     await page.goto('/');
  10 |   });
  11 | 
  12 |   test('TC001: The Lightning Double Tap (Race Condition Test)', async ({ page }) => {
  13 |     // 1. Go to Math Kingdom
  14 |     // Click the Math card start button (force click to bypass entrance animation)
  15 |     await page.click('button:has-text("Start")', { force: true });
  16 |     await page.waitForURL('**/math');
  17 | 
  18 |     // 2. Start Daily Challenge (or any button in the map/hub)
  19 |     await page.click('button.btn-primary', { force: true });
  20 |     await page.click('button:has-text("Let\'s Go!")', { force: true });
  21 | 
  22 |     // Wait for choices to load
  23 |     await page.waitForSelector('[data-testid="choice-button"], .btn-secondary');
  24 | 
  25 |     // 3. Find the correct answer. We might not know it, so we'll just rapid-click all choices!
  26 |     // Since we patched it with useRef, rapid clicking should NOT cause index skipping or crashes.
  27 |     const buttons = await page.$$('button:not(.btn-primary)'); // Find answer buttons
  28 |     
  29 |     if (buttons.length > 0) {
  30 |       // Rapid fire double-clicks on the first button
  31 |       await buttons[0].dblclick({ delay: 50 }); // 50ms double click
  32 |       await buttons[0].dblclick({ delay: 50 });
  33 |       
  34 |       // The system should survive and either show wrong or correct, but NOT crash.
  35 |       await page.waitForTimeout(2000); // Wait out the timeout
  36 |       
  37 |       // Ensure we are still in the app and it hasn't crashed to a blank screen
  38 |       const bodyText = await page.textContent('body');
  39 |       expect(bodyText.length).toBeGreaterThan(0);
  40 |     }
  41 |   });
  42 | 
  43 |   test('TC021: Cross-Subject State Leakage Test', async ({ page }) => {
  44 |     // 1. Start Phonics
  45 |     const phonicStartBtns = await page.$$('button:has-text("Start")');
  46 |     if (phonicStartBtns.length > 0) {
  47 |       await phonicStartBtns[0].click({ force: true });
  48 |     }
  49 |     await page.waitForTimeout(1000);
  50 |     await page.goto('/phonics/map');
  51 |     
  52 |     // We navigate directly via URL to simulate user weirdness
  53 |     await page.goto('/math/gym'); // Let's test the gym bypass since challenge might redirect differently
  54 |     
  55 |     // It should detect invalid state and redirect out, NOT crash
  56 |     await page.waitForURL('**/math/map'); // Gym redirects to map on failure
  57 |     expect(page.url()).toContain('/math');
  58 |   });
  59 |   
  60 |   test('TC041: Language Toggle Spam during Rendering', async ({ page }) => {
  61 |     await page.goto('/');
  62 |     // Spam the language toggle button (it might be EN / 中 or 中 / EN)
  63 |     for (let i = 0; i < 10; i++) {
  64 |       // Find the button that contains 'EN' and '中'
> 65 |       await page.click('button:has-text("EN")', { force: true });
     |                  ^ Error: page.click: Test timeout of 30000ms exceeded.
  66 |       await page.waitForTimeout(50);
  67 |     }
  68 |     
  69 |     // UI should still be perfectly functional
  70 |     const readyText = await page.locator('h1').innerText();
  71 |     expect(['Ready to Learn?', '準備好學習未？']).toContain(readyText);
  72 |   });
  73 | 
  74 | });
  75 | 
```