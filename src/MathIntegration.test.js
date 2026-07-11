import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './store/gameStore';
import { mathQuestionEngine } from './math/engine/MathQuestionEngine';
import { composeMathSession } from './math/engine/difficulty';

describe('Mathematics Full Integration', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
    // Also reset math explicitly
    useGameStore.getState().resetMathProgress();
  });

  it('can run a full daily session and update profile', () => {
    const store = useGameStore.getState();
    const initialStars = store.stars;
    const initialTickets = store.tickets;
    
    // 1. Compose session
    const plan = composeMathSession(
      store.math.unlockedSkillIds, 
      store.math, 
      store.getMathSkillStatus
    );
    expect(plan.length).toBe(8);

    // 2. Generate questions
    const questions = plan.map((p, i) => mathQuestionEngine.generateQuestion(p.skillId, {
      difficulty: p.difficulty,
    }));
    
    expect(questions.length).toBe(8);
    expect(questions[0].id).toBeDefined();

    // 3. Start session
    useGameStore.getState().startMathSession(questions);
    
    expect(useGameStore.getState().math.isMathChallengeActive).toBe(true);
    expect(useGameStore.getState().math.mathActiveQuestions).toHaveLength(8);
    
    // 4. Play through session
    for (let i = 0; i < 8; i++) {
      // simulate correct answer on first try
      useGameStore.getState().recordMathAnswer(questions[i].skillId, true, questions[i].difficulty);
      useGameStore.getState().awardMathStars(3); // 3 stars per question
      if (i < 7) {
        useGameStore.getState().nextMathQuestion();
      }
    }
    
    // 5. Complete session
    useGameStore.getState().completeMathDaily();
    
    const finalStore = useGameStore.getState();
    expect(finalStore.math.completedToday).toBe(true);
    expect(finalStore.stars).toBe(initialStars + 24); // 8 * 3
    expect(finalStore.tickets).toBe(initialTickets + 1); // 1 ticket for math
    expect(finalStore.math.isMathChallengeActive).toBe(false);
  });
});
