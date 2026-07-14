import soundsData from '../../data/sounds.json';

// Simple randomizer utility
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

class QuestionEngine {
  constructor() {
    // QA FIX: Strictly enforce Audio Safety gate using the correct JSON key
    this.sounds = soundsData.sounds.filter(s => s.human_review_status === 'approved');
  }

  /**
   * Generates a 10-question daily challenge array.
   * QA FIX: Implements 30/30/20/10/10 Algorithm scoped to MAP PROGRESSION.
   */
  generateDailyChallenge(unlockedSoundIds = [], currentNodeId = null, learningStats = {}, gameComplete = false) {
    const questions = [];
    
    let unlockedSounds = this.sounds.filter(s => unlockedSoundIds.includes(s.sound_id) || unlockedSoundIds.includes(s.label));
    let currentSound;
    
    if (gameComplete && unlockedSounds.length > 0) {
      // If game is complete, pick a weak sound or least tested sound as the "target"
      let sortedByAccuracy = [...unlockedSounds].sort((a, b) => {
        const statsA = learningStats[a.sound_id];
        const statsB = learningStats[b.sound_id];
        const accA = statsA && statsA.attempts > 0 ? statsA.firstAttemptHits / statsA.attempts : 1;
        const accB = statsB && statsB.attempts > 0 ? statsB.firstAttemptHits / statsB.attempts : 1;
        return accA - accB; // Lowest accuracy first
      });
      // Pick randomly from the bottom 5 weakest sounds
      const weakestPool = sortedByAccuracy.slice(0, 5);
      currentSound = weakestPool[Math.floor(Math.random() * weakestPool.length)];
    } else {
      currentSound = this.sounds.find(s => s.sound_id === currentNodeId || s.label === currentNodeId);
    }
    
    // Fallback if state is missing
    if (!currentSound || unlockedSounds.length === 0) {
      unlockedSounds = shuffle(this.sounds).slice(0, 5);
      currentSound = unlockedSounds[0];
    }
    
    // QA FIX (User Request): Flat Distribution
    // The user wants EVERY sound to be tested perfectly evenly, without prioritizing "currentSound" or "weakSounds".
    // We achieve this by sorting all unlocked sounds purely by their total attempts, ensuring a perfect rotating cycle.
    
    // 1. Sort unlocked sounds by least attempts
    let sortedByAttempts = shuffle([...unlockedSounds]).sort((a, b) => {
      const attemptsA = learningStats[a.sound_id]?.attempts || 0;
      const attemptsB = learningStats[b.sound_id]?.attempts || 0;
      return attemptsA - attemptsB;
    });

    // 2. Take the top 10 unique sounds (or all of them if < 10)
    let combinedTargets = sortedByAttempts.slice(0, 10);
    
    // 3. If they have fewer than 10 sounds unlocked, we must pad with random selections
    if (combinedTargets.length < 10) {
      let shuffledUnlocked = shuffle([...unlockedSounds]);
      while (combinedTargets.length < 10) {
        combinedTargets.push(shuffledUnlocked[Math.floor(Math.random() * shuffledUnlocked.length)]);
      }
    }
    
    // 4. Shuffle the 10 questions so the order is random
    combinedTargets = shuffle(combinedTargets);
    
    // Teacher Agent Pedagogical Fix: Strict Scope & Sequence
    const familySounds = currentSound.family ? this.sounds.filter(s => s.family === currentSound.family) : [];
    let distractorBasePool = Array.from(new Set([...unlockedSounds, ...familySounds, currentSound]));
    return this._buildQuestionsArray(combinedTargets, distractorBasePool);
  }

  generateAssignment(targetSoundId) {
    const targetSound = this.sounds.find(s => s.sound_id === targetSoundId || s.label === targetSoundId);
    if (!targetSound) return this.generateDailyChallenge();

    // QA FIX: Prevent Semantic Satiation by interleaving review sounds
    const reviewPool = shuffle(this.sounds.filter(s => s.sound_id !== targetSound.sound_id)).slice(0, 3);
    
    // Target, Target, Review, Target, Review, Target, Target, Review, Compare, Boss
    const combinedTargets = [
      targetSound, targetSound, reviewPool[0], 
      targetSound, reviewPool[1], targetSound, 
      targetSound, reviewPool[2], targetSound, targetSound
    ];
    // Teacher Agent Pedagogical Fix: Strict Scope & Sequence
    const familySounds = targetSound.family ? this.sounds.filter(s => s.family === targetSound.family) : [];
    let distractorBasePool = Array.from(new Set([...familySounds, targetSound]));
    return this._buildQuestionsArray(combinedTargets, distractorBasePool);
  }

  /**
   * Refresher Bootcamp: Rapid Diagnostic
   */
  generateRefresherAssignment(batchSoundIds, learningStats = {}) {
    if (!batchSoundIds || batchSoundIds.length === 0) return this.generateDailyChallenge(batchSoundIds, null, learningStats);
    const batchSounds = this.sounds.filter(s => batchSoundIds.includes(s.sound_id) || batchSoundIds.includes(s.label));
    if (batchSounds.length === 0) return this.generateDailyChallenge([], null, learningStats);

    // Identify weak sounds from the batch using stats
    let weakSounds = batchSounds.filter(s => {
      const stats = learningStats[s.sound_id];
      if (!stats || stats.attempts < 3) return false;
      return (stats.firstAttemptHits / stats.attempts) < 0.7; // Higher threshold for refresher
    });

    if (weakSounds.length === 0) weakSounds = batchSounds;

    // Build exactly 10 targets
    // Q1-Q5: Rapid Fire (random from batch)
    // Q6-Q8: Targeted Rescue (from weakSounds)
    // Q9: Compare (random from batch)
    // Q10: Boss (random from weakSounds or batch)
    
    const randomBatch = () => batchSounds[Math.floor(Math.random() * batchSounds.length)];
    const randomWeak = () => weakSounds[Math.floor(Math.random() * weakSounds.length)];

    const combinedTargets = [
      randomBatch(), randomBatch(), randomBatch(), randomBatch(), randomBatch(), // 1-5
      randomWeak(), randomWeak(), randomWeak(), // 6-8
      randomBatch(), // 9 (Compare)
      randomWeak()  // 10 (Boss)
    ];

    // Pedagogy FIX: Smart Cross-Vowel Distractors. Only pull distractors from easily confused vowel groups to build fine-grained discrimination.
    const batchFamily = batchSounds.length > 0 ? batchSounds[0].family : null;
    const confusingFamiliesMap = {
      'A Families': ['E Families', 'U Families'],
      'E Families': ['I Families', 'A Families'],
      'I Families': ['E Families'],
      'O Families': ['U Families'],
      'U Families': ['O Families', 'A Families']
    };
    const confusingFamilies = batchFamily ? (confusingFamiliesMap[batchFamily] || []) : [];
    const smartDistractors = this.sounds.filter(s => confusingFamilies.includes(s.family));
    
    // Fallback to random if no mapping found, else use targeted distractors
    const crossVowelPool = smartDistractors.length > 0 ? smartDistractors : this.sounds;
    
    let distractorBasePool = Array.from(new Set([...batchSounds, ...shuffle(crossVowelPool).slice(0, 10)]));
    return this._buildQuestionsArray(combinedTargets, distractorBasePool);
  }

  /**
   * Gym Workout: 3-Stage Remedial Practice
   */
  generateGymWorkout(targetSoundId, confusedWithLabel) {
    const targetSound = this.sounds.find(s => s.sound_id === targetSoundId || s.label === targetSoundId);
    if (!targetSound) return this.generateDailyChallenge();

    const questions = [];

    // Stage 1: Warm-up (2 choices, completely different family)
    let diffFamilyDistractors = this.sounds.filter(s => s.family !== targetSound.family);
    if (diffFamilyDistractors.length === 0) diffFamilyDistractors = this.sounds.filter(s => s.sound_id !== targetSound.sound_id);
    const warmupDistractor = shuffle(diffFamilyDistractors)[0];
    
    questions.push({
      id: `gym_warmup`,
      type: 'gym_warmup',
      targetSound: targetSound,
      choices: shuffle([targetSound.label, warmupDistractor.label]),
      correctAnswer: targetSound.label,
      choiceSounds: [targetSound, warmupDistractor],
      instructionAudio: 'inst_gym_warmup_yue',
      targetSoundAudio: targetSound.sound_id,
      correctFeedbackAudio: 'fb_correct_yue_001',
      wrongFeedbackAudio: 'fb_wrong_yue_001'
    });

    // Stage 2: Heavy Lifting (Discrimination against the confused sound, 2 times with different distractors if possible)
    let potentialLiftDistractors = this.sounds.filter(s => s.family === targetSound.family && s.sound_id !== targetSound.sound_id);
    if (potentialLiftDistractors.length === 0) potentialLiftDistractors = this.sounds.filter(s => s.sound_id !== targetSound.sound_id);
    
    // Make sure we have at least 2 distinct distractors if possible
    let liftDistractors = shuffle(potentialLiftDistractors);
    if (liftDistractors.length < 2) liftDistractors = [liftDistractors[0], liftDistractors[0]]; // fallback if extremely small pool

    for (let i = 0; i < 2; i++) {
      let confusedSound = liftDistractors[i];
      questions.push({
        id: `gym_lift_${i}`,
        type: 'gym_lift',
        targetSound: targetSound,
        choices: shuffle([targetSound.label, confusedSound.label]),
        correctAnswer: targetSound.label,
        choiceSounds: [targetSound, confusedSound],
        instructionAudio: 'inst_gym_lift_yue',
        targetSoundAudio: targetSound.sound_id,
        correctFeedbackAudio: 'fb_correct_yue_001',
        wrongFeedbackAudio: 'fb_wrong_yue_001'
      });
    }

    // Stage 3: The Sprint (Standard 3 choices)
    let sprintDistractors = shuffle(this.sounds.filter(s => s.sound_id !== targetSound.sound_id && s.sound_id !== confusedSound.sound_id)).slice(0, 2);
    questions.push({
      id: `gym_sprint`,
      type: 'gym_sprint',
      targetSound: targetSound,
      choices: shuffle([targetSound.label, ...sprintDistractors.map(d => d.label)]),
      correctAnswer: targetSound.label,
      choiceSounds: [targetSound, ...sprintDistractors],
      instructionAudio: 'inst_gym_sprint_yue',
      targetSoundAudio: targetSound.sound_id,
      correctFeedbackAudio: 'fb_correct_yue_001',
      wrongFeedbackAudio: 'fb_wrong_yue_001'
    });

    return questions;
  }

  generateBubbleChallenge(unlockedSoundIds = []) {
    let unlockedSounds = this.sounds.filter(s => unlockedSoundIds.includes(s.sound_id) || unlockedSoundIds.includes(s.label));
    if (unlockedSounds.length < 10) {
      unlockedSounds = this.sounds; // Fallback to all sounds if they haven't unlocked enough
    }

    const questions = [];
    
    // QA FIX: Fair selection queue to prevent random skipping
    if (!this._bubbleQueue || this._bubbleQueue.length === 0) {
      this._bubbleQueue = shuffle([...unlockedSounds]);
    }

    // 10 rounds
    for (let i = 0; i < 10; i++) {
      if (this._bubbleQueue.length === 0) {
        this._bubbleQueue = shuffle([...unlockedSounds]);
      }
      const targetSound = this._bubbleQueue.pop();
      
      // Progressive Difficulty (Level Design)
      let numDistractors = 2; // Rounds 1-3: 3 bubbles total
      if (i >= 3 && i < 7) numDistractors = 4; // Rounds 4-7: 5 bubbles total
      if (i >= 7) numDistractors = 5; // Rounds 8-10: 6 bubbles total

      if (!this._distractorQueue || this._distractorQueue.length === 0) {
        this._distractorQueue = shuffle([...this.sounds]);
      }
      
      let distractors = [];
      while (distractors.length < numDistractors) {
        if (this._distractorQueue.length === 0) {
          this._distractorQueue = shuffle([...this.sounds]);
        }
        let candidate = this._distractorQueue.pop();
        if (candidate.sound_id !== targetSound.sound_id && !distractors.find(d => d.sound_id === candidate.sound_id)) {
          distractors.push(candidate);
        }
      }
      
      const choices = shuffle([targetSound.label, ...distractors.map(d => d.label)]);
      
      questions.push({
        id: `bubble_${i}`,
        type: 'bubble',
        targetSound: targetSound,
        choices: choices,
        correctAnswer: targetSound.label,
        choiceSounds: [targetSound, ...distractors],
        instructionAudio: 'inst_bubble_yue',
        targetSoundAudio: targetSound.sound_id,
        correctFeedbackAudio: 'fb_correct_yue_001',
        wrongFeedbackAudio: 'fb_wrong_yue_001'
      });
    }

    return questions;
  }

  _buildQuestionsArray(combinedTargets, distractorBasePool) {
    const questions = [];
    let lastCorrectIndex = -1;
    let consecutiveSameCount = 0; // Prevent >2 'Same' in a row (Challenge 2)

    combinedTargets.forEach((targetSound, index) => {
      let type = 'listen_and_choose';
      if (index === 8) type = 'compare'; // 9th question
      if (index === 9) type = 'boss';    // 10th question

      // QA FIX: Boss sound requires 3 distractors (4 choices total) to avoid extreme visual clutter
      const numDistractors = type === 'boss' ? 3 : 2;
      
      // QA FIX: Fair Distractor Queue to prevent over-repetition
      let safePool = distractorBasePool.length > numDistractors ? distractorBasePool : this.sounds;
      
      if (!this._distractorQueue || this._distractorQueue.length === 0) {
        this._distractorQueue = shuffle([...safePool]);
      }
      
      let potentialDistractors = safePool.filter(s => s.sound_id !== targetSound.sound_id);
      let sameFamily = potentialDistractors.filter(s => s.family && targetSound.family && s.family === targetSound.family);
      
      let distractors = [];
      if (sameFamily.length > 0) {
        distractors.push(shuffle(sameFamily)[0]);
      }
      
      let safetyCounter = 0;
      while (distractors.length < numDistractors && safetyCounter < 50) {
        safetyCounter++;
        if (this._distractorQueue.length === 0) {
          this._distractorQueue = shuffle([...safePool]);
        }
        let candidate = this._distractorQueue.pop();
        // Don't add if it's the target or already in distractors
        if (candidate && candidate.sound_id !== targetSound.sound_id && !distractors.find(d => d.sound_id === candidate.sound_id)) {
          distractors.push(candidate);
        }
      }
      
      if (type === 'compare') {
        let isSame = Math.random() > 0.5;
        // Challenge 2: Prevent 'Same' from appearing too many times in a row
        if (consecutiveSameCount >= 2) {
          isSame = false;
        }
        
        if (isSame) consecutiveSameCount++;
        else consecutiveSameCount = 0;

        const compareSoundObj = isSame ? targetSound : distractors[0];
        questions.push({
          id: `q_${index}`,
          type: type,
          targetSound: targetSound,
          compareSound: compareSoundObj,
          choices: ['Same', 'Different'],
          correctAnswer: isSame ? 'Same' : 'Different',
          instructionAudio: 'inst_compare_yue',
          targetSoundAudio: targetSound.sound_id,
          compareSoundAudio: compareSoundObj.sound_id,
          correctFeedbackAudio: 'fb_correct_yue_001',
          wrongFeedbackAudio: 'fb_wrong_yue_001'
        });
        lastCorrectIndex = -1; // Reset for compare
      } else {
        let choices = shuffle([targetSound.label, ...distractors.map(d => d.label)]);
        let correctIndex = choices.indexOf(targetSound.label);

        // Player Experience FIX (Challenge 21): Allow answer position to repeat so kids don't meta-game
        lastCorrectIndex = correctIndex;

        questions.push({
          id: `q_${index}`,
          type: type,
          targetSound: targetSound,
          choices: choices,
          correctAnswer: targetSound.label,
          choiceSounds: [targetSound, ...distractors],
          instructionAudio: type === 'boss' ? 'inst_boss_yue' : 'inst_listen_and_choose_yue',
          targetSoundAudio: targetSound.sound_id,
          correctFeedbackAudio: 'fb_correct_yue_001',
          wrongFeedbackAudio: 'fb_wrong_yue_001'
        });
      }
    });

    return questions;
  }
}

export const questionEngine = new QuestionEngine();
