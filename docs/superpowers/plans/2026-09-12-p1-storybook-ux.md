# P1 Adventure: UI, UX and Graphics Implementation Plan

> **For agentic workers:** Execute this plan task by task using `superpowers:executing-plans`. Keep implementation in the current session unless delegation is explicitly requested. Record evidence before marking any task complete.

**Goal:** Turn the existing P1 Adventure game into a coherent, welcoming, readable learning adventure that a Primary One child can navigate independently on a phone, tablet or desktop.

**Architecture:** Retain Phaser for the running game, animation and character composition. Introduce responsive DOM presentation for reading-intensive screens through explicit scene adapters. Extract learning-session decisions from rendering where necessary, while keeping existing question engines, reward transactions and save storage authoritative.

**Tech stack:** Existing TypeScript, Phaser 3, Vite, Vitest and Playwright. Use semantic HTML and CSS without adding a frontend framework. Generate raster scenery with ImageGen; retain and validate existing character assets.

**Spec:** The user-approved direction is “bright Japanese picture-book adventure, child-friendly navigation, responsive reading and consistent artwork.” This document expands that approved direction into the implementation specification and execution sequence.

**Repository:** `hkspurs/phonics_game`. **Target branch:** `p1-adventure`. **Working branch:** `codex/p1-storybook-ux`. **Baseline:** commit beginning `d1cd745`.

## 1. Starting evidence and scope

The repository has already been downloaded and inspected. `AGENTS.md` requires shared task registration, ownership checks, verification and completion notes. The inspected `.ai/TASK_BOARD.md` reports no active tasks, and `.ai/OWNERSHIP.md` contains no actual locks. Recheck both before implementation because another developer may start work after this inspection.

The application uses a fixed 1280 × 720 Phaser canvas with `Scale.FIT`. This scales the complete screen rather than reflowing its contents. At a 390 CSS-pixel viewport width, a 22-pixel canvas label can appear approximately 6.7 CSS pixels tall when width is the limiting dimension. That calculation identifies a structural risk; it does not establish that every device or orientation exhibits that exact size.

The desktop homepage was rendered locally. Its character, dark title panel, saturated buttons and simple landscape use competing visual treatments. Several controls combine an emoji label with a separate icon. The local screenshot also contains missing Chinese glyphs because the test environment lacks suitable fonts; investigate font availability separately from production rendering.

Source inspection confirms that `QuestionScene.onCorrectAnswer()` schedules a transition after 1,200 milliseconds and permits broad tap-to-continue behavior. This is too short for the intended explanatory feedback and creates accidental navigation risk. The replacement interaction will wait for an explicit Continue action.

Baseline unit verification: **62 suites and 1,934 tests passed** using `NODE_OPTIONS=--no-experimental-global-navigator`. Without that flag, Node 24 rejects the test setup's assignment to its read-only `navigator` property before tests execute. Resolve this test-harness compatibility issue; do not describe it as 62 application regressions. Existing console warnings also require triage, rather than claiming a warning-free baseline.

This plan covers home, map, questions, runner presentation, results, wardrobe, supporting screens, artwork, accessibility and release verification. It does not expand the curriculum, redesign the economy or introduce accounts. The current implementation request remains authorized; this document is the detailed execution plan requested during that work.

## 2. Product principles and measurable completion criteria

The child should always understand three things: where they are, what to do next and what happened after their action. Every screen therefore has one visually dominant action, concise Cantonese-friendly Traditional Chinese instructions, and a predictable place for navigation. English remains visible where it is learning content.

Reading screens use actual CSS-pixel typography: primary questions at least 24 pixels, answers at least 22 pixels, supporting instructions at least 18 pixels and secondary metadata at least 16 pixels. Buttons have a minimum 48 × 48 CSS-pixel interactive region. Adjacent targets have at least eight pixels of separation. These are acceptance targets, not statements about the present implementation.

No required content may depend on horizontal scrolling. Vertical scrolling is acceptable on reading and collection screens. Background decoration must not obscure text. Correctness, ownership and disabled states need wording or symbols as well as color. Keyboard users must reach the same primary actions as touch users.

Saved balances, unlocked stations, owned items, equipped clothing and learning records must survive the presentation change. A retry, double tap, scene restart or orientation change must not grant duplicate rewards. No new screen may maintain an independent balance or grading implementation.

Completion requires before-and-after screenshots, a reproducible browser walkthrough, passing relevant regression tests and an exact tested commit. A visually pleasing homepage alone does not satisfy this plan.

## 3. Phase 0 — Establish a reproducible baseline

**Files:** `.ai/TASK_BOARD.md`, `.ai/OWNERSHIP.md`, `.ai/TESTING.md`, `src/test/setup.ts`, `e2e/`, and this plan.

- [ ] **Step 0.1:** Fetch the current target branch, record its full SHA, inspect `git status` and recent history, and compare it with the inspected baseline. Read shared coordination files again. Preserve unrelated changes.
- [ ] **Step 0.2:** Register `TASK-20260912-STORYBOOK-UX` as in progress and claim only the modules currently being edited. If a genuine ownership conflict appears, stop that conflicting edit and report the exact module.
- [ ] **Step 0.3:** Install using the existing lockfile. Run unit tests and the production build separately. Save exit codes and summaries; separate environment failures from application failures.
- [ ] **Step 0.4:** Replace the fragile global `navigator` assignment with a configurable property definition in test setup. Verify the normal test command works on the active runtime without the temporary flag.
- [ ] **Step 0.5:** Capture home, map, representative Chinese/English/math questions, runner, result and shop screenshots. Use a fresh save and a representative progressed save. Label screenshots with viewport and commit.
- [ ] **Step 0.6:** Create a defect table with reproduction steps, impact, evidence and intended fix. Treat a blocked primary action as P0; unreadable content or misleading state as P1; decorative inconsistency as P2.

**Acceptance:** The baseline can be reproduced, existing failures are accounted for, and subsequent changes have a trustworthy comparison. Commit the test-harness repair independently from visual changes.

## 4. Phase 1 — Define the visual system and artwork contract

**Files:** `src/ui/DesignTokens.ts`, `src/ui/theme.ts`, new `src/presentation/storybook.css`, `public/assets/storybook/`, and `docs/art/storybook-style-guide.md`.

- [ ] **Step 1.1:** Establish warm paper backgrounds, dark forest text, sage panels, restrained coral emphasis and honey-colored rewards. Proposed starting colors are paper `#FFF9ED`, ink `#243E35`, sage `#DCEAD7`, coral `#BD513D` and honey `#F2C567`. Measure final text combinations before approval through visual QA.
- [ ] **Step 1.2:** Define spacing at 4, 8, 12, 16, 24, 32 and 48 pixels. Use consistent 16–24 pixel panel radii, subtle shadows and clear borders. Avoid glossy button caps and heavy black outlines in the reading interface.
- [ ] **Step 1.3:** Define primary, secondary, quiet, destructive, selected, disabled, correct and retry component states. A primary action uses one shared treatment across all screens. Purchasing and continuing should not randomly change visual meaning.
- [ ] **Step 1.4:** Select a Traditional Chinese-capable font strategy with system fallbacks. Install an appropriate font in the QA environment or bundle a licensed subset when justified. Document licensing and verify both Chinese and Latin glyphs before taking final screenshots.
- [ ] **Step 1.5:** Review the newly generated woodland background as an art candidate. It is not yet an integrated or approved production asset. Check empty space, crop behavior and contrast behind UI. Export an optimized game asset after visual review.
- [ ] **Step 1.6:** Inspect existing character poses, transparency and baseline alignment. Retain acceptable sprites; commission replacements only for concrete defects. Follow the existing 512 × 512 master convention and document pose-specific exceptions such as jumping.
- [ ] **Step 1.7:** Use consistent code-native icons for controls and raster illustrations for scenery. Remove duplicated emoji-plus-icon combinations. Keep accessible text labels even when a visual icon is present.

**Acceptance:** A component specimen page demonstrates every state, long Chinese labels, English words, disabled controls and focus indicators. Scenery is decorative, while questions remain on calm opaque surfaces.

## 5. Phase 2 — Build the responsive presentation foundation

**Files:** `src/main.ts`, `index.html`, new `src/presentation/ScreenHost.ts`, `components.ts`, `types.ts`, `storybook.css`, and scene adapters.

Simply changing the canvas dimensions would leave hundreds of fixed coordinates and risk breaking physics. The proposed boundary therefore separates readable interface layout from the runner's world coordinates. Phaser remains the scene coordinator; a responsive screen host owns DOM content for migrated screens.

- [ ] **Step 2.1:** Add a dedicated interface root beside the canvas. `ScreenHost.mount(view)` replaces the current presentation and `unmount()` removes listeners, observers and pending interface work. Hook cleanup to scene shutdown and game destruction.
- [ ] **Step 2.2:** Define typed view models and action callbacks. Components receive immutable display data and invoke explicit actions. They must not parse canvas text, access private button configuration or fake Phaser pointer events.
- [ ] **Step 2.3:** Migrate one screen at a time. Each migrated scene chooses one interactive renderer; it must not leave an invisible second interface accepting input underneath. Avoid per-frame DOM reconstruction and continuous hidden animation loops.
- [ ] **Step 2.4:** Use content-driven CSS Grid and Flexbox layouts. Starting layout modes are compact below 600 pixels, medium from 600–1023 and wide from 1024. A short viewport must trigger compact spacing independently of width.
- [ ] **Step 2.5:** Apply safe-area insets, dynamic viewport units and normal vertical scrolling. Remove global rules that block document scaling or scrolling where they are unnecessary. Scope `touch-action: none` to the runner's interactive canvas and controls.
- [ ] **Step 2.6:** Preserve focus during view updates. On navigation, move focus to the new heading; on modal close, return it to the opener. Dialogs need Escape handling, focus containment and a visible close action.
- [ ] **Step 2.7:** Add a lifecycle regression that mounts, updates, unmounts and revisits screens repeatedly. Confirm one click invokes one action and detached controls cannot invoke old callbacks.

**Acceptance:** A 390-pixel portrait screen has readable controls without horizontal overflow. Rotation preserves the session and focus remains meaningful. Existing Phaser scene payloads remain compatible.

## 6. Phase 3 — Rebuild the homepage around the next adventure

**Files:** `src/scenes/TitleScene.ts`, new `HomeView.ts`, `homeModel.ts`, and presentation tests.

- [ ] **Step 3.1:** Replace the dark title plaque and competing animations with a clean heading, a short welcome and a coherent woodland composition. Place the character alongside the primary action on wide screens and above it on compact screens.
- [ ] **Step 3.2:** Show “開始冒險” for a new profile and “繼續冒險” for a progressed profile. “Continue” means opening the current station selection unless a resumable in-progress session already exists; do not imply unsupported mid-question recovery.
- [ ] **Step 3.3:** Add one compact destination card containing the next station, earned progress and a short instruction. Derive completion from completion records, not simply the highest unlocked station number.
- [ ] **Step 3.4:** Group wardrobe and collection as secondary child-facing destinations. Move detailed learning reports and settings into a clearly labeled supporting area. Keep every existing feature reachable; reduce competing emphasis instead of silently deleting features.
- [ ] **Step 3.5:** Show coins and gems in compact labeled counters. Avoid presenting multiple currencies, streaks and task counters as equally important. Daily rewards must display authoritative daily state rather than infer it from lifetime correct answers.
- [ ] **Step 3.6:** Remove continuously pulsing title text. Use a brief entrance animation and optional gentle character motion, both disabled under reduced-motion preference.

**Acceptance:** The child can identify the primary action immediately, every destination works, and the page remains balanced on portrait and landscape screens with fresh and progressed profiles.

## 7. Phase 4 — Make station selection clear and navigable

**Files:** `src/scenes/MapScene.ts`, new `MapView.ts`, `stationModel.ts`, and station-navigation browser tests.

- [ ] **Step 4.1:** Reuse `STATIONS` as the authoritative station catalog. Preserve names, sequence, availability and payloads. Do not replace the current woodland stations with unrelated locations suggested by older decorative copy.
- [ ] **Step 4.2:** Present a winding illustrated route on spacious screens and a vertical route on phones. The current station receives a clear “下一站” label. Completed stations display earned stars; locked stations explain the prerequisite.
- [ ] **Step 4.3:** Scroll the current station into view without trapping manual scrolling. Provide a “返回目前關卡” control only when useful. Decorative map elements must never intercept station taps.
- [ ] **Step 4.4:** Replace the cramped station modal with a responsive detail panel containing the station name, three subject activities, earned stars and one entry button. Preserve existing direct activity entry where supported.
- [ ] **Step 4.5:** Disable locked actions in both presentation and action handling. Recheck availability immediately before starting a station, rather than trusting an earlier rendered state.
- [ ] **Step 4.6:** Test first station, a middle unlocked station, the final station, revisiting completed content and closing the panel through every supported route.

**Acceptance:** Displayed completion and available stations agree with `DataManager`; keyboard and touch selection reach identical activities; returning from play restores useful map context.

## 8. Phase 5 — Separate learning decisions from question rendering

**Files:** `src/scenes/QuestionScene.ts`, new `src/engine/QuestionSession.ts`, `src/presentation/QuestionView.ts`, and focused unit/browser tests.

This is the highest-risk phase because grading, feedback, recording and navigation currently coexist with canvas objects. Extract decisions incrementally, retaining behavior before introducing UX changes. Existing `QuestionEngine`, `SentenceEngine`, `PedagogyEngine` and `DataManager` remain the sources of educational and progress rules.

- [ ] **Step 5.1:** Introduce a typed session state with question ID, stable options, placed tokens, attempts, hint level, feedback and phase. Suggested phases are `answering`, `feedback-correct` and `transitioning`; wrong answers remain answerable with explanatory feedback.
- [ ] **Step 5.2:** Define actions such as `selectOption(optionId)`, `placeToken(tokenId)`, `removeToken(slotIndex)`, `requestHint()`, `resetAnswer()` and `continue()`. Return state changes and typed effects; adapters execute speech, persistence and scene transitions once.
- [ ] **Step 5.3:** First write behavior tests for option identity, repeated tokens, wrong attempts, progressive hints and duplicate submission. Move the existing logic behind those tests. Do not determine correctness from the visible position of a card.
- [ ] **Step 5.4:** Build a four-part reading layout: compact navigation/progress, prompt with replay, answer area, and feedback/actions. The question remains visible while feedback appears. Answer buttons wrap naturally and do not shrink to fit long content.
- [ ] **Step 5.5:** Make sentence construction tap-first. Display ordered answer slots and a separate token bank. Tapping a filled slot removes that token. Repeated words retain distinct IDs. Dragging can remain an enhancement, never the only interaction.
- [ ] **Step 5.6:** Remove the 1.2-second automatic transition and broad whole-screen fast-forward. After correctness, keep the explanation visible until “繼續前進” is activated. Guard the transition so repeated clicks cannot start multiple runner sessions.
- [ ] **Step 5.7:** Keep error feedback warm and instructional. Explain the next observation rather than showing only red failure. Preserve useful partial sentence work, except when the child explicitly resets.
- [ ] **Step 5.8:** Display “聽一次” and progressive hint actions consistently. Hint availability and cost must come from existing rules. A hint that cannot change the current state must not consume resources.
- [ ] **Step 5.9:** Provide an understandable empty/error state if no question exists. Returning to the map must remain possible without issuing completion rewards.

**Acceptance:** Chinese sentence building, English practice and every currently supported math presentation work through real UI clicks. Attempt records, hint counts and correctness match the baseline rules; explanations remain readable until explicit continuation.

## 9. Phase 6 — Improve speech, pacing and runner controls

**Files:** `src/services/SpeechService.ts`, `src/services/SoundManager.ts`, `src/scenes/RunnerScene.ts`, new runner HUD presentation, and existing runner tests.

- [ ] **Step 6.1:** Ensure a new playback request cancels obsolete speech and scene shutdown cancels pending narration. Retain the current language-selection policy, test unavailable Cantonese voices and keep visible text available when speech fails.
- [ ] **Step 6.2:** Respect sound settings on first playback, repeated playback and scene return. Avoid simultaneous celebration, instruction and question narration. Do not add speech recognition or change pronunciation scoring as part of this visual work.
- [ ] **Step 6.3:** Keep runner physics and world coordinates stable. Render HUD and movement buttons at usable screen-relative sizes. Verify simultaneous movement and jump, pointer cancellation and held-input release when focus is lost.
- [ ] **Step 6.4:** For portrait play, fit the runner world into a dedicated viewport and place controls outside that viewport. Offer an optional landscape suggestion without forcing rotation. Test obstacle visibility and reaction distance before accepting this arrangement.
- [ ] **Step 6.5:** Simplify the HUD to immediate objectives, current pickups and pause/exit. Keep the existing interactive tutorial, displaying one instruction at a time and advancing only after the corresponding action.
- [ ] **Step 6.6:** Preserve skip confirmation and its explanation of retained versus forfeited rewards. Check chest collection, skipping, double jump, shields and return to questions with unchanged ledger semantics.

**Acceptance:** Touch controls remain at least 48 CSS pixels, the runner does not retain stuck movement, and no physics constants change merely to compensate for interface layout.

## 10. Phase 7 — Rebuild results and wardrobe presentation

**Files:** `ResultScene.ts`, `ShopScene.ts`, `wardrobeLayout.ts`, `CharacterPreviewController.ts`, and new `ResultView.ts` / `ShopView.ts`.

- [ ] **Step 7.1:** Present results in reading order: accomplishment, stars, concise learning feedback, itemized rewards and next action. Distinguish this-run rewards from total balance. Use the existing reward ledger; opening results must not grant another reward.
- [ ] **Step 7.2:** Make the next unlocked station the primary result action. Keep retry and map secondary. Queue trophy notices rather than stacking several blocking dialogs.
- [ ] **Step 7.3:** Arrange the shop as catalog plus preview on wide screens. On phones, place a bounded preview above a vertically scrolling catalog, with the selected item's action near its details. Ensure sticky controls cannot cover the final item.
- [ ] **Step 7.4:** Standardize item states: locked, available, owned and equipped. Add textual badges and explicit prices. Browsing previews must never silently change equipped inventory or deduct currency.
- [ ] **Step 7.5:** Reuse `CharacterPreviewController`, `OutfitRenderer` and `PlayerAvatarService` for composition. Correct feet-to-stage alignment, clothing overlap and accessory depth through existing contracts. Do not introduce a separate HTML character interpretation that drifts from runner appearance.
- [ ] **Step 7.6:** Extract a typed shop action adapter where needed. Preserve existing purchase validation and transactions. Confirmation shows exact item, currency and price; cancellation leaves state unchanged; repeated confirmation cannot double-charge.
- [ ] **Step 7.7:** Retain skins, clothing categories, pets, gadgets, filters and pose previews. Improve labels and grouping without dropping less-used functionality. Keep preview restoration when switching tabs or leaving the shop.
- [ ] **Step 7.8:** Verify a successful purchase, insufficient funds, an already owned item, equip/unequip, mutually exclusive clothing, unavailable artwork and cross-scene appearance synchronization.

**Acceptance:** Every item state is understandable, the character remains visually intact, and purchase/equip behavior remains consistent with saved inventory and the runner.

## 11. Phase 8 — Finish supporting screens and accessibility

**Files:** `SettingsScene.ts`, `TrophyScene.ts`, `DiagnosticReportModal.ts`, shared dialogs, presentation styles and supporting views.

- [ ] **Step 8.1:** Apply the same typography, spacing, buttons and dialog treatment to settings, trophies and reports. Supporting screens must not return to unreadable scaled canvas text after the main screens are fixed.
- [ ] **Step 8.2:** Keep reports factual: separate first-attempt accuracy from eventual completion and explain empty history without misleading percentages. Preserve the existing mistake-review entry and verify it reaches the intended review content.
- [ ] **Step 8.3:** Add visible keyboard focus, meaningful button names, ordered headings and restrained live feedback announcements. Do not place decorative graphics in the accessibility reading order.
- [ ] **Step 8.4:** Test reduced motion, larger text, unavailable fonts and narrow dialogs. Text must wrap without clipping, and controls must not rely on hover instructions.
- [ ] **Step 8.5:** Make saved-data reset visibly destructive with explicit confirmation. Ordinary navigation and wardrobe browsing must not trigger that confirmation pattern.

**Acceptance:** A complete learning session and all supporting destinations are accessible by keyboard and touch without focus traps or unexplained disabled actions.

## 12. Phase 9 — Verification, release and handover

Use a defined viewport matrix: 375 × 667, 390 × 844 and 430 × 932 portrait; 667 × 375 and 844 × 390 landscape; 768 × 1024 tablet; and 1280 × 800 desktop. Browser emulation verifies layout and input behavior, but does not replace actual iPhone checks for speech, browser chrome and touch handling.

- [ ] **Step 9.1:** Run focused tests after each phase. At integration completion, run all unit tests, the production build and selected real-browser flows. Replace obsolete coordinate assertions only when the associated behavior is covered meaningfully elsewhere.
- [ ] **Step 9.2:** Automate the journey home → station → incorrect answer → hint → correct answer → explicit Continue → runner → result → shop → home. Add sentence-token removal and portrait rotation. Use real controls rather than invoking scene methods to pretend the interface works.
- [ ] **Step 9.3:** Compare screenshots for every major screen and modal. Inspect Chinese glyphs, long prompts, overlapping regions, scroll endpoints, character layering and safe areas manually. Report verified device/browser combinations accurately.
- [ ] **Step 9.4:** Compare save snapshots before and after purchases, retries, skips and result revisits. Confirm the existing storage key `p1_adventure_save_v1` remains readable and balances reconcile exactly.
- [ ] **Step 9.5:** Measure asset payload and repeat-navigation behavior. Optimize oversized background exports, avoid duplicate texture loads and check for accumulating listeners or animations. Report measured performance rather than an untested universal frame-rate claim.
- [ ] **Step 9.6:** Update task status, changelog, architecture notes and testing instructions. Release ownership entries. Commit cohesive changes, push the working branch and create a reviewable pull request targeting `p1-adventure`.
- [ ] **Step 9.7:** Inspect the repository's actual deployment configuration before publishing. Confirm which branch and directory produce the live game. Do not assume updating `docs/` or pushing a feature branch changes GitHub Pages.
- [ ] **Step 9.8:** Deliver the tested commit, screenshots, test summary, remaining limitations and rollback instructions. Rollback uses a known previous source/build commit; it must not delete player saves.

## 13. Execution order, checkpoints and definition of done

The initial question-session interface should make identity and effects explicit. Use this contract as the starting point, then reconcile its concrete payload types with the existing attempt and runner interfaces before implementation:

```typescript
type QuestionAction =
  | { type: 'select-option'; optionId: string }
  | { type: 'place-token'; tokenId: string }
  | { type: 'remove-token'; slotIndex: number }
  | { type: 'hint' }
  | { type: 'reset' }
  | { type: 'continue' };

interface QuestionSessionView {
  questionId: string;
  phase: 'answering' | 'feedback-correct' | 'transitioning';
  prompt: string;
  feedback: string | null;
  canContinue: boolean;
}
```

Acceptance tests must catch observable regressions. After choosing a correct answer, wait longer than the old 1.2-second timer and assert that the same explanation remains visible. Activate Continue twice and assert one runner transition and one recorded correct attempt. For duplicate sentence words, place both distinct tokens, remove one, and verify that exactly one token returns to the bank. For a shop purchase, cancel first and compare the full inventory and balances; confirm once afterward and check the exact deduction and ownership change. These cases establish correctness before styling refinements are accepted.

Implement in dependency order: baseline → tokens/art contract → responsive host → home → map → question session/view → runner/speech → results/shop → support screens → integration. Do not begin multiple renderer migrations simultaneously before proving lifecycle cleanup and state ownership with the homepage.

Use three internal checkpoints. First, home and map must establish the visual direction and mobile shell. Second, a complete question-to-runner-to-result journey must preserve records and rewards. Third, wardrobe and support screens must complete the experience with consistent accessibility. These checkpoints guide verification; they do not request repeated approval for already authorized work.

Stop a release for unreadable required text, lost progress, duplicate spending/rewards, inaccessible primary actions, broken answer mapping or scene-transition races. Record minor decorative differences separately with screenshots. If the responsive boundary exposes unexpectedly coupled logic, fix that boundary in a focused commit rather than masking it with private-field access or duplicate game rules.

The task is done only when the full experience is visibly improved, every retained feature is reachable, the specified checks pass, the evidence is attached and the repository coordination records are current. Until then, describe completed phases precisely and leave unverified claims open.
