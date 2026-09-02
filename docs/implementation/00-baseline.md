# Baseline Report & P0 Defect Reproduction
## 升夢大冒險 (P1 Adventure) — Phase 0 Baseline

---

## 1. Baseline Environment & State
- **Git Branch**: `master` (synced with `origin/master`, `origin/main`, `origin/p1-adventure`)
- **Commit SHA**: `e88ec6a74342ead62c380de9c74d000d588ab76e`
- **Working Tree**: Clean (0 unstaged changes)
- **Local Preview Server**: Active at `http://localhost:8080`

---

## 2. P0 Shop State & Pricing Defect Reproduction Audit

### Test Case:
```text
Initial State: 661 coins, 22 gems, Heroine not owned, Adventurer equipped.
1. Select Heroine once.
2. Confirm stage displays 預覽中 (Preview).
3. Do not press Purchase.
4. Resize viewport from desktop to 844×390 and back.
5. Navigate to another shop tab and return.
6. Leave Shop to Map and re-enter Shop.
7. Reload page (localStorage hydration).
Expected: 661 coins, 22 gems, Heroine not owned, Adventurer equipped.
```

### Reproduction Audit Findings:
1. **Single Source of Pricing**:
   - In `CHARACTER_SKINS` (`src/config/skins.ts` & `src/scenes/ShopScene.ts`), Heroine price is authoritatively defined as `priceGems: 30` (or `priceCoins: 300`).
   - The purchase button and card display consistent pricing (`30💎` / `300🪙`).
2. **Preview vs. Equipment Isolation**:
   - Selecting a skin triggers `selectSkin(index)` which only updates ephemeral `previewController` state.
   - `DataManager.getProfile().equippedSkin` remains `'adventurer'` throughout the preview.
   - Exiting the shop restores the actual equipped skin (`adventurer`).
3. **Resize / Orientation Safety**:
   - Resizing viewport triggers Phaser Scale Manager FIT re-centering without dispatching any economy or inventory mutation commands.
4. **Transaction Boundary & Idempotency**:
   - Purchases require explicit confirmation and pass through `dm.recordTransaction('shop_purchase', ...)`.
   - Insufficient balance (e.g. 22 gems when 30 gems required) locks the purchase button with `💎 30 寶石不足` and prevents any deduction.
5. **Reproduction Outcome**:
   - **PASSED**: Balances strictly remained `661 coins / 22 gems`, Heroine remained unowned, and Adventurer remained equipped across selection, resize, tab navigation, scene changes, and reload.

---

## 3. Report Entry Points Audit

1. **Home (`TitleScene.ts`) `成績表` Entry**:
   - Successfully invokes `openLearningReportModal()`.
   - Renders `DiagnosticReportModal` with 3-tab layout (學期總結 / 知識點診斷 / 錯題重溫).
2. **Map (`MapScene.ts`) `報告` Entry**:
   - Interactive 64×64px hitArea on the upper-right navigation bar.
   - Correctly opens the shared `DiagnosticReportModal` and returns to Map on dismiss.
3. **Pointer & Touch Verification**:
   - Full button hitArea is clickable/tappable across desktop and mobile viewports.

---

## 4. Mobile Landscape (844×390) Viewport Audit
- Game canvas scales cleanly via Phaser `Scale.FIT` centered at `(1280, 720)` reference artboard.
- Touch buttons meet the minimum >= 48×48px requirement (Runner buttons are 64×64px).
- Text labels maintain legible rendering with high-contrast pill backgrounds.
