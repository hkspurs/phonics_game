# Whole-Game UAT 3 — EvidenceQA

Date: 2026-08-11
Environment: Vite app at `http://127.0.0.1:5173`
Viewports: desktop `1920×1080`, tablet `768×1024`, mobile `375×667`, focused mobile `320×667`, iPad landscape `1024×768`.

## Verdict

**Rating: 9/10 — PASS for the redesigned whole-game flow; no release-blocking UAT finding remains.**

The final developer fix compresses only the adventure mobile presentation. The CVC word, instruction, three letter tiles, replay control and complete `Next word` control are now visible together at both required small-mobile widths. The original phonics/math/brain/reward/shop routes and legacy Simple Word route remain reachable.

## Full capture

Exact command:

```bash
cd /data/phonics_game/phonics_game
./qa-playwright-capture.sh http://127.0.0.1:5173 public/qa-screenshots/uat-3
```

Result: `public/qa-screenshots/uat-3/test-results.json` reports **21/21 passed**, with no normal-route console errors, page errors, failed requests, or horizontal overflow.

Evidence files:

- `public/qa-screenshots/uat-3/desktop-gateway.png`
- `public/qa-screenshots/uat-3/desktop-phonics.png`
- `public/qa-screenshots/uat-3/desktop-blending.png`
- `public/qa-screenshots/uat-3/desktop-learn-blending.png`
- `public/qa-screenshots/uat-3/desktop-math.png`
- `public/qa-screenshots/uat-3/desktop-brain-games.png`
- `public/qa-screenshots/uat-3/desktop-shop.png`
- matching `tablet-*` and `mobile-*` files in the same directory

## Focused release checks

| Check | Result | Evidence |
|---|---|---|
| Phonics mission decoration at 320/375px | PASS; no heading/character bounding-box overlap | Playwright bounds; `mobile-phonics.png` |
| CVC separation | PASS; no standalone `Simple Word` entry in Forest; both the new and legacy CVC entries are contained under `學習拼音併音` | `mobile-phonics.png`, `desktop-phonics.png` |
| Blending first state | PASS; `🏠 Rabbit House` fallback/caption is visible before the Phaser canvas settles; canvas then appears | `desktop-blending.png`, `tablet-blending.png` |
| CVC mobile layout at 320px | PASS; Next box `y=565.28..633.28`, fully inside `667px` viewport | Playwright bounds |
| CVC mobile layout at 375px | PASS; Next box `y=583.28..651.28`, fully inside `667px` viewport | Playwright bounds |
| CVC touch targets | PASS; 320px replay is `64px`, tiles `50px`; 375px replay `72px`, tiles `56px` | Playwright bounds |
| Parent gate | PASS; fresh unauthenticated Settings stays on `/blending` and opens `For Parents Only` | Playwright focused check |
| Legacy compatibility | PASS; `/simple-words` remains reachable with `Simple Word` and `1 / 16` | Playwright focused check; `tests/simple-word-blending.spec.js` |
| Audio failure | PASS; missing teaching MP3 remains adult-facing fail-closed state, with no TTS fallback | UAT1 `audio-failure.png`; AudioEngine unit test |
| Shop persistence | PASS; diamond cosmetic purchase/equip survives reload in existing store | UAT1 `mobile-shop-bottom.png`; existing Playwright coverage |

## Learning interaction

The adventure route remains a short five-word session (`1 / 5`), keeps the teach/build flow separate from the Forest challenge, gives supportive retry copy, and continues to the test stage after the learning queue. No numeric child accuracy score, timer, lives, red cross, or `Wrong` copy was introduced by the redesign.

## Previous finding retest

- UAT1 duplicate CVC entry points: **fixed**.
- UAT1 375px mission overlap: **fixed**.
- UAT1 incomplete Phaser first render: **fixed**.
- UAT1 mobile CVC split interaction: **fixed after UAT2 developer pass**; all primary controls are in the first viewport.
- UAT1 Settings redirect: **fixed**.
- UAT2 partially clipped Next button: **fixed after second developer pass**; verified at 320px and 375px.

## Release decision

**UAT3 PASS.** No remaining release-blocking finding was observed in the requested whole-game scope. The deliberate caveat is Phaser's large lazy-loaded bundle; it is presentation-only and does not affect the existing question/audio/store logic. Proceed to the final unit/build/E2E verification and deployment audit.
