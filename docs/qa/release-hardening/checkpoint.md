# Release-hardening execution checkpoint

## Checkpoint 1 — Task A complete

- **Task:** A — establish exact baseline and failure inventory
- **Status:** COMPLETE / AUTOMATED_VERIFIED
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
- **Status:** COMPLETE / AUTOMATED_VERIFIED
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
