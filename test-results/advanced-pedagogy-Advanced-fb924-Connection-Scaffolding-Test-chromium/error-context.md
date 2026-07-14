# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: advanced-pedagogy.spec.js >> Advanced Pedagogy, Persistence & Edge Cases >> Priority 3: The "Flaky Connection" Scaffolding Test
- Location: tests/advanced-pedagogy.spec.js:108:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - button [ref=e5] [cursor=pointer]:
      - img [ref=e6]
    - generic [ref=e11]: 1/10
  - generic [ref=e12]:
    - heading "Phonics Challenge" [level=2] [ref=e13]
    - button "Listen to question" [ref=e14] [cursor=pointer]:
      - img [ref=e15]
      - text: Listen to question
  - generic [ref=e19]:
    - generic [ref=e20]:
      - img [ref=e23]
      - generic [ref=e63]:
        - button [ref=e64] [cursor=pointer]:
          - img [ref=e65]
        - img [ref=e71] [cursor=pointer]
    - generic [ref=e90]:
      - generic [ref=e91]:
        - textbox "Type here..." [ref=e92]
        - button "Submit / 確定" [disabled] [ref=e93]
      - generic [ref=e96]:
        - button "A" [ref=e97] [cursor=pointer]
        - button "B" [ref=e98] [cursor=pointer]
        - button "C" [ref=e99] [cursor=pointer]
        - button "D" [ref=e100] [cursor=pointer]
        - button "E" [ref=e101] [cursor=pointer]
        - button "F" [ref=e102] [cursor=pointer]
        - button "G" [ref=e103] [cursor=pointer]
        - button "H" [ref=e104] [cursor=pointer]
        - button "I" [ref=e105] [cursor=pointer]
        - button "J" [ref=e106] [cursor=pointer]
        - button "K" [ref=e107] [cursor=pointer]
        - button "L" [ref=e108] [cursor=pointer]
        - button "M" [ref=e109] [cursor=pointer]
        - button "N" [ref=e110] [cursor=pointer]
        - button "O" [ref=e111] [cursor=pointer]
        - button "P" [ref=e112] [cursor=pointer]
        - button "Q" [ref=e113] [cursor=pointer]
        - button "R" [ref=e114] [cursor=pointer]
        - button "S" [ref=e115] [cursor=pointer]
        - button "T" [ref=e116] [cursor=pointer]
        - button "U" [ref=e117] [cursor=pointer]
        - button "V" [ref=e118] [cursor=pointer]
        - button "W" [ref=e119] [cursor=pointer]
        - button "X" [ref=e120] [cursor=pointer]
        - button "Y" [ref=e121] [cursor=pointer]
        - button "Z" [ref=e122] [cursor=pointer]
        - button [ref=e123] [cursor=pointer]:
          - img [ref=e124]
```

# Test source

```ts
  29  |     // Try to get at least one answer to trigger state change
  30  |     for (let i = 0; i < count; i++) {
  31  |       const btn = choiceButtons.nth(i);
  32  |       await expect(btn).toBeEnabled({ timeout: 5000 }).catch(() => {});
  33  |       if (await btn.isDisabled()) continue;
  34  | 
  35  |       await btn.click({ force: true });
  36  |       await page.waitForTimeout(300);
  37  | 
  38  |       const wrongFeedback = page.locator('#wrong-feedback-text');
  39  |       const correctFeedback = page.locator('#correct-feedback-text');
  40  | 
  41  |       if (await wrongFeedback.isVisible()) {
  42  |         await page.waitForTimeout(1000);
  43  |       } else if (await correctFeedback.isVisible()) {
  44  |         await page.waitForTimeout(1500);
  45  |         break; // Got one right!
  46  |       }
  47  |     }
  48  | 
  49  |     // SIMULATE CRASH / RELOAD
  50  |     await page.reload();
  51  |     await page.waitForTimeout(1000);
  52  | 
  53  |     // Verify user is back to dashboard without infinite loading or broken state
  54  |     // Now it drops back to SubjectGateway because DailyChallenge.jsx does navigate('/')
  55  |     await expect(page.getByText('Phonics Forest')).toBeVisible();
  56  |     await page.getByText('Phonics Forest').click();
  57  |     await expect(page.locator('button', { hasText: /Start Today's Mission/i })).toBeVisible();
  58  | 
  59  |     // Verify localStorage survived the reload
  60  |     stateStr = await page.evaluate(() => window.localStorage.getItem('phonics-game-storage'));
  61  |     state = JSON.parse(stateStr || '{}');
  62  |     
  63  |     expect(state.state).toBeDefined();
  64  |     expect(state.state.stars).toBeGreaterThanOrEqual(initialStars); // Stars shouldn't decrease
  65  |     expect(typeof state.state.learningStats).toBe('object'); // Learning stats should persist
  66  |   });
  67  | 
  68  | 
  69  |   test('Priority 2: The "Midnight Survivor" (Time-Bound Logic Interruption)', async ({ page }) => {
  70  |     // Start session at 11:59:50 PM
  71  |     await page.clock.install({ time: new Date('2026-07-06T23:59:50') });
  72  |     await page.goto('/#/phonics');
  73  |     
  74  |     // Start game
  75  |     const startBtn = page.locator('button', { hasText: /Start Today's Mission/i });
  76  |     await startBtn.click({ force: true });
  77  |     
  78  |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  79  |     if (await letsGoBtn.isVisible()) {
  80  |       await letsGoBtn.click({ force: true });
  81  |     }
  82  | 
  83  |     // Mid-game, advance the clock to cross midnight (e.g. 15 seconds)
  84  |     if (page.clock.fastForward) {
  85  |       await page.clock.fastForward(15000);
  86  |     } else {
  87  |       await page.evaluate(() => {
  88  |         const OriginalDate = window.Date;
  89  |         class MockDate extends OriginalDate {
  90  |           constructor(...args) {
  91  |             if (args.length === 0) return new OriginalDate(new OriginalDate().getTime() + 15000);
  92  |             super(...args);
  93  |           }
  94  |         }
  95  |         window.Date = MockDate;
  96  |       });
  97  |     }
  98  |     
  99  |     // The user should NOT be kicked out of their session or interrupted
  100 |     await expect(page).toHaveURL(/.*challenge/);
  101 |     
  102 |     // UI should remain fully functional and interactive
  103 |     const choiceButtons = page.getByTestId('choice-button');
  104 |     expect(await choiceButtons.count()).toBeGreaterThan(0);
  105 |   });
  106 | 
  107 | 
  108 |   test('Priority 3: The "Flaky Connection" Scaffolding Test', async ({ page }) => {
  109 |     // Intercept and ABORT all audio asset requests to simulate network dropping
  110 |     // right when scaffolding/hint media is requested
  111 |     await page.route('**/*.mp3', route => {
  112 |       route.abort('failed');
  113 |     });
  114 | 
  115 |     await page.goto('/#/phonics');
  116 |     
  117 |     // Start the game
  118 |     const startBtn = page.locator('button', { hasText: /Start Today's Mission/i });
  119 |     await startBtn.click({ force: true });
  120 |     
  121 |     const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  122 |     if (await letsGoBtn.isVisible()) {
  123 |       await letsGoBtn.click({ force: true });
  124 |       await page.waitForTimeout(500);
  125 |     }
  126 | 
  127 |     // Even though network failed, the UI should not be stuck
  128 |     const choiceButtons = page.getByTestId('choice-button');
> 129 |     expect(await choiceButtons.count()).toBeGreaterThan(0);
      |                                         ^ Error: expect(received).toBeGreaterThan(expected)
  130 | 
  131 |     // Pick the first choice. Since audio failed, the system must use .catch() and .finally()
  132 |     // gracefully without breaking the React component loop.
  133 |     const btn = choiceButtons.nth(0);
  134 |     await expect(btn).toBeEnabled({ timeout: 5000 });
  135 |     await btn.click({ force: true });
  136 |     await page.waitForTimeout(300);
  137 | 
  138 |     // Verify that the visual fallback (mascot speech bubble) STILL APPEARS
  139 |     // even though the audio engine failed!
  140 |     const wrongFeedback = page.locator('#wrong-feedback-text');
  141 |     const correctFeedback = page.locator('#correct-feedback-text');
  142 | 
  143 |     const reacted = (await wrongFeedback.isVisible()) || (await correctFeedback.isVisible());
  144 |     
  145 |     // If it didn't react, it means the app crashed due to the unhandled network error
  146 |     expect(reacted).toBe(true);
  147 |   });
  148 | });
  149 | 
```