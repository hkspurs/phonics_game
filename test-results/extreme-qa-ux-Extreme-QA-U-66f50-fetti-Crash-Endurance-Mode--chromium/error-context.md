# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extreme-qa-ux.spec.js >> Extreme QA & UX Resilience Tests >> Test 9: Memory-Leak Confetti Crash (Endurance Mode)
- Location: tests/extreme-qa-ux.spec.js:99:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('choice-button').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('choice-button').first()

```

```yaml
- button:
  - img
- text: 1/10
- heading "Phonics Challenge" [level=2]
- button "Listen to question":
  - img
  - text: Listen to question
- img
- button:
  - img
- img
- textbox "Type here..."
- button "Submit / 確定" [disabled]
- button "A"
- button "B"
- button "C"
- button "D"
- button "E"
- button "F"
- button "G"
- button "H"
- button "I"
- button "J"
- button "K"
- button "L"
- button "M"
- button "N"
- button "O"
- button "P"
- button "Q"
- button "R"
- button "S"
- button "T"
- button "U"
- button "V"
- button "W"
- button "X"
- button "Y"
- button "Z"
- button:
  - img
```

# Test source

```ts
  14  |       await page.waitForTimeout(500);
  15  |     }
  16  | 
  17  |     const choiceButtons = page.getByTestId('choice-button');
  18  |     await expect(choiceButtons.nth(0)).toBeEnabled({ timeout: 5000 });
  19  | 
  20  |     // Toddler mash: rapid fire click the first button 50 times
  21  |     for(let i=0; i<50; i++) {
  22  |         choiceButtons.nth(0).click({ force: true }).catch(()=>{});
  23  |     }
  24  |     
  25  |     // Attempt to mash the back button simultaneously
  26  |     for(let i=0; i<10; i++) {
  27  |         page.locator('button').filter({ has: page.locator('svg') }).first().click({ force: true }).catch(()=>{});
  28  |     }
  29  | 
  30  |     await page.waitForTimeout(1000);
  31  |     
  32  |     // Assert the app hasn't crashed (either back to dashboard or showing feedback)
  33  |     const isDashboard = await page.locator('button', { hasText: /Start Today's Mission/i }).isVisible();
  34  |     const hasFeedback = await page.locator('#wrong-feedback-text').isVisible() || await page.locator('#correct-feedback-text').isVisible();
  35  |     
  36  |     expect(isDashboard || hasFeedback).toBeTruthy();
  37  |   });
  38  | 
  39  |   test('Test 4: Resource-Starved Audio-Visual Sync (CPU Throttling)', async ({ page, browserName }) => {
  40  |     // Only Chromium supports CDP for CPU throttling
  41  |     test.skip(browserName !== 'chromium', 'CDP only supported in Chromium');
  42  |     
  43  |     const client = await page.context().newCDPSession(page);
  44  |     // Throttle CPU to 4x slowdown
  45  |     await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  46  | 
  47  |     await page.goto('/#/phonics');
  48  |     await page.locator('button', { hasText: /Start Today's Mission/i }).click({ force: true });
  49  |     
  50  |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  51  |     if (await letsGoBtn.isVisible()) {
  52  |       await letsGoBtn.click({ force: true });
  53  |     }
  54  | 
  55  |     // Wait for challenge to load under heavy throttle
  56  |     const choiceButtons = page.getByTestId('choice-button');
  57  |     await expect(choiceButtons.nth(0)).toBeVisible({ timeout: 15000 });
  58  |     
  59  |     // Restore CPU
  60  |     await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  61  |   });
  62  | 
  63  |   test('Test 6: Safari Autoplay Silent Death (No interaction soft-lock check)', async ({ page }) => {
  64  |     // Start the mission normally to trigger the autoplay blocker
  65  |     await page.goto('/#/phonics');
  66  |     await page.locator('button', { hasText: /Start Today's Mission/i }).click({ force: true });
  67  |     
  68  |     // The "Let's Go" blocker SHOULD catch this to prevent autoplay silent death!
  69  |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  70  |     await expect(letsGoBtn).toBeVisible();
  71  |     
  72  |     // Verify the game hasn't soft-locked in the background
  73  |     await letsGoBtn.click({ force: true });
  74  |     const choices = page.getByTestId('choice-button');
  75  |     await expect(choices.nth(0)).toBeVisible({ timeout: 5000 });
  76  |   });
  77  | 
  78  |   test('Test 8: Eternal Modal Trap (Z-Index Validation)', async ({ page }) => {
  79  |     await page.goto('/#/phonics');
  80  |     await page.locator('button', { hasText: /Start Today's Mission/i }).click({ force: true });
  81  |     
  82  |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  83  |     if (await letsGoBtn.isVisible()) {
  84  |       await letsGoBtn.click({ force: true });
  85  |       await page.waitForTimeout(500);
  86  |     }
  87  |     
  88  |     // Click the X / Close button
  89  |     await page.locator('button.btn-secondary').first().click();
  90  |     
  91  |     // Check if the browser native confirm pops up (since we used window.confirm)
  92  |     // Playwright auto-dismisses window.confirm by default. We must intercept it.
  93  |     // Since Playwright auto-dismisses, the game should NOT be trapped in a transparent overlay.
  94  |     const choiceButtons = page.getByTestId('choice-button');
  95  |     await expect(choiceButtons.nth(0)).toBeVisible();
  96  |     await choiceButtons.nth(0).click({ force: true });
  97  |   });
  98  | 
  99  |   test('Test 9: Memory-Leak Confetti Crash (Endurance Mode)', async ({ page }) => {
  100 |     test.setTimeout(120000); // 2 minutes
  101 |     await page.goto('/#/phonics');
  102 |     
  103 |     // For 10 rapid rounds, we will inject a script to bypass the actual UI
  104 |     // just to test memory leaks of the Zustand store and react components.
  105 |     // Instead of clicking 50 times, we will just play 3 quick games by forcing correct answers.
  106 |     for(let round=0; round<3; round++) {
  107 |       await page.locator('button', { hasText: /Start Today's Mission/i }).click({ force: true });
  108 |       const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  109 |       if (await letsGoBtn.isVisible()) {
  110 |         await letsGoBtn.click({ force: true });
  111 |       }
  112 |       
  113 |       const choices = page.getByTestId('choice-button');
> 114 |       await expect(choices.nth(0)).toBeVisible();
      |                                    ^ Error: expect(locator).toBeVisible() failed
  115 |       
  116 |       // Force return to home
  117 |       await page.goto('/#/phonics');
  118 |       await expect(page.locator('button', { hasText: /Start Today's Mission/i })).toBeVisible();
  119 |     }
  120 |   });
  121 | });
  122 | 
```