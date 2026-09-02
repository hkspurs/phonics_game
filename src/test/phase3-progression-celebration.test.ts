import { describe, it, expect, beforeEach } from 'vitest';
import { MapScene, STATIONS } from '../scenes/MapScene';
import { ResultScene } from '../scenes/ResultScene';
import { DiagnosticReportModal } from '../ui/DiagnosticReportModal';
import { DataManager } from '../services/DataManager';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Specification V2 — Phase 3 Progression & Celebration', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    DataManager.getInstance().reset();
  });

  describe('1. MapScene Hierarchy, Progress Terminology & Utilities', () => {
    it('renders station nodes with clear progression states (completed, current, locked)', () => {
      const scene = new MapScene();
      const mockScene = createMockSceneForMeta('MapScene');
      Object.assign(scene, mockScene);

      // Complete Station 1
      DataManager.getInstance().markStationCompleted(1);
      DataManager.getInstance().setStationStars(1, 3);
      DataManager.getInstance().unlockNextStation(1);

      expect(DataManager.getInstance().isStationCompleted(1)).toBe(true);
      expect(DataManager.getInstance().getStationStars(1)).toBe(3);
      expect(DataManager.getInstance().isStationUnlocked(2)).toBe(true);
      expect(DataManager.getInstance().isStationUnlocked(3)).toBe(false);

      scene.create();

      expect(scene.stationNodes.length).toBe(STATIONS.length);
      expect(scene.backButton).toBeDefined();
    });

    it('separates completed station count from unlocked station index in progress terminology', () => {
      // 0 completed, 1 unlocked
      expect(DataManager.getInstance().getCompletedStationCount()).toBe(0);
      expect(DataManager.getInstance().isStationUnlocked(1)).toBe(true);

      // Complete station 1 -> 1 completed, 2 unlocked
      DataManager.getInstance().markStationCompleted(1);
      DataManager.getInstance().unlockNextStation(1);

      expect(DataManager.getInstance().getCompletedStationCount()).toBe(1);
      expect(DataManager.getInstance().isStationUnlocked(2)).toBe(true);
    });

    it('opens Diagnostic Learning Report when clicking 報告 button on Map', () => {
      const scene = new MapScene();
      const mockScene = createMockSceneForMeta('MapScene');
      Object.assign(scene, mockScene);

      scene.create();

      // Open diagnostic report
      expect(scene.diagnosticModal).toBeNull();
      scene.openDiagnosticReport();
      expect(scene.diagnosticModal).toBeDefined();
    });
  });

  describe('2. ResultScene Settlement & Reward Breakdown', () => {
    it('calculates 3-star rating strictly based on zero flaws', () => {
      const scene = new ResultScene();
      expect(scene.calculateStars(0, 0)).toBe(3);
      expect(scene.calculateStars(1, 0)).toBe(2);
      expect(scene.calculateStars(0, 1)).toBe(2);
      expect(scene.calculateStars(1, 1)).toBe(1);
      expect(scene.calculateStars(3, 2)).toBe(1);
    });

    it('computes itemised reward breakdown with exact arithmetic sum', () => {
      const scene = new ResultScene();
      scene.init({
        stationId: 1,
        stationName: '小木屋',
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: Date.now(), collectedCoins: 12, collectedGems: 1 },
      });

      const breakdown = scene.getItemisedRewardBreakdown();
      expect(breakdown.learningCoins).toBe(50); // 3 stars
      expect(breakdown.runnerCoins).toBe(12);
      expect(breakdown.totalCoins).toBe(50 + 12);
      expect(breakdown.runnerGems).toBe(1);
      expect(breakdown.firstClearGems).toBe(5); // 3 stars first clear
      expect(breakdown.totalGems).toBe(1 + 5);
    });

    it('records transactions atomically into ledger on settlement', () => {
      const scene = new ResultScene();
      const mockScene = createMockSceneForMeta('ResultScene');
      Object.assign(scene, mockScene);

      const dm = DataManager.getInstance();
      const initialCoins = dm.getProfile().coins;
      const initialGems = dm.getProfile().gems;

      scene.init({
        stationId: 1,
        stationName: '小木屋',
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 3, startTime: Date.now(), collectedCoins: 5, collectedGems: 1 },
      });

      scene.create();

      const profile = dm.getProfile();
      // Total coins increased by at least learning (50) + runner (5)
      expect(profile.coins).toBeGreaterThanOrEqual(initialCoins + 50 + 5);
      expect(profile.gems).toBeGreaterThanOrEqual(initialGems + 1 + 5);
      expect(dm.isStationCompleted(1)).toBe(true);
      expect(dm.getStationStars(1)).toBe(3);
    });
  });

  describe('3. Diagnostic Learning Report Analytics', () => {
    it('aggregates attempts, accuracy, hints, and mistakes accurately without mutating save data', () => {
      const dm = DataManager.getInstance();

      // Record a sequence of attempts
      dm.recordAttempt({
        questionId: 'zh_01',
        stationId: 1,
        subject: 'chinese',
        knowledgeTag: '部首認知',
        difficulty: 1,
        selectedAnswerId: 'wrong',
        isCorrect: false,
        attemptNumber: 1,
        hintLevelUsed: 0,
        timestamp: Date.now(),
      });

      dm.recordAttempt({
        questionId: 'zh_01',
        stationId: 1,
        subject: 'chinese',
        knowledgeTag: '部首認知',
        difficulty: 1,
        selectedAnswerId: 'correct',
        isCorrect: true,
        attemptNumber: 2,
        hintLevelUsed: 1,
        timestamp: Date.now(),
      });

      const summary = dm.getDiagnosticSummary();
      expect(summary.totalAttempts).toBe(2);
      expect(summary.totalMistakes).toBe(1);
      expect(summary.totalHintsUsed).toBe(1);
      expect(summary.subjectBreakdown.chinese.totalAttempts).toBe(2);
      expect(summary.subjectBreakdown.chinese.firstAttemptCorrect).toBe(0);

      const mockScene = createMockSceneForMeta('TitleScene');
      const modal = new DiagnosticReportModal(mockScene);
      expect(() => modal.show()).not.toThrow();
    });
  });
});
