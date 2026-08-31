# Testing & Quality Assurance Protocol

## 1. Test Suites Overview
The project contains **43 test suites** and **1,120 unit tests** ensuring zero regressions across all game mechanics.

### Key Test Suites:
- `src/services/DataManager.test.ts`: Currency math, inventory save/load, profile migration.
- `src/scenes/QuestionScene.test.ts`: Choice quizzes, sentence scrambling, reset clearing, audio triggers.
- `src/scenes/RunnerScene.test.ts`: Kinematics, gravity, jump/double jump, springboard, coin magnet, obstacle damage.
- `src/test/wardrobe-preview-system.test.ts`: 18 wardrobe items, 5 full outfits, mutual exclusivity.
- `src/test/gamer-tester-*.test.ts`: Adversarial edge case hunting (currency exploits, coordinate drift, slot desync).

---

## 2. Mandatory Verification Commands

### A. Run All Unit Tests
```bash
npm run test:unit
```
*Criteria*: All 43 test suites must pass (100% green, 0 failures).

### B. Build Production Bundle
```bash
npm run build
```
*Criteria*: TypeScript typecheck (`tsc`) passes with 0 errors, Vite outputs `dist/`.

### C. Sync Distribution Bundle
```bash
rm -rf docs/*
cp -r dist/* docs/
cp -r docs/* /data/phonics_game/docs/
```

### D. Multi-Branch Parity Verification
```bash
git push origin master
git push origin master:main
git push origin master:p1-adventure
```
