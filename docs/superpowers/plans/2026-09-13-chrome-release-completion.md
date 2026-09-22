# Chrome Release Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, sequentially. Steps use checkbox syntax for tracking. Use Luna maximum reasoning only if the environment confirms support; do not claim a model switch otherwise.

**Goal:** Recover or reconstruct the approved release-hardening work, verify it in Chrome at the agreed viewport sizes, and deliver a pushed review branch and new PR without deploying.

**Architecture:** Preserve Phaser scene ownership and the existing semantic DOM presentation layer. Recover verified commits before reimplementing missing work. Keep local regression, actual Chrome acceptance and future deployed-site verification distinct.

**Tech Stack:** TypeScript, Phaser, Vite, Vitest, Playwright, Chrome, GitHub Actions.

**Spec:** `docs/superpowers/plans/2026-09-13-release-hardening.md`, with the user's subsequent acceptance change: Chrome at matching viewport sizes is sufficient; physical-device and non-Chrome matrices are no longer release requirements. This document supersedes conflicting manual acceptance requirements, not save/economy safeguards.

## Global constraints

- Preserve `p1_adventure_save_v1`, balances, inventory, equipment, station progress, historical attempts and reward transaction IDs.
- No test skips/deletions, weakened assertions, blanket timeout increases or swallowed failures to obtain green results.
- No automatic merge or deployment. Push only the review branch; do not push to `p1-adventure`, `main`, or `master`.
- Existing dirty coordination documents belong to the ongoing task; inspect and preserve them.
- Scope: Chrome desktop engine with CSS viewport sizes 375x667, 390x844, 430x932, 667x375, 844x390, 768x1024 and 1280x800. This preserves the previous size matrix; it does not claim real iOS behavior.
- Use installed Google Chrome (`channel: 'chrome'`) for Chrome acceptance. Bundled Chromium may run regression but must be labelled Chromium, not Chrome. If Chrome is unavailable, report that boundary rather than claiming equivalence.
- Safari, Firefox, physical iPhone/iPad/Android, VoiceOver/TalkBack/NVDA and physical low-end-device performance become `OUT_OF_SCOPE — user revised acceptance`. Do not relabel them PASS.
- Chrome font rendering, keyboard operation, zoom, actual interaction and save/reward behavior remain required. Synthetic speech proves request semantics, not audible pronunciation.
- Every implementation task ends with tests, an explicit-path commit, updated checkpoint and push. Do not leave all completed work local until the final task.

## Evidence status vocabulary

`RECOVERED`: source located, not yet freshly verified. `AUTOMATED_VERIFIED`: commands and assertions passed on identified source. `CHROME_REVIEWED`: screenshots/interaction inspected in identified Chrome version. `OUT_OF_SCOPE`: no longer required by user. `BLOCKED`: required evidence cannot be collected. `NOT_RUN`: check not executed. No overall percentage until source recovery establishes the actual remaining work.

## Task 1 — Reconcile and preserve source history

**Files:** Read `AGENTS.md`, `.ai/{CURRENT_STATE,TASK_BOARD,OWNERSHIP,ARCHITECTURE,CONVENTIONS,TESTING,CHANGELOG}.md`; update `docs/qa/release-hardening/checkpoint.md` and create `recovery-inventory.md` in the same folder.

- [ ] Read the coordination protocol and ownership before edits. Stop on another agent's overlapping lock.
- [ ] Record actual branch, status, worktrees and history with these read-only checks:

```bash
git status --short
git branch --show-current
git worktree list
git log --all --oneline -30
git reflog --all -30
git cat-file -t 418abd3
git fsck --full --no-reflogs --unreachable
```

- [ ] Treat the last observed `21ac288` as the accessible baseline, not proof that later work never existed. Search reachable/unreachable objects for recorded D–H commits: `e7977a9`, `88ff618`, `daa4257`, `bd55aaa`, `162c103`, `cd5b655`, `418abd3`. For each existing object inspect `git show --stat <sha>` and ancestry. Do not cherry-pick an entire overlapping chain blindly.
- [ ] Use authorized GitHub reads to check the base and any release-hardening branches/PRs. A remote branch with other work must not be overwritten.
- [ ] Record each task as source found, evidence found, missing, or inconsistent. Verify missing files, including visual specs, RuntimeAssetLoader, explicit session fields and graphics mock, against actual content rather than filename alone.
- [ ] Preserve a located later history with a new recovery ref before changing branches. If no source is recoverable, retain the existing branch and implement missing D–H once, in order, using Tasks 3–7 below.
- [ ] Commit the reconciled coordination documents only after inspecting their diff; push the review branch now. Verify the remote SHA matches the local checkpoint. If push permission fails, stop at that explicit boundary.

**Acceptance:** An evidence-backed inventory distinguishes recovered source from historical conversation claims. At least the accessible A–C checkpoint is safely pushed. No reset or destructive checkout is used.

## Task 2 — Establish Chrome acceptance and current baseline

**Files:** Create `playwright.chrome.config.ts`, `docs/qa/release-hardening/chrome-acceptance.md`; update `package.json` and relevant QA matrices if they exist.

- [ ] Retain the local test collection and the separate `e2e/live/` gate. Add a Chrome config derived from the existing local config:

```ts
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  projects: [{
    name: 'chrome',
    use: { channel: 'chrome' },
  }],
});
```

- [ ] Add `test:e2e:chrome` with value `playwright test --config=playwright.chrome.config.ts`. Confirm Chrome availability using Playwright's launch, recording `browser.version()` and user agent. Do not run a paid/device service.
- [ ] Run `npm ci`, `npm run test:unit`, `npm run build`, and the full local collection with `CI=1`, `--retries=0` and list/JSON reporters. Set `PLAYWRIGHT_JSON_OUTPUT_NAME` to a task-specific file under the QA directory. Never reuse a stale preview server.
- [ ] Classify every reproduced failure and retain its assertion intent. Historical counts 87/87, 87/92 or 1,964 unit tests are not current results until rerun.
- [ ] Amend manual acceptance rows using the status vocabulary above. Set live publication to `NOT_RUN — deployment intentionally not authorized`, unless a fresh check demonstrates another specific boundary.
- [ ] Commit and push the Chrome config and baseline record; leave generated large screenshots in test artifacts, not repeated binary commits.

**Acceptance:** Real Chrome can be identified and launched, exact test counts are recorded, and no device-emulation result is called a physical-device pass.

## Task 3 — Restore visual, font and accessibility coverage (original D)

**Files:** Recover or create `e2e/visual-release.spec.ts`, `e2e/accessibility-release.spec.ts`; use `src/presentation/*`, `index.html` and owning scene styles only for reproduced defects.

- [ ] Capture Home, Map, station detail, choice question, sentence scramble, Result, Shop, Settings, Trophy and Report at each agreed size. Use isolated deterministic save fixtures and await the mounted screen, asset readiness and `document.fonts.ready`.
- [ ] Include long Traditional Chinese text, English/numeric punctuation, duplicate tokens, empty/full reports, reset dialog, and shop owned/equipped/unaffordable states.
- [ ] Inspect actual CJK glyphs. A resolved font promise is not glyph evidence. Use an available licensed CJK system font in QA; if unavailable, obtain one only through permitted installation/download paths, recording version/license. Do not automatically bundle a production font.
- [ ] For layout assertions check `scrollWidth <= clientWidth + 1`, visible primary actions, scroll endpoints and 48px-class DOM controls. Fix the exact owning container using wrapping/min-width/scroll rules, then rerun the failing case and adjacent sizes.
- [ ] Exercise Tab, Shift+Tab, Enter and Escape through Home → Map → Question → Continue and support dialogs. Assert focus trap and return; hidden Phaser controls must not receive DOM keyboard actions.
- [ ] Review Chrome at genuine 200% browser zoom; do not substitute deviceScaleFactor or a smaller viewport and label it zoom. Check forced-colors and reduced-motion emulation separately.
- [ ] Capture timed frames for wings/torso ordering, airborne/landing shadow and OOTD composition. Preserve placeholder art behavior; snapshots alone do not prove animation.
- [ ] Run these specs with the Chrome config, inspect images, record artifacts and commit/push only confirmed source/test/documentation changes.

**Acceptance:** Required Chrome matrix is reviewed with readable glyphs, working controls and evidence paths. Excluded physical/assistive platforms are OUT_OF_SCOPE.

## Task 4 — Restore speech lifecycle and repair supported-voice fixtures (original E)

**Files:** `src/services/{SpeechService,SoundManager}.ts`, their tests, `src/scenes/QuestionScene.ts`, `src/presentation/SettingsView.ts`; `e2e/helpers/speech-fixture.ts`, three legacy speech specs and `e2e/speech-audio-fixture.spec.ts`.

- [ ] Add/recover failing unit tests for empty/late/removed voices, thrown synthesis, rapid replacement requests, scene shutdown, muted sound and rejected AudioContext resume.
- [ ] Require Cantonese-labelled voices for Cantonese requests; never silently call Mandarin Cantonese. Expose unavailable/requested/failed state with readable text; a queued request must not claim audible success.
- [ ] Increment a speech generation on cancellation; old callbacks must check their generation before acting. Question shutdown cancels owned speech and removes listeners.
- [ ] For `auto-speech-and-sublevel-click`, `math-speech-and-layout`, and `sentence-scramble-speech`, install a deterministic `zh-HK` synthesis fixture before navigation. Fixture captures utterance text/lang and supplies `getVoices`, `speak`, `cancel` and Utterance class. Retain a separate no-Cantonese fixture that asserts truthful fallback and no Mandarin substitution.
- [ ] Keep assertions for delayed auto-read, explicit math words, instruction-before-answer and answer-after-solving. Use visible DOM listen/token controls. Correct `waitForFunction` options placement to `(predicate, undefined, {timeout: 10000})`; do not increase total test timeouts to disguise missing voices.
- [ ] Run the four speech specs and focused Speech/Sound/Question unit suites. If diagnosing a timing race, repeat the affected case three times with zero retries.
- [ ] Record actual Chrome audio separately: if the environment cannot capture/listen to output, report unavailable audible evidence, while allowing the approved text-fallback path to satisfy functionality. Never say pronunciation was heard based on a mock.
- [ ] Commit/push speech changes and update checkpoint.

**Acceptance:** Supported voice request semantics and unsupported voice fallback both pass; text learning remains usable without installed Cantonese speech.

## Task 5 — Restore save provenance and session identity (original F)

**Files:** `src/types/index.ts`, `src/services/DataManager.ts`, `src/engine/QuestionEngine.ts`, `src/scenes/QuestionScene.ts`, diagnostic/question views; learning-history unit tests and `e2e/review-mistakes-replay.spec.ts`.

- [ ] Add optional `sessionId` to learning records. Create it once per question visit; preserve it through retries/hints/reset. A later visit gets a distinct ID. Do not invent active-question reload restoration if none exists.
- [ ] Deep-copy saved question snapshots including options and tokens at save/replay boundaries. Prove mutation after recording cannot alter the saved historical question.
- [ ] Centralize replay resolution in one authoritative path: snapshot first, exact curriculum second, explicitly labelled replacement last. Preserve original queue ID independently of generated replacement ID.
- [ ] Label unrecoverable legacy practice `相同類型練習`; completing it removes only its associated queue entry, not historical wrong answers or other queued entries.
- [ ] Aggregate hints by explicit session ID; use documented legacy heuristics only for old rows. Test two revisits, retries, midnight crossing, missing attempt numbers, reordered timestamps and mixed legacy/new records.
- [ ] Compare saves before/after reload: balances, inventory, equipment, station completion and ledger IDs are unchanged except intentional test actions. Cover insufficient funds, duplicate reward/purchase and persistence failures.
- [ ] Run focused history/engine/state suites, full unit tests and real-control review E2E; commit/push.

**Acceptance:** Additive fields preserve older saves and rewards; new snapshots replay exactly, old missing information is not fabricated.

## Task 6 — Restore safe deferred assets and repair purchase tests (original G)

**Files:** `src/services/RuntimeAssetLoader.ts`, `src/scenes/{Preload,Shop}Scene.ts`, loader tests; `e2e/helpers/wardrobe.ts`, both gamer purchase specs; performance script/results.

- [ ] Measure five fresh cold Home loads before modifying preload. Record compressed JS, all transfer bytes, optional images, request count, Start-ready time, long tasks and failures using the same network/CPU profile before and after.
- [ ] Keep core art and equipped single full-body outfit available at boot. Load unselected outfits/pets at their destination with progress, failure and a working retry control; retain stable texture keys/dimensions.
- [ ] Add loader tests for overlapping different asset groups, repeated same group, partial failures, retry, scene shutdown and re-entry. Do not let an in-flight wardrobe promise falsely mark unrequested pets complete. Verify each requested texture exists before returning complete; compute loaded count from actual successful textures.
- [ ] Track request ownership per group and scene lifecycle. A rapid tab switch must not leave a group permanently loading or let an old callback update a new screen.
- [ ] Reproduce the two purchase tests before changing them. Split selection, readiness assertion, action click, modal appearance and confirmation into separate awaited steps. Poll selected item ID plus enabled purchase CTA, rather than sleeping or calling purchase while artwork is unavailable.

```ts
await expect.poll(() => page.evaluate(() => {
  const shop = (window as any).__PHASER_GAME__.scene.getScene('ShopScene');
  return {
    enabled: shop.actionButton.isEnabled(),
    buying: shop.actionButton.getText().includes('立即購買'),
  };
})).toEqual({ enabled: true, buying: true });
```

- [ ] Preserve exact price, confirmation, double-tap, one inventory entry and ledger assertions. In the full playthrough inspect post-Heroine currency before choosing the original dress; do not change rewards or add money to bypass a product defect.
- [ ] Add a delayed/failed request browser test: no charge while art is loading; retry loads real art and re-enables purchase; confirmation charges once. Exercise rapid wardrobe/pet tab changes and return after scene shutdown.
- [ ] Run the entire wardrobe visual suite and both purchase specs, then five matching post-change performance runs. Budgets: initial compressed JS <=500 KiB; median Start-ready no more than 10% slower than baseline; deferred optional bytes reduced at least 30% where previously eager.
- [ ] Report actual measurements, not repository asset totals. Commit/push only improvements with correct render/state behavior.

**Acceptance:** No missing art or false complete states, purchase semantics preserved, repeatable budgets met. If optimization breaks correctness, fix or remove that optimization rather than hiding failures.

## Task 7 — Restore explicit graphics harness (original H)

**Files:** `src/test/setup.ts`, `src/test/phaserGraphicsMock.ts`, `src/test/phaser-graphics-mock.test.ts`, affected wardrobe/anatomical tests.

- [ ] Inventory graphics methods used in tested production paths. Create explicit chainable spies including `strokeCircle`, round rectangles, ellipse, paths and gradient methods; record arguments. Do not use a universal no-op proxy.
- [ ] Write tests asserting method availability, returned instance and geometry arguments, then migrate affected duplicate mock factories.
- [ ] Assert expected corrupted-storage/audio warnings within their own tests; keep unexpected console errors visible.
- [ ] Retain genuine runtime compatibility guards. Remove any test-only workaround only after a regression demonstrates the real renderer remains correct.
- [ ] Run the complete unit suite and representative Chrome wardrobe/Runner checks; inspect actual harness configuration before describing it as JSDOM.
- [ ] Commit/push the harness and checkpoint.

**Acceptance:** Harness fidelity is improved without replacing real-browser rendering checks or suppressing errors.

## Task 8 — Final Chrome gate and reviewable handoff (original I)

**Files:** QA evidence/checkpoint, `.ai` records, `.github/workflows/ci.yml`, new PR body.

- [ ] Freeze production/test source in a commit; record its full SHA. Run `npm run test:unit`, `npm run build`, full local E2E with zero retries, the Chrome matrix/visual/accessibility checks, and performance budget check on that source. Attach each command, exit code, count and artifact path.
- [ ] If code changes after a failure, rerun affected checks and the final complete collection. Do not treat focused three-test passes as full-suite success.
- [ ] Inspect the final diff for removed/skipped assertions, save key/schema compatibility, economy changes, secret files, temporary debug code and accidental deployment triggers.
- [ ] Update `.ai/TASK_BOARD.md`, `CURRENT_STATE.md`, `TESTING.md`, `CHANGELOG.md` and checkpoint with actual evidence. Release only this task's ownership. Record excluded platforms as OUT_OF_SCOPE and any required uncollected Chrome evidence as BLOCKED.
- [ ] Push the branch and confirm remote head SHA. Create a new PR targeting `p1-adventure`, checking first for an existing PR on this head. Do not reopen merged PR #1.
- [ ] Inspect actual PR-triggered Actions checks. If queued/running, report pending; if failed, inspect logs and fix within scope; if permission/configuration blocks execution, report that exact boundary. Do not call empty statuses a pass.
- [ ] Final handoff contains PR link, source SHA, exact unit/E2E/Chrome totals, performance results, evidence index and remaining scope exclusions. Keep the PR draft if required checks are unresolved.

**Completion gate:** Recoverable work preserved; all required implemented behavior and Chrome acceptance pass; no unexplained test failure; checkpoint and branch pushed; new PR available; Actions result accurately reported. Production publication and public-host smoke are deliberately a separate future release task and do not block this no-deploy implementation handoff.

## Executor handoff

Execute this plan sequentially. Start with recovery, not a blind rewrite of Tasks D–H. Follow the original release-hardening plan for detailed subsystem contracts where this document does not replace them. Use Luna maximum reasoning only when confirmed supported. Commit and push every independently verified checkpoint. Preserve saves and rewards; never skip/delete tests to get green. Chrome at the seven specified sizes is the required browser acceptance; physical devices and other browsers are OUT_OF_SCOPE. Finish with a new review PR and no automatic deployment.
