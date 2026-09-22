# Release-hardening execution checkpoint

## Checkpoint 1 — Task A complete

- **Task:** A — establish exact baseline and failure inventory
- **Status:** COMPLETE / AUTOMATED_VERIFIED
- **Source:** `2656552e96630316fa0d675213877a0d340f7ddb` (`p1-adventure`)
- **Working branch:** `codex/p1-release-hardening`
- **Recorded at:** 2026-09-13 UTC

### Commands and results

| Command | Result |
|---|---|
| `npm ci` | exit 0; 53 packages installed |
| `npm run test:unit` | exit 0; 63 files / 1,940 tests passed |
| `npm run build` | exit 0; Vite build passed; 1,962.48 kB JS / 466.61 kB gzip; existing large-chunk advisory |
| `npx playwright install chromium` | exit 0; Chromium 129 and FFMPEG installed |
| `npx playwright test --reporter=list,json` | exit 1; 59 passed / 33 failed / 0 skipped from 92 |

### Artifacts and disposition

- `docs/qa/release-hardening/baseline-results.json` contains the complete JSON
  reporter output.
- Generated screenshot directories were restored after the run; no generated
  screenshots are being presented as new product evidence at this checkpoint.
- Every one of the 33 failures is listed in
  `failure-inventory.md` with the observed error and an initial owner/category.
- No production source was changed in Task A.
- `MANUAL_PENDING`: physical-device, real speech listening, real assistive
  technology and installed Traditional Chinese font evidence are not available
  in this headless environment and remain pending for Task D/E.

### Next action

Proceed to Task B browser-suite migration. Keep local and deployed smoke
contracts separate; do not hide live tests or weaken product assertions.
