# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mathParentReport.spec.js >> Mathematics Parent Report Module >> User can complete math session and view parent reports
- Location: tests/mathParentReport.spec.js:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Ready to Learn?')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Ready to Learn?')

```

```yaml
- text: ⭐ 45 💎 12 🎟️ 4 中 EN
- button "Settings":
  - img
- img
- heading "Ready to Learn" [level=1]
- button "Read Aloud":
  - img
- paragraph: Pick a Subject
- text: 🐱 🐶 🐰
- heading "Phonics Forest" [level=2]
- button "Start ►"
- text: 🍎 🍎 🍎
- heading "Math Kingdom" [level=2]
- button "Start ►"
```

# Test source

```ts
  2   | 
  3   | test.describe('Mathematics Parent Report Module', () => {
  4   |   test('User can complete math session and view parent reports', async ({ page }) => {
  5   |     page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  6   |     page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  7   |     
  8   |     await page.goto('/');
  9   | 
  10  |     // Debug: check for error boundary
  11  |     if (await page.isVisible('text=Oops! The rabbit tripped!')) {
  12  |       throw new Error('App crashed with ErrorBoundary');
  13  |     }
  14  |     
  15  |     // Select Math subject
  16  |     await page.click('text=Math Kingdom', { force: true });
  17  |     
  18  |     // Should be on Math Home
  19  |     await expect(page.getByText('Math Kingdom')).toBeVisible();
  20  |     await expect(page.getByRole('button', { name: /Daily Challenge/ })).toBeVisible();
  21  | 
  22  |     // Start Daily Challenge
  23  |     await page.click('text=Daily Challenge', { force: true });
  24  | 
  25  |     // Wait for the Math Daily Challenge ready overlay
  26  |     await expect(page.getByText('Ready for Maths?')).toBeVisible();
  27  |     await page.click('text=Let\'s Go!', { force: true });
  28  | 
  29  |     // Answer questions by tapping into the engine state to guarantee stable tests
  30  |     await page.evaluate(() => {
  31  |       const state = window.useGameStore.getState();
  32  |       const questions = state.math.mathActiveQuestions;
  33  |       
  34  |       if (questions.length > 0) {
  35  |         // Q1: Correct
  36  |         state.recordMathAnswer({
  37  |           skillId: questions[0].skillId,
  38  |           firstAttemptCorrect: true,
  39  |           eventuallyCompleted: true,
  40  |           attemptCount: 1,
  41  |           hintLevelUsed: 0,
  42  |           responseTimeMs: 1500,
  43  |           difficulty: questions[0].difficulty || 1
  44  |         });
  45  |       }
  46  |       
  47  |       if (questions.length > 1) {
  48  |         // Q2: Wrong first, then correct
  49  |         state.recordMathAnswer({
  50  |           skillId: questions[1].skillId,
  51  |           firstAttemptCorrect: false,
  52  |           eventuallyCompleted: true,
  53  |           attemptCount: 2,
  54  |           hintLevelUsed: 1,
  55  |           responseTimeMs: 2500,
  56  |           difficulty: questions[1].difficulty || 1
  57  |         });
  58  |         state.recordMathMisconception(questions[1].skillId, 'missed_items');
  59  |         
  60  |         // Also record analytics event for mistake history
  61  |         state.recordMathAttempt({
  62  |           question: questions[1],
  63  |           selectedAnswer: 'wrong-answer-for-test',
  64  |           isCorrect: false,
  65  |           attemptNumber: 1,
  66  |           hintLevel: 0,
  67  |           responseTimeMs: 2500,
  68  |           misconceptionTag: 'missed_items'
  69  |         });
  70  |       }
  71  | 
  72  |       for (let i = 2; i < questions.length; i++) {
  73  |         state.recordMathAnswer({
  74  |           skillId: questions[i].skillId,
  75  |           firstAttemptCorrect: true,
  76  |           eventuallyCompleted: true,
  77  |           attemptCount: 1,
  78  |           hintLevelUsed: 0,
  79  |           responseTimeMs: 1000,
  80  |           difficulty: questions[i].difficulty || 1
  81  |         });
  82  |       }
  83  |       
  84  |       state.completeMathDaily();
  85  |     });
  86  | 
  87  |     // We still have to navigate to reward to reflect completion
  88  |     await page.goto('/#/reward?subject=math');
  89  | 
  90  |     // Now we should be on reward screen
  91  |     await expect(page.getByText('Mission Complete!')).toBeVisible({ timeout: 15000 });
  92  |     await page.click('text=Tap to open!', { force: true });
  93  |     
  94  |     // Wait for Back to Home button
  95  |     await expect(page.getByText('Back to Home')).toBeVisible({ timeout: 10000 });
  96  |     await page.click('text=Back to Home');
  97  | 
  98  |     // Go directly to SubjectGateway
  99  |     await page.goto('/#/');
  100 |     
  101 |     // Wait for SubjectGateway to load
> 102 |     await expect(page.getByText('Ready to Learn?')).toBeVisible({ timeout: 5000 });
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  103 |     
  104 |     // Bypass the modal by setting auth state directly
  105 |     await page.evaluate(() => window.useGameStore.getState().setParentAuthenticated(true));
  106 |     
  107 |     // Navigate directly to parent
  108 |     await page.goto('/#/parent');
  109 |     
  110 |     await page.evaluate(() => {
  111 |       window.useGameStore.setState({ isParentAuthenticated: true });
  112 |     });
  113 |     
  114 |     await page.goto('/#/parent');
  115 | 
  116 |     // Inside Parent Dashboard
  117 |     await expect(page.getByText('Learning Hub')).toBeVisible();
  118 |     
  119 |     // Switch to Math tab
  120 |     await page.click('text=🔢 Maths');
  121 | 
  122 |     // Verify Overview (Weekly Report)
  123 |     await expect(page.getByText('Days Learned')).toBeVisible();
  124 |     await expect(page.getByText('First Attempt Accuracy')).toBeVisible();
  125 | 
  126 |     // Verify Skills
  127 |     await page.click('text=Skills Matrix');
  128 |     await expect(page.getByText('數數 1-20')).toBeVisible();
  129 | 
  130 |     // Verify Mistakes
  131 |     await page.click('text=Learning Moments');
  132 |     // We should see some learning moments since we intentionally got some wrong.
  133 |     await expect(page.locator('text=小朋友的答案').first()).toBeVisible();
  134 | 
  135 |     // Send encouragement
  136 |     await page.click('text=今日你好專心，做得好！');
  137 |     
  138 |     // Should show already sent message
  139 |     await expect(page.getByText('今日已經送出鼓勵了，明天再來吧！')).toBeVisible();
  140 | 
  141 |     // Back to root
  142 |     await page.goto('/');
  143 | 
  144 |     // Check if encouragement modal pops up
  145 |     await expect(page.getByText('你有一封新信件！💌')).toBeVisible();
  146 |     await page.click('text=領取獎勵 🎟️', { force: true });
  147 | 
  148 |     // Done!
  149 |   });
  150 | });
  151 | 
```