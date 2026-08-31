# Visual Polish Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Wardrobe preview truthful and readable on mobile by gating missing Star Hoodie art, preserving the full-sprite/layered/composite fallback chain, and tightening low-stimulation preview and catalog feedback.

**Architecture:** Keep `ShopScene` as the existing orchestration surface and keep `CharacterOutfitCompositor` as the safe dynamic fallback. Add one metadata truth flag to `OutfitDefinition`, let `OutfitRegistry` expose readiness, and let the shop disable only unavailable wardrobe purchases. Improve the current compact layout in place; do not replace the shop, currency, inventory, or purchase services.

**Tech Stack:** TypeScript, Phaser 3, Vitest, Vite, Playwright.

**Spec:** User-approved PM Visual Polish Top 10 review from 2026-08-31, with priority on Star Hoodie asset truth, compact Wardrobe readability, preview motion budget, and safe fallbacks.

## Global Constraints

- Preserve the existing 40% catalogue / 60% preview Wardrobe composition.
- Never pass a product thumbnail to the wearing renderer.
- Missing wearing art must fall back without throwing or drawing a rectangular garment.
- Do not modify `DataManager`, currency rules, inventory persistence, or purchase deduction logic.
- Keep touch targets at or above the repository's 44×44 virtual-pixel convention.
- Keep dedicated full-body art at the existing 512×512 registration and baseline standard.
- Do not create raster artwork in code; record missing Star Hoodie art in the existing generated placeholder.

### Task 1: Asset truth gate and loader safety

**Files:**
- Modify: `src/config/outfits.ts`
- Modify: `src/ui/OutfitRegistry.ts`
- Modify: `src/scenes/PreloadScene.ts`
- Modify: `src/scenes/ShopScene.ts`
- Test: `src/test/wardrobe-preview-system.test.ts`
- Test: `src/scenes/scenes.test.ts`

**Interfaces:**
- `OutfitDefinition.artworkStatus?: 'ready' | 'placeholder'` marks whether formal wearing art is deliverable.
- `OutfitRegistry.isWearingArtworkReady(id: string): boolean` returns false only for an explicitly marked placeholder definition; unknown/modular items remain eligible for the compositor fallback.

- [x] **Step 1: Write the failing tests**

```ts
it('marks Star Hoodie as unavailable until formal wearing artwork is delivered', () => {
  expect(wardrobeRegistry.isWearingArtworkReady('hoodie_star')).toBe(false);
  expect(wardrobeRegistry.isWearingArtworkReady('scholar_robe')).toBe(true);
});

it('does not enqueue missing Star Hoodie placeholder paths', () => {
  const preloadScene = new PreloadScene();
  const mock = createMockSceneForTest('PreloadScene');
  Object.assign(preloadScene, mock);

  preloadScene.preload();

  const paths = mock.load.image.mock.calls.map((call: any[]) => call[0]);
  expect(paths).not.toContain('assets/character/outfits/star_hoodie/star_hoodie_wearing.png');
  expect(paths).not.toContain('assets/outfits/star_hoodie/star_hoodie_thumbnail.png');
});
```

- [x] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run src/test/wardrobe-preview-system.test.ts src/scenes/scenes.test.ts`

Expected: FAIL because the readiness API and placeholder-aware loader do not exist.

- [x] **Step 3: Add the minimum metadata and gate**

Add `artworkStatus: 'placeholder'` to `star_hoodie`, expose the one registry method, and skip all assets for explicitly placeholder definitions in `loadWardrobeAssets()`. Remove the old synthetic `dress_or_outfit.png` generation for full-sprite definitions so only explicit layered assets are loaded. In the wardrobe preview update path, show `🎨 美術準備中`, disable only unavailable non-equipped wardrobe actions, and add a direct handler guard so a stale click cannot purchase or equip unavailable art.

- [x] **Step 4: Run the focused tests and verify GREEN**

Run: `npx vitest run src/test/wardrobe-preview-system.test.ts src/scenes/scenes.test.ts`

Expected: PASS, with existing full-sprite, layered, composite, and purchase tests unchanged.

### Task 2: Compact catalogue readability and selected feedback

**Files:**
- Modify: `src/scenes/ShopScene.ts`
- Test: `src/test/shop-wardrobe-tabs.test.ts`

**Interfaces:**
- `getWardrobeLayout()` remains the single responsive geometry function.
- Existing `ShopScene.playWardrobeSelectionFeedback()` remains the selection entry point and uses a 120–160ms scale response.

- [x] **Step 1: Write the failing tests**

```ts
it('uses one readable compact catalogue column', () => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 844 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });
  scene.create();
  scene.switchTab('wardrobe');
  const xPositions = new Set(scene.wardrobeItemButtons.map(button => button.x));
  expect(xPositions.size).toBe(1);
});

it('uses the approved 120–160ms selected-card feedback', () => {
  scene.create();
  scene.switchTab('wardrobe');
  mock.tweens.add.mockClear();
  scene.playWardrobeSelectionFeedback();

  const feedbackTween = mock.tweens.add.mock.calls.at(-1)?.[0];
  expect(feedbackTween.duration).toBeGreaterThanOrEqual(120);
  expect(feedbackTween.duration).toBeLessThanOrEqual(160);
});
```

- [x] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run src/test/wardrobe-preview-system.test.ts src/test/shop-wardrobe-tabs.test.ts`

Expected: FAIL because the current compact catalogue still uses two columns and the feedback duration is 70ms.

- [x] **Step 3: Make the smallest visual adjustment**

Use one compact column, keep the existing pager for the all/owned catalogue, increase compact thumbnail/name/status sizing without adding a new component, and change only the selection tween to a restrained 140ms response. Keep the desktop path and action/purchase flow intact.

- [x] **Step 4: Run tests and verify GREEN**

Run: `npx vitest run src/test/wardrobe-preview-system.test.ts src/test/shop-wardrobe-tabs.test.ts`

Expected: PASS, including existing responsive bounds and purchase/equip tests.

### Task 3: Preview motion and celebration budget

**Files:**
- Modify: `src/ui/CharacterPreviewController.ts`
- Modify: `src/scenes/ResultScene.ts`
- Test: `src/test/wardrobe-preview-system.test.ts`
- Test: `src/scenes/MetaScenes.test.ts`

**Interfaces:**
- Existing `CharacterPreviewController.playTryOn()` and `playCheer()` keep their public signatures.
- Result confetti remains one-shot and self-cleans after its fall.

- [x] **Step 1: Write the failing tests**

The regression test creates separate `idleTween` and `actionTween` mocks,
routing the existing preview scene mock by `config.repeat === -1`, then calls
`playTryOn()` and `playCheer()` and asserts `idleTween.pause()` was called. A
second test invokes `ResultScene.spawnConfettiParticles()` and asserts every
recorded tween has `repeat !== -1`.

- [x] **Step 2: Run the focused tests and verify RED**

Run: `npx vitest run src/test/wardrobe-preview-system.test.ts src/scenes/MetaScenes.test.ts`

Expected: FAIL because idle motion is not paused and Result confetti currently uses `repeat: -1`.

- [x] **Step 3: Implement the finite motion changes**

Pause/resume the existing idle tween around try-on and cheer, call `renderer.clearCache()` during controller destruction, and make each Result confetti tween one-shot with a guarded completion cleanup. Do not add a new animation controller.

- [x] **Step 4: Run focused tests, then full verification**

Run: `npm run test:unit` and `npm run build`.

Expected: all unit tests pass and the production build completes without TypeScript errors.

### Task 4: Visual verification and handoff

**Files:**
- Existing before: `/tmp/p1-star-hoodie-mobile-844x390.png`.
- Create: `/tmp/p1-star-hoodie-phase2a-after-mobile.png` and `/tmp/p1-star-hoodie-phase2a-after-desktop.png` as local verification artifacts only.
- Modify: `.ai/TASK_BOARD.md`
- Modify: `.ai/OWNERSHIP.md`
- Modify: `.ai/CHANGELOG.md`
- Modify: `.ai/CURRENT_STATE.md` only if the final implementation changes the meaningful project state.

- [x] **Step 1: Build and serve the production bundle**

Run: `npm run build`, then serve `dist/` locally for Playwright visual capture.

- [x] **Step 2: Capture the same Wardrobe route before and after**

Capture at `1920×1080` and `844×390`; verify the preview is prominent, Star Hoodie has no rectangular wearing image, and compact item labels are readable.

- [x] **Step 3: Run the mechanical UI detector once**

Run: `node /root/.codex/skills/impeccable/scripts/detect.mjs --json docs/index.html`

Record any detector finding without changing unrelated documentation or scenes.

- [x] **Step 4: Update coordination state and release ownership**

Mark `TASK-20260831-002` complete, add the exact files and test commands to `.ai/CHANGELOG.md`, update `.ai/CURRENT_STATE.md` for the Star Hoodie placeholder gate if applicable, and remove all task rows from `.ai/OWNERSHIP.md`.

## Explicitly deferred to the next Codex task

- New transparent Star Hoodie `star_hoodie_thumbnail.png`, `star_hoodie_wearing.png`, `star_hoodie_run.png`, and `star_hoodie_cheer.png` artwork.
- Runner-wide outfit-aware jump/walk/cheer routing and distinct pose artwork delivery.
- Map/Runner terrain contrast and station identity pass.
- Currency/HUD semantic unification across every scene.

These remain tracked as review findings; this plan does not fabricate art or expand into a Shop rewrite.
