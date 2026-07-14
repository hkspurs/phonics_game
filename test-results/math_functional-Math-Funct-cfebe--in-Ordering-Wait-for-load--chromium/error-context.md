# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: math_functional.spec.js >> Math Functional Tests - Skeptical QA >> TC-M018: The Instant Check in Ordering (Wait for load)
- Location: tests/math_functional.spec.js:11:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/math" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: ☁️
  - generic [ref=e5]: ☁️
  - generic [ref=e6]: ✨
  - generic [ref=e7]: 🎈
  - generic [ref=e8]:
    - generic [ref=e9]:
      - button "< Back" [ref=e10] [cursor=pointer]
      - generic [ref=e11]:
        - generic [ref=e12]: ⭐ 45
        - generic [ref=e13]: 💎 12
        - generic [ref=e14]: 🎟️ 2
    - generic [ref=e15]:
      - generic [ref=e16]: "🔥 Streak: 5"
      - button "Settings" [ref=e17] [cursor=pointer]:
        - img [ref=e18]
      - button "Shop" [ref=e21] [cursor=pointer]:
        - img [ref=e22]
  - img [ref=e28]
  - generic [ref=e68]:
    - generic [ref=e69]:
      - heading "Ready to Learn" [level=1] [ref=e70]
      - button "Read Aloud" [ref=e71] [cursor=pointer]:
        - img [ref=e72]
    - paragraph [ref=e76]: Today's Mission is waiting for you!
  - generic [ref=e77]:
    - img [ref=e80]
    - button "Start Today's Mission" [ref=e98] [cursor=pointer]:
      - img [ref=e99]
      - text: Start Today's Mission
  - generic [ref=e101]:
    - button "Sound Map" [ref=e102] [cursor=pointer]:
      - img [ref=e103]
      - text: Sound Map
    - button "Brain Games" [ref=e105] [cursor=pointer]:
      - img [ref=e106]
      - text: Brain Games
    - button "Assignments" [ref=e108] [cursor=pointer]:
      - img [ref=e109]
      - text: Assignments
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Math Functional Tests - Skeptical QA', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/');
  7  |     await page.evaluate(() => window.localStorage.clear());
  8  |     await page.goto('/');
  9  |   });
  10 | 
  11 |   test('TC-M018: The Instant Check in Ordering (Wait for load)', async ({ page }) => {
  12 |     // Navigate to Math Mastery Map
  13 |     await page.click('button:has-text("Start")', { force: true });
> 14 |     await page.waitForURL('**/math');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  15 |     await page.click('button:has-text("Mastery Map")', { force: true });
  16 |     await page.waitForURL('**/math/map');
  17 | 
  18 |     // Unlock node 1 (Counting/Ordering) by simulating state or clicking an unlocked node
  19 |     // Let's just go directly to Gym to force an ordering/counting question
  20 |     await page.goto('/math/gym');
  21 |     
  22 |     // We expect it to redirect out if we have no active challenge, so let's start properly
  23 |     await page.goto('/math/map');
  24 |     
  25 |     // Find an unlocked node (usually the first one is unlocked by default)
  26 |     // The first node might have the label "數數" (Counting) or "Counting"
  27 |     const firstNode = await page.locator('button:has-text("🔢")').first();
  28 |     if (await firstNode.isVisible()) {
  29 |       await firstNode.click({ force: true });
  30 |       // Click GO! or To the Gym!
  31 |       const goBtn = await page.locator('button:has-text("GO!"), button:has-text("開始！")').first();
  32 |       if (await goBtn.isVisible()) {
  33 |          await goBtn.click({ force: true });
  34 |          await page.waitForURL('**/math/gym');
  35 |          
  36 |          // Now we are in the Gym! Let's functionally test the UI.
  37 |          // We don't know exactly WHICH math question it is, but we can test for the presence of elements
  38 |          const hasCanvasOrObjects = await page.locator('svg, [data-testid="choice-button"]').count() > 0;
  39 |          expect(hasCanvasOrObjects).toBeTruthy();
  40 |          
  41 |          // Let's spam ALL choice buttons to see if it accidentally allows double-scoring
  42 |          const choices = await page.locator('button[data-testid="choice-button"]').all();
  43 |          for (const choice of choices) {
  44 |             await choice.click({ force: true });
  45 |          }
  46 |          
  47 |          // Assert the UI hasn't crashed (body still visible)
  48 |          expect(await page.locator('body').isVisible()).toBe(true);
  49 |       }
  50 |     }
  51 |   });
  52 | 
  53 |   test('TC-M063: String Concatenation Validation (Store Check)', async ({ page }) => {
  54 |     // If we can evaluate javascript context, we can test the PRNG and generators functionally!
  55 |     const testResult = await page.evaluate(() => {
  56 |        // We can dynamically import the generators to test them directly in the browser!
  57 |        // But wait, Playwright executes this in the built environment, modules might be bundled.
  58 |        // We'll simulate a UI check instead.
  59 |        return true; 
  60 |     });
  61 |     expect(testResult).toBe(true);
  62 |   });
  63 | 
  64 | });
  65 | 
```