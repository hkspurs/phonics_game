import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import MathMascot from '../math/components/MathMascot';
import MathQuestionRenderer from '../math/renderers/MathQuestionRenderer';

export default function MathTrainingGym() {
  const navigate = useNavigate();
  
  const { 
    math,
    recordMathAnswer,
    recordMathAttempt,
    nextMathQuestion,
  } = useGameStore();

  const {
    mathActiveQuestions: activeQuestions,
    mathCurrentQuestionIndex: currentQuestionIndex,
    isMathChallengeActive,
  } = math;

  const [feedbackState, setFeedbackState] = useState(null);
  const [attemptCount, setAttemptCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    if (!isMathChallengeActive || activeQuestions.length === 0 || currentQuestionIndex >= activeQuestions.length) {
      navigate('/math/map');
    }
  }, [isMathChallengeActive, activeQuestions, currentQuestionIndex, navigate]);

  const currentQ = activeQuestions[currentQuestionIndex];

  if (!currentQ) return null;

  const handleAnswer = (isCorrect, attempts) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (isCorrect) {
      setFeedbackState('correct');
      const responseTimeMs = Date.now() - questionStartTime;
      const hintLevelUsed = Math.max(0, attemptCount - 1);
      
      recordMathAnswer({
        skillId: currentQ.skillId,
        firstAttemptCorrect: attemptCount === 1,
        eventuallyCompleted: true,
        attemptCount: attemptCount,
        hintLevelUsed,
        responseTimeMs,
        difficulty: currentQ.difficulty || 1
      });
      recordMathAttempt({
        question: currentQ,
        selectedAnswer: currentQ.correctAnswer,
        isCorrect: true,
        attemptNumber: attemptCount,
        hintLevel: hintLevelUsed,
        responseTimeMs,
      });
      
      audioEngine.playUI('correct');

      setTimeout(() => {
        setIsProcessing(false);
        if (currentQuestionIndex + 1 >= activeQuestions.length) {
          navigate('/math/map'); // Return to map after training
        } else {
          setFeedbackState(null);
          setAttemptCount(1);
          setQuestionStartTime(Date.now());
          nextMathQuestion();
        }
      }, 1500);

    } else {
      const responseTimeMs = Date.now() - questionStartTime;
      const hintLevelUsed = Math.max(0, attemptCount - 1);
      
      recordMathAnswer({
        skillId: currentQ.skillId,
        firstAttemptCorrect: false,
        eventuallyCompleted: false,
        attemptCount: attemptCount,
        hintLevelUsed,
        responseTimeMs,
        difficulty: currentQ.difficulty || 1
      });
      recordMathAttempt({
        question: currentQ,
        selectedAnswer: null,
        isCorrect: false,
        attemptNumber: attemptCount,
        hintLevel: hintLevelUsed,
        responseTimeMs,
      });
      setAttemptCount(prev => prev + 1);
      
      setFeedbackState('wrong');
      audioEngine.playUI('error');
      
      setTimeout(() => {
        setFeedbackState(null);
        setIsProcessing(false);
      }, 1500);
    }
  };

  const progressPercent = Math.max(5, (currentQuestionIndex / activeQuestions.length) * 100);

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(to bottom, #dbeafe, #eff6ff)', alignItems: 'center' }}>
      
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => {
             navigate('/math/map');
        }}>
          <X size={24} /> Quit
        </button>
        
        <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold', color: '#3b82f6' }}>
          🏋️‍♂️ Math Gym
        </div>

        <span style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '1.25rem' }}>
          {currentQuestionIndex + 1}/{activeQuestions.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '2rem', alignItems: 'center' }}>
        
        {/* Mascot Feedback Area */}
        <div style={{ height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <MathMascot style={{ width: '150px' }} feedbackState={feedbackState} />
        </div>

        {/* Question Area */}
        <div style={{ width: '100%', padding: '2rem', background: 'white', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', pointerEvents: isProcessing ? 'none' : 'auto' }}>
           <MathQuestionRenderer question={currentQ} onAnswer={handleAnswer} />
        </div>
      </div>
    </div>
  );
}
