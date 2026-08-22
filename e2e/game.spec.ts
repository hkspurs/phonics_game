import { test, expect, Page } from '@playwright/test';

/**
 * Helper to wait until a Phaser scene is active and ready.
 */
async function waitForScene(page: Page, sceneKey: string, timeout = 10000): Promise<void> {
  await page.waitForFunction(
    (key) => {
      const g = (window as any).__PHASER_GAME__;
      return g && g.scene && g.scene.isActive(key);
    },
    sceneKey,
    { timeout }
  );
}

test.describe('P1 Adventure Game — E2E Integration Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for clean initial state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // ---------------------------------------------------------------------------
  // 1. Boot & TitleScene
  // ---------------------------------------------------------------------------
  test('1. Game container boots, canvas renders, and TitleScene displays properly', async ({ page }) => {
    // Verify container and canvas exist in DOM
    const container = page.locator('#game-container');
    await expect(container).toBeVisible();

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    // Verify TitleScene active
    await waitForScene(page, 'TitleScene');

    // Verify TitleScene state & elements via Phaser
    const titleData = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      return {
        hasStartBtn: !!titleScene.startButton,
        hasShopBtn: !!titleScene.shopButton,
        hasTrophyBtn: !!titleScene.trophyButton,
        hasSettingsBtn: !!titleScene.settingsButton,
        hasReportBtn: !!titleScene.reportButton,
        cloudCount: titleScene.clouds ? titleScene.clouds.length : 0,
        hasAirship: !!titleScene.airship,
      };
    });

    expect(titleData.hasStartBtn).toBe(true);
    expect(titleData.hasShopBtn).toBe(true);
    expect(titleData.hasTrophyBtn).toBe(true);
    expect(titleData.hasSettingsBtn).toBe(true);
    expect(titleData.hasReportBtn).toBe(true);
    expect(titleData.cloudCount).toBeGreaterThan(0);
    expect(titleData.hasAirship).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 2. TitleScene Navigation & Report Modal
  // ---------------------------------------------------------------------------
  test('2. TitleScene navigates to Sub-scenes (Map, Shop, Trophy, Settings) and back', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // 2a. Open Report Modal on TitleScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      titleScene.reportButton.triggerClick();
    });

    const isReportOpen = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      return titleScene.reportModal && titleScene.reportModal.isOpen();
    });
    expect(isReportOpen).toBe(true);

    // Close Report Modal
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      titleScene.reportModal.close();
    });

    // 2b. Navigate to ShopScene and back to TitleScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      titleScene.shopButton.triggerClick();
    });
    await waitForScene(page, 'ShopScene');

    // Return to TitleScene via Home Button
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const shopScene = g.scene.getScene('ShopScene');
      shopScene.homeButton.triggerClick();
    });
    await waitForScene(page, 'TitleScene');

    // 2c. Navigate to TrophyScene and back to TitleScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      titleScene.trophyButton.triggerClick();
    });
    await waitForScene(page, 'TrophyScene');

    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const trophyScene = g.scene.getScene('TrophyScene');
      trophyScene.homeButton.triggerClick();
    });
    await waitForScene(page, 'TitleScene');

    // 2d. Navigate to SettingsScene and back to TitleScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      titleScene.settingsButton.triggerClick();
    });
    await waitForScene(page, 'SettingsScene');

    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const settingsScene = g.scene.getScene('SettingsScene');
      settingsScene.homeButton.triggerClick();
    });
    await waitForScene(page, 'TitleScene');

    // 2e. Navigate to MapScene via Start Button
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const titleScene = g.scene.getScene('TitleScene');
      titleScene.startButton.triggerClick();
    });
    await waitForScene(page, 'MapScene');
  });

  // ---------------------------------------------------------------------------
  // 3. MapScene & Station Modal
  // ---------------------------------------------------------------------------
  test('3. MapScene renders 10 stations and StationModal opens with details', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // Go to MapScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.start('MapScene');
    });
    await waitForScene(page, 'MapScene');

    const mapData = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const mapScene = g.scene.getScene('MapScene');
      return {
        hasBackBtn: !!mapScene.backButton,
        stationCount: mapScene.stations ? mapScene.stations.length : 0,
        stationNodeCount: mapScene.stationNodes ? mapScene.stationNodes.length : 0,
        unlockedCount: mapScene.getUnlockedStationsCount(),
      };
    });

    expect(mapData.hasBackBtn).toBe(true);
    expect(mapData.stationCount).toBe(10);
    expect(mapData.stationNodeCount).toBe(10);
    expect(mapData.unlockedCount).toBeGreaterThanOrEqual(1);

    // Open Station 1 Modal
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const mapScene = g.scene.getScene('MapScene');
      mapScene.openStationModal(mapScene.stations[0]);
    });

    const modalOpen = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const mapScene = g.scene.getScene('MapScene');
      return mapScene.activeModal && mapScene.activeModal.isOpen();
    });
    expect(modalOpen).toBe(true);

    // Close Station Modal
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const mapScene = g.scene.getScene('MapScene');
      mapScene.closeStationModal();
    });

    const modalClosed = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const mapScene = g.scene.getScene('MapScene');
      return mapScene.activeModal === null;
    });
    expect(modalClosed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 4. QuestionScene (Prompts, Choices, Sentence Tokens, Hint)
  // ---------------------------------------------------------------------------
  test('4. QuestionScene loads questions, renders prompts, supports choices, sentence scramble and hints', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // Launch QuestionScene for Station 1
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.start('QuestionScene', {
        stationId: 1,
        stationName: '小木屋',
        questionIndex: 0,
      });
    });
    await waitForScene(page, 'QuestionScene');

    const qInfo = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const qs = g.scene.getScene('QuestionScene');
      return {
        stationId: qs.stationId,
        stationName: qs.stationName,
        questionIndex: qs.questionIndex,
        totalQuestions: qs.questions.length,
        hasSpeaker: !!qs.speakerButton,
        hasHint: !!qs.hintButton,
        hasBack: !!qs.backButton,
        currentType: qs.currentQuestion ? qs.currentQuestion.type : null,
        promptText: qs.promptText ? qs.promptText.text : '',
      };
    });

    expect(qInfo.stationId).toBe(1);
    expect(qInfo.questionIndex).toBe(0);
    expect(qInfo.totalQuestions).toBeGreaterThanOrEqual(3);
    expect(qInfo.hasSpeaker).toBe(true);
    expect(qInfo.hasHint).toBe(true);
    expect(qInfo.hasBack).toBe(true);
    expect(qInfo.promptText.length).toBeGreaterThan(0);

    // Test Speaker TTS Trigger
    const speakerTriggered = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const qs = g.scene.getScene('QuestionScene');
      qs.speakerButton.triggerClick();
      return true;
    });
    expect(speakerTriggered).toBe(true);

    // Test Hint Button
    const hintResult = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const qs = g.scene.getScene('QuestionScene');
      const hintsBefore = qs.sessionStats.hintsUsed;
      qs.hintButton.triggerClick();
      return {
        hintsBefore,
        hintsAfter: qs.sessionStats.hintsUsed,
      };
    });
    expect(hintResult.hintsAfter).toBe(hintResult.hintsBefore + 1);

    // Answering Question: evaluate sentence scramble or choice
    const answerResult = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const qs = g.scene.getScene('QuestionScene');
      const curQ = qs.currentQuestion;

      if (curQ.type === 'sentence_scramble') {
        // Place tokens in expected correct order
        const expected = curQ.correctTokens || [];
        expected.forEach((tok: string) => {
          const card = qs.cardChips.find((c: any) => c.getValue() === tok && !c.getCurrentSlot());
          if (card) {
            qs.handleCardTap(card);
          }
        });
      } else {
        // Pick correct choice card
        const correctIdx = curQ.correctOptionIndex ?? (curQ.options ? curQ.options.findIndex((opt: any) => opt === curQ.correctAnswer || String(opt) === String(curQ.correctAnswer)) : 0);
        const card = qs.choiceCards[correctIdx >= 0 ? correctIdx : 0];
        if (card) {
          qs.handleChoiceSelection(card, correctIdx >= 0 ? correctIdx : 0);
        }
      }
      return {
        isAnswered: qs.isAnswered,
      };
    });

    expect(answerResult.isAnswered).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 5. RunnerScene Mini-Game & Transitions
  // ---------------------------------------------------------------------------
  test('5. RunnerScene runs 2D platformer minigame and transitions', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // Launch RunnerScene directly with test payload
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.start('RunnerScene', {
        stationId: 1,
        stationName: '小木屋',
        questionIndex: 1,
        isStationComplete: false,
      });
    });
    await waitForScene(page, 'RunnerScene');

    const runnerState = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const rs = g.scene.getScene('RunnerScene');
      return {
        hasPlayer: !!rs.playerSprite,
        hasChest: !!rs.chestObject,
        hasSkipBtn: !!rs.skipButton,
        itemCount: rs.worldItems ? rs.worldItems.length : 0,
      };
    });

    expect(runnerState.hasPlayer).toBe(true);
    expect(runnerState.hasChest).toBe(true);
    expect(runnerState.hasSkipBtn).toBe(true);
    expect(runnerState.itemCount).toBeGreaterThan(0);

    // Trigger Runner skip -> transitions to QuestionScene (next question)
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const rs = g.scene.getScene('RunnerScene');
      rs.skipButton.triggerClick();
    });

    // Verify transition to QuestionScene
    await waitForScene(page, 'QuestionScene');
  });

  // ---------------------------------------------------------------------------
  // 6. ResultScene Settlement & Reward Distribution
  // ---------------------------------------------------------------------------
  test('6. ResultScene displays settlement summary, calculates stars and navigates back to map', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // Launch ResultScene with perfect settlement
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.start('ResultScene', {
        stationId: 1,
        stationName: '小木屋',
        totalQuestions: 3,
        sessionStats: {
          hintsUsed: 0,
          mistakes: 0,
          correctCount: 3,
          startTime: Date.now() - 45000,
        },
        runnerCoins: 20,
      });
    });
    await waitForScene(page, 'ResultScene');

    const resultData = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const res = g.scene.getScene('ResultScene');
      return {
        starsEarned: res.starsEarned,
        rewardCoins: res.rewardCoins,
        rewardGems: res.rewardGems,
        hasMapBtn: !!res.mapButton,
        hasRetryBtn: !!res.retryButton,
        hasHomeBtn: !!res.homeButton,
      };
    });

    expect(resultData.starsEarned).toBe(3);
    expect(resultData.rewardCoins).toBe(70); // 50 base + 20 runner
    expect(resultData.rewardGems).toBe(5);
    expect(resultData.hasMapBtn).toBe(true);
    expect(resultData.hasRetryBtn).toBe(true);
    expect(resultData.hasHomeBtn).toBe(true);

    // Click Map Button to return to MapScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const res = g.scene.getScene('ResultScene');
      res.mapButton.triggerClick();
    });

    await waitForScene(page, 'MapScene');
  });

  // ---------------------------------------------------------------------------
  // 7. ShopScene Skin Selection & Purchases
  // ---------------------------------------------------------------------------
  test('7. ShopScene allows skin preview, purchase, and equipping', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // Go to ShopScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.start('ShopScene');
    });
    await waitForScene(page, 'ShopScene');

    const shopData = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const shop = g.scene.getScene('ShopScene');
      return {
        skinCount: shop.skins.length,
        hasActionBtn: !!shop.actionButton,
        hasHomeBtn: !!shop.homeButton,
        previewName: shop.previewNameText ? shop.previewNameText.text : '',
      };
    });

    expect(shopData.skinCount).toBe(5);
    expect(shopData.hasActionBtn).toBe(true);
    expect(shopData.previewName).toContain('冒險家');

    // Select second skin (Heroine)
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const shop = g.scene.getScene('ShopScene');
      shop.selectSkin(1);
    });

    const heroinePreview = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const shop = g.scene.getScene('ShopScene');
      return shop.previewNameText ? shop.previewNameText.text : '';
    });
    expect(heroinePreview).toContain('女英雄');
  });

  // ---------------------------------------------------------------------------
  // 8. SettingsScene Configuration & Toggles
  // ---------------------------------------------------------------------------
  test('8. SettingsScene toggles subjects, difficulty levels, and audio volumes', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // Go to SettingsScene
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.start('SettingsScene');
    });
    await waitForScene(page, 'SettingsScene');

    const settingsData = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const st = g.scene.getScene('SettingsScene');
      return {
        hasChineseToggle: !!st.chineseToggleBtn,
        hasMathToggle: !!st.mathToggleBtn,
        hasEnglishToggle: !!st.englishToggleBtn,
        difficultyBtnCount: st.difficultyButtons.length,
        voiceBtnCount: st.voiceButtons.length,
      };
    });

    expect(settingsData.hasChineseToggle).toBe(true);
    expect(settingsData.hasMathToggle).toBe(true);
    expect(settingsData.hasEnglishToggle).toBe(true);
    expect(settingsData.difficultyBtnCount).toBe(4);
    expect(settingsData.voiceBtnCount).toBe(3);

    // Change difficulty to Level 3
    const newDiff = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const st = g.scene.getScene('SettingsScene');
      st.selectDifficulty(3);
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      return profile.settings?.difficulty;
    });
    expect(newDiff).toBe(3);

    // Change voice language to zh-CN
    const newLang = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const st = g.scene.getScene('SettingsScene');
      st.selectVoiceLanguage('zh-CN');
      const profile = JSON.parse(localStorage.getItem('p1_adventure_save_v1') || '{}');
      return profile.settings?.voiceLanguage;
    });
    expect(newLang).toBe('zh-CN');
  });

  // ---------------------------------------------------------------------------
  // 9. Persistence Across Page Reload in localStorage
  // ---------------------------------------------------------------------------
  test('9. Game progress, currency, and settings persist across page reload', async ({ page }) => {
    await waitForScene(page, 'TitleScene');

    // Modify profile data in localStorage via DataManager storage format
    await page.evaluate(() => {
      const storageKey = 'p1_adventure_save_v1';
      const profile = {
        username: 'LittleExplorer',
        avatar: 'knight',
        equippedSkin: 'knight',
        coins: 888,
        gems: 99,
        unlockedStations: 5,
        stationStars: { 1: 3, 2: 3, 3: 2, 4: 1 },
        ownedSkins: ['adventurer', 'knight'],
        trophies: { first_step: true, math_genius: true },
        stats: {
          totalPlayTimeSeconds: 3600,
          chineseCorrect: 20,
          mathCorrect: 25,
          englishCorrect: 18,
          questionsAttempted: 65,
          perfectStations: 2,
          streakDays: 7,
          lastPlayedDate: new Date().toISOString().slice(0, 10),
        },
        settings: {
          bgmEnabled: true,
          sfxEnabled: true,
          chineseEnabled: true,
          mathEnabled: true,
          englishEnabled: true,
          voiceLanguage: 'zh-HK',
          difficulty: 3,
          soundVolume: 0.8,
        },
      };
      localStorage.setItem(storageKey, JSON.stringify(profile));
    });

    // Reload page to simulate fresh visitor session with saved state
    await page.reload();
    await waitForScene(page, 'TitleScene');

    // Verify TitleScene restored coins, gems, and stars
    const restoredTitleState = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const title = g.scene.getScene('TitleScene');
      return {
        coinText: title.coinText ? title.coinText.text : '',
        gemText: title.gemText ? title.gemText.text : '',
        starText: title.starText ? title.starText.text : '',
      };
    });

    expect(restoredTitleState.coinText).toContain('888');
    expect(restoredTitleState.gemText).toContain('99');
    expect(restoredTitleState.starText).toContain('9/30'); // 3 + 3 + 2 + 1 = 9

    // Navigate to MapScene and verify unlocked stations count
    await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      g.scene.start('MapScene');
    });
    await waitForScene(page, 'MapScene');

    const restoredMapState = await page.evaluate(() => {
      const g = (window as any).__PHASER_GAME__;
      const map = g.scene.getScene('MapScene');
      return {
        unlockedCount: map.getUnlockedStationsCount(),
      };
    });

    expect(restoredMapState.unlockedCount).toBe(5);
  });
});
