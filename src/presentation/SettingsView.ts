import { DataManager } from '../services/DataManager';
import type { VoiceLanguage } from '../types';
import { DIFFICULTY_OPTIONS, VOICE_LANGUAGES } from '../scenes/SettingsScene';
import { addText, makeElement, type ScreenHandle } from './responsive';

export interface SettingsViewScene {
  toggleSubject(key: 'chineseEnabled' | 'mathEnabled' | 'englishEnabled'): void;
  selectVoiceLanguage(lang: VoiceLanguage, sample?: string): void;
  setVolumeLevel(volume: number): void;
  selectDifficulty(level: number): void;
  executeDataReset(): void;
  scene?: { start(key: string): void };
}

function choiceButton(label: string, selected: boolean, key: string, action: () => void): HTMLButtonElement {
  const button = makeElement('button', `setting-choice${selected ? ' is-selected' : ''}`);
  button.type = 'button'; button.textContent = label; button.dataset.settingKey = key; button.setAttribute('aria-pressed', String(selected));
  button.addEventListener('click', action); return button;
}

export function mountSettingsView(host: HTMLElement, scene: SettingsViewScene, announcement = '', focusKey?: string): ScreenHandle {
  let closeDialog: (() => void) | null = null;
  const shell = makeElement('main', 'screen-view support-view settings-view'); shell.setAttribute('aria-labelledby', 'settings-title');
  const head = makeElement('header', 'support-head');
  const back = makeElement('button', 'support-back'); back.type = 'button'; back.textContent = '‹ 返回主頁'; back.addEventListener('click', () => scene.scene?.start('TitleScene')); head.append(back);
  addText(head, 'h1', '遊戲設定', 'support-title').id = 'settings-title'; shell.append(head);
  const status = addText(shell, 'p', announcement, 'support-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const grid = makeElement('div', 'settings-grid');
  const settings = DataManager.getInstance().getProfile().settings;
  const section = (title: string): HTMLElement => { const el = makeElement('section', 'support-card'); addText(el, 'h2', title); grid.append(el); return el; };

  const subjects = section('練習科目');
  ([['中文', 'chineseEnabled'], ['數學', 'mathEnabled'], ['英語', 'englishEnabled']] as const).forEach(([label, key]) => {
    const button = choiceButton(`${label}：${settings[key] ? '開' : '關'}`, settings[key], key, () => { const before = DataManager.getInstance().getProfile().settings[key]; scene.toggleSubject(key); const after = DataManager.getInstance().getProfile().settings[key]; mountSettingsView(host, scene, before === after ? `無法關閉${label}，最少要保留一個練習科目。` : `${label}已${after ? '開啟' : '關閉'}。`, key); }); subjects.append(button);
  });
  addText(subjects, 'p', '最少保留一個練習科目。', 'support-help');

  const voices = section('朗讀語言');
  VOICE_LANGUAGES.forEach((voice) => voices.append(choiceButton(voice.label, settings.voiceLanguage === voice.lang, `voice-${voice.lang}`, () => { scene.selectVoiceLanguage(voice.lang, voice.sample); mountSettingsView(host, scene, `朗讀語言已設定為${voice.label}。`, `voice-${voice.lang}`); })));

  const volume = section('音效音量');
  ([['靜音', 0], ['50%', .5], ['100%', 1]] as const).forEach(([label, value]) => volume.append(choiceButton(label, Math.abs(settings.soundVolume - value) < .05, `volume-${value}`, () => { scene.setVolumeLevel(value); DataManager.getInstance().updateSettings({ soundVolume: value }); mountSettingsView(host, scene, `音效音量已設定為${label}。`, `volume-${value}`); })));

  const difficulty = section('題目難度');
  DIFFICULTY_OPTIONS.forEach((option) => difficulty.append(choiceButton(option.label, settings.difficulty === option.level, `difficulty-${option.level}`, () => { scene.selectDifficulty(option.level); mountSettingsView(host, scene, `題目難度已設定為${option.label}。`, `difficulty-${option.level}`); })));
  addText(difficulty, 'p', (DIFFICULTY_OPTIONS.find((option) => option.level === settings.difficulty) ?? DIFFICULTY_OPTIONS[0]).description, 'support-help');

  const danger = section('清除遊戲資料'); danger.classList.add('danger-card');
  addText(danger, 'p', '清除後會失去通關進度、金幣、寶石、造型和獎章。', 'support-help');
  const reset = makeElement('button', 'settings-reset'); reset.type = 'button'; reset.textContent = '重設所有遊戲進度';
  reset.addEventListener('click', () => { closeDialog = openResetDialog(shell, scene.executeDataReset.bind(scene), reset); }); danger.append(reset);
  shell.append(grid); host.replaceChildren(shell); const focusTarget = focusKey ? shell.querySelector<HTMLButtonElement>(`[data-setting-key="${focusKey}"]`) : back; focusTarget?.focus({ preventScroll: true }); if (announcement) { status.textContent = ''; queueMicrotask(() => { if (status.isConnected) status.textContent = announcement; }); }
  return { destroy: () => { closeDialog?.(); shell.remove(); } };
}

function openResetDialog(shell: HTMLElement, confirm: () => void, returnFocus: HTMLElement): () => void {
  const backdrop = makeElement('div', 'dialog-backdrop');
  const dialog = makeElement('div', 'support-dialog'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-labelledby', 'reset-title');
  addText(dialog, 'h2', '確定重設所有進度？').id = 'reset-title'; addText(dialog, 'p', '這個動作無法復原。所有通關進度、獎勵和收藏都會被清除。');
  const actions = makeElement('div', 'dialog-actions'); const cancel = makeElement('button', 'dialog-cancel'); cancel.type = 'button'; cancel.textContent = '保留我的進度';
  const destructive = makeElement('button', 'dialog-confirm'); destructive.type = 'button'; destructive.textContent = '確定清除全部資料'; actions.append(cancel, destructive); dialog.append(actions); backdrop.append(dialog); shell.append(backdrop);
  const close = () => { document.removeEventListener('keydown', onKey); backdrop.remove(); returnFocus.focus(); };
  const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); if (event.key === 'Tab') { event.preventDefault(); (document.activeElement === cancel ? destructive : cancel).focus(); } };
  cancel.addEventListener('click', close); destructive.addEventListener('click', () => { close(); confirm(); }); backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(); }); document.addEventListener('keydown', onKey); cancel.focus();
  return close;
}
