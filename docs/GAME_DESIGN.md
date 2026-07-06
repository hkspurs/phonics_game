# Phonics Learning Platform — Game Design Document

## 1. Daily Sound Challenge (The Core Loop)
The daily challenge consists of **10 questions** taking about 5–8 minutes.

### Question Allocation Algorithm (Map Progression Scoped)
The algorithm strictly pulls from the child's `unlockedSounds` and `currentNode` to prevent cognitive overload.
- **30% (3 qs)**: Recent review (drawn from `unlockedSounds`).
- **30% (3 qs)**: Target sound family (drawn from `currentNode`).
- **20% (2 qs)**: Weak sounds (drawn from `unlockedSounds` based on lowest `firstAttemptHits`).
- **10% (1 q)**: Comparison sounds (confusable pairs targeting `currentNode`).
- **10% (1 q)**: Final boss challenge (5-choice layout, exciting finale for `currentNode`).

## 2. Question Engine Templates
To avoid the "AI-template look", the UI rendering for these questions must vary (e.g., bubbles, cards, treasure boxes, doors).

1. **Listen and Choose**: Audio plays. Child chooses from 2–4 sound cards.
2. **Sound Match**: Child hears a sound and drags it to the matching letter pair.
3. **Same or Different**: Child hears two sounds and decides whether they are the same.
4. **Build the Sound**: Child drags letters into the correct order.
5. **Find the Sound Bubble**: Floating bubbles; child taps the matching one.
6. **Picture Sound Match**: Child hears a sound and chooses a related image.
7. **Echo Sequence**: Child hears a short sequence and repeats it by tapping cards.
8. **Boss Question**: High-stakes animation (but low pressure) used at the end of the daily challenge.

## 3. Feedback System
- **Correct**: Mascot jumps, sound gem flies into counter, correct letters glow, joyful sound effect.
- **Wrong (Gentle Retries)**: Replay audio automatically as a hint. Incorrect choices instantly fade out (`opacity: 0`) and become unclickable, guiding the child via process of elimination. The traumatic "Wrong!" text and 1-second delay have been entirely removed to protect child psychology.

## 4. Mastery Algorithm
Mastery determines what questions are generated. First-attempt accuracy is tracked separately from final correctness.
- **Practised**: At least 3 total attempts.
- **Improving**: Recent accuracy > 60%.
- **Strong**: Recent accuracy > 80%.
- **Mastered**: 90%+ accuracy (Strict Phase 2 requirement) across at least 3 sessions. Map nodes only unlock if the parent node reaches this 90% threshold.
- **Weak**: Below 60% accuracy, confused with same pair 3 times, very slow response time, high replay usage, or manually flagged by a teacher.

## 5. Brain Games
Short 1-3 minute mini-games unlocked *only after* completing the Daily Challenge.
- **Sound Catcher**: Catch falling bubbles that match the audio.
- **Echo Cave**: Simon-says style memory sequence game.
- **Letter Train**: Drag the right sound card onto a moving train.
- **Monster Feed**: Feed the monster the correct sound.
