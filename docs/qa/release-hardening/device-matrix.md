# Browser and viewport evidence matrix

Recorded: 2026-09-14 UTC

| Evidence | Status | Boundary |
|---|---|---|
| Google Chrome at 375×667, 390×844, 430×932, 667×375, 844×390, 768×1024, 1280×800 | BLOCKED | Chrome 153 was identified, but the managed runtime denied the socket required to launch it. |
| Chromium regression at the same CSS sizes | AUTOMATED_VERIFIED | Layout, named controls, keyboard flow, forced colors and reduced motion; never represented as Google Chrome. |
| Traditional Chinese QA font | AVAILABLE | Noto Sans TC variable font from the Google Fonts repository, SIL Open Font License 1.1, SHA-256 `864727d210d54f2537bbe23b3a839436c3992af72de9322af5270897246bd44f`; QA environment only, not bundled into production. |
| Emoji QA font | AVAILABLE | Noto Color Emoji from the upstream Noto Emoji repository, SHA-256 `72a635cb3d2f3524c51620cdde406b217204e8a6a06c6a096ff8ed4b5fd6e27b`; QA environment only. It removed host-generated tofu boxes from the evidence screenshots. |
| Actual Traditional Chinese glyph screenshots in Google Chrome | BLOCKED | Requires a launchable Google Chrome runtime. `document.fonts.ready` alone is not accepted as glyph proof. |
| Physical iPhone/iPad/Android, Safari, Firefox, VoiceOver/TalkBack/NVDA | OUT_OF_SCOPE — user revised acceptance | Not relabelled as passed. |
| Actual 200% Google Chrome browser zoom | BLOCKED | A smaller viewport, device scale factor or CSS zoom is not substituted. |
| Public Pages | NOT_RUN | Deployment is intentionally not authorized. |

Large screenshot evidence is attached to Playwright results rather than
committed to Git. Each visual test waits for `document.fonts.ready`, checks
horizontal overflow, and captures Home, Map, station detail, Question, Result,
Shop, Settings, Trophy and Report. Existing Runner and OOTD temporal/layering
tests remain part of the full local collection; a still image is not described
as proof of animation.

The focused Chromium evidence suite passed 9/9 with zero retries. Its HTML
report was generated at `/tmp/phonics-task3-report`; a subsequent 375×667
font check passed after installing the two QA fonts, and representative Home
and Trophy screenshots were visually inspected. Google Chrome screenshots and
actual Chrome 200% browser zoom remain blocked by the runtime boundary.
