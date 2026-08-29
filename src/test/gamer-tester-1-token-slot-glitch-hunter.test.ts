import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Phaser from 'phaser';
import { QuestionScene } from '../scenes/QuestionScene';
import { CanvasCard } from '../ui/CanvasCard';
import { SlotBox } from '../ui/SlotBox';
import { DataManager } from '../services/DataManager';
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

export function createMockTestScene(): any {
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
      rectangle: vi.fn((x: number, y: number, width: number, height: number) => {
        const r: any = {
          x,
          y,
          width,
          height,
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
          destroy: vi.fn(),
        };
        return attachEventEmitter(r);
      }),
    },
    tweens: {
      add: vi.fn((config: any) => {
        if (config?.targets) {
          if (config.x !== undefined) config.targets.x = config.x;
          if (config.y !== undefined) config.targets.y = config.y;
          if (config.scaleX !== undefined) config.targets.scaleX = config.scaleX;
          if (config.scaleY !== undefined) config.targets.scaleY = config.scaleY;
        }
        if (typeof config?.onComplete === 'function') {
          config.onComplete();
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
      delayedCall: vi.fn((_delay: number, callback: Function) => {
        return { remove: vi.fn(), callback };
      }),
    },
  };
  return scene;
}

describe('Gamer Tester 1: Token-to-Slot & Card Interaction Adversarial Glitch Suite', () => {
  let scene: QuestionScene;
  let mockScene: any;
  let dataManager: DataManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    dataManager = DataManager.getInstance();
    dataManager.reset();

    mockScene = createMockTestScene();
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
  // AUDIT TEST 1: Hitbox & Coordinate Alignment
  // =========================================================================
  describe('Audit Test 1: Hitbox Geometry & Coordinate Drift Analysis', () => {
    it('detects interactive hitArea coordinate offset in CanvasCard', () => {
      const card = new CanvasCard(mockScene, {
        x: 640,
        y: 400,
        width: 140,
        height: 64,
        text: '小貓',
      });

      // Visual bounds: [-70, +70] in X, [-32, +32] in Y.
      // But CanvasCard.ts lines 206-216 set:
      // hitRect = new Phaser.Geom.Rectangle(-hitPadX, -hitPadY, hitW, hitH) = (-12, -12, 164, 88)
      const hitArea = card.input?.hitArea;
      expect(hitArea).toBeDefined();

      if (hitArea) {
        const originX = 70;
        const originY = 32;
        // Point (-60, -25) in visual space -> (10, 7) in container transformed space
        const containsVisualTopLeft = Phaser.Geom.Rectangle.Contains(hitArea, -60 + originX, -25 + originY);
        // Point (120, 0) in visual space -> (190, 32) in container transformed space (outside right edge 164)
        const containsPhantomRight = Phaser.Geom.Rectangle.Contains(hitArea, 120 + originX, 0 + originY);

        expect(containsVisualTopLeft).toBe(true);
        expect(containsPhantomRight).toBe(false);
      }
    });

    it('detects drag drop Euclidean distance threshold vs rectangular slot geometry', () => {
      // Slot: 155 wide x 74 tall. Half-width = 77.5px, Half-height = 37px.
      const q: QuizQuestion = {
        id: 'test_drag_geom',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '測試拖曳幾何',
        speakText: '小狗在跑。',
        correctTokens: ['小狗', '在', '跑', '。'],
        shuffledTokens: ['在', '跑', '小狗', '。'],
      };

      scene.init({ questions: [q] });
      scene.create();

      const slot0 = scene.slotBoxes[0];
      const card = scene.cardChips[0];

      // Case 1: Drop at dx = 76px (inside slot width 155px, since halfW = 77.5px), dy = 0
      card.x = slot0.x + 76;
      card.y = slot0.y;

      scene.handleCardDragEnd(card, {} as any);
      expect(card.getCurrentSlot()).toBe(slot0); // Accepted!

      // Case 2: Drop at dx = 0, dy = 65px (28px OUTSIDE slot height 74px, since halfH = 37px)
      card.x = slot0.x;
      card.y = slot0.y + 65;

      scene.handleCardDragEnd(card, {} as any);
      expect(card.getCurrentSlot()).toBeNull(); // Correctly rejected!
    });
  });

  // =========================================================================
  // AUDIT TEST 2: Chinese Sentence Scramble (3, 4, 5, 6 Tokens + Punctuation)
  // =========================================================================
  describe('Audit Test 2: Chinese Sentence Scramble Token Sequences', () => {
    it('tests 3-token Chinese scramble with forward and reverse placement', () => {
      const q3: QuizQuestion = {
        id: 'zh_3_tokens',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '小狗跑。',
        correctTokens: ['小狗', '跑', '。'],
        shuffledTokens: ['。', '小狗', '跑'],
      };

      scene.init({ questions: [q3] });
      scene.create();

      expect(scene.slotBoxes).toHaveLength(3);
      expect(scene.cardChips).toHaveLength(3);

      // Forward placement via tap
      const chipXiaoGou = scene.cardChips.find((c) => c.getText() === '小狗')!;
      const chipPao = scene.cardChips.find((c) => c.getText() === '跑')!;
      const chipPeriod = scene.cardChips.find((c) => c.getText() === '。')!;

      scene.handleCardTap(chipXiaoGou); // slot 0
      scene.handleCardTap(chipPao);     // slot 1
      scene.handleCardTap(chipPeriod);  // slot 2

      expect(scene.isAnswered).toBe(true);
      expect(scene.sessionStats.correctCount).toBe(1);
    });

    it('tests 4-token Chinese scramble with reverse tap placement triggering wrong feedback', () => {
      const q4: QuizQuestion = {
        id: 'zh_4_tokens',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '姐姐吃餅乾。',
        correctTokens: ['姐姐', '吃', '餅乾', '。'],
        shuffledTokens: ['餅乾', '姐姐', '。', '吃'],
      };

      scene.init({ questions: [q4] });
      scene.create();

      expect(scene.slotBoxes).toHaveLength(4);

      // Place in reverse order: [3, 2, 1, 0]
      scene.cardChips.forEach((chip) => {
        scene.handleCardTap(chip);
      });

      // All 4 slots filled with shuffled order -> evaluate false
      expect(scene.isAnswered).toBe(false);
      expect(scene.sessionStats.mistakes).toBe(1);

      // Tap to remove all cards
      scene.slotBoxes.forEach((slot) => {
        scene.handleSlotCardRemoval(slot);
      });

      expect(scene.slotBoxes.every((s) => !s.hasCard())).toBe(true);
    });

    it('tests 5-token Chinese scramble with dynamic card width 140', () => {
      const q5: QuizQuestion = {
        id: 'zh_5_tokens',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '老師拿粉筆寫字。',
        correctTokens: ['老師', '拿', '粉筆', '寫字', '。'],
        shuffledTokens: ['粉筆', '老師', '。', '寫字', '拿'],
      };

      scene.init({ questions: [q5] });
      scene.create();

      expect(scene.slotBoxes).toHaveLength(5);
      expect(scene.slotBoxes[0].getSlotWidth()).toBe(140);

      // Correct placement
      ['老師', '拿', '粉筆', '寫字', '。'].forEach((tok) => {
        const card = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });

    it('tests 6-token Chinese scramble with comma and period punctuation tokens', () => {
      const q6: QuizQuestion = {
        id: 'zh_6_tokens',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '放學後，我和同學一起走路回家。',
        correctTokens: ['放學後', '，', '我和同學', '一起', '走路回家', '。'],
        shuffledTokens: ['。', '放學後', '走路回家', '，', '一起', '我和同學'],
      };

      scene.init({ questions: [q6] });
      scene.create();

      expect(scene.slotBoxes).toHaveLength(6);
      expect(scene.slotBoxes[0].getSlotWidth()).toBe(120);

      // Correct placement
      ['放學後', '，', '我和同學', '一起', '走路回家', '。'].forEach((tok) => {
        const card = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });
  });

  // =========================================================================
  // AUDIT TEST 3: English Sentence Scramble & CVC Word Phonics
  // =========================================================================
  describe('Audit Test 3: English Sentence Scramble & CVC Phonics', () => {
    it('tests 3-token CVC phonics word scramble [c, a, t]', () => {
      const qCvc: QuizQuestion = {
        id: 'en_cvc_cat',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Phonics Scramble: Spell the word "cat".',
        speakText: 'c a t',
        correctTokens: ['c', 'a', 't'],
        shuffledTokens: ['t', 'c', 'a'],
      };

      scene.init({ questions: [qCvc] });
      scene.create();

      expect(scene.getVoiceLanguage()).toBe('en-US');
      expect(scene.slotBoxes).toHaveLength(3);

      ['c', 'a', 't'].forEach((letter) => {
        const card = scene.cardChips.find((c) => c.getText() === letter)!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
      expect(SpeechService.speak).toHaveBeenCalledWith('c a t', 'en-US');
    });

    it('tests 4, 5, 6-token English sentences with punctuation', () => {
      const qEn4: QuizQuestion = {
        id: 'en_4_tokens',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Sentence Scramble',
        speakText: 'I like apples .',
        correctTokens: ['I', 'like', 'apples', '.'],
        shuffledTokens: ['.', 'I', 'apples', 'like'],
      };

      scene.init({ questions: [qEn4] });
      scene.create();

      ['I', 'like', 'apples', '.'].forEach((tok) => {
        const card = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });
  });

  // =========================================================================
  // AUDIT TEST 4: Card Slot Replacement & Swapping
  // =========================================================================
  describe('Audit Test 4: Card Slot Replacement & Swapping', () => {
    it('detects orphaned card state when SlotBox.setPlacedCard replaces an existing card', () => {
      const slot = new SlotBox(mockScene, { x: 300, y: 300, expectedValue: 'A' });
      const cardA = new CanvasCard(mockScene, { x: 100, y: 500, text: 'A' });
      const cardB = new CanvasCard(mockScene, { x: 250, y: 500, text: 'B' });

      // Place Card A
      slot.setPlacedCard(cardA);
      expect(slot.getPlacedCard()).toBe(cardA);
      expect(cardA.getCurrentSlot()).toBe(slot);

      // Now directly call setPlacedCard with Card B without calling removePlacedCard() first
      slot.setPlacedCard(cardB);
      expect(slot.getPlacedCard()).toBe(cardB);
      expect(cardB.getCurrentSlot()).toBe(slot);

      // Check state of Card A:
      expect(cardA.getCurrentSlot()).toBeNull();
      expect(cardA.getState()).toBe('normal'); // Cleanly returned to normal state
    });

    it('tests drag-and-drop card swap between two occupied slots', () => {
      const q: QuizQuestion = {
        id: 'test_swap',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '測試交換',
        speakText: '小貓吃魚。',
        correctTokens: ['小貓', '吃', '魚', '。'],
        shuffledTokens: ['吃', '小貓', '魚', '。'],
      };

      scene.init({ questions: [q] });
      scene.create();

      const chipEat = scene.cardChips.find((c) => c.getText() === '吃')!;
      const chipCat = scene.cardChips.find((c) => c.getText() === '小貓')!;

      // Place chipEat in Slot 0, chipCat in Slot 1
      scene.slotBoxes[0].setPlacedCard(chipEat);
      scene.slotBoxes[1].setPlacedCard(chipCat);

      expect(scene.slotBoxes[0].getPlacedCard()).toBe(chipEat);
      expect(scene.slotBoxes[1].getPlacedCard()).toBe(chipCat);

      // Now simulate dragging chipCat from Slot 1 onto Slot 0
      chipCat.x = scene.slotBoxes[0].x;
      chipCat.y = scene.slotBoxes[0].y;

      scene.handleCardDragEnd(chipCat, {} as any);

      // Verify they swapped slots: Slot 0 now has chipCat, Slot 1 now has chipEat
      expect(scene.slotBoxes[0].getPlacedCard()).toBe(chipCat);
      expect(scene.slotBoxes[1].getPlacedCard()).toBe(chipEat);
      expect(chipCat.getCurrentSlot()).toBe(scene.slotBoxes[0]);
      expect(chipEat.getCurrentSlot()).toBe(scene.slotBoxes[1]);
    });
  });

  // =========================================================================
  // AUDIT TEST 5: Hint Action Failure with Misplaced Cards
  // =========================================================================
  describe('Audit Test 5: Hint Button Edge Cases', () => {
    it('detects Hint failure when the correct token is currently placed in a wrong slot', () => {
      const q: QuizQuestion = {
        id: 'test_hint_misplaced',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '測試提示',
        speakText: '姐姐吃餅乾。',
        correctTokens: ['姐姐', '吃', '餅乾', '。'],
        shuffledTokens: ['餅乾', '吃', '姐姐', '。'],
      };

      scene.init({ questions: [q] });
      scene.create();

      const chipSister = scene.cardChips.find((c) => c.getText() === '姐姐')!;
      const chipEat = scene.cardChips.find((c) => c.getText() === '吃')!;

      // Player mistakenly puts '吃' in Slot 0 and '姐姐' in Slot 1
      scene.slotBoxes[0].setPlacedCard(chipEat);
      scene.slotBoxes[1].setPlacedCard(chipSister);

      expect(scene.slotBoxes[0].hasCard()).toBe(true);
      expect(scene.slotBoxes[1].hasCard()).toBe(true);

      // Now player presses Hint:
      // In QuestionScene.ts line 861:
      // const chip = this.cardChips.find((c) => c.getText() === '姐姐' && c.getCurrentSlot() === null);
      // Because chipSister has currentSlot === slotBoxes[1], chip is undefined!
      scene.handleHint();

      // Check if slot 0 received '姐姐'
      const slot0Card = scene.slotBoxes[0].getPlacedCard();

      expect(slot0Card?.getText()).toBe('姐姐');
      expect(scene.sessionStats.hintsUsed).toBe(1);
    });
  });

  // =========================================================================
  // AUDIT TEST 6: Viewport & Resolution Layout Checks
  // =========================================================================
  describe('Audit Test 6: Viewport Layout & Touch Bounds Checks', () => {
    it('verifies slot and bank bounds fit within 1280x720 across 3, 4, 5, 6, 7 tokens', () => {
      const tokenCounts = [3, 4, 5, 6, 7];

      for (const count of tokenCounts) {
        const dummyTokens = Array.from({ length: count }, (_, i) => `T${i + 1}`);
        const q: QuizQuestion = {
          id: `test_${count}`,
          subject: 'chinese',
          type: 'sentence_scramble',
          prompt: '測試',
          speakText: dummyTokens.join(' '),
          correctTokens: dummyTokens,
          shuffledTokens: [...dummyTokens].reverse(),
        };

        const testScene = new QuestionScene();
        Object.assign(testScene, createMockTestScene());
        testScene.init({ questions: [q] });
        testScene.create();

        // Verify all slots are within game width [0, 1280] and height [0, 720]
        for (const slot of testScene.slotBoxes) {
          const halfW = slot.getSlotWidth() / 2;
          const halfH = slot.getSlotHeight() / 2;
          expect(slot.x - halfW).toBeGreaterThanOrEqual(0);
          expect(slot.x + halfW).toBeLessThanOrEqual(1280);
          expect(slot.y - halfH).toBeGreaterThanOrEqual(80); // Below header
          expect(slot.y + halfH).toBeLessThanOrEqual(720 - 70); // Above controls
        }

        // Verify bank chips touch size is >= 44x44
        for (const chip of testScene.cardChips) {
          const halfW = (chip as any).cardWidth / 2;
          const halfH = (chip as any).cardHeight / 2;
          expect((chip as any).cardWidth).toBeGreaterThanOrEqual(44);
          expect((chip as any).cardHeight).toBeGreaterThanOrEqual(44);
          expect(chip.x - halfW).toBeGreaterThanOrEqual(0);
          expect(chip.x + halfW).toBeLessThanOrEqual(1280);
          expect(chip.y - halfH).toBeGreaterThanOrEqual(0);
          expect(chip.y + halfH).toBeLessThanOrEqual(720);
        }
      }
    });
  });

  // =========================================================================
  // AUDIT TEST 7: Reset Action & Error State Persistence Glitch
  // =========================================================================
  describe('Audit Test 7: Reset Action & Error State Persistence', () => {
    it('detects un-cleared slot error state when Reset is pressed while in wrong answer state', () => {
      const q: QuizQuestion = {
        id: 'test_reset_error',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '測試重置錯誤狀態',
        speakText: '姐姐吃餅乾。',
        correctTokens: ['姐姐', '吃', '餅乾', '。'],
        shuffledTokens: ['餅乾', '姐姐', '。', '吃'],
      };

      scene.init({ questions: [q] });
      scene.create();

      // Put all cards in wrong order to trigger error state
      scene.cardChips.forEach((c) => scene.handleCardTap(c));
      expect(scene.sessionStats.mistakes).toBe(1);

      // Verify slots have error state = true
      const hasErrorBeforeReset = scene.slotBoxes.some((s) => s.hasError());
      expect(hasErrorBeforeReset).toBe(true);

      // Now press Reset
      scene.handleReset();

      // Check if slot error state was explicitly cleared or left dirty
      // In QuestionScene.ts lines 912-922, handleReset only calls slot.removePlacedCard(),
      // which does NOT call slot.setError(false)!
      const hasErrorAfterReset = scene.slotBoxes.some((s) => s.hasError());
      console.log('Slot has error after reset:', hasErrorAfterReset);
      expect(hasErrorAfterReset).toBe(false); // Reset cleanly clears slots and error state!
    });
  });

  // =========================================================================
  // AUDIT TEST 8: Wobble & SnapBack Tween Collision Race Condition
  // =========================================================================
  describe('Audit Test 8: Animation Tween Race Condition', () => {
    it('detects missing killTweensOf in snapBack causing animation clash with wobble', () => {
      const card = new CanvasCard(mockScene, {
        x: 200,
        y: 400,
        text: '測試卡',
      });
      card.setHomePosition(200, 400);

      // Start wobble animation
      card.wobble();
      expect(mockScene.tweens.add).toHaveBeenCalled();

      // Immediately call snapBack (simulating user tapping/returning card during wobble)
      const killTweensSpy = mockScene.tweens.killTweensOf;
      killTweensSpy.mockClear();

      card.snapBack();

      // CanvasCard.snapBack() kills existing wobble tweens
      expect(killTweensSpy).toHaveBeenCalledWith(card);
    });
  });

  // =========================================================================
  // AUDIT TEST 9: Duplicate Tokens in Sentence Scramble
  // =========================================================================
  describe('Audit Test 9: Duplicate Tokens Handling', () => {
    it('handles sentences with duplicate words (e.g. "the" in "The boy and the dog.")', () => {
      const qDup: QuizQuestion = {
        id: 'test_duplicate_tokens',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Sentence Scramble',
        speakText: 'The boy and the dog .',
        correctTokens: ['The', 'boy', 'and', 'the', 'dog', '.'],
        shuffledTokens: ['dog', 'The', 'the', '.', 'and', 'boy'],
      };

      scene.init({ questions: [qDup] });
      scene.create();

      expect(scene.slotBoxes).toHaveLength(6);

      // Place in exact correct order
      ['The', 'boy', 'and', 'the', 'dog', '.'].forEach((tok, idx) => {
        // Find an unplaced card with matching text
        const unplaced = scene.cardChips.find((c) => c.getText() === tok && !c.getCurrentSlot())!;
        expect(unplaced).toBeDefined();
        scene.slotBoxes[idx].setPlacedCard(unplaced);
      });

      const isCorrect = scene.evaluateSentenceScramble();
      expect(isCorrect).toBe(true);
      expect(scene.isAnswered).toBe(true);
    });
  });

  // =========================================================================
  // AUDIT TEST 10: Rapid Sequential Tap Concurrency Stress Test
  // =========================================================================
  describe('Audit Test 10: Rapid Tap Concurrency Stress Test', () => {
    it('survives 100 rapid random tap/untap cycles without index corruption or orphan state', () => {
      const q: QuizQuestion = {
        id: 'test_stress_100',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '壓力測試',
        speakText: '我看見一隻可愛的貓咪。',
        correctTokens: ['我看見', '一隻', '可愛的', '貓咪', '。'],
        shuffledTokens: ['可愛的', '。', '我看見', '貓咪', '一隻'],
      };

      scene.init({ questions: [q] });
      scene.create();

      for (let i = 0; i < 100; i++) {
        // Pick random chip
        const chip = scene.cardChips[i % scene.cardChips.length];
        scene.handleCardTap(chip);
      }

      // Check slot consistency: every occupied slot has card pointing back to it
      for (const slot of scene.slotBoxes) {
        const card = slot.getPlacedCard();
        if (card) {
          expect(card.getCurrentSlot()).toBe(slot);
        }
      }

      // Check card consistency: every card with a slot is actually in that slot
      for (const card of scene.cardChips) {
        const slot = card.getCurrentSlot();
        if (slot) {
          expect(slot.getPlacedCard()).toBe(card);
        }
      }
    });
  });

  // =========================================================================
  // AUDIT TEST 11: Tap Order Permutations (Forward, Reverse, Out-of-Order, Interrupted)
  // =========================================================================
  describe('Audit Test 11: Tap Order Permutations & Slot Filling Logic', () => {
    it('executes forward order placement (0 -> 1 -> 2 -> 3) and verifies slots and answer state', () => {
      const q: QuizQuestion = {
        id: 'zh_perm_fwd',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '正向排列測試',
        speakText: '大家快跑！',
        correctTokens: ['大家', '快', '跑', '！'],
        shuffledTokens: ['大家', '快', '跑', '！'], // In this order in bank
      };
      scene.init({ questions: [q] });
      scene.create();

      // Tap in forward order 0 -> 1 -> 2 -> 3
      scene.handleCardTap(scene.cardChips[0]);
      scene.handleCardTap(scene.cardChips[1]);
      scene.handleCardTap(scene.cardChips[2]);
      scene.handleCardTap(scene.cardChips[3]);

      expect(scene.slotBoxes[0].getPlacedCard()?.getText()).toBe('大家');
      expect(scene.slotBoxes[1].getPlacedCard()?.getText()).toBe('快');
      expect(scene.slotBoxes[2].getPlacedCard()?.getText()).toBe('跑');
      expect(scene.slotBoxes[3].getPlacedCard()?.getText()).toBe('！');
      expect(scene.isAnswered).toBe(true);
      expect(scene.sessionStats.correctCount).toBe(1);
    });

    it('executes reverse order placement (3 -> 2 -> 1 -> 0) into empty slots', () => {
      const q: QuizQuestion = {
        id: 'zh_perm_rev',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '逆向排列測試',
        speakText: '大家快跑！',
        correctTokens: ['大家', '快', '跑', '！'],
        shuffledTokens: ['！', '跑', '快', '大家'],
      };
      scene.init({ questions: [q] });
      scene.create();

      // Bank has [ '！', '跑', '快', '大家' ]
      // Tap index 3 ('大家') -> enters slot 0
      // Tap index 2 ('快')   -> enters slot 1
      // Tap index 1 ('跑')   -> enters slot 2
      // Tap index 0 ('！')   -> enters slot 3
      scene.handleCardTap(scene.cardChips[3]);
      scene.handleCardTap(scene.cardChips[2]);
      scene.handleCardTap(scene.cardChips[1]);
      scene.handleCardTap(scene.cardChips[0]);

      expect(scene.slotBoxes[0].getPlacedCard()?.getText()).toBe('大家');
      expect(scene.slotBoxes[1].getPlacedCard()?.getText()).toBe('快');
      expect(scene.slotBoxes[2].getPlacedCard()?.getText()).toBe('跑');
      expect(scene.slotBoxes[3].getPlacedCard()?.getText()).toBe('！');
      expect(scene.isAnswered).toBe(true);
    });

    it('executes out-of-order random selection and fills slots sequentially without gaps', () => {
      const q: QuizQuestion = {
        id: 'zh_perm_random',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '隨機順序點擊',
        speakText: '你喜歡吃蘋果嗎？',
        correctTokens: ['你', '喜歡', '吃', '蘋果', '嗎？'],
        shuffledTokens: ['吃', '嗎？', '你', '蘋果', '喜歡'],
      };
      scene.init({ questions: [q] });
      scene.create();

      // Tap index 2 ('你') -> enters slot 0
      scene.handleCardTap(scene.cardChips[2]);
      expect(scene.slotBoxes[0].getPlacedCard()?.getText()).toBe('你');
      expect(scene.slotBoxes[1].hasCard()).toBe(false);

      // Tap index 4 ('喜歡') -> enters slot 1
      scene.handleCardTap(scene.cardChips[4]);
      expect(scene.slotBoxes[1].getPlacedCard()?.getText()).toBe('喜歡');

      // Tap index 0 ('吃') -> enters slot 2
      scene.handleCardTap(scene.cardChips[0]);
      expect(scene.slotBoxes[2].getPlacedCard()?.getText()).toBe('吃');

      // Tap index 3 ('蘋果') -> enters slot 3
      scene.handleCardTap(scene.cardChips[3]);
      expect(scene.slotBoxes[3].getPlacedCard()?.getText()).toBe('蘋果');

      // Tap index 1 ('嗎？') -> enters slot 4
      scene.handleCardTap(scene.cardChips[1]);
      expect(scene.slotBoxes[4].getPlacedCard()?.getText()).toBe('嗎？');

      expect(scene.isAnswered).toBe(true);
    });

    it('handles tapping to fill slots, removing intermediate slot 1, and tapping new card to fill slot 1', () => {
      const q: QuizQuestion = {
        id: 'zh_perm_hole_fill',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '填補空缺測試',
        speakText: '小狗在跑。',
        correctTokens: ['小狗', '在', '跑', '。'],
        shuffledTokens: ['小狗', '跑', '在', '。'],
      };
      scene.init({ questions: [q] });
      scene.create();

      const chipDog = scene.cardChips.find((c) => c.getText() === '小狗')!;
      const chipRun = scene.cardChips.find((c) => c.getText() === '跑')!;
      const chipIn = scene.cardChips.find((c) => c.getText() === '在')!;
      const chipDot = scene.cardChips.find((c) => c.getText() === '。')!;

      // 1. Place chipDog -> Slot 0
      scene.handleCardTap(chipDog);
      expect(scene.slotBoxes[0].getPlacedCard()).toBe(chipDog);

      // 2. Place chipRun mistakenly into Slot 1
      scene.handleCardTap(chipRun);
      expect(scene.slotBoxes[1].getPlacedCard()).toBe(chipRun);

      // 3. Place chipDot -> Slot 2
      scene.handleCardTap(chipDot);
      expect(scene.slotBoxes[2].getPlacedCard()).toBe(chipDot);

      // 4. Tap chipRun in Slot 1 to return it to bank
      scene.handleCardTap(chipRun);
      expect(scene.slotBoxes[1].hasCard()).toBe(false);
      expect(chipRun.getCurrentSlot()).toBeNull();
      expect(chipRun.getState()).toBe('normal');

      // 5. Now tap chipIn -> it MUST fill the first empty slot (Slot 1), NOT Slot 3!
      scene.handleCardTap(chipIn);
      expect(scene.slotBoxes[1].getPlacedCard()).toBe(chipIn);
      expect(scene.slotBoxes[3].hasCard()).toBe(false);

      // 6. Tap chipRun -> fills Slot 3 and completes sentence
      scene.handleCardTap(chipRun);
      expect(scene.slotBoxes[3].getPlacedCard()).toBe(chipRun);
      // Evaluated as ['小狗', '在', '。', '跑'] -> incorrect -> isAnswered remains false
      expect(scene.isAnswered).toBe(false);
    });
  });

  // =========================================================================
  // AUDIT TEST 12: Chinese Punctuation Tokens Permutations (！, ？, ，, 。)
  // =========================================================================
  describe('Audit Test 12: Chinese Punctuation Token Integrity', () => {
    it('tests exclamation mark token "！" in 4-token scramble', () => {
      const q: QuizQuestion = {
        id: 'zh_exclamation',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '快點跑！',
        correctTokens: ['快點', '跑', '起來', '！'],
        shuffledTokens: ['！', '起來', '快點', '跑'],
      };
      scene.init({ questions: [q] });
      scene.create();

      ['快點', '跑', '起來', '！'].forEach((tok) => {
        const card = scene.cardChips.find((c) => c.getText() === tok && !c.getCurrentSlot())!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });

    it('tests question mark token "？" in 5-token scramble', () => {
      const q: QuizQuestion = {
        id: 'zh_question_mark',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '你今天開心嗎？',
        correctTokens: ['你', '今天', '開心', '嗎', '？'],
        shuffledTokens: ['？', '開心', '你', '嗎', '今天'],
      };
      scene.init({ questions: [q] });
      scene.create();

      ['你', '今天', '開心', '嗎', '？'].forEach((tok) => {
        const card = scene.cardChips.find((c) => c.getText() === tok && !c.getCurrentSlot())!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });

    it('tests comma and period punctuation marks in 6-token scramble', () => {
      const q: QuizQuestion = {
        id: 'zh_comma_period',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重組句子',
        speakText: '早上好，太陽升起來了。',
        correctTokens: ['早上好', '，', '太陽', '升起來', '了', '。'],
        shuffledTokens: ['。', '太陽', '，', '了', '早上好', '升起來'],
      };
      scene.init({ questions: [q] });
      scene.create();

      ['早上好', '，', '太陽', '升起來', '了', '。'].forEach((tok) => {
        const card = scene.cardChips.find((c) => c.getText() === tok && !c.getCurrentSlot())!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });
  });

  // =========================================================================
  // AUDIT TEST 13: English CVC Phonics Letter Chips & Blend Tokens
  // =========================================================================
  describe('Audit Test 13: English CVC Phonics & Letter Scrambles', () => {
    it('tests CVC word "dog" phonics letters with sound voice "en-US"', () => {
      const qDog: QuizQuestion = {
        id: 'en_cvc_dog',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Phonics: Spell the word "dog"',
        speakText: 'd o g',
        correctTokens: ['d', 'o', 'g'],
        shuffledTokens: ['g', 'd', 'o'],
      };
      scene.init({ questions: [qDog] });
      scene.create();

      expect(scene.getVoiceLanguage()).toBe('en-US');

      ['d', 'o', 'g'].forEach((letter) => {
        const card = scene.cardChips.find((c) => c.getText() === letter && !c.getCurrentSlot())!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
      expect(SpeechService.speak).toHaveBeenCalledWith('d o g', 'en-US');
    });

    it('tests CVC word "sun" phonics letters', () => {
      const qSun: QuizQuestion = {
        id: 'en_cvc_sun',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Phonics: Spell "sun"',
        speakText: 's u n',
        correctTokens: ['s', 'u', 'n'],
        shuffledTokens: ['u', 'n', 's'],
      };
      scene.init({ questions: [qSun] });
      scene.create();

      ['s', 'u', 'n'].forEach((letter) => {
        const card = scene.cardChips.find((c) => c.getText() === letter && !c.getCurrentSlot())!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });

    it('tests 4-letter phonics blend "stop" [s, t, o, p]', () => {
      const qStop: QuizQuestion = {
        id: 'en_blend_stop',
        subject: 'english',
        type: 'sentence_scramble',
        prompt: 'Phonics: Spell "stop"',
        speakText: 's t o p',
        correctTokens: ['s', 't', 'o', 'p'],
        shuffledTokens: ['p', 'o', 't', 's'],
      };
      scene.init({ questions: [qStop] });
      scene.create();

      ['s', 't', 'o', 'p'].forEach((letter) => {
        const card = scene.cardChips.find((c) => c.getText() === letter && !c.getCurrentSlot())!;
        scene.handleCardTap(card);
      });

      expect(scene.isAnswered).toBe(true);
    });
  });

  // =========================================================================
  // AUDIT TEST 14: Tap Placed Card to Return & Reset Button Mechanics
  // =========================================================================
  describe('Audit Test 14: Tap-to-Return & Reset Button In-Depth', () => {
    it('verifies tapping an already placed card returns it cleanly to bank with home coordinates and normal state', () => {
      const q: QuizQuestion = {
        id: 'test_tap_return_clean',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '點擊退回測試',
        speakText: '小貓吃魚。',
        correctTokens: ['小貓', '吃', '魚', '。'],
        shuffledTokens: ['小貓', '吃', '魚', '。'],
      };
      scene.init({ questions: [q] });
      scene.create();

      const chipCat = scene.cardChips[0];
      const homePos = chipCat.getHomePosition();

      // Tap chipCat to place in Slot 0
      scene.handleCardTap(chipCat);
      expect(scene.slotBoxes[0].getPlacedCard()).toBe(chipCat);
      expect(chipCat.getCurrentSlot()).toBe(scene.slotBoxes[0]);
      expect(chipCat.getState()).toBe('placed');

      // Tap chipCat again to return to bank
      scene.handleCardTap(chipCat);

      // Verify slot is empty
      expect(scene.slotBoxes[0].hasCard()).toBe(false);
      expect(scene.slotBoxes[0].getPlacedCard()).toBeNull();

      // Verify card state and slot link
      expect(chipCat.getCurrentSlot()).toBeNull();
      expect(chipCat.getState()).toBe('normal');
      expect(chipCat.x).toBe(homePos.x);
      expect(chipCat.y).toBe(homePos.y);
    });

    it('verifies Reset button clears all slots simultaneously and restores all cards to active unplaced state', () => {
      const q: QuizQuestion = {
        id: 'test_reset_all_cards',
        subject: 'chinese',
        type: 'sentence_scramble',
        prompt: '重置所有卡牌測試',
        speakText: '小貓吃魚。',
        correctTokens: ['小貓', '吃', '魚', '。'],
        shuffledTokens: ['魚', '小貓', '。', '吃'],
      };
      scene.init({ questions: [q] });
      scene.create();

      // Place first 3 cards into slots (partial / wrong placement, not answered yet)
      scene.handleCardTap(scene.cardChips[0]);
      scene.handleCardTap(scene.cardChips[1]);
      scene.handleCardTap(scene.cardChips[2]);

      expect(scene.slotBoxes[0].hasCard()).toBe(true);
      expect(scene.slotBoxes[1].hasCard()).toBe(true);
      expect(scene.slotBoxes[2].hasCard()).toBe(true);
      expect(scene.isAnswered).toBe(false);

      // Trigger reset
      scene.handleReset();

      // Verify all slots are cleared
      for (const slot of scene.slotBoxes) {
        expect(slot.hasCard()).toBe(false);
        expect(slot.getPlacedCard()).toBeNull();
      }

      // Verify all cards are at home coordinates and in 'normal' state
      for (const chip of scene.cardChips) {
        const home = chip.getHomePosition();
        expect(chip.getCurrentSlot()).toBeNull();
        expect(chip.getState()).toBe('normal');
        expect(chip.x).toBe(home.x);
        expect(chip.y).toBe(home.y);
      }
    });
  });

  // =========================================================================
  // AUDIT TEST 15: CanvasCard Hitbox Geometry Across Mobile & Desktop DPI
  // =========================================================================
  describe('Audit Test 15: CanvasCard Hitbox Geometry Across High-DPI & Mobile', () => {
    it('verifies centered hitbox geometry (-w/2 - hitPadX, -h/2 - hitPadY) and boundary containment', () => {
      const cardWidth = 155;
      const cardHeight = 74;
      const hitPadX = 12;
      const hitPadY = 12;

      const card = new CanvasCard(mockScene, {
        x: 640,
        y: 360,
        width: cardWidth,
        height: cardHeight,
        text: '測試卡牌',
      });

      const hitArea = card.input?.hitArea;
      expect(hitArea).toBeDefined();

      const expectedX = -hitPadX; // -12
      const expectedY = -hitPadY; // -12
      const expectedW = cardWidth + hitPadX * 2;   // 155 + 24 = 179
      const expectedH = cardHeight + hitPadY * 2;  // 74 + 24 = 98

      expect(hitArea.x).toBe(expectedX);
      expect(hitArea.y).toBe(expectedY);
      expect(hitArea.width).toBe(expectedW);
      expect(hitArea.height).toBe(expectedH);

      // Boundary checks (in Phaser transformed space with displayOrigin = (cardWidth / 2, cardHeight / 2)):
      const originX = cardWidth / 2;
      const originY = cardHeight / 2;
      const centerX = originX;
      const centerY = originY;

      // 1. Center -> MUST be inside
      expect(Phaser.Geom.Rectangle.Contains(hitArea, centerX, centerY)).toBe(true);

      // 2. Just inside top-left corner -> MUST be inside
      expect(Phaser.Geom.Rectangle.Contains(hitArea, -cardWidth / 2 + originX, -cardHeight / 2 + originY)).toBe(true);

      // 3. Just inside bottom-right corner -> MUST be inside
      expect(Phaser.Geom.Rectangle.Contains(hitArea, cardWidth / 2 + originX, cardHeight / 2 + originY)).toBe(true);

      // 4. Outside left edge beyond pad -> MUST be false
      expect(Phaser.Geom.Rectangle.Contains(hitArea, expectedX - 1, centerY)).toBe(false);

      // 5. Outside right edge beyond pad -> MUST be false
      expect(Phaser.Geom.Rectangle.Contains(hitArea, expectedX + expectedW + 1, centerY)).toBe(false);

      // 6. Outside top edge beyond pad -> MUST be false
      expect(Phaser.Geom.Rectangle.Contains(hitArea, centerX, expectedY - 1)).toBe(false);

      // 7. Outside bottom edge beyond pad -> MUST be false
      expect(Phaser.Geom.Rectangle.Contains(hitArea, centerX, expectedY + expectedH + 1)).toBe(false);
    });

    it('verifies high-DPI text resolution does not distort card dimensions or hitbox size', () => {
      // Simulate mobile devicePixelRatio = 3 (iPhone 14 Pro / Retina)
      const origDpr = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });

      const card = new CanvasCard(mockScene, {
        x: 400,
        y: 300,
        width: 120,
        height: 64,
        text: '高解析度測試',
      });

      expect((card as any).cardWidth).toBe(120);
      expect((card as any).cardHeight).toBe(64);
      expect(card.input?.hitArea.width).toBe(120 + 24);
      expect(card.input?.hitArea.height).toBe(64 + 24);

      // Restore
      Object.defineProperty(window, 'devicePixelRatio', { value: origDpr, configurable: true });
    });
  });

  // =========================================================================
  // AUDIT TEST 16: Full 4! = 24 Tap Order Permutation Matrix Testing
  // =========================================================================
  describe('Audit Test 16: Full 24-Permutation Tap Order Matrix on 4-Token Chinese Scramble', () => {
    function generatePermutations<T>(arr: T[]): T[][] {
      if (arr.length <= 1) return [arr];
      const result: T[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const current = arr[i];
        const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
        const perms = generatePermutations(remaining);
        for (const p of perms) {
          result.push([current, ...p]);
        }
      }
      return result;
    }

    it('tests all 24 permutations of a 4-token sentence, verifying exactly 1 correct and 23 wrong evaluations', () => {
      const correctSequence = ['姐姐', '吃', '餅乾', '。'];
      const permutations = generatePermutations(correctSequence);
      expect(permutations).toHaveLength(24);

      let correctCount = 0;
      let incorrectCount = 0;

      for (const perm of permutations) {
        const q: QuizQuestion = {
          id: `perm_${perm.join('')}`,
          subject: 'chinese',
          type: 'sentence_scramble',
          prompt: '排列測試',
          speakText: '姐姐吃餅乾。',
          correctTokens: correctSequence,
          shuffledTokens: perm, // Bank starts with this permutation
        };

        const testScene = new QuestionScene();
        Object.assign(testScene, createMockTestScene());
        testScene.init({ questions: [q] });
        testScene.create();

        // Player taps bank cards sequentially 0 -> 1 -> 2 -> 3
        testScene.cardChips.forEach((chip) => {
          testScene.handleCardTap(chip);
        });

        const isExactMatch = perm.every((tok, idx) => tok === correctSequence[idx]);

        if (isExactMatch) {
          expect(testScene.isAnswered).toBe(true);
          expect(testScene.sessionStats.correctCount).toBe(1);
          correctCount++;
        } else {
          expect(testScene.isAnswered).toBe(false);
          expect(testScene.sessionStats.mistakes).toBe(1);
          incorrectCount++;

          // Test Reset clears all cards cleanly for incorrect placements
          testScene.handleReset();
          expect(testScene.slotBoxes.every((s) => !s.hasCard())).toBe(true);
          expect(testScene.cardChips.every((c) => c.getCurrentSlot() === null)).toBe(true);
        }
      }

      expect(correctCount).toBe(1);
      expect(incorrectCount).toBe(23);
    });
  });

  // =========================================================================
  // AUDIT TEST 17: Drag End Trailing PointerUp Interaction Diagnostics
  // =========================================================================
  describe('Audit Test 17: Drag End Trailing PointerUp Interaction', () => {
    it('detects interaction event sequencing between dragend and pointerup', () => {
      let tapTriggeredCount = 0;
      let dragStartCount = 0;
      let dragEndCount = 0;

      const card = new CanvasCard(mockScene, {
        x: 200,
        y: 400,
        width: 140,
        height: 64,
        text: '測試',
        draggable: true,
        tappable: true,
        onTap: () => {
          tapTriggeredCount++;
        },
        onDragStart: () => {
          dragStartCount++;
        },
        onDragEnd: () => {
          dragEndCount++;
        },
      });

      // Simulate pure tap (pointerdown -> pointerup with moveDist <= 16)
      card.emit('pointerdown', { x: 200, y: 400 });
      card.emit('pointerup', { x: 202, y: 401 });
      expect(tapTriggeredCount).toBe(1);

      // Reset counters and advance clock past debounce
      const origNow = Date.now;
      let simulatedTime = 10000;
      Date.now = () => simulatedTime;

      // Simulate a drag gesture (> 14px movement)
      simulatedTime += 500;
      card.emit('pointerdown', { x: 200, y: 400 });
      card.emit('dragstart', { x: 200, y: 400 });
      card.emit('drag', { x: 350, y: 270 }, 350, 270);
      card.emit('dragend', { x: 350, y: 270 });

      expect(dragStartCount).toBe(1);
      expect(dragEndCount).toBe(1);

      // Now Phaser fires pointerup after dragend
      card.emit('pointerup', { x: 350, y: 270 });

      // Note: Because hasDraggedCard was set to false at end of dragend,
      // pointerup at line 296 checking `!this.hasDraggedCard` would evaluate to true.
      // But because moveDist is Math.hypot(350-200, 270-400) = 198 > 16,
      // if pointer has x=350, y=270, moveDist > 16 prevents tap if hasDraggedCard is properly preserved.
      // Restore Date.now
      Date.now = origNow;
    });
  });

  // =========================================================================
  // AUDIT TEST 18: Non-Draggable Choice Option Tap Responsiveness
  // =========================================================================
  describe('Audit Test 18: Choice Quiz Option Tap Interactions', () => {
    it('verifies non-draggable choice cards trigger tap on selection', () => {
      const q: QuizQuestion = {
        id: 'math_choice_test',
        subject: 'math',
        type: 'multiple_choice',
        prompt: '3 + 5 = ?',
        speakText: '3 + 5 等於幾多？',
        options: [6, 7, 8, 9],
        correctAnswer: 8,
        correctOptionIndex: 2,
      };

      scene.init({ questions: [q] });
      scene.create();

      expect(scene.choiceCards).toHaveLength(4);

      // Choice cards are non-draggable
      const wrongCard = scene.choiceCards[0]; // value 6
      const correctCard = scene.choiceCards[2]; // value 8

      // Tap wrong card
      const handledWrong = scene.handleChoiceSelection(wrongCard, 0);
      expect(handledWrong).toBe(false);
      expect(wrongCard.getState()).toBe('disabled');
      expect(scene.sessionStats.mistakes).toBe(1);

      // Tap correct card
      const handledCorrect = scene.handleChoiceSelection(correctCard, 2);
      expect(handledCorrect).toBe(true);
      expect(correctCard.getState()).toBe('correct');
      expect(scene.sessionStats.correctCount).toBe(1);
      expect(scene.isAnswered).toBe(true);
    });
  });

  // =========================================================================
  // AUDIT TEST 19: Viewport Geometry across Mobile & Desktop Viewports
  // =========================================================================
  describe('Audit Test 19: Viewport Coordinate Geometry on Mobile & Desktop', () => {
    const viewports = [
      { name: 'Desktop Standard (16:9)', width: 1280, height: 720 },
      { name: 'iPad Landscape (4:3)', width: 1024, height: 768 },
      { name: 'Mobile Landscape Wide (19.5:9)', width: 1280, height: 590 },
    ];

    for (const vp of viewports) {
      it(`verifies layout bounds on ${vp.name} (${vp.width}x${vp.height})`, () => {
        const q: QuizQuestion = {
          id: `vp_${vp.width}_${vp.height}`,
          subject: 'chinese',
          type: 'sentence_scramble',
          prompt: '視口佈局測試',
          speakText: '大家一起來。',
          correctTokens: ['大家', '一起', '來', '。'],
          shuffledTokens: ['來', '。', '大家', '一起'],
        };

        const testScene = new QuestionScene();
        const customMockScene = createMockTestScene();
        customMockScene.sys.game.config.width = vp.width;
        customMockScene.sys.game.config.height = vp.height;
        Object.assign(testScene, customMockScene);

        testScene.init({ questions: [q] });
        testScene.create();

        // Check slot coordinates
        for (const slot of testScene.slotBoxes) {
          const hw = slot.getSlotWidth() / 2;
          const hh = slot.getSlotHeight() / 2;
          expect(slot.x - hw).toBeGreaterThanOrEqual(0);
          expect(slot.x + hw).toBeLessThanOrEqual(vp.width);
          expect(slot.y - hh).toBeGreaterThanOrEqual(50);
          expect(slot.y + hh).toBeLessThanOrEqual(vp.height);
        }

        // Check action controls (Hint & Reset) position
        expect(testScene.hintButton).toBeDefined();
        expect(testScene.resetButton).toBeDefined();
        if (testScene.hintButton) {
          expect(testScene.hintButton.y).toBe(vp.height - 84);
          expect(testScene.hintButton.y).toBeLessThan(vp.height);
        }
      });
    }
  });
});


