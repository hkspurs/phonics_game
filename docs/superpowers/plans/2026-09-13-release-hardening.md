# Phonics release hardening implementation plan

> For agentic workers: use superpowers:executing-plans to implement this plan task-by-task. Use Luna with maximum reasoning if the execution environment supports it. Do not claim to have switched models without confirmation from that environment. Sequential execution is the default; delegation is not required.

**Goal:** Close the outstanding test, deployment verification, typography, browser compatibility, performance and learning-history issues without losing player progress.

**Architecture:** Keep Phaser as the scene/gameplay engine and the existing DOM presentation layer as the interactive owner where mounted. Separate local browser regression, visual regression and deployed-site smoke checks. Extend saved learning data additively and preserve legacy records.

**Tech stack:** TypeScript, Phaser, Vite, Vitest, Playwright, Web Speech/Web Audio, GitHub Actions and Pages.

**Spec:** The user's 13-item outstanding-issue list in this conversation, reconciled below with the successful deployment already recorded in this conversation. Existing repository conventions and `.ai/` records apply.

## 1. Baseline and corrections

This is a proposed execution plan, not a report of fixes performed. All task checkboxes start open. Before implementing, verify remote state again because the local checkout can predate the merge.

Recorded source review commit: `72422f65ecddf8cdb283956982a9f1c25c4fc5ae`.
Recorded merge to `p1-adventure`: `2656552e96630316fa0d675213877a0d340f7ddb`.
PR #1 was merged. Workflow `34733872050` succeeded; generated `gh-pages` commit `683ef7165a938097a695dda93eb7c2ccb305b696` references that source merge.

Therefore original item 13's draft/unmerged claim is obsolete. Item 2's branch publication portion is complete, but successful publication to `gh-pages` does not independently prove the public URL serves that build. Item 3 still needs PR-triggered checks for future work; the merged commit already has deployment workflow evidence.

Recorded tests: 63 unit files / 1,940 passing tests, production build success, 5 release browser tests and 3 compatible regression tests passing. The historical full browser run was 57 passed / 33 failed. Reproduce that run before assigning causes: do not assume every failure is obsolete or harmless.

Priority corrections: failing automation and absent PR checks are high-priority engineering gaps, not automatically P0 player outages. Use P0 only for reproduced crashes, inaccessible core flow, lost saves, incorrect answers or corrupt rewards. Physical-device and screen-reader evidence must remain explicitly pending until actually collected.

## 2. Global constraints

- Preserve `p1_adventure_save_v1`, existing balances, inventory, equipment, completed stations and reward ledger transaction IDs.
- Do not reset browser saves, rewrite history or deploy a destructive migration.
- Keep current routes, scene navigation, explicit Continue pacing and learning feedback.
- DOM controls remain the sole interactive owner while their view is mounted. Do not restore hidden canvas clicks just to satisfy obsolete tests.
- Runner and Shop still contain genuine canvas controls. Test their actual coordinate mapping or existing controls; do not force a whole renderer migration.
- Keep 48px-class touch controls and readable text; solve crowding with layout/scrolling instead of shrinking all controls.
- No blanket test skips, increased timeouts, swallowed errors or snapshot updates merely to obtain green results.
- No paid device service, new account, external speech provider or unapproved asset licensing commitment.
- No model quota percentage or future reset time may be invented. Record a resumable checkpoint if execution becomes unavailable.
- This request prepares the plan only. At execution time create a new review branch from the current `p1-adventure`; do not reopen or overwrite the merged PR branch.

## 3. Execution order and checkpoints

Use this order: A baseline → B browser suite migration → C PR CI and deployed smoke → D fonts/visual/a11y → E speech → F learning history → G performance → H mock cleanup → I release acceptance.

Each task has one reviewable deliverable and a scoped commit. Read `AGENTS.md`, `.ai/CURRENT_STATE.md`, `TASK_BOARD.md`, `OWNERSHIP.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `TESTING.md` and recent `CHANGELOG.md` before source edits. Register the active task and ownership, and release only your own locks when done.

At each checkpoint record source SHA, command, exit code, totals, artifacts, remaining failures and next command. Distinguish IMPLEMENTED, AUTOMATED_VERIFIED, MANUAL_PENDING and BLOCKED. A lack of a physical device does not prevent unrelated implementation, but prevents marking its acceptance row passed.

## Task A — Establish the exact baseline and failure inventory

**Files:** Create `docs/qa/release-hardening/failure-inventory.md` and `docs/qa/release-hardening/checkpoint.md`. Read `package.json`, `playwright.config.ts`, `vite.config.ts`, `.github/workflows/deploy.yml` and all coordination files. No gameplay edits.

- [ ] Check git status/log, fetch remote state using available authorized GitHub access, and compare current `p1-adventure` with the recorded merge. Preserve unrelated work.
- [ ] Create an isolated worktree/branch `codex/p1-release-hardening` from the current base. If that name exists, inspect it before reuse.
- [ ] Run `npm ci`, `npm run test:unit`, `npm run build`, then `npm run test:e2e -- --reporter=list,json` with JSON output saved as an artifact. Use the repository's lockfile; do not mask installation failures with an automatic dependency upgrade.
- [ ] Confirm the preview serves the newly built directory. Set CI mode or otherwise avoid accidentally reusing a stale development server.
- [ ] For each failed test record spec, test title, error, trace/screenshot, current DOM/canvas owner, isolated rerun result and category: product defect / stale assertion / fixture isolation / external transport / nondeterministic timing / unresolved.
- [ ] Record all current skipped tests and test counts so later removals are visible.
- [ ] Inspect `src/test/setup.ts` and `vitest.config.ts` before calling the harness JSDOM: historical documentation may describe it inaccurately.
- [ ] Commit the inventory and checkpoint, including unchanged baseline failures.

**Acceptance:** Every failure from the fresh full run has evidence and an owner/category. There is no invented promise that the count will remain 33.

## Task B — Migrate browser tests while preserving their intent

**Files:** Modify affected `e2e/*.spec.ts` selected by Task A, `playwright.config.ts`; create `e2e/helpers/learning-flow.ts` and `e2e/helpers/canvas-controls.ts` only if multiple specs share them. Preserve existing `phase8-9-full-journey.spec.ts`, `phase8-support-destinations.spec.ts`, and `phase9-viewport-accessibility.spec.ts` as regression coverage.

**Interface:** Shared helpers accept Playwright `Page`, return `Promise<void>` and assert the destination screen before returning. They may read application state to choose a deterministic answer but must submit using the visible control.

```ts
import { expect, type Page } from '@playwright/test';
export async function openFirstStation(page: Page): Promise<void> {
  await page.getByRole('button', { name: '開始冒險', exact: true }).click();
  await expect(page.locator('.map-view')).toBeVisible();
  await page.getByRole('button', { name: /第 1 關/ }).click();
  await expect(page.locator('.station-detail-view')).toBeVisible();
  await page.getByRole('button', { name: '開始這一關', exact: true }).click();
  await expect(page.locator('.question-view')).toBeVisible();
}
```

- [ ] Choose one failing DOM-migrated spec; run it alone and keep the failing trace.
- [ ] Replace canvas coordinate navigation with the actual accessible control, as above. Scope repeated button labels to their active view/dialog.
- [ ] Replace fixed sleeps with observable state: visible feedback, enabled Continue, dialog appearance or destination view. Do not rely on animation duration as the assertion.
- [ ] Preserve duplicate-token multiplicity using exact matching and selecting the first remaining matching bank token. Verify tap-to-return and final answer independently.
- [ ] For Runner/Shop, transform world coordinates through the actual canvas bounding rectangle and current logical dimensions. Cover corners/edges where the original test intended hit-area checks.
- [ ] Preserve assertions for answer correctness, reward idempotency, purchase atomicity, saved progress and restoration. A navigation-only test is not a replacement for an economy test.
- [ ] Seed each test's own browser context before navigation; avoid shared localStorage and random fixture dependence. Do not mutate production data or introduce a production answer-bypass API.
- [ ] Rerun each migrated spec individually, then the related group. For a suspected flaky race, reproduce with `--repeat-each=3`; stop repetition once the concrete race is resolved.
- [ ] If retiring a test, document the old test → replacement test mapping and which assertions survive. Never retire an unresolved product defect.
- [ ] Run the entire local collection after migration and commit with the inventory updated.

**Acceptance:** Local regression has no unexplained failures or newly hidden skips; all removed assertions have a coverage mapping. Live tests are separated in Task C rather than silently excluded without a runnable replacement.

## Task C — Add PR checks and verify deployed build identity

**Files:** Create `.github/workflows/ci.yml`, `playwright.live.config.ts`, `e2e/live/deployed-smoke.spec.ts`; modify `package.json`, local Playwright exclusions, and deployment integration only after checking actual Pages configuration. Add build identity generation in `vite.config.ts`.

**Proposed commands:** `test:e2e` remains the full local collection; `test:e2e:live` runs `playwright test --config=playwright.live.config.ts`. Live config consumes `LIVE_BASE_URL`, has no local `webServer`, and only collects `e2e/live/`.

- [ ] Add `pull_request` checks targeting `p1-adventure`, plus manual dispatch. Give CI `contents: read`; never deploy untrusted PR code.
- [ ] In CI install the lockfile, run unit tests/build, install the required Playwright browser/dependencies and run local E2E. Upload reports and traces with `if: always()` and bounded artifact retention.
- [ ] Keep PR verification separate from the existing deployment trigger. Verify actual GitHub check-runs/workflow runs; combined commit statuses alone do not enumerate all Actions checks.
- [ ] Emit `build-info.json` in the Vite build using `GITHUB_SHA` in Actions. Example plugin body: `generateBundle() { this.emitFile({ type: 'asset', fileName: 'build-info.json', source: JSON.stringify({ sourceSha: process.env.GITHUB_SHA ?? 'local' }) }); }`. Do not embed secrets or all environment variables.
- [ ] Live smoke fetches that file and compares `sourceSha` with the expected deployed source SHA before browser interaction. Poll with a finite deployment-propagation deadline; report last observed SHA/status on expiry.
- [ ] Check the real Pages serving source. A successful push to `gh-pages` is not proof the site is configured to serve it. If configuration requires unavailable administration access, report exactly that boundary.
- [ ] Verify Home → Map → station → answer/Continue, reload persistence, asset HTTP responses and absence of fatal page errors on the actual URL. Use a fresh isolated browser context.
- [ ] Only test deep links that the application actually supports; do not create routes merely to satisfy a generic checklist.
- [ ] Document public-site smoke as FAILED, PASSED or ENVIRONMENT_BLOCKED. Network denial is not an application failure and is never a pass.
- [ ] Commit CI/smoke changes and attach a successful PR-triggered run to the new PR once pushed.

**Acceptance:** New PR head has visible unit/build/browser checks; local E2E is independent of the public host; deployed smoke proves source identity and actual interaction. Keep Pages publication success and public smoke success as separate fields.

## Task D — Reproducible fonts, visual evidence and accessibility

**Files:** Modify `index.html`, `src/presentation/` styles/views only where reproduction proves a problem. Create `e2e/visual-release.spec.ts`, `e2e/accessibility-release.spec.ts`, and `docs/qa/release-hardening/device-matrix.md`. Read existing design tokens and canvas typography before changes.

- [ ] First install a known Traditional Chinese font in the QA environment and record font package/version. Wait for `document.fonts.ready` before screenshots; inspect actual glyphs. Font loading promises alone do not prove glyph coverage.
- [ ] Keep system fonts in production initially. Only propose bundling after testing establishes a real production need; record font license, attribution, subset coverage and added transfer bytes.
- [ ] Capture Home, Map, station detail, choice question, sentence scramble, Result, Shop, Settings, Trophy and Report across the seven existing viewport sizes. Reuse deterministic fixtures and suppress only nondeterministic decorative animation.
- [ ] Include empty/full reports, long Chinese prompts, mixed English/numbers/punctuation, repeated tokens, expensive/owned/equipped shop states and open reset confirmation.
- [ ] Check document overflow, clipped text, visible primary action, scroll endpoint and focus visibility. When clipping reproduces, fix the owning container with appropriate wrapping, min-width or scroll layout; do not globally shrink typography.
- [ ] Review character outfit scale, wings behind torso, Runner airborne/landing shadow and OOTD composition separately. Animation claims require frame sequence or video evidence, not a single screenshot.
- [ ] Add keyboard traversal tests using actual Tab/Shift+Tab/Enter/Escape. Verify dialog containment, focus return and no hidden duplicate controls in the accessible tree.
- [ ] Test forced colors and reduced motion using browser emulation. Test actual browser/text zoom at 200%; a smaller viewport is not an equivalent zoom test.
- [ ] Physically verify iPhone Safari and iPad Safari: portrait/landscape, browser chrome expansion, touch cancellation, rapid taps, simultaneous Runner controls and scroll boundaries. Record device, OS/browser version, orientation and evidence path.
- [ ] Use VoiceOver/TalkBack or NVDA for announcement order and wrong-answer/hint/correct feedback. Record unavailable devices as MANUAL_PENDING and proceed with other tasks.
- [ ] Update visual baselines only after inspecting differences. Commit confirmed fixes and evidence index; store large images/video as CI artifacts rather than bloating git history.

**Acceptance:** Automated rows pass with intended glyphs; every manual row has a real result or explicit pending status. The unchecked historical checklist is reconciled with evidence, not bulk-ticked.

## Task E — Speech and audio lifecycle

**Files:** `src/services/SpeechService.ts`, `SoundManager.ts`, their tests, `src/presentation/SettingsView.ts`, relevant scene lifecycle callers, and a browser speech fixture spec.

Observed implementation facts to investigate: Cantonese selection currently permits Mandarin fallback; `unlockAudio()` sets `unlocked` even in a catch; cached voices only update when a nonempty list is returned. These are investigation targets, not automatically verified player defects.

- [ ] Add focused tests for empty voices, late `voiceschanged`, removal of voices, thrown synthesis calls, rapid requests and scene shutdown while a request is pending.
- [ ] Define UI status separately from successful audible playback: requesting `speak()` does not prove sound was heard. Do not show a successful-unlock state after an exception.
- [ ] Normalize voice language matching. Prefer Cantonese voices for Cantonese; if unavailable, visibly explain the fallback. Proposed child-facing copy: `呢部裝置暫時未有廣東話朗讀，可以先睇文字。` Do not silently label Mandarin pronunciation Cantonese. Make any Mandarin substitution explicit in settings.
- [ ] Use cancellation/generation ownership for queued utterances so callbacks belonging to the previous question cannot update the current screen. Keep repeated tap policy consistent: latest requested utterance wins.
- [ ] Ensure scene shutdown cancels owned speech and listeners are removed. Verify muted settings against both TTS and SFX according to the actual settings contract.
- [ ] Handle AudioContext resume failure separately from speech synthesis availability; neither API proves the other is unlocked.
- [ ] Run speech/sound unit suites and browser event tests. Then listen on actual Safari/Chrome devices for Cantonese and English pronunciation, cancellation and volume behavior.
- [ ] Commit fixes with a table distinguishing mocked event coverage from audible device coverage.

**Acceptance:** No crashes/stale callbacks, fallback is truthful, and supported-device listening evidence is recorded. No promise of phoneme-level pronunciation quality based solely on generic TTS call tests.

## Task F — Exact replay provenance and explicit session identity

**Files:** `src/types/index.ts`, `src/services/DataManager.ts`, `src/engine/QuestionEngine.ts`, `src/scenes/QuestionScene.ts`, `src/presentation/DiagnosticReportView.ts`, `src/test/diagnostic-learning-report.test.ts`, `QuestionEngine.test.ts`.

**Proposed additive fields:** `LearningAttemptRecord.sessionId?: string`; review metadata identifies `snapshot`, `curriculum` or `replacement`, and retains `originalQuestionId` separately from generated question identity. Confirm the existing types before implementing exact field placement.

- [ ] Add tests proving a saved snapshot survives reload without changed prompt/options/correct tokens/answer. Deep-copy mutable arrays so gameplay cannot mutate historical snapshots.
- [ ] Centralize replay resolution: `QuestionEngine.getMistakeReviewQuestions()` and any DataManager replay path must not independently select inconsistent fallbacks.
- [ ] Preserve exact curriculum replay where an ID resolves. If legacy dynamic content is unrecoverable, label the replacement `相同類型練習`; do not fabricate the original prompt or claim recovered history.
- [ ] Keep original queue association separate from replacement question ID. Define that completing the associated practice resolves that queue entry without overwriting historical attempts; cover that behavior in a regression test.
- [ ] Create one session ID when a question attempt session begins; retain it through wrong answers, hints and token reset. A genuine new visit gets a new ID. If active-question reload restoration exists, persist/reuse that active session; otherwise a reload starts a new session and must be documented.
- [ ] Aggregate hints by explicit session ID when present, otherwise use the existing legacy attempt-reset heuristic. Mark uncertainty in legacy analysis; do not invent precise session boundaries for malformed records.
- [ ] Test two sessions with the same question ID, retries within one session, cross-midnight sessions, missing attempt numbers, out-of-order timestamps and mixed old/new records.
- [ ] Test save roundtrip and rollback compatibility: older readers may ignore optional fields but must retain core player progress. Do not rewrite every save eagerly.
- [ ] Run learning-report, question-engine and state-integrity tests plus the review-mistakes browser flow; commit the additive change.

**Acceptance:** New records have unambiguous sessions and exact snapshots; legacy limitations are visible and do not corrupt rewards/progress. Historical information absent from old saves remains unrecoverable.

## Task G — Measured mobile performance improvements

**Files:** `vite.config.ts`, `src/scenes/PreloadScene.ts`, asset registrations and consumers discovered by tracing loads; create `scripts/check-performance-budget.mjs` and `docs/qa/release-hardening/performance.md`.

- [ ] Measure cold Home load and first station on a fixed network/CPU profile. Record five runs, median, spread, transferred bytes, request count, time until Start is usable and long tasks.
- [ ] Separate total repository assets (~26 MB recorded) from bytes actually transferred before Home is ready. Do not assume all 26 MB are first-load downloads.
- [ ] Proposed initial budgets: initial compressed JS <=500 KiB; no >10% median Start-ready regression against the fixed baseline; if nonessential outfits/pets are eagerly loaded, reduce those first-load bytes by >=30%. Treat these as engineering targets to confirm from baseline, not previously achieved measurements.
- [ ] Trace PreloadScene and asset consumers. Defer assets only when their destination can await loading with progress, failure and retry states. Core character/home assets must remain available for immediate entry.
- [ ] Split optional code only if it reduces initial executed/downloaded bytes. Moving Phaser into a named vendor chunk without delaying its load does not count as an initial-load improvement.
- [ ] Retain texture keys and dimensions; run wardrobe/avatar/Runner regressions after asset changes. Avoid changing art scale to save bytes.
- [ ] Add budget checks using measured artifacts, not the size of the repository alone. Keep source maps separate from initial page-transfer accounting.
- [ ] Repeat the same measurement profile and compare; revert optimizations that cause missing textures or slower usable startup. Commit only measured improvements.

**Acceptance:** Before/after measurements meet the selected budget; deferred screens handle load failure; no missing textures and no unsupported universal FPS claim.

## Task H — Improve test harness fidelity

**Files:** `src/test/setup.ts`, `vitest.config.ts`, affected mock helpers and focused graphics tests.

- [ ] Inventory methods used by production Graphics objects and supplied by test mocks, including `strokeCircle`.
- [ ] Add chainable mocks where Phaser methods return the graphics instance. Assert arguments when geometry matters; a universal no-op proxy would hide errors.
- [ ] Classify defensive guards: retain real runtime compatibility guards, remove test-only production workarounds only after the relevant reproduction is covered.
- [ ] Capture expected corrupted-save/audio warnings locally in those tests and assert that they occur. Do not globally silence console errors.
- [ ] Run the complete unit suite and representative real-browser graphics checks. Record whether the historical JSDOM wording was accurate; correct documentation if necessary.
- [ ] Commit harness changes separately from product features.

**Acceptance:** No missing required graphics methods in tested paths; expected warnings are asserted; browser checks still verify actual rendering.

## Task I — Final evidence, PR and release handoff

- [ ] Run unit tests, production build, complete local E2E and visual/a11y checks on the final source tree. Record exact SHA and all totals; never reuse a previous commit's result as final evidence.
- [ ] Verify the 13-item coverage table below; preserve MANUAL_PENDING entries and unresolved external host checks.
- [ ] Update `.ai/TASK_BOARD.md`, `CHANGELOG.md`, `TESTING.md`, and meaningful architecture/current-state changes. Release ownership. State that original PR #1 was already merged; link the new PR.
- [ ] Push a reviewable branch and inspect its actual Actions results. If the user separately authorizes release of these new fixes, follow the established deployment workflow; do not assume preparing this plan authorizes that future release.
- [ ] After any authorized deployment, verify source SHA, publication result and public browser smoke separately. Rollback uses the previously verified source/build and preserves player storage. Rehearse rollback in an isolated environment, not by disrupting production.

## Coverage and completion ledger

| Original item | Task | Completion evidence |
|---|---|---|
| 1 Full E2E failures | A, B | Fresh inventory, preserved assertion mapping, green local collection |
| 2 Live Pages smoke | C, I | Expected source SHA served and browser journey passed |
| 3 PR checks | C | Actions checks on the actual new PR head |
| 4 Chinese fonts | D | Known font/glyph screenshots and long-copy inspection |
| 5 Physical devices | D | Device/version-specific recordings or MANUAL_PENDING |
| 6 Speech/audio | E | Mock regression plus actual listening matrix |
| 7 Visual checklist | D | Evidence for each screen/state and animation |
| 8 Performance | G | Repeatable before/after transfer and usability measurements |
| 9 Graphics mocks | H | Full unit run and real renderer checks |
| 10 Legacy replay | F | Exact future snapshots and truthful legacy provenance |
| 11 Session inference | F | Optional session IDs, mixed-data regression coverage |
| 12 Accessibility | D | Keyboard/zoom/forced-colors checks and assistive-tool results |
| 13 Release process | C, I | Old merge acknowledged; new release has distinct gates |

## Copyable Luna execution instruction

Execute `docs/superpowers/plans/2026-09-13-release-hardening.md` using Luna at maximum available reasoning, if supported. Read AGENTS.md and the required .ai coordination files first. Work sequentially from Task A, on a new isolated branch based on current p1-adventure. This instruction authorizes implementing and testing the plan and pushing reviewable progress, not automatic production deployment. Reproduce failures before fixing; do not delete or skip tests solely to make the suite green. Preserve player storage and reward semantics. Commit each independently verified task and update the checkpoint with source SHA, commands, results and the next action. Continue work that does not depend on unavailable devices; mark genuine physical-device or screen-reader evidence MANUAL_PENDING. Never claim that headless emulation proves physical-device success. Do not repeat PR #1's merge or overwrite the old branch. At the end provide the new PR, final automated evidence and remaining manual acceptance rows.
