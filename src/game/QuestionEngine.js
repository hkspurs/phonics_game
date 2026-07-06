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
    const reviewPool = shuffle(this.sounds.filter(s => s.sound_id !== targetSound.sound_id)).slice(0, 2);
    
    const combinedTargets = [
      targetSound, targetSound, reviewPool[0], 
      targetSound, targetSound, reviewPool[1], 
      targetSound, targetSound, targetSound, targetSound
    ];
    let distractorBasePool = Array.from(new Set([targetSound, ...shuffle(this.sounds).slice(0, 10)]));
    return this._buildQuestionsArray(combinedTargets, distractorBasePool);
  }

  _buildQuestionsArray(combinedTargets, distractorBasePool) {
    const questions = [];
    combinedTargets.forEach((targetSound, index) => {
      let type = 'listen_and_choose';
      if (index === 8) type = 'compare'; // 9th question
      if (index === 9) type = 'boss';    // 10th question

      // QA FIX: Boss sound requires 3 distractors (4 choices total) to avoid extreme visual clutter
      const numDistractors = type === 'boss' ? 3 : 2;
      
      // Smart Distractor Logic: Match by sound family, not blind string slicing
      let potentialDistractors = distractorBasePool.filter(s => s.sound_id !== targetSound.sound_id);
      let smartDistractors = potentialDistractors.filter(s => 
        s.family && targetSound.family && s.family === targetSound.family
      );
      
      let distractors;
      if (smartDistractors.length >= numDistractors) {
        distractors = shuffle(smartDistractors).slice(0, numDistractors);
      } else {
        distractors = shuffle(potentialDistractors).slice(0, numDistractors);
      }
      
      if (type === 'compare') {
        const isSame = Math.random() > 0.5;
        const compareSoundObj = isSame ? targetSound : distractors[0];
        questions.push({
          id: `q_${index}`,
          type: type,
          targetSound: targetSound,
          compareSound: compareSoundObj,
          choices: ['Same', 'Different'],
          correctAnswer: isSame ? 'Same' : 'Different'
        });
      } else {
        const choices = shuffle([targetSound.label, ...distractors.map(d => d.label)]);
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
