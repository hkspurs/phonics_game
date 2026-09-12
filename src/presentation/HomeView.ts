import { DataManager } from '../services/DataManager';
import { addText, makeElement, type ScreenHandle } from './responsive';

export interface HomeViewActions {
  start(): void;
  report(): void;
  shop(): void;
  trophies(): void;
  settings(): void;
}

export function mountHomeView(host: HTMLElement, actions: HomeViewActions): ScreenHandle {
  const dm = DataManager.getInstance();
  const profile = dm.getProfile();
  const progressed = profile.unlockedStations > 1 || dm.getTotalStars() > 0;
  const currentStation = Math.min(10, Math.max(1, profile.unlockedStations));
  const shell = makeElement('section', 'screen-view home-view');
  shell.setAttribute('aria-labelledby', 'home-title');

  const top = makeElement('div', 'home-topbar');
  addText(top, 'span', '升夢大冒險', 'home-brand');
  const counters = makeElement('div', 'home-counters');
  addText(counters, 'span', `金幣 ${profile.coins}`, 'counter counter-coin');
  addText(counters, 'span', `寶石 ${profile.gems}`, 'counter counter-gem');
  addText(counters, 'span', `星星 ${dm.getTotalStars()}/30`, 'counter counter-star');
  top.append(counters);
  shell.append(top);

  const content = makeElement('div', 'home-content');
  const copy = makeElement('div', 'home-copy');
  addText(copy, 'p', '小小探險家，', 'home-kicker');
  addText(copy, 'h1', '今日一齊學新本領！', 'home-title');
  addText(copy, 'p', '完成中文、數學同英語挑戰，逐步解鎖森林新地方。', 'home-description');
  const next = makeElement('div', 'home-next-card');
  addText(next, 'span', '下一站', 'home-next-label');
  addText(next, 'strong', `第 ${currentStation} 關 · 準備出發`, 'home-next-title');
  addText(next, 'span', '每關有 3 題小挑戰', 'home-next-hint');
  copy.append(next);
  const primary = makeElement('button', 'story-button story-button-primary');
  primary.type = 'button';
  primary.textContent = progressed ? '繼續冒險' : '開始冒險';
  primary.addEventListener('click', actions.start);
  copy.append(primary);
  content.append(copy);

  const secondary = makeElement('nav', 'home-secondary');
  secondary.setAttribute('aria-label', '其他選單');
  const entries: Array<[string, keyof HomeViewActions, string]> = [
    ['學習報告', 'report', '報告'],
    ['換新造型', 'shop', '造型'],
    ['我的獎章', 'trophies', '獎章'],
    ['設定', 'settings', '設定'],
  ];
  for (const [label, action, shortLabel] of entries) {
    const button = makeElement('button', 'story-button story-button-secondary');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.innerHTML = `<span class="button-mark" aria-hidden="true">${shortLabel.slice(0, 1)}</span><span>${label}</span>`;
    button.addEventListener('click', actions[action]);
    secondary.append(button);
  }
  content.append(secondary);
  shell.append(content);
  host.append(shell);
  primary.focus({ preventScroll: true });

  return { destroy: () => shell.remove() };
}
