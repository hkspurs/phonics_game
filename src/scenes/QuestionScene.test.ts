import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import { QuestionScene, QuestionSceneInitData } from './QuestionScene';
import { QuizQuestion } from '../types';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';

function attachEventEmitter(obj: any): any {
  const listeners: Record<string, Function[]> = {};
  obj.on = vi.fn(function (ev: string, fn: Function) {
    (listeners[ev] = listeners[ev] || []).push(fn);
    return obj;
  });
  obj.once = vi.fn(function (ev: string, fn: Function, context?: any) {
    const wrapper = (...args: any[]) => {
      obj.off(ev, wrapper);
      fn.apply(context ?? obj, args);
    };
    (listeners[ev] = listeners[ev] || []).push(wrapper);
    return obj;
  });
  obj.off = vi.fn(function (ev: string, fn?: Function) {
    if (!fn) delete listeners[ev];
    else if (listeners[ev]) listeners[ev] = listeners[ev].filter((f: any) => f !== fn);
    return obj;
  });
  obj.removeListener = obj.off;
  obj.emit = vi.fn(function (ev: string, ...args: any[]) {
    (listeners[ev] || []).slice().forEach((fn: any) => fn(...args));
    return true;
  });
  obj.removeFromDisplayList = vi.fn().mockReturnThis();
  obj.addedToScene = vi.fn().mockReturnThis();
  return obj;
}

export function createMockQuestionScene(): any {
  const scene: any = {
    key: 'QuestionScene',
    sys: {
      settings: { key: 'QuestionScene' },
      game: {
        config: { width: 1280, height: 720 },
      },
      queueDepthSort: () => {},
      updateList: { add: () => {}, remove: () => {} },
      input: {
        enable: vi.fn(),
        disable: vi.fn(),
      },
    },
    scene: {
      key: 'QuestionScene',
      start: vi.fn(),
      stop: vi.fn(),
      launch: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    },
    events: attachEventEmitter({}),
    cameras: {
      main: {
        scrollX: 0,
        scrollY: 0,
        setBounds: vi.fn().mockReturnThis(),
        setScroll: vi.fn().mockReturnThis(),
        pan: vi.fn().mockReturnThis(),
      },
    },
    scale: {
      scaleMode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
      pageAlignHorizontally: false,
    },
    input: attachEventEmitter({
      setDraggable: vi.fn(),
    }),
    load: {
      audio: vi.fn(),
      image: vi.fn(),
      spritesheet: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
    },
    add: {
      existing: vi.fn((obj: any) => obj),
      container: vi.fn((x: number, y: number) => {
        const c = new (Phaser.GameObjects.Container as any)(scene, x, y);
        return c;
      }),
      graphics: vi.fn((config?: any) => {
        const g: any = {
          x: config?.x ?? 0,
          y: config?.y ?? 0,
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillGradientStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillEllipse: vi.fn().mockReturnThis(),
          fillTriangle: vi.fn().mockReturnThis(),
          strokeTriangle: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          lineBetween: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(g);
      }),
      text: vi.fn((x: number, y: number, text: string, style?: any) => {
        const t: any = {
          x,
          y,
          text,
          style: style || {},
          originX: 0,
          originY: 0,
          setOrigin: vi.fn(function (ox = 0.5, oy = 0.5) {
            t.originX = ox;
            t.originY = oy;
            return t;
          }),
          setText: vi.fn(function (val: string) {
            t.text = val;
            return t;
          }),
          setColor: vi.fn(function (val: string) {
            if (t.style) t.style.color = val;
            return t;
          }),
          setFontSize: vi.fn().mockReturnThis(),
          setFontFamily: vi.fn().mockReturnThis(),
          setShadow: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(t);
      }),
      rectangle: vi.fn((x: number, y: number, width: number, height: number, fillColor = 0, fillAlpha = 1) => {
        const r: any = {
          x,
          y,
          width,
          height,
          fillColor,
          fillAlpha,
          originX: 0.5,
          originY: 0.5,
          setOrigin: vi.fn(function (ox = 0.5, oy = 0.5) {
            r.originX = ox;
            r.originY = oy;
            return r;
          }),
          setInteractive: vi.fn().mockReturnThis(),
          disableInteractive: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(r);
      }),
    },
    tweens: {
      add: vi.fn((config: any) => {
        if (config?.onComplete) {
          // Keep callback available
        }
        return { stop: vi.fn(), remove: vi.fn() };
      }),
      killTweensOf: vi.fn(),
    },
    sound: {
      play: vi.fn(),
      setVolume: vi.fn(),
    },
    time: {
      delayedCall: vi.fn((delay: number, callback: Function) => {
        if (delay >= 1000) {
          callback();
        }
        return { remove: vi.fn() };
      }),
    },
  };
  return scene;
}

describe('QuestionScene — Interactive Quiz Scene Suite', () => {
  let scene: QuestionScene;
  let mockScene: any;
  let dataManager: DataManager;

  const mockChineseSentenceQuestion: QuizQuestion = {
    id: 'test_zh_sentence_1',
    subject: 'chinese',
    type: 'sentence_scramble',
    prompt: '重組句子：請把字詞排列成通順的句子。',
    speakText: '姐姐在花園裡看書。',
    correctTokens: ['姐姐', '在', '花園裡', '看書', '。'],
    shuffledTokens: ['花園裡', '姐姐', '。', '看書', '在'],
    hintText: '提示：先找出人物「姐姐」',
  };

  const mockMathCalcQuestion: QuizQuestion = {
    id: 'test_math_1',
    subject: 'math',
    type: 'multiple_choice',
    prompt: '計算題：請選出正確的得數。 8 + 7 = ?',
    speakText: '8 加 7 等於多少？',
    options: [13, 14, 15, 16],
    correctOptionIndex: 2,
    correctAnswer: 15,
    hintText: '提示：8 + 7 = 15',
  };

  const mockEnglishSentenceQuestion: QuizQuestion = {
    id: 'test_en_sentence_1',
    subject: 'english',
    type: 'sentence_scramble',
    prompt: 'Sentence Scramble: Arrange words in order.',
    speakText: 'The cat is sleeping on the rug.',
    correctTokens: ['The', 'cat', 'is', 'sleeping', '.'],
    shuffledTokens: ['sleeping', 'cat', '.', 'The', 'is'],
    hintText: 'Hint: Starts with "The"',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    dataManager = DataManager.getInstance();
    dataManager.reset();

    mockScene = createMockQuestionScene();
    scene = new QuestionScene();
    Object.assign(scene, mockScene);

    SoundManager.init(mockScene);
    vi.spyOn(SoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(SpeechService, 'speak').mockImplementation(() => null as any);
  });

  afterEach(() => {
    dataManager.reset();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Lifecycle & Question Flow Initialization
  // =========================================================================
  describe('Lifecycle & Initialization', () => {
    it('initializes with default station and automatically generates 3 station questions', () => {
      scene.init();
      expect(scene.stationId).toBe(1);
      expect(scene.questionIndex).toBe(0);
      expect(scene.questions).toHaveLength(3);
      expect(scene.currentQuestion).toBeDefined();
      expect(scene.isAnswered).toBe(false);
      expect(scene.sessionStats.hintsUsed).toBe(0);
    });

    it('receives custom station payload with predefined questions and session stats', () => {
      const payload: QuestionSceneInitData = {
        stationId: 3,
        stationName: '櫻花樹',
        questionIndex: 1,
        questions: [mockChineseSentenceQuestion, mockMathCalcQuestion, mockEnglishSentenceQuestion],
        sessionStats: { hintsUsed: 1, mistakes: 0, correctCount: 1, startTime: 1000 },
      };

      scene.init(payload);

      expect(scene.stationId).toBe(3);
      expect(scene.stationName).toBe('櫻花樹');
      expect(scene.questionIndex).toBe(1);
      expect(scene.questions).toHaveLength(3);
      expect(scene.currentQuestion?.id).toBe('test_math_1');
      expect(scene.sessionStats.hintsUsed).toBe(1);
      expect(scene.sessionStats.correctCount).toBe(1);
    });

    it('normalizes legacy string station IDs so the question header keeps the map identity', () => {
      scene.init({
        stationId: 'st_central',
        questions: [mockChineseSentenceQuestion],
      });

      expect(scene.stationId).toBe(1);
      expect(scene.stationName).toBe('小木屋');
      scene.create();

      expect(scene.headerTitleText?.text).toContain('🏡 小木屋');
    });

    it('clamps questionIndex within valid bounds', () => {
      scene.init({
        stationId: 1,
        questionIndex: 99,
        questions: [mockChineseSentenceQuestion],
      });
      expect(scene.questionIndex).toBe(0);
    });
  });

  // =========================================================================
  // 2. Layout & UI Header Elements
  // =========================================================================
  describe('Layout & UI Header', () => {
    beforeEach(() => {
      scene.init({
        stationId: 3,
        stationName: '櫻花樹',
        questionIndex: 0,
        questions: [mockChineseSentenceQuestion, mockMathCalcQuestion, mockEnglishSentenceQuestion],
      });
      scene.create();
    });

    it('renders header with back button and station/level text', () => {
      expect(scene.backButton).toBeDefined();
      expect(scene.backButton?.getText()).toBe('◀ 返回地圖');
      expect(scene.headerTitleText?.text).toContain('第 3-1 關');
      expect(scene.headerTitleText?.text).toContain('櫻花樹・中文');
    });

    it('keeps the equipped avatar badge large enough to identify the wearing outfit', () => {
      expect(scene.avatarBadge?.size).toBe(88);
      const badge = scene.avatarBadge?.container as any;
      expect(badge.y - (scene.avatarBadge?.size ?? 0) / 2).toBeGreaterThanOrEqual(4);
      expect(badge.x + (scene.avatarBadge?.size ?? 0) / 2).toBeLessThanOrEqual(1264);
    });

    it('keeps the question UI but suppresses ambient loops for reduced motion', () => {
      (scene as any).prefersReducedMotion = true;
      mockScene.tweens.add.mockClear();
      (scene as any).createAmbientStars();

      const configs = mockScene.tweens.add.mock.calls.map(([config]: any[]) => config);
      expect(scene.currentQuestion).toBeDefined();
      expect(configs.some((config: any) => config.repeat === -1)).toBe(false);
    });

    it('renders question progress indicator', () => {
      expect(scene.progressCounterText?.text).toBe('第 1 / 3 題');
    });

    it('renders prompt banner with subject pill and speaker button', () => {
      expect(scene.promptText).toBeDefined();
      expect(scene.promptText?.text).toContain('重組句子');
      expect(scene.speakerButton).toBeDefined();
      expect(scene.speakerButton?.getText()).toBe('🔊 朗讀');
    });

    it('navigates back to MapScene when back button is clicked', () => {
      const stopSpeechSpy = vi.spyOn(SpeechService, 'stop');
      scene.backButton?.emit('pointerup');

      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(stopSpeechSpy).toHaveBeenCalled();
      expect(mockScene.scene.start).toHaveBeenCalledWith('MapScene');
    });

    it('triggers SpeechService with correct language when speaker button is clicked', () => {
      const speakSpy = vi.spyOn(SpeechService, 'speak');
      scene.speakerButton?.emit('pointerup');

      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(speakSpy).toHaveBeenCalledWith('重組句子：請把字詞排列成通順的句子。', 'zh-HK');
    });

    it('correctly maps English subject to en-US voice language', () => {
      const enScene = new QuestionScene();
      Object.assign(enScene, mockScene);
      enScene.init({
        questions: [mockEnglishSentenceQuestion],
      });
      expect(enScene.getVoiceLanguage()).toBe('en-US');
    });
  });

  // =========================================================================
  // 3. Mode A: Sentence Scramble Mode
  // =========================================================================
  describe('Mode A: Sentence Scramble', () => {
    beforeEach(() => {
      scene.init({
        stationId: 1,
        questionIndex: 0,
        questions: [mockChineseSentenceQuestion],
      });
      scene.create();
    });

    it('renders SlotBoxes matching the number of tokens', () => {
      expect(scene.slotBoxes).toHaveLength(5);
      expect(scene.slotBoxes[0].getExpectedValue()).toBe('姐姐');
      expect(scene.slotBoxes[1].getExpectedValue()).toBe('在');
      expect(scene.slotBoxes[2].getExpectedValue()).toBe('花園裡');
      expect(scene.slotBoxes[3].getExpectedValue()).toBe('看書');
      expect(scene.slotBoxes[4].getExpectedValue()).toBe('。');
    });

    it('renders Word Chips in bank with draggable and tappable enabled', () => {
      expect(scene.cardChips).toHaveLength(5);
      for (const card of scene.cardChips) {
        expect(card.getState()).toBe('normal');
      }
    });

    it('places chip into first empty slot on tap', () => {
      const firstChip = scene.cardChips[0]; // "花園裡"
      expect(scene.slotBoxes[0].hasCard()).toBe(false);

      scene.handleCardTap(firstChip);

      expect(SoundManager.play).toHaveBeenCalledWith('click');
      expect(scene.slotBoxes[0].hasCard()).toBe(true);
      expect(scene.slotBoxes[0].getPlacedCard()).toBe(firstChip);
      expect(firstChip.getCurrentSlot()).toBe(scene.slotBoxes[0]);
    });

    it('returns placed chip to bank when tapped in slot or slot is tapped', () => {
      const firstChip = scene.cardChips[0];
      scene.handleCardTap(firstChip);
      expect(scene.slotBoxes[0].hasCard()).toBe(true);

      // Tap the card again to remove
      scene.handleCardTap(firstChip);

      expect(scene.slotBoxes[0].hasCard()).toBe(false);
      expect(firstChip.getCurrentSlot()).toBeNull();
    });

    it('snaps card to slot on drag drop collision and evaluates order', () => {
      const targetSlot = scene.slotBoxes[0];
      const chip = scene.cardChips[1]; // e.g. "姐姐"

      // Place chip near slot 0
      chip.x = targetSlot.x;
      chip.y = targetSlot.y;

      scene.handleCardDragEnd(chip, {} as any);

      expect(targetSlot.getPlacedCard()).toBe(chip);
      expect(chip.getCurrentSlot()).toBe(targetSlot);
    });

    it('snaps card back to home if dropped away from all slots', () => {
      const chip = scene.cardChips[0];
      chip.x = 0;
      chip.y = 0;

      scene.handleCardDragEnd(chip, {} as any);
      expect(chip.getCurrentSlot()).toBeNull();
    });

    it('evaluates and triggers success when all slots are filled in correct order', () => {
      const correctOrder = ['姐姐', '在', '花園裡', '看書', '。'];

      // Place matching chips into each slot
      correctOrder.forEach((tok, idx) => {
        const matchingCard = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.slotBoxes[idx].setPlacedCard(matchingCard);
      });

      const isCorrect = scene.evaluateSentenceScramble();

      expect(isCorrect).toBe(true);
      expect(scene.isAnswered).toBe(true);
      expect(SoundManager.play).toHaveBeenCalledWith('correct');
      expect(SpeechService.speak).toHaveBeenCalledWith('姐姐在花園裡看書。', 'zh-HK');
      expect(dataManager.getProfile().stats.chineseCorrect).toBe(1);
    });

    it('evaluates and triggers wrong feedback when all slots are filled in wrong order', () => {
      // Put cards in wrong order
      const wrongOrder = ['看書', '姐姐', '在', '。', '花園裡'];
      wrongOrder.forEach((tok, idx) => {
        const matchingCard = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.slotBoxes[idx].setPlacedCard(matchingCard);
      });

      const isCorrect = scene.evaluateSentenceScramble();

      expect(isCorrect).toBe(false);
      expect(scene.isAnswered).toBe(false);
      expect(SoundManager.play).toHaveBeenCalledWith('wrong');
      expect(scene.sessionStats.mistakes).toBe(1);
      expect(scene.slotBoxes[0].hasError()).toBe(true);
    });
  });

  // =========================================================================
  // 4. Mode B: Multiple Choice & Math Calc Mode
  // =========================================================================
  describe('Mode B: Multiple Choice Quiz', () => {
    beforeEach(() => {
      scene.init({
        stationId: 2,
        questionIndex: 0,
        questions: [mockMathCalcQuestion],
      });
      scene.create();
    });

    it('renders 4 choice option cards for math calculation', () => {
      expect(scene.choiceCards).toHaveLength(4);
      expect(scene.choiceCards.map((c) => c.getValue())).toEqual([13, 14, 15, 16]);
    });

    it('evaluates and triggers success when clicking correct choice card', () => {
      const correctCard = scene.choiceCards[2]; // 15
      const result = scene.handleChoiceSelection(correctCard, 2);

      expect(result).toBe(true);
      expect(scene.isAnswered).toBe(true);
      expect(correctCard.getState()).toBe('correct');
      expect(SoundManager.play).toHaveBeenCalledWith('correct');
      expect(dataManager.getProfile().stats.mathCorrect).toBe(1);
    });

    it('evaluates and triggers wrong feedback when clicking wrong choice card', () => {
      const wrongCard = scene.choiceCards[0]; // 13
      const result = scene.handleChoiceSelection(wrongCard, 0);

      expect(result).toBe(false);
      expect(scene.isAnswered).toBe(false);
      expect(wrongCard.getState()).toBe('disabled');
      expect(SoundManager.play).toHaveBeenCalledWith('wrong');
      expect(scene.sessionStats.mistakes).toBe(1);
    });

    it('ignores clicks on already disabled choice cards', () => {
      const wrongCard = scene.choiceCards[0];
      scene.handleChoiceSelection(wrongCard, 0);

      const secondClickResult = scene.handleChoiceSelection(wrongCard, 0);
      expect(secondClickResult).toBe(false);
      expect(scene.sessionStats.mistakes).toBe(1);
    });
  });

  // =========================================================================
  // 5. Hint & Reset Action Controls
  // =========================================================================
  describe('Hint & Reset Action Controls', () => {
    it('places the next correct word chip into slot in sentence scramble on hint', () => {
      scene.init({
        stationId: 1,
        questionIndex: 0,
        questions: [mockChineseSentenceQuestion],
      });
      scene.create();

      expect(scene.slotBoxes[0].hasCard()).toBe(false);

      scene.handleHint();

      expect(scene.sessionStats.hintsUsed).toBe(1);
      expect(scene.slotBoxes[0].hasCard()).toBe(true);
      expect(scene.slotBoxes[0].getPlacedCard()?.getText()).toBe('姐姐');
      expect(scene.slotBoxes[0].isCorrect()).toBe(true);
    });

    it('eliminates one incorrect distractor option in multiple choice on hint', () => {
      scene.init({
        stationId: 2,
        questionIndex: 0,
        questions: [mockMathCalcQuestion],
      });
      scene.create();

      const initialDisabledCount = scene.choiceCards.filter((c) => c.getState() === 'disabled').length;
      expect(initialDisabledCount).toBe(0);

      scene.handleHint();

      expect(scene.sessionStats.hintsUsed).toBe(1);
      const afterDisabledCount = scene.choiceCards.filter((c) => c.getState() === 'disabled').length;
      expect(afterDisabledCount).toBe(1);

      // Verify the correct answer card (15) was NOT disabled
      const correctCard = scene.choiceCards[2];
      expect(correctCard.getState()).not.toBe('disabled');
    });

    it('clears all placed cards back to bank on reset click', () => {
      scene.init({
        stationId: 1,
        questionIndex: 0,
        questions: [mockChineseSentenceQuestion],
      });
      scene.create();

      // Place 2 cards
      scene.slotBoxes[0].setPlacedCard(scene.cardChips[0]);
      scene.slotBoxes[1].setPlacedCard(scene.cardChips[1]);
      expect(scene.slotBoxes[0].hasCard()).toBe(true);
      expect(scene.slotBoxes[1].hasCard()).toBe(true);

      scene.handleReset();

      expect(scene.slotBoxes[0].hasCard()).toBe(false);
      expect(scene.slotBoxes[1].hasCard()).toBe(false);
      expect(scene.cardChips[0].getCurrentSlot()).toBeNull();
      expect(scene.cardChips[1].getCurrentSlot()).toBeNull();
    });
  });

  // =========================================================================
  // 6. Correct Celebration & Scene Transition
  // =========================================================================
  describe('Celebration & Transition Flow', () => {
    it('spawns celebration particles and banner on correct answer', () => {
      scene.init({
        questions: [mockChineseSentenceQuestion],
      });
      scene.create();

      scene.onCorrectAnswer();
      expect(scene.celebrationContainer).toBeDefined();
    });

    it('keeps the celebration banner without optional particles for reduced motion', () => {
      scene.init({
        questions: [mockChineseSentenceQuestion],
      });
      (scene as any).prefersReducedMotion = true;
      scene.create();
      mockScene.tweens.add.mockClear();

      scene.playCelebrationEffect();

      expect(scene.celebrationContainer).toBeDefined();
      expect(mockScene.tweens.add).not.toHaveBeenCalled();
    });

    it('cleans celebration objects and tweens when the scene shuts down', () => {
      scene.init({
        questions: [mockChineseSentenceQuestion],
      });
      scene.create();
      scene.playCelebrationEffect();

      const firstCelebration = scene.celebrationContainer;
      expect(firstCelebration).not.toBeNull();
      const firstDestroy = vi.spyOn(firstCelebration!, 'destroy');
      scene.playCelebrationEffect();
      expect(firstDestroy).toHaveBeenCalled();

      const celebration = scene.celebrationContainer;
      expect(celebration).not.toBeNull();
      const destroy = vi.spyOn(celebration!, 'destroy');

      scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);

      expect(mockScene.tweens.killTweensOf).toHaveBeenCalled();
      expect(destroy).toHaveBeenCalled();
      expect(scene.celebrationContainer).toBeNull();
    });

    it('transitions to RunnerScene with station completion flag false for non-final question', () => {
      scene.init({
        stationId: 1,
        stationName: '小木屋',
        questionIndex: 0,
        questions: [mockChineseSentenceQuestion, mockMathCalcQuestion, mockEnglishSentenceQuestion],
      });
      scene.create();

      scene.onCorrectAnswer();

      expect(mockScene.scene.start).toHaveBeenCalledWith('RunnerScene', {
        stationId: 1,
        stationName: '小木屋',
        questionIndex: 0,
        isStationComplete: false,
        totalQuestions: 3,
        questions: expect.any(Array),
        sessionStats: expect.any(Object),
        isRainbowRush: expect.any(Boolean),
      });
    });

    it('transitions to RunnerScene with station completion flag true on 3rd (final) question', () => {
      scene.init({
        stationId: 1,
        stationName: '小木屋',
        questionIndex: 2,
        questions: [mockChineseSentenceQuestion, mockMathCalcQuestion, mockEnglishSentenceQuestion],
      });
      scene.create();

      scene.onCorrectAnswer();

      expect(mockScene.scene.start).toHaveBeenCalledWith('RunnerScene', {
        stationId: 1,
        stationName: '小木屋',
        questionIndex: 2,
        isStationComplete: true,
        totalQuestions: 3,
        questions: expect.any(Array),
        sessionStats: expect.any(Object),
        isRainbowRush: expect.any(Boolean),
      });
    });
  });
});
