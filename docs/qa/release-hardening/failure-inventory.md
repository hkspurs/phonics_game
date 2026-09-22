# Release-hardening baseline failure inventory

Run date: 2026-09-13 (UTC)
Branch base: `p1-adventure` at `2656552e96630316fa0d675213877a0d340f7ddb`
Command: `PLAYWRIGHT_JSON_OUTPUT_NAME=docs/qa/release-hardening/baseline-results.json npx playwright test --reporter=list,json`

## Baseline totals

| Check | Result |
|---|---:|
| Playwright tests collected | 92 |
| Passed | 59 |
| Failed | 33 |
| Skipped | 0 |
| Retries | 0 |
| Unit tests | 63 files / 1,940 passed |
| Production build | Passed; 1,962.48 kB JS, 466.61 kB gzip; existing >500 kB advisory |
| JSON evidence | `baseline-results.json` |

The JSON reporter output is the authoritative per-test record. The table below
keeps the failure list reviewable without treating a failure as harmless before
its owning interaction and replacement coverage are checked.

## Failures and initial disposition

| # | Spec / test | Observed failure | Initial category and owner |
|---:|---|---|---|
| 1 | `auto-speech-and-sublevel-click.spec.ts` — auto-read and full-area row click | Canvas coordinate click leaves `MapScene`; expected `QuestionScene` | Stale canvas navigation assertion; `e2e/` migration |
| 2 | `chaos-monkey-stress.spec.ts` — celebration interruption | Active scenes remain `TitleScene`/`QuestionScene`; expected `MapScene` | Stale scene-owner/timing assertion; `e2e/` migration, verify no zombie timer |
| 3 | `comprehensive-uat.spec.ts` — UAT 1 | Fixed canvas click does not reach `MapScene` | Stale coordinate navigation; `e2e/` migration |
| 4 | `full-playthrough.spec.ts` — complete journey | 30 s test timeout while waiting after Trophy navigation | Timing-heavy legacy assertion; `e2e/` migration |
| 5 | `game.spec.ts` — Runner transition | `waitForFunction` cannot observe expected Runner scene in 10 s | Canvas/scene timing contract; `e2e/` migration |
| 6 | `gamer-deep-interactive-playtest.spec.ts` — shop to runner | Purchase success modal state is undefined | Product/fixture interaction mismatch; `ShopScene` + test owner |
| 7 | `gamer-deep-interactive-playtest.spec.ts` — double charge | Purchase confirmation CTA unavailable | Product/fixture interaction mismatch; `ShopScene` + test owner |
| 8 | `gamer-tester-3-full-playthrough-inspector.spec.ts` — buy Heroine journey | Heroine not owned/equipped; gems unchanged | Product defect or stale purchase path; `ShopScene` + test owner |
| 9 | `iphone-touch-calibration.spec.ts` — five touch points | Center click reports false | Test-only synthetic coordinate contract; `e2e/` migration |
| 10 | `live-iphone-touch-verify.spec.ts` — live five touch points | Center click reports false | Legacy live canvas contract; separate deployed smoke owner |
| 11 | `live-sentence-tap-verify.spec.ts` — live choice/scramble | `ERR_EMPTY_RESPONSE` from GitHub Pages | External transport / deployment availability |
| 12 | `live-speech-and-sublevel.spec.ts` — live row click | Expected `QuestionScene`, received `TitleScene` | Legacy live canvas contract; deployed smoke owner |
| 13 | `live-test.spec.ts` — full live UAT | `ERR_EMPTY_RESPONSE` from GitHub Pages | External transport / deployment availability |
| 14 | `sentence-tap-and-button-hover.spec.ts` — card placement | First card remains in bank (`slotIndex: null`) | Canvas assertion against DOM-owned question surface; `e2e/` migration |
| 15–20 | `ui-qa-hitarea-adversarial-auditor.spec.ts` — six viewports | Expected legacy hit-area origin `-8`; runtime reports centered `-193` | Assertion encodes pre-fix geometry; preserve intent with mapped canvas helper |
| 21–26 | `ui-qa-responsive-hover-and-slots.spec.ts` — six viewport hover checks | Canvas hover scale remains `1` while DOM owns Home interaction | Renderer-owner mismatch; migrate to semantic control or genuine canvas owner |
| 27 | `ui-qa-responsive-hover-and-slots.spec.ts` — Heroine purchase/scramble | Heroine remains unowned and gems unchanged | Product/fixture mismatch; verify currency selection and modal owner |
| 28–31 | `ui-qa-touch-drift-and-viewport-adversarial.spec.ts` — four viewports | Fixed canvas navigation does not reach `MapScene` | Stale coordinate navigation; retain coordinate geometry coverage through helper |
| 32 | `wardrobe-hybrid-shop-visual.spec.ts` — 10 screenshot matrix | 30 s timeout during compact viewport sequence | Intentional visual evidence run exceeds default timeout; bound the evidence test, not global timeouts |
| 33 | `wardrobe-hybrid-shop-visual.spec.ts` — stage geometry | Full-body visible character width 44.2 px; expected >70 px | Reproduced visual/layout defect; `ShopScene`/`wardrobeLayout` owner |

## No-skip policy and evidence notes

- No tests were skipped, deleted or marked expected-fail in this baseline.
- The four historical public-host probes are not interchangeable with local
  browser coverage. Task C will give them a runnable `test:e2e:live` config that
  requires an explicit URL and source SHA, and will report unavailable hosting
  as `ENVIRONMENT_BLOCKED`, never as a pass.
- Coordinate failures are not assumed to be harmless. Task B must preserve the
  underlying hit-area, reward, purchase, answer and save assertions while moving
  navigation to the actual DOM owner where the responsive layer is mounted.
- The wardrobe geometry failure is treated as a product visual defect until an
  isolated rerun proves the fixture itself is wrong.
- Existing browser warnings include suspended AudioContext in headless Chromium;
  they are recorded for Task E and are not swallowed by the harness.

## Baseline next action (completed)

Task B migrated the affected local browser specs using semantic controls for DOM
surfaces and logical-to-display coordinate mapping for genuine Phaser surfaces;
the final collection and disposition are recorded below.

## Task B resolution

Final source-tree rerun: `CI=1 PLAYWRIGHT_JSON_OUTPUT_NAME=docs/qa/release-hardening/task-b-results.json npm run test:e2e -- --reporter=list,json --retries=0`

| Result | Count | Disposition |
|---|---:|---|
| Passed local regression | 88 | Resolved/verified; no local failures or skips |
| Public-host failures | 4 | Carried forward to Task C deployed-smoke configuration |

The local failures from rows 1–9, 14–32 and 33 were migrated or fixed without
removing their intent. DOM-owned Home/Map/Question interactions now use visible
semantic controls; duplicate sentence tokens still select the first remaining
match; Runner/Shop retain logical canvas coordinate checks; and the wardrobe
visual assertion now passes repeatedly after restoring full-body wearing art and
stage-derived scale/grounding. The purchase regression also proves the selected
currency and reward-ledger transaction remain atomic.

Rows 10–13 are intentionally not relabeled as local product failures. They are
the four existing live GitHub Pages probes and remain external/deployed evidence:
the current host returned `ERR_EMPTY_RESPONSE` for two tests, while the other
two still use the old live canvas contract. Task C will keep them runnable under
`test:e2e:live` with explicit URL/source identity and will report unavailable
hosting as `ENVIRONMENT_BLOCKED`, never as a pass.

The complete JSON report is `task-b-results.json`; no test was skipped, deleted
or marked expected-fail to obtain this result.

## Task C resolution

Task C separated deployment-dependent evidence from the local release gate
without removing any historical assertion:

- The five preserved live specs now live under `e2e/live/` and are collected by
  `playwright.live.config.ts`. A sixth `deployed-smoke.spec.ts` checks exact
  source identity, resource/page errors, the semantic learning journey and save
  reload. `npm run test:e2e:live` requires `LIVE_BASE_URL` and
  `EXPECTED_SOURCE_SHA`; it has no local preview server and cannot silently
  fall back to localhost.
- The local Playwright config ignores only `e2e/live/`. A fresh full local run
  on the Task C source collected 87 tests and passed 87 with zero skips. Its
  JSON report is `task-c-results.json`.
- The public Pages index was reachable with HTTP 200, but
  `https://hkspurs.github.io/phonics_game/build-info.json` returned HTTP 404 on
  the fresh probe. The current public page therefore cannot prove the source
  SHA for this branch; this remains `ENVIRONMENT_BLOCKED` until the normal
  branch publication path serves the identity file. No live test was relabeled
  as passed on that basis.
- `.github/workflows/ci.yml` now provides visible PR unit/build/local-browser
  checks with bounded artifacts. The existing deployment workflow verifies the
  emitted SHA before it publishes and remains a separate, non-PR trigger.

The timeout adjustment in Chaos 3 is harness-only: it accommodates the
reproduced 50-drag stress sequence on a loaded worker, while preserving all
pointer events and page-error assertions. No test was deleted, skipped or
marked expected-fail.
