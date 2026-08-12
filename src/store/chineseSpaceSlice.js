import { canRedeemChineseSpaceBadge, getChineseSpaceBadge } from '../game/chineseSpaceGame';

export const CHINESE_SPACE_DEFAULTS = {
  spaceGems: 0,
  ownedBadgeIds: [],
  tutorialComplete: false,
};

export const createChineseSpaceSlice = (set, get) => ({
  chineseSpace: { ...CHINESE_SPACE_DEFAULTS },

  addChineseSpaceGems: (amount) => set((state) => ({
    chineseSpace: { ...state.chineseSpace, spaceGems: state.chineseSpace.spaceGems + amount },
  })),

  markChineseSpaceTutorialComplete: () => set((state) => ({
    chineseSpace: { ...state.chineseSpace, tutorialComplete: true },
  })),

  redeemChineseSpaceBadge: (badgeId) => {
    const { chineseSpace } = get();
    if (!canRedeemChineseSpaceBadge(badgeId, chineseSpace.spaceGems, chineseSpace.ownedBadgeIds)) return false;

    const badge = getChineseSpaceBadge(badgeId);
    set({
      chineseSpace: {
        ...chineseSpace,
        spaceGems: chineseSpace.spaceGems - badge.price,
        ownedBadgeIds: [...chineseSpace.ownedBadgeIds, badgeId],
      },
    });
    return true;
  },
});
