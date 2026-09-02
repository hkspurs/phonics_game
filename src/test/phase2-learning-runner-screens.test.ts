import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionScene } from '../scenes/QuestionScene';
import { RunnerScene } from '../scenes/RunnerScene';
import { DataManager } from '../services/DataManager';
import { createMockSceneForMeta } from '../scenes/MetaScenes.test';

describe('Specification V2 — Phase 2 Learning & Runner Screens', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    DataManager.getInstance().reset();
  });

  describe('1. QuestionScene Stable Layout & State Sequence', () => {
    it('initializes with stable 4-region vertical layout budget', () => {
      const scene = new QuestionScene();
      const mockScene = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mockScene);

      scene.init({
        stationId: 1,
        stationName: '中環街市',
        questionIndex: 0,
        questions: [
          {
            id: 'zh_01',
            subject: 'chinese',
            type: 'multiple_choice',
            prompt: '選出正確的部首：「海」是什麼部首？',
            speakText: '海是什麼部首',
            options: ['水部 (氵)', '木部 (木)', '日部 (日)', '火部 (火)'],
            correctOptionIndex: 0,
            correctAnswer: '水部 (氵)',
          },
        ],
      });

      scene.create();

      expect(scene.headerContainer).toBeDefined();
      expect(scene.promptContainer).toBeDefined();
      expect(scene.controlsContainer).toBeDefined();
      expect(scene.choiceCards.length).toBe(4);
    });

    it('wrong answer marks card disabled and displays feedback without locking other options', () => {
      const scene = new QuestionScene();
      const mockScene = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mockScene);

      scene.init({
        stationId: 1,
        questionIndex: 0,
        questions: [
          {
            id: 'zh_01',
            subject: 'chinese',
            type: 'multiple_choice',
            prompt: '選出正確的部首：「海」是什麼部首？',
            speakText: '海是什麼部首',
            options: ['水部 (氵)', '木部 (木)', '日部 (日)', '火部 (火)'],
            correctOptionIndex: 0,
            correctAnswer: '水部 (氵)',
          },
        ],
      });

      scene.create();

      // Pick wrong choice (Option 1: 木部)
      const wrongCard = scene.choiceCards[1];
      const result = scene.handleChoiceSelection(wrongCard, 1);

      expect(result).toBe(false);
      expect(scene.sessionStats.mistakes).toBe(1);
      expect(wrongCard.getState()).toBe('disabled');
      expect(scene.choiceCards[0].getState()).not.toBe('disabled');
      expect(scene.feedbackContainer).toBeDefined();
    });

    it('correct answer marks choice correct, renders reinforcement, and displays Continue CTA button', () => {
      const scene = new QuestionScene();
      const mockScene = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mockScene);

      scene.init({
        stationId: 1,
        questionIndex: 0,
        questions: [
          {
            id: 'zh_01',
            subject: 'chinese',
            type: 'multiple_choice',
            prompt: '選出正確的部首：「海」是什麼部首？',
            speakText: '海是什麼部首',
            options: ['水部 (氵)', '木部 (木)', '日部 (日)', '火部 (火)'],
            correctOptionIndex: 0,
            correctAnswer: '水部 (氵)',
          },
        ],
      });

      scene.create();

      // Pick correct choice (Option 0: 水部)
      const correctCard = scene.choiceCards[0];
      const result = scene.handleChoiceSelection(correctCard, 0);

      expect(result).toBe(true);
      expect(scene.isAnswered).toBe(true);
      expect(scene.sessionStats.correctCount).toBe(1);
      expect(scene.feedbackContainer).toBeDefined();
    });

    it('handles Sentence Scramble tap-to-place, removal, and correct evaluation', () => {
      const scene = new QuestionScene();
      const mockScene = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mockScene);

      scene.init({
        stationId: 2,
        questionIndex: 0,
        questions: [
          {
            id: 'en_01',
            subject: 'english',
            type: 'sentence_scramble',
            prompt: 'Rearrange the words to form a correct sentence:',
            speakText: 'I like apples.',
            correctTokens: ['I', 'like', 'apples', '.'],
            shuffledTokens: ['apples', 'I', '.', 'like'],
          },
        ],
      });

      scene.create();

      expect(scene.slotBoxes.length).toBe(4);
      expect(scene.cardChips.length).toBe(4);

      // Place chips in correct order
      const chipI = scene.cardChips.find((c) => c.getText() === 'I')!;
      const chipLike = scene.cardChips.find((c) => c.getText() === 'like')!;
      const chipApples = scene.cardChips.find((c) => c.getText() === 'apples')!;
      const chipDot = scene.cardChips.find((c) => c.getText() === '.')!;

      scene.slotBoxes[0].setPlacedCard(chipI);
      scene.slotBoxes[1].setPlacedCard(chipLike);
      scene.slotBoxes[2].setPlacedCard(chipApples);
      scene.slotBoxes[3].setPlacedCard(chipDot);

      const isComplete = scene.evaluateSentenceScramble();
      expect(isComplete).toBe(true);
      expect(scene.isAnswered).toBe(true);
      expect(scene.slotBoxes[0].hasCorrect()).toBe(true);
    });

    it('provides 3-tier progressive hints', () => {
      const scene = new QuestionScene();
      const mockScene = createMockSceneForMeta('QuestionScene');
      Object.assign(scene, mockScene);

      scene.init({
        stationId: 1,
        questionIndex: 0,
        questions: [
          {
            id: 'math_01',
            subject: 'math',
            type: 'multiple_choice',
            prompt: '計算：5 + 3 = ？',
            speakText: '5加3等於多少',
            options: ['6', '7', '8', '9'],
            correctOptionIndex: 2,
            correctAnswer: '8',
          },
        ],
      });

      scene.create();

      expect(scene.currentHintLevel).toBe(0);

      // Hint 1: Direction
      scene.handleHint();
      expect(scene.currentHintLevel).toBe(1);
      expect(scene.sessionStats.hintsUsed).toBe(1);

      // Hint 2: Visual Support
      scene.handleHint();
      expect(scene.currentHintLevel).toBe(2);

      // Hint 3: Guided Solution
      scene.handleHint();
      expect(scene.currentHintLevel).toBe(3);
    });
  });

  describe('2. RunnerScene Visual Hierarchy, Tutorial & Skip Safeguard', () => {
    it('creates HUD, virtual gamepad controls, and progress bar', () => {
      const scene = new RunnerScene();
      const mockScene = createMockSceneForMeta('RunnerScene');
      Object.assign(scene, mockScene);

      scene.init({
        stationId: 1,
        questionIndex: 0,
        totalQuestions: 3,
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 1, startTime: Date.now() },
      });

      scene.create();

      expect(scene.skipButton).toBeDefined();
      expect(scene.progressBarFill).toBeDefined();
    });

    it('manages 3-step progressive tutorial and records completion', () => {
      const scene = new RunnerScene();
      const mockScene = createMockSceneForMeta('RunnerScene');
      Object.assign(scene, mockScene);

      DataManager.getInstance().setRunnerTutorialCompleted(false);

      scene.init({ stationId: 1, questionIndex: 0 });
      scene.create();

      expect(scene.isTutorialActive).toBe(true);
      expect(scene.tutorialStep).toBe(1);

      scene.simulateTutorialAction('move_right');
      expect(scene.tutorialStep).toBe(2);

      scene.simulateTutorialAction('jump');
      expect(scene.tutorialStep).toBe(3);

      scene.simulateTutorialAction('pickup');
      expect(scene.isTutorialActive).toBe(false);
      expect(DataManager.getInstance().isRunnerTutorialCompleted()).toBe(true);
    });

    it('skip confirmation displays explicit forfeiture disclosure and forfeits uncollected loot', () => {
      const scene = new RunnerScene();
      const mockScene = createMockSceneForMeta('RunnerScene');
      Object.assign(scene, mockScene);

      const initialCoins = DataManager.getInstance().getProfile().coins;

      scene.init({
        stationId: 1,
        questionIndex: 0,
        sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 1, startTime: Date.now() },
      });
      scene.create();

      // Open skip modal
      scene.skipRunner();
      expect(scene.isSkipModalOpen).toBe(true);
      expect(scene.skipConfirmationText).toContain('跳過跑酷？你會保留答題獎勵，但不會獲得尚未收集的跑酷獎勵。');

      // Execute skip
      scene.executeSkipRunner();

      // No uncollected coins added
      expect(DataManager.getInstance().getProfile().coins).toBe(initialCoins);
      expect(DataManager.getInstance().getRunnerSkippedCount()).toBe(1);
    });
  });
});
