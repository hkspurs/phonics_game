# Whole Game Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing phonics, maths, brain-games, reward and shop screens into one coherent child-first adventure experience while preserving learning logic, audio contracts, diamond persistence and all existing direct routes.

**Architecture:** Add a small shared experience layer for navigation, mission framing, progress and responsive visual tokens. Add Phaser only as a lazy-loaded Adventure World for the new CVC blending route; React remains the owner of question rendering, keyboard input, answer validation, accessibility, Zustand state and AudioEngine playback. Existing game engines remain intact and are reached through redesigned hubs.

**Tech Stack:** Existing React 18 + React Router + Zustand + Vite + Vitest/RTL + Playwright, plus Phaser loaded only by the blending Adventure route.

## Global Constraints

- `/phonics`, `/simple-words`, `/math`, `/math/map`, `/gym`, `/challenge`, `/braingames`, `/shop` and `/parent` remain directly reachable.
- CVC/Sample Word content is grouped under a separate `學習拼音併音` theme and is not mixed with `英語拼音森林` content.
- Phaser owns only Adventure-world presentation and never owns phonics answers, Zustand state, routing or teaching audio.
- Existing `AudioEngine` and Fish MP3 URLs remain the only source of phonics word audio; no browser TTS or runtime audio concatenation is added.
- Existing diamond, star, ticket, inventory and equipped persistence remains compatible with `phonics-game-storage`.
- The child-facing flow must work at 320px mobile width and iPad landscape; remove the old landscape-blocking overlay.
- Animations are short, purpose-linked and reduced-motion safe; no timers, accuracy percentages or punishment are added to CVC learning.
- Every new behavior gets a focused unit/component test before production code, then a Playwright evidence path.
- Three UAT cycles are required after the first implementation: QA evidence report → developer fixes → re-test, repeated three times.

---

### Task 1: Add the shared experience visual system and navigation frame

**Files:**
- Create: `src/components/ExperienceFrame.jsx`
- Create: `src/components/WorldProgress.jsx`
- Create: `src/components/ExperienceFrame.test.jsx`
- Create: `src/styles/experience.css`
- Modify: `src/index.css`

**Interfaces:**
- `ExperienceFrame({ world, title, subtitle, progress, backTo, children })` renders a responsive page frame with a consistent top bar, currency summary, parent/shop actions and one primary child action area.
- `WorldProgress({ steps, activeStep, label })` renders accessible progress without exposing accuracy percentages.

- [ ] Write failing tests for frame landmarks, currency display, back navigation, progress labels, 320px overflow and reduced-motion class behavior.
- [ ] Run `npm test -- src/components/ExperienceFrame.test.jsx` and confirm the new tests fail because the components do not exist.
- [ ] Implement the components using the existing `useGameStore`, `useNavigate`, `useTranslation`, `MascotRabbit` and Lucide icons.
- [ ] Replace the orientation warning in `src/index.css` with responsive landscape-safe layout rules and import the new experience stylesheet.
- [ ] Run the focused tests and `git diff --check`.

### Task 2: Add the lazy Phaser Adventure World bridge

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/adventure/AdventureScene.js`
- Create: `src/components/PhaserAdventureWorld.jsx`
- Create: `src/components/PhaserAdventureWorld.test.jsx`
- Create: `src/adventure/adventureEvents.js`
- Create: `src/adventure/adventureEvents.test.js`

**Interfaces:**
- `createAdventureEvent(type, payload)` returns a serializable event `{ type, payload }`.
- `PhaserAdventureWorld({ progress, phase, feedback, reducedMotion, onReady, onContinue })` mounts a responsive Phaser canvas only after the component is mounted, forwards read-only events into the scene and destroys the Phaser game on unmount.
- The scene exposes `setAdventureState(state)` and never imports the Zustand store or `AudioEngine`.

- [ ] Add the approved Phaser dependency without changing any existing route behavior.
- [ ] Write event and lifecycle tests with a mocked Phaser module; cover ready, progress update, feedback update, unmount cleanup and reduced motion.
- [ ] Run the focused tests and confirm they fail before implementation.
- [ ] Implement a three-node Rabbit House → River Bridge → Carrot Castle scene using simple Phaser primitives, not new image/audio assets.
- [ ] Implement React fallback markup when Phaser import or game creation fails.
- [ ] Run focused tests, production build and `git diff --check`.

### Task 3: Create the independent CVC theme and Adventure blending route

**Files:**
- Create: `src/screens/BlendingHub.jsx`
- Create: `src/screens/BlendingHub.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/screens/HomeDashboard.jsx`
- Modify: `src/screens/SimpleWords.jsx`
- Modify: `src/screens/SimpleWords.test.jsx`
- Modify: `src/game/simpleWordLearning.js`
- Modify: `src/game/simpleWordLearning.test.js`

**Interfaces:**
- `/blending` is the independent `學習拼音併音` hub with only `Learn to Blend` and `Simple Word` actions.
- `SimpleWords` accepts `?adventure=1&sessionSize=5` for the new route while preserving the existing 16-word default when those params are absent.
- `SimpleWords` sends `WORD_STARTED`, `LETTER_PROGRESS`, `ANSWER_RESULT` and `SESSION_COMPLETE` state into `PhaserAdventureWorld`; React remains the answer authority.

- [ ] Write failing route and screen tests for the separate theme, two entry cards, five-word Adventure session, Learn → Test flow, React fallback and preserved old 16-word route.
- [ ] Run the focused tests and confirm the new expectations fail.
- [ ] Implement the hub and route without removing old `/simple-words` direct links.
- [ ] Integrate the Phaser world into Adventure mode only; keep existing audio, stats, diamond reward and keyboard logic.
- [ ] Add Rabbit reactions, sound-bubble/letter progress and checkpoint copy without adding a second reward system.
- [ ] Run all Simple Word tests, build and the existing simple-word Playwright suite.

### Task 4: Redesign the whole-game hubs and reward loop

**Files:**
- Modify: `src/screens/SubjectGateway.jsx`
- Modify: `src/screens/HomeDashboard.jsx`
- Modify: `src/screens/MathHome.jsx`
- Modify: `src/screens/MathMasteryMap.jsx`
- Modify: `src/screens/BrainGamesIsland.jsx`
- Modify: `src/screens/RewardScreen.jsx`
- Modify: `src/screens/Shop.jsx`
- Modify: `src/screens/ParentDashboard.jsx` only where shared navigation requires it
- Create/extend: focused tests beside each redesigned screen

**Interfaces:**
- Main home presents distinct world cards: `學習拼音併音`, `英語拼音森林`, `Math Adventure`, `Brain Games Island`.
- Every hub has a clear next action, progress context, back/home route and currency access.
- Shop adds cosmetic-only diamond items and uses existing `buyItem`/`equipItem` persistence; no gameplay power purchase is introduced.

- [ ] Write failing screen tests for the world separation, clear primary actions, mobile card order, shop cosmetics and reward next-step navigation.
- [ ] Run focused tests and confirm failure.
- [ ] Implement the shared frame across the hubs, retaining existing question engines and math generators.
- [ ] Add a small set of emoji-based cosmetic items and render equipped state consistently through `MascotRabbit`.
- [ ] Add completion cards that route children to the next learning action or an optional cosmetic reward, without exposing negative scores.
- [ ] Run all Vitest tests and targeted Playwright tests for phonics, math, brain games, shop and reload persistence.

### Task 5: Add the evidence-based QA capture harness

**Files:**
- Create: `scripts/qa-playwright-capture.mjs`
- Create: `qa-playwright-capture.sh`
- Create: `tests/whole-game-experience.spec.js`
- Modify: `package.json`

**Interfaces:**
- `./qa-playwright-capture.sh <baseUrl> <outputDir>` captures desktop 1920×1080, tablet 768×1024 and mobile 375×667 evidence, writes screenshots and `test-results.json`, and records console/page errors.
- The Playwright suite covers all primary worlds, CVC learn/test, Phaser fallback, Shop purchase/reload, Math start/reward and Brain Games ticket gating.

- [ ] Write the Playwright scenarios and capture manifest before implementation; prove the new test fails against the old UI where applicable.
- [ ] Implement the capture script with explicit screenshots and JSON evidence, not a pass/fail-only smoke test.
- [ ] Run the suite against a production-like server and inspect screenshots with visual tools.
- [ ] Keep the output directory ignored or outside tracked source so evidence does not pollute commits.

### Task 6: Execute the required three UAT → developer-fix cycles

**Files:**
- Evidence: `public/qa-screenshots/uat-1/`, `public/qa-screenshots/uat-2/`, `public/qa-screenshots/uat-3/`
- Reports: `docs/qa/whole-game-uat-1.md`, `docs/qa/whole-game-uat-2.md`, `docs/qa/whole-game-uat-3.md`

- [ ] Run the `testing-evidence-collector` process for UAT 1; require screenshots, interaction evidence, exact specification comparisons and at least three realistic findings.
- [ ] Dispatch a developer agent with only UAT-1 actionable findings; inspect its diff and run targeted tests.
- [ ] Re-run the evidence collector for UAT 2 and save a fresh report.
- [ ] Dispatch a developer agent for UAT-2 findings; inspect its diff and run targeted tests.
- [ ] Re-run the evidence collector for UAT 3 and resolve every critical/important finding before completion.
- [ ] Run `npm test`, `npm run build`, `npx playwright test`, audio QA and the real-asset checks after the final UAT.

### Task 7: Commit, push and deploy with a completion audit

- [ ] Review the requirement checklist against current files, tests, screenshots and live behavior.
- [ ] Commit implementation and QA reports in focused commits.
- [ ] Push `main`, deploy GitHub Pages and verify the live entry route, CVC Adventure, Phaser bundle and audio URLs.
- [ ] Report any remaining limitations honestly; do not claim completion without evidence from all three UAT rounds.
