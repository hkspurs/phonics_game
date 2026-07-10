# Handoff Report: Phonics Sound Balloon Pop Mini-Game Design

This handoff report summarizes the observations, design reasoning, proposed strategy, and next steps for the implementation of the Sound Balloon Pop mini-game.

---

## 1. Observation

### Existing Structure and Codebase Inspection
* **Project Specifications**:
  * In `/data/phonics_game/phonics_game/PROJECT.md` line 12:
    > `12: | 1 | Create SoundBalloonPop Game | Design and implement the balloon pop game in src/games/SoundBalloonPop.jsx using useTicket, audioEngine, and questionEngine. | None | PLANNED |`
  * In `PROJECT.md` lines 17-21:
    ```markdown
    17: ### `gameStore` ↔ `SoundBalloonPop`
    18: - `tickets`: number of tickets available.
    19: - `useTicket`: function that deducts exactly 1 ticket.
    20: - `questionEngine.sounds`: array of sound objects `{ sound_id, label, audio_url, family, human_review_status }`.
    21: - `audioEngine.play(url)`: plays a sound.
    ```
* **Existing Game Components**:
  * In `/data/phonics_game/phonics_game/src/games/SoundCatcher.jsx` lines 27-42:
    ```javascript
    27:     if (hasInitializedRef.current) return;
    28: 
    29:     if (!isPlaying && tickets > 0) {
    30:       hasInitializedRef.current = true;
    31:       useTicket()
    32:       setIsPlaying(true)
    33:       const pool = [...questionEngine.sounds].sort(() => Math.random() - 0.5)
    ...
    40:     } else if (!isPlaying) {
    41:       navigate('/braingames') // No tickets, kick out
    42:     }
    ```
  * In `/data/phonics_game/phonics_game/src/games/MemoryMatch.jsx` lines 29-37:
    ```javascript
    29:   const hasInitializedRef = React.useRef(false);
    ...
    33:     if (hasInitializedRef.current) return;
    34: 
    35:     if (!isPlaying && tickets > 0) {
    36:       hasInitializedRef.current = true;
    37:       useTicket();
    ```
  * In `/data/phonics_game/phonics_game/src/game/QuestionEngine.js` line 9:
    ```javascript
    9:     this.sounds = soundsData.sounds.filter(s => s.human_review_status === 'approved');
    ```
  * In `/data/phonics_game/phonics_game/src/audio/AudioEngine.js` line 147:
    ```javascript
    147:   playUI(type = 'pop') {
    ```
  * In `/data/phonics_game/phonics_game/src/components/ConfettiSVG.jsx` line 3:
    ```javascript
    3: export default function ConfettiSVG({ isVisible }) {
    ```

---

## 2. Logic Chain

1. **Ticket Deductions Guard**:
   * Since React 18 mounts components twice in development mode under StrictMode, any direct state changes or store calls inside `useEffect([], ...)` are executed twice.
   * `hasInitializedRef.current` initialized to `false` and set to `true` on the first execution acts as an effective guard (as verified in both `SoundCatcher.jsx` and `MemoryMatch.jsx`).
   * Therefore, `SoundBalloonPop.jsx` must implement this exact `hasInitializedRef` reference pattern to protect ticket consumption logic.

2. **Integration Contracts**:
   * The audio engine provides `audioEngine.play(url)` for playing phonic sound paths, `audioEngine.playUI('pop')` for synthetic pops, and `audioEngine.playUI('error')` for incorrect selection feedback.
   * On click of a balloon containing a distractor, playing `audioEngine.play(distractor.audio_url)` enforces a corrective audio feedback mechanism, improving the educational value.
   * The target sound is retrieved from `questionEngine.sounds` (which only returns approved sounds). To prevent visually memorizing balloon positions, the game must clear the active balloons and choose a new target sound upon each correct match.

3. **CSS-based Animation Flow**:
   * Unlike `SoundCatcher` where bubbles fall, balloons must float upwards.
   * This is accomplished via `@keyframes floatUp` with `top` changing from `110%` to `-20%`.
   * Floating must be paired with horizontal swaying to feel natural, which can be done using a secondary `@keyframes floatWobble` applying `translateX` and rotation.

---

## 3. Caveats

* **Assumptions**: Assumed that the developer will register `/games/soundballoonpop` route in `App.jsx` and include the UI card selector in `BrainGamesIsland.jsx`.
* **Testing Scope**: Playwright tests (`tests/uat.spec.js` and others) need to be updated/augmented once implementation is completed to verify the new game flow.
* **Asset Loading**: Sound files are fetched asynchronously, so play calls might occasionally have latency. This is mitigated by `audioEngine`'s preloading mechanism, which should preload all chosen sounds on game initialization.

---

## 4. Conclusion

The design and implementation strategy is sound and fully detailed in `/data/phonics_game/phonics_game/.agents/teamwork_preview_explorer_m1_1/analysis.md`. The design leverages standard patterns in the app (Zustand state selectors, `questionEngine` pools, `audioEngine` triggers, React 18 StrictMode refs, inline CSS animation styling) ensuring high cohesion and minimal external disruption.

---

## 5. Verification Method

To verify the strategy and implementation:
1. **Source Inspection**: Confirm `src/games/SoundBalloonPop.jsx` contains the `hasInitializedRef` ticket guard, the correct `audioEngine` lifecycle cleanups, and SVG balloon elements.
2. **App Router Inspection**: Ensure `src/App.jsx` imports `SoundBalloonPop` and includes:
   `<Route path="/games/soundballoonpop" element={<SoundBalloonPop />} />`
3. **Selection Screen Inspection**: Check that `src/screens/BrainGamesIsland.jsx` includes a card button routing to `/games/soundballoonpop`.
4. **Execution and Testing**: Run the dev server via `npm run dev` and execute E2E test commands:
   ```bash
   npx playwright test tests/uat.spec.js
   ```

---

## 6. Remaining Work

1. Create and populate `src/games/SoundBalloonPop.jsx` with the code provided in the `analysis.md` report.
2. Modify `src/App.jsx` to register the new game route.
3. Modify `src/screens/BrainGamesIsland.jsx` to include the game selection card.
4. Run testing commands to confirm ticket logic works and that the game does not introduce regression.
