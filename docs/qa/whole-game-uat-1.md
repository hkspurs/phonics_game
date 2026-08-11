# Whole-Game UAT 1 — EvidenceQA

Date: 2026-08-11
Environment: Vite app at `http://127.0.0.1:5173`
Viewport evidence: desktop `1920×1080`, tablet `768×1024`, mobile `375×667`, iPad landscape `1024×768`
QA scope: screenshot-first visual review, navigation, CVC child build flow, Phaser loading/fallback, audio failure behavior, shop persistence, browser back, old route reachability, console/page/request errors.

## Verdict

**Rating: 5/10 — NOT production-ready for child release.**

The main routes load and the requested happy paths are functional, but the CVC experience is still duplicated inside Phonics Forest, the mobile mission hero has a visual collision, the Phaser adventure can render incomplete state during initial load, and key child/parent navigation needs tightening. These issues are visible in the supplied screenshots and reproducible with the checks below.

## Exact capture command

```bash
cd /data/phonics_game/phonics_game
./qa-playwright-capture.sh http://127.0.0.1:5173 public/qa-screenshots/uat-1
```

Capture result from `public/qa-screenshots/uat-1/test-results.json`:

```text
total: 21
passed: 21
failed: 0
normal-route consoleErrors: []
normal-route pageErrors: []
normal-route horizontalOverflow: false
```

Additional read-only checks used Playwright through:

```bash
node --input-type=module -e 'import { chromium } from "@playwright/test"; /* navigation, layout, persistence and error-path checks */'
```

The supplemental evidence files were written under the same ignored QA folder:

```text
public/qa-screenshots/uat-1/desktop-build-correct.png
public/qa-screenshots/uat-1/desktop-challenge.png
public/qa-screenshots/uat-1/audio-failure.png
public/qa-screenshots/uat-1/phaser-fallback.png
public/qa-screenshots/uat-1/ipad-landscape-hub.png
public/qa-screenshots/uat-1/ipad-landscape-learn.png
public/qa-screenshots/uat-1/mobile-phonics-bottom.png
public/qa-screenshots/uat-1/mobile-blending-bottom.png
public/qa-screenshots/uat-1/mobile-learn-bottom.png
public/qa-screenshots/uat-1/mobile-shop-bottom.png
```

## Tested interactions

| Flow | Result | Evidence |
|---|---|---|
| `/` → `Phonics Forest` → `Start Today's Mission` | PASS; reaches `#/challenge` and shows `Ready?` overlay | `desktop-challenge.png`; Playwright reported `url: ...#/challenge`, `Ready?: 1` |
| `/phonics` → `Open blending world` → `Start learning` | PASS; reaches `#/simple-words?mode=learn&adventure=1&sessionSize=5`, shows `1 / 5` | `desktop-learn-blending.png`, `ipad-landscape-learn.png` |
| CVC child tile/build | PASS; selected the current word in tile order and received `Great blending!`; `Next word` enabled | `desktop-build-correct.png` |
| `/math`, `/braingames`, `/shop` | PASS; all rendered without normal-route console/page errors | `desktop-math.png`, `desktop-brain-games.png`, `desktop-shop.png` and tablet/mobile variants |
| Shop diamond item | PASS; bought Flower Crown for 4 diamonds, inventory became `['hat_flower']`, equipped `{ hat: 'hat_flower' }`, reload still showed `Equipped` | `tablet-shop.png`, `mobile-shop-bottom.png`; persisted `phonics-game-storage` checked |
| Browser back | PASS; `/blending` → browser back returns to `/phonics` | Playwright URL/heading check |
| Legacy route `/simple-words` | PASS; remains reachable and renders `Simple Word` | direct route check |
| Phaser normal load | PASS; canvas created, no fallback | iPad landscape screenshots; canvas measured `896×206` |
| Phaser import failure fallback | PASS; aborting Phaser request rendered `🐰 Adventure path ready` with no canvas | `phaser-fallback.png` |
| Missing MP3 behavior | PASS; alert says `Lesson audio is not installed correctly...`; browser speech synthesis call count was `0` | `audio-failure.png` |

## Findings

### UAT-1-01 — CVC/Simple Word remains duplicated inside Phonics Forest

**Severity: High — information architecture / learning-flow conflict**

**Reproduction**

1. Open `#/phonics`.
2. Scroll to the bottom on a 375×667 viewport.
3. Observe the new `學習拼音併音` world card and, below it, another `LEARN TO BLEND` and `SIMPLE WORD` quick-practice row.

**Evidence**

- `public/qa-screenshots/uat-1/desktop-phonics.png`
- `public/qa-screenshots/uat-1/mobile-phonics-bottom.png`

The screenshot visibly presents CVC entry points both as the separate blending world and as Phonics Forest quick practice. This contradicts the intended separation of `學習拼音併音` / `Simple Word` from `英語拼音森林` and gives the child two competing places to start the same activity.

**Impact**

The child can enter the legacy 16-word flow instead of the new 5-word teach-and-test adventure. That weakens the intended “learn first, then test” journey and makes the new topic structure unclear.

**Suggested fix**

Remove or relocate the legacy `Learn to Blend` and `Simple Word` buttons from `HomeDashboard`; leave CVC entry only in `/blending`. Keep the old `/simple-words` route reachable for compatibility, but do not advertise it inside the forest hub.

### UAT-1-02 — Mobile Phonics Forest mission decoration overlaps the heading

**Severity: High — readability / visual defect**

**Reproduction**

1. Open `#/phonics` at 375×667.
2. Inspect the mission card title.

**Evidence**

- `public/qa-screenshots/uat-1/mobile-phonics.png` shows the sun/rabbit decoration over the right side of `Today's Mission is waiting for you!`.
- The read-only bounding-box check measured an overlap at 375px: heading rectangle `x=50.78..324.22`, character decoration rectangle `x=204.21..333.81`, `overlap: true`.
- The same check reported no overlap at 768px or 1920px, so this is specifically a small-mobile breakpoint defect.

**Impact**

The mission title is partially obscured at the exact mobile width required for the first release. The child may not be able to read the instruction or understand what the large button starts.

**Suggested fix**

At the mobile breakpoint, move the decoration below or beside the text with reserved layout space, or hide it while the heading is wrapping. Verify at 320px, 375px and 414px.

### UAT-1-03 — Phaser adventure state can appear incomplete on first render

**Severity: Medium/High — flaky visual state**

**Reproduction**

1. Open `#/blending` through the screenshot harness.
2. Allow the harness wait of 1.4 seconds.
3. Inspect `desktop-blending.png`.

**Evidence**

- `public/qa-screenshots/uat-1/desktop-blending.png` shows the Phaser panel as a mostly empty line with the rabbit and no visible landmark/caption state.
- A later 1024×768 capture after a longer wait, `ipad-landscape-hub.png`, shows `🏠` and `Rabbit House`.
- Normal load does create a canvas, but the visual result differs based on when the asynchronous Phaser scene becomes ready.

**Impact**

The first impression of the new adventure can look unfinished or blank. This is especially risky on a child-facing entry screen because the child receives no clear world state while the game engine is loading.

**Suggested fix**

Store the latest React adventure state until the Phaser scene calls `READY`, then apply it immediately. Keep a deterministic React fallback/initial landmark visible until the canvas has acknowledged the state; add a test that asserts the first settled render always shows the current landmark and caption.

### UAT-1-04 — Mobile CVC build interaction is split across separate scroll positions

**Severity: Medium — child usability / discoverability**

**Reproduction**

1. Open `#/simple-words?mode=learn&adventure=1&sessionSize=5` at 375×667.
2. Observe the initial viewport.
3. Scroll to the bottom to find the letter tiles and `Next word`.

**Evidence**

- `public/qa-screenshots/uat-1/mobile-learn-blending.png` shows the adventure panel, mascot, title, and empty answer slots, but not the letter tiles or main instruction/action.
- `public/qa-screenshots/uat-1/mobile-learn-bottom.png` shows the tiles, speaker and `NEXT WORD` only after scrolling.
- Layout metrics: `#root.scrollHeight=1035`, `#root.clientHeight=667`; the child interaction is distributed over more than one viewport.

**Impact**

The child must discover that the lesson continues below the fold before being able to build the word. That adds friction to the core teaching loop and can look like the first question is stuck.

**Suggested fix**

Compress the adventure panel/mascot spacing on 320–375px, or pin a clear child action area while keeping the word, instruction, tiles and replay control discoverable together. Re-test with the real 320px minimum.

### UAT-1-05 — Header Settings silently returns an unauthenticated child to the gateway

**Severity: Medium — navigation / parent-mode discoverability**

**Reproduction**

1. Use a fresh browser context with no parent authentication.
2. Open `#/blending`.
3. Click the header button with accessible name `Settings`.

**Evidence**

The read-only Playwright check reported:

```json
{
  "url": "http://127.0.0.1:5173/#/",
  "heading": "Ready to Learn",
  "parentGate": 1
}
```

The button navigates to `/parent`, but the protected route immediately redirects to `/`; no parent gate or explanation is shown. This differs from the Phonics Forest Settings control, which opens the parent gate modal.

**Impact**

An adult tapping Settings from the new blending, maths or shop frame can be dropped to the home gateway without knowing why. It is easy to mistake this for a broken settings button.

**Suggested fix**

Route unauthenticated Settings through the existing `ParentGateModal` pattern, or provide a shared parent-gate entry in `ExperienceFrame` before navigating to `/parent`.

## Error and persistence checks

- Normal capture routes: no console errors, page errors or failed requests were observed.
- Missing-MP3 test intentionally aborted Fish MP3 requests and produced the expected adult-facing lesson-audio alert; speech synthesis instrumentation reported `speechCalls: 0`.
- Phaser import failure rendered the explicit fallback rather than a blank screen.
- Diamond purchase/equip persisted through reload in the existing `phonics-game-storage` record.
- No horizontal overflow was reported by the capture harness at the three required portrait viewports.
- The root application content uses an internal `#root` scroll container; the harness screenshots are viewport-sized rather than full internal-scroll captures. Bottom-of-page supplemental screenshots were therefore captured separately for mobile evidence.

## Required next steps before UAT 2

1. Remove the duplicate CVC entry points from Phonics Forest.
2. Fix the 375px mission-card overlap.
3. Make Phaser state initialization deterministic and visibly complete.
4. Reflow the mobile CVC build loop so the child can understand the current action without guessing or excessive scrolling.
5. Make Settings open the parent gate consistently.

Production readiness remains **FAILED** until these issues are fixed and re-tested by a developer before UAT 2.
