import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { GameSettings, VoiceLanguage } from '../types';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { SpeechService } from '../services/SpeechService';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasModal } from '../ui/CanvasModal';

export interface DifficultyOption {
  level: number;
  label: string;
  name: string;
  description: string;
}

export const DIFFICULTY_OPTIONS: readonly DifficultyOption[] = [
  { level: 1, label: 'Lv.1 入門', name: '入門級 (基礎)', description: '適合幼小銜接：10以內加減、基礎字詞認讀與三詞造句。' },
  { level: 2, label: 'Lv.2 中級', name: '中級 (標準)', description: '標準小一程度：20以內加減、常見四詞造句與單字拼讀。' },
  { level: 3, label: 'Lv.3 高級', name: '高級 (進階)', description: '進階思維：進位退位加減、五詞以上重組句子與綜合題。' },
  { level: 4, label: 'Lv.4 挑戰級', name: '挑戰級 (奧數/高階)', description: '學霸挑戰：應用題邏輯分析、長句重組與高難度英語句型。' },
];

export const VOICE_LANGUAGES: readonly { lang: VoiceLanguage; label: string; sample: string }[] = [
  { lang: 'zh-HK', label: '廣東話 (zh-HK)', sample: '你好！歡迎來到升夢大冒險！' },
  { lang: 'en-US', label: '英文 (en-US)', sample: 'Hello! Welcome to P1 Adventure!' },
  { lang: 'zh-CN', label: '普通話 (zh-CN)', sample: '你好！欢迎来到升梦大冒险！' },
];

export class SettingsScene extends Phaser.Scene {
  // Navigation Buttons
  public homeButton: CanvasButton | null = null;

  // Subject Toggle Buttons
  public chineseToggleBtn: CanvasButton | null = null;
  public mathToggleBtn: CanvasButton | null = null;
  public englishToggleBtn: CanvasButton | null = null;

  // Voice Language Buttons
  public voiceButtons: CanvasButton[] = [];

  // Difficulty Buttons
  public difficultyButtons: CanvasButton[] = [];
  public difficultyDescText: Phaser.GameObjects.Text | null = null;

  // Volume Buttons
  public volumeButtons: CanvasButton[] = [];
  public testAudioButton: CanvasButton | null = null;

  // Reset Button & Modal
  public resetButton: CanvasButton | null = null;
  public confirmResetModal: CanvasModal | null = null;

  // Containers
  public mainPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    this.voiceButtons = [];
    this.difficultyButtons = [];
    this.volumeButtons = [];

    // 1. Background
    this.createBackground(width, height);

    // 2. Top Header HUD
    this.createHeaderHUD(width);

    // 3. Settings Cards Panel
    this.createSettingsPanel(width, height);
  }

  private createBackground(width: number, height: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();
      // Sleek tech-slate background gradient
      g.fillGradientStyle(0x16202c, 0x16202c, 0x0c131b, 0x0c131b, 1);
      g.fillRect(0, 0, width, height);

      // Subtle atmospheric glows
      g.fillStyle(0x38bdf8, 0.05);
      g.fillCircle(width * 0.2, height * 0.4, 300);
      g.fillStyle(0x48b64e, 0.04);
      g.fillCircle(width * 0.8, height * 0.7, 340);

      // Border outline
      g.lineStyle(2, 0x27364b, 0.8);
      g.strokeRect(0, 0, width, height);
    } else if (this.add.rectangle) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x16202c);
    }
  }

  private createHeaderHUD(width: number): void {
    if (!this.add) return;

    const barY = 38;

    // 1. ◀ 返回主頁 (TitleScene)
    this.homeButton = new CanvasButton(this, {
      x: 100,
      y: barY,
      width: 140,
      height: 44,
      text: '◀ 返回主頁',
      color: 'blue',
      fontSize: '18px',
      onClick: () => {
        SoundManager.play('click');
        SpeechService.stop();
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });

    // 2. Scene Title Text
    if (this.add.text) {
      const title = this.add.text(width / 2, barY, '⚙️ 系統設定 (System Settings)', {
        fontSize: '24px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof title.setOrigin === 'function') title.setOrigin(0.5);
    }
  }

  private createSettingsPanel(width: number, height: number): void {
    if (!this.add) return;

    const panelW = 1120;
    const panelH = 590;
    const panelX = width / 2;
    const panelY = height / 2 + 35;

    const panel = this.add.container
      ? this.add.container(panelX, panelY)
      : new Phaser.GameObjects.Container(this, panelX, panelY);

    panel.setDepth(30);

    // 1. Panel Card Graphics Background
    if (this.add.graphics) {
      const g = this.add.graphics();
      // Drop Shadow
      g.fillStyle(0x000000, 0.4);
      g.fillRoundedRect(-panelW / 2 + 4, -panelH / 2 + 8, panelW, panelH, 20);

      // Panel Body
      g.fillStyle(0x182232, 0.96);
      g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

      // Outline Border
      g.lineStyle(2.5, 0x3b82f6, 0.8);
      g.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);

      // Vertical Splitter Line (Left column & Right column)
      g.lineStyle(1.5, 0x27364b, 0.7);
      g.lineBetween(0, -panelH / 2 + 25, 0, panelH / 2 - 25);

      panel.add(g);
    }

    const settings = DataManager.getInstance().getProfile().settings;

    // LEFT COLUMN:
    // 1. 出題科目設置 (Subject Selection)
    this.createSubjectTogglesSection(panel, -panelW / 4, -panelH / 2 + 45, settings);

    // 2. 語音發音語言 (Voice Language)
    this.createVoiceLanguageSection(panel, -panelW / 4, -panelH / 2 + 215, settings);

    // 3. 音效音量 (Sound Volume)
    this.createVolumeSection(panel, -panelW / 4, -panelH / 2 + 385, settings);

    // RIGHT COLUMN:
    // 4. 題目難度等級 (Difficulty Selection)
    this.createDifficultySection(panel, panelW / 4, -panelH / 2 + 45, settings);

    // 5. 危險區域：重設所有進度 (Danger Zone: Reset)
    this.createResetSection(panel, panelW / 4, panelH / 2 - 95);

    this.mainPanel = panel;
    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(panel);
    }
  }

  private createSubjectTogglesSection(
    panel: Phaser.GameObjects.Container,
    cx: number,
    topY: number,
    settings: GameSettings
  ): void {
    if (this.add.text) {
      const sectionTitle = this.add.text(cx, topY, '📚 出題科目設置 (Subject Selection)', {
        fontSize: '19px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof sectionTitle.setOrigin === 'function') sectionTitle.setOrigin(0.5);
      panel.add(sectionTitle);
    }

    const btnW = 140;
    const btnH = 50;
    const btnY = topY + 52;
    const spacing = 155;

    // 1. 中文科 Toggle
    this.chineseToggleBtn = new CanvasButton(this, {
      x: panel.x + cx - spacing,
      y: panel.y + btnY,
      width: btnW,
      height: btnH,
      text: settings.chineseEnabled ? '📕 中文：開' : '📕 中文：關',
      color: settings.chineseEnabled ? 'green' : 'grey',
      fontSize: '17px',
      onClick: () => {
        this.toggleSubject('chineseEnabled');
      },
    });

    // 2. 數學科 Toggle
    this.mathToggleBtn = new CanvasButton(this, {
      x: panel.x + cx,
      y: panel.y + btnY,
      width: btnW,
      height: btnH,
      text: settings.mathEnabled ? '📐 數學：開' : '📐 數學：關',
      color: settings.mathEnabled ? 'green' : 'grey',
      fontSize: '17px',
      onClick: () => {
        this.toggleSubject('mathEnabled');
      },
    });

    // 3. 英文科 Toggle
    this.englishToggleBtn = new CanvasButton(this, {
      x: panel.x + cx + spacing,
      y: panel.y + btnY,
      width: btnW,
      height: btnH,
      text: settings.englishEnabled ? '🔤 英文：開' : '🔤 英文：關',
      color: settings.englishEnabled ? 'green' : 'grey',
      fontSize: '17px',
      onClick: () => {
        this.toggleSubject('englishEnabled');
      },
    });
  }

  public toggleSubject(key: 'chineseEnabled' | 'mathEnabled' | 'englishEnabled'): void {
    const dm = DataManager.getInstance();
    const curSettings = dm.getProfile().settings;

    const currentVal = curSettings[key];
    const willEnable = !currentVal;

    // Guardrail: At least 1 subject must remain enabled
    if (!willEnable) {
      const activeCount =
        (curSettings.chineseEnabled ? 1 : 0) +
        (curSettings.mathEnabled ? 1 : 0) +
        (curSettings.englishEnabled ? 1 : 0);

      if (activeCount <= 1) {
        SoundManager.play('wrong');
        return;
      }
    }

    dm.updateSettings({ [key]: willEnable });
    SoundManager.play('click');

    // Update buttons
    const updated = dm.getProfile().settings;
    if (this.chineseToggleBtn) {
      this.chineseToggleBtn.setText(updated.chineseEnabled ? '📕 中文：開' : '📕 中文：關');
      this.chineseToggleBtn.setColor(updated.chineseEnabled ? 'green' : 'grey');
    }
    if (this.mathToggleBtn) {
      this.mathToggleBtn.setText(updated.mathEnabled ? '📐 數學：開' : '📐 數學：關');
      this.mathToggleBtn.setColor(updated.mathEnabled ? 'green' : 'grey');
    }
    if (this.englishToggleBtn) {
      this.englishToggleBtn.setText(updated.englishEnabled ? '🔤 英文：開' : '🔤 英文：關');
      this.englishToggleBtn.setColor(updated.englishEnabled ? 'green' : 'grey');
    }
  }

  private createVoiceLanguageSection(
    panel: Phaser.GameObjects.Container,
    cx: number,
    topY: number,
    settings: GameSettings
  ): void {
    if (this.add.text) {
      const sectionTitle = this.add.text(cx, topY, '🗣️ 語音發音語言 (Voice Language)', {
        fontSize: '19px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof sectionTitle.setOrigin === 'function') sectionTitle.setOrigin(0.5);
      panel.add(sectionTitle);
    }

    const btnW = 150;
    const btnH = 48;
    const btnY = topY + 50;
    const spacing = 160;

    VOICE_LANGUAGES.forEach((item, idx) => {
      const xPos = panel.x + cx + (idx - 1) * spacing;
      const isSelected = item.lang === settings.voiceLanguage;

      const btn = new CanvasButton(this, {
        x: xPos,
        y: panel.y + btnY,
        width: btnW,
        height: btnH,
        text: item.label,
        color: isSelected ? 'yellow' : 'grey',
        fontSize: '15px',
        onClick: () => {
          this.selectVoiceLanguage(item.lang, item.sample);
        },
      });

      this.voiceButtons.push(btn);
    });
  }

  public selectVoiceLanguage(lang: VoiceLanguage, sampleText?: string): void {
    const dm = DataManager.getInstance();
    dm.updateSettings({ voiceLanguage: lang });
    SoundManager.play('click');

    // Update button visual states
    VOICE_LANGUAGES.forEach((item, idx) => {
      const btn = this.voiceButtons[idx];
      if (btn) {
        btn.setColor(item.lang === lang ? 'yellow' : 'grey');
      }
    });

    // Play test speech sample
    const sample = sampleText || '你好！歡迎來到升夢大冒險！';
    SpeechService.speak(sample, lang);
  }

  private createVolumeSection(
    panel: Phaser.GameObjects.Container,
    cx: number,
    topY: number,
    settings: GameSettings
  ): void {
    if (this.add.text) {
      const sectionTitle = this.add.text(cx, topY, '🔊 音效與音量控制 (Sound & Volume)', {
        fontSize: '19px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof sectionTitle.setOrigin === 'function') sectionTitle.setOrigin(0.5);
      panel.add(sectionTitle);
    }

    const volumeConfigs = [
      { vol: 0, label: '🔇 靜音' },
      { vol: 0.5, label: '🔉 50%' },
      { vol: 1.0, label: '🔊 100%' },
    ];

    const btnW = 100;
    const btnH = 46;
    const btnY = topY + 50;
    const spacing = 110;

    volumeConfigs.forEach((conf, idx) => {
      const xPos = panel.x + cx - 110 + (idx - 1) * spacing;
      const isSelected = Math.abs(settings.soundVolume - conf.vol) < 0.05;

      const btn = new CanvasButton(this, {
        x: xPos,
        y: panel.y + btnY,
        width: btnW,
        height: btnH,
        text: conf.label,
        color: isSelected ? 'yellow' : 'grey',
        fontSize: '16px',
        onClick: () => {
          this.setVolumeLevel(conf.vol);
        },
      });

      this.volumeButtons.push(btn);
    });

    // Test Audio Button
    this.testAudioButton = new CanvasButton(this, {
      x: panel.x + cx + 160,
      y: panel.y + btnY,
      width: 130,
      height: btnH,
      text: '🎵 測試音效',
      color: 'blue',
      fontSize: '16px',
      onClick: () => {
        SoundManager.play('coin');
      },
    });
  }

  public setVolumeLevel(vol: number): void {
    SoundManager.setVolume(vol);
    SoundManager.play('click');

    const volumeConfigs = [0, 0.5, 1.0];
    volumeConfigs.forEach((v, idx) => {
      const btn = this.volumeButtons[idx];
      if (btn) {
        btn.setColor(Math.abs(vol - v) < 0.05 ? 'yellow' : 'grey');
      }
    });
  }

  private createDifficultySection(
    panel: Phaser.GameObjects.Container,
    cx: number,
    topY: number,
    settings: GameSettings
  ): void {
    if (this.add.text) {
      const sectionTitle = this.add.text(cx, topY, '🎯 題目難度等級 (Difficulty Level)', {
        fontSize: '19px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ffd700',
        fontStyle: 'bold',
      });
      if (typeof sectionTitle.setOrigin === 'function') sectionTitle.setOrigin(0.5);
      panel.add(sectionTitle);
    }

    const btnW = 230;
    const btnH = 50;
    const row1Y = topY + 48;
    const row2Y = topY + 110;
    const col1X = panel.x + cx - 125;
    const col2X = panel.x + cx + 125;

    const positions = [
      { x: col1X, y: panel.y + row1Y },
      { x: col2X, y: panel.y + row1Y },
      { x: col1X, y: panel.y + row2Y },
      { x: col2X, y: panel.y + row2Y },
    ];

    DIFFICULTY_OPTIONS.forEach((opt, idx) => {
      const pos = positions[idx];
      const isSelected = opt.level === settings.difficulty;

      const btn = new CanvasButton(this, {
        x: pos.x,
        y: pos.y,
        width: btnW,
        height: btnH,
        text: opt.label,
        color: isSelected ? 'yellow' : 'grey',
        fontSize: '17px',
        onClick: () => {
          this.selectDifficulty(opt.level);
        },
      });

      this.difficultyButtons.push(btn);
    });

    // Description text card for active difficulty
    const currentOpt =
      DIFFICULTY_OPTIONS.find((o) => o.level === settings.difficulty) ||
      DIFFICULTY_OPTIONS[0];

    if (this.add.graphics) {
      const bg = this.add.graphics();
      bg.fillStyle(0x101722, 0.85);
      bg.fillRoundedRect(cx - 240, topY + 155, 480, 80, 12);
      bg.lineStyle(1.5, 0x334155, 0.8);
      bg.strokeRoundedRect(cx - 240, topY + 155, 480, 80, 12);
      panel.add(bg);
    }

    if (this.add.text) {
      this.difficultyDescText = this.add.text(
        cx,
        topY + 195,
        `📌 ${currentOpt.name}\n${currentOpt.description}`,
        {
          fontSize: '14px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#a0c4ff',
          align: 'center',
          lineSpacing: 4,
        }
      );
      if (typeof this.difficultyDescText.setOrigin === 'function') {
        this.difficultyDescText.setOrigin(0.5);
      }
      panel.add(this.difficultyDescText);
    }
  }

  public selectDifficulty(level: number): void {
    const dm = DataManager.getInstance();
    dm.updateSettings({ difficulty: level });
    SoundManager.play('click');

    // Update difficulty button colors
    DIFFICULTY_OPTIONS.forEach((opt, idx) => {
      const btn = this.difficultyButtons[idx];
      if (btn) {
        btn.setColor(opt.level === level ? 'yellow' : 'grey');
      }
    });

    // Update description text
    const opt = DIFFICULTY_OPTIONS.find((o) => o.level === level) || DIFFICULTY_OPTIONS[0];
    if (this.difficultyDescText && typeof this.difficultyDescText.setText === 'function') {
      this.difficultyDescText.setText(`📌 ${opt.name}\n${opt.description}`);
    }
  }

  private createResetSection(panel: Phaser.GameObjects.Container, cx: number, topY: number): void {
    if (this.add.text) {
      const dangerTitle = this.add.text(cx, topY, '⚠️ 危險區域：清除資料 (Danger Zone)', {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#ff6b6b',
        fontStyle: 'bold',
      });
      if (typeof dangerTitle.setOrigin === 'function') dangerTitle.setOrigin(0.5);
      panel.add(dangerTitle);
    }

    // Reset Progress Button
    this.resetButton = new CanvasButton(this, {
      x: panel.x + cx,
      y: panel.y + topY + 45,
      width: 320,
      height: 52,
      text: '⚠️ 重設所有遊戲進度',
      color: 'red',
      fontSize: '19px',
      onClick: () => {
        this.openResetConfirmationModal();
      },
    });
  }

  public openResetConfirmationModal(): void {
    if (this.confirmResetModal && this.confirmResetModal.isOpen()) return;

    SoundManager.play('wrong');

    const modal = new CanvasModal(this, {
      title: '⚠️ 確認重設所有遊戲進度？',
      width: 600,
      height: 380,
      theme: 'dark',
      onClose: () => {
        this.confirmResetModal = null;
      },
    });

    if (this.add.text) {
      const warningText = this.add.text(
        0,
        -40,
        '此操作將會徹底清除所有通關進度、金幣、寶石、\n已解鎖造型及所有榮譽獎盃，\n且無法復原！\n\n您確定要重新開始冒險嗎？',
        {
          fontSize: '18px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#ffd166',
          align: 'center',
          lineSpacing: 6,
        }
      );
      if (typeof warningText.setOrigin === 'function') warningText.setOrigin(0.5);
      modal.addContent(warningText);
    }

    // Cancel Button
    const cancelBtn = new CanvasButton(this, {
      x: -130,
      y: 90,
      width: 170,
      height: 48,
      text: '❌ 取消返回',
      color: 'grey',
      fontSize: '18px',
      onClick: () => {
        SoundManager.play('click');
        modal.close();
      },
    });

    // Confirm Reset Button
    const confirmBtn = new CanvasButton(this, {
      x: 130,
      y: 90,
      width: 170,
      height: 48,
      text: '🔥 確認重設',
      color: 'red',
      fontSize: '18px',
      onClick: () => {
        this.executeDataReset();
        modal.close();
      },
    });

    modal.addContent([cancelBtn, confirmBtn]);

    this.confirmResetModal = modal;
    modal.show();
  }

  public executeDataReset(): void {
    const dm = DataManager.getInstance();
    dm.reset();
    SoundManager.play('victory');

    // Refresh entire scene in place
    if (this.scene) {
      this.scene.restart();
    }
  }
}

