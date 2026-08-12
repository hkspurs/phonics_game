import { beforeEach, describe, expect, it } from 'vitest';
import { CHINESE_SPACE_DEFAULTS } from './chineseSpaceSlice';

describe('chineseSpaceSlice', () => {
  let useGameStore;

  beforeEach(async () => {
    localStorage.clear();
    const mod = await import('./gameStore.js');
    useGameStore = mod.useGameStore;
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('starts with independent space progress defaults', () => {
    const state = useGameStore.getState();
    expect(state.chineseSpace).toEqual(CHINESE_SPACE_DEFAULTS);
    expect(state.gems).toBe(12);
  });

  it('adds the five-gem completion reward without changing top-level gems', () => {
    useGameStore.getState().addChineseSpaceGems(5);
    expect(useGameStore.getState().chineseSpace.spaceGems).toBe(5);
    expect(useGameStore.getState().gems).toBe(12);
  });

  it('redeems an affordable badge once', () => {
    useGameStore.getState().addChineseSpaceGems(5);
    expect(useGameStore.getState().redeemChineseSpaceBadge('school-common')).toBe(true);
    expect(useGameStore.getState().chineseSpace).toEqual({
      spaceGems: 0,
      ownedBadgeIds: ['school-common'],
      tutorialComplete: false,
    });
  });

  it('leaves state unchanged when a badge is unaffordable or already owned', () => {
    const before = useGameStore.getState().chineseSpace;
    expect(useGameStore.getState().redeemChineseSpaceBadge('school-common')).toBe(false);
    expect(useGameStore.getState().chineseSpace).toEqual(before);

    useGameStore.getState().addChineseSpaceGems(5);
    useGameStore.getState().redeemChineseSpaceBadge('school-common');
    const owned = useGameStore.getState().chineseSpace;
    expect(useGameStore.getState().redeemChineseSpaceBadge('school-common')).toBe(false);
    expect(useGameStore.getState().chineseSpace).toEqual(owned);
  });

  it('persists only Chinese space progress across a store reload', async () => {
    useGameStore.getState().addChineseSpaceGems(20);
    useGameStore.getState().markChineseSpaceTutorialComplete();
    useGameStore.getState().redeemChineseSpaceBadge('school-rare');
    const persisted = localStorage.getItem('phonics-game-storage');

    useGameStore.setState(useGameStore.getInitialState());
    localStorage.setItem('phonics-game-storage', persisted);
    await useGameStore.persist.rehydrate();

    expect(useGameStore.getState().chineseSpace).toEqual({
      spaceGems: 5,
      ownedBadgeIds: ['school-rare'],
      tutorialComplete: true,
    });
  });

  it('migrates legacy persisted state without the new slice to defaults', () => {
    const migrated = useGameStore.persist.getOptions().migrate({ gems: 99 }, 6);
    expect(migrated.chineseSpace).toEqual(CHINESE_SPACE_DEFAULTS);
    expect(migrated.gems).toBe(99);
  });

  it('resetProgress clears Chinese space progress', () => {
    useGameStore.getState().addChineseSpaceGems(20);
    useGameStore.getState().markChineseSpaceTutorialComplete();
    useGameStore.getState().redeemChineseSpaceBadge('school-rare');

    useGameStore.getState().resetProgress();
    expect(useGameStore.getState().chineseSpace).toEqual(CHINESE_SPACE_DEFAULTS);
  });
});
