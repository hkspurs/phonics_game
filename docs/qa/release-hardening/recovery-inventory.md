# Release-hardening source recovery inventory

Recorded: 2026-09-13 UTC
Task: 1 — reconcile and preserve source history
Branch under review: `codex/p1-release-hardening`

This inventory distinguishes source that is present in the checkout from
historical claims about later work. It is a recovery record, not a claim that
the Chrome acceptance gate has passed. The current user-approved browser scope
is Google Chrome at CSS viewports `375×667`, `390×844`, `430×932`, `667×375`,
`844×390`, `768×1024` and `1280×800`. Physical devices, Safari, Firefox,
Android, assistive-technology runs and device-specific performance are
`OUT_OF_SCOPE` under the revised acceptance. Chrome launch/interaction evidence
is still a separate required gate.

## Recovery method and repository state

The required read-only checks were run in
`/workspace/scratch/d2f78c43f3a7/phonics_game/.worktrees/release-hardening`.

| Check | Observed result |
|---|---|
| `git status --short` | Existing dirty coordination/QA files: `.ai/CHANGELOG.md`, `.ai/CURRENT_STATE.md`, `.ai/TASK_BOARD.md`, `.ai/TESTING.md`, `docs/qa/release-hardening/checkpoint.md`, `docs/qa/release-hardening/failure-inventory.md`; untracked supplement plan `docs/superpowers/plans/2026-09-13-chrome-release-completion.md`. These were inspected and preserved. |
| `git branch --show-current` | `codex/p1-release-hardening` |
| `git worktree list` | Main worktree on `codex/p1-storybook-ux` at `bcd8848`; this worktree on `codex/p1-release-hardening` at `21ac288`. |
| `git log --all --oneline -30` | Reachable release chain includes base merge `2656552`, Task A `ea3ea5c`, Task B `08fb097`, checkpoint docs `9824fd`, and Task C `21ac288`. |
| `git reflog --all -30` | Shows the same A–C progression; no later D–H checkout or reset is present. |
| `git cat-file -t 418abd3` | Missing: Git reports `Not a valid object name 418abd3`. |
| `git fsck --full --no-reflogs --unreachable` | Exit 0 with no unreachable objects. A reflog-inclusive check was also empty. |
| Recovery ref | Created `refs/recovery/release-hardening-20260913-21ac288` → `21ac2884c8a57b3488c14a56f34966f400acf556` before further document edits. |

The authorized remote read reported these refs before this checkpoint:

| Remote ref | SHA | Meaning |
|---|---|---|
| `origin/p1-adventure` | `2656552e96630316fa0d675213877a0d340f7ddb` | Current base merge |
| `origin/gh-pages` | `683ef7165a938097a695dda93eb7c2ccb305b696` | Published Pages history |
| `origin/main`, `origin/master` | `d1cd7450f027cefbcd15276704585acd2f35557b` | Mainline refs |
| `origin/codex/p1-release-hardening` | absent before this checkpoint | No remote review branch was overwritten |

The parent agent's delegated remote branch and GitHub PR reads found no
existing release-hardening branch or open PR to reuse. The merged historical PR
is kept distinct from this review branch.

## Reachable source history

These commits are present and inspectable. Their test counts and browser
results remain historical evidence from the recorded source; they are not
fresh Chrome-reviewed results.

| Source | Status | Evidence present |
|---|---|---|
| `2656552e96630316fa0d675213877a0d340f7ddb` (`p1-adventure` merge) | `RECOVERED` | Reachable base recorded by the original release-hardening plan and remote ref. |
| `ea3ea5c5cd18e735a405c13ac4eb261825cb6b6d` (`qa: record release hardening baseline`) | `RECOVERED` | Baseline JSON, failure inventory and Checkpoint 1 are present. Historical result: 92 Playwright tests, 59 passed, 33 failed, 0 skipped; 1,940 unit tests; build passed. |
| `08fb0976a4a31cc469f8f84d350754ced1d933da` (`test: migrate release browser coverage`) | `RECOVERED` | Shared learning/canvas helpers and migrated browser specs are present. Historical local result: 88 passed, 4 public-host failures, 0 skipped. |
| `9824fd2cc5e40006f5b0acc743ab33b7499e6f50` (`docs: checkpoint browser migration`) | `RECOVERED` | Task B checkpoint and inventory updates are present. |
| `21ac2884c8a57b3488c14a56f34966f400acf556` (`ci: add release hardening checks and deployed smoke`) | `RECOVERED` | CI workflow, live config/smoke, build identity, preserved live specs and Task C JSON evidence are present. Historical local result: 87/87 passed, 0 skipped; public `build-info.json` was 404 and therefore environment-blocked. |

## Requested later-history objects

The task brief names seven possible D–H commits. Each was checked with
`git cat-file -e <sha>^{commit}` and is absent. The strict fsck result above
provides no dangling object from which any of them can be reconstructed.

| Recorded ID | Recovery result | Action |
|---|---|---|
| `e7977a9` | `MISSING` | No source to cherry-pick or inspect |
| `88ff618` | `MISSING` | No source to cherry-pick or inspect |
| `daa4257` | `MISSING` | No source to cherry-pick or inspect |
| `bd55aaa` | `MISSING` | No source to cherry-pick or inspect |
| `162c103` | `MISSING` | No source to cherry-pick or inspect |
| `cd5b655` | `MISSING` | No source to cherry-pick or inspect |
| `418abd3` | `MISSING` | No source to cherry-pick or inspect |

No reset, rebase, merge, destructive checkout or blind chain cherry-pick was
performed. The reachable baseline is retained on the existing branch and the
new recovery ref protects it while Tasks 2–8 are implemented sequentially.

## Artifact and implementation inventory

The following checks inspected content as well as filenames.

| Planned work | Source found | Evidence found | Missing or inconsistent |
|---|---|---|---|
| Task 1 / original A–C coordination | `FOUND` | `checkpoint.md`, `failure-inventory.md`, baseline/Task B/Task C JSON reports, local/live Playwright configs and CI workflow are present. | The A–C counts are historical and were produced before the revised Chrome-only gate. |
| Task 3 / original D visual and accessibility coverage | `PARTIAL` | `src/presentation/` contains `ScreenHost`, Home, Map, station detail, Question, Result, Settings, Trophy and Diagnostic Report views. Existing `phase8-support-destinations.spec.ts`, `phase8-9-full-journey.spec.ts` and `phase9-viewport-accessibility.spec.ts` cover semantic support journeys and the seven viewport values. | `e2e/visual-release.spec.ts` and `e2e/accessibility-release.spec.ts` are absent. No task-specific Chrome screenshots, 200% zoom review, forced-colors review or inspected glyph evidence is present in this recovery checkpoint. |
| Task 4 / original E speech and audio lifecycle | `PARTIAL` | `src/services/SpeechService.ts` and `SoundManager.ts` exist; current speech specs include auto speech, math speech and sentence scramble speech assertions. | `e2e/helpers/speech-fixture.ts` and `e2e/speech-audio-fixture.spec.ts` are absent. Content inspection confirms the current Cantonese voice path can fall back through `zh-TW`/`zh-CN`, `unlockAudio()` marks unlocked in its catch path, and voice cache refresh ignores an empty list; these remain Task 4 work. Actual audible Chrome evidence is absent. |
| Task 5 / original F replay provenance and sessions | `PARTIAL` | `LearningAttemptRecord` exists in `src/types/index.ts`; `QuestionAttempt.questionSnapshot` is recorded by `QuestionScene.ts`; `QuestionEngine.getMistakeReviewQuestions()` prefers snapshots, then curriculum, then generated replacement. | `LearningAttemptRecord` has no `sessionId`; snapshot copies are shallow; `QuestionEngine` assigns a replacement the queued ID; `e2e/review-mistakes-replay.spec.ts` is absent. Explicit session/replay provenance remains Task 5 work. |
| Task 6 / original G deferred assets and purchase evidence | `PARTIAL` | `PreloadScene.ts` has `loadWardrobeAssets()` and existing wardrobe/purchase specs; the Task B source restored full-body outfit art and includes the wardrobe visual regression. | `src/services/RuntimeAssetLoader.ts` and the planned wardrobe helper are absent. Current `loadWardrobeAssets()` loops through all `getWardrobePreloadPaths()` at preload time, so deferred-group ownership/retry behavior is not implemented. No five-run before/after performance artifact is present. |
| Task 7 / original H graphics harness | `PARTIAL` | Tested scenes contain inline graphics stubs, and several tests define local `strokeCircle`, rounded-rectangle and ellipse spies. | `src/test/phaserGraphicsMock.ts` and `src/test/phaser-graphics-mock.test.ts` are absent. `src/test/setup.ts` supplies a minimal canvas context without explicit graphics spies; graphics mocks remain duplicated and inconsistent. |
| Task 8 / original I final handoff | `PARTIAL` | Existing CI/live workflows and A–C evidence are present. | No final Chrome matrix, final source freeze, PR for this head, or release handoff exists yet. |

The evidence above deliberately records partial implementations as partial;
existing filenames are not treated as proof of the planned behavior.

## Current boundaries and continuation

- The recovery result is `RECOVERED` for the reachable A–C source and
  `MISSING` for the seven named later objects. There is no recoverable D–H
  implementation chain to transplant.
- Historical Chromium/local counts stay labelled historical. They do not
  satisfy the revised Chrome acceptance requirement.
- A delegated Chrome precheck identified Google Chrome `153.0.8010.36` from
  the official extracted package, but Playwright launch failed in this managed
  runtime with `FATAL ... socket() failed Operation not permitted`. Required
  Chrome interaction evidence is therefore `BLOCKED` pending the Task 2
  runtime path; no Chromium result is substituted.
- A known QA-only `Noto Sans TC` font was installed for later inspection; its
  package/license details and glyph review belong to Task 3. This does not
  change production font assets.
- Player save key `p1_adventure_save_v1`, balances, inventory, equipment,
  station progress and reward transaction IDs were not modified by recovery.
- Next action: Task 2 establishes the Chrome config and fresh baseline; later
  tasks reconstruct only the missing behavior, in order, with their own tests,
  checkpoint and pushed commit.
