# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-uat.spec.js >> Full UAT Test: Visuals, Audio, and Interactions >> Check Mascots, Sounds, and Button Reactions
- Location: tests/full-uat.spec.js:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Listen and Choose|Final Challenge/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Listen and Choose|Final Challenge/i)

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Full UAT Test: Visuals, Audio, and Interactions', () => {
  4   |   
  5   |   test('Check Mascots, Sounds, and Button Reactions', async ({ page }) => {
  6   |     // Array to track requested audio files
  7   |     const audioRequests = [];
  8   |     page.on('request', request => {
  9   |       const url = request.url();
  10  |       if (url.endsWith('.mp3') || url.includes('audio')) {
  11  |         audioRequests.push(url);
  12  |       }
  13  |     });
  14  | 
  15  |     // 1. App Load & Home Dashboard
  16  |     console.log('--- Step 1: Checking Home Dashboard & Mascot ---');
  17  |     await page.goto('/#/phonics');
  18  |     
  19  |     // Check "Mimi-chan" SVG is present
  20  |     const mascot = page.locator('#mascot-rabbit');
  21  |     await expect(mascot).toBeVisible();
  22  |     console.log('✅ Mascot Rabbit is visible.');
  23  | 
  24  |     // Click Start Mission
  25  |     const startBtn = page.locator('button', { hasText: /Start Today's Mission/i });
  26  |     await expect(startBtn).toBeVisible();
  27  |     await startBtn.click({ force: true }); // force click because of pulse animation
  28  |     
  29  |     // 2. Daily Challenge & Replay Helper
  30  |     console.log('--- Step 2: Checking Daily Challenge & Replay Helper ---');
  31  |     
  32  |     // Dismiss Safari Overlay if present
  33  |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  34  |     if (await letsGoBtn.isVisible()) {
  35  |       await letsGoBtn.click({ force: true });
  36  |       await page.waitForTimeout(500);
  37  |     }
  38  |     
> 39  |     await expect(page.getByText(/Listen and Choose|Final Challenge/i)).toBeVisible();
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  40  |     
  41  |     const replayHelper = page.locator('#helper-cat');
  42  |     await expect(replayHelper).toBeVisible();
  43  |     console.log('✅ Helper Cat SVG is visible.');
  44  | 
  45  |     // Wait a moment for auto-play audio request
  46  |     await page.waitForTimeout(500);
  47  |     expect(audioRequests.length).toBeGreaterThan(0);
  48  |     console.log(`✅ Initial audio played (Requests: ${audioRequests.length}).`);
  49  |     
  50  |     // Test Replay Button (clicking the cat or the main button)
  51  |     // Note: Audio is cached by AudioEngine so clicking replay won't trigger a new network request
  52  |     await replayHelper.click({ force: true });
  53  |     await page.waitForTimeout(500);
  54  |     console.log('✅ Replay button works and plays audio.');
  55  | 
  56  |     // 3. Testing Choice Buttons (Wrong and Correct Reactions)
  57  |     console.log('--- Step 3: Testing Choice Buttons & Feedback ---');
  58  |     // Find choice buttons using data-testid
  59  |     const choiceButtons = page.getByTestId('choice-button');
  60  |     const count = await choiceButtons.count();
  61  |     expect(count).toBeGreaterThan(0);
  62  |     
  63  |     let gotCorrect = false;
  64  |     let gotWrong = false;
  65  | 
  66  |     // Try clicking buttons until we get both correct and wrong, or we run out of buttons.
  67  |     // Usually there are 3 buttons.
  68  |     for (let i = 0; i < count; i++) {
  69  |       const btn = choiceButtons.nth(i);
  70  |       
  71  |       // If button is already disabled (from a previous wrong guess), skip it
  72  |       const isDisabled = await btn.isDisabled();
  73  |       if (isDisabled) continue;
  74  | 
  75  |       console.log(`Clicking choice button ${i}...`);
  76  |       await btn.click({ force: true });
  77  |       
  78  |       // Give DOM time to react (feedback animations trigger instantly)
  79  |       await page.waitForTimeout(300);
  80  |       
  81  |       const wrongFeedback = page.locator('#wrong-feedback-text');
  82  |       const correctFeedback = page.locator('#correct-feedback-text');
  83  |       
  84  |       const isWrongVisible = await wrongFeedback.isVisible();
  85  |       const isCorrectVisible = await correctFeedback.isVisible();
  86  | 
  87  |       if (isWrongVisible) {
  88  |         gotWrong = true;
  89  |         console.log('✅ Wrong Answer Animation (Soft Bubble) triggered correctly.');
  90  |         // Verify the button becomes disabled
  91  |         expect(await btn.isDisabled()).toBeTruthy();
  92  |         console.log('✅ Wrong button was successfully disabled.');
  93  |       } else if (isCorrectVisible) {
  94  |         gotCorrect = true;
  95  |         console.log('✅ Correct Answer Animation (Stars Bubble) triggered correctly.');
  96  |         // If it's correct, the game will automatically transition to the next question after the sound finishes.
  97  |         // We will break the loop here.
  98  |         break;
  99  |       }
  100 |     }
  101 | 
  102 |     if (!gotWrong && !gotCorrect) {
  103 |       throw new Error('No feedback animation was triggered. Buttons might not be reacting.');
  104 |     }
  105 |   });
  106 | });
  107 | 
```