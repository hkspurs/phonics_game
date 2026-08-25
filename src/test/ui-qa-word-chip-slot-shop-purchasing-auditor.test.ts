import { describe, it, expect, beforeEach, vi } from "vitest";
import { QuestionScene } from "../scenes/QuestionScene";
import { ShopScene } from "../scenes/ShopScene";
import { RunnerScene } from "../scenes/RunnerScene";
import { DataManager } from "../services/DataManager";
import { WARDROBE_ITEMS } from "../config/wardrobe";
import { QuizQuestion } from "../types";
import { createMockSceneForMeta } from "../scenes/MetaScenes.test";

describe("UI QA Tester 2: Word Chip Slot Insertion & Shop Gem Skin Purchasing Zero-Trust Audit Suite", () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });

    (DataManager as any).instance = undefined;
    vi.restoreAllMocks();
  });

  // Mock Scene Helper for QuestionScene
  function createMockQuestionScene(question: QuizQuestion) {
    const scene = new QuestionScene();
    const mockBase = createMockSceneForMeta("QuestionScene");

    mockBase.tweens.add = vi.fn((config: any) => {
      if (config?.targets) {
        const targets = Array.isArray(config.targets) ? config.targets : [config.targets];
        targets.forEach((t: any) => {
          if (config.x !== undefined) t.x = config.x;
          if (config.y !== undefined) t.y = config.y;
          if (config.scaleX !== undefined) t.scaleX = config.scaleX;
          if (config.scaleY !== undefined) t.scaleY = config.scaleY;
        });
      }
      if (typeof config?.onComplete === "function") {
        config.onComplete();
      }
      return { stop: vi.fn(), remove: vi.fn() };
    });

    let delayedCallback: Function | null = null;
    mockBase.time.delayedCall = vi.fn((_delay: number, cb: Function) => {
      delayedCallback = cb;
      return { remove: vi.fn() };
    });

    Object.assign(scene, mockBase);

    scene.stationId = 1;
    scene.questions = [question];
    scene.questionIndex = 0;
    scene.currentQuestion = question;
    scene.sessionStats = {
      hintsUsed: 0,
      mistakes: 0,
      correctCount: 0,
      startTime: Date.now(),
    };
    scene.isAnswered = false;
    scene.isTransitioning = false;

    // Trigger Mode A rendering
    scene.renderSentenceScrambleMode(1280, 720);
    return { scene, triggerDelayedCall: () => delayedCallback && delayedCallback() };
  }

  // Mock Scene Helper for ShopScene
  function createMockShopScene(tab: "skins" | "wardrobe" | "pets" | "gadgets" = "skins", selectedIdx: number = 0) {
    const scene = new ShopScene();
    const mockBase = createMockSceneForMeta("ShopScene");
    Object.assign(scene, mockBase);

    scene.currentTab = tab;
    scene.selectedSkinIndex = selectedIdx;
    scene.selectedWardrobeIndex = selectedIdx;

    const mockTextObj = (txt: string = "") => ({
      text: txt,
      setText: vi.fn(function (this: any, t: string) {
        this.text = t;
        return this;
      }),
      setColor: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
    });

    const mockButton = (initialText: string = "", initialColor: string = "grey") => ({
      text: initialText,
      color: initialColor,
      enabled: true,
      depth: 0,
      getText: function (this: any) {
        return this.text;
      },
      getColor: function (this: any) {
        return this.color;
      },
      isEnabled: function (this: any) {
        return this.enabled;
      },
      setText: vi.fn(function (this: any, t: string) {
        this.text = t;
        return this;
      }),
      setColor: vi.fn(function (this: any, c: string) {
        this.color = c;
        return this;
      }),
      setEnabled: vi.fn(function (this: any, e: boolean) {
        this.enabled = e;
        return this;
      }),
      setDepth: vi.fn(function (this: any, d: number) {
        this.depth = d;
        return this;
      }),
    });

    scene.coinText = mockTextObj("🪙 0") as any;
    scene.gemText = mockTextObj("💎 0") as any;
    scene.starText = mockTextObj("⭐ 0") as any;

    scene.previewNameText = mockTextObj() as any;
    scene.previewDescText = mockTextObj() as any;
    scene.previewSpeedText = mockTextObj() as any;
    scene.previewJumpText = mockTextObj() as any;
    scene.previewSpecialText = mockTextObj() as any;
    scene.previewWardrobeOverlay = mockTextObj() as any;

    scene.previewSprite = {
      setTexture: vi.fn(),
      clearTint: vi.fn(),
      setTint: vi.fn(),
    } as any;

    scene.actionButton = mockButton("👕 立即換裝", "green") as any;

    scene.skinCardButtons = scene.skins.map((_, i) =>
      mockButton(scene.skins[i].name, i === selectedIdx ? "yellow" : "grey") as any
    );

    scene.skinCardTextObjects = scene.skins.map((s) => ({
      name: mockTextObj(s.name) as any,
      perk: mockTextObj(s.perkDescription) as any,
      status: mockTextObj(`💎 ${s.costGems}`) as any,
    }));

    return scene;
  }

  // =========================================================================
  // SECTION 1: CHINESE & ENGLISH SENTENCE SCRAMBLE & CVC PHONICS AUDITING
  // =========================================================================
  describe("1. Sentence Scramble & Word Chip Interactions", () => {
    it("Audit 1.1: Chinese 3-Token sentence scramble with punctuation", () => {
      const q: QuizQuestion = {
        id: "zh_3_tokens",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "重組句子：太陽 出來 。",
        speakText: "太陽出來。",
        correctTokens: ["太陽", "出來", "。"],
        shuffledTokens: ["出來", "。", "太陽"],
      };

      const { scene } = createMockQuestionScene(q);
      expect(scene.slotBoxes.length).toBe(3);
      expect(scene.cardChips.length).toBe(3);

      expect(scene.slotBoxes[0].getExpectedValue()).toBe("太陽");
      expect(scene.slotBoxes[1].getExpectedValue()).toBe("出來");
      expect(scene.slotBoxes[2].getExpectedValue()).toBe("。");

      const chipSun = scene.cardChips.find((c) => c.getText() === "太陽")!;
      const chipOut = scene.cardChips.find((c) => c.getText() === "出來")!;
      const chipPunct = scene.cardChips.find((c) => c.getText() === "。")!;

      scene.handleCardTap(chipSun);
      expect(scene.slotBoxes[0].getPlacedCard()).toBe(chipSun);
      expect(chipSun.x).toBe(scene.slotBoxes[0].x);
      expect(chipSun.y).toBe(scene.slotBoxes[0].y);

      scene.handleCardTap(chipOut);
      expect(scene.slotBoxes[1].getPlacedCard()).toBe(chipOut);
      expect(chipOut.x).toBe(scene.slotBoxes[1].x);
      expect(chipOut.y).toBe(scene.slotBoxes[1].y);

      scene.handleCardTap(chipPunct);
      expect(scene.slotBoxes[2].getPlacedCard()).toBe(chipPunct);
      expect(chipPunct.x).toBe(scene.slotBoxes[2].x);
      expect(chipPunct.y).toBe(scene.slotBoxes[2].y);

      expect(scene.isAnswered).toBe(true);
      expect(scene.sessionStats.correctCount).toBe(1);
    });

    it("Audit 1.2: Chinese 4-Token sentence scramble with punctuation", () => {
      const q: QuizQuestion = {
        id: "zh_4_tokens",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "重組句子：小貓 在 睡覺 。",
        speakText: "小貓在睡覺。",
        correctTokens: ["小貓", "在", "睡覺", "。"],
        shuffledTokens: ["睡覺", "小貓", "。", "在"],
      };

      const { scene } = createMockQuestionScene(q);
      expect(scene.slotBoxes.length).toBe(4);
      expect(scene.cardChips.length).toBe(4);

      scene.cardChips.forEach((chip) => scene.handleCardTap(chip));
      expect(scene.isAnswered).toBe(false);
      expect(scene.sessionStats.mistakes).toBe(1);

      scene.handleReset();
      scene.slotBoxes.forEach((s) => {
        expect(s.hasCard()).toBe(false);
        expect(s.hasError()).toBe(false);
      });

      const order = ["小貓", "在", "睡覺", "。"];
      order.forEach((tok) => {
        const chip = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.handleCardTap(chip);
      });

      expect(scene.isAnswered).toBe(true);
      expect(scene.sessionStats.correctCount).toBe(1);
    });

    it("Audit 1.3: Chinese 5-Token sentence scramble", () => {
      const q: QuizQuestion = {
        id: "zh_5_tokens",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "重組句子：我 喜歡 看 圖書 。",
        speakText: "我喜歡看圖書。",
        correctTokens: ["我", "喜歡", "看", "圖書", "。"],
        shuffledTokens: ["圖書", "看", "我", "。", "喜歡"],
      };

      const { scene } = createMockQuestionScene(q);
      expect(scene.slotBoxes.length).toBe(5);
      expect(scene.cardChips.length).toBe(5);

      expect(scene.slotBoxes[0].getSlotWidth()).toBe(140);

      ["我", "喜歡", "看", "圖書", "。"].forEach((tok) => {
        const chip = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.handleCardTap(chip);
      });

      expect(scene.isAnswered).toBe(true);
    });

    it("Audit 1.4: Chinese 6-Token sentence scramble", () => {
      const q: QuizQuestion = {
        id: "zh_6_tokens",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "重組句子：春天 來了 花兒 開得 很美 。",
        speakText: "春天來了花兒開得很美。",
        correctTokens: ["春天", "來了", "花兒", "開得", "很美", "。"],
        shuffledTokens: ["很美", "春天", "。", "開得", "花兒", "來了"],
      };

      const { scene } = createMockQuestionScene(q);
      expect(scene.slotBoxes.length).toBe(6);
      expect(scene.cardChips.length).toBe(6);

      expect(scene.slotBoxes[0].getSlotWidth()).toBe(120);

      ["春天", "來了", "花兒", "開得", "很美", "。"].forEach((tok) => {
        const chip = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.handleCardTap(chip);
      });

      expect(scene.isAnswered).toBe(true);
    });

    it("Audit 1.5: English Sentence Scramble", () => {
      const q: QuizQuestion = {
        id: "en_scramble_1",
        subject: "english",
        type: "sentence_scramble",
        prompt: "Arrange the sentence: The cat is cute .",
        speakText: "The cat is cute.",
        correctTokens: ["The", "cat", "is", "cute", "."],
        shuffledTokens: ["cute", "The", ".", "is", "cat"],
      };

      const { scene } = createMockQuestionScene(q);
      expect(scene.slotBoxes.length).toBe(5);

      ["The", "cat", "is", "cute", "."].forEach((tok) => {
        const chip = scene.cardChips.find((c) => c.getText() === tok)!;
        scene.handleCardTap(chip);
      });

      expect(scene.isAnswered).toBe(true);
    });

    it("Audit 1.6: English CVC Phonics Letter Chips", () => {
      const q: QuizQuestion = {
        id: "cvc_phonics_cat",
        subject: "english",
        type: "sentence_scramble",
        prompt: "Phonics Spelling: /k/ /æ/ /t/ -> cat",
        speakText: "cat",
        correctTokens: ["c", "a", "t"],
        shuffledTokens: ["t", "c", "a"],
      };

      const { scene } = createMockQuestionScene(q);
      expect(scene.slotBoxes.length).toBe(3);

      ["c", "a", "t"].forEach((letter) => {
        const chip = scene.cardChips.find((c) => c.getText() === letter)!;
        scene.handleCardTap(chip);
      });

      expect(scene.isAnswered).toBe(true);
      expect(scene.sessionStats.correctCount).toBe(1);
    });
  });

  // =========================================================================
  // SECTION 2: TAP-TO-PLACE, TAP-TO-RETURN, DRAG-TO-SLOT PRECISION
  // =========================================================================
  describe("2. Physical Centering, Tap Return & Drag Collision Precision", () => {
    it("Audit 2.1: Tap-to-place matches slot center exactly (diffX === 0, diffY === 0)", () => {
      const q: QuizQuestion = {
        id: "zero_drift_test",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "重組測試",
        speakText: "紅花。",
        correctTokens: ["紅", "花"],
        shuffledTokens: ["花", "紅"],
      };

      const { scene } = createMockQuestionScene(q);
      const chipRed = scene.cardChips.find((c) => c.getText() === "紅")!;
      const slot0 = scene.slotBoxes[0];

      scene.handleCardTap(chipRed);

      const center = slot0.getCenterPosition();
      const diffX = chipRed.x - center.x;
      const diffY = chipRed.y - center.y;

      expect(diffX).toBe(0);
      expect(diffY).toBe(0);
      expect(chipRed.getState()).toBe("placed");
    });

    it("Audit 2.2: Tap placed chip returns to bank cleanly and clears slot error state", () => {
      const q: QuizQuestion = {
        id: "return_bank_test",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "重組測試",
        speakText: "早安。",
        correctTokens: ["早", "安"],
        shuffledTokens: ["安", "早"],
      };

      const { scene } = createMockQuestionScene(q);
      const chipAn = scene.cardChips.find((c) => c.getText() === "安")!;
      const homePos = chipAn.getHomePosition();

      scene.handleCardTap(chipAn);
      expect(chipAn.getCurrentSlot()).toBe(scene.slotBoxes[0]);

      const chipZao = scene.cardChips.find((c) => c.getText() === "早")!;
      scene.handleCardTap(chipZao);

      expect(scene.slotBoxes[0].hasError()).toBe(true);
      expect(scene.slotBoxes[1].hasError()).toBe(true);

      scene.handleCardTap(chipAn);
      expect(scene.slotBoxes[0].hasCard()).toBe(false);
      expect(scene.slotBoxes[0].hasError()).toBe(false);
      expect(chipAn.getCurrentSlot()).toBeNull();
      expect(chipAn.x).toBe(homePos.x);
      expect(chipAn.y).toBe(homePos.y);
      expect(chipAn.getState()).toBe("normal");
    });

    it("Audit 2.3: Drag-to-slot accepts valid drop within rectangular slot boundary", () => {
      const q: QuizQuestion = {
        id: "drag_valid_test",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "拖拽入框測試",
        speakText: "大象。",
        correctTokens: ["大", "象"],
        shuffledTokens: ["象", "大"],
      };

      const { scene } = createMockQuestionScene(q);
      const chipElephant = scene.cardChips.find((c) => c.getText() === "象")!;
      const slot0 = scene.slotBoxes[0];
      const center = slot0.getCenterPosition();

      chipElephant.setPosition(center.x + 10, center.y + 5);
      scene.handleCardDragEnd(chipElephant, {} as any);

      expect(slot0.getPlacedCard()).toBe(chipElephant);
      expect(chipElephant.x).toBe(center.x);
      expect(chipElephant.y).toBe(center.y);
    });

    it("Audit 2.4: Drag-to-slot rejects drop outside rectangular boundary and snaps back to bank", () => {
      const q: QuizQuestion = {
        id: "drag_reject_test",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "拖拽拒絕測試",
        speakText: "大象。",
        correctTokens: ["大", "象"],
        shuffledTokens: ["象", "大"],
      };

      const { scene } = createMockQuestionScene(q);
      const chipElephant = scene.cardChips.find((c) => c.getText() === "象")!;
      const homePos = chipElephant.getHomePosition();

      chipElephant.setPosition(100, 600);
      scene.handleCardDragEnd(chipElephant, {} as any);

      expect(chipElephant.getCurrentSlot()).toBeNull();
      expect(chipElephant.x).toBe(homePos.x);
      expect(chipElephant.y).toBe(homePos.y);
    });

    it("Audit 2.5: Drag chip from Slot A onto occupied Slot B swaps their positions seamlessly", () => {
      const q: QuizQuestion = {
        id: "drag_swap_test",
        subject: "chinese",
        type: "sentence_scramble",
        prompt: "交換測試",
        speakText: "好朋友。",
        correctTokens: ["好", "朋", "友"],
        shuffledTokens: ["朋", "好", "友"],
      };

      const { scene } = createMockQuestionScene(q);
      const chipPeng = scene.cardChips.find((c) => c.getText() === "朋")!;
      const chipHao = scene.cardChips.find((c) => c.getText() === "好")!;

      scene.handleCardTap(chipPeng);
      scene.handleCardTap(chipHao);
      expect(scene.slotBoxes[0].getPlacedCard()).toBe(chipPeng);
      expect(scene.slotBoxes[1].getPlacedCard()).toBe(chipHao);

      const slot1Center = scene.slotBoxes[1].getCenterPosition();
      chipPeng.setPosition(slot1Center.x, slot1Center.y);
      scene.handleCardDragEnd(chipPeng, {} as any);

      expect(scene.slotBoxes[0].getPlacedCard()).toBe(chipHao);
      expect(scene.slotBoxes[1].getPlacedCard()).toBe(chipPeng);
    });
  });

  // =========================================================================
  // SECTION 3: SHOP GEM/COIN PURCHASING OF ALL 5 SKINS & WARDROBE ITEMS
  // =========================================================================
  describe("3. Shop Gem Skin Purchasing & Wardrobe Equipping Auditing", () => {
    it("Audit 3.1: All 5 skins (Adventurer 0💎, Heroine 30💎, Soldier 60💎, Knight 100💎, Ninja 150💎) exact and surplus deductions", () => {
      const dm = DataManager.getInstance();

      expect(dm.getProfile().ownedSkins).toContain("adventurer");
      expect(dm.getProfile().equippedSkin).toBe("adventurer");

      dm.addGems(30);
      expect(dm.getProfile().gems).toBe(30);
      expect(dm.unlockSkin("heroine", 30, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain("heroine");

      dm.addGems(100);
      expect(dm.unlockSkin("soldier", 60, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(40);
      expect(dm.getProfile().ownedSkins).toContain("soldier");

      dm.addGems(60);
      expect(dm.getProfile().gems).toBe(100);
      expect(dm.unlockSkin("knight", 100, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain("knight");

      dm.addGems(150);
      expect(dm.unlockSkin("ninja", 150, 0)).toBe(true);
      expect(dm.getProfile().gems).toBe(0);
      expect(dm.getProfile().ownedSkins).toContain("ninja");

      expect(dm.getProfile().ownedSkins).toEqual(["adventurer", "heroine", "soldier", "knight", "ninja"]);
    });

    it("Audit 3.2: Immediate UI button status update in ShopScene", () => {
      const dm = DataManager.getInstance();
      dm.addGems(30);

      const scene = createMockShopScene("skins", 1);
      scene.updatePreviewDisplay();

      expect(scene.actionButton?.getText()).toBe("💎 30 購買解鎖");
      expect(scene.actionButton?.getColor()).toBe("yellow");
      expect(scene.actionButton?.isEnabled()).toBe(true);

      scene.handleActionClick();
      expect(dm.getProfile().ownedSkins).toContain("heroine");
      expect(dm.getProfile().equippedSkin).toBe("heroine");

      scene.updatePreviewDisplay();
      expect(scene.actionButton?.getText()).toBe("✅ 當前使用中");
      expect(scene.actionButton?.getColor()).toBe("grey");
      expect(scene.actionButton?.isEnabled()).toBe(false);

      scene.selectSkin(0);
      expect(scene.actionButton?.getText()).toBe("👕 立即換裝");
      expect(scene.actionButton?.getColor()).toBe("blue");
      expect(scene.actionButton?.isEnabled()).toBe(true);
    });

    it("Audit 3.3: Wardrobe items purchasing, equipping, unequipping and mutually exclusive dress/top/bottom logic", () => {
      const dm = DataManager.getInstance();
      dm.addCoins(500);

      const princessItem = WARDROBE_ITEMS.find((w) => w.id === "princess_dress")!;
      expect(princessItem).toBeDefined();
      expect(dm.buyWardrobeItem(princessItem.id, "coins")).toBe(true);
      expect(dm.getProfile().coins).toBe(250);
      expect(dm.isWardrobeOwned(princessItem.id)).toBe(true);

      expect(dm.equipWardrobeItem("dress", princessItem.id)).toBe(true);
      expect(dm.getEquippedWardrobe().dress).toBe("princess_dress");

      const sailorTop = WARDROBE_ITEMS.find((w) => w.id === "sailor_top")!;
      expect(sailorTop).toBeDefined();
      expect(dm.buyWardrobeItem(sailorTop.id, "coins")).toBe(true);
      expect(dm.getProfile().coins).toBe(170);
      expect(dm.equipWardrobeItem("top", sailorTop.id)).toBe(true);

      expect(dm.getEquippedWardrobe().top).toBe("sailor_top");
      expect(dm.getEquippedWardrobe().dress).toBeUndefined();

      expect(dm.unequipWardrobeItem("top")).toBe(true);
      expect(dm.getEquippedWardrobe().top).toBeUndefined();
    });

    it("Audit 3.4: Character equipping resolves correctly in RunnerScene", () => {
      const dm = DataManager.getInstance();
      dm.addGems(150);
      dm.unlockSkin("ninja", 150, 0);
      dm.equipSkin("ninja");

      const runner = new RunnerScene();
      runner.resolveEquippedSkin();

      expect(runner.skinConfig.id).toBe("ninja");
      expect(runner.skinConfig.speedMultiplier).toBe(1.3);
      expect(runner.skinConfig.jumpMultiplier).toBe(1.2);
      expect(runner.skinConfig.magnetRadius).toBe(190);
      expect(runner.currentSpeed).toBe(runner.baseSpeed * 1.3);
    });

    it("Audit 3.5: LocalStorage Persistence across reloads with profile reconstruction", () => {
      const dm = DataManager.getInstance();
      dm.addGems(100);
      dm.addCoins(500);
      dm.unlockSkin("knight", 100, 0);
      dm.equipSkin("knight");

      const savedRaw = localStorageMock["p1_adventure_save_v1"];
      expect(savedRaw).toBeDefined();

      const parsed = JSON.parse(savedRaw);
      expect(parsed.equippedSkin).toBe("knight");
      expect(parsed.ownedSkins).toContain("knight");
      expect(parsed.gems).toBe(0);
      expect(parsed.coins).toBe(500);

      (DataManager as any).instance = undefined;
      const reloadedDm = DataManager.getInstance();
      const reloadedProfile = reloadedDm.getProfile();

      expect(reloadedProfile.equippedSkin).toBe("knight");
      expect(reloadedProfile.ownedSkins).toContain("knight");
      expect(reloadedProfile.gems).toBe(0);
      expect(reloadedProfile.coins).toBe(500);
    });
  });
});
