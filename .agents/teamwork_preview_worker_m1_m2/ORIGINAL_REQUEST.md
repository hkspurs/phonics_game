## 2026-07-10T14:50:55Z
You are a teamwork_preview_worker.
Your working directory is `/data/phonics_game/phonics_game/.agents/teamwork_preview_worker_m1_m2`.
Your identity is worker_1.
Your task is to implement the following changes in the codebase based on the Explorer reports at `/data/phonics_game/phonics_game/.agents/teamwork_preview_explorer_m1_1/analysis.md` and `/data/phonics_game/phonics_game/.agents/teamwork_preview_explorer_m1_1/handoff.md`:
1. Create `src/games/SoundBalloonPop.jsx` containing the full balloon pop mini-game component (make sure to include the double-deduction guard for `useTicket`, using a `useRef` lock, check that tickets > 0 on mount, auto-play target sound, pop balloons, trigger the pop/error sound effects via audioEngine, play the distractor's phonic sound as corrective audio feedback, and handle the score progression up to 10. Navigating back to `/braingames` on completion or exit).
2. Modify `src/App.jsx` to register the new game route at `/games/soundballoonpop`.
3. Modify `src/screens/BrainGamesIsland.jsx` to add the new Balloon Pop game card, costing 1 ticket, check that tickets > 0 before allowing navigation, and call the ticket deduction action `useTicket()` on mount (handled in the game component).
4. Verify your implementation by running a build to make sure there are no syntax/compilation errors. You must document the commands and results in your handoff report.
5. Create a handoff report at `/data/phonics_game/phonics_game/.agents/teamwork_preview_worker_m1_m2/handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Once you are complete, notify the orchestrator (conversation ID: 90ccd8e8-04eb-4fc1-a292-5e9cfbcbe444).
