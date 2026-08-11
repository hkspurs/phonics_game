# Whole-Game UAT 2 — EvidenceQA

Date: 2026-08-11
Environment: Vite app at `http://127.0.0.1:5173`
Viewports: desktop `1920×1080`, tablet `768×1024`, mobile `375×667`, iPad landscape `1024×768`; focused mobile check also `320×667`.

## Verdict

**Rating: 8/10 — not yet production-ready; one small mobile layout fix remains.**

The five UAT1 blockers are fixed in the exercised paths. The new CVC adventure now has a deterministic visible Phaser state, the mobile mission art no longer overlaps its heading, the old CVC entry is no longer a second standalone Forest entry, Settings opens the parent gate, and the CVC build controls fit the first mobile viewport. One remaining issue is that the disabled `Next word` control sits partly below the 375px viewport; it should be pulled into the first view even though it is correctly disabled until the answer is built.

## Capture evidence

Exact command:

```bash
cd /data/phonics_game/phonics_game
./qa-playwright-capture.sh http://127.0.0.1:5173 public/qa-screenshots/uat-2
```

`public/qa-screenshots/uat-2/test-results.json` reports 21/21 route/viewport captures passed with no normal-route console errors, page errors, or horizontal overflow. Evidence images include `desktop-phonics.png`, `mobile-phonics.png`, `desktop-blending.png`, `mobile-blending.png`, `desktop-learn-blending.png`, `mobile-learn-blending.png`, `ipad-landscape-learn.png`, `desktop-shop.png`, `mobile-shop.png`, and the supplemental screenshots in the same directory.

## Focused checks

| Check | Result | Evidence |
|---|---|---|
| 375px mission heading versus character bounds | PASS; heading `x=50.78..324.22`, characters `y=607`, no overlap | `mobile-phonics.png`; Playwright bounding-box check |
| Phonics Forest duplicate standalone `Simple Word` entry | PASS; `Simple Word` remains only as a clearly labelled legacy button nested inside the CVC world card, not as a Forest entry | `mobile-phonics-bottom.png` |
| Blending first settled state | PASS; fallback text initially/while loading is `🏠 Rabbit House`, then a canvas is present | `desktop-blending.png`, `ipad-landscape-hub.png` |
| Settings from fresh unauthenticated `/blending` | PASS; URL remains `/blending` and `For Parents Only` modal count is `1` | Playwright focused check |
| 320px CVC first view | PASS for word, instruction, 3 letter tiles, replay; `Next word` is partly below fold | Playwright bounds below |
| 375px CVC first view | PASS for word, instruction, 3 letter tiles, replay; `Next word` top is `648`, height `68` in a `667px` viewport | Playwright bounds below |

Focused CVC bounds:

```text
320px: word y=335; instruction y=465; tiles y=496..546; replay y=554..618; next y=630..698
375px: word y=335; instruction y=469; tiles y=500..556; replay y=564..636; next y=648..716
```

## Functional regression evidence

- `/` → `/phonics` → Today's Mission remains reachable.
- `/phonics` → `/blending` → `Learn to Blend` remains a separate CVC world.
- `/simple-words?mode=learn&adventure=1&sessionSize=5` shows `1 / 5`; the old `/simple-words` route remains reachable.
- Correct CVC tile order enables the next step; incorrect input remains supportive and does not show punitive `Wrong`/red-cross copy.
- Phaser import failure still shows the explicit fallback instead of a blank screen.
- Missing MP3 behavior remains fail-closed with the adult-facing installation message and no speech-synthesis fallback.
- `/math`, `/braingames`, `/shop`, browser back, and diamond purchase/equip persistence remain reachable through the shared frame.

## UAT1 re-test

1. Duplicate CVC entry points: **fixed**; only the CVC world card owns the advertised entries, with legacy links visibly labelled as compatibility links.
2. 375px hero overlap: **fixed**; art is reflowed below the mission copy.
3. Phaser incomplete first render: **fixed**; React fallback has the current landmark/caption until the scene is ready.
4. Mobile CVC build discoverability: **mostly fixed**; word, instruction, tiles and replay are in the first view; the disabled next control still needs compression.
5. Unauthenticated Settings: **fixed**; the shared frame opens `ParentGateModal` without redirecting.

## Required developer follow-up before UAT3

Reduce only the adventure mobile vertical spacing enough to bring the disabled `Next word` button fully into the first 320px/375px viewport. Preserve the 48px/64px touch targets, the word/instruction/tiles/replay order, the Phaser fallback, and the existing non-adventure 16-word route.

Production readiness remains **FAILED pending this focused mobile fix and UAT3 re-test**.
