export const createEncouragementSlice = (set, get) => ({
  encouragements: [],

  sendEncouragement: ({ message, rewardType }) => set((state) => {
    const newEncouragement = {
      id: crypto.randomUUID(),
      message,
      rewardType, // 'sticker' or 'star'
      createdAt: Date.now(),
      claimedAt: null
    };
    return {
      encouragements: [...state.encouragements, newEncouragement]
    };
  }),

  claimEncouragement: (id) => set((state) => {
    const encouragements = state.encouragements.map(enc => 
      enc.id === id ? { ...enc, claimedAt: Date.now() } : enc
    );
    return { encouragements };
  })
});
