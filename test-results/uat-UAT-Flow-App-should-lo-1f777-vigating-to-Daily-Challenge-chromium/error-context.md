# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uat.spec.js >> UAT Flow: App should load, show mascot, and allow navigating to Daily Challenge
- Location: tests/uat.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Listen and Choose/i).or(getByText(/Final Challenge/i))
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Listen and Choose/i).or(getByText(/Final Challenge/i))

```

```yaml
- img
- heading "Ready?" [level=2]
- button "Let's Go!":
  - img
  - text: Let's Go!
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('UAT Flow: App should load, show mascot, and allow navigating to Daily Challenge', async ({ page }) => {
  4  |   // Go to the app
  5  |   await page.goto('/#/phonics');
  6  | 
  7  |   // Verify Home Dashboard loaded properly
  8  |   await expect(page.getByText(/Ready to Learn/i)).toBeVisible();
  9  |   
  10 |   // Verify the new SVG MascotRabbit is present
  11 |   await expect(page.locator('#mascot-rabbit')).toBeVisible();
  12 | 
  13 |   // Find the Start Mission button
  14 |   const startButton = page.getByRole('button', { name: /Start Today's Mission/i });
  15 |   await expect(startButton).toBeVisible();
  16 | 
  17 |   // Navigate to Daily Challenge (Force click because the button has an infinite CSS animation)
  18 |   await startButton.click({ force: true });
  19 | 
  20 |   // Verify Daily Challenge screen loaded
> 21 |   await expect(page.getByText(/Listen and Choose/i).or(page.getByText(/Final Challenge/i))).toBeVisible();
     |                                                                                             ^ Error: expect(locator).toBeVisible() failed
  22 |   
  23 |   // Verify ReplayHelper SVG cat is present
  24 |   await expect(page.locator('#helper-cat')).toBeVisible();
  25 | 
  26 |   // Expect URL to be /challenge
  27 |   await expect(page).toHaveURL(/.*challenge/);
  28 | 
  29 |   // Dismiss overlay if present
  30 |   const letsGoBtn = page.locator('button', { hasText: /Let's Go!/i });
  31 |   if (await letsGoBtn.isVisible()) {
  32 |     await letsGoBtn.click({ force: true });
  33 |     await page.waitForTimeout(500);
  34 |   }
  35 | 
  36 |   // Check that there are choice buttons available
  37 |   const choices = page.getByTestId('choice-button');
  38 |   expect(await choices.count()).toBeGreaterThan(0);
  39 | });
  40 | 
```