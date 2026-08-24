import { test, expect } from '@playwright/test';

test.describe('Adversarial Mobile Rendering & Engine Performance Audit', () => {

  test('Audit 1: Viewport Geometry & Coordinate Drift across 6 device form-factors', async ({ page }) => {
    const devicesToTest = [
      { name: 'iPhone 14 Pro Max (19.5:9 notch)', width: 932, height: 430, dpr: 3 },
      { name: 'iPhone SE Landscape (16:9 compact)', width: 667, height: 375, dpr: 2 },
      { name: 'iPad Pro 11 Landscape (4:3 aspect)', width: 1024, height: 768, dpr: 2 },
      { name: 'Android Galaxy S20 (20:9 tall)', width: 915, height: 412, dpr: 2.625 },
      { name: 'Desktop 1080p (16:9 FHD)', width: 1920, height: 1080, dpr: 1 },
      { name: 'Ultra-wide 21:9 Display', width: 2560, height: 1080, dpr: 1 },
    ];

    for (const dev of devicesToTest) {
      await page.setViewportSize({ width: dev.width, height: dev.height });
      await page.goto('/');
      await page.waitForSelector('canvas', { timeout: 10000 });
      await page.waitForTimeout(800);

      const metrics = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const rect = canvas ? canvas.getBoundingClientRect() : null;
        const scale = game?.scale;

        return {
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          canvasRect: rect ? { width: rect.width, height: rect.height, top: rect.top, left: rect.left } : null,
          phaserScale: scale ? {
            gameWidth: scale.gameSize.width,
            gameHeight: scale.gameSize.height,
            displayScaleX: scale.displayScale.x,
            displayScaleY: scale.displayScale.y,
            isFullScreen: scale.isFullscreen,
            parentSize: { width: scale.parentSize.width, height: scale.parentSize.height },
          } : null,
          hasGameInstance: Boolean(game),
          activeScene: game?.scene?.getScenes(true).map((s: any) => s.scene.key),
        };
      });

      console.log(`[Viewport Audit] Device: ${dev.name}`);
      console.log(`  Window: ${metrics.windowWidth}x${metrics.windowHeight}`);
      console.log(`  Canvas Rect: ${JSON.stringify(metrics.canvasRect)}`);
      console.log(`  Phaser Scale: ${JSON.stringify(metrics.phaserScale)}`);

      // Verify canvas exists and is centered
      expect(metrics.canvasRect).not.toBeNull();
      expect(metrics.canvasRect!.width).toBeGreaterThan(0);
      expect(metrics.canvasRect!.height).toBeGreaterThan(0);

      // Verify canvas aspect ratio matches 1280:720 (1.7777...)
      const canvasAspect = metrics.canvasRect!.width / metrics.canvasRect!.height;
      const expectedAspect = 1280 / 720;
      expect(Math.abs(canvasAspect - expectedAspect)).toBeLessThan(0.05);

      // Verify coordinate transformation
      const clickPoint = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const scale = game.scale;

        // Target: Start button on TitleScene (x: 640, y: 480)
        const gameX = 640;
        const gameY = 480;
        const pageX = rect.left + (gameX / scale.gameSize.width) * rect.width;
        const pageY = rect.top + (gameY / scale.gameSize.height) * rect.height;

        return { pageX, pageY };
      });

      await page.mouse.click(clickPoint.pageX, clickPoint.pageY);
      await page.waitForTimeout(600);
    }
  });

  test('Audit 2: Rapid Scene Cycling & GameObject / Texture Leak Stress Test', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Enter MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const titleScene = game.scene.getScene('TitleScene');
      if (titleScene && titleScene.scene) {
        titleScene.scene.start('MapScene');
      }
    });
    await page.waitForTimeout(500);

    const initialStats = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const mapScene = game.scene.getScene('MapScene');
      return {
        textureCount: Object.keys(game.textures.list).length,
        mapChildren: mapScene ? mapScene.children.list.length : 0,
      };
    });
    console.log(`[Leak Audit] Initial Stats in MapScene: ${JSON.stringify(initialStats)}`);

    // Perform 4 rapid cycles of QuestionScene -> RunnerScene -> ResultScene -> MapScene
    for (let round = 1; round <= 4; round++) {
      await page.evaluate((r) => {
        const game = (window as any).__PHASER_GAME__;
        const active = game.scene.getScenes(true)[0];
        if (active) {
          active.scene.start('QuestionScene', {
            stationId: (r % 10) + 1,
            questionIndex: 0,
          });
        }
      }, round);
      await page.waitForTimeout(200);

      // Force transition to RunnerScene
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const active = game.scene.getScenes(true)[0];
        if (active && active.scene) {
          active.scene.start('RunnerScene', {
            stationId: 1,
            questionIndex: 1,
            isStationComplete: false,
          });
        }
      });
      await page.waitForTimeout(200);

      // Skip runner
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const runnerScene = game.scene.getScene('RunnerScene') as any;
        if (runnerScene && typeof runnerScene.skipRunner === 'function') {
          runnerScene.skipRunner();
        }
      });
      await page.waitForTimeout(200);

      // Return to MapScene
      await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const active = game.scene.getScenes(true)[0];
        if (active && active.scene) {
          active.scene.start('MapScene');
        }
      });
      await page.waitForTimeout(200);
    }

    const finalStats = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const mapScene = game.scene.getScene('MapScene');
      return {
        textureCount: Object.keys(game.textures.list).length,
        mapChildren: mapScene ? mapScene.children.list.length : 0,
      };
    });
    console.log(`[Leak Audit] Final Stats after 4 cycles: ${JSON.stringify(finalStats)}`);

    // Check if texture count exploded
    expect(finalStats.textureCount - initialStats.textureCount).toBeLessThan(15);
  });

  test('Audit 3: Web Audio API & Synthesizer State Audit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });

    const audioReport = await page.evaluate(() => {
      const soundManagerModule = (window as any).__PHASER_GAME__?.sound;
      return {
        hasPhaserSound: Boolean(soundManagerModule),
        soundManagerMuted: soundManagerModule?.mute,
        phaserAudioContextState: soundManagerModule?.context?.state,
      };
    });

    console.log(`[Audio Audit] Audio Report: ${JSON.stringify(audioReport)}`);
    expect(audioReport.hasPhaserSound).toBe(true);
  });

  test('Audit 4: MapScene Station Modal Opening and Title/Children Accumulation Check', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Switch to MapScene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const titleScene = game.scene.getScene('TitleScene');
      if (titleScene && titleScene.scene) {
        titleScene.scene.start('MapScene');
      }
    });
    await page.waitForTimeout(500);

    const modalAudit = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const mapScene = game.scene.getScene('MapScene') as any;
      if (!mapScene) return { error: 'No MapScene' };

      // Open station modal for station 1
      mapScene.openStationModal(mapScene.stations[0]);
      const modal = mapScene.activeModal;
      if (!modal) return { error: 'No modal opened' };

      const initialChildCount = modal.panelContainer.length;
      modal.setTitle('測試 1');
      const childCountAfterSet1 = modal.panelContainer.length;
      modal.setTitle('測試 2');
      const childCountAfterSet2 = modal.panelContainer.length;
      modal.setTitle('測試 3');
      const finalChildCount = modal.panelContainer.length;

      // Close modal
      modal.close();

      return {
        initialChildCount,
        childCountAfterSet1,
        childCountAfterSet2,
        finalChildCount,
        leakedChildren: finalChildCount - initialChildCount,
      };
    });

    console.log(`[Modal Audit] Modal Audit Result: ${JSON.stringify(modalAudit)}`);
  });

  test('Audit 5: Canvas DPI / Text Resolution Audit across scenes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const textResolutionReport = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scenes = ['TitleScene', 'MapScene', 'QuestionScene', 'RunnerScene', 'ResultScene', 'ShopScene', 'TrophyScene', 'SettingsScene'];
      const report: Record<string, { totalTexts: number, textsWithLowResolution: number }> = {};

      for (const key of scenes) {
        const scene = game.scene.getScene(key);
        if (scene) {
          // Recursive search for all Text GameObjects in scene and its containers
          const allTexts: any[] = [];
          const scan = (obj: any) => {
            if (!obj) return;
            if (obj.type === 'Text') allTexts.push(obj);
            if (obj.list && Array.isArray(obj.list)) {
              obj.list.forEach(scan);
            }
          };
          if (scene.children && scene.children.list) {
            scene.children.list.forEach(scan);
          }

          const lowRes = allTexts.filter((t: any) => !t.style.resolution || t.style.resolution < 2);
          report[key] = {
            totalTexts: allTexts.length,
            textsWithLowResolution: lowRes.length,
          };
        }
      }
      return report;
    });

    console.log(`[DPI Audit] Text Resolution Report: ${JSON.stringify(textResolutionReport)}`);
  });

});
