import { addText, makeElement, type ScreenHandle } from './responsive';

export interface ResultViewScene {
  stationId: number;
  stationName: string;
  starsEarned: number;
  totalQuestions: number;
  sessionStats: { correctCount: number; hintsUsed: number; mistakes: number };
  rewardCoins: number;
  rewardGems: number;
  newlyUnlockedTrophies: string[];
  mapButton: { triggerClick(): void } | null;
  retryButton: { triggerClick(): void } | null;
  nextStationButton: { triggerClick(): void } | null;
  homeButton: { triggerClick(): void } | null;
}
function starsLabel(stars: number): string {
  const safe = Math.max(0, Math.min(3, stars));
  return `${'★'.repeat(safe)}${'☆'.repeat(3 - safe)}`;
}

/** Reading-first result presentation; all navigation still goes through ResultScene actions. */
export function mountResultView(host: HTMLElement, scene: ResultViewScene): ScreenHandle {
  const shell = makeElement('section', 'screen-view result-view');
  shell.setAttribute('aria-labelledby', 'result-title');

  const card = makeElement('div', 'result-card');
  addText(card, 'p', `第 ${scene.stationId} 關 · ${scene.stationName}`, 'result-kicker');
  addText(card, 'h1', '完成啦！', 'result-title').id = 'result-title';
  addText(card, 'p', '你已經完成今日的小挑戰，獎勵已加入你的冒險袋。', 'result-copy');

  const stars = makeElement('div', 'result-stars');
  stars.textContent = starsLabel(scene.starsEarned);
  stars.setAttribute('aria-label', `${scene.starsEarned} 顆星星`);
  card.append(stars);

  const rewards = makeElement('div', 'result-rewards');
  const rewardCoins = makeElement('div', 'result-reward');
  addText(rewardCoins, 'span', '金幣', 'result-reward-label');
  addText(rewardCoins, 'strong', `+${scene.rewardCoins}`, 'result-reward-value');
  rewardCoins.classList.add('is-coin');
  const rewardGems = makeElement('div', 'result-reward');
  addText(rewardGems, 'span', '寶石', 'result-reward-label');
  addText(rewardGems, 'strong', `+${scene.rewardGems}`, 'result-reward-value');
  rewardGems.classList.add('is-gem');
  rewards.append(rewardCoins, rewardGems);
  card.append(rewards);

  const stats = makeElement('div', 'result-stats');
  const statItems: Array<[string, string]> = [
    ['答對題數', `${scene.sessionStats.correctCount} / ${scene.totalQuestions}`],
    ['提示使用', `${scene.sessionStats.hintsUsed} 次`],
    ['失誤次數', `${scene.sessionStats.mistakes} 次`],
  ];
  statItems.forEach(([label, value]) => {
    const item = makeElement('div', 'result-stat');
    addText(item, 'span', label);
    addText(item, 'strong', value);
    stats.append(item);
  });
  card.append(stats);

  if (scene.newlyUnlockedTrophies.length > 0) {
    const trophy = makeElement('p', 'result-trophy-note');
    trophy.textContent = `新獎章已解鎖：${scene.newlyUnlockedTrophies.length} 個`;
    card.append(trophy);
  }

  const primary = makeElement('button', 'story-button story-button-primary result-primary');
  primary.type = 'button';
  primary.textContent = scene.nextStationButton ? '前往下一站' : '返回地圖';
  primary.addEventListener('click', () => (scene.nextStationButton ?? scene.mapButton)?.triggerClick());
  card.append(primary);

  const secondary = makeElement('div', 'result-secondary-actions');
  const actions: Array<[string, { triggerClick(): void } | null]> = [
    ['再玩一次', scene.retryButton],
    ['返回地圖', scene.mapButton],
    ['返回首頁', scene.homeButton],
  ];
  actions.forEach(([label, action]) => {
    if (!action) return;
    const button = makeElement('button', 'story-button story-button-secondary');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => action.triggerClick());
    secondary.append(button);
  });
  card.append(secondary);
  shell.append(card);
  host.append(shell);
  primary.focus({ preventScroll: true });
  return { destroy: () => shell.remove() };
}
