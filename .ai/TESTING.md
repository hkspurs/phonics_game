# Testing & Verification Guide

## 1. Available Test & Build Commands

### A. Run Unit Test Suite
```bash
npm run test:unit
```
- **Engine**: Vitest
- **Scope**: 63 test suites covering DataManager, QuestionEngine, SentenceEngine, MathGenerator, RunnerScene physics, Wardrobe preview, and responsive presentation contracts.
- **Pass Criteria**: 100% tests green (1,940 / 1,940).

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
- Runs Playwright tests against built bundle.

For the responsive storybook surface, the focused regression command is:

```bash
npx playwright test e2e/responsive-layout.spec.ts e2e/math-speech-and-layout.spec.ts e2e/sentence-correction-flow.spec.ts e2e/sentence-tap-and-button-hover.spec.ts
```

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

`npm run test:e2e` is useful for regression discovery but is not yet an
all-green release gate. The repository contains older tests that click hidden
Phaser canvas coordinates, inspect pre-migration canvas card state, or reach
the external `hkspurs.github.io` host. With the DOM question surface now owning
input, those suites can fail even when the supported semantic path is green.
The Phase 8–9 changelog records the latest full-collection count and the
follow-up is to migrate or retire those obsolete assertions.

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
  publishes `dist/` to GitHub Pages on pushes to `main`, `master` or
  `p1-adventure`. A push to `codex/p1-storybook-ux` only updates the review
  branch; merge into `p1-adventure` is the deployment trigger.
- Rollback means restoring the known previous source/build commit and
  rebuilding. Never delete `p1_adventure_save_v1` from player browsers.
