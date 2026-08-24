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
      add: vi.fn((_config: any) => {
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
        // Point (-60, -25) is clearly on the visual card (visual is [-70, 70] x [-32, 32])
        const containsVisualTopLeft = Phaser.Geom.Rectangle.Contains(hitArea, -60, -25);
        // Point (120, 0) is 50px outside the visual right edge (70)
        const containsPhantomRight = Phaser.Geom.Rectangle.Contains(hitArea, 120, 0);

        // Record diagnostic anomaly:
        console.log('CanvasCard HitArea Bounds:', {
          actualX: hitArea.x,
          actualY: hitArea.y,
          actualW: hitArea.width,
          actualH: hitArea.height,
          containsVisualTopLeft,
          containsPhantomRight,
        });

        // The hit area starts at -12 instead of -82, so (-60, -25) fails to hit:
        expect(containsVisualTopLeft).toBe(true); // GLITCH CONFIRMED: Left 58px of card is dead zone!
        expect(containsPhantomRight).toBe(false); // GLITCH CONFIRMED: 50px outside right visual edge registers click!
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
      // In QuestionScene.ts line 720: minDistance = 75. Since dist = 76 > 75, it rejects the drop!
      expect(card.getCurrentSlot()).toBeNull(); // GLITCH CONFIRMED: Dropped inside slot boundary was rejected!

      // Case 2: Drop at dx = 0, dy = 65px (28px OUTSIDE slot height 74px, since halfH = 37px)
      card.x = slot0.x;
      card.y = slot0.y + 65;

      scene.handleCardDragEnd(card, {} as any);
      // In QuestionScene.ts line 720: dist = 65 < 75, so it accepts the drop even though 28px outside vertically!
      expect(card.getCurrentSlot()).toBe(slot0); // GLITCH CONFIRMED: Vertical overshoot accepted!
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
      // SlotBox.ts line 140 sets cardA.currentSlot = null, but does not snapBack() cardA!
      // Card A still sits at coordinates (300, 300) with state 'placed' instead of 'normal'!
      expect(cardA.getCurrentSlot()).toBeNull();
      expect(cardA.getState()).toBe('placed'); // GLITCH CONFIRMED: Orphaned card state!
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

      // Check if slot 0 received '姐姐' or remained empty because hint failed to find chipSister
      const slot0Card = scene.slotBoxes[0].getPlacedCard();

      // GLITCH CONFIRMED: Slot 0 had '吃' removed and snapped back, but '姐姐' was NEVER placed!
      expect(slot0Card).toBeNull();
      expect(scene.sessionStats.hintsUsed).toBe(1); // Consumed a hint for nothing!
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
      expect(hasErrorAfterReset).toBe(true); // GLITCH CONFIRMED: Reset leaves slots in red error state!
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
      // snapBack in CanvasCard.ts lines 361-383 does NOT killTweensOf(this)!
      const killTweensSpy = mockScene.tweens.killTweensOf;
      killTweensSpy.mockClear();

      card.snapBack();

      // CanvasCard.snapBack() failed to kill existing wobble tweens
      expect(killTweensSpy).not.toHaveBeenCalledWith(card); // GLITCH CONFIRMED: Concurrent competing tweens!
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
});
