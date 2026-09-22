# Release-hardening execution checkpoint

> Evidence marker: Checkpoints 1–3 below are historical records from their
> named source commits. Their Chromium/local and public-host counts are kept
> for traceability and do not count as fresh Google Chrome acceptance evidence.
> The revised required scope is Chrome at CSS viewports 375×667, 390×844,
> 430×932, 667×375, 844×390, 768×1024 and 1280×800. Physical devices,
> Safari, Firefox, Android and assistive-technology/device-specific checks are
> `OUT_OF_SCOPE` under the user's revised acceptance.

## Checkpoint 1 — Task A complete

- **Task:** A — establish exact baseline and failure inventory
- **Status:** COMPLETE / AUTOMATED_VERIFIED (HISTORICAL)
- **Source:** `2656552e96630316fa0d675213877a0d340f7ddb` (`p1-adventure`)
- **Working branch:** `codex/p1-release-hardening`
- **Recorded at:** 2026-09-13 UTC

### Commands and results

| Command | Result |
|---|---|
| `npm ci` | exit 0; 53 packages installed |
| `npm run test:unit` | exit 0; 63 files / 1,940 tests passed |
| `npm run build` | exit 0; Vite build passed; 1,962.48 kB JS / 466.61 kB gzip; existing large-chunk advisory |
| `npx playwright install chromium` | exit 0; Chromium 129 and FFMPEG installed |
| `npx playwright test --reporter=list,json` | exit 1; 59 passed / 33 failed / 0 skipped from 92 |

### Artifacts and disposition

- `docs/qa/release-hardening/baseline-results.json` contains the complete JSON
  reporter output.
- Generated screenshot directories were restored after the run; no generated
  screenshots are being presented as new product evidence at this checkpoint.
- Every one of the 33 failures is listed in
  `failure-inventory.md` with the observed error and an initial owner/category.
- No production source was changed in Task A.
- `MANUAL_PENDING`: physical-device, real speech listening, real assistive
  technology and installed Traditional Chinese font evidence are not available
  in this headless environment and remain pending for Task D/E.

### Next action

Proceed to Task B browser-suite migration. Keep local and deployed smoke
contracts separate; do not hide live tests or weaken product assertions.

## Checkpoint 2 — Task B complete

- **Task:** B — migrate browser tests while preserving their intent
- **Status:** COMPLETE / AUTOMATED_VERIFIED (HISTORICAL)
- **Source:** `08fb097` (`test: migrate release browser coverage`)
- **Base:** `p1-adventure` merge `2656552e96630316fa0d675213877a0d340f7ddb`
- **Recorded at:** 2026-09-13 UTC

### Implementation

- Added shared Playwright helpers in `e2e/helpers/learning-flow.ts` and
  `e2e/helpers/canvas-controls.ts` for semantic Home → Map → station →
  Question navigation, exact duplicate-token matching, logical canvas-world
  mapping, Runner skip confirmation and celebration continuation.
- Migrated the affected local specs from fixed DOM/canvas coordinates to the
  mounted semantic controls. Genuine Phaser Runner/Shop checks retain canvas
  world-coordinate mapping and edge/corner coverage.
- Preserved answer correctness, Continue pacing, save restoration, purchase
  atomicity, reward idempotency, slot alignment and character pose assertions.
- Repaired a reproduced wardrobe visual defect: full-body Art Bible source
  PNGs are restored for the five outfit sets, and the preview layout derives
  scale/grounding from the available stage so the visible alpha remains
  readable without clipping. Wardrobe purchases choose coins only when the
  coin balance can cover the coin price, otherwise use the gem price through
  the existing atomic ledger.

### Commands and results

| Command | Result |
|---|---|
| `npm run test:unit` | exit 0; 63 files / 1,941 tests passed |
| `npm run build` | exit 0; Vite build passed; 1,963.34 kB JS / 466.90 kB gzip; existing >500 kB advisory |
| `CI=1 npx playwright test e2e/wardrobe-hybrid-shop-visual.spec.ts -g "inside the stage" --repeat-each=5 --retries=0` | exit 0; 5/5 passed |
| `CI=1 npx playwright test e2e/chaos-monkey-stress.spec.ts -g "Chaos 3\|Chaos 6" --repeat-each=5 --retries=0` | exit 0; 10/10 passed |
| `CI=1 PLAYWRIGHT_JSON_OUTPUT_NAME=docs/qa/release-hardening/task-b-results.json npm run test:e2e -- --reporter=list,json --retries=0` | exit 1 only for four pre-existing public-host specs; 88 passed / 4 external failures / 0 skipped |

### Remaining failures and evidence

- `task-b-results.json` is the final Task B collection report. The four
  failures are `live-iphone-touch-verify.spec.ts`,
  `live-sentence-tap-verify.spec.ts`, `live-speech-and-sublevel.spec.ts` and
  `live-test.spec.ts`; they either received `ERR_EMPTY_RESPONSE` from the
  public GitHub Pages host or exercised the old live canvas contract. They
  remain runnable evidence for Task C and were not skipped or deleted.
- All 88 local tests, including the preserved phase 8–9 semantic gates,
  support destinations, full playthrough, save/reward checks, responsive
  matrix and wardrobe visual suite, passed on the final source tree.
- `MANUAL_PENDING`: physical iPhone/iPad touch behavior, installed
  Traditional Chinese glyph coverage, audible speech/audio behavior and
  assistive-technology announcements are not proven by headless Chromium;
  these move to Tasks D/E.

### Next action

Proceed to Task C: separate the four deployed-host checks behind a dedicated
live configuration, add visible pull-request unit/build/local-browser checks,
and verify build identity without deploying automatically.

## Checkpoint 3 — Task C complete

- **Task:** C — add PR checks and verify deployed build identity
- **Status:** COMPLETE / AUTOMATED_VERIFIED (HISTORICAL); public smoke
  `ENVIRONMENT_BLOCKED`
- **Source:** `21ac288` (`ci: add release hardening checks and deployed smoke`)
- **Base:** `p1-adventure` merge `2656552e96630316fa0d675213877a0d340f7ddb`
- **Working branch:** `codex/p1-release-hardening`
- **Recorded at:** 2026-09-13 UTC

### Implementation

- Added `.github/workflows/ci.yml` with `pull_request` checks targeting
  `p1-adventure`, manual dispatch, `contents: read` permissions, lockfile
  installation, unit/build/local-browser gates and seven-day report/trace
  artifacts. The workflow never deploys PR code.
- Added `playwright.live.config.ts` with no local `webServer`; it requires an
  explicit `LIVE_BASE_URL` and collects only `e2e/live/`.
- Moved all five historical public-host specs into `e2e/live/` without
  deleting their assertions. The local config ignores only that directory, so
  `npm run test:e2e` is a deterministic local gate while
  `npm run test:e2e:live` remains the runnable external gate.
- Added `e2e/live/deployed-smoke.spec.ts`, which polls `build-info.json` for an
  exact `EXPECTED_SOURCE_SHA`, checks static-resource responses and page errors,
  exercises Home → Map → station → Question → answer → Continue, and verifies
  a save survives reload.
- Added a Vite build plugin that emits only `{ sourceSha }`, using
  `GITHUB_SHA` in Actions and `local` for an explicitly local build. The Pages
  deployment workflow verifies that identity before publishing `dist/`.
- Increased only Chaos 3's stress-test timeout to 60 seconds after reproducing
  the loaded-worker timeout; the 50 pointer sequences and error assertion are
  unchanged.

### Commands and results

| Command | Result |
|---|---|
| `npm ci` | exit 0; 53 packages installed |
| `npm run test:unit` | exit 0; 63 files / 1,941 tests passed |
| `npm run build` | exit 0; 1,963.34 kB JS / 466.90 kB gzip; existing >500 kB advisory; `dist/build-info.json` contains `sourceSha: local` |
| `CI=1 npx playwright test --list` | exit 0; local config collects 87 tests and excludes only `e2e/live/` |
| `CI=1 npx playwright test e2e/chaos-monkey-stress.spec.ts -g "Chaos 3" --repeat-each=5 --retries=0` | exit 0; 5/5 passed |
| `CI=1 PLAYWRIGHT_JSON_OUTPUT_NAME=docs/qa/release-hardening/task-c-results.json npx playwright test --reporter=list,json --retries=0` | exit 0; 87/87 passed, 0 skipped; JSON evidence in `task-c-results.json` |
| `CI=1 LIVE_BASE_URL=https://hkspurs.github.io/phonics_game/ npx playwright test --config=playwright.live.config.ts --list` | exit 0; six live tests collected |
| `npx playwright test --config=playwright.live.config.ts --list` | exit 1 as designed with clear `LIVE_BASE_URL is required` boundary |
| `curl ... https://hkspurs.github.io/phonics_game/` | public index returned HTTP 200; existing Pages document last-modified 2026-09-02 |
| `curl ... https://hkspurs.github.io/phonics_game/build-info.json` | HTTP 404 (GitHub Pages not yet serving this branch's build identity) |
| `git ls-remote origin refs/heads/gh-pages refs/heads/p1-adventure` | `gh-pages`=`683ef7165a938097a695dda93eb7c2ccb305b696`; base `p1-adventure`=`2656552e96630316fa0d675213877a0d340f7ddb` |

### Evidence boundary

- The current public host serves an older index but no `build-info.json`, so
  source identity and live interaction for `21ac288` cannot honestly be
  claimed yet. This is `ENVIRONMENT_BLOCKED`, not a skipped product test.
- No deploy was run. The existing Pages workflow still publishes only on
  pushes to `p1-adventure`, `main` or `master`; the new CI workflow is
  verification-only. The PR-triggered Actions check and post-deploy smoke will
  be attached after the review branch is pushed and a reviewer authorizes the
  normal merge/deployment path.
- Physical-device touch, installed Traditional Chinese fonts, audible speech
  and assistive-technology evidence remain `MANUAL_PENDING` for Tasks D/E.
- Player storage, reward settlement and ledger semantics were not changed in
  Task C; the deployed smoke only observes the existing save key.

### Next action

Proceed to Task D: reconcile automated visual/accessibility evidence, record
font/device/screen-reader limitations truthfully, and preserve all pending rows.

## Checkpoint 4 — Task 1 recovery reconciliation complete

- **Task:** 1 — reconcile and preserve source history
- **Status:** COMPLETE / RECOVERED_BASELINE; later D–H source `MISSING`
- **Source:** `21ac2884c8a57b3488c14a56f34966f400acf556`
- **Working branch:** `codex/p1-release-hardening`
- **Recovery ref:** `refs/recovery/release-hardening-20260913-21ac288`
- **Recorded at:** 2026-09-13 UTC

### Read-only recovery checks

| Check | Result |
|---|---|
| `git status --short` | Existing parent coordination/QA edits were present and inspected: `.ai/CHANGELOG.md`, `.ai/CURRENT_STATE.md`, `.ai/TASK_BOARD.md`, `.ai/TESTING.md`, `checkpoint.md`, `failure-inventory.md`, plus the untracked supplement plan. No source edits were present. |
| `git branch --show-current` | `codex/p1-release-hardening` |
| `git worktree list` | Main worktree `codex/p1-storybook-ux` at `bcd8848`; review worktree at `21ac288`. |
| `git log --all --oneline -30` / `git reflog --all -30` | Reachable A–C chain is intact: base `2656552`, Task A `ea3ea5c`, Task B `08fb097`, docs `9824fd`, Task C `21ac288`; no later D–H checkout/reset found. |
| `git cat-file -t 418abd3` | Missing (`Not a valid object name`). |
| `git fsck --full --no-reflogs --unreachable` | Exit 0 with no unreachable objects; no later source can be recovered from dangling objects. |
| Recorded D–H IDs | `e7977a9`, `88ff618`, `daa4257`, `bd55aaa`, `162c103`, `cd5b655` and `418abd3` all fail `git cat-file -e <sha>^{commit}` and are `MISSING`. |
| Recovery ref creation | `refs/recovery/release-hardening-20260913-21ac288` points to the full source SHA above. No reset, rebase, merge, destructive checkout or blind cherry-pick was used. |

### Remote and artifact disposition

- The authorized remote read found `p1-adventure` at
  `2656552e96630316fa0d675213877a0d340f7ddb`, `gh-pages` at
  `683ef7165a938097a695dda93eb7c2ccb305b696`, and `main`/`master` at
  `d1cd7450f027cefbcd15276704585acd2f35557b`. There was no remote
  `codex/p1-release-hardening` before this checkpoint. The parent agent's
  delegated branch and GitHub PR reads found no release-hardening branch or
  open PR to overwrite/reuse.
- The evidence-backed artifact and implementation matrix is in
  [`recovery-inventory.md`](recovery-inventory.md). It records A–C as
  reachable historical source, D–H as partial or missing based on content
  inspection, and the exact missing visual, speech-fixture, runtime-loader,
  session-field, replay-spec and graphics-harness files.
- Existing `baseline-results.json`, `task-b-results.json` and
  `task-c-results.json` remain historical artifacts. They are not relabelled
  as Chrome-reviewed results.
- The known QA-only `Noto Sans TC` font and delegated Chrome runtime findings
  belong to Task 2/3 evidence. No production font, game source, save data,
  balances, inventory, equipment, station progress or reward IDs changed in
  this recovery task.
- The scoped commit was checked locally, but
  `timeout 20 git push origin HEAD:refs/heads/codex/p1-release-hardening`
  stopped at GitHub credential lookup (`could not read Username`). A follow-up
  `git ls-remote` returned no review ref, so the remote SHA is `UNVERIFIED` and
  Task 1's push acceptance is `BLOCKED` at that explicit permission boundary.
  No alternate transport, force push or deployment was attempted.

### Next action

Retry the exact docs commit through an authorized GitHub path and verify its
remote SHA, then proceed to Task 2: create the Chrome config, rerun the fresh
baseline with `--retries=0`, and record any launch/runtime boundary without
substituting Chromium for required Chrome evidence.
