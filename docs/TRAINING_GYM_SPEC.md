# Feature Specification: Phonics Training Gym (發音特訓健身房)

## 1. Feature Overview
**Name:** Phonics Training Gym
**Objective:** Transform remedial practice for "weak" sounds from a frustrating punishment into a positive, empowering "coaching" experience.
**Target Audience:** 6-year-olds who are struggling with specific phonics families or confusing two similar sounds (e.g., `EX` vs `IX`).

## 2. Trigger Conditions (When does a sound go to the Gym?)
A sound is flagged for the Training Gym based on `learningStats` in `gameStore.js`:
*   **Accuracy Drop:** `firstAttemptHits / attempts < 0.6` (minimum 5 attempts).
*   **Confusion Detection:** The `confusedWith` counter for a specific pair exceeds 3.
*   **Visual Indicator:** On the `MasteryMap`, the node color changes to Purple (Weak), and a small "dumbbell" icon appears next to the sound.

## 3. Entry Point
*   Tapping a "Weak" node on the Adventure Map opens a special Modal: *"Oh no! [Sound] is feeling a bit weak. Let's take it to the Gym to get stronger!"*
*   The "GO!" button is replaced with a "To the Gym! 🏋️‍♂️" button.

## 4. Core Gameplay Loop (The Workout Routine)
The gym consists of a rapid, highly-scaffolded 3-stage workout. The child acts as the "Coach".

### Stage 1: Warm-up (Isolating the Sound)
*   **UI:** The weak sound appears as an SVG character holding a jump rope.
*   **Mechanic:** Reduced cognitive load. The audio plays 20% slower. The child is only given **2 distinct choices** (e.g., `IX` vs `AB` - completely different families).
*   **Animation:** Correct answer makes the character successfully jump rope with a happy "ding!"

### Stage 2: Heavy Lifting (Targeted Discrimination)
*   **UI:** The character is standing under a barbell.
*   **Mechanic:** The exact confused pair is tested (e.g., `IX` vs `EX`). The child must listen and identify the correct sound 2 times in a row.
*   **Animation:** Correct answer adds a weight plate to the barbell. Wrong answer causes the barbell to gently lower with a "Phew, that's heavy! Let's listen again" animation (No red crosses or negative buzzers).

### Stage 3: The Sprint (Speed & Confidence)
*   **UI:** The character is on a running track.
*   **Mechanic:** Standard 3-choice question.
*   **Animation:** Correct answer makes the character sprint across the finish line with confetti and cheering audio (`cheer.mp3`).

## 5. Technical Implementation Details
*   **Dynamic Hitboxes:** To reduce frustration, hitboxes for the answer cards in the Gym are scaled up by 20% (applying the Dynamic Error-Tolerance concept).
*   **State Update (`gameStore.js`):** Upon completing the Gym workout, the system injects a "Confidence Boost" into `learningStats`. It adds `+2 attempts` and `+2 firstAttemptHits` artificially, bumping the accuracy percentage up so the node returns to the "Practising" (Blue) or "Unlocked" (Green) state, officially "graduating" from the Gym.
*   **Audio Engine:** Need a new `playSlow(url)` function in `AudioEngine.js` using `playbackRate = 0.8` for the Warm-up stage.

## 6. Required Assets (SVG & Audio)
*   **SVGs:** 
    *   `GymBackground.svg` (A bright, encouraging training room)
    *   `Dumbbell.svg` (Icon for weak nodes)
    *   `MascotCoach.svg` (Mascot wearing a sweatband and whistle)
*   **Audio:**
    *   `whistle.mp3` (Transition sound)
    *   `cheer.mp3` (Reward sound)
    *   `heavy_lift.mp3` (Comedic grunt for wrong answers)

## 7. Parent Dashboard Integration
*   Parents will see a "Gym Log". Instead of just saying "Your child is failing IX", it will say: *"IX was weak, but your child completed 2 Gym Workouts and improved accuracy by 25%!"*
