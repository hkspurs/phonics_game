import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasCard } from '../ui/CanvasCard';
import { SlotBox } from '../ui/SlotBox';
import { PlayerAvatarBadge } from '../ui/PlayerAvatarBadge';
import { createMockTestScene } from './gamer-tester-1-token-slot-glitch-hunter.test';

describe('Button HitArea, Touch Coordinate & Viewport Offset Auditor', () => {
  let mockScene: Phaser.Scene;

  beforeEach(() => {
    mockScene = createMockTestScene();
  });

  // =========================================================================
  // 1. CANVAS BUTTON HITAREA GEOMETRY & CORNER HIT-TESTING
  // =========================================================================
  describe('CanvasButton: 9-Point & 4-Corner HitArea Verification', () => {
    it('verifies standard rectangle CanvasButton (200x60) triggers on all 4 corners, 4 edges, and center', () => {
      const btnW = 200;
      const btnH = 60;
      const hitPadX = 8;
      const hitPadY = 8;

      const button = new CanvasButton(mockScene, {
        x: 640,
        y: 360,
        width: btnW,
        height: btnH,
        text: '冒險開始',
      });

      expect(button.isInteractive()).toBe(true);
      expect(button.getButtonWidth()).toBe(btnW);
      expect(button.getButtonHeight()).toBe(btnH);

      const hitArea = button.getHitArea();
      expect(hitArea).toBeDefined();

      if (hitArea) {
        // Geometric exactness
        expect(hitArea.x).toBe(-btnW / 2 - hitPadX); // -108
        expect(hitArea.y).toBe(-btnH / 2 - hitPadY); // -38
        expect(hitArea.width).toBe(btnW + hitPadX * 2); // 216
        expect(hitArea.height).toBe(btnH + hitPadY * 2); // 76

        // 1. Center
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 0)).toBe(true);
        expect(button.containsPoint(0, 0)).toBe(true);

        // 2. 4 Exact Visual Corners
        const corners = [
          { name: 'Top-Left Visual Corner', x: -btnW / 2, y: -btnH / 2 },
          { name: 'Top-Right Visual Corner', x: btnW / 2, y: -btnH / 2 },
          { name: 'Bottom-Left Visual Corner', x: -btnW / 2, y: btnH / 2 },
          { name: 'Bottom-Right Visual Corner', x: btnW / 2, y: btnH / 2 },
        ];

        for (const pt of corners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be contained in hitArea`).toBe(true);
          expect(button.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be contained in button bounds`).toBe(true);
        }

        // 3. 2px Inside 4 Corners
        const insideCorners = [
          { name: '2px Inside Top-Left', x: -btnW / 2 + 2, y: -btnH / 2 + 2 },
          { name: '2px Inside Top-Right', x: btnW / 2 - 2, y: -btnH / 2 + 2 },
          { name: '2px Inside Bottom-Left', x: -btnW / 2 + 2, y: btnH / 2 - 2 },
          { name: '2px Inside Bottom-Right', x: btnW / 2 - 2, y: btnH / 2 - 2 },
        ];

        for (const pt of insideCorners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(button.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside button bounds`).toBe(true);
        }

        // 4. 4 Edges
        const edges = [
          { name: 'Left Edge Center', x: -btnW / 2, y: 0 },
          { name: 'Right Edge Center', x: btnW / 2, y: 0 },
          { name: 'Top Edge Center', x: 0, y: -btnH / 2 },
          { name: 'Bottom Edge Center', x: 0, y: btnH / 2 },
        ];

        for (const pt of edges) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(button.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside button bounds`).toBe(true);
        }

        // 5. Generous +8px Touch Margin Padding Corners
        const paddedCorners = [
          { name: 'Outer Padded Top-Left', x: -btnW / 2 - 7, y: -btnH / 2 - 7 },
          { name: 'Outer Padded Top-Right', x: btnW / 2 + 7, y: -btnH / 2 - 7 },
          { name: 'Outer Padded Bottom-Left', x: -btnW / 2 - 7, y: btnH / 2 + 7 },
          { name: 'Outer Padded Bottom-Right', x: btnW / 2 + 7, y: btnH / 2 + 7 },
        ];

        for (const pt of paddedCorners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must trigger with touch padding`).toBe(true);
          expect(button.containsPoint(pt.x, pt.y, true), `${pt.name} (${pt.x}, ${pt.y}) must be within padded containsPoint`).toBe(true);
        }

        // 6. Deadzones Outside HitArea
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -btnW / 2 - 12, 0)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, btnW / 2 + 12, 0)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, -btnH / 2 - 12)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, btnH / 2 + 12)).toBe(false);
      }
    });

    it('verifies round circular CanvasButton (60x60) triggers on corners and edges', () => {
      const button = new CanvasButton(mockScene, {
        x: 100,
        y: 100,
        variant: 'round',
        width: 60,
        height: 60,
        text: '✕',
      });

      const hitArea = button.getHitArea();
      expect(hitArea).toBeDefined();

      if (hitArea) {
        expect(hitArea.x).toBe(-38);
        expect(hitArea.y).toBe(-38);
        expect(hitArea.width).toBe(76);
        expect(hitArea.height).toBe(76);

        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 0)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -30, -30)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 30, -30)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -30, 30)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 30, 30)).toBe(true);
      }
    });
  });

  // =========================================================================
  // 2. CANVAS CARD HITAREA GEOMETRY & CORNER HIT-TESTING
  // =========================================================================
  describe('CanvasCard: 9-Point & 4-Corner HitArea Verification', () => {
    it('verifies CanvasCard (140x64) triggers on all 4 corners, 4 edges, and center with +12px padding', () => {
      const cardW = 140;
      const cardH = 64;
      const hitPadX = 12;
      const hitPadY = 12;

      const card = new CanvasCard(mockScene, {
        x: 400,
        y: 300,
        width: cardW,
        height: cardH,
        text: '小貓',
      });

      expect(card.isInteractive()).toBe(true);
      expect(card.getCardWidth()).toBe(cardW);
      expect(card.getCardHeight()).toBe(cardH);

      const hitArea = card.getHitArea();
      expect(hitArea).toBeDefined();

      if (hitArea) {
        expect(hitArea.x).toBe(-cardW / 2 - hitPadX); // -70 - 12 = -82
        expect(hitArea.y).toBe(-cardH / 2 - hitPadY); // -32 - 12 = -44
        expect(hitArea.width).toBe(cardW + hitPadX * 2); // 164
        expect(hitArea.height).toBe(cardH + hitPadY * 2); // 88

        // 1. Center
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 0)).toBe(true);
        expect(card.containsPoint(0, 0)).toBe(true);

        // 2. 4 Visual Corners
        const corners = [
          { name: 'Top-Left Visual Corner', x: -cardW / 2, y: -cardH / 2 },
          { name: 'Top-Right Visual Corner', x: cardW / 2, y: -cardH / 2 },
          { name: 'Bottom-Left Visual Corner', x: -cardW / 2, y: cardH / 2 },
          { name: 'Bottom-Right Visual Corner', x: cardW / 2, y: cardH / 2 },
        ];

        for (const pt of corners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(card.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside card bounds`).toBe(true);
        }

        // 3. 2px Inside 4 Corners
        const insideCorners = [
          { name: '2px Inside Top-Left', x: -cardW / 2 + 2, y: -cardH / 2 + 2 },
          { name: '2px Inside Top-Right', x: cardW / 2 - 2, y: -cardH / 2 + 2 },
          { name: '2px Inside Bottom-Left', x: -cardW / 2 + 2, y: -cardH / 2 + 2 },
          { name: '2px Inside Bottom-Right', x: cardW / 2 - 2, y: -cardH / 2 + 2 },
        ];

        for (const pt of insideCorners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(card.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside card bounds`).toBe(true);
        }

        // 4. 4 Edges
        const edges = [
          { name: 'Left Edge Center', x: -cardW / 2, y: 0 },
          { name: 'Right Edge Center', x: cardW / 2, y: 0 },
          { name: 'Top Edge Center', x: 0, y: -cardH / 2 },
          { name: 'Bottom Edge Center', x: 0, y: cardH / 2 },
        ];

        for (const pt of edges) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(card.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside card bounds`).toBe(true);
        }

        // 5. Outer Padded Corners (+10px padding)
        const paddedCorners = [
          { name: 'Outer Padded Top-Left', x: -cardW / 2 - 10, y: -cardH / 2 - 10 },
          { name: 'Outer Padded Top-Right', x: cardW / 2 + 10, y: -cardH / 2 - 10 },
          { name: 'Outer Padded Bottom-Left', x: -cardW / 2 - 10, y: cardH / 2 + 10 },
          { name: 'Outer Padded Bottom-Right', x: cardW / 2 + 10, y: cardH / 2 + 10 },
        ];

        for (const pt of paddedCorners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must trigger with touch padding`).toBe(true);
        }

        // 6. Deadzones Outside HitArea
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -cardW / 2 - 20, 0)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, cardW / 2 + 20, 0)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, -cardH / 2 - 20)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, cardH / 2 + 20)).toBe(false);
      }
    });
  });

  // =========================================================================
  // 3. SLOTBOX HITAREA GEOMETRY & CORNER HIT-TESTING
  // =========================================================================
  describe('SlotBox: 9-Point & 4-Corner HitArea Verification', () => {
    it('verifies SlotBox (140x64) has centered hitArea covering all 4 visual corners and edges', () => {
      const slotW = 140;
      const slotH = 64;
      const hitPadX = 8;
      const hitPadY = 8;

      const slot = new SlotBox(mockScene, {
        x: 500,
        y: 270,
        width: slotW,
        height: slotH,
        index: 0,
      });

      expect(slot.isInteractive()).toBe(true);
      expect(slot.getSlotWidth()).toBe(slotW);
      expect(slot.getSlotHeight()).toBe(slotH);

      const hitArea = slot.getHitArea();
      expect(hitArea).toBeDefined();

      if (hitArea) {
        expect(hitArea.x).toBe(-slotW / 2 - hitPadX); // -78
        expect(hitArea.y).toBe(-slotH / 2 - hitPadY); // -40
        expect(hitArea.width).toBe(slotW + hitPadX * 2); // 156
        expect(hitArea.height).toBe(slotH + hitPadY * 2); // 80

        // 1. Center
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 0)).toBe(true);
        expect(slot.containsPoint(0, 0)).toBe(true);

        // 2. 4 Visual Corners
        const corners = [
          { name: 'Top-Left Visual Corner', x: -slotW / 2, y: -slotH / 2 },
          { name: 'Top-Right Visual Corner', x: slotW / 2, y: -slotH / 2 },
          { name: 'Bottom-Left Visual Corner', x: -slotW / 2, y: slotH / 2 },
          { name: 'Bottom-Right Visual Corner', x: slotW / 2, y: slotH / 2 },
        ];

        for (const pt of corners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(slot.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside slot bounds`).toBe(true);
        }

        // 3. 2px Inside 4 Corners
        const insideCorners = [
          { name: '2px Inside Top-Left', x: -slotW / 2 + 2, y: -slotH / 2 + 2 },
          { name: '2px Inside Top-Right', x: slotW / 2 - 2, y: -slotH / 2 + 2 },
          { name: '2px Inside Bottom-Left', x: -slotW / 2 + 2, y: slotH / 2 - 2 },
          { name: '2px Inside Bottom-Right', x: slotW / 2 - 2, y: slotH / 2 - 2 },
        ];

        for (const pt of insideCorners) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(slot.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside slot bounds`).toBe(true);
        }

        // 4. 4 Edges
        const edges = [
          { name: 'Left Edge Center', x: -slotW / 2, y: 0 },
          { name: 'Right Edge Center', x: slotW / 2, y: 0 },
          { name: 'Top Edge Center', x: 0, y: -slotH / 2 },
          { name: 'Bottom Edge Center', x: 0, y: slotH / 2 },
        ];

        for (const pt of edges) {
          expect(Phaser.Geom.Rectangle.Contains(hitArea, pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside hitArea`).toBe(true);
          expect(slot.containsPoint(pt.x, pt.y), `${pt.name} (${pt.x}, ${pt.y}) must be inside slot bounds`).toBe(true);
        }

        // 5. Deadzones Outside HitArea
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -slotW / 2 - 15, 0)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, slotW / 2 + 15, 0)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, -slotH / 2 - 15)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, slotH / 2 + 15)).toBe(false);
      }
    });
  });

  // =========================================================================
  // 4. PLAYER AVATAR BADGE HITAREA GEOMETRY
  // =========================================================================
  describe('PlayerAvatarBadge: Centered Circular/Rectangular HitArea', () => {
    it('verifies PlayerAvatarBadge container has centered hitArea covering all 4 quadrants', () => {
      const onClick = vi.fn();
      const badge = new PlayerAvatarBadge(mockScene, {
        x: 100,
        y: 100,
        size: 56,
        interactive: true,
        onClick,
      });

      const hitArea = badge.container.input?.hitArea as Phaser.Geom.Rectangle;
      expect(hitArea).toBeDefined();

      if (hitArea) {
        // Radius is 28 + 4 = 32
        expect(hitArea.x).toBe(-32);
        expect(hitArea.y).toBe(-32);
        expect(hitArea.width).toBe(64);
        expect(hitArea.height).toBe(64);

        // Center
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 0)).toBe(true);

        // 4 Visual Corners of Badge
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -28, -28)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 28, -28)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -28, 28)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 28, 28)).toBe(true);

        // 4 Edges
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -28, 0)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 28, 0)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, -28)).toBe(true);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 28)).toBe(true);

        // Outside
        expect(Phaser.Geom.Rectangle.Contains(hitArea, -40, 0)).toBe(false);
        expect(Phaser.Geom.Rectangle.Contains(hitArea, 40, 0)).toBe(false);
      }
    });
  });

  // =========================================================================
  // 5. MATHEMATICAL PROOF & REGRESSION AGAINST QUADRANT SHIFTS
  // =========================================================================
  describe('Mathematical Proof: Root Cause & Fix for Container HitArea Shift', () => {
    it('proves that a shifted hitRect Rectangle(0, 0, W, H) creates 100% deadzone in Top-Left quadrant', () => {
      const W = 200;
      const H = 60;

      // Faulty definition: starts at (0, 0)
      const faultyShiftedHitRect = new Phaser.Geom.Rectangle(0, 0, W, H);

      // Top-Left corner relative to centered container origin (0, 0) is (-100, -30)
      const topLeftVisualX = -W / 2;
      const topLeftVisualY = -H / 2;
      const leftEdgeVisualX = -W / 2;
      const leftEdgeVisualY = 0;
      const topEdgeVisualX = 0;
      const topEdgeVisualY = -H / 2;

      // PROOF: Faulty shifted hitRect fails on ALL top, left, and top-left coordinates!
      expect(Phaser.Geom.Rectangle.Contains(faultyShiftedHitRect, topLeftVisualX, topLeftVisualY)).toBe(false);
      expect(Phaser.Geom.Rectangle.Contains(faultyShiftedHitRect, leftEdgeVisualX, leftEdgeVisualY)).toBe(false);
      expect(Phaser.Geom.Rectangle.Contains(faultyShiftedHitRect, topEdgeVisualX, topEdgeVisualY)).toBe(false);

      // And it erroneously registers phantom clicks far outside the bottom-right (+150, +45):
      expect(Phaser.Geom.Rectangle.Contains(faultyShiftedHitRect, W / 2 + 50, H / 2 + 15)).toBe(true);

      // CORRECT centered definition: starts at (-W/2 - pad, -H/2 - pad)
      const pad = 8;
      const correctedHitRect = new Phaser.Geom.Rectangle(-W / 2 - pad, -H / 2 - pad, W + pad * 2, H + pad * 2);

      // PROOF: Corrected hitRect passes on all 4 quadrants with zero deadzones:
      expect(Phaser.Geom.Rectangle.Contains(correctedHitRect, topLeftVisualX, topLeftVisualY)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(correctedHitRect, -topLeftVisualX, topLeftVisualY)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(correctedHitRect, topLeftVisualX, -topLeftVisualY)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(correctedHitRect, -topLeftVisualX, -topLeftVisualY)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(correctedHitRect, 0, 0)).toBe(true);

      // And correctly rejects phantom clicks outside:
      expect(Phaser.Geom.Rectangle.Contains(correctedHitRect, W / 2 + 50, H / 2 + 15)).toBe(false);
    });
  });
});
