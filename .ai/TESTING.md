# Testing & Verification Guide

## 1. Available Test & Build Commands

### A. Run Unit Test Suite
```bash
npm run test:unit
```
- **Engine**: Vitest
- **Scope**: 63 test suites covering DataManager, QuestionEngine, SentenceEngine, MathGenerator, RunnerScene physics, Wardrobe preview, and responsive presentation contracts.
- **Pass Criteria**: 100% tests green (1,941 / 1,941).

### B. Build Production Bundle
```bash
npm run build
```
- **Engine**: TypeScript compiler (`tsc`) + Vite
- **Output**: `dist/` directory with optimized JavaScript and assets.

### C. Local Development Server
```bash
npm run dev
```
- Starts Vite dev server at `http://localhost:5173`.

### D. Production Preview
```bash
npm run preview
```
- Previews production bundle at `http://localhost:4173`.

### E. E2E & Visual Testing
```bash
npm run test:e2e
```
- Runs the 87-test local Playwright collection against the built bundle. The
  external deployment checks are intentionally collected by the separate
  `test:e2e:live` command below, never by an implicit localhost fallback.

For deployed-host verification, provide both an explicit URL and the SHA that
should be serving it:

```bash
LIVE_BASE_URL=https://hkspurs.github.io/phonics_game/ \
EXPECTED_SOURCE_SHA=<published-commit-sha> \
npm run test:e2e:live
```

`playwright.live.config.ts` has no `webServer` and only collects `e2e/live/`.
The suite includes the five preserved historical live probes plus
`deployed-smoke.spec.ts`, which polls `build-info.json`, checks static-resource
and page errors, follows Home → Map → station → Question → answer → Continue,
and verifies the existing save key survives reload. Missing URL/SHA is an
explicit environment error, not a test skip.

For the responsive storybook surface, the focused regression command is:

```bash
npx playwright test e2e/responsive-layout.spec.ts e2e/math-speech-and-layout.spec.ts e2e/sentence-correction-flow.spec.ts e2e/sentence-tap-and-button-hover.spec.ts
```

The release-hardening completion gate additionally requires installed Google
Chrome (`channel: 'chrome'`) at 375×667, 390×844, 430×932, 667×375, 844×390,
768×1024 and 1280×800. Bundled Chromium results remain useful regression
evidence but must not be labelled Google Chrome evidence. Physical-device,
Safari and Firefox checks are OUT_OF_SCOPE under the revised acceptance.

Focused release visual/accessibility evidence:

```bash
npx playwright test e2e/visual-release.spec.ts e2e/accessibility-release.spec.ts --retries=0
```

This captures nine release screens at the seven agreed CSS viewport sizes and
checks horizontal overflow, named keyboard controls, focus return, Escape,
forced colors and reduced motion. Screenshot attachments belong in Playwright
artifacts, not tracked image directories. Use a QA host with Noto Sans TC and
an emoji font; font promises alone do not prove readable glyph rendering.

The phases 0–7 verification run passed five tests across those files. The
manual smoke flow also covers Home → Map → station detail → choice question →
sentence scramble → Result at 844×390.

The Phase 8–9 release gates are:

```bash
npx playwright test \
  e2e/phase8-support-destinations.spec.ts \
  e2e/phase8-9-full-journey.spec.ts \
  e2e/phase9-viewport-accessibility.spec.ts
```

These gates use real buttons, word chips, dialog controls and the visible
Runner skip confirmation. They cover Settings/Trophy/Report, wrong answer →
hint → correct pacing, explicit Continue, result storage stability, Shop →
Home, the seven viewport sizes (375×667, 390×844, 430×932, 667×375,
844×390, 768×1024 and 1280×800) and portrait rotation. The current run passed
all five tests.

The local collection is an all-green release gate on the Task C source:
`CI=1 ... npx playwright test --reporter=list,json --retries=0` passed 87/87
with zero skips. Genuine public-host evidence is a separate gate so transport,
deployment age and source identity are not confused with local product
regressions.

---

## 2. Manual Visual Verification Checklist
- [ ] **Wardrobe Preview**: Outfit sprite loads at correct scale (0.23x) on showcase pedestal with no overflow.
- [ ] **Angel Wings**: Renders strictly behind character torso (Depth 35).
- [ ] **Runner Jump**: Dynamic contact shadow shrinks smoothly during jump and restores on landing.
- [ ] **OOTD Photo Booth**: Polaroid modal displays high-contrast card with washi tape corners and correct character outfit.
- [ ] **Question Scramble**: Tapping word tokens snaps cleanly into target slots with no text clipping.
- [ ] **Responsive flow**: At 844×390, Home, Map, station detail, Question, and Result views fit within the safe area, expose a visible focus state, and keep primary actions at least 48px high.
- [ ] **Supporting destinations**: At 844×390 and 1280×800, Settings, Trophy and Diagnostic Report wrap without clipping; headings, live status and dialog focus remain usable by keyboard; reset requires an explicit confirmation.
- [ ] **Release screenshots**: Capture Home, Map, station detail, Question, Result, Shop, Settings, Trophy and Report in the supported matrix. Inspect Traditional Chinese glyphs, long prompts, scroll endpoints, safe-area padding and character layering on a host with the intended fonts.

## 3. Release evidence and deployment

- Record `localStorage.getItem('p1_adventure_save_v1')` before and after
  result navigation. Parse the JSON and reconcile `completedStations`,
  balances and unique `rewardLedger.transactionId` values.
- Measure payload with `du -sh public/assets` and the generated bundle size;
  report the values instead of claiming a universal frame rate.
- `.github/workflows/deploy.yml` runs unit tests and `npm run build`, then
  verifies `dist/build-info.json.sourceSha` against the publishing SHA and
  publishes `dist/` to GitHub Pages on pushes to `main`, `master` or
  `p1-adventure`. A push to `codex/p1-release-hardening` only updates review
  evidence; merge into `p1-adventure` is the deployment trigger.
- The current public index returned HTTP 200, but its
  `/build-info.json` probe returned HTTP 404, so the source identity and live
  interaction for the release-hardening branch remain `ENVIRONMENT_BLOCKED`
  until a normal Pages publication serves the file. No deployment was run in
  Task C.
- Rollback means restoring the known previous source/build commit and
  rebuilding. Never delete `p1_adventure_save_v1` from player browsers.
