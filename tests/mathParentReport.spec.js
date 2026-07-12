import { test, expect } from '@playwright/test';

test.describe('Mathematics Parent Report Module', () => {
  test('User can complete math session and view parent reports', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('/');

    // Debug: check for error boundary
    if (await page.isVisible('text=Oops! The rabbit tripped!')) {
      throw new Error('App crashed with ErrorBoundary');
    }
    
    // Select Math subject
    await page.click('text=Math Kingdom', { force: true });
    
    // Should be on Math Home
    await expect(page.getByText('Math Kingdom')).toBeVisible();
    await expect(page.getByRole('button', { name: /Daily Challenge/ })).toBeVisible();

    // Start Daily Challenge
    await page.click('text=Daily Challenge', { force: true });

    // Wait for the Math Daily Challenge ready overlay
    await expect(page.getByText('Ready for Maths?')).toBeVisible();
    await page.click('text=Let\'s Go!', { force: true });

    // Answer questions by tapping into the engine state to guarantee stable tests
    await page.evaluate(() => {
      const state = window.useGameStore.getState();
      const questions = state.math.mathActiveQuestions;
      
      if (questions.length > 0) {
        // Q1: Correct
        state.recordMathAnswer({
          skillId: questions[0].skillId,
          firstAttemptCorrect: true,
          eventuallyCompleted: true,
          attemptCount: 1,
          hintLevelUsed: 0,
          responseTimeMs: 1500,
          difficulty: questions[0].difficulty || 1
        });
      }
      
      if (questions.length > 1) {
        // Q2: Wrong first, then correct
        state.recordMathAnswer({
          skillId: questions[1].skillId,
          firstAttemptCorrect: false,
          eventuallyCompleted: true,
          attemptCount: 2,
          hintLevelUsed: 1,
          responseTimeMs: 2500,
          difficulty: questions[1].difficulty || 1
        });
        state.recordMathMisconception(questions[1].skillId, 'missed_items');
        
        // Also record analytics event for mistake history
        state.recordMathAttempt({
          question: questions[1],
          selectedAnswer: 'wrong-answer-for-test',
          isCorrect: false,
          attemptNumber: 1,
          hintLevel: 0,
          responseTimeMs: 2500,
          misconceptionTag: 'missed_items'
        });
      }

      for (let i = 2; i < questions.length; i++) {
        state.recordMathAnswer({
          skillId: questions[i].skillId,
          firstAttemptCorrect: true,
          eventuallyCompleted: true,
          attemptCount: 1,
          hintLevelUsed: 0,
          responseTimeMs: 1000,
          difficulty: questions[i].difficulty || 1
        });
      }
      
      state.completeMathDaily();
    });

    // We still have to navigate to reward to reflect completion
    await page.goto('/#/reward?subject=math');

    // Now we should be on reward screen
    await expect(page.getByText('Mission Complete!')).toBeVisible({ timeout: 15000 });
    await page.click('text=Tap to open!', { force: true });
    
    // Wait for Back to Home button
    await expect(page.getByText('Back to Home')).toBeVisible({ timeout: 10000 });
    await page.click('text=Back to Home');

    // Go directly to SubjectGateway
    await page.goto('/#/');
    
    // Wait for SubjectGateway to load
    await expect(page.getByText('Ready to Learn?')).toBeVisible({ timeout: 5000 });
    
    // Bypass the modal by setting auth state directly
    await page.evaluate(() => window.useGameStore.getState().setParentAuthenticated(true));
    
    // Navigate directly to parent
    await page.goto('/#/parent');
    
    await page.evaluate(() => {
      window.useGameStore.setState({ isParentAuthenticated: true });
    });
    
    await page.goto('/#/parent');

    // Inside Parent Dashboard
    await expect(page.getByText('Learning Hub')).toBeVisible();
    
    // Switch to Math tab
    await page.click('text=🔢 Maths');

    // Verify Overview (Weekly Report)
    await expect(page.getByText('Days Learned')).toBeVisible();
    await expect(page.getByText('First Attempt Accuracy')).toBeVisible();

    // Verify Skills
    await page.click('text=Skills Matrix');
    await expect(page.getByText('數數 1-20')).toBeVisible();

    // Verify Mistakes
    await page.click('text=Learning Moments');
    // We should see some learning moments since we intentionally got some wrong.
    await expect(page.locator('text=小朋友的答案').first()).toBeVisible();

    // Send encouragement
    await page.click('text=今日你好專心，做得好！');
    
    // Should show already sent message
    await expect(page.getByText('今日已經送出鼓勵了，明天再來吧！')).toBeVisible();

    // Back to root
    await page.goto('/');

    // Check if encouragement modal pops up
    await expect(page.getByText('你有一封新信件！💌')).toBeVisible();
    await page.click('text=領取獎勵 🎟️', { force: true });

    // Done!
  });
});
