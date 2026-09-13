import { addText, makeElement, type ScreenHandle } from './responsive';
import type { StationData } from '../scenes/MapScene';

export interface StationDetailActions {
  close(): void;
  start(station: StationData, questionIndex?: number): void;
}
const ACTIVITIES = [
  {
    label: '中文小挑戰',
    detail: '字詞、句子同生活閱讀',
    mark: '中',
  },
  {
    label: '數學小挑戰',
    detail: '20 以內加減同邏輯遊戲',
    mark: '數',
  },
  {
    label: '英語小挑戰',
    detail: 'Phonics、Sight words 同對話',
    mark: '英',
  },
] as const;

/** Responsive station details. It keeps the station catalog in MapScene authoritative. */
export function mountStationDetailView(
  host: HTMLElement,
  station: StationData,
  stars: number,
  actions: StationDetailActions,
): ScreenHandle {
  const shell = makeElement('section', 'screen-view station-detail-view');
  shell.setAttribute('role', 'dialog');
  shell.setAttribute('aria-modal', 'true');
  shell.setAttribute('aria-labelledby', 'station-detail-title');

  const dialog = makeElement('div', 'station-detail-card');
  const head = makeElement('div', 'station-detail-head');
  const close = makeElement('button', 'station-detail-close');
  close.type = 'button';
  close.textContent = '‹ 返回地圖';
  close.addEventListener('click', actions.close);
  head.append(close);

  const titleWrap = makeElement('div', 'station-detail-title-wrap');
  addText(titleWrap, 'span', `第 ${station.id} 站 · ${station.englishName}`, 'station-detail-kicker');
  const title = addText(titleWrap, 'h1', station.name, 'station-detail-title');
  title.id = 'station-detail-title';
  head.append(titleWrap);
  dialog.append(head);

  const illustration = makeElement('div', 'station-detail-illustration');
  addText(illustration, 'span', station.icon, 'station-detail-icon');
  const copy = makeElement('div', 'station-detail-copy');
  addText(copy, 'strong', station.biome, 'station-detail-biome');
  addText(copy, 'p', station.description, 'station-detail-description');
  illustration.append(copy);
  dialog.append(illustration);

  const progress = makeElement('div', 'station-detail-progress');
  addText(progress, 'span', '本站學習進度', 'station-detail-progress-label');
  addText(progress, 'strong', `${Math.max(0, Math.min(3, stars))} / 3 ⭐`, 'station-detail-stars');
  dialog.append(progress);

  const activities = makeElement('div', 'station-activities');
  addText(activities, 'h2', '揀一個小挑戰', 'station-activities-title');
  ACTIVITIES.forEach((activity, index) => {
    const button = makeElement('button', 'station-activity');
    button.type = 'button';
    button.setAttribute('aria-label', `${activity.label}：${activity.detail}`);
    const mark = addText(button, 'span', activity.mark, 'station-activity-mark');
    mark.setAttribute('aria-hidden', 'true');
    const text = makeElement('span', 'station-activity-copy');
    addText(text, 'strong', activity.label);
    addText(text, 'small', activity.detail);
    button.append(text);
    button.addEventListener('click', () => actions.start(station, index));
    activities.append(button);
  });
  dialog.append(activities);

  const start = makeElement('button', 'story-button story-button-primary station-detail-start');
  start.type = 'button';
  start.textContent = '開始這一關';
  start.addEventListener('click', () => actions.start(station));
  dialog.append(start);

  shell.append(dialog);
  host.append(shell);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') actions.close();
  };
  document.addEventListener('keydown', onKeyDown);
  close.focus({ preventScroll: true });

  return {
    destroy: () => {
      document.removeEventListener('keydown', onKeyDown);
      shell.remove();
    },
  };
}
