# Phonics Learning Platform — Screen List

## 1. Child Interface (Tablet First)

### 1.1 Subject Gateway (Root `/`)
- **Visuals**: A vibrant split-screen or dual-card layout.
- **Core Elements**: 
  - Massive touch targets for "Phonics Forest" and "Math Kingdom".
  - Shared currency header (Stars, Gems, Tickets).
  - Parent Gate Settings access.

### 1.2 Subject Home Dashboards
- **Visuals**: Animated landscape (clouds moving, stars sparkling, mascot waving).
- **Core Elements**: 
  - Massive "Start Daily Challenge" button.
  - Links to subject-specific Mastery Maps, Training Gyms, and Brain Games.
  - Daily progress and streak indicators.

### 1.2 Daily Sound Challenge
- **Visuals**: Varies by question template. Physical-looking answer tiles.
- **Core Elements**:
  - Prominent "Play Sound" button with expanding wave animation.
  - Answer area (cards, bubbles, drag-drop targets).
  - Mascot on the side providing emotional feedback.
  - Top progress bar (e.g., 3/10 complete).

### 1.3 Reward Screen (End of Daily Mission)
- **Visuals**: Confetti, mascot dancing, glowing items.
- **Core Elements**:
  - Summary of earned Stars and Gems.
  - Badge unlock reveal.
  - "Brain Games Unlocked" ticket animation.
  - Button to return to Home or go to Brain Games.

### 1.4 Mastery Maps
- **Visuals**: A scrolling 2D map with distinct environments (Beach, Forest, Cave for Phonics; Castles for Math).
- **Core Elements**:
  - Nodes representing skill families (color-coded by mastery).
  - Ability to tap a node to launch specific practice.

### 1.5 Training Gym (Math)
- **Visuals**: An endless mode focused on rapid procedural practice.
- **Core Elements**:
  - Automatically identifies the child's weakest unlocked skill and generates procedural questions using a PRNG engine.

### 1.5 Reward Room
- **Visuals**: A bedroom or clubhouse.
- **Core Elements**:
  - Sticker book viewer.
  - Mascot dress-up area (hats/accessories).
  - Placeable room decorations earned through mastery.

### 1.6 Brain Games Island
- **Visuals**: An arcade or amusement park theme.
- **Core Elements**:
  - Selection of 3-4 mini-games.
  - Ticket counter (games cost tickets earned from daily learning).

## 2. Parent / Teacher Interface (Desktop / Mobile Web)

### 2.1 Parent & Teacher Dashboard (Completed)
- **Entry**: Hidden `Settings` gear icon on Home Dashboard, protected by PIN `1234`.
- **Visuals**: Clean, clear, data-focused.
- **Core Elements**:
  - Deep Learning Analytics: Lists of "Mastered Sounds" (>=90%), "Weak Sounds" (<60%), and "Confused Pairs".
  - Curriculum Control: Full list of 105 sounds.
  - Controls to Preview Audio, "Assign" sounds to the child, and "Force Unlock" map nodes.
  - "Factory Reset" nuclear option to wipe local storage for new students.

### 2.2 Assignments Manager (Completed)
- **Core Elements**:
  - `AssignmentHub.jsx` allows the child to see what the teacher has assigned.
  - Uses the same core `QuestionEngine` logic to ensure consistency with Daily Challenges.

## 3. Admin / QA Interface

### 3.1 Audio Review Tool
- **Core Elements**:
  - Waveform visualizer.
  - Inputs to adjust start time / end time.
  - Playback at normal and slow speeds.
  - "Approve" / "Reject" / "Add Note" buttons.
