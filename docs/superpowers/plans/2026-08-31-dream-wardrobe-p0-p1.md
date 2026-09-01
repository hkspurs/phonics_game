# Dream Wardrobe P0/P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make purchase/equip feedback and Runner reward handoff truthful and readable while preserving the existing Wardrobe layout, economy accounting, and safe full-sprite fallback.

**Architecture:** Keep the current ShopScene, RunnerScene, PlayerAvatarService, OutfitRegistry, and CharacterOutfitCompositor boundaries. Add only small state/feedback helpers where the existing scene already owns the behavior: ShopScene owns copy/status, RunnerScene owns reward presentation and reduced motion, and PlayerAvatarService owns pose asset resolution.

**Tech Stack:** TypeScript, Phaser 3, Vitest, Vite, Playwright.

**Spec:** `.impeccable/critique/2026-08-31T07-31-43Z__src-scenes-shopscene-ts.md`

## Global Constraints

- Do not change Currency, Inventory, DataManager purchase accounting, or wardrobe ownership semantics.
- Do not use a thumbnail as a wearing asset; missing Star Hoodie art remains unavailable and safe.
- Preserve the existing Wardrobe layout and CharacterOutfitCompositor fallback.
- Keep touch targets at least 44x44 virtual pixels and avoid flashing/high-frequency effects.
- Keep full-sprite outfit art authoritative; absent pose art falls back to run, idle, then base art.
- Formal Dino jump/pose artwork is an art dependency; code must remain safe without invented assets.

### Task 1: Truthful Wardrobe purchase state

**Files:**
- Modify: `src/scenes/ShopScene.ts:708-868, 1605-1693, 2122-2164`
- Test: `src/scenes/MetaScenes.test.ts:530-537`
- Test: `src/test/shop-wardrobe-tabs.test.ts`

**Interfaces:**
- Consumes: existing `DataManager` ownership/equipped state and `ShopScene.purchaseWardrobeItem()` auto-equip behavior.
- Produces: child-readable selected/try-on/owned/equipped copy and a success modal whose action matches the already-equipped result.

- [x] Write regression assertions that a successful purchase modal says the item is bought and worn, and does not expose an inactive `立即穿上` action.
- [x] Run the focused ShopScene tests and confirm the old copy assertion fails.
- [x] Update only the success copy/action and selected-card status semantics; keep the purchase and equip calls unchanged.
- [x] Run the focused ShopScene tests and verify purchase accounting and ownership tests remain green.

### Task 2: One readable chest reward and handoff

**Files:**
- Modify: `src/scenes/RunnerScene.ts:240-250, 2090-2272`
- Test: `src/scenes/RunnerScene.test.ts:680-704, 707-727`

**Interfaces:**
- Consumes: `onReachChest()`, `finishRunner()`, existing `CanvasButton`, HUD refresh, and chest position.
- Produces: one bounded chest-anchored reward card, explicit reward values, optional `下一題`, and an idempotent completion path.

- [x] Add failing tests for reward text/card ownership, a single transition timer, and optional continue behavior.
- [x] Run the focused RunnerScene tests and confirm the new assertions fail.
- [x] Replace the generic centered sentence with a compact chest-anchored two-line reward card; clamp its position to the viewport.
- [x] Add a single optional continue button that cancels the delayed transition and calls `finishRunner()` once; keep automatic transition as the default.
- [x] Gate chest fountain loot and reward animation under reduced motion where the existing scene needs it; do not alter awarded values.
- [x] Run the focused RunnerScene tests and verify the exact +5 coins / +1 gem accounting is unchanged.

### Task 3: Pose-aware outfit contract and responsive clearance

**Files:**
- Modify: `src/config/outfits.ts:1-10, 80-100`
- Modify: `src/services/PlayerAvatarService.ts:100-165`
- Modify: `src/scenes/RunnerScene.ts:329-359`
- Modify: `src/ui/wardrobeLayout.ts:19-78` only if the clearance test requires a bounded calculation change.
- Test: `src/test/wardrobe-preview-system.test.ts`
- Test: `src/scenes/RunnerScene.test.ts:459-512`

**Interfaces:**
- Consumes: current full-sprite definitions and `OutfitRenderer` mode resolution.
- Produces: optional `jump` asset resolution with run → idle fallback, responsive full-sprite scale bounds, and no thumbnail promotion.

- [x] Add failing tests for an optional jump asset, safe run/idle fallback, and full-sprite scale bounds at compact and standard view sizes.
- [x] Run the focused avatar/preview tests and confirm the new assertions fail.
- [x] Add `jump?: string` to outfit metadata and resolve it before run/idle fallback without changing existing asset paths.
- [x] Derive a bounded Runner full-sprite scale from the available game viewport, keeping compact landscape safe and standard landscape readable.
- [x] Run the focused avatar/preview/Runner tests and verify compositor accessories remain accessory-only for dedicated full sprites.

### Task 4: Reduced-motion and persistence verification

**Files:**
- Modify: `src/scenes/RunnerScene.ts:257-310, 1692-1699, 2007-2039, 2090-2225`
- Test: `src/scenes/RunnerScene.test.ts`
- Test: `src/test/cross-scene-avatar-sync.test.ts`

**Interfaces:**
- Consumes: browser `prefers-reduced-motion` when available, existing Runner tweens/particles, and `PlayerAvatarService` persistence resolution.
- Produces: a reduced-motion branch that retains text/HUD values, plus regression coverage for Shop → Runner → Question avatar continuity and missing-art fallback.

- [x] Add failing tests for reduced-motion particle/tween suppression and outfit ID continuity/fallback.
- [x] Run the focused tests and confirm the new assertions fail.
- [x] Add one defensive reduced-motion query and gate only non-essential looping/particle motion; do not suppress reward text or currency updates.
- [x] Verify missing wearing art falls back to base art without invoking a rectangle garment.
- [x] Run focused tests and the complete unit suite.

### Task 5: Verification and handoff

**Files:**
- Modify: `.ai/TASK_BOARD.md`
- Modify: `.ai/OWNERSHIP.md`
- Modify: `.ai/CHANGELOG.md`
- Modify: `.ai/CURRENT_STATE.md` only if the implementation changes the documented current state.
- Modify: `.ai/TESTING.md` only if a new repeatable verification command is added.

- [x] Run `npm run test:unit` and record the exact pass count.
- [x] Run `npm run build` and record the exit status.
- [x] Run a bounded Playwright/browser pass at desktop and mobile-landscape viewports; capture evidence for no runtime errors, no overflow, and readable reward handoff.
- [x] Re-read this plan and check P0/P1 requirements against tests and runtime evidence.
- [x] Update TASK-20260831-014 with the verification summary; keep the active
  ownership rows while the explicit artwork and device-evidence gates remain
  open.
