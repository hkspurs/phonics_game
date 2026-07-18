# Simple Word Game Design

## Goal

Add a `Simple Word` section for the 16 three-letter words in the teacher video while leaving the existing AEIOU game, routes, progress, and audio unchanged.

The words are: `BUS`, `COT`, `DIG`, `FOG`, `GOD`, `HIT`, `JET`, `KEN`, `LIP`, `MET`, `NUT`, `POT`, `RED`, `SUM`, `TUG`, and `VET`.

## Child flow

1. The Phonics home screen shows a new `Simple Word` button.
2. Opening it starts a 16-question session.
3. The 16 words are shuffled once per session; every word appears exactly once, with no duplicates or omissions.
4. Each question automatically plays the teacher's final, fully blended word recording. A large speaker button allows replay.
5. The child enters exactly three letters using the existing fixed A-Z virtual keyboard. Submit stays disabled until all three slots are filled.
6. A wrong answer does not advance or reveal the word. The entry clears after gentle feedback and the recording replays so the child can try again.
7. A correct answer triggers the existing positive audio/visual style, then advances to the next word.
8. The completion screen shows all 16 words completed and first-attempt accuracy, with `Play Again` and `Back to Phonics` actions. `Play Again` creates a new random order.

## Architecture

- Add a standalone `/simple-words` route and screen.
- Reuse `VirtualKeyboard`, `AudioEngine`, `MascotRabbit`, existing button styles, and existing feedback conventions.
- Keep session state local to the new screen: shuffled queue, current index, typed answer, retry state, and first-attempt hits.
- Add one small Fisher-Yates shuffle helper so randomness can be tested deterministically and each word is guaranteed to appear once.
- Add only the new home entry and translations required to reach the screen. Do not change `QuestionEngine`, the AEIOU curriculum, Zustand persistence, rewards, mastery maps, or daily challenges.

## Teacher audio

- Use only the final complete-word utterance from each teacher segment; exclude the preceding split phonemes.
- Extract 16 mono 44.1 kHz MP3 files with small head/tail padding so initial and final consonants are preserved.
- Store them under `public/assets/simple-words/`.
- Register every clip in `data/audio_manifest.json` as a passed, teacher-recorded phonics target with its word, source video, source start/end timing, and sequence number.
- Play clips through `AudioEngine.playAudioById`; target audio has no speech-synthesis fallback.

## Feedback and failure handling

- Disable input while feedback or audio transitions are active to prevent double submissions.
- Wrong answers use a gentle wobble/retry state rather than shame language or an answer reveal.
- If a target clip cannot load, keep the question on screen and leave the replay action available; do not substitute generated pronunciation.
- Stop current audio when leaving the screen or starting another clip.

## Verification

- A focused test proves the shuffled queue contains all 16 unique words and supports deterministic randomness.
- A component test covers the typed-answer loop: three-letter limit, wrong-answer retry, correct advance, and 16-word completion.
- Audio validation checks all 16 manifest entries and MP3 files.
- Run the existing test suite and production build to show the original game remains intact.
- Exercise the route in a browser at desktop and mobile widths, including replay, wrong retry, correct progression, completion, replay, and exit.

## Explicit non-goals

- No new dependency.
- No answer choices, randomized keyboard layout, images, hints that reveal letters, persistent mastery tracking, rewards, or changes to the existing game in this version.
