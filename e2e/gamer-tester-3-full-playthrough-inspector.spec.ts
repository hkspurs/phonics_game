import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Gamer Tester 3: Full End-to-End Playthrough & Live Browser Inspector', () => {
  const runDir = path.join(process.cwd(), 'playthrough-artifacts', 'gamer-tester-3');

  test.beforeAll(async () => {
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }
  });

  test('Ruthless Adversarial E2E Playthrough: Title -> Shop Buy/Equip Heroine (30💎) -> Map Station 1 -> Q1 Chinese Scramble (Slot Audit) -> Runner (Touch Jump) -> Q2 Math -> Runner -> Q3 English Scramble (Slot Audit) -> Final Runner -> 3-Star Result Settlement', async ({
    page,
  }) => {
    test.setTimeout(90000);
    // 0. Collect browser console messages and uncaught errors
    const consoleLogs: { type: string; text: string }[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        console.error(`[Browser Console ERROR] ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.warn(`[Browser Console WARN] ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
      console.error(`[Browser Page ERROR] ${err.message}`);
    });

    // 1. Setup iPhone 14 Pro Max Landscape viewport (932x430) with touch support
    await page.setViewportSize({ width: 932, height: 430 });

    // Seed localStorage with 50 gems and initial profile before page load
    await page.addInitScript(() => {
      const profile = {
        coins: 100,
        gems: 50,
        unlockedStations: 1,
        stationStars: {},
        equippedSkin: 'adventurer',
        ownedSkins: ['adventurer'],
        trophies: {},
        stats: {
          chineseCorrect: 0,
          mathCorrect: 0,
          englishCorrect: 0,
          streakDays: 1,
          lastPlayedDate: '2026-08-24',
        },
        settings: {
          chineseEnabled: true,
          mathEnabled: true,
          englishEnabled: true,
          voiceLanguage: 'zh-HK',
          difficulty: 1,
          soundVolume: 1.0,
        },
      };
      localStorage.setItem('p1_adventure_save_v1', JSON.stringify(profile));
    });

    await page.goto('/');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Capture TitleScreen Screenshot
    await page.screenshot({ path: path.join(runDir, '01_Title_Screen.png') });

    // Verify TitleScene is active and profile has 50 gems
    const titleInitState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return { error: 'Game instance missing' };
      const titleScene = game.scene.getScene('TitleScene');
      const profile = (window as any).DataManager?.getInstance
        ? (window as any).DataManager.getInstance().getProfile()
        : null;

      return {
        isActive: game.scene.isActive('TitleScene'),
        hasShopBtn: !!(titleScene as any)?.shopButton,
        hasStartBtn: !!(titleScene as any)?.startButton,
        profileGems: profile?.gems,
      };
    });

    expect(titleInitState.isActive).toBe(true);
    expect(titleInitState.hasShopBtn).toBe(true);

    // =========================================================================
    // STEP 1: Open Shop -> Buy Heroine (30💎) -> Equip Heroine
    // =========================================================================
    console.log('[Playthrough Inspector] Step 1: Opening ShopScene...');
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const title = game.scene.getScene('TitleScene');
      if (title?.shopButton) {
        title.shopButton.emit('pointerdown');
        title.shopButton.emit('pointerup');
      } else {
        title.scene.start('ShopScene');
      }
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(runDir, '02_Shop_Screen_Init.png') });

    // Verify ShopScene is active
    const shopStateBefore = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      return {
        isActive: game.scene.isActive('ShopScene'),
        skinsCount: (shop as any)?.skins?.length || 0,
        selectedSkinIndex: (shop as any)?.selectedSkinIndex,
      };
    });

    expect(shopStateBefore.isActive).toBe(true);
    expect(shopStateBefore.skinsCount).toBeGreaterThanOrEqual(2);

    // Select Heroine Skin (id: 'heroine', index 1)
    console.log('[Playthrough Inspector] Step 1.2: Selecting Heroine skin (30💎)...');
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      const heroineIdx = (shop as any).skins.findIndex((s: any) => s.id === 'heroine');
      (shop as any).selectSkin(heroineIdx);
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(runDir, '03_Shop_Heroine_Selected.png') });

    // Click Action Button to Purchase Heroine (30💎) & Equip
    console.log('[Playthrough Inspector] Step 1.3: Purchasing Heroine skin...');
    const purchaseResult = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      const actionBtn = (shop as any).actionButton;

      const rawBefore = localStorage.getItem('p1_adventure_save_v1');
      const profileBefore = rawBefore ? JSON.parse(rawBefore) : {};

      // Trigger action button
      if (actionBtn) {
        (shop as any).handleActionClick();
      }

      const rawAfter = localStorage.getItem('p1_adventure_save_v1');
      const profileAfter = rawAfter ? JSON.parse(rawAfter) : {};

      return {
        gemsBefore: profileBefore.gems,
        gemsAfter: profileAfter.gems,
        ownedSkins: profileAfter.ownedSkins || [],
        equippedSkin: profileAfter.equippedSkin,
        isHeroineOwned: (profileAfter.ownedSkins || []).includes('heroine'),
        isHeroineEquipped: profileAfter.equippedSkin === 'heroine',
      };
    });

    console.log('[Playthrough Inspector] Purchase Result:', purchaseResult);
    expect(purchaseResult.isHeroineOwned).toBe(true);
    expect(purchaseResult.isHeroineEquipped).toBe(true);
    expect(purchaseResult.gemsAfter).toBeGreaterThanOrEqual(20);

    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(runDir, '04_Shop_Heroine_Equipped.png') });

    // =========================================================================
    // STEP 1.4: Test Wardrobe Tab & Subcategories
    // =========================================================================
    console.log('[Playthrough Inspector] Step 1.4: Auditing Wardrobe Tab & Subcategories...');
    const wardrobeAudit = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');

      // Switch to Wardrobe Tab
      (shop as any).switchTab('wardrobe');

      const currentTab = (shop as any).currentTab;
      const subCategoryCount = (shop as any).subCategoryButtons?.length || 0;

      // Switch subcategory to 'accessory'
      (shop as any).switchWardrobeCategory('accessory');
      const currentCat = (shop as any).currentWardrobeCategory;

      // Switch back to 'dress' and select item 0
      (shop as any).switchWardrobeCategory('dress');
      (shop as any).selectWardrobeItem(0);

      // Trigger buy / equip
      (shop as any).handleActionClick();

      const raw = localStorage.getItem('p1_adventure_save_v1');
      const profile = raw ? JSON.parse(raw) : {};
      const equippedWardrobe = profile.equippedWardrobe || {};

      return {
        currentTab,
        subCategoryCount,
        currentCat,
        equippedDress: equippedWardrobe?.dress,
        overlayText: (shop as any).previewWardrobeOverlay?.text,
      };
    });

    console.log('[Playthrough Inspector] Wardrobe Audit:', wardrobeAudit);
    expect(wardrobeAudit.currentTab).toBe('wardrobe');
    expect(wardrobeAudit.subCategoryCount).toBe(4);
    expect(wardrobeAudit.equippedDress).toBeDefined();

    await page.screenshot({ path: path.join(runDir, '04b_Shop_Wardrobe_Equipped.png') });

    // =========================================================================
    // STEP 1.5: Test OOTD Photo Booth Modal
    // =========================================================================
    console.log('[Playthrough Inspector] Step 1.5: Auditing OOTD Photo Booth Modal...');
    const ootdOpen = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      (shop as any).showOOTDPhotoModal();
      return {
        hasModal: !!(shop as any).ootdModal,
        modalDepth: (shop as any).ootdModal?.depth,
      };
    });

    expect(ootdOpen.hasModal).toBe(true);
    expect(ootdOpen.modalDepth).toBe(200);

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(runDir, '04c_Shop_OOTD_Modal.png') });

    // Close OOTD modal
    const ootdClose = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      (shop as any).closeOOTDPhotoModal();
      return {
        hasModal: !!(shop as any).ootdModal,
      };
    });

    expect(ootdClose.hasModal).toBe(false);

    // =========================================================================
    // STEP 2: Navigate to MapScene -> Open Station 1 Modal
    // =========================================================================
    console.log('[Playthrough Inspector] Step 2: Navigating to MapScene...');
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const shop = game.scene.getScene('ShopScene');
      if (shop?.mapButton) {
        shop.mapButton.emit('pointerdown');
        shop.mapButton.emit('pointerup');
      } else {
        shop.scene.start('MapScene');
      }
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(runDir, '05_Map_Roadmap.png') });

    // Verify MapScene is active and Station 1 is unlocked
    const mapState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      return {
        isActive: game.scene.isActive('MapScene'),
        stationsCount: (map as any)?.stations?.length || 0,
      };
    });

    expect(mapState.isActive).toBe(true);

    // Open Station 1 Modal
    console.log('[Playthrough Inspector] Step 2.2: Opening Station 1 Modal...');
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      const station1 = (map as any).stations[0];
      (map as any).openStationModal(station1);
    });

    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(runDir, '06_Station1_Modal_Opened.png') });

    // Click enter button to start QuestionScene (Level 1-1 Chinese Question)
    console.log('[Playthrough Inspector] Step 2.3: Entering QuestionScene for Station 1...');
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const map = game.scene.getScene('MapScene');
      if (map?.activeModal) {
        map.activeModal.close();
      }

      const q1 = {
        id: 'zh_scramble_101',
        subject: 'chinese',
        category: 'sentence_scramble',
        type: 'sentence_scramble',
        difficulty: 1,
        prompt: '重組句子：請把字詞排列成通順的句子。',
        speakText: '姐姐吃餅乾。',
        correctTokens: ['姐姐', '吃', '餅乾', '。'],
        shuffledTokens: ['吃', '。', '姐姐', '餅乾'],
        hintText: '提示：主語是「姐姐」',
      };
      const q2 = {
        id: 'math_add_101',
        subject: 'math',
        type: 'multiple_choice',
        prompt: '計算題：請選出正確的答案 12 + 5 = ?',
        speakText: '12 加 5 等於幾多？',
        options: ['15', '17', '18', '19'],
        correctOptionIndex: 1,
        correctAnswer: '17',
        hintText: '提示：12 + 5 = 17',
      };
      const q3 = {
        id: 'en_scramble_101',
        subject: 'english',
        category: 'sentence_scramble',
        type: 'sentence_scramble',
        difficulty: 1,
        prompt: 'Sentence Scramble: Put the words in the right order.',
        speakText: 'I like apples.',
        correctTokens: ['I', 'like', 'apples', '.'],
        shuffledTokens: ['apples', 'like', '.', 'I'],
        hintText: 'Hint: Starts with "I"',
      };

      map.scene.start('QuestionScene', {
        stationId: 1,
        stationName: '小木屋',
        questionIndex: 0,
        questions: [q1, q2, q3],
      });
    });

    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(runDir, '07_Q1_Chinese_Start.png') });

    // =========================================================================
    // STEP 3: Solve Question 1 (Chinese Sentence Scramble) with 100% Slot Verification
    // =========================================================================
    console.log('[Playthrough Inspector] Step 3: Solving Question 1 (Chinese Sentence Scramble)...');

    const q1Details = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const qScene = game.scene.getScene('QuestionScene');
      const q = (qScene as any)?.currentQuestion;
      return {
        isActive: game.scene.isActive('QuestionScene'),
        subject: q?.subject,
        type: q?.type,
        prompt: q?.prompt,
        correctTokens: q?.correctTokens || [],
        shuffledTokens: q?.shuffledTokens || [],
        slotBoxesCount: (qScene as any)?.slotBoxes?.length || 0,
        cardChipsCount: (qScene as any)?.cardChips?.length || 0,
      };
    });

    console.log('[Playthrough Inspector] Q1 Details:', q1Details);
    expect(q1Details.isActive).toBe(true);
    expect(q1Details.subject).toBe('chinese');
    expect(q1Details.type).toBe('sentence_scramble');
    expect(q1Details.slotBoxesCount).toBe(q1Details.correctTokens.length);
    expect(q1Details.cardChipsCount).toBe(q1Details.correctTokens.length);

    // Place each token one by one and audit both physical and logical slot containment
    const tokensCount = q1Details.correctTokens.length;
    for (let slotIndex = 0; slotIndex < tokensCount; slotIndex++) {
      const targetToken = q1Details.correctTokens[slotIndex];

      const placementAudit = await page.evaluate(
        ({ token, slotIdx }) => {
          const game = (window as any).__PHASER_GAME__;
          const qScene = game.scene.getScene('QuestionScene');
          const chips = (qScene as any).cardChips;
          const slots = (qScene as any).slotBoxes;

          // Find an available chip with text == token that is not yet placed in a slot
          const targetChip = chips.find(
            (c: any) => c.getText() === token && c.getCurrentSlot() === null
          );

          if (!targetChip) {
            return {
              error: `Could not find available bank chip for token: "${token}" at slot ${slotIdx}`,
            };
          }

          // Simulate user click on chip
          (qScene as any).handleCardTap(targetChip);

          const slot = slots[slotIdx];
          const placedCard = slot?.getPlacedCard();
          const currentSlotOfCard = targetChip.getCurrentSlot();

          return {
            hasCard: slot?.hasCard(),
            slotIndex: slot?.getIndex(),
            placedCardText: placedCard?.getText(),
            cardCurrentSlotIndex: currentSlotOfCard?.getIndex(),
            slotIsCorrect: slot?.isCorrect(),
          };
        },
        { token: targetToken, slotIdx: slotIndex }
      );

      console.log(
        `[Playthrough Inspector] Q1 Slot ${slotIndex} Audit ('${targetToken}'):`,
        placementAudit
      );

      expect(placementAudit.hasCard).toBe(true);
      expect(placementAudit.slotIndex).toBe(slotIndex);
      expect(placementAudit.placedCardText).toBe(targetToken);
      expect(placementAudit.cardCurrentSlotIndex).toBe(slotIndex);
      expect(placementAudit.slotIsCorrect).toBe(true);

      // Wait 150ms for spring snap tween to settle, then verify physical position
      await page.waitForTimeout(150);

      const physicalPos = await page.evaluate(({ token, slotIdx }) => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene');
        const slots = (qScene as any).slotBoxes;
        const slot = slots[slotIdx];
        const card = slot?.getPlacedCard();
        return {
          cardX: card?.x,
          cardY: card?.y,
          slotX: slot?.x,
          slotY: slot?.y,
          diffX: Math.abs((card?.x ?? 0) - (slot?.x ?? 0)),
          diffY: Math.abs((card?.y ?? 0) - (slot?.y ?? 0)),
        };
      }, { token: targetToken, slotIdx: slotIndex });

      console.log(`[Playthrough Inspector] Q1 Slot ${slotIndex} Physical Positioning:`, physicalPos);
      expect(physicalPos.diffX).toBeLessThanOrEqual(2);
      expect(physicalPos.diffY).toBeLessThanOrEqual(2);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(runDir, '08_Q1_Chinese_Solved.png') });

    // Verify Q1 celebration triggered and answered
    const q1Completed = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const qScene = game.scene.getScene('QuestionScene');
      return {
        isAnswered: (qScene as any)?.isAnswered,
        correctCount: (qScene as any)?.sessionStats?.correctCount,
      };
    });

    expect(q1Completed.isAnswered).toBe(true);
    expect(q1Completed.correctCount).toBe(1);

    // =========================================================================
    // STEP 4: RunnerScene Phase 1 (Analog Virtual Joystick & Mobile Controls Audit)
    // =========================================================================
    console.log('[Playthrough Inspector] Step 4: Waiting for transition to RunnerScene Phase 1...');
    await page.waitForTimeout(1600);

    const runner1State = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      return {
        isActive: game.scene.isActive('RunnerScene'),
        skinId: (runner as any)?.skinConfig?.id,
        walk1Key: (runner as any)?.skinConfig?.walk1Key,
        questionIndex: (runner as any)?.questionIndex,
        hasJoystick: !!(runner as any)?.joystickThumbGraphics,
        hasJumpBtn: !!(runner as any)?.jumpBtn,
        initialDistance: (runner as any)?.distanceRun,
      };
    });

    console.log('[Playthrough Inspector] Runner Phase 1 State:', runner1State);
    expect(runner1State.isActive).toBe(true);
    expect(runner1State.skinId).toBe('heroine'); // Equipped Heroine skin verified!
    expect(runner1State.walk1Key).toBe('female_walk1');
    expect(runner1State.hasJoystick).toBe(true);
    expect(runner1State.hasJumpBtn).toBe(true);

    await page.screenshot({ path: path.join(runDir, '09_Runner_Phase1_Heroine.png') });

    // Test 4.1: Idle State - Verify character 100% stands still when joystick is at rest
    console.log('[Playthrough Inspector] Step 4.1: Auditing Joystick Idle State...');
    const idleCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      const distBefore = (runner as any).distanceRun;
      (runner as any).update(0, 200); // 200ms pass
      const distAfter = (runner as any).distanceRun;
      return {
        distBefore,
        distAfter,
        isStationary: distBefore === distAfter,
        axisX: (runner as any).joystickAxisX,
      };
    });
    console.log('[Playthrough Inspector] Idle Check:', idleCheck);
    expect(idleCheck.isStationary).toBe(true);
    expect(idleCheck.axisX).toBe(0);

    // Test 4.2: Continuous Swipe - Slide from left (dx = -52) to right (dx = +52) in a single drag
    console.log('[Playthrough Inspector] Step 4.2: Auditing Continuous Joystick Swipe...');
    const swipeCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      (runner as any).distanceRun = 100;

      // 1. Swipe Left
      (runner as any).updateJoystickFromPointer((runner as any).joystickBaseX - (runner as any).joystickRadius, (runner as any).joystickBaseY);
      const leftAxis = (runner as any).joystickAxisX;
      (runner as any).update(0, 100);
      const distAfterLeft = (runner as any).distanceRun;

      // 2. Seamlessly slide to Right without lifting
      (runner as any).updateJoystickFromPointer((runner as any).joystickBaseX + (runner as any).joystickRadius, (runner as any).joystickBaseY);
      const rightAxis = (runner as any).joystickAxisX;
      (runner as any).update(0, 100);
      const distAfterRight = (runner as any).distanceRun;

      return {
        leftAxis,
        rightAxis,
        distAfterLeft,
        distAfterRight,
        switchedDirection: distAfterRight > distAfterLeft,
      };
    });
    console.log('[Playthrough Inspector] Swipe Check:', swipeCheck);
    expect(swipeCheck.leftAxis).toBe(-1.0);
    expect(swipeCheck.rightAxis).toBe(1.0);
    expect(swipeCheck.switchedDirection).toBe(true);

    // Test 4.3: Elastic Release - Releasing thumb snaps knob to center and immediately halts character
    console.log('[Playthrough Inspector] Step 4.3: Auditing Elastic Release...');
    const releaseCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      (runner as any).resetJoystick();
      const distBefore = (runner as any).distanceRun;
      (runner as any).update(0, 100);
      const distAfter = (runner as any).distanceRun;
      return {
        axisAfterRelease: (runner as any).joystickAxisX,
        isHalted: distBefore === distAfter,
        textureKey: (runner as any).playerSprite?.texture?.key,
        standKey: (runner as any).skinConfig?.standKey,
      };
    });
    console.log('[Playthrough Inspector] Release Check:', releaseCheck);
    expect(releaseCheck.axisAfterRelease).toBe(0);
    expect(releaseCheck.isHalted).toBe(true);
    expect(releaseCheck.textureKey).toBe(releaseCheck.standKey);

    // Test 4.4: Multi-Touch - Left thumb dragging joystick while right thumb presses jump button
    console.log('[Playthrough Inspector] Step 4.4: Auditing Multi-touch Joystick + Jump...');
    const multiTouchCheck = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      // Left thumb moves right
      (runner as any).joystickActive = true;
      (runner as any).joystickPointerId = 1;
      (runner as any).updateJoystickFromPointer((runner as any).joystickBaseX + (runner as any).joystickRadius, (runner as any).joystickBaseY);

      // Right thumb taps Jump Button
      (runner as any).handleJumpInput();

      const isJumping = (runner as any).isJumping;
      const velocityY = (runner as any).playerVelocityY;

      // Update frame with simultaneous steering + jump
      (runner as any).update(0, 100);

      return {
        isJumping,
        velocityY,
        axisMaintained: (runner as any).joystickAxisX === 1.0,
        isAirborne: !(runner as any).isGrounded,
      };
    });
    console.log('[Playthrough Inspector] Multi-touch Check:', multiTouchCheck);
    expect(multiTouchCheck.isJumping).toBe(true);
    expect(multiTouchCheck.velocityY).toBeLessThan(0); // Upward velocity
    expect(multiTouchCheck.axisMaintained).toBe(true);
    expect(multiTouchCheck.isAirborne).toBe(true);

    await page.screenshot({ path: path.join(runDir, '10_Runner_Phase1_Jumping.png') });

    // Release joystick after test
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      (runner as any).resetJoystick();
    });

    // =========================================================================
    // STEP 4.5: Rock Obstacle Kinematics (Stumble Slowdown vs Manual Jump Clear)
    // =========================================================================
    console.log('[Playthrough Inspector] Step 4.5: Auditing Rock Obstacle Kinematics...');
    const rockObstacleAudit = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');

      // 1. Simulate hitting rock obstacle while grounded
      (runner as any).hasShield = false;
      (runner as any).stumbleTimer = 0;
      (runner as any).hitObstacleWithShieldCheck();

      const stumbleTimer = (runner as any).stumbleTimer;

      // 2. Test manual jump clearing rock cleanly
      (runner as any).stumbleTimer = 0;
      (runner as any).isGrounded = false;
      (runner as any).playerY = (runner as any).playerBaselineY - 80; // airborne in mid-air
      const obstacleItem = (runner as any).worldItems?.find((it: any) => it.type === 'obstacle');

      // Update frame with airborne player over rock
      (runner as any).update(0, 16);
      const stumbleAfterAirborne = (runner as any).stumbleTimer;

      return {
        stumbleTimer,
        stumbleAfterAirborne,
        isSlowdownTriggered: stumbleTimer === 650,
        isAirborneClearClean: stumbleAfterAirborne === 0,
      };
    });

    console.log('[Playthrough Inspector] Rock Obstacle Audit:', rockObstacleAudit);
    expect(rockObstacleAudit.isSlowdownTriggered).toBe(true);
    expect(rockObstacleAudit.isAirborneClearClean).toBe(true);

    // =========================================================================
    // STEP 4.6: Double Jump Kinematics (Mid-air boost)
    // =========================================================================
    console.log('[Playthrough Inspector] Step 4.6: Auditing Double Jump Kinematics...');
    const doubleJumpAudit = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');

      // Reset to ground
      (runner as any).isGrounded = true;
      (runner as any).hasDoubleJumped = false;
      (runner as any).playerVelocityY = 0;

      // First Jump
      (runner as any).handleJumpInput();
      const firstJumpVelocity = (runner as any).playerVelocityY;
      const isAirborneAfterFirst = !(runner as any).isGrounded;

      // Second Jump in mid-air
      (runner as any).handleJumpInput();
      const secondJumpVelocity = (runner as any).playerVelocityY;
      const hasDoubleJumped = (runner as any).hasDoubleJumped;

      return {
        firstJumpVelocity,
        secondJumpVelocity,
        isAirborneAfterFirst,
        hasDoubleJumped,
        isSecondJumpBoosted: secondJumpVelocity < 0,
      };
    });

    console.log('[Playthrough Inspector] Double Jump Audit:', doubleJumpAudit);
    expect(doubleJumpAudit.isAirborneAfterFirst).toBe(true);
    expect(doubleJumpAudit.hasDoubleJumped).toBe(true);
    expect(doubleJumpAudit.isSecondJumpBoosted).toBe(true);

    // =========================================================================
    // STEP 4.7: Companion Pet Follow & Chest Victory Dance
    // =========================================================================
    console.log('[Playthrough Inspector] Step 4.7: Running to chest and verifying celebration...');
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      (runner as any).onReachChest();
    });

    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(runDir, '11_Runner_Phase1_ChestOpened.png') });

    // =========================================================================
    // STEP 5: Solve Question 2 (Math Calculation) -> RunnerScene Phase 2
    // =========================================================================
    console.log('[Playthrough Inspector] Step 5: Solving Question 2 (Math Calculation)...');
    await page.waitForTimeout(800);

    const q2Details = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const qScene = game.scene.getScene('QuestionScene');
      const q = (qScene as any)?.currentQuestion;
      return {
        isActive: game.scene.isActive('QuestionScene'),
        questionIndex: (qScene as any)?.questionIndex,
        subject: q?.subject,
        type: q?.type,
        prompt: q?.prompt,
        correctAnswer: q?.correctAnswer,
        correctOptionIndex: q?.correctOptionIndex,
        choiceCardsCount: (qScene as any)?.choiceCards?.length || 0,
      };
    });

    console.log('[Playthrough Inspector] Q2 Details:', q2Details);
    expect(q2Details.isActive).toBe(true);
    expect(q2Details.subject).toBe('math');
    expect(q2Details.questionIndex).toBe(1);

    await page.screenshot({ path: path.join(runDir, '12_Q2_Math_Start.png') });

    // Select correct answer choice card
    const q2Solved = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const qScene = game.scene.getScene('QuestionScene');
      const cards = (qScene as any).choiceCards;
      const q = (qScene as any).currentQuestion;

      let targetCard = null;
      let targetIdx = -1;

      if (q.correctOptionIndex !== undefined && cards[q.correctOptionIndex]) {
        targetIdx = q.correctOptionIndex;
        targetCard = cards[targetIdx];
      } else {
        targetIdx = cards.findIndex(
          (c: any) => c.getValue() === q.correctAnswer || String(c.getValue()) === String(q.correctAnswer)
        );
        targetCard = cards[targetIdx];
      }

      if (!targetCard) {
        return { error: 'Could not find correct choice card' };
      }

      (qScene as any).handleChoiceSelection(targetCard, targetIdx);

      return {
        isAnswered: (qScene as any).isAnswered,
        cardState: targetCard.getState(),
        correctCount: (qScene as any).sessionStats.correctCount,
      };
    });

    console.log('[Playthrough Inspector] Q2 Solved State:', q2Solved);
    expect(q2Solved.isAnswered).toBe(true);
    expect(q2Solved.cardState).toBe('correct');
    expect(q2Solved.correctCount).toBe(2);

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(runDir, '13_Q2_Math_Solved.png') });

    // Transition to RunnerScene Phase 2
    console.log('[Playthrough Inspector] Step 5.2: Entering RunnerScene Phase 2...');
    await page.waitForTimeout(1600);

    const runner2State = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      return {
        isActive: game.scene.isActive('RunnerScene'),
        questionIndex: (runner as any)?.questionIndex,
      };
    });

    expect(runner2State.isActive).toBe(true);
    expect(runner2State.questionIndex).toBe(1);

    await page.screenshot({ path: path.join(runDir, '14_Runner_Phase2_Start.png') });

    // Run to chest in Phase 2
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      (runner as any).onReachChest();
    });

    await page.waitForTimeout(1800);

    // =========================================================================
    // STEP 6: Solve Question 3 (English Sentence Scramble) with 100% Slot Verification
    // =========================================================================
    console.log('[Playthrough Inspector] Step 6: Solving Question 3 (English)...');
    await page.waitForTimeout(800);

    const q3Details = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const qScene = game.scene.getScene('QuestionScene');
      const q = (qScene as any)?.currentQuestion;
      return {
        isActive: game.scene.isActive('QuestionScene'),
        questionIndex: (qScene as any)?.questionIndex,
        subject: q?.subject,
        type: q?.type,
        prompt: q?.prompt,
        correctTokens: q?.correctTokens || [],
        slotBoxesCount: (qScene as any)?.slotBoxes?.length || 0,
        cardChipsCount: (qScene as any)?.cardChips?.length || 0,
      };
    });

    console.log('[Playthrough Inspector] Q3 Details:', q3Details);
    expect(q3Details.isActive).toBe(true);
    expect(q3Details.subject).toBe('english');
    expect(q3Details.questionIndex).toBe(2);

    await page.screenshot({ path: path.join(runDir, '15_Q3_English_Start.png') });

    if (q3Details.type === 'sentence_scramble') {
      const enTokensCount = q3Details.correctTokens.length;
      for (let slotIndex = 0; slotIndex < enTokensCount; slotIndex++) {
        const targetToken = q3Details.correctTokens[slotIndex];

        const enPlacementAudit = await page.evaluate(
          ({ token, slotIdx }) => {
            const game = (window as any).__PHASER_GAME__;
            const qScene = game.scene.getScene('QuestionScene');
            const chips = (qScene as any).cardChips;
            const slots = (qScene as any).slotBoxes;

            const targetChip = chips.find(
              (c: any) => c.getText() === token && c.getCurrentSlot() === null
            );

            if (!targetChip) {
              return {
                error: `Could not find bank chip for English token: "${token}" at slot ${slotIdx}`,
              };
            }

            (qScene as any).handleCardTap(targetChip);

            const slot = slots[slotIdx];
            const placedCard = slot?.getPlacedCard();
            const currentSlotOfCard = targetChip.getCurrentSlot();

            return {
              hasCard: slot?.hasCard(),
              slotIndex: slot?.getIndex(),
              placedCardText: placedCard?.getText(),
              cardCurrentSlotIndex: currentSlotOfCard?.getIndex(),
              slotIsCorrect: slot?.isCorrect(),
            };
          },
          { token: targetToken, slotIdx: slotIndex }
        );

        console.log(
          `[Playthrough Inspector] Q3 English Slot ${slotIndex} Audit ('${targetToken}'):`,
          enPlacementAudit
        );

        expect(enPlacementAudit.hasCard).toBe(true);
        expect(enPlacementAudit.slotIndex).toBe(slotIndex);
        expect(enPlacementAudit.placedCardText).toBe(targetToken);
        expect(enPlacementAudit.cardCurrentSlotIndex).toBe(slotIndex);
        expect(enPlacementAudit.slotIsCorrect).toBe(true);

        // Wait 150ms for spring snap tween to settle, then verify physical position
        await page.waitForTimeout(150);

        const enPhysicalPos = await page.evaluate(
          ({ slotIdx }) => {
            const game = (window as any).__PHASER_GAME__;
            const qScene = game.scene.getScene('QuestionScene');
            const slots = (qScene as any).slotBoxes;
            const slot = slots[slotIdx];
            const card = slot?.getPlacedCard();
            return {
              cardX: card?.x,
              cardY: card?.y,
              slotX: slot?.x,
              slotY: slot?.y,
              diffX: Math.abs((card?.x ?? 0) - (slot?.x ?? 0)),
              diffY: Math.abs((card?.y ?? 0) - (slot?.y ?? 0)),
            };
          },
          { slotIdx: slotIndex }
        );

        console.log(
          `[Playthrough Inspector] Q3 English Slot ${slotIndex} Physical Positioning:`,
          enPhysicalPos
        );
        expect(enPhysicalPos.diffX).toBeLessThanOrEqual(2);
        expect(enPhysicalPos.diffY).toBeLessThanOrEqual(2);
      }
    } else {
      // Choice question
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const qScene = game.scene.getScene('QuestionScene');
        const cards = (qScene as any).choiceCards;
        const q = (qScene as any).currentQuestion;
        const targetIdx = q.correctOptionIndex ?? 0;
        (qScene as any).handleChoiceSelection(cards[targetIdx], targetIdx);
      });
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(runDir, '16_Q3_English_Solved.png') });

    const q3Completed = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const qScene = game.scene.getScene('QuestionScene');
      return {
        isAnswered: (qScene as any)?.isAnswered,
        correctCount: (qScene as any)?.sessionStats?.correctCount,
      };
    });

    expect(q3Completed.isAnswered).toBe(true);
    expect(q3Completed.correctCount).toBe(3);

    // =========================================================================
    // STEP 7: Final Runner Phase -> Reach Final Treasure Chest -> ResultScene
    // =========================================================================
    console.log('[Playthrough Inspector] Step 7: Final Runner Phase with Station Completion...');
    await page.waitForTimeout(1600);

    const finalRunnerState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      return {
        isActive: game.scene.isActive('RunnerScene'),
        isStationComplete: (runner as any)?.isStationComplete,
      };
    });

    expect(finalRunnerState.isActive).toBe(true);
    expect(finalRunnerState.isStationComplete).toBe(true);

    await page.screenshot({ path: path.join(runDir, '17_Final_Runner_Complete.png') });

    // Open final treasure chest
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const runner = game.scene.getScene('RunnerScene');
      (runner as any).onReachChest();
    });

    await page.waitForTimeout(2000);

    // =========================================================================
    // STEP 8: Verify ResultScene 3-Star Settlement and Returned Rewards
    // =========================================================================
    console.log('[Playthrough Inspector] Step 8: Auditing ResultScene 3-Star Victory Settlement...');

    const resultState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const result = game.scene.getScene('ResultScene');
      const raw = localStorage.getItem('p1_adventure_save_v1');
      const profile = raw ? JSON.parse(raw) : {};

      return {
        isActive: game.scene.isActive('ResultScene'),
        stationId: (result as any)?.stationId,
        starsEarned: (result as any)?.starsEarned,
        rewardCoins: (result as any)?.rewardCoins,
        rewardGems: (result as any)?.rewardGems,
        sessionCorrect: (result as any)?.sessionStats?.correctCount,
        sessionHints: (result as any)?.sessionStats?.hintsUsed,
        sessionMistakes: (result as any)?.sessionStats?.mistakes,
        hasMapBtn: !!(result as any)?.mapButton,
        hasRetryBtn: !!(result as any)?.retryButton,
        profileStarsStation1: profile?.stationStars?.[1],
        unlockedStations: profile?.unlockedStations,
        finalGems: profile?.gems,
        finalCoins: profile?.coins,
      };
    });

    console.log('[Playthrough Inspector] ResultScene Audit:', resultState);
    expect(resultState.isActive).toBe(true);
    expect(resultState.stationId).toBe(1);
    expect(resultState.starsEarned).toBe(3); // 3-Star Perfect Settlement!
    expect(resultState.sessionCorrect).toBe(3);
    expect(resultState.sessionHints).toBe(0);
    expect(resultState.sessionMistakes).toBe(0);
    expect(resultState.profileStarsStation1).toBe(3);
    expect(resultState.unlockedStations).toBeGreaterThanOrEqual(2); // Station 2 unlocked!
    expect(resultState.rewardGems).toBeGreaterThanOrEqual(5);

    await page.screenshot({ path: path.join(runDir, '18_Result_Scene_3Stars_Victory.png') });

    // =========================================================================
    // STEP 9: Console Logs & Rendering State Audit
    // =========================================================================
    console.log('[Playthrough Inspector] Step 9: Final Browser Console & Error Inspection...');
    console.log(`[Playthrough Inspector] Total console messages collected: ${consoleLogs.length}`);
    console.log(`[Playthrough Inspector] Page error count: ${pageErrors.length}`);

    // Check for critical browser page errors
    expect(pageErrors).toEqual([]);

    console.log('[Playthrough Inspector] PLAYTHROUGH 100% COMPLETE AND INSPECTED WITH ZERO UNCAUGHT ERRORS.');
  });
});
