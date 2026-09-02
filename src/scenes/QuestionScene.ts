import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, normalizeStationId, StationId } from '../config';
import { QuizQuestion, VoiceLanguage } from '../types';
import { QuestionEngine } from '../engine/QuestionEngine';
import { SentenceEngine } from '../engine/SentenceEngine';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasCard } from '../ui/CanvasCard';
import { SlotBox } from '../ui/SlotBox';
import { PlayerAvatarBadge } from '../ui/PlayerAvatarBadge';
import { STATIONS } from './MapScene';
import { PedagogyEngine } from '../engine/PedagogyEngine';

export interface QuestionSessionStats {
  hintsUsed: number;
  mistakes: number;
  correctCount: number;
  startTime: number;
  collectedCoins?: number;
  collectedGems?: number;
}

export interface QuestionSceneInitData {
  stationId?: StationId;
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
  public currentAttemptNumber: number = 0;
  public currentQuestionStartTime: number = Date.now();
  public currentHintLevel: number = 0;

  // UI Components
  public transitionTimer: Phaser.Time.TimerEvent | null = null;
  public autoReadTimer: Phaser.Time.TimerEvent | null = null;
  public isTransitioning: boolean = false;
  public lastRemovalTime: number = 0;
  public backButton: CanvasButton | null = null;
  public speakerButton: CanvasButton | null = null;
  public hintButton: CanvasButton | null = null;
  public resetButton: CanvasButton | null = null;

  public headerTitleText: Phaser.GameObjects.Text | null = null;
  public progressCounterText: Phaser.GameObjects.Text | null = null;
  public promptText: Phaser.GameObjects.Text | null = null;
  public avatarBadge: PlayerAvatarBadge | null = null;
  public feedbackContainer: Phaser.GameObjects.Container | null = null;

  // Mode A: Sentence Scramble
  public slotBoxes: SlotBox[] = [];
  public cardChips: CanvasCard[] = [];

  // Mode B: Choice Quiz
  public choiceCards: CanvasCard[] = [];
  public choiceOptionModels: Array<{ id: string; value: any; text: string; isCorrect: boolean }> = [];

  // Containers
  public headerContainer: Phaser.GameObjects.Container | null = null;
  public promptContainer: Phaser.GameObjects.Container | null = null;
  public contentContainer: Phaser.GameObjects.Container | null = null;
  public controlsContainer: Phaser.GameObjects.Container | null = null;
  public celebrationContainer: Phaser.GameObjects.Container | null = null;
  private celebrationParticles: Phaser.GameObjects.Text[] = [];
  public prefersReducedMotion: boolean = false;

  constructor() {
    super({ key: 'QuestionScene' });
  }

  /**
   * Scene initialization hook with payload from MapScene or RunnerScene
   */
  public init(data?: QuestionSceneInitData): void {
    this.stationId = normalizeStationId(data?.stationId);
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
    this.currentAttemptNumber = 0;
    this.currentQuestionStartTime = Date.now();
    this.currentHintLevel = 0;

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
    this.isTransitioning = false;

    // Reset component collections
    this.slotBoxes = [];
    this.cardChips = [];
    this.choiceCards = [];
    this.choiceOptionModels = [];
  }

  public create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.prefersReducedMotion = this.prefersReducedMotion || this.detectReducedMotionPreference();

    // 1. Draw Themed Background
    this.createBackground(width, height);

    // 2. Fixed Header (Back Button, Level Title, Progress Bar)
    this.createHeaderHUD(width);

    // 3. Prompt Banner (Instruction, Subject Badge, Speaker Button)
    this.createPromptBanner(width);

    // 4. Render Mode-Specific Interactive UI
    // contentContainer holds the interactive answer cards (choice cards or scramble chips/slots).
    if (this.add?.container) {
      this.contentContainer = this.add.container(0, 0);
      this.contentContainer.setDepth(80);
    } else {
      this.contentContainer = new Phaser.GameObjects.Container(this, 0, 0);
    }
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(this.contentContainer);
    }

    if (this.currentQuestion?.type === 'sentence_scramble') {
      this.renderSentenceScrambleMode(width, height);
    } else {
      this.renderChoiceQuizMode(width, height);
    }

    // 5. Action Controls (💡 提示, 🔄 重置)
    this.createActionControls(width, height);

    // 6. Celebration Container
    if (this.add?.container) {
      this.celebrationContainer = this.add.container(width / 2, height / 2);
      this.celebrationContainer.setDepth(500);
    } else {
      this.celebrationContainer = new Phaser.GameObjects.Container(this, width / 2, height / 2);
    }
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(this.celebrationContainer);
    }

    // 7. Automatically read the question prompt aloud after 1 second delay
    if (this.time?.delayedCall) {
      this.autoReadTimer = this.time.delayedCall(1000, () => {
        const isActive = typeof this.scene?.isActive === 'function' ? this.scene.isActive('QuestionScene') : true;
        if (isActive && !this.isAnswered) {
          this.speakCurrentQuestion();
        }
      });
    }

    if (this.events && typeof this.events.once === 'function') {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
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
    if (this.prefersReducedMotion || !this.add?.text || !this.tweens?.add) return;

    const starCoords = [
      { x: 120, y: 140, size: '18px', delay: 0 },
      { x: 1180, y: 120, size: '20px', delay: 400 },
      { x: 240, y: 640, size: '16px', delay: 800 },
      { x: 1060, y: 620, size: '18px', delay: 1200 },
      { x: 640, y: 670, size: '16px', delay: 600 },
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
      width: 135,
      height: 48,
      text: '◀ 返回地圖',
      icon: 'vec_icon_back_24',
      color: 'blue',
      fontSize: '20px',
      onClick: () => {
        if (this.transitionTimer) {
          this.transitionTimer.remove();
          this.transitionTimer = null;
        }
        if (this.autoReadTimer) {
          this.autoReadTimer.remove();
          this.autoReadTimer = null;
        }
        SoundManager.play('click');
        SpeechService.stop();
        if (this.scene) {
          this.scene.start('MapScene');
        }
      },
    });
    header.add(this.backButton);

    // 1b. Quick Station Restart (重試本關)
    const restartBtn = new CanvasButton(this, {
      x: 245,
      y: 42,
      width: 135,
      height: 48,
      text: '重試本關',
      icon: 'vec_icon_retry_24',
      color: 'yellow',
      fontSize: '18px',
      onClick: () => {
        if (this.transitionTimer) {
          this.transitionTimer.remove();
          this.transitionTimer = null;
        }
        if (this.autoReadTimer) {
          this.autoReadTimer.remove();
          this.autoReadTimer = null;
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

    // 2. Station & Level Header (e.g. 第 3-1 關  櫻花樹・中文)
    const stationNumber = this.getStationNumber();
    const levelNumber = `${stationNumber}-${this.questionIndex + 1}`;
    const stationTitle = this.getStationDisplayName();
    const subjectName = this.getCurrentSubjectName();
    const stationIcon = STATIONS.find((station) => station.id === this.stationId)?.icon || '📍';
    const titleString = `第 ${levelNumber} 關  ${stationIcon} ${stationTitle}・${subjectName}`;

    if (this.add.text) {
      const title = this.add.text(width / 2, 28, titleString, {
        fontSize: '24px',
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
          fontSize: '18px',
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

    // 4. Player Companion Avatar Badge (Top Right HUD)
    // Keep the equipped wearing art identifiable after Scale.FIT on landscape phones.
    // The badge remains inside the header's 18px right clearance.
    const avatarSize = Math.min(88, Math.max(72, Math.round(width * 0.07)));
    const avatarX = Math.min(width - avatarSize / 2 - 18, 1220);
    // PlayerAvatarBadge's idle float travels 4px upward; keep 4px clearance
    // after that motion rather than only at the initial frame.
    const avatarY = Math.max(42, avatarSize / 2 + 8);
    this.avatarBadge = new PlayerAvatarBadge(this, {
      x: avatarX,
      y: avatarY,
      size: avatarSize,
      showPet: true,
      showBorder: true,
      reducedMotion: this.prefersReducedMotion,
    });
    header.add(this.avatarBadge.container);

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

    // Banner Background Card (Chalkboard & Storybook styling - Item 6)
    if (this.add.graphics) {
      const bg = this.add.graphics();
      // Drop Shadow
      bg.fillStyle(0x0a0e17, 0.45);
      bg.fillRoundedRect(-bannerW / 2 + 4, -bannerH / 2 + 6, bannerW, bannerH, 20);

      // Deep Slate Chalkboard Body
      bg.fillStyle(0x151e2e, 0.96);
      bg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 20);

      // Inner Chalkboard Rim
      bg.fillStyle(0x1e293b, 0.5);
      bg.fillRoundedRect(-bannerW / 2 + 6, -bannerH / 2 + 6, bannerW - 12, bannerH - 12, 16);

      const subjectColor = this.getSubjectColor();
      bg.lineStyle(2.5, subjectColor, 0.9);
      bg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 20);

      // Chalkboard corner accents
      bg.lineStyle(1.5, 0x64748b, 0.4);
      bg.strokeRoundedRect(-bannerW / 2 + 8, -bannerH / 2 + 8, bannerW - 16, bannerH - 16, 14);

      // Subject Badge Pill
      bg.fillStyle(subjectColor, 1.0);
      bg.fillRoundedRect(-bannerW / 2 + 20, -22, 110, 44, 12);
      bg.lineStyle(2, 0xffffff, 0.35);
      bg.strokeRoundedRect(-bannerW / 2 + 20, -22, 110, 44, 12);
      banner.add(bg);
    }

    // Subject Badge Label
    if (this.add.text) {
      const subjectTag = this.add.text(-bannerW / 2 + 75, 0, `[${this.getCurrentSubjectName()}]`, {
        fontSize: '20px',
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
        fontSize: promptStr.length > 32 ? '24px' : '28px',
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
      width: 145,
      height: 54,
      text: '🔊 朗讀',
      icon: 'vec_icon_speaker_24',
      color: 'yellow',
      fontSize: '22px',
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
    const spacing = tokensCount >= 6 ? 18 : tokensCount === 5 ? 20 : 24;
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

      // Tapping a slot: if filled, returns card to bank; if empty, auto-fills with next available word chip!
      if (typeof slot.setInteractive === 'function') {
        const hitPadX = 8;
        const hitPadY = 8;
        const hitRect = (Phaser && Phaser.Geom && Phaser.Geom.Rectangle)
          ? new Phaser.Geom.Rectangle(-hitPadX, -hitPadY, cardWidth + hitPadX * 2, cardHeight + hitPadY * 2)
          : { useHandCursor: true };
        slot.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
        slot.on('pointerup', () => {
          if (this.isAnswered) return;
          const now = Date.now();
          if (slot.hasCard()) {
            this.handleSlotCardRemoval(slot);
          } else {
            if (now - this.lastRemovalTime < 250) return;
            const nextUnplacedChip = this.cardChips.find((c) => c.getCurrentSlot() === null);
            if (nextUnplacedChip) {
              SoundManager.play('click');
              slot.setPlacedCard(nextUnplacedChip);
              this.evaluateSentenceScramble();
            }
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
        onDrag: (c) => {
          if (this.isAnswered) return;
          for (const slot of this.slotBoxes) {
            const center = slot.getCenterPosition();
            const halfW = (typeof slot.getSlotWidth === 'function' ? slot.getSlotWidth() : 155) / 2 + 20;
            const halfH = (typeof slot.getSlotHeight === 'function' ? slot.getSlotHeight() : 74) / 2 + 20;
            const isInside = Math.abs(c.x - center.x) <= halfW && Math.abs(c.y - center.y) <= halfH;
            slot.setHighlighted(isInside);
          }
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

    // Initialize stable option models once per question attempt
    if (!this.choiceOptionModels || this.choiceOptionModels.length === 0) {
      const rawOptions = this.currentQuestion.options || [];
      this.choiceOptionModels = rawOptions.map((opt, idx) => {
        const isCorrect = (this.currentQuestion?.correctAnswer !== undefined)
          ? (opt === this.currentQuestion.correctAnswer || String(opt) === String(this.currentQuestion.correctAnswer))
          : (this.currentQuestion?.correctOptionIndex !== undefined && idx === this.currentQuestion.correctOptionIndex);
        return {
          id: `opt_${this.currentQuestion?.id || 'q'}_${idx}`,
          value: opt,
          text: String(opt),
          isCorrect,
        };
      });
    }

    const models = this.choiceOptionModels;
    const count = models.length;
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

      models.forEach((model, idx) => {
        const xPos = startX + idx * (optW + spacing);
        const card = new CanvasCard(this, {
          x: xPos,
          y: optY,
          width: optW,
          height: optH,
          text: model.text,
          value: model.value,
          color: themeColors[idx % themeColors.length],
          tappable: true,
          fontSize: model.text.length > 8 ? '28px' : '38px',
          onTap: (c) => this.handleChoiceSelection(c, model),
        });
        this.choiceCards.push(card);
      });
    } else {
      // 2x2 Grid for 4 options (spacious, clear, and easy to tap)
      const optW = 390;
      const optH = 92;
      const row1Y = 325;
      const row2Y = 445;
      const col1X = width / 2 - 215;
      const col2X = width / 2 + 215;

      const positions = [
        { x: col1X, y: row1Y },
        { x: col2X, y: row1Y },
        { x: col1X, y: row2Y },
        { x: col2X, y: row2Y },
      ];

      models.slice(0, 4).forEach((model, idx) => {
        const pos = positions[idx];
        const card = new CanvasCard(this, {
          x: pos.x,
          y: pos.y,
          width: optW,
          height: optH,
          text: model.text,
          value: model.value,
          color: themeColors[idx % themeColors.length],
          tappable: true,
          fontSize: model.text.length > 8 ? '26px' : '36px',
          onTap: (c) => this.handleChoiceSelection(c, model),
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
      width: 180,
      height: 58,
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
        width: 180,
        height: 58,
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
    this.lastRemovalTime = Date.now();

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

    // Clear hover highlights on all slots
    for (const slot of this.slotBoxes) {
      slot.setHighlighted(false);
    }

    // Find nearest slot using box bounds
    let targetSlot: SlotBox | null = null;
    let minDistance = 9999;

    for (const slot of this.slotBoxes) {
      const center = slot.getCenterPosition();
      const halfW = (typeof slot.getSlotWidth === 'function' ? slot.getSlotWidth() : 155) / 2 + 20;
      const halfH = (typeof slot.getSlotHeight === 'function' ? slot.getSlotHeight() : 74) / 2 + 20;
      const isInside = Math.abs(card.x - center.x) <= halfW && Math.abs(card.y - center.y) <= halfH;
      if (isInside) {
        const dist = Math.hypot(card.x - center.x, card.y - center.y);
        if (dist < minDistance) {
          minDistance = dist;
          targetSlot = slot;
        }
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
      card.setCurrentSlot(null);
      card.snapBack();
    }
  }

  /**
   * Evaluates if the current sentence scramble is completely and correctly ordered
   */
  public evaluateSentenceScramble(): boolean {
    const allFilled = this.slotBoxes.length > 0 && this.slotBoxes.every((s) => s.hasCard());
    if (!allFilled) return false;

    this.currentAttemptNumber++;
    const placedTokens = this.slotBoxes.map((s) => s.getPlacedCard()?.getText() || '');
    const expectedTokens = this.currentQuestion?.correctTokens || [];

    const isCorrect = SentenceEngine.verifyOrder(placedTokens, expectedTokens);

    if (isCorrect) {
      for (const slot of this.slotBoxes) {
        slot.setCorrect(true);
        const card = slot.getPlacedCard();
        if (card) {
          card.setState('correct');
          if (typeof card.pulse === 'function') {
            card.pulse();
          }
        }
      }
      this.onCorrectAnswer();
      return true;
    } else {
      SoundManager.playSoftWrong();
      this.sessionStats.mistakes++;
      this.avatarBadge?.think();

      if (this.currentQuestion) {
        const feedback = PedagogyEngine.getWrongAnswerFeedback(this.currentQuestion);
        this.showEducationalFeedback(feedback, false);
        SpeechService.speak(feedback, this.getVoiceLanguage());

        try {
          DataManager.getInstance().recordAttempt({
            questionId: this.currentQuestion.id,
            stationId: this.stationId,
            subject: this.currentQuestion.subject,
            knowledgeTag: PedagogyEngine.getKnowledgeTag(this.currentQuestion),
            difficulty: 1,
            selectedAnswerId: placedTokens.join(''),
            isCorrect: false,
            attemptNumber: this.currentAttemptNumber,
            hintLevelUsed: this.currentHintLevel,
            timestamp: Date.now(),
            responseTimeMs: Date.now() - this.currentQuestionStartTime,
          });
        } catch {
          // Ignore
        }
      }

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
  public handleChoiceSelection(
    card: CanvasCard,
    selected: number | { id?: string; value: any; isCorrect?: boolean }
  ): boolean {
    if (this.isAnswered || card.getState() === 'disabled') return false;

    this.currentAttemptNumber++;

    let isCorrect = false;
    let selectedValue = card.getValue();

    if (typeof selected === 'object' && selected !== null && typeof selected.isCorrect === 'boolean') {
      isCorrect = selected.isCorrect;
      selectedValue = selected.value;
    } else if (this.currentQuestion?.correctAnswer !== undefined) {
      isCorrect = (card.getValue() === this.currentQuestion.correctAnswer ||
        String(card.getValue()) === String(this.currentQuestion.correctAnswer));
    } else if (typeof selected === 'number' && this.currentQuestion?.correctOptionIndex !== undefined) {
      isCorrect = selected === this.currentQuestion.correctOptionIndex;
    }

    if (isCorrect) {
      card.setState('correct');
      card.pulse();
      this.onCorrectAnswer();
      return true;
    } else {
      SoundManager.playSoftWrong();
      this.sessionStats.mistakes++;
      this.avatarBadge?.think();
      card.wobble();
      card.setDisabled(true);

      if (this.currentQuestion) {
        const feedback = PedagogyEngine.getWrongAnswerFeedback(this.currentQuestion, selectedValue);
        this.showEducationalFeedback(feedback, false);
        SpeechService.speak(feedback, this.getVoiceLanguage());

        try {
          DataManager.getInstance().recordAttempt({
            questionId: this.currentQuestion.id,
            stationId: this.stationId,
            subject: this.currentQuestion.subject,
            knowledgeTag: PedagogyEngine.getKnowledgeTag(this.currentQuestion),
            difficulty: 1,
            selectedAnswerId: selectedValue,
            isCorrect: false,
            attemptNumber: this.currentAttemptNumber,
            hintLevelUsed: this.currentHintLevel,
            timestamp: Date.now(),
            responseTimeMs: Date.now() - this.currentQuestionStartTime,
          });
        } catch {
          // Ignore
        }
      }

      return false;
    }
  }

  /**
   * Renders educational feedback banner
   */
  public showEducationalFeedback(message: string, isCorrect: boolean): void {
    if (!this.add) return;
    if (this.feedbackContainer) {
      this.feedbackContainer.destroy();
      this.feedbackContainer = null;
    }

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const toastW = Math.min(width - 60, 960);
    const toastH = 68;
    const toastX = width / 2;
    const toastY = 210;

    const container = this.add.container
      ? this.add.container(toastX, toastY)
      : new Phaser.GameObjects.Container(this, toastX, toastY);
    container.setDepth(150);

    if (this.add.graphics) {
      const bg = this.add.graphics();
      bg.fillStyle(0x0f172a, 0.95);
      bg.fillRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 16);

      const borderColor = isCorrect ? 0x22c55e : 0xf59e0b;
      bg.lineStyle(2, borderColor, 0.95);
      bg.strokeRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 16);
      container.add(bg);
    }

    if (this.add.text) {
      const prefix = isCorrect ? '✨ 知識點：' : '💡 觀察提示：';
      const toastTxt = this.add.text(0, 0, `${prefix}${message}`, {
        fontSize: '18px',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: isCorrect ? '#86efac' : '#fde047',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: toastW - 40 },
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof toastTxt.setOrigin === 'function') toastTxt.setOrigin(0.5);
      container.add(toastTxt);
    }

    this.feedbackContainer = container;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(container);
    }

    if (this.tweens?.add) {
      container.setScale(0.9);
      container.setAlpha(0);
      this.tweens.add({
        targets: container,
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
  }

  /**
   * Progressive 3-Tier Hint Action
   * Level 1: Direction strategy
   * Level 2: Visual support clue highlight
   * Level 3: Guided solution elimination / auto-place
   */
  public handleHint(): void {
    if (this.isAnswered || !this.currentQuestion) return;

    if (this.currentQuestion.type === 'sentence_scramble') {
      // Increment hint level and stats for scramble mode
      this.currentHintLevel = Math.min(3, this.currentHintLevel + 1);
      this.sessionStats.hintsUsed++;
      SoundManager.playCardSnap();
      const expected = this.currentQuestion.correctTokens || [];
      const hasUnplacedSlot = this.slotBoxes.some((slot, i) => !slot.hasCard() || slot.getPlacedCard()?.getText() !== expected[i]);
      // If all slots already correctly filled, no hint needed
      if (!hasUnplacedSlot && this.slotBoxes.length > 0) return;
    } else {
      // For choice mode: check if there are still wrong (non-disabled) cards
      // to eliminate BEFORE spending a hint charge.
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
      // No non-disabled wrong cards: hint has nothing to do, don't charge the counter
      if (wrongCards.length === 0 && this.choiceCards.length > 0) return;

      // Increment hint level and stats only when there is a useful action
      this.currentHintLevel = Math.min(3, this.currentHintLevel + 1);
      this.sessionStats.hintsUsed++;
      SoundManager.playCardSnap();
    }

    

    const hints = PedagogyEngine.getProgressiveHints(this.currentQuestion);

    if (this.currentHintLevel === 1) {
      this.showEducationalFeedback(hints.level1Direction, false);
      SpeechService.speak(hints.level1Direction, this.getVoiceLanguage());
      if (this.hintButton) {
        this.hintButton.setText('💡 提示 (2/3)');
      }
    } else if (this.currentHintLevel === 2) {
      this.showEducationalFeedback(hints.level2VisualSupport, false);
      SpeechService.speak(hints.level2VisualSupport, this.getVoiceLanguage());
      if (this.hintButton) {
        this.hintButton.setText('💡 提示 (3/3)');
      }
      for (const card of this.choiceCards) {
        if (card.getState() !== 'disabled' && typeof (card as any).pulse === 'function') {
          (card as any).pulse();
        }
      }
      for (const slot of this.slotBoxes) {
        if (typeof slot.setHighlighted === 'function') {
          slot.setHighlighted(true);
        }
      }
    } else {
      this.showEducationalFeedback(hints.level3GuidedSolution, false);
      SpeechService.speak(hints.level3GuidedSolution, this.getVoiceLanguage());
      if (this.hintButton) {
        this.hintButton.setText('💡 提示已用完');
        this.hintButton.setEnabled(false);
      }
    }

    // Interactive Action: Auto-place next token in Scramble OR eliminate wrong option in Choice
    if (this.currentQuestion.type === 'sentence_scramble') {
      const expected = this.currentQuestion.correctTokens || [];
      let targetIndex = -1;
      for (let i = 0; i < this.slotBoxes.length; i++) {
        const slot = this.slotBoxes[i];
        if (!slot.hasCard() || slot.getPlacedCard()?.getText() !== expected[i]) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex >= 0) {
        const targetSlot = this.slotBoxes[targetIndex];
        if (targetSlot.hasCard()) {
          targetSlot.removePlacedCard()?.snapBack();
        }

        const expectedVal = expected[targetIndex];
        let chip = this.cardChips.find(
          (c) => c.getText() === expectedVal && c.getCurrentSlot() === null
        );
        if (!chip) {
          chip = this.cardChips.find((c) => c.getText() === expectedVal);
          if (chip && chip.getCurrentSlot()) {
            chip.getCurrentSlot()?.removePlacedCard();
          }
        }

        if (chip) {
          targetSlot.setPlacedCard(chip);
          if (typeof chip.pulse === 'function') {
            chip.pulse();
          }
          this.evaluateSentenceScramble();
        }
      }
          } else if (this.currentHintLevel >= 3 && this.choiceCards.length > 2) {
      const wrongCards = this.choiceCards.filter((card) => {
        if (card.getState() === 'disabled') return false;
        if (this.currentQuestion?.correctAnswer !== undefined) {
          return (
            card.getValue() !== this.currentQuestion.correctAnswer &&
            String(card.getValue()) !== String(this.currentQuestion.correctAnswer)
          );
        }
        const model = this.choiceOptionModels.find((m) => m.value === card.getValue());
        if (model) {
          return !model.isCorrect;
        }
        return true;
      });

      if (wrongCards.length > 0) {
        const toEliminate = wrongCards[0];
        if (typeof toEliminate.wobble === 'function') {
          toEliminate.wobble();
        }
        toEliminate.setDisabled(true);
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
      slot.removePlacedCard();
      slot.setError(false);
      slot.setHighlighted(false);
    }
    for (const card of this.cardChips) {
      card.setCurrentSlot(null);
      card.snapBack();
    }
  }

  /**
   * Handles correct answer: plays sound, speaks full sentence, shows celebration,
   * records stats and attempts to DataManager, and transitions to RunnerScene
   */
  public onCorrectAnswer(): void {
    if (this.isAnswered || !this.currentQuestion) return;
    this.isAnswered = true;

    this.sessionStats.correctCount++;

    // 1. Record stats and attempt in DataManager
    try {
      DataManager.getInstance().recordCorrectAnswer(this.currentQuestion.subject);
      DataManager.getInstance().recordAttempt({
        questionId: this.currentQuestion.id,
        stationId: this.stationId,
        subject: this.currentQuestion.subject,
        knowledgeTag: PedagogyEngine.getKnowledgeTag(this.currentQuestion),
        difficulty: 1,
        selectedAnswerId: this.currentQuestion.correctAnswer || 'correct',
        isCorrect: true,
        attemptNumber: Math.max(1, this.currentAttemptNumber),
        hintLevelUsed: this.currentHintLevel,
        timestamp: Date.now(),
        responseTimeMs: Date.now() - this.currentQuestionStartTime,
      });
    } catch {
      // Ignore
    }

    // 2. Play Audio & Speech
    SoundManager.playComboCorrect(this.sessionStats.correctCount);
    const reinforcement = PedagogyEngine.getReinforcementSentence(this.currentQuestion);
    this.showEducationalFeedback(reinforcement, true);

    const speakSentence =
      this.currentQuestion.speakText || this.currentQuestion.prompt || '';
    SpeechService.speak(speakSentence, this.getVoiceLanguage());

    // 3. Play Celebration Visuals
    this.playCelebrationEffect();
    this.avatarBadge?.cheer();

    // 4. Delayed Transition to RunnerScene with Tap-to-Fast-Forward
    const isComplete = this.questionIndex >= this.questions.length - 1;
    const isRainbow = this.sessionStats.correctCount >= 2;

    const executeTransition = () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      if (this.transitionTimer) {
        this.transitionTimer.remove();
        this.transitionTimer = null;
      }
      if (this.autoReadTimer) {
        this.autoReadTimer.remove();
        this.autoReadTimer = null;
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

    // 5. Update Action Controls to show Continue CTA Button
    if (this.hintButton) {
      this.hintButton.setVisible(false);
    }
    if (this.resetButton) {
      this.resetButton.setVisible(false);
    }

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    const controlsY = height - 84;

    const continueBtn = new CanvasButton(this, {
      x: width / 2,
      y: controlsY,
      width: 260,
      height: 58,
      text: '繼續前進',
      icon: 'vec_icon_next_24',
      iconPosition: 'right',
      color: 'green',
      fontSize: '22px',
      onClick: () => {
        executeTransition();
      },
    });

    if (this.controlsContainer) {
      this.controlsContainer.add(continueBtn);
    }

    if (this.input) {
      this.input.once('pointerdown', (pointer: any) => {
        // Exclude top header area from tap-to-fast-forward
        if (pointer && pointer.y < 80) return;
        executeTransition();
      });
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
    this.clearCelebrationEffect();
    if (!this.add) return;

    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    const celebration = this.add.container
      ? this.add.container(width / 2, height / 2)
      : new Phaser.GameObjects.Container(this, width / 2, height / 2);

    celebration.setDepth(500);

    // Feedback Toast Banner
    const isCombo = (this.sessionStats?.correctCount || 0) >= 2;
    const bannerColor = isCombo ? 0xf59e0b : 0x2ecc71;
    const bannerBorder = isCombo ? 0xfffbeb : 0xffffff;
    const msgText = isCombo
      ? `🔥 連對 x${this.sessionStats.correctCount}！連勝衝刺`
      : '🎉 太棒了！答對了！';

    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(bannerColor, 0.95);
      g.fillRoundedRect(-200, -38, 400, 76, 22);
      g.lineStyle(3, bannerBorder, 1.0);
      g.strokeRoundedRect(-200, -38, 400, 76, 22);
      celebration.add(g);
    }

    if (this.add.text) {
      const msg = this.add.text(0, 0, msgText, {
        fontSize: '25px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#ffffff',
        fontStyle: 'bold',
      });
      if (typeof msg.setOrigin === 'function') msg.setOrigin(0.5);
      celebration.add(msg);
    }

    // Multi-color Confetti & Sparkles burst (Item 7)
    if (!this.prefersReducedMotion && this.add.text && this.tweens?.add) {
      const emojis = ['⭐', '✨', '🌟', '🎊', '🎉', '💫', '🎈', '🥇'];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
        const dist = 130 + (i % 3) * 35;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 20;

        const particle = this.add.text(0, 0, emojis[i % emojis.length], {
          fontSize: (i % 2 === 0) ? '26px' : '20px',
        });
        if (typeof particle.setOrigin === 'function') particle.setOrigin(0.5);
        celebration.add(particle);
        this.celebrationParticles.push(particle);

        this.tweens.add({
          targets: particle,
          x: tx,
          y: ty,
          scale: { from: 0.4, to: 1.4 },
          alpha: { from: 1.0, to: 0.0 },
          rotation: (Math.random() - 0.5) * 1.5,
          duration: 950 + (i % 4) * 80,
          ease: 'Cubic.easeOut',
        });
      }
    }

    this.celebrationContainer = celebration;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(celebration);
    }
  }

  private clearCelebrationEffect(): void {
    for (const particle of this.celebrationParticles) {
      this.tweens?.killTweensOf?.(particle);
    }
    this.celebrationParticles = [];

    if (this.celebrationContainer) {
      this.tweens?.killTweensOf?.(this.celebrationContainer);
      this.celebrationContainer.destroy();
      this.celebrationContainer = null;
    }
  }

  public shutdown(): void {
    this.transitionTimer?.remove?.();
    this.transitionTimer = null;
    this.autoReadTimer?.remove?.();
    this.autoReadTimer = null;
    this.clearCelebrationEffect();
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

  /**
   * Resolves numeric station index for clean level display
   */
  public getStationNumber(): number | string {
    const stationMap: Record<string, number> = {
      st_central: 1,
      st_green: 2,
      st_cherry: 3,
      st_firefly: 4,
      st_ocean: 5,
    };
    const key = String(this.stationId || 'st_central');
    return stationMap[key] || this.stationId || 1;
  }

  /**
   * Resolves localized station name to prevent raw developer IDs
   */
  public getStationDisplayName(): string {
    if (this.stationName && this.stationName !== '冒險關卡') {
      return this.stationName;
    }
    const station = STATIONS.find((candidate) => candidate.id === this.stationId);
    if (station) return station.name;
    const stationMap: Record<string, string> = {
      st_central: '中環冒險島',
      st_green: '綠野小徑',
      st_cherry: '櫻花樹',
      st_firefly: '螢火森林',
      st_ocean: '星光海岸',
      '1': '中環冒險島',
      '2': '綠野小徑',
      '3': '櫻花樹',
      '4': '螢火森林',
      '5': '星光海岸',
    };
    const key = String(this.stationId || 'st_central');
    return stationMap[key] || '中環冒險島';
  }

  private detectReducedMotionPreference(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    } catch {
      return false;
    }
  }
}
