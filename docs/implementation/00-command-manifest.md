# Command Manifest & Environment Protocol
## 升夢大冒險 (P1 Adventure) — Phase 0

---

## 1. Environment & Package Manager Contract

- **Repository Root**: `/data/phonics_game`
- **Application Directory**: `/data/phonics_game/p1-adventure`
- **Node.js Version**: `v18.19.1` (or >= 18.0.0)
- **npm Version**: `9.2.0`
- **Lockfile Contract**: `package-lock.json`
- **Framework & Engine**: Phaser 3.87.0 + Vite 5.3.3 + TypeScript 5.5.3 + Vitest 2.0.2 + Playwright 1.47.0

---

## 2. Command Manifest

### Dependency Installation
```bash
# Clean deterministic install from package-lock.json
npm ci
```

### Unit & Integration Testing (Vitest)
```bash
# Run all unit and integration test suites
npm run test:unit

# Run a specific test suite
npx vitest run src/test/character-art-bible-vertical-slice.test.ts
```

### Typecheck & Production Build
```bash
# Compile TypeScript and bundle with Vite
npm run build
```

### Local Preview Server
```bash
# Start Vite production preview server
npm run preview -- --port 8080
```

### End-to-End Testing (Playwright)
```bash
# Run cross-browser and mobile viewport automated tests
npm run test:e2e
```

### Deployment Synchronization
```bash
# Sync production dist bundle to GitHub Pages docs directories
npm run build && rsync -av --delete dist/ docs/ && rsync -av --delete dist/ /data/phonics_game/docs/ && cp .ai/character-art-bible.md docs/
```
