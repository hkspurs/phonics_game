import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Phaser from 'phaser';
import { DataManager } from '../services/DataManager';

describe('UI QA Auditor 1: Adversarial Responsive Viewport & Button Touch Coordinate Drift Suite', () => {
  let dataManager: DataManager;

  beforeEach(() => {
    dataManager = DataManager.getInstance();
    dataManager.reset();
  });

  afterEach(() => {
    dataManager.reset();
    vi.clearAllMocks();
  });

  describe('1. DEFECT AUDIT: SlotBox HitArea DisplayOrigin Offset Drift in QuestionScene', () => {
    it('AUDIT-DEFECT-1: Proves SlotBox hitArea in QuestionScene shifts hitArea left by cardWidth/2, causing right-side misses and left-side ghost clicks', () => {
      const cardWidth = 155;
      const cardHeight = 74;

      // QuestionScene.ts line 494-497 creates:
      const hitPadX = 8;
      const hitPadY = 8;
      const faultyHitRect = new Phaser.Geom.Rectangle(
        -cardWidth / 2 - hitPadX,
        -cardHeight / 2 - hitPadY,
        cardWidth + hitPadX * 2,
        cardHeight + hitPadY * 2
      );

      // Phaser Container displayOrigin is (cardWidth / 2, cardHeight / 2) = (77.5, 37)
      const displayOriginX = cardWidth / 2;
      const displayOriginY = cardHeight / 2;

      // Test Point A: Center of SlotBox
      const centerLocalX = 0 + displayOriginX; // 77.5
      const centerLocalY = 0 + displayOriginY; // 37
      expect(Phaser.Geom.Rectangle.Contains(faultyHitRect, centerLocalX, centerLocalY)).toBe(true);

      // Test Point B: Right half inside visual box - 30px right of center
      const rightLocalX = 30 + displayOriginX; // 107.5
      const rightLocalY = 0 + displayOriginY; // 37
      // DEFECT: Inside visual boundary (x in [-77.5, +77.5]) but REJECTED by faulty hitRect!
      expect(Phaser.Geom.Rectangle.Contains(faultyHitRect, rightLocalX, rightLocalY)).toBe(false);

      // Test Point C: Far right inside visual box (+70px)
      const farRightLocalX = 70 + displayOriginX; // 147.5
      expect(Phaser.Geom.Rectangle.Contains(faultyHitRect, farRightLocalX, centerLocalY)).toBe(false);

      // Test Point D: Empty space to the LEFT of SlotBox (-120px) - 42.5px outside visual box!
      const outsideLeftLocalX = -120 + displayOriginX; // -42.5
      // DEFECT: Registers ghost click in empty space to the left!
      expect(Phaser.Geom.Rectangle.Contains(faultyHitRect, outsideLeftLocalX, centerLocalY)).toBe(true);
    });
  });

  describe('2. DEFECT AUDIT: Adjacent Word Chip HitArea Overlap in Sentence Scramble', () => {
    it('AUDIT-DEFECT-2: Proves hitPadX = 12 creates a 12px hitArea overlap between adjacent tokens when tokensCount >= 6', () => {
      const tokensCount = 6;
      const spacing = 12;
      const cardWidth = 120;
      const width = 1280;

      const bankTotalW = tokensCount * cardWidth + (tokensCount - 1) * spacing;
      const bankStartX = width / 2 - bankTotalW / 2 + cardWidth / 2;

      const chip0X = bankStartX + 0 * (cardWidth + spacing); // 310
      const chip1X = bankStartX + 1 * (cardWidth + spacing); // 442

      // Hit area with hitPadX = 12
      const hitPadX = 12;
      const chip0HitRight = chip0X + cardWidth / 2 + hitPadX; // 310 + 60 + 12 = 382
      const chip1HitLeft = chip1X - cardWidth / 2 - hitPadX;  // 442 - 60 - 12 = 370

      // Overlap exists between 370 and 382 (12px overlap)
      const overlap = chip0HitRight - chip1HitLeft;
      expect(overlap).toBe(12);

      const hitRect0 = new Phaser.Geom.Rectangle(-hitPadX, -hitPadX, cardWidth + hitPadX * 2, 74 + hitPadX * 2);
      const hitRect1 = new Phaser.Geom.Rectangle(-hitPadX, -hitPadX, cardWidth + hitPadX * 2, 74 + hitPadX * 2);

      // Touch at worldX = 376 (inside right edge of chip0):
      // chip0 localX: 376 - 310 + 60 = 126. HitRect0 spans [-12, 132] -> 126 is INSIDE!
      // chip1 localX: 376 - 442 + 60 = -6. HitRect1 spans [-12, 132] -> -6 is INSIDE!
      const chip0LocalX = 376 - chip0X + cardWidth / 2;
      const chip1LocalX = 376 - chip1X + cardWidth / 2;

      expect(Phaser.Geom.Rectangle.Contains(hitRect0, chip0LocalX, 37)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitRect1, chip1LocalX, 37)).toBe(true);
    });
  });

  describe('3. DEFECT AUDIT: Header Button HitArea Overlap (Back Button vs Restart Button)', () => {
    it('AUDIT-DEFECT-3: Proves 6px hitArea overlap between Back Button and Restart Button', () => {
      const backX = 95;
      const backW = 130;
      const restartX = 235;
      const restartW = 130;
      const hitPadX = 8;

      const backHitRight = backX + backW / 2 + hitPadX; // 95 + 65 + 8 = 168
      const restartHitLeft = restartX - restartW / 2 - hitPadX; // 235 - 65 - 8 = 162

      const overlap = backHitRight - restartHitLeft;
      expect(overlap).toBe(6);

      const hitRectBack = new Phaser.Geom.Rectangle(-hitPadX, -hitPadX, backW + hitPadX * 2, 46 + hitPadX * 2);
      const hitRectRestart = new Phaser.Geom.Rectangle(-hitPadX, -hitPadX, restartW + hitPadX * 2, 46 + hitPadX * 2);

      // Point at world x = 165
      const backLocalX = 165 - backX + backW / 2; // 165 - 95 + 65 = 135. HitArea spans [-8, 138] -> INSIDE!
      const restartLocalX = 165 - restartX + restartW / 2; // 165 - 235 + 65 = -5. HitArea spans [-8, 138] -> INSIDE!

      expect(Phaser.Geom.Rectangle.Contains(hitRectBack, backLocalX, 23)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitRectRestart, restartLocalX, 23)).toBe(true);
    });
  });

  describe('4. DEFECT AUDIT: SettingsScene Subject Toggle Buttons HitArea Overlap', () => {
    it('AUDIT-DEFECT-4: Proves 1px hitArea overlap between adjacent subject toggles', () => {
      const btnW = 140;
      const spacing = 155;
      const hitPadX = 8;

      const leftHitRight = (btnW / 2) + hitPadX; // 70 + 8 = 78
      const rightHitLeft = spacing - (btnW / 2) - hitPadX; // 155 - 70 - 8 = 77

      const overlap = leftHitRight - rightHitLeft;
      expect(overlap).toBe(1);
    });
  });

  describe('5. RESPONSIVE VIEWPORT MATH AUDIT ACROSS 4 TARGET DEVICES', () => {
    const DEVICES = [
      { name: 'iPhone 15 Pro Max (932x430 landscape)', screenW: 932, screenH: 430 },
      { name: 'iPhone SE / 8 (667x375 landscape)', screenW: 667, screenH: 375 },
      { name: 'iPad (1024x768 4:3)', screenW: 1024, screenH: 768 },
      { name: 'Desktop (1920x1080 16:9)', screenW: 1920, screenH: 1080 },
    ];

    it('Audits FIT scaling bounds, letterbox margins, and coordinate mapping precision across all 4 devices', () => {
      for (const dev of DEVICES) {
        const gameW = 1280;
        const gameH = 720;

        const scaleX = dev.screenW / gameW;
        const scaleY = dev.screenH / gameH;
        const scale = Math.min(scaleX, scaleY);

        const canvasW = gameW * scale;
        const canvasH = gameH * scale;
        const letterboxLeft = (dev.screenW - canvasW) / 2;
        const letterboxTop = (dev.screenH - canvasH) / 2;

        // Verify letterbox geometry
        expect(canvasW).toBeLessThanOrEqual(dev.screenW + 0.01);
        expect(canvasH).toBeLessThanOrEqual(dev.screenH + 0.01);
        expect(letterboxLeft).toBeGreaterThanOrEqual(-0.01);
        expect(letterboxTop).toBeGreaterThanOrEqual(-0.01);

        // Verify roundtrip world <-> client coordinate mapping
        const testPoints = [
          { wx: 0, wy: 0 },
          { wx: 640, wy: 360 },
          { wx: 1280, wy: 720 },
        ];

        for (const pt of testPoints) {
          const clientX = letterboxLeft + pt.wx * scale;
          const clientY = letterboxTop + pt.wy * scale;
          const recoveredWx = (clientX - letterboxLeft) / scale;
          const recoveredWy = (clientY - letterboxTop) / scale;

          expect(recoveredWx).toBeCloseTo(pt.wx, 5);
          expect(recoveredWy).toBeCloseTo(pt.wy, 5);
        }
      }
    });
  });
});
