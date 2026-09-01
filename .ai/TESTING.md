# Testing & Verification Guide

## 1. Available Test & Build Commands

### A. Run Unit Test Suite
```bash
npm run test:unit
```
- **Engine**: Vitest
- **Scope**: 43 test suites / 1,321 tests covering DataManager, QuestionEngine, SentenceEngine, MathGenerator, RunnerScene physics, Wardrobe preview, and reduced-motion scene guards.
- **Pass Criteria**: 100% tests green (1,321 / 1,321).

If the default parallel Vitest run hits a native worker crash in this workspace,
repeat the same suite serially with `npm run test:unit -- --maxWorkers=1
--minWorkers=1` before diagnosing an application assertion failure.

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

---

## 2. Manual Visual Verification Checklist
- [ ] **Wardrobe Preview**: Outfit sprite uses the responsive `getWardrobeLayout(...).character.scale` on the showcase pedestal with no overflow.
- [ ] **Angel Wings**: Renders strictly behind character torso (Depth 35).
- [ ] **Runner Jump**: Dynamic contact shadow shrinks smoothly during jump and restores on landing.
- [ ] **OOTD Photo Booth**: Polaroid modal displays high-contrast card with washi tape corners and correct character outfit.
- [ ] **Question Scramble**: Tapping word tokens snaps cleanly into target slots with no text clipping.
