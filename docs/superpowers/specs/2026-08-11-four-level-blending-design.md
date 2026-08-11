# Four-Level Blending Practice

**Date:** 2026-08-11  
**Status:** Approved

## Goal

Turn the existing `Learn to Blend` activity into four independently selectable
levels. Each level contains 16 CVC questions. Completing one level must never
automatically start another level; the child chooses the next level from the
level-selection screen.

## Child flow

Opening `Learn to Blend` shows four level choices:

1. **Build from three letters** — show the word's three letters as shuffled
   tiles; the child selects them in order.
2. **Choose the first letter** — show the second and third letters, such as
   `_ A T`; the child chooses the first letter from the A–Z keyboard.
3. **Choose the first two letters** — show the final letter, such as `_ _ T`;
   the child chooses the first two letters from the A–Z keyboard.
4. **Enter the whole word** — show three empty slots; the child enters all
   three letters from the A–Z keyboard.

The same 16-word CVC set is used by every level, with an independently shuffled
question order for each session. A level displays progress such as `1 / 16`.
After the sixteenth answer, the child sees that level's completion screen and
can replay the same level or return to the level selector. There is no automatic
level progression.

The standalone Simple Word spelling route remains available. The four-level
selection replaces the automatic learning-to-test chain inside `Learn to
Blend`; level four supplies the full A–Z entry practice.

## Interaction rules

- Level one keeps the existing three-tile interaction and gentle retry state.
- Levels two through four reuse `VirtualKeyboard` and the existing answer
  slots. The fixed clue letters remain visible in their correct positions.
- The submit action is disabled until the level's required number of letters
  has been entered.
- A wrong answer stays on the same question, clears only the child-entered
  letters, and allows another attempt without revealing the answer.
- Correct feedback advances to the next question in the same level only.
- Existing word audio, replay controls, loading failure handling, and positive
  feedback conventions remain in use.

## Implementation shape

- `SimpleWords.jsx` owns the level-selection state, selected level, 16-word
  queue, current question, answer state, and per-level completion state.
- Existing `SIMPLE_WORDS`, queue/shuffle helpers, `AudioEngine`,
  `VirtualKeyboard`, mascot, and button styles are reused.
- The adventure presentation remains compatible, but its learning session is
  16 questions rather than the current five-question display.
- Update the blending copy that currently says five words to say 16 words.
- Add only the translations and focused component tests needed for the four
  levels. No new dependency, persistent level state, new audio corpus, or
  change to the AEIOU curriculum is required.

## Verification

Component tests will prove that:

- the level selector exposes four choices;
- each selected level starts at `1 / 16`;
- level one uses shuffled letter tiles;
- levels two, three, and four show the correct fixed-letter pattern and accept
  the correct number of A–Z inputs;
- wrong answers retry the current question;
- completing 16 questions stays on the selected level's completion screen and
  does not enter another level automatically;
- replaying returns to question one of the same level.

Run the focused Vitest tests, the full Vitest suite, and the production build
before declaring the implementation complete.

## Non-goals

- No new level-progression system or persistent mastery data.
- No new package, keyboard layout, audio type, or CVC word set.
- No changes to the existing standalone Simple Word test, AEIOU game, math
  game, rewards persistence, or parent dashboard.
