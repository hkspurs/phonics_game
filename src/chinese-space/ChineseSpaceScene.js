import {
  buildChineseSpaceSession,
  calculateAverageReactionTime,
  CHINESE_SPACE_BADGES,
  CHINESE_SPACE_FIRE_INTERVAL_MS,
  CHINESE_SPACE_GEM_REWARD,
  CHINESE_SPACE_QUESTION_COUNT,
  CHINESE_SPACE_STARTING_HP,
  CHINESE_SPACE_TIME_LIMIT_MS,
} from '../game/chineseSpaceGame';
import {
  advanceChineseSpaceQuestion,
  beginChineseSpaceCountdown,
  createChineseSpaceSession,
  resolveChineseSpaceTarget,
  resolveChineseSpaceTimeout,
} from '../game/chineseSpaceSession';
import { getChineseSpaceChapter } from '../game/chineseSpaceWords';
import { CHINESE_SPACE_COPY } from './chineseSpaceCopy';

export { CHINESE_SPACE_COPY } from './chineseSpaceCopy';

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;
const LANES = [270, 405, 540];
const PLAYER_X = 180;
const TARGET_X = 980;
const DEFAULT_STORE = {
  getState: () => ({ spaceGems: 0, ownedBadgeIds: [], tutorialComplete: false }),
  addGems: () => {},
  markTutorialComplete: () => {},
  redeemBadge: () => false,
};
const DEFAULT_AUDIO = {
  playWord: async () => false,
  playSfx: () => {},
  stop: () => {},
};

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function normalizeChineseSpaceQuestions(chapterId, questions) {
  const chapter = getChineseSpaceChapter(chapterId);
  return questions.map((question) => ({
    id: question.id,
    answer: { id: question.id, text: question.answer },
    distractors: question.distractors
      .map((text) => chapter?.words.find((word) => word.text === text))
      .filter(Boolean),
  }));
}

function currentStoreState(store) {
  const state = store.getState?.() || {};
  return state.chineseSpace || state;
}

export function createChineseSpaceScene(Phaser, callbacks = {}) {
  const audio = { ...DEFAULT_AUDIO, ...(callbacks.audio || {}) };
  const store = { ...DEFAULT_STORE, ...(callbacks.store || {}) };
  const random = callbacks.random || Math.random;

  return class ChineseSpaceScene extends Phaser.Scene {
    constructor() {
      super('ChineseSpaceScene');
      this.audio = audio;
      this.store = store;
      this.random = random;
      this.callbacks = callbacks;
      this.screen = 'home';
      this.screenBeforeOrientation = 'home';
      this.chapterId = null;
      this.session = null;
      this.questionTargets = [];
      this.targetNodes = [];
      this.bullets = [];
      this.playerLane = 1;
      this.fireHeld = false;
      this.fireEnabled = false;
      this.lastFireAt = -Infinity;
      this.audioRequestId = 0;
      this.sessionCompleteNotified = false;
      this.lastUiAt = 0;
      this.feedback = '';
      this.pendingTimer = null;
    }

    create() {
      this.root = this.add.container(0, 0);
      this.bindInput();
      this.scale.on('resize', this.resizeScene, this);
      this.showHome();
      this.resizeScene(this.scale);
      this.callbacks.onReady?.(this);
    }

    bindInput() {
      this.domKeyHandler = (event) => {
        if (event.key === 'ArrowLeft') this.movePlayer(-1);
        else if (event.key === 'ArrowRight') this.movePlayer(1);
        else if (event.key === 'Enter') this.handleMenuKey('enter');
        else if (event.key === '1') this.handleMenuKey('1');
        else if (event.key === '2') this.handleMenuKey('2');
        else if (event.key === '3') this.handleMenuKey('3');
        else if (event.key === 'Escape') this.handleMenuKey('escape');
        else if (event.key === ' ') {
          if (this.screen === 'active') {
            this.fireHeld = true;
            this.fireOnce(this.now());
          } else {
            this.handleMenuKey('space');
          }
        }
      };
      if (typeof window !== 'undefined') window.addEventListener('keydown', this.domKeyHandler);
      this.input?.on('pointerup', () => { this.fireHeld = false; });
    }

    now() {
      return typeof performance === 'undefined' ? Date.now() : performance.now();
    }

    resizeScene(scale = this.scale) {
      if (!this.root || !scale) return;
      const width = scale.width || LOGICAL_WIDTH;
      const height = scale.height || LOGICAL_HEIGHT;
      const portrait = height > width;
      if (portrait && this.screen !== 'orientation') {
        this.screenBeforeOrientation = this.screen;
        this.screen = 'orientation';
        this.renderScreen();
      } else if (!portrait && this.screen === 'orientation') {
        this.screen = this.screenBeforeOrientation || 'home';
        this.renderScreen();
      }
      const factor = Math.min(width / LOGICAL_WIDTH, height / LOGICAL_HEIGHT);
      this.root.setScale(factor);
      this.root.setPosition((width - LOGICAL_WIDTH * factor) / 2, (height - LOGICAL_HEIGHT * factor) / 2);
    }

    showHome() {
      this.stopSession();
      this.chapterId = null;
      this.setScreen('home');
    }

    showChapterSelect() {
      this.stopSession();
      this.setScreen('chapterSelect');
    }

    showBadges() {
      this.stopSession();
      this.setScreen('badges');
    }

    startChapter(chapterId) {
      if (!getChineseSpaceChapter(chapterId)) return;
      this.chapterId = chapterId;
      const state = currentStoreState(this.store);
      if (!state.tutorialComplete) {
        this.setScreen('tutorial');
        return;
      }
      this.beginChapter();
    }

    completeTutorial() {
      this.store.markTutorialComplete();
      this.beginChapter();
    }

    beginChapter() {
      this.clearPendingTimer();
      const questions = normalizeChineseSpaceQuestions(
        this.chapterId,
        buildChineseSpaceSession(this.chapterId, this.random, CHINESE_SPACE_QUESTION_COUNT),
      );
      this.session = createChineseSpaceSession(questions, this.now());
      this.sessionCompleteNotified = false;
      this.result = null;
      this.feedback = '';
      this.playerLane = 1;
      this.buildQuestionTargets();
      this.playCurrentQuestion();
    }

    buildQuestionTargets() {
      const question = this.currentQuestion();
      if (!question) {
        this.questionTargets = [];
        return;
      }
      const words = [question.answer, ...question.distractors];
      const lanes = shuffle([0, 1, 2], this.random);
      this.questionTargets = words.map((word, index) => ({
        id: word.id,
        text: word.text,
        lane: lanes[index],
        x: TARGET_X,
        active: true,
      }));
    }

    currentQuestion() {
      return this.session?.questions?.[this.session.questionIndex];
    }

    playCurrentQuestion(feedback = '') {
      const question = this.currentQuestion();
      if (!question || !this.session) return;
      this.clearBullets();
      this.fireHeld = false;
      this.fireEnabled = false;
      this.feedback = feedback;
      this.setScreen('audio');
      const requestId = ++this.audioRequestId;
      Promise.resolve()
        .then(() => this.audio.playWord(question.id))
        .then((ok) => {
          if (requestId !== this.audioRequestId || this.screen !== 'audio' || !this.session) return;
          if (!ok) {
            this.feedback = CHINESE_SPACE_COPY.retryAudio;
            this.renderScreen();
            return;
          }
          this.session = beginChineseSpaceCountdown(this.session, this.now());
          this.fireEnabled = true;
          this.setScreen('active');
        })
        .catch(() => {
          if (requestId !== this.audioRequestId || this.screen !== 'audio') return;
          this.feedback = CHINESE_SPACE_COPY.retryAudio;
          this.renderScreen();
        });
    }

    retryAudio() {
      this.playCurrentQuestion();
    }

    setScreen(screen) {
      this.screen = screen;
      this.renderScreen();
      this.emitUi();
    }

    renderScreen() {
      if (!this.root) return;
      this.root.removeAll(true);
      this.targetNodes = [];
      this.clearBullets();
      if (this.screen === 'orientation') this.renderOrientation();
      else if (this.screen === 'home') this.renderHome();
      else if (this.screen === 'chapterSelect') this.renderChapterSelect();
      else if (this.screen === 'tutorial') this.renderTutorial();
      else if (['audio', 'active'].includes(this.screen)) this.renderGame();
      else if (this.screen === 'result') this.renderResult();
      else if (this.screen === 'gameOver') this.renderGameOver();
      else if (this.screen === 'badges') this.renderBadges();
    }

    drawBackground(theme = {}) {
      const background = this.add.rectangle(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH, LOGICAL_HEIGHT, theme.background || 0x07152f);
      this.root.add(background);
      const stars = this.add.graphics();
      stars.fillStyle(0xffffff, 0.7);
      for (let index = 0; index < 42; index += 1) {
        const x = 26 + ((index * 173) % 1220);
        const y = 24 + ((index * 97) % 610);
        stars.fillCircle(x, y, index % 3 === 0 ? 2 : 1);
      }
      this.root.add(stars);
      if (theme.planet) {
        const planet = this.add.circle(theme.planet.x, theme.planet.y, theme.planet.radius, theme.planet.color, 0.75);
        this.root.add(planet);
      }
    }

    addText(text, x, y, style = {}) {
      const { originX = 0.5, originY = 0.5, ...textStyle } = style;
      const node = this.add.text(x, y, text, {
        color: '#f8fafc',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        ...textStyle,
      }).setOrigin(originX, originY);
      this.root.add(node);
      return node;
    }

    addButton(label, x, y, onClick, options = {}) {
      const width = options.width || 250;
      const height = options.height || 64;
      const background = this.add.rectangle(x, y, width, height, options.color || 0x2563eb, 1)
        .setStrokeStyle(2, options.stroke || 0x93c5fd, 1)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x, y, label, {
        color: '#ffffff',
        fontFamily: 'Nunito, sans-serif',
        fontSize: options.fontSize || '24px',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      background.on('pointerdown', onClick);
      this.root.add([background, text]);
      return background;
    }

    renderOrientation() {
      this.drawBackground({ background: 0x0f172a });
      this.addText('↔', LOGICAL_WIDTH / 2, 240, { fontSize: '96px', color: '#7dd3fc' });
      this.addText(CHINESE_SPACE_COPY.orientation, LOGICAL_WIDTH / 2, 370, { fontSize: '34px' });
    }

    renderHome() {
      this.drawBackground({ background: 0x081b3d, planet: { x: 1080, y: 150, radius: 120, color: 0x7c3aed } });
      this.addText(CHINESE_SPACE_COPY.title, LOGICAL_WIDTH / 2, 125, { fontSize: '48px', color: '#fef08a' });
      this.addText(CHINESE_SPACE_COPY.subtitle, LOGICAL_WIDTH / 2, 185, { fontSize: '26px', color: '#bae6fd' });
      const state = currentStoreState(this.store);
      this.addText(`💎 ${CHINESE_SPACE_COPY.gems}：${state.spaceGems || 0}`, 180, 70, { fontSize: '22px', originX: 0, originY: 0.5 });
      this.addButton(CHINESE_SPACE_COPY.start, LOGICAL_WIDTH / 2, 320, () => this.showChapterSelect(), { width: 310, color: 0x0ea5e9 });
      this.addButton(CHINESE_SPACE_COPY.badges, LOGICAL_WIDTH / 2, 410, () => this.showBadges(), { width: 310, color: 0x7c3aed });
      this.addButton(CHINESE_SPACE_COPY.exit, LOGICAL_WIDTH / 2, 570, () => this.callbacks.onExit?.(), { width: 240, height: 54, color: 0x334155, fontSize: '20px' });
      this.addText('← → 移動　Space 開火', LOGICAL_WIDTH / 2, 650, { fontSize: '18px', color: '#cbd5e1' });
    }

    renderChapterSelect() {
      this.drawBackground({ background: 0x10244d, planet: { x: 1130, y: 90, radius: 95, color: 0x2563eb } });
      this.addText(CHINESE_SPACE_COPY.chapterTitle, LOGICAL_WIDTH / 2, 105, { fontSize: '40px', color: '#fef08a' });
      const chapters = [
        ['school', '學校篇', 0x0ea5e9],
        ['park', '公園篇', 0x16a34a],
        ['family', '家庭篇', 0xea580c],
      ];
      chapters.forEach(([id, label, color], index) => {
        this.addButton(label, LOGICAL_WIDTH / 2, 230 + index * 105, () => this.startChapter(id), { width: 340, color });
      });
      this.addButton(CHINESE_SPACE_COPY.badges, 300, 650, () => this.showBadges(), { width: 230, height: 54, color: 0x7c3aed, fontSize: '20px' });
      this.addButton(CHINESE_SPACE_COPY.backHome, 980, 650, () => this.showHome(), { width: 230, height: 54, color: 0x334155, fontSize: '20px' });
    }

    renderTutorial() {
      this.drawBackground({ background: 0x102c4b, planet: { x: 1080, y: 145, radius: 100, color: 0x14b8a6 } });
      this.addText(CHINESE_SPACE_COPY.tutorialTitle, LOGICAL_WIDTH / 2, 150, { fontSize: '46px', color: '#fef08a' });
      this.addText('🚀', 350, 340, { fontSize: '86px' });
      this.addText('🔊', 640, 340, { fontSize: '72px' });
      this.addText('🎯', 930, 340, { fontSize: '72px' });
      this.addText(CHINESE_SPACE_COPY.tutorial, LOGICAL_WIDTH / 2, 465, { fontSize: '28px', color: '#dbeafe' });
      this.addButton(CHINESE_SPACE_COPY.tutorialStart, LOGICAL_WIDTH / 2, 585, () => this.completeTutorial(), { width: 330, color: 0x16a34a });
    }

    renderGame() {
      const theme = this.chapterId === 'park'
        ? { background: 0x123326, planet: { x: 1110, y: 120, radius: 130, color: 0x16a34a } }
        : this.chapterId === 'family'
          ? { background: 0x3b2117, planet: { x: 1110, y: 120, radius: 130, color: 0xea580c } }
          : { background: 0x081b3d, planet: { x: 1110, y: 120, radius: 130, color: 0x2563eb } };
      this.drawBackground(theme);
      this.addText(`${getChineseSpaceChapter(this.chapterId)?.label || ''}　${CHINESE_SPACE_COPY.question} ${Math.min((this.session?.questionIndex || 0) + 1, CHINESE_SPACE_QUESTION_COUNT)}/${CHINESE_SPACE_QUESTION_COUNT}`, 40, 36, { originX: 0, fontSize: '22px' });
      this.addText(`❤️ ${CHINESE_SPACE_COPY.hp}：${this.session?.hp ?? CHINESE_SPACE_STARTING_HP}`, 410, 36, { originX: 0, fontSize: '22px', color: '#fecaca' });
      const storeState = currentStoreState(this.store);
      this.addText(`💎 ${storeState.spaceGems || 0}`, 1110, 36, { originX: 0, fontSize: '22px', color: '#fde68a' });
      const remaining = this.remainingMs();
      const timerColor = remaining <= 3000 ? '#fca5a5' : '#bae6fd';
      this.timerNode = this.addText(this.screen === 'active' ? `${(remaining / 1000).toFixed(1)}s` : CHINESE_SPACE_COPY.listen, LOGICAL_WIDTH / 2, 70, { fontSize: '28px', color: timerColor });
      this.addText(this.feedback || (this.screen === 'active' ? '揀啱中文字射落嚟！' : ''), LOGICAL_WIDTH / 2, 125, { fontSize: '24px', color: this.feedback ? '#fcd34d' : '#dbeafe' });
      this.drawLanes();
      this.drawPlayer();
      this.questionTargets.forEach((target) => this.drawTarget(target));
      this.addButton(CHINESE_SPACE_COPY.moveLeft, 170, 650, () => this.movePlayer(-1), { width: 170, height: 54, color: 0x334155, fontSize: '19px' });
      this.addButton(CHINESE_SPACE_COPY.fire, 640, 650, () => { this.fireHeld = true; this.fireOnce(this.now()); }, { width: 210, height: 58, color: 0xdc2626, fontSize: '24px' });
      this.addButton(CHINESE_SPACE_COPY.moveRight, 1110, 650, () => this.movePlayer(1), { width: 170, height: 54, color: 0x334155, fontSize: '19px' });
      if (this.screen === 'audio' && this.feedback === CHINESE_SPACE_COPY.retryAudio) {
        this.addButton(CHINESE_SPACE_COPY.retryAudio, LOGICAL_WIDTH / 2, 585, () => this.retryAudio(), { width: 250, height: 52, color: 0xea580c, fontSize: '20px' });
      }
    }

    drawLanes() {
      const lanes = this.add.graphics();
      lanes.lineStyle(3, 0x60a5fa, 0.35);
      LANES.forEach((y) => {
        lanes.beginPath();
        lanes.moveTo(80, y);
        lanes.lineTo(1160, y);
        lanes.strokePath();
      });
      this.root.add(lanes);
    }

    drawPlayer() {
      this.playerNode = this.add.text(PLAYER_X, LANES[this.playerLane], '🚀', { fontSize: '58px' }).setOrigin(0.5);
      this.root.add(this.playerNode);
    }

    drawTarget(target) {
      const wrong = this.session?.wrongTargetIds?.includes(target.id);
      const card = this.add.rectangle(target.x, LANES[target.lane], 230, 84, wrong ? 0x475569 : 0x1d4ed8, 0.98)
        .setStrokeStyle(3, wrong ? 0x64748b : 0x93c5fd, 1);
      const text = this.add.text(target.x, LANES[target.lane], target.text, { color: '#ffffff', fontSize: '34px', fontFamily: 'Nunito, sans-serif', fontStyle: 'bold' }).setOrigin(0.5);
      const node = this.add.container(0, 0, [card, text]);
      node.target = target;
      this.root.add(node);
      this.targetNodes.push(node);
    }

    renderResult() {
      this.drawBackground({ background: 0x172554, planet: { x: 1080, y: 140, radius: 130, color: 0x7c3aed } });
      const result = this.result || {};
      this.addText(CHINESE_SPACE_COPY.result, LOGICAL_WIDTH / 2, 110, { fontSize: '48px', color: '#fef08a' });
      this.addText(`✅ ${CHINESE_SPACE_COPY.resultCorrect}：${result.correctCount || 0}/${result.total || CHINESE_SPACE_QUESTION_COUNT}`, LOGICAL_WIDTH / 2, 230, { fontSize: '30px' });
      this.addText(`⏱ ${CHINESE_SPACE_COPY.resultAverage}：${result.averageReactionTime || 0} ms`, LOGICAL_WIDTH / 2, 285, { fontSize: '26px', color: '#bae6fd' });
      this.addText(`❤️ ${CHINESE_SPACE_COPY.resultHp}：${result.hp ?? 0}`, LOGICAL_WIDTH / 2, 340, { fontSize: '26px', color: '#fecaca' });
      this.addText(`💎 ${CHINESE_SPACE_COPY.reward}`, LOGICAL_WIDTH / 2, 415, { fontSize: '28px', color: '#fde68a' });
      this.addButton(CHINESE_SPACE_COPY.playAgain, 390, 565, () => this.beginChapter(), { width: 240, color: 0x16a34a, fontSize: '20px' });
      this.addButton(CHINESE_SPACE_COPY.badges, 640, 565, () => this.showBadges(), { width: 240, color: 0x7c3aed, fontSize: '20px' });
      this.addButton(CHINESE_SPACE_COPY.chooseChapter, 890, 565, () => this.showChapterSelect(), { width: 240, color: 0x2563eb, fontSize: '20px' });
    }

    renderGameOver() {
      this.drawBackground({ background: 0x3f1722, planet: { x: 1080, y: 150, radius: 130, color: 0xbe123c } });
      this.addText(CHINESE_SPACE_COPY.gameOver, LOGICAL_WIDTH / 2, 180, { fontSize: '46px', color: '#fecdd3' });
      this.addText(`❤️ ${CHINESE_SPACE_COPY.hp}：0`, LOGICAL_WIDTH / 2, 290, { fontSize: '32px', color: '#fecaca' });
      this.addText('再聽清楚啲，下一局會更好！', LOGICAL_WIDTH / 2, 370, { fontSize: '26px', color: '#e2e8f0' });
      this.addButton(CHINESE_SPACE_COPY.repair, 500, 520, () => this.beginChapter(), { width: 250, color: 0xea580c });
      this.addButton(CHINESE_SPACE_COPY.chooseChapter, 780, 520, () => this.showChapterSelect(), { width: 250, color: 0x2563eb });
    }

    renderBadges() {
      this.drawBackground({ background: 0x24133f, planet: { x: 1100, y: 110, radius: 115, color: 0xc026d3 } });
      const state = currentStoreState(this.store);
      this.addText(CHINESE_SPACE_COPY.badges, LOGICAL_WIDTH / 2, 65, { fontSize: '42px', color: '#fef08a' });
      this.addText(`💎 ${CHINESE_SPACE_COPY.gems}：${state.spaceGems || 0}`, 1000, 65, { fontSize: '22px', color: '#fde68a' });
      CHINESE_SPACE_BADGES.forEach((badge, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 270 + column * 370;
        const y = 160 + row * 125;
        const owned = (state.ownedBadgeIds || []).includes(badge.id);
        this.addText(`${owned ? '🏅' : '☆'} ${badge.label}`, x, y, { fontSize: '21px' });
        this.addButton(owned ? CHINESE_SPACE_COPY.owned : `${CHINESE_SPACE_COPY.price} ${badge.price} 💎`, x, y + 42, () => {
          if (owned) return;
          if (this.store.redeemBadge(badge.id)) this.feedback = CHINESE_SPACE_COPY.redeemed;
          else this.feedback = CHINESE_SPACE_COPY.noGems;
          this.renderScreen();
          this.emitUi();
        }, { width: 230, height: 42, color: owned ? 0x475569 : 0x7c3aed, fontSize: '16px' });
      });
      if (this.feedback) this.addText(this.feedback, LOGICAL_WIDTH / 2, 590, { fontSize: '22px', color: '#fcd34d' });
      this.addButton(CHINESE_SPACE_COPY.backHome, LOGICAL_WIDTH / 2, 665, () => this.showHome(), { width: 230, height: 46, color: 0x334155, fontSize: '18px' });
    }

    movePlayer(direction) {
      if (!['audio', 'active'].includes(this.screen)) return;
      this.playerLane = Math.max(0, Math.min(LANES.length - 1, this.playerLane + direction));
      if (this.playerNode) this.playerNode.setY(LANES[this.playerLane]);
      this.emitUi();
    }

    fireOnce(now) {
      if (this.screen !== 'active' || !this.fireEnabled || now - this.lastFireAt < CHINESE_SPACE_FIRE_INTERVAL_MS) return;
      this.lastFireAt = now;
      const bulletNode = this.add.rectangle(PLAYER_X + 45, LANES[this.playerLane], 26, 8, 0xfde047);
      this.root.add(bulletNode);
      this.bullets.push({ x: PLAYER_X + 45, y: LANES[this.playerLane], node: bulletNode });
    }

    update(_time, delta) {
      if (this.screen !== 'active' || !this.session) return;
      const now = this.now();
      if (now - this.session.activeStartedAt >= CHINESE_SPACE_TIME_LIMIT_MS) {
        this.timeout();
        return;
      }
      if (this.fireHeld) this.fireOnce(now);
      if (this.timerNode) {
        const remaining = this.remainingMs();
        this.timerNode.setText(`${(remaining / 1000).toFixed(1)}s`);
        this.timerNode.setColor(remaining <= 3000 ? '#fca5a5' : '#bae6fd');
      }
      const distance = delta * 1.25;
      for (const bullet of [...this.bullets]) {
        bullet.x += distance;
        bullet.node.x = bullet.x;
        const target = this.questionTargets.find((candidate) => candidate.active
          && candidate.lane === this.playerLane
          && Math.abs(candidate.x - bullet.x) < 48
          && Math.abs(LANES[candidate.lane] - bullet.y) < 42);
        if (target) {
          this.removeBullet(bullet);
          this.resolveTarget(target.id);
        } else if (bullet.x > LOGICAL_WIDTH + 80) {
          this.removeBullet(bullet);
        }
      }
      if (now - this.lastUiAt > 100) this.emitUi();
    }

    resolveTarget(targetId) {
      if (!this.session) return;
      const result = resolveChineseSpaceTarget(this.session, targetId, this.now(), CHINESE_SPACE_TIME_LIMIT_MS);
      this.session = result.state;
      if (result.event === 'correct') {
        this.fireEnabled = false;
        this.fireHeld = false;
        this.feedback = CHINESE_SPACE_COPY.correct;
        this.audio.playSfx('correct');
        this.audio.playSfx('explosion');
        const target = this.questionTargets.find((item) => item.id === targetId);
        if (target) target.active = false;
        if (this.session.phase === 'complete') {
          this.finishSession();
        } else {
          this.clearPendingTimer();
          this.pendingTimer = this.delay(() => {
            this.session = advanceChineseSpaceQuestion(this.session);
            this.buildQuestionTargets();
            this.playCurrentQuestion();
          }, 320);
        }
      } else if (result.event === 'wrong') {
        this.fireEnabled = false;
        this.fireHeld = false;
        this.feedback = CHINESE_SPACE_COPY.wrong;
        this.audio.playSfx('damage');
        if (this.session.phase === 'gameOver') this.showGameOver();
        else this.playCurrentQuestion(CHINESE_SPACE_COPY.wrong);
      } else if (result.event === 'timeout') {
        this.handleTimeout();
      }
      this.emitUi();
    }

    timeout() {
      if (!this.session) return;
      const result = resolveChineseSpaceTimeout(this.session, this.now(), CHINESE_SPACE_TIME_LIMIT_MS);
      this.session = result.state;
      if (result.event === 'timeout') this.handleTimeout();
      else if (result.event === 'gameOver') this.showGameOver();
    }

    handleTimeout() {
      this.fireEnabled = false;
      this.fireHeld = false;
      this.feedback = CHINESE_SPACE_COPY.timeout;
      this.audio.playSfx('timeout');
      this.audio.playSfx('explosion');
      this.playCurrentQuestion(CHINESE_SPACE_COPY.timeout);
    }

    finishSession() {
      this.clearBullets();
      this.fireEnabled = false;
      const result = {
        chapterId: this.chapterId,
        correctCount: this.session.correctCount,
        total: this.session.questions.length,
        hp: this.session.hp,
        averageReactionTime: calculateAverageReactionTime(this.session.reactionTimes),
        gems: CHINESE_SPACE_GEM_REWARD,
      };
      this.result = result;
      if (!this.sessionCompleteNotified) {
        this.sessionCompleteNotified = true;
        this.callbacks.onSessionComplete?.(result);
      }
      this.setScreen('result');
    }

    showGameOver() {
      this.clearPendingTimer();
      this.clearBullets();
      this.fireHeld = false;
      this.fireEnabled = false;
      this.audio.playSfx('explosion');
      this.setScreen('gameOver');
    }

    remainingMs() {
      if (this.screen !== 'active' || this.session?.activeStartedAt == null) return CHINESE_SPACE_TIME_LIMIT_MS;
      return Math.max(0, CHINESE_SPACE_TIME_LIMIT_MS - (this.now() - this.session.activeStartedAt));
    }

    removeBullet(bullet) {
      const index = this.bullets.indexOf(bullet);
      if (index >= 0) this.bullets.splice(index, 1);
      bullet.node?.destroy();
    }

    clearBullets() {
      this.bullets.forEach((bullet) => bullet.node?.destroy());
      this.bullets = [];
    }

    stopSession() {
      this.audioRequestId += 1;
      this.clearPendingTimer();
      this.clearBullets();
      this.fireHeld = false;
      this.fireEnabled = false;
      this.session = null;
      this.questionTargets = [];
      this.feedback = '';
      this.audio.stop();
    }

    delay(callback, milliseconds) {
      if (this.time?.delayedCall) return this.time.delayedCall(milliseconds, callback);
      return setTimeout(callback, milliseconds);
    }

    clearPendingTimer() {
      if (!this.pendingTimer) return;
      if (typeof this.pendingTimer.remove === 'function') this.pendingTimer.remove();
      else clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }

    handleMenuKey(key) {
      if (this.screen === 'home' && ['enter', 'space'].includes(key)) this.showChapterSelect();
      else if (this.screen === 'chapterSelect' && key === '1') this.startChapter('school');
      else if (this.screen === 'chapterSelect' && key === '2') this.startChapter('park');
      else if (this.screen === 'chapterSelect' && key === '3') this.startChapter('family');
      else if (this.screen === 'chapterSelect' && key === 'escape') this.showHome();
      else if (this.screen === 'tutorial' && ['enter', 'space'].includes(key)) this.completeTutorial();
      else if (this.screen === 'result' && key === 'enter') this.beginChapter();
      else if (this.screen === 'result' && key === 'escape') this.showChapterSelect();
      else if (this.screen === 'gameOver' && key === 'enter') this.beginChapter();
      else if (this.screen === 'gameOver' && key === 'escape') this.showChapterSelect();
      else if (this.screen === 'badges' && key === 'escape') this.showHome();
    }

    destroyAudio() {
      this.audio.stop();
    }

    emitUi() {
      this.lastUiAt = this.now();
      this.callbacks.onUiStateChange?.({
        screen: this.screen,
        chapterId: this.chapterId,
        questionIndex: this.session?.questionIndex ?? 0,
        questionCount: this.session?.questions?.length || 0,
        phase: this.session?.phase || this.screen,
        hp: this.session?.hp ?? CHINESE_SPACE_STARTING_HP,
        countdownMs: Math.round(this.remainingMs()),
        feedback: this.feedback,
        result: this.result || null,
      });
    }

    shutdown() {
      this.scale?.off('resize', this.resizeScene, this);
      if (typeof window !== 'undefined' && this.domKeyHandler) window.removeEventListener('keydown', this.domKeyHandler);
      this.destroyAudio();
      this.clearPendingTimer();
    }
  };
}
