# Google Chrome acceptance

Recorded: 2026-09-14 UTC
Task: release-hardening Task 2

## Required scope

Google Chrome must exercise the product at CSS viewports 375×667, 390×844,
430×932, 667×375, 844×390, 768×1024 and 1280×800. Bundled Chromium remains a
local regression engine and is never reported as Google Chrome. Physical
devices, Safari, Firefox and assistive-technology runs are `OUT_OF_SCOPE — user
revised acceptance`. Public Pages smoke is `NOT_RUN — deployment intentionally
not authorized`.

The Chrome command is:

```bash
npm run test:e2e:chrome
```

It uses Playwright's `channel: 'chrome'`. A portable official Chrome may be
selected explicitly with `CHROME_EXECUTABLE_PATH`; this changes only the binary
location and does not substitute Chromium.

## Environment result

The official Google Chrome stable Debian package was downloaded from
`dl.google.com`, extracted outside the repository, and identified as Google
Chrome `153.0.8010.36`. Playwright launch failed before page creation with
`process_singleton_posix.cc: socket() failed: Operation not permitted`. The
managed runtime denies the Unix socket Chrome requires. The regular Vite
preview server can bind its local TCP port, so this is specifically a Chrome
process boundary. A later command runner did not retain that temporary extract;
the explicit-path smoke therefore failed before launch because the temporary
binary was absent. Neither attempt produced browser interaction evidence.

Status: `BLOCKED — identified Google Chrome cannot launch in this runtime`.
No Chromium result is promoted to Chrome evidence. The configuration and
remaining product work can still be reviewed and tested with the existing
Chromium regression collection.

## Fresh Task C baseline

| Check | Result |
|---|---|
| `npm ci` | PASS |
| `npm run test:unit` | PASS — 63 files, 1,941 tests |
| `npm run build` | PASS — 1,963.34 kB JS / 466.90 kB gzip; existing >500 kB advisory |
| Full local Chromium, zero retries | PASS — 87/87 in 10.8 minutes; `task-2-local-results.json` |
| Google Chrome launch | BLOCKED — socket permission denied before page creation; temporary extract was not durable |
| Public Pages | NOT_RUN — no deployment authorized |

The first full local attempt failed 87/87 before test execution because the
Playwright Chromium binary was absent after `npm ci`. After installing the
pinned Playwright Chromium build, the identical zero-retry command passed all
87 tests. The infrastructure-only failed attempt remains in the task log and
was not addressed with retries or weakened assertions.
