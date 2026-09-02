# Adventurer Vertical Slice QA Report
## Master Art Bible & In-Game Verification

---

## 1. Asset Contract Validation (`scripts/validate-character-assets.mjs`)

| Pose | Resolution | Bounds (WxH) | Centre X | Baseline Y | Trans % | Connected % | Status |
|---|---|---|---|---|---|---|:---:|
| `idle_front.png` | 512×512 | 200×376 | 256.0 | 455 | 81.07% | 100.00% | ✅ PASS |
| `idle_side.png` | 512×512 | 171×375 | 255.5 | 455 | 88.31% | 100.00% | ✅ PASS |
| `run.png` | 512×512 | 212×370 | 256.0 | 455 | 83.87% | 99.95% | ✅ PASS |
| `jump.png` | 512×512 | 243×350 | 255.5 | 419 (airborne) | 84.43% | 99.97% | ✅ PASS |
| `landing.png` | 512×512 | 223×340 | 255.5 | 455 | 84.33% | 99.96% | ✅ PASS |
| `cheer.png` | 512×512 | 238×380 | 255.0 | 455 | 82.72% | 99.96% | ✅ PASS |
| `hurt.png` | 512×512 | 203×363 | 256.5 | 454 | 87.06% | 99.60% | ✅ PASS |
| `celebration.png` | 512×512 | 257×380 | 255.5 | 455 | 83.23% | 99.95% | ✅ PASS |
| `shop_preview.png` | 512×512 | 200×376 | 256.0 | 455 | 81.61% | 100.00% | ✅ PASS |

---

## 2. In-Game Surface Verification

| Scene / Surface | Pose Used | Render Height | Anchor Expression | Visual Result |
|---|---|---|---|---|
| **Home (TitleScene)** | `idle_front.png` | 140px | `x: 640, y: 350`, origin `(0.5, 0.5)` | ✅ Balanced hero stance, clear face |
| **Shop (ShopScene)** | `shop_preview.png` | 220px | `x: 340, y: 360`, origin `(0.5, 0.5)` | ✅ Clear 3/4 pose, feet on pedestal |
| **Map (MapScene)** | `idle_front.png` | 64px | `x: 60, y: 60`, origin `(0.5, 0.5)` | ✅ Crisp avatar icon, no label overlap |
| **Question (QuestionScene)** | `idle_front.png` | 64px | `x: 60, y: 60`, origin `(0.5, 0.5)` | ✅ Clear portrait framing |
| **Runner (RunnerScene)** | `idle_side.png` / `run.png` / `jump.png` / `landing.png` | 96px | `groundY - 48` | ✅ Ground alignment, dynamic run/jump |
| **Result (ResultScene)** | `celebration.png` | 180px | `x: 640, y: 380`, origin `(0.5, 0.5)` | ✅ Energetic victory pose with stars |

---

## 3. Test & Build Evidence
- **Asset Validator Unit Tests**: `node --test scripts/validate-character-assets.test.mjs` (7 passed, 100%).
- **Asset Geometry & Pixel Rules**: `node scripts/validate-character-assets.mjs adventurer` (9/9 passed, 100%).
- **Full Unit Test Suite**: 60 test suites, 1,846 unit tests passing (100% pass rate).
- **Production Build**: Clean Vite compilation and synchronization.
