# Simple Word Rewards and Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each Simple Word test use 16 unique words, award diamonds from first-try answers, and persist market purchases across browser restarts.

**Architecture:** Keep the existing 16-word queue and per-word review stats. Remove only the in-session delayed duplicate; wrong attempts remain retries on the current word. Add one pure diamond calculation plus a store action used by the completion screen, and include `inventory`/`equipped` in the existing Zustand persisted slice with a migration default.

**Tech Stack:** React, Zustand `persist`, Vitest, Testing Library.

## Global Constraints

- A Simple Word session contains at most 16 distinct words.
- First-try correct answers earn 1 diamond each; retries earn 0; all 16 first-try correct earns a 2-diamond bonus.
- Existing review stats and teacher/generated audio behavior remain unchanged.
- No new dependency.

### Task 1: Unique Simple Word sessions

**Files:**
- Modify: `src/game/simpleWordReview.js`
- Test: `src/game/simpleWordReview.test.js`
- Test: `src/screens/SimpleWords.test.jsx`

- [x] Update the screen regression sequence so a wrong answer retries the same question but the completed 16-question session contains no repeated word.
- [x] Run the focused screen test and observe the old delayed-review behavior fail.
- [x] Remove the `scheduleDelayedReview` call and unused helper/import/test; keep `buildSimpleWordQueue` capped at 16.
- [x] Run the focused tests and verify the session completes with 16 distinct words.

### Task 2: Diamond scoring

**Files:**
- Modify: `src/game/simpleWordReview.js`
- Test: `src/game/simpleWordReview.test.js`
- Modify: `src/store/gameStore.js`
- Test: `src/store/gameStore.baseline.test.js`
- Modify: `src/screens/SimpleWords.jsx`
- Test: `src/screens/SimpleWords.test.jsx`

- [x] Add failing unit cases for 0, partial, and perfect first-try scores.
- [x] Run them and verify the scoring function is missing.
- [x] Add `calculateSimpleWordGems(firstTryHits, totalWords)` and `awardSimpleWordGems(firstTryHits, totalWords)`; clamp the hit count to the session size and add the perfect-session bonus.
- [x] On final completion, use the updated hit count, award the store gems once, reset the local reward on restart, and show the earned diamond count.
- [x] Run focused store and screen tests and verify partial and perfect scoring.

### Task 3: Persist market purchases

**Files:**
- Modify: `src/store/gameStore.js`
- Test: `src/store/gameStore.baseline.test.js`

- [x] Add a failing persistence assertion requiring `inventory` and `equipped` in `partialize`, plus migration defaults for old records.
- [x] Run the store test and verify the fields are absent from the current persisted slice.
- [x] Add both fields to `partialize`, initialize missing values in migration, and bump persistence version from 5 to 6.
- [x] Run store tests and verify purchased/equipped values survive serialization and migration.

### Task 4: Full verification

**Files:**
- No new source files.

- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Run `git diff --check` and confirm the working tree contains only this feature and the plan.
