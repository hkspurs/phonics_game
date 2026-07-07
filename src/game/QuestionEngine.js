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
  generateDailyChallenge(unlockedSoundIds = [], currentNodeId = null, learningStats = {}) {
    const questions = [];
    
    let unlockedSounds = this.sounds.filter(s => unlockedSoundIds.includes(s.sound_id) || unlockedSoundIds.includes(s.label));
    let currentSound = this.sounds.find(s => s.sound_id === currentNodeId || s.label === currentNodeId);
    
    // Fallback if state is missing
    if (!currentSound || unlockedSounds.length === 0) {
      unlockedSounds = shuffle(this.sounds).slice(0, 5);
      currentSound = unlockedSounds[0];
    }
    
    // Create strictly scoped learning buckets
    const reviewSounds = [
      unlockedSounds[Math.floor(Math.random() * unlockedSounds.length)],
      unlockedSounds[Math.floor(Math.random() * unlockedSounds.length)],
      unlockedSounds[Math.floor(Math.random() * unlockedSounds.length)]
    ];
    const targetSounds = [currentSound, currentSound, currentSound];
    
    // QA FIX: Prioritize actual weak sounds from learningStats
    let actualWeakSounds = unlockedSounds.filter(s => {
      const stats = learningStats[s.sound_id];
      if (!stats || stats.attempts < 3) return false;
      return (stats.firstAttemptHits / stats.attempts) < 0.6;
    });
    
    // If no severely weak sounds, find moderately weak sounds (< 0.85) instead of mastered ones
    if (actualWeakSounds.length === 0) {
      actualWeakSounds = unlockedSounds.filter(s => {
        const stats = learningStats[s.sound_id];
        if (!stats || stats.attempts < 3) return false;
        return (stats.firstAttemptHits / stats.attempts) < 0.85;
      });
    }

    const weakPool = actualWeakSounds.length > 0 ? actualWeakSounds : unlockedSounds;

    const weakSounds = [
      weakPool[Math.floor(Math.random() * weakPool.length)],
      weakPool[Math.floor(Math.random() * weakPool.length)]
    ];
    const compareSound = [currentSound];
    const bossSound = [currentSound];
    
    const first8 = shuffle([...reviewSounds, ...targetSounds, ...weakSounds]);
    const combinedTargets = [...first8, ...compareSound, ...bossSound];
    
    let distractorBasePool = Array.from(new Set([...unlockedSounds, currentSound, ...shuffle(this.sounds).slice(0, 10)]));
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
    let distractorBasePool = Array.from(new Set([targetSound, ...shuffle(this.sounds).slice(0, 15)]));
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
      correctAnswer: targetSound.label
    });

    // Stage 2: Heavy Lifting (Discrimination against the confused sound, 2 times)
    let confusedSound = this.sounds.find(s => s.label === confusedWithLabel);
    if (!confusedSound) {
      let sameFamilyDistractors = this.sounds.filter(s => s.family === targetSound.family && s.sound_id !== targetSound.sound_id);
      if (sameFamilyDistractors.length === 0) sameFamilyDistractors = diffFamilyDistractors;
      confusedSound = shuffle(sameFamilyDistractors)[0];
    }

    for (let i = 0; i < 2; i++) {
      questions.push({
        id: `gym_lift_${i}`,
        type: 'gym_lift',
        targetSound: targetSound,
        choices: shuffle([targetSound.label, confusedSound.label]),
        correctAnswer: targetSound.label
      });
    }

    // Stage 3: The Sprint (Standard 3 choices)
    let sprintDistractors = shuffle(this.sounds.filter(s => s.sound_id !== targetSound.sound_id && s.sound_id !== confusedSound.sound_id)).slice(0, 2);
    questions.push({
      id: `gym_sprint`,
      type: 'gym_sprint',
      targetSound: targetSound,
      choices: shuffle([targetSound.label, ...sprintDistractors.map(d => d.label)]),
      correctAnswer: targetSound.label
    });

    return questions;
  }

  generateBubbleChallenge(unlockedSoundIds = []) {
    let unlockedSounds = this.sounds.filter(s => unlockedSoundIds.includes(s.sound_id) || unlockedSoundIds.includes(s.label));
    if (unlockedSounds.length < 10) {
      unlockedSounds = this.sounds; // Fallback to all sounds if they haven't unlocked enough
    }

    const questions = [];
    
    // 10 rounds
    for (let i = 0; i < 10; i++) {
      const targetSound = unlockedSounds[Math.floor(Math.random() * unlockedSounds.length)];
      
      // Progressive Difficulty (Level Design)
      let numDistractors = 2; // Rounds 1-3: 3 bubbles total
      if (i >= 3 && i < 7) numDistractors = 4; // Rounds 4-7: 5 bubbles total
      if (i >= 7) numDistractors = 9; // Rounds 8-10: 10 bubbles total

      let potentialDistractors = this.sounds.filter(s => s.sound_id !== targetSound.sound_id);
      const distractors = shuffle(potentialDistractors).slice(0, numDistractors);
      
      const choices = shuffle([targetSound.label, ...distractors.map(d => d.label)]);
      
      questions.push({
        id: `bubble_${i}`,
        type: 'bubble',
        targetSound: targetSound,
        choices: choices,
        correctAnswer: targetSound.label
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
      
      // Smart Distractor Logic (Challenge 28: Dynamic Difficulty)
      // Pick 1 from same family (if possible), others completely random to avoid guessing purely by family
      let potentialDistractors = distractorBasePool.filter(s => s.sound_id !== targetSound.sound_id);
      let sameFamily = potentialDistractors.filter(s => s.family && targetSound.family && s.family === targetSound.family);
      let diffFamily = potentialDistractors.filter(s => !s.family || s.family !== targetSound.family);
      
      let distractors = [];
      if (sameFamily.length > 0) {
        distractors.push(shuffle(sameFamily)[0]);
        distractors.push(...shuffle(diffFamily).slice(0, numDistractors - 1));
      } else {
        distractors = shuffle(potentialDistractors).slice(0, numDistractors);
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
          correctAnswer: isSame ? 'Same' : 'Different'
        });
        lastCorrectIndex = -1; // Reset for compare
      } else {
        let choices = shuffle([targetSound.label, ...distractors.map(d => d.label)]);
        let correctIndex = choices.indexOf(targetSound.label);

        // Player Experience FIX (Challenge 21): Prevent answer position repeating AT ALL
        while (correctIndex === lastCorrectIndex) {
            choices = shuffle(choices);
            correctIndex = choices.indexOf(targetSound.label);
        }
        lastCorrectIndex = correctIndex;

        questions.push({
          id: `q_${index}`,
          type: type,
          targetSound: targetSound,
          choices: choices,
          correctAnswer: targetSound.label
        });
      }
    });

    return questions;
  }
}

export const questionEngine = new QuestionEngine();
