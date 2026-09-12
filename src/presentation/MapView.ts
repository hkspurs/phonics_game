import { DataManager } from '../services/DataManager';
import { addText, makeElement, type ScreenHandle } from './responsive';
import type { StationData } from '../scenes/MapScene';

export interface MapViewActions {
  open(station: StationData): void;
  home(): void;
}

export function mountMapView(host: HTMLElement, stations: readonly StationData[], actions: MapViewActions): ScreenHandle {
  const dm = DataManager.getInstance();
  const profile = dm.getProfile();
  const unlocked = Math.max(1, profile.unlockedStations);
  const shell = makeElement('aside', 'screen-view map-view');
  shell.setAttribute('aria-labelledby', 'map-title');
  const head = makeElement('div', 'map-view-head');
  const home = makeElement('button', 'map-back-button');
  home.type = 'button'; home.textContent = '‹ 首頁'; home.addEventListener('click', actions.home);
  head.append(home);
  const titles = makeElement('div', 'map-heading');
  addText(titles, 'span', '森林探險地圖', 'map-kicker');
  addText(titles, 'h1', '揀一個地方出發', 'map-title');
  head.append(titles);
  shell.append(head);
  const progress = makeElement('div', 'map-progress');
  addText(progress, 'strong', `${Math.min(10, profile.unlockedStations)} / 10`, 'map-progress-number');
  addText(progress, 'span', '個地方已開放', 'map-progress-copy');
  shell.append(progress);
  const list = makeElement('div', 'station-list');
  list.setAttribute('role', 'list');
  stations.forEach((station) => {
    const available = station.id <= unlocked;
    const stars = profile.stationStars?.[station.id] ?? 0;
    const item = makeElement('button', `station-choice${available ? '' : ' is-locked'}`);
    item.type = 'button'; item.disabled = !available;
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', available ? `第 ${station.id} 關 ${station.name}` : `第 ${station.id} 關，尚未開放`);
    item.innerHTML = `<span class="station-number">${station.id}</span><span class="station-icon" aria-hidden="true">${available ? station.icon : '•'}</span><span class="station-copy"><strong>${station.name}</strong><small>${available ? `${stars}/3 ⭐ · ${station.biome}` : '完成上一關後開放'}</small></span>`;
    if (available) item.addEventListener('click', () => actions.open(station));
    list.append(item);
  });
  shell.append(list);
  host.append(shell);
  home.focus({ preventScroll: true });
  return { destroy: () => shell.remove() };
}
