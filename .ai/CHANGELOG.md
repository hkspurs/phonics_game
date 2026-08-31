# AI Coordination Changelog

## 2026-08-31 — Codex — TASK-20260831-005

Summary:
Synchronized the tracked GitHub Pages `master/docs` artifact after confirming that the public site was serving that source rather than the separately published `gh-pages` branch.

Changed:
- Updated `docs/index.html` to reference the current production bundle.
- Added the current production bundle and source map under `docs/assets/`.
- Documented the Pages source mismatch and verification in shared project state.

Verification:
- `npm run build` passed.
- Synced artifact displays `ver 1.1.0 (202608311450)`.
- Live response was reproduced before the sync as `ver 1.1.0 (202608311146)`.

Follow-up:
- Repository Pages settings should eventually use the same source as the deployment workflow (`gh-pages`), or the workflow should keep `master/docs` synchronized.

## 2026-08-31 — Codex — TASK-20260831-004

Summary:
Added outfit-aware Runner pose routing without changing Wardrobe layout or economy behavior.

Changed:
- Added one `RunnerScene.applyRunnerPose()` gateway for idle, run, jump, and cheer texture changes.
- `PlayerAvatarService` now skips placeholder outfit artwork and checks pose candidates with safe run/idle fallback.
- Dedicated full-sprite outfits remain visible through Runner poses; the existing compositor receives only modular accessories in that mode.
- Placeholder Star Hoodie garments fall back to the base character instead of drawing the legacy orange rectangle.
- Kept Runner squash/landing feedback proportional to the active base/full-sprite scale.
- Added Runner and cross-scene regression coverage for full outfit poses, placeholder safety, accessory-only compositing, and missing pose fallback.

Verification:
- Focused Runner/avatar suite — 2 files, 75 tests passing
- `npm run test:unit` — 43 test files, 1,158 tests passing
- `npm run build` — TypeScript and Vite build passed

Pending:
- Formal transparent Star Hoodie artwork remains required.
- Distinct outfit jump artwork can replace the intentional run/idle fallback when art is delivered.

## 2026-08-31 — Codex — TASK-20260831-003

Summary:
Closed the pre-delivery review findings for Phase 2A preview motion.

Changed:
- `CharacterPreviewController` now cancels an active cheer tween before try-on and an active try-on tween before cheer, preventing overlapping pose/position animations during rapid switching.
- Added regression coverage for action-tween cancellation and Result confetti destruction/removal after its one-shot completion.

Verification:
- Focused preview/meta suite (2 files, 66 tests passing)
- `npm run test:unit` (43 test files, 1,152 tests passing)
- `npm run build` (TypeScript and Vite build passed)

Pending:
- Formal transparent Star Hoodie artwork remains the only blocker for a truthful Star Hoodie wearing preview.

## 2026-08-31 — Codex — TASK-20260831-002

Summary:
Completed the first low-risk Visual Polish Phase 2 slice without rewriting the Wardrobe layout or touching Currency, Inventory, or purchase semantics.

Changed:
- Added explicit Star Hoodie placeholder artwork status and safe preload/readiness gating.
- Removed synthetic full-sprite layer paths; layered rendering now requires explicit layer metadata.
- Kept the thumbnail separate from the missing wearing asset and prevented unavailable Star Hoodie purchase/equip actions.
- Improved compact catalogue readability and extended selected-card feedback to 140ms.
- Paused preview idle motion during try-on/cheer, cleared renderer cache on controller teardown, and made Result confetti one-shot.
- Updated architecture/current-state/testing records and added the implementation plan.

Verification:
- `npm run test:unit` (43 test files, 1,139 tests passing)
- `npm run build` (TypeScript and Vite build passed)
- Playwright production smoke check (no Wardrobe asset 404 responses)
- Impeccable detector ran; it reported one pre-existing cubic-bezier warning in `docs/index.html` while using its degraded regex fallback.

Pending:
- Deliver formal transparent Star Hoodie artwork: `star_hoodie_thumbnail.png`, `star_hoodie_wearing.png`, `star_hoodie_run.png`, and `star_hoodie_cheer.png`.
- Continue with the remaining approved Visual Polish tasks in a separate Codex task.

## 2026-08-31 — Antigravity — TASK-20260831-001

Summary:
Initialized the shared AI development coordination system (`.ai/`, `AGENTS.md`, `GEMINI.md`) to establish an automated central brain for Google Antigravity and OpenAI Codex.

Changed:
- `AGENTS.md`
- `GEMINI.md`
- `.ai/CURRENT_STATE.md`
- `.ai/TASK_BOARD.md`
- `.ai/OWNERSHIP.md`
- `.ai/CHANGELOG.md`
- `.ai/ARCHITECTURE.md`
- `.ai/CONVENTIONS.md`
- `.ai/TESTING.md`
- `.ai/decisions/001-character-rendering.md`
- `.ai/decisions/002-wardrobe-assets.md`

Verification:
- `npm run test:unit` (43 test files, 1,120 tests passing)
- `npm run build` (Clean build with 0 TypeScript errors)

Pending:
- None for control plane setup.
