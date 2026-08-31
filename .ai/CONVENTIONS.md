# Coding & Development Conventions

All AI agents (**Google AGY** and **OpenAI Codex**) must strictly adhere to these conventions.

---

## 1. TypeScript & Safety Standards
1. **Strict Null & Undefined Checks**:
   - Always check existence of optional Phaser subsystems before calling:
     ```typescript
     if (this.tweens?.add) { ... }
     if (this.add?.graphics) { ... }
     if (typeof g.strokeCircle === 'function') { ... }
     ```
2. **Mock-Safe Phaser Graphics**:
   - Vitest runs in Node.js JSDOM where non-standard Phaser graphics methods (like `strokeCircle` or `lineBetween`) are not implemented in mock harnesses.
   - Always provide safe fallbacks (e.g. `CharacterOutfitCompositor.drawLine()`, `g.fillCircle()`, or `g.strokeRoundedRect()`).
3. **LocalStorage Error Trapping**:
   - Wrap all `localStorage.getItem` and `localStorage.setItem` in `try / catch` blocks to gracefully handle Safari private browsing quota errors or corrupted JSON.

---

## 2. UI & Responsive Design Conventions
1. **Typography Minimums for Mobile**:
   - Primary prompt / title text: `>= 24px - 32px` bold.
   - Button labels & interactive tokens: `>= 20px - 26px`.
   - HUD / Secondary badges: `>= 16px - 18px`.
   - **Never** render micro-text `< 14px` on mobile viewports.
2. **Hit Area & Button Positioning**:
   - All interactive buttons must have a minimum touch bounding box of `44 x 44 px`.
   - Never rely on absolute browser window coordinates (`event.clientX`); always use Phaser container-relative pointer coordinates.
3. **Color Palette & Visual Theme**:
   - Dark/Navy slate backdrops: `#131d2e`, `#1a2333`
   - Primary Golden Amber: `#f5a623`, `#ffd700`, `#f5bd42`
   - Emerald Green (Success / Active): `#2ecc71`, `#22c55e`, `#48b64e`
   - Ruby Coral (Error / Alert): `#e74c3c`, `#ef4444`
   - Celestial Purple: `#7c3aed`, `#8b5cf6`

---

## 3. Multi-Agent Development Discipline
1. **Evidence Before Assertions**:
   - Run verification commands (`npm run test:unit`, `npm run build`) and confirm actual output before claiming completion.
2. **Preserve Integrity of Comments & Docstrings**:
   - Do not wipe existing architectural comments or test suites.
3. **Atomic Commits**:
   - Commit with clear semantic commit messages: `feat(...)`, `fix(...)`, `chore(...)`, `test(...)`.
   - Push to all 3 tracking branches: `master`, `main`, and `p1-adventure`.
