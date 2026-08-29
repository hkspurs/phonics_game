import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import { QuestionScene } from '../scenes/QuestionScene';
import { CanvasCard } from '../ui/CanvasCard';
import { CanvasButton } from '../ui/CanvasButton';
import { SentenceEngine } from '../engine/SentenceEngine';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { QuizQuestion } from '../types';

function attachEventEmitter(obj: any): any {
  const listeners: Record<string, Function[]> = {};
  obj.on = vi.fn(function (ev: string, fn: Function) {
    (listeners[ev] = listeners[ev] || []).push(fn);
    return obj;
  });
  obj.once = vi.fn(function (ev: string, fn: Function) {
    const wrapper = (...args: any[]) => {
      obj.off(ev, wrapper);
      fn(...args);
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

export function createInquisitorMockScene(): any {
  const timers: any[] = [];
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
        enable: vi.fn((gameObject: any, shape?: any, callback?: any) => {
          gameObject.input = {
            hitArea: shape,
            hitAreaCallback: callback,
            enabled: true,
          };
        }),
        disable: vi.fn((gameObject: any) => {
          if (gameObject.input) gameObject.input.enabled = false;
        }),
      },
    },
    scene: {
      key: 'QuestionScene',
      start: vi.fn(),
      stop: vi.fn(),
      launch: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      isActive: vi.fn(() => true),
    },
    scale: {
      scaleMode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
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
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
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
          setAlpha: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(t);
      }),
      rectangle: vi.fn((x: number, y: number, w: number, h: number, fill?: number, alpha?: number) => {
        const r: any = {
          x,
          y,
          width: w,
          height: h,
          fillColor: fill,
          fillAlpha: alpha,
          setOrigin: vi.fn().mockReturnThis(),
          setStrokeStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return attachEventEmitter(r);
      }),
    },
    tweens: {
      add: vi.fn((config: any) => {
        const tweenObj = {
          stop: vi.fn(),
          remove: vi.fn(),
          targets: config.targets,
          onComplete: config.onComplete,
        };
        // Auto-complete tween immediately in mock tests for position assertions
        if (config.targets) {
          if (config.x !== undefined) config.targets.x = config.x;
          if (config.y !== undefined) config.targets.y = config.y;
          if (config.scaleX !== undefined) config.targets.scaleX = config.scaleX;
          if (config.scaleY !== undefined) config.targets.scaleY = config.scaleY;
          if (config.alpha !== undefined) config.targets.alpha = config.alpha;
        }
        if (typeof config.onComplete === 'function') {
          config.onComplete();
        }
        return tweenObj;
      }),
      killTweensOf: vi.fn(),
    },
    time: {
      delayedCall: vi.fn((delay: number, callback: Function) => {
        const t = {
          delay,
          callback,
          remove: vi.fn(),
          trigger: () => callback(),
        };
        timers.push(t);
        return t;
      }),
    },
    sound: {
      play: vi.fn(),
    },
    _timers: timers,
  };
  return scene;
}

describe('UI QA Auditor 2: Token-to-Slot Word Card Inquisitor Adversarial Test Suite', () => {
  let mockScene: any;
  let questionScene: QuestionScene;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(SoundManager, 'play').mockImplementation(() => {});
    vi.spyOn(SoundManager, 'playCardSnap').mockImplementation(() => {});
    vi.spyOn(SoundManager, 'playSoftWrong').mockImplementation(() => {});
    vi.spyOn(SoundManager, 'playComboCorrect').mockImplementation(() => {});
    vi.spyOn(SpeechService, 'speak').mockReturnValue(null as any);
    vi.spyOn(SpeechService, 'stop').mockImplementation(() => {});

    mockScene = createInquisitorMockScene();
    questionScene = new QuestionScene();
    Object.assign(questionScene, mockScene);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. CHINESE SENTENCE SCRAMBLE TOKEN AUDIT (3, 4, 5, 6 tokens & punctuation)
  // =========================================================================
  describe('1. Chinese Sentence Scramble Audit (3, 4, 5, 6 tokens)', () => {
    it('handles 3-token Chinese sentence: "太陽 升起 了"', () => {
      const q: QuizQuestion = {
        id: 'zh_3_tokens',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '太陽升起了。',
        correctTokens: ['太陽', '升起', '了'],
        shuffledTokens: ['了', '太陽', '升起'],
      };

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      expect(questionScene.slotBoxes).toHaveLength(3);
      expect(questionScene.cardChips).toHaveLength(3);

      // Verify slot centering & dimension
      expect(questionScene.slotBoxes[0].getSlotWidth()).toBe(155);
      expect(questionScene.slotBoxes[0].getSlotHeight()).toBe(74);

      // Tap in order: '太陽' -> '升起' -> '了'
      const cardSun = questionScene.cardChips.find((c) => c.getText() === '太陽')!;
      const cardRise = questionScene.cardChips.find((c) => c.getText() === '升起')!;
      const cardLe = questionScene.cardChips.find((c) => c.getText() === '了')!;

      questionScene.handleCardTap(cardSun);
      expect(questionScene.slotBoxes[0].getPlacedCard()).toBe(cardSun);
      expect(cardSun.x).toBe(questionScene.slotBoxes[0].x);
      expect(cardSun.y).toBe(questionScene.slotBoxes[0].y);

      questionScene.handleCardTap(cardRise);
      expect(questionScene.slotBoxes[1].getPlacedCard()).toBe(cardRise);

      questionScene.handleCardTap(cardLe);
      expect(questionScene.slotBoxes[2].getPlacedCard()).toBe(cardLe);

      // Should be evaluated as correct
      expect(questionScene.isAnswered).toBe(true);
      expect(questionScene.sessionStats.correctCount).toBe(1);
    });

    it('handles 4-token Chinese sentence with punctuation: "姐姐 吃 餅乾 。"', () => {
      const tokens = SentenceEngine.tokenize('姐姐 吃 餅乾 。', 'chinese');
      expect(tokens).toEqual(['姐姐', '吃', '餅乾', '。']);

      const q = SentenceEngine.createSentenceQuestion({
        id: 'zh_4_tokens',
        subject: 'chinese',
        sentence: '姐姐 吃 餅乾 。',
      });

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      expect(questionScene.slotBoxes).toHaveLength(4);
      expect(questionScene.cardChips).toHaveLength(4);

      // Verify punctuation token "。" is a distinct card
      const punctCard = questionScene.cardChips.find((c) => c.getText() === '。');
      expect(punctCard).toBeDefined();

      // Tap in correct order
      for (let i = 0; i < tokens.length; i++) {
        const chip = questionScene.cardChips.find(
          (c) => c.getText() === tokens[i] && c.getCurrentSlot() === null
        )!;
        questionScene.handleCardTap(chip);
        expect(questionScene.slotBoxes[i].getPlacedCard()?.getText()).toBe(tokens[i]);
      }

      expect(questionScene.isAnswered).toBe(true);
    });

    it('handles 5-token Chinese sentence: "老師 在 課室 教書 。"', () => {
      const tokens = SentenceEngine.tokenize('老師 在 課室 教書 。', 'chinese');
      expect(tokens).toEqual(['老師', '在', '課室', '教書', '。']);

      const q = SentenceEngine.createSentenceQuestion({
        id: 'zh_5_tokens',
        subject: 'chinese',
        sentence: '老師 在 課室 教書 。',
      });

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      expect(questionScene.slotBoxes).toHaveLength(5);
      expect(questionScene.slotBoxes[0].getSlotWidth()).toBe(140); // 5 tokens width adaptation
      expect(questionScene.cardChips).toHaveLength(5);
    });

    it('handles 6-token Chinese sentence with duplicate tokens: "我 愛 我 的 家 。"', () => {
      const tokens = SentenceEngine.tokenize('我 愛 我 的 家 。', 'chinese');
      expect(tokens).toEqual(['我', '愛', '我', '的', '家', '。']);

      const q: QuizQuestion = {
        id: 'zh_6_duplicate',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '我愛我的家。',
        correctTokens: tokens,
        shuffledTokens: ['家', '我', '。', '愛', '的', '我'],
      };

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      expect(questionScene.slotBoxes).toHaveLength(6);
      expect(questionScene.slotBoxes[0].getSlotWidth()).toBe(120); // 6 tokens width adaptation

      // Tap chips one by one according to expected tokens
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const chip = questionScene.cardChips.find(
          (c) => c.getText() === token && c.getCurrentSlot() === null
        )!;
        expect(chip).toBeDefined();
        questionScene.handleCardTap(chip);
      }

      expect(questionScene.isAnswered).toBe(true);
      expect(questionScene.sessionStats.correctCount).toBe(1);
    });
  });

  // =========================================================================
  // 2. ENGLISH SENTENCE & CVC PHONICS TOKEN AUDIT
  // =========================================================================
  describe('2. English Sentence & CVC Phonics Token Audit', () => {
    it('handles 3-token CVC phonics: "c a t"', () => {
      const q: QuizQuestion = {
        id: 'en_cvc_cat',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Spell the word: CAT',
        speakText: 'cat',
        correctTokens: ['c', 'a', 't'],
        shuffledTokens: ['t', 'c', 'a'],
      };

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      expect(questionScene.slotBoxes).toHaveLength(3);
      expect(questionScene.cardChips).toHaveLength(3);

      const chipC = questionScene.cardChips.find((c) => c.getText() === 'c')!;
      const chipA = questionScene.cardChips.find((c) => c.getText() === 'a')!;
      const chipT = questionScene.cardChips.find((c) => c.getText() === 't')!;

      questionScene.handleCardTap(chipC);
      questionScene.handleCardTap(chipA);
      questionScene.handleCardTap(chipT);

      expect(questionScene.isAnswered).toBe(true);
      expect(questionScene.slotBoxes.map((s) => s.getPlacedCard()?.getText())).toEqual(['c', 'a', 't']);
    });

    it('handles 4-token English sentence with terminal period: "I love apples."', () => {
      const tokens = SentenceEngine.tokenize('I love apples.', 'english');
      expect(tokens).toEqual(['I', 'love', 'apples', '.']);

      const q = SentenceEngine.createSentenceQuestion({
        id: 'en_4_tokens',
        subject: 'english',
        sentence: 'I love apples.',
      });

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      expect(questionScene.slotBoxes).toHaveLength(4);
      expect(questionScene.cardChips).toHaveLength(4);

      // Verify the period '.' token is separated cleanly
      expect(questionScene.cardChips.some((c) => c.getText() === '.')).toBe(true);
    });

    it('handles 6-token English question with question mark: "Do you like reading books?"', () => {
      const tokens = SentenceEngine.tokenize('Do you like reading books?', 'english');
      expect(tokens).toEqual(['Do', 'you', 'like', 'reading', 'books', '?']);

      const q = SentenceEngine.createSentenceQuestion({
        id: 'en_6_question',
        subject: 'english',
        sentence: 'Do you like reading books?',
      });

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      expect(questionScene.slotBoxes).toHaveLength(6);
      expect(questionScene.cardChips).toHaveLength(6);
    });
  });

  // =========================================================================
  // 3. ORDER PERMUTATIONS: FORWARD, REVERSE, RAPID TAPPING
  // =========================================================================
  describe('3. Order Permutations: Forward, Reverse & Rapid Tapping', () => {
    const q4: QuizQuestion = {
      id: 'scramble_4',
      subject: 'english',
      type: 'sentence_scramble',
      prompt: 'Arrange the sentence',
      speakText: 'The dog can run.',
      correctTokens: ['The', 'dog', 'can', 'run'],
      shuffledTokens: ['run', 'can', 'dog', 'The'],
    };

    it('places cards in forward sequence (0 -> 1 -> 2 -> 3) and detects correct answer', () => {
      questionScene.init({ questions: [q4], questionIndex: 0 });
      questionScene.create();

      const chip0 = questionScene.cardChips.find((c) => c.getText() === 'The')!;
      const chip1 = questionScene.cardChips.find((c) => c.getText() === 'dog')!;
      const chip2 = questionScene.cardChips.find((c) => c.getText() === 'can')!;
      const chip3 = questionScene.cardChips.find((c) => c.getText() === 'run')!;

      questionScene.handleCardTap(chip0);
      expect(questionScene.slotBoxes[0].getPlacedCard()).toBe(chip0);
      expect(questionScene.slotBoxes[1].hasCard()).toBe(false);

      questionScene.handleCardTap(chip1);
      expect(questionScene.slotBoxes[1].getPlacedCard()).toBe(chip1);

      questionScene.handleCardTap(chip2);
      expect(questionScene.slotBoxes[2].getPlacedCard()).toBe(chip2);

      questionScene.handleCardTap(chip3);
      expect(questionScene.slotBoxes[3].getPlacedCard()).toBe(chip3);

      expect(questionScene.isAnswered).toBe(true);
      expect(questionScene.sessionStats.mistakes).toBe(0);
    });

    it('places cards in reverse order (3 -> 2 -> 1 -> 0), triggers wrong state and error shake', () => {
      questionScene.init({ questions: [q4], questionIndex: 0 });
      questionScene.create();

      const chip0 = questionScene.cardChips.find((c) => c.getText() === 'The')!;
      const chip1 = questionScene.cardChips.find((c) => c.getText() === 'dog')!;
      const chip2 = questionScene.cardChips.find((c) => c.getText() === 'can')!;
      const chip3 = questionScene.cardChips.find((c) => c.getText() === 'run')!;

      // Tap in reverse order: 'run', 'can', 'dog', 'The'
      questionScene.handleCardTap(chip3); // Slot 0
      questionScene.handleCardTap(chip2); // Slot 1
      questionScene.handleCardTap(chip1); // Slot 2
      questionScene.handleCardTap(chip0); // Slot 3

      expect(questionScene.slotBoxes[0].getPlacedCard()?.getText()).toBe('run');
      expect(questionScene.slotBoxes[1].getPlacedCard()?.getText()).toBe('can');
      expect(questionScene.slotBoxes[2].getPlacedCard()?.getText()).toBe('dog');
      expect(questionScene.slotBoxes[3].getPlacedCard()?.getText()).toBe('The');

      expect(questionScene.isAnswered).toBe(false);
      expect(questionScene.sessionStats.mistakes).toBe(1);

      // Verify wrong slots are flagged as error
      expect(questionScene.slotBoxes[0].hasError()).toBe(true);
      expect(questionScene.slotBoxes[1].hasError()).toBe(true);
      expect(questionScene.slotBoxes[2].hasError()).toBe(true);
      expect(questionScene.slotBoxes[3].hasError()).toBe(true);
    });

    it('handles rapid tapping across distinct cards without dropping or skipping slots', () => {
      questionScene.init({ questions: [q4], questionIndex: 0 });
      questionScene.create();

      // Tap all 4 chips in rapid succession (simulating quick multi-touch)
      for (const chip of questionScene.cardChips) {
        questionScene.handleCardTap(chip);
      }

      // Every slot must have exactly one card, no duplicates, no nulls
      const placedCards = questionScene.slotBoxes.map((s) => s.getPlacedCard());
      expect(placedCards).toHaveLength(4);
      expect(placedCards.every((c) => c !== null)).toBe(true);
      const uniqueCards = new Set(placedCards);
      expect(uniqueCards.size).toBe(4);
    });
  });

  // =========================================================================
  // 4. TAP TO REMOVE, RESET BUTTON & DRAG/DROP AUDIT
  // =========================================================================
  describe('4. Tap to Remove, Reset Button & Drag/Drop Audit', () => {
    const q3: QuizQuestion = {
      id: 'scramble_3',
      subject: 'chinese',
      type: 'sentence_scramble',
      prompt: '重組句子',
      speakText: '我很好。',
      correctTokens: ['我', '很', '好'],
      shuffledTokens: ['好', '我', '很'],
    };

    it('tapping a placed card in a slot returns it cleanly to bank and restores placeholder', () => {
      questionScene.init({ questions: [q3], questionIndex: 0 });
      questionScene.create();

      const chipWo = questionScene.cardChips.find((c) => c.getText() === '我')!;
      questionScene.handleCardTap(chipWo);

      const slot0 = questionScene.slotBoxes[0];
      expect(slot0.hasCard()).toBe(true);
      expect(slot0.getPlacedCard()).toBe(chipWo);
      expect(chipWo.getCurrentSlot()).toBe(slot0);

      // Tap the card in the slot to remove it
      questionScene.handleCardTap(chipWo);

      expect(slot0.hasCard()).toBe(false);
      expect(slot0.getPlacedCard()).toBeNull();
      expect(chipWo.getCurrentSlot()).toBeNull();
      expect(chipWo.getState()).toBe('normal');
      expect(chipWo.x).toBe(chipWo.getHomePosition().x);
      expect(chipWo.y).toBe(chipWo.getHomePosition().y);
    });

    it('Reset button clears all slots, snaps cards back, and cancels error states', () => {
      questionScene.init({ questions: [q3], questionIndex: 0 });
      questionScene.create();

      // Place in wrong order: '好', '我', '很'
      const chipHao = questionScene.cardChips.find((c) => c.getText() === '好')!;
      const chipWo = questionScene.cardChips.find((c) => c.getText() === '我')!;
      const chipHen = questionScene.cardChips.find((c) => c.getText() === '很')!;

      questionScene.handleCardTap(chipHao);
      questionScene.handleCardTap(chipWo);
      questionScene.handleCardTap(chipHen);

      expect(questionScene.sessionStats.mistakes).toBe(1);
      expect(questionScene.slotBoxes[0].hasError()).toBe(true);

      // Click Reset Button
      questionScene.handleReset();

      for (const slot of questionScene.slotBoxes) {
        expect(slot.hasCard()).toBe(false);
        expect(slot.hasError()).toBe(false);
      }

      for (const card of questionScene.cardChips) {
        expect(card.getCurrentSlot()).toBeNull();
        expect(card.getState()).toBe('normal');
        expect(card.x).toBe(card.getHomePosition().x);
        expect(card.y).toBe(card.getHomePosition().y);
      }
    });

    it('drag and drop onto an empty slot snaps card to exact slot coordinates (diffX === 0, diffY === 0)', () => {
      questionScene.init({ questions: [q3], questionIndex: 0 });
      questionScene.create();

      const chip = questionScene.cardChips[0];
      const targetSlot = questionScene.slotBoxes[1];

      // Move chip to near slot 1
      chip.setPosition(targetSlot.x + 5, targetSlot.y - 5);
      questionScene.handleCardDragEnd(chip, { x: targetSlot.x + 5, y: targetSlot.y - 5 } as any);

      expect(targetSlot.getPlacedCard()).toBe(chip);
      expect(chip.getCurrentSlot()).toBe(targetSlot);

      const diffX = Math.abs(chip.x - targetSlot.x);
      const diffY = Math.abs(chip.y - targetSlot.y);
      expect(diffX).toBe(0);
      expect(diffY).toBe(0);
    });

    it('drag and drop swapping: dragging card A onto slot containing card B swaps them cleanly', () => {
      questionScene.init({ questions: [q3], questionIndex: 0 });
      questionScene.create();

      const chip0 = questionScene.cardChips[0];
      const chip1 = questionScene.cardChips[1];

      // Place chip0 in slot 0, chip1 in slot 1
      questionScene.slotBoxes[0].setPlacedCard(chip0);
      questionScene.slotBoxes[1].setPlacedCard(chip1);

      expect(questionScene.slotBoxes[0].getPlacedCard()).toBe(chip0);
      expect(questionScene.slotBoxes[1].getPlacedCard()).toBe(chip1);

      // Drag chip0 directly onto slot 1
      chip0.setPosition(questionScene.slotBoxes[1].x, questionScene.slotBoxes[1].y);
      questionScene.handleCardDragEnd(chip0, { x: questionScene.slotBoxes[1].x, y: questionScene.slotBoxes[1].y } as any);

      // They should swap places!
      expect(questionScene.slotBoxes[0].getPlacedCard()).toBe(chip1);
      expect(questionScene.slotBoxes[1].getPlacedCard()).toBe(chip0);
      expect(chip1.getCurrentSlot()).toBe(questionScene.slotBoxes[0]);
      expect(chip0.getCurrentSlot()).toBe(questionScene.slotBoxes[1]);
    });

    it('dragging a placed card away from all slots drops it back into bank home position', () => {
      questionScene.init({ questions: [q3], questionIndex: 0 });
      questionScene.create();

      const chip = questionScene.cardChips[0];
      questionScene.slotBoxes[0].setPlacedCard(chip);
      expect(questionScene.slotBoxes[0].hasCard()).toBe(true);

      // Drag chip to bottom of screen (empty void)
      chip.setPosition(640, 680);
      questionScene.handleCardDragEnd(chip, { x: 640, y: 680 } as any);

      expect(questionScene.slotBoxes[0].hasCard()).toBe(false);
      expect(chip.getCurrentSlot()).toBeNull();
      expect(chip.x).toBe(chip.getHomePosition().x);
      expect(chip.y).toBe(chip.getHomePosition().y);
    });
  });

  // =========================================================================
  // 5. HITBOX & CONTAINER BOUNDARY INQUISITION
  // =========================================================================
  describe('5. Hitbox & Container Boundary Inquisition', () => {
    it('audits CanvasCard hitArea geometry for center alignment vs top-left offset', () => {
      const card = new CanvasCard(mockScene, {
        x: 100,
        y: 200,
        width: 140,
        height: 64,
        text: 'Test',
      });

      const hitArea = (card as any).input?.hitArea;
      expect(hitArea).toBeDefined();

      const pad = 12;
      expect(hitArea.x).toBe(-140 / 2 - pad);
      expect(hitArea.y).toBe(-64 / 2 - pad);
      expect(hitArea.width).toBe(140 + pad * 2);
      expect(hitArea.height).toBe(64 + pad * 2);

      // Verify all 4 visual quadrants in centered local coordinate space
      expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 0)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitArea, -65, -25)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitArea, 65, 25)).toBe(true);
    });

    it('audits CanvasButton hitArea geometry for center alignment', () => {
      const btn = new CanvasButton(mockScene, {
        x: 200,
        y: 300,
        width: 160,
        height: 50,
        text: 'Confirm',
      });

      const hitArea = (btn as any).input?.hitArea;
      expect(hitArea).toBeDefined();

      const pad = 8;
      expect(hitArea.x).toBe(-160 / 2 - pad);
      expect(hitArea.y).toBe(-50 / 2 - pad);
      expect(hitArea.width).toBe(160 + pad * 2);
      expect(hitArea.height).toBe(50 + pad * 2);

      expect(Phaser.Geom.Rectangle.Contains(hitArea, 0, 0)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitArea, -75, -20)).toBe(true);
      expect(Phaser.Geom.Rectangle.Contains(hitArea, 75, 20)).toBe(true);
    });
  });

  // =========================================================================
  // 6. HINT ACTION & DISTRACTOR ELIMINATION AUDIT
  // =========================================================================
  describe('6. Hint Action & Distractor Elimination Audit', () => {
    it('hint in sentence scramble auto-places next correct token into its slot', () => {
      const q: QuizQuestion = {
        id: 'hint_scramble',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Arrange the sentence',
        speakText: 'I see a bird.',
        correctTokens: ['I', 'see', 'a', 'bird'],
        shuffledTokens: ['bird', 'a', 'see', 'I'],
      };

      questionScene.init({ questions: [q], questionIndex: 0 });
      questionScene.create();

      // Use hint 1 -> should place 'I' in slot 0
      questionScene.handleHint();
      expect(questionScene.slotBoxes[0].getPlacedCard()?.getText()).toBe('I');
      expect(questionScene.sessionStats.hintsUsed).toBe(1);

      // Use hint 2 -> should place 'see' in slot 1
      questionScene.handleHint();
      expect(questionScene.slotBoxes[1].getPlacedCard()?.getText()).toBe('see');
      expect(questionScene.sessionStats.hintsUsed).toBe(2);

      // Use hint 3 & 4 to solve the puzzle
      questionScene.handleHint();
      questionScene.handleHint();

      expect(questionScene.isAnswered).toBe(true);
      expect(questionScene.slotBoxes.map((s) => s.getPlacedCard()?.getText())).toEqual([
        'I',
        'see',
        'a',
        'bird',
      ]);
    });
  });
});
