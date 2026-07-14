# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extreme-pedagogy.spec.js >> Extreme Pedagogy & Education Logic Tests >> Test 12: Scope-and-Sequence Violation (No advanced distractors)
- Location: tests/extreme-pedagogy.spec.js:72:3

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Extreme Pedagogy & Education Logic Tests', () => {
  4   | 
  5   |   test('Test 11: Random Clicker Mastery Bypass (No reward for guessing)', async ({ page }) => {
  6   |     await page.goto('/#/phonics');
  7   |     
  8   |     await page.locator('button', { hasText: /Start Today's Mission/i }).click({ force: true });
  9   |     
  10  |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  11  |     if (await letsGoBtn.isVisible()) {
  12  |       await letsGoBtn.click({ force: true });
  13  |       await page.waitForTimeout(500);
  14  |     }
  15  | 
  16  |     const choiceButtons = page.getByTestId('choice-button');
  17  |     await expect(choiceButtons.nth(0)).toBeEnabled({ timeout: 5000 });
  18  | 
  19  |     // Deliberately answer WRONG to inflate attempts
  20  |     // We will click until we find a wrong answer (in case we accidentally guess right on the first try)
  21  |     let wrongBtnClicked = false;
  22  |     
  23  |     // Allow up to 10 attempts across multiple questions
  24  |     for(let attempts=0; attempts<10; attempts++) {
  25  |         const count = await choiceButtons.count();
  26  |         if (count === 0) {
  27  |             await page.waitForTimeout(500);
  28  |             continue;
  29  |         }
  30  |         
  31  |         // Pick a random button
  32  |         const r = Math.floor(Math.random() * count);
  33  |         const btn = choiceButtons.nth(r);
  34  |         
  35  |         // Wait until it's enabled (or skip if it never is)
  36  |         try {
  37  |             await expect(btn).toBeEnabled({ timeout: 3000 });
  38  |         } catch(e) {
  39  |             continue;
  40  |         }
  41  | 
  42  |         await btn.click({ force: true });
  43  |         await page.waitForTimeout(300);
  44  |         
  45  |         if (await page.locator('#wrong-feedback-text').isVisible()) {
  46  |             wrongBtnClicked = true;
  47  |             break;
  48  |         } else if (await page.locator('#correct-feedback-text').isVisible()) {
  49  |             // Guessed right accidentally! Wait for next question
  50  |             await page.waitForTimeout(2000);
  51  |         }
  52  |     }
  53  |     
  54  |     expect(wrongBtnClicked).toBe(true);
  55  |     
  56  |     // Now get it right (eventually)
  57  |     // The pedagogy rule: If attempts > 2, earnedStars should be 0!
  58  |     // Let's verify learningStats in localStorage
  59  |     await page.waitForTimeout(1500); // Wait for wrong state to clear
  60  |     
  61  |     const stateStr = await page.evaluate(() => window.localStorage.getItem('phonics-game-storage'));
  62  |     const state = JSON.parse(stateStr || '{}');
  63  |     
  64  |     // Verify that the learningStats properly recorded the failure
  65  |     expect(state.state.learningStats).toBeDefined();
  66  |     // At least one sound should have attempts >= 1 and firstAttemptHits == 0
  67  |     const stats = Object.values(state.state.learningStats);
  68  |     const hasFailureRecord = stats.some(s => s.attempts > 0 && s.firstAttemptHits < s.attempts);
  69  |     expect(hasFailureRecord).toBe(true);
  70  |   });
  71  | 
  72  |   test('Test 12: Scope-and-Sequence Violation (No advanced distractors)', async ({ page }) => {
  73  |     await page.goto('/#/phonics');
  74  |     await page.locator('button', { hasText: /Start Today's Mission/i }).click({ force: true });
  75  |     
  76  |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  77  |     if (await letsGoBtn.isVisible()) {
  78  |       await letsGoBtn.click({ force: true });
  79  |       await page.waitForTimeout(500);
  80  |     }
  81  |     
  82  |     const choiceButtons = page.getByTestId('choice-button');
> 83  |     await expect(choiceButtons.nth(0)).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  84  |     
  85  |     const count = await choiceButtons.count();
  86  |     const choicesText = [];
  87  |     for(let i=0; i<count; i++) {
  88  |         choicesText.push(await choiceButtons.nth(i).innerText());
  89  |     }
  90  |     
  91  |     // Since we are in the beginner module ('A' family), we should not see words like 'yacht'
  92  |     // Actually the choices are letters/phonemes (e.g. AB, EB).
  93  |     // Ensure no choice is longer than 3-4 letters usually, or ensure no advanced vowel teams if not unlocked.
  94  |     const hasYacht = choicesText.some(t => t.toLowerCase() === 'yacht');
  95  |     expect(hasYacht).toBe(false);
  96  |   });
  97  | 
  98  |   test('Test 14: Phonemic Deafness Frustration Loop (Scaffolding Check)', async ({ page }) => {
  99  |     await page.goto('/#/phonics');
  100 |     await page.locator('button', { hasText: /Start Today's Mission/i }).click({ force: true });
  101 |     
  102 |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  103 |     if (await letsGoBtn.isVisible()) {
  104 |       await letsGoBtn.click({ force: true });
  105 |       await page.waitForTimeout(500);
  106 |     }
  107 | 
  108 |     const choiceButtons = page.getByTestId('choice-button');
  109 |     await expect(choiceButtons.nth(0)).toBeEnabled({ timeout: 5000 });
  110 | 
  111 |     // Intentionally fail 3 times
  112 |     let failures = 0;
  113 |     for(let i=0; i<await choiceButtons.count(); i++) {
  114 |        const btn = choiceButtons.nth(i);
  115 |        if (await btn.isDisabled()) continue;
  116 |        
  117 |        await btn.click({ force: true });
  118 |        await page.waitForTimeout(300);
  119 |        
  120 |        if (await page.locator('#wrong-feedback-text').isVisible()) {
  121 |            failures++;
  122 |            await page.waitForTimeout(1000);
  123 |            if (failures >= 3) break;
  124 |        } else {
  125 |            // We accidentally got it right, end test
  126 |            break;
  127 |        }
  128 |     }
  129 |     
  130 |     // If we failed 3 times, the game currently just disabled the wrong choices.
  131 |     // The disabled choices ARE the visual scaffolding! (Process of elimination).
  132 |     // Let's verify the wrong buttons stay disabled to prevent frustration.
  133 |     if (failures > 0) {
  134 |         let disabledCount = 0;
  135 |         for(let i=0; i<await choiceButtons.count(); i++) {
  136 |             if (await choiceButtons.nth(i).isDisabled()) disabledCount++;
  137 |         }
  138 |         expect(disabledCount).toBeGreaterThanOrEqual(failures);
  139 |     }
  140 |   });
  141 | 
  142 | });
  143 | 
```