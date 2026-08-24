import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { QuizQuestion, VoiceLanguage } from '../types';
import { QuestionEngine } from '../engine/QuestionEngine';
import { SentenceEngine } from '../engine/SentenceEngine';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasCard } from '../ui/CanvasCard';
import { SlotBox } from '../ui/SlotBox';
import { STATIONS } from './MapScene';

export interface QuestionSessionStats {
  hintsUsed: number;
  mistakes: number;
  correctCount: number;
  startTime: number;
}

export interface QuestionSceneInitData {
  stationId?: number;
  stationName?: string;
  questionIndex?: number;
  questions?: QuizQuestion[];
  sessionStats?: QuestionSessionStats;
}

/**
 * QuestionScene
 * Central interactive quiz scene for P1 Adventure.
 * Handles 3-question sequences per station (Chinese, Math, English) across two primary modes:
 * Mode A: Sentence Scramble (word chips tap/drag to slot, auto-check)
 * Mode B: Multiple Choice & Math Calculation (interactive options, immediate evaluation)
 */
export class QuestionScene extends Phaser.Scene {
  public stationId: number = 1;
  public stationName: string = '';
  public questionIndex: number = 0;
  public questions: QuizQuestion[] = [];
  public currentQuestion: QuizQuestion | null = null;
  public sessionStats: QuestionSessionStats = {
    hintsUsed: 0,
    mistakes: 0,
    correctCount: 0,
    startTime: 0,
  };

  public isAnswered: boolean = false;

  // UI Components
  public transitionTimer: Phaser.Time.TimerEvent | null = null;
  public backButton: CanvasButton | null = null;
  public speakerButton: CanvasButton | null = null;
  public hintButton: CanvasButton | null = null;
  public resetButton: CanvasButton | null = null;

  public headerTitleText: Phaser.GameObjects.Text | null = null;
  public progressCounterText: Phaser.GameObjects.Text | null = null;
  public promptText: Phaser.GameObjects.Text | null = null;

  // Mode A: Sentence Scramble
  public slotBoxes: SlotBox[] = [];
  public cardChips: CanvasCard[] = [];

  // Mode B: Choice Quiz
  public choiceCards: CanvasCard[] = [];

  // Containers
  public headerContainer: Phaser.GameObjects.Container | null = null;
  public promptContainer: Phaser.GameObjects.Container | null = null;
  public contentContainer: Phaser.GameObjects.Container | null = null;
  public controlsContainer: Phaser.GameObjects.Container | null = null;
  public celebrationContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'QuestionScene' });
  }

  /**
   * Scene initialization hook with payload from MapScene or RunnerScene
   */
  public init(data?: QuestionSceneInitData): void {
    this.stationId = data?.stationId ?? 1;
    this.stationName =
      data?.stationName ??
      STATIONS.find((s) => s.id === this.stationId)?.name ??
      '冒險關卡';

    this.questionIndex = data?.questionIndex ?? 0;
    this.sessionStats = data?.sessionStats ?? {
      hintsUsed: 0,
      mistakes: 0,
      correctCount: 0,
      startTime: Date.now(),
    };

    if (data?.questions && data.questions.length > 0) {
      this.questions = [...data.questions];
    } else {
      let diff = 1;
      try {
        diff = DataManager.getInstance().getProfile().settings.difficulty || 1;
      } catch {
        diff = 1;
      }
      this.questions = QuestionEngine.getStationQuestions(this.stationId, diff);
    }

    // Clamp questionIndex
    if (this.questionIndex < 0) this.questionIndex = 0;
    if (this.questionIndex >= this.questions.length && this.questions.length > 0) {
      this.questionIndex = this.questions.length - 1;
    }

    this.currentQuestion = this.questions[this.questionIndex] || null;
    this.isAnswered = false;

    // Reset component collections
    this.slotBoxes = [];
    this.cardChips = [];
    this.choiceCards = [];
  }

  public create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    // 1. Draw Themed Background
    this.createBackground(width, height);

    // 2. Fixed Header (Back Button, Level Title, Progress Bar)
    this.createHeaderHUD(width);

    // 3. Prompt Banner (Instruction, Subject Badge, Speaker Button)
    this.createPromptBanner(width);

    // 4. Render Mode-Specific Interactive UI
    if (this.currentQuestion) {
      if (this.currentQuestion.type === 'sentence_scramble') {
        this.renderSentenceScrambleMode(width, height);
      } else {
        this.renderChoiceQuizMode(width, height);
      }
    }

    // 5. Action Controls (💡 提示, 🔄 重置)
    this.createActionControls(width, height);

    // 6. Automatically read the question prompt aloud after 1 second delay
    if (this.time?.delayedCall) {
      this.time.delayedCall(1000, () => {
        const isActive = typeof this.scene?.isActive === 'function' ? this.scene.isActive() : true;
        if (isActive && !this.isAnswered) {
          this.speakCurrentQuestion();
        }
      });
    }
  }

  /**
   * Creates a rich atmospheric background with subtle gradients and sparkles
   */
  private createBackground(width: number, height: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillGradientStyle(0x131a2a, 0x131a2a, 0x0c101b, 0x0c101b, 1);
      g.fillRect(0, 0, width, height);

      // Subtle atmospheric circular glows
      g.fillStyle(0x1d3557, 0.35);
      g.fillCircle(200, 180, 220);
      g.fillStyle(0x457b9d, 0.2);
      g.fillCircle(1100, 520, 260);

      // Subtle border line
      g.lineStyle(2, 0x2b3952, 0.8);
      g.strokeRect(0, 0, width, height);
    } else if (this.add.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x131a2a);
    }

    // Background floating stars
    this.createAmbientStars();
  }

  private createAmbientStars(): void {
    if (!this.add?.text || !this.tweens?.add) return;

    const starCoords = [
      { x: 120, y: 140, size: '14px', delay: 0 },
      { x: 1180, y: 120, size: '16px', delay: 400 },
      { x: 240, y: 640, size: '12px', delay: 800 },
      { x: 1060, y: 620, size: '14px', delay: 1200 },
      { x: 640, y: 670, size: '10px', delay: 600 },
    ];

    for (const item of starCoords) {
      const star = this.add.text(item.x, item.y, '✨', {
        fontSize: item.size,
      });
      if (typeof star.setOrigin === 'function') star.setOrigin(0.5);

      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        scale: { from: 0.8, to: 1.2 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
        delay: item.delay,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Top Bar: Back Button, Station/Level Header, Progress Bar & Counter
   */
  private createHeaderHUD(width: number): void {
    if (!this.add) return;

    const header = this.add.container
      ? this.add.container(0, 0)
      : new Phaser.GameObjects.Container(this, 0, 0);

    header.setDepth(100);

    // 1. Back Button (◀ 返回地圖)
    this.backButton = new CanvasButton(this, {
      x: 95,
      y: 42,
      width: 130,
      height: 46,
      text: '◀ 返回地圖',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        if (this.transitionTimer) {
          this.transitionTimer.remove();
          this.transitionTimer = null;
        }
        SoundManager.play('click');
        SpeechService.stop();
        if (this.scene) {
          this.scene.start('MapScene');
        }
      },
    });
    header.add(this.backButton);

    // 1b. Quick Station Restart (🔄 重試本關)
    const restartBtn = new CanvasButton(this, {
      x: 235,
      y: 42,
      width: 130,
      height: 46,
      text: '🔄 重試本關',
      color: 'orange',
      fontSize: '18px',
      onClick: () => {
        if (this.transitionTimer) {
          this.transitionTimer.remove();
          this.transitionTimer = null;
        }
        SoundManager.play('click');
        SpeechService.stop();
        if (this.scene) {
          this.scene.start('QuestionScene', {
            stationId: this.stationId,
            stationName: this.stationName,
            questionIndex: 0,
            totalQuestions: this.questions.length,
            questions: this.questions,
            sessionStats: { hintsUsed: 0, mistakes: 0, correctCount: 0, startTime: Date.now() },
          });
        }
      },
    });
    header.add(restartBtn);

    // 2. Station & Level Header (e.g. 第 3-1 關 櫻花樹・中文)
    const levelNumber = `${this.stationId}-${this.questionIndex + 1}`;
    const subjectName = this.getCurrentSubjectName();
    const titleString = `第 ${levelNumber} 關  ${this.stationName}・${subjectName}`;

    if (this.add.text) {
      const title = this.add.text(width / 2, 28, titleString, {
        fontSize: '22px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof title.setOrigin === 'function') title.setOrigin(0.5);
      this.headerTitleText = title;
      header.add(title);
    }

    // 3. Progress Bar & Counter (第 1 / 3 題)
    const barWidth = 260;
    const barHeight = 12;
    const barX = width / 2;
    const barY = 56;
    const totalQ = Math.max(1, this.questions.length);
    const progressRatio = (this.questionIndex + 1) / totalQ;

    if (this.add.graphics) {
      const barG = this.add.graphics();
      // Background bar
      barG.fillStyle(0x1e293b, 0.9);
      barG.fillRoundedRect(barX - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, 6);
      barG.lineStyle(1.5, 0x475569, 0.8);
      barG.strokeRoundedRect(barX - barWidth / 2, barY - barHeight / 2, barWidth, barHeight, 6);

      // Fill progress bar
      const fillW = Math.max(8, barWidth * progressRatio);
      barG.fillStyle(0x38bdf8, 1.0);
      barG.fillRoundedRect(barX - barWidth / 2, barY - barHeight / 2, fillW, barHeight, 6);
      header.add(barG);
    }

    if (this.add.text) {
      const counterLabel = this.add.text(
        barX + barWidth / 2 + 18,
        barY,
        `第 ${this.questionIndex + 1} / ${totalQ} 題`,
        {
          fontSize: '14px',
          fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
          color: '#94a3b8',
          fontStyle: 'bold',
          resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
        }
      );
      if (typeof counterLabel.setOrigin === 'function') counterLabel.setOrigin(0, 0.5);
      this.progressCounterText = counterLabel;
      header.add(counterLabel);
    }

    this.headerContainer = header;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(header);
    }
  }

  /**
   * Prompt Banner with instructions, subject pill badge and speaker button
   */
  private createPromptBanner(width: number): void {
    if (!this.add) return;

    const bannerW = Math.min(width - 60, 1160);
    const bannerH = 108;
    const bannerX = width / 2;
    const bannerY = 135;

    const banner = this.add.container
      ? this.add.container(bannerX, bannerY)
      : new Phaser.GameObjects.Container(this, bannerX, bannerY);

    banner.setDepth(90);

    // Banner Background Card (Large, prominent container for question & audio)
    if (this.add.graphics) {
      const bg = this.add.graphics();
      bg.fillStyle(0x1a2333, 0.92);
      bg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 18);

      const subjectColor = this.getSubjectColor();
      bg.lineStyle(2.5, subjectColor, 0.85);
      bg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 18);

      // Subject Badge Pill
      bg.fillStyle(subjectColor, 1.0);
      bg.fillRoundedRect(-bannerW / 2 + 20, -22, 110, 44, 12);
      banner.add(bg);
    }

    // Subject Badge Label
    if (this.add.text) {
      const subjectTag = this.add.text(-bannerW / 2 + 75, 0, `[${this.getCurrentSubjectName()}]`, {
        fontSize: '18px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang HK', 'Noto Sans TC', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof subjectTag.setOrigin === 'function') subjectTag.setOrigin(0.5);
      banner.add(subjectTag);
    }

    // Prompt Instruction Text (Big and clearly legible)
    const promptStr = this.currentQuestion?.prompt || '請回答以下問題：';
    if (this.add.text) {
      const promptLbl = this.add.text(-bannerW / 2 + 150, 0, promptStr, {
        fontSize: promptStr.length > 32 ? '22px' : '26px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang HK', 'Noto Sans TC', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'left',
        wordWrap: { width: bannerW - 350 },
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof promptLbl.setOrigin === 'function') promptLbl.setOrigin(0, 0.5);
      this.promptText = promptLbl;
      banner.add(promptLbl);
    }

    // Prominent Speaker Button (🔊 朗讀)
    this.speakerButton = new CanvasButton(this, {
      x: bannerW / 2 - 95,
      y: 0,
      width: 140,
      height: 52,
      text: '🔊 朗讀',
      color: 'yellow',
      fontSize: '20px',
      onClick: () => {
        SoundManager.play('click');
        this.speakCurrentQuestion();
      },
    });
    banner.add(this.speakerButton);

    this.promptContainer = banner;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(banner);
    }
  }

  /**
   * Mode A: Sentence Scramble Mode
   * Displays target slot boxes and draggable/tappable word chips
   */
  public renderSentenceScrambleMode(width: number, _height: number): void {
    if (!this.currentQuestion) return;

    this.slotBoxes = [];
    this.cardChips = [];

    const expectedTokens = this.currentQuestion.correctTokens || [];
    const tokensCount = expectedTokens.length;
    if (tokensCount === 0) return;

    // 1. Calculate dynamic slot sizing and positions
    const spacing = tokensCount > 6 ? 12 : 16;
    let cardWidth = 155;
    const cardHeight = 74;

    if (tokensCount === 5) cardWidth = 140;
    else if (tokensCount === 6) cardWidth = 120;
    else if (tokensCount >= 7) {
      cardWidth = Math.min(110, Math.floor((1050 - (tokensCount - 1) * spacing) / tokensCount));
    }

    const totalSlotsWidth = tokensCount * cardWidth + (tokensCount - 1) * spacing;
    const startX = width / 2 - totalSlotsWidth / 2 + cardWidth / 2;
    const slotY = 270;

    // 2. Create Target SlotBoxes
    for (let i = 0; i < tokensCount; i++) {
      const xPos = startX + i * (cardWidth + spacing);
      const slot = new SlotBox(this, {
        x: xPos,
        y: slotY,
        width: cardWidth,
        height: cardHeight,
        index: i,
        expectedValue: expectedTokens[i],
        placeholder: `${i + 1}`,
      });

      // Tapping a slot that contains a card removes the card back to bank
      if (typeof slot.setInteractive === 'function') {
        slot.setInteractive({ useHandCursor: true });
        slot.on('pointerup', () => {
          if (slot.hasCard()) {
            this.handleSlotCardRemoval(slot);
          }
        });
      }

      this.slotBoxes.push(slot);
    }

    // 3. Create Draggable & Tappable Word Chips in Bank
    const bankTokens =
      this.currentQuestion.shuffledTokens && this.currentQuestion.shuffledTokens.length === tokensCount
        ? [...this.currentQuestion.shuffledTokens]
        : SentenceEngine.shuffleTokens(expectedTokens);

    const bankY = 425;
    const bankTotalW = tokensCount * cardWidth + (tokensCount - 1) * spacing;
    const bankStartX = width / 2 - bankTotalW / 2 + cardWidth / 2;

    const colors: ('blue' | 'yellow' | 'purple' | 'green')[] = ['blue', 'yellow', 'purple', 'green'];

    for (let i = 0; i < tokensCount; i++) {
      const chipX = bankStartX + i * (cardWidth + spacing);
      const chipY = bankY;
      const token = bankTokens[i];

      const card = new CanvasCard(this, {
        x: chipX,
        y: chipY,
        width: cardWidth,
        height: cardHeight,
        text: token,
        value: token,
        color: colors[i % colors.length],
        draggable: true,
        tappable: true,
        fontSize: token.length <= 2 ? '34px' : token.length <= 4 ? '28px' : '24px',
        onTap: (c) => this.handleCardTap(c),
        onDragStart: (c) => {
          c.setDepth(100);
        },
        onDragEnd: (c, pointer) => {
          this.handleCardDragEnd(c, pointer);
        },
      });

      this.cardChips.push(card);
    }
  }

  /**
   * Mode B: Multiple Choice & Math Calculation Mode
   * Displays spacious choice selection cards without redundant duplicate boxes
   */
  public renderChoiceQuizMode(width: number, _height: number): void {
    if (!this.currentQuestion) return;

    this.choiceCards = [];

    // Choice Option Cards (2x2 grid or horizontal row)
    const options = this.currentQuestion.options || [];
    const count = options.length;
    if (count === 0) return;

    const themeColors: ('blue' | 'yellow' | 'purple' | 'green')[] = [
      'blue',
      'yellow',
      'purple',
      'green',
    ];

    if (count <= 3) {
      // Single horizontal row for 2 or 3 choices
      const optW = count === 2 ? 350 : 290;
      const optH = 96;
      const spacing = 32;
      const totalW = count * optW + (count - 1) * spacing;
      const startX = width / 2 - totalW / 2 + optW / 2;
      const optY = 340;

      options.forEach((opt, idx) => {
        const xPos = startX + idx * (optW + spacing);
        const card = new CanvasCard(this, {
          x: xPos,
          y: optY,
          width: optW,
          height: optH,
          text: String(opt),
          value: opt,
          color: themeColors[idx % themeColors.length],
          tappable: true,
          fontSize: String(opt).length > 8 ? '28px' : '38px',
          onTap: (c) => this.handleChoiceSelection(c, idx),
        });
        this.choiceCards.push(card);
      });
    } else {
      // 2x2 Grid for 4 options (spacious, clear, and easy to tap)
      const optW = 390;
      const optH = 92;
      const row1Y = 285;
      const row2Y = 415;
      const col1X = width / 2 - 215;
      const col2X = width / 2 + 215;

      const positions = [
        { x: col1X, y: row1Y },
        { x: col2X, y: row1Y },
        { x: col1X, y: row2Y },
        { x: col2X, y: row2Y },
      ];

      options.slice(0, 4).forEach((opt, idx) => {
        const pos = positions[idx];
        const card = new CanvasCard(this, {
          x: pos.x,
          y: pos.y,
          width: optW,
          height: optH,
          text: String(opt),
          value: opt,
          color: themeColors[idx % themeColors.length],
          tappable: true,
          fontSize: String(opt).length > 8 ? '26px' : '36px',
          onTap: (c) => this.handleChoiceSelection(c, idx),
        });
        this.choiceCards.push(card);
      });
    }
  }

  /**
   * Action Controls (💡 提示, 🔄 重置)
   */
  private createActionControls(width: number, height: number): void {
    if (!this.add) return;

    const isScramble = this.currentQuestion?.type === 'sentence_scramble';
    const controlsY = height - 84; // Safe margin from iPhone Home Indicator bar

    const controls = this.add.container
      ? this.add.container(0, 0)
      : new Phaser.GameObjects.Container(this, 0, 0);

    controls.setDepth(90);

    // 💡 提示 (Hint Button)
    const hintX = isScramble ? width / 2 - 110 : width / 2;
    this.hintButton = new CanvasButton(this, {
      x: hintX,
      y: controlsY,
      width: 170,
      height: 54,
      text: '💡 提示',
      color: 'yellow',
      fontSize: '22px',
      onClick: () => {
        this.handleHint();
      },
    });
    controls.add(this.hintButton);

    // 🔄 重置 (Reset Button)
    if (isScramble) {
      this.resetButton = new CanvasButton(this, {
        x: width / 2 + 110,
        y: controlsY,
        width: 170,
        height: 54,
        text: '🔄 重置',
        color: 'orange',
        fontSize: '22px',
        onClick: () => {
          this.handleReset();
        },
      });
      controls.add(this.resetButton);
    }

    this.controlsContainer = controls;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(controls);
    }
  }

  /**
   * Handles tapping a word chip in Sentence Scramble mode
   */
  public handleCardTap(card: CanvasCard): void {
    if (this.isAnswered) return;

    // If card is already in a slot, clicking it removes it
    if (card.getCurrentSlot()) {
      this.handleSlotCardRemoval(card.getCurrentSlot());
      return;
    }

    // Place into first empty slot
    const emptySlot = this.slotBoxes.find((s) => !s.hasCard());
    if (emptySlot) {
      SoundManager.play('click');
      emptySlot.setPlacedCard(card);
      this.evaluateSentenceScramble();
    }
  }

  /**
   * Handles removing a card from a slot back to its bank home position
   */
  public handleSlotCardRemoval(slot: SlotBox): void {
    if (this.isAnswered) return;

    const card = slot.removePlacedCard();
    if (card) {
      SoundManager.play('click');
      card.snapBack();
    }
  }

  /**
   * Handles drag end collision detection for word chips
   */
  public handleCardDragEnd(card: CanvasCard, _pointer: Phaser.Input.Pointer): void {
    if (this.isAnswered) return;

    // Find nearest slot
    let targetSlot: SlotBox | null = null;
    let minDistance = 75;

    for (const slot of this.slotBoxes) {
      const center = slot.getCenterPosition();
      const dist = Math.hypot(card.x - center.x, card.y - center.y);
      if (dist < minDistance) {
        minDistance = dist;
        targetSlot = slot;
      }
    }

    if (targetSlot) {
      // If target slot already holds a different card, swap or return it
      const existing = targetSlot.getPlacedCard();
      const oldSlot = card.getCurrentSlot();

      if (existing && existing !== card) {
        if (oldSlot) {
          targetSlot.removePlacedCard();
          oldSlot.removePlacedCard();
          targetSlot.setPlacedCard(card);
          oldSlot.setPlacedCard(existing);
        } else {
          targetSlot.removePlacedCard();
          existing.snapBack();
          targetSlot.setPlacedCard(card);
        }
      } else {
        if (oldSlot) {
          oldSlot.removePlacedCard();
        }
        targetSlot.setPlacedCard(card);
      }

      SoundManager.play('click');
      this.evaluateSentenceScramble();
    } else {
      // Dropped away from slots
      if (card.getCurrentSlot()) {
        card.getCurrentSlot().removePlacedCard();
      }
      card.snapBack();
    }
  }

  /**
   * Evaluates if the current sentence scramble is completely and correctly ordered
   */
  public evaluateSentenceScramble(): boolean {
    const allFilled = this.slotBoxes.length > 0 && this.slotBoxes.every((s) => s.hasCard());
    if (!allFilled) return false;

    const placedTokens = this.slotBoxes.map((s) => s.getPlacedCard()?.getText() || '');
    const expectedTokens = this.currentQuestion?.correctTokens || [];

    const isCorrect = SentenceEngine.verifyOrder(placedTokens, expectedTokens);

    if (isCorrect) {
      this.onCorrectAnswer();
      return true;
    } else {
      SoundManager.playSoftWrong();
      this.sessionStats.mistakes++;

      for (const slot of this.slotBoxes) {
        if (!slot.isCorrect()) {
          slot.setError(true);
          slot.getPlacedCard()?.wobble();
        }
      }

      // Reset slot error highlights after short delay
      if (this.time?.delayedCall) {
        this.time.delayedCall(900, () => {
          for (const s of this.slotBoxes) {
            s.setError(false);
          }
        });
      }
      return false;
    }
  }

  /**
   * Handles choice selection in Choice Quiz mode
   */
  public handleChoiceSelection(card: CanvasCard, index: number): boolean {
    if (this.isAnswered || card.getState() === 'disabled') return false;

    const isCorrect =
      (this.currentQuestion?.correctOptionIndex !== undefined &&
        index === this.currentQuestion.correctOptionIndex) ||
      (this.currentQuestion?.correctAnswer !== undefined &&
        (card.getValue() === this.currentQuestion.correctAnswer ||
          String(card.getValue()) === String(this.currentQuestion.correctAnswer)));

    if (isCorrect) {
      card.setState('correct');
      card.pulse();
      this.onCorrectAnswer();
      return true;
    } else {
      SoundManager.playSoftWrong();
      this.sessionStats.mistakes++;
      card.wobble();
      card.setDisabled(true);
      return false;
    }
  }

  /**
   * Hint Action
   * Sentence Scramble: Auto-places the next correct token into its slot
   * Multiple Choice: Eliminates 1 wrong distractor option
   */
  public handleHint(): void {
    if (this.isAnswered || !this.currentQuestion) return;

    if (this.currentQuestion.type === 'sentence_scramble') {
      const expected = this.currentQuestion.correctTokens || [];
      // Find first slot that is empty or incorrect
      let targetIndex = -1;
      for (let i = 0; i < this.slotBoxes.length; i++) {
        const slot = this.slotBoxes[i];
        if (!slot.hasCard() || slot.getPlacedCard()?.getText() !== expected[i]) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex >= 0) {
        this.sessionStats.hintsUsed++;
        SoundManager.playCardSnap();

        const targetSlot = this.slotBoxes[targetIndex];
        if (targetSlot.hasCard()) {
          targetSlot.removePlacedCard()?.snapBack();
        }

        const expectedVal = expected[targetIndex];
        // Find chip with expectedVal that is not currently in a slot
        const chip = this.cardChips.find(
          (c) => c.getText() === expectedVal && c.getCurrentSlot() === null
        );

        if (chip) {
          targetSlot.setPlacedCard(chip);
          chip.pulse();
          this.evaluateSentenceScramble();
        }
      }
    } else {
      // Eliminate one un-disabled incorrect choice option
      const wrongCards = this.choiceCards.filter((card, idx) => {
        if (card.getState() === 'disabled') return false;
        if (this.currentQuestion?.correctOptionIndex !== undefined) {
          return idx !== this.currentQuestion.correctOptionIndex;
        }
        if (this.currentQuestion?.correctAnswer !== undefined) {
          return (
            card.getValue() !== this.currentQuestion.correctAnswer &&
            String(card.getValue()) !== String(this.currentQuestion.correctAnswer)
          );
        }
        return true;
      });

      if (wrongCards.length > 0) {
        this.sessionStats.hintsUsed++;
        SoundManager.playCardSnap();
        const toEliminate = wrongCards[0];
        toEliminate.wobble();
        toEliminate.setDisabled(true);
      }

      if (this.currentQuestion.hintText) {
        SpeechService.speak(this.currentQuestion.hintText, this.getVoiceLanguage());
      }
    }
  }

  /**
   * Helper alias for tests and automated agents
   */
  public useHint(): void {
    this.handleHint();
  }

  /**
   * Reset Action (Sentence Scramble mode)
   * Clears all placed cards from slots and snaps them back to bank
   */
  public handleReset(): void {
    if (this.isAnswered) return;

    SoundManager.playCardSnap();
    for (const slot of this.slotBoxes) {
      const card = slot.removePlacedCard();
      if (card) {
        card.snapBack();
      }
    }
  }

  /**
   * Handles correct answer: plays sound, speaks full sentence, shows celebration,
   * records stats to DataManager, and transitions to RunnerScene
   */
  public onCorrectAnswer(): void {
    if (this.isAnswered || !this.currentQuestion) return;
    this.isAnswered = true;

    this.sessionStats.correctCount++;

    // 1. Record stats in DataManager
    try {
      DataManager.getInstance().recordCorrectAnswer(this.currentQuestion.subject);
    } catch {
      // Ignore
    }

    // 2. Play Audio & Speech
    SoundManager.playComboCorrect(this.sessionStats.correctCount);
    const speakSentence =
      this.currentQuestion.speakText || this.currentQuestion.prompt || '';
    SpeechService.speak(speakSentence, this.getVoiceLanguage());

    // 3. Play Celebration Visuals
    this.playCelebrationEffect();

    // 4. Delayed Transition to RunnerScene with Tap-to-Fast-Forward
    const isComplete = this.questionIndex >= this.questions.length - 1;
    const isRainbow = this.sessionStats.correctCount >= 2;

    const executeTransition = () => {
      if (this.transitionTimer) {
        this.transitionTimer.remove();
        this.transitionTimer = null;
      }
      const isSceneActive = this.scene && (typeof (this.scene as any).isActive === 'function' ? this.scene.isActive('QuestionScene') : true);
      if (this.scene && isSceneActive) {
        this.scene.start('RunnerScene', {
          stationId: this.stationId,
          stationName: this.stationName,
          questionIndex: this.questionIndex,
          isStationComplete: isComplete,
          totalQuestions: this.questions.length,
          questions: this.questions,
          sessionStats: this.sessionStats,
          isRainbowRush: isRainbow,
        });
      }
    };

    if (this.input) {
      this.input.once('pointerdown', executeTransition);
    }

    if (this.time?.delayedCall) {
      if (this.transitionTimer) {
        this.transitionTimer.remove();
      }
      this.transitionTimer = this.time.delayedCall(1200, executeTransition);
    }
  }

  /**
   * Spawns celebration confetti and feedback banner
   */
  public playCelebrationEffect(): void {
    if (!this.add) return;

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    const celebration = this.add.container
      ? this.add.container(width / 2, height / 2)
      : new Phaser.GameObjects.Container(this, width / 2, height / 2);

    celebration.setDepth(500);

    // Feedback Toast Banner
    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(0x2ecc71, 0.95);
      g.fillRoundedRect(-180, -35, 360, 70, 20);
      g.lineStyle(3, 0xffffff, 1.0);
      g.strokeRoundedRect(-180, -35, 360, 70, 20);
      celebration.add(g);
    }

    if (this.add.text) {
      const msg = this.add.text(0, 0, '🎉 太棒了！答對了！', {
        fontSize: '24px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof msg.setOrigin === 'function') msg.setOrigin(0.5);
      celebration.add(msg);
    }

    // Sparkles burst
    if (this.add.text && this.tweens?.add) {
      const emojis = ['⭐', '✨', '🌟', '🎊', '🎉'];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 140;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        const particle = this.add.text(0, 0, emojis[i % emojis.length], {
          fontSize: '22px',
        });
        if (typeof particle.setOrigin === 'function') particle.setOrigin(0.5);
        celebration.add(particle);

        this.tweens.add({
          targets: particle,
          x: tx,
          y: ty,
          scale: { from: 0.5, to: 1.5 },
          alpha: { from: 1.0, to: 0.0 },
          duration: 900,
          ease: 'Cubic.easeOut',
        });
      }
    }

    this.celebrationContainer = celebration;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(celebration);
    }
  }

  /**
   * Speaks the current question text via SpeechService.
   * For sentence scramble questions, reads the instruction prompt so it doesn't give away the answer before solving.
   */
  public speakCurrentQuestion(): void {
    if (!this.currentQuestion) return;
    const text = this.currentQuestion.type === 'sentence_scramble'
      ? (this.currentQuestion.prompt || '重組句子：請把字詞排列成通順的句子。')
      : (this.currentQuestion.speakText || this.currentQuestion.prompt);
    SpeechService.speak(text, this.getVoiceLanguage());
  }

  /**
   * Resolves appropriate voice language for speech synthesis
   */
  public getVoiceLanguage(): VoiceLanguage {
    if (this.currentQuestion?.subject === 'english') {
      return 'en-US';
    }
    try {
      const userLang = DataManager.getInstance().getProfile().settings.voiceLanguage;
      return userLang || 'zh-HK';
    } catch {
      return 'zh-HK';
    }
  }

  /**
   * Gets display subject name in Chinese
   */
  public getCurrentSubjectName(): string {
    if (!this.currentQuestion) return '學科問答';
    switch (this.currentQuestion.subject) {
      case 'chinese':
        return '中文';
      case 'math':
        return '數學';
      case 'english':
        return '英文';
      default:
        return '學科';
    }
  }

  /**
   * Gets theme color based on current question subject
   */
  private getSubjectColor(): number {
    if (!this.currentQuestion) return 0x4a90e2;
    switch (this.currentQuestion.subject) {
      case 'chinese':
        return 0xe76f51;
      case 'math':
        return 0x2a9d8f;
      case 'english':
        return 0x7209b7;
      default:
        return 0x4a90e2;
    }
  }
}
