import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import MathMascot from '../math/components/MathMascot';
import MathQuestionRenderer from '../math/renderers/MathQuestionRenderer';
import CorrectFeedback from '../components/CorrectFeedback';
import WrongFeedback from '../components/WrongFeedback';

export default function MathDailyChallenge() {
  const navigate = useNavigate();
  
  const { 
    math: { mathActiveQuestions, mathCurrentQuestionIndex, isMathChallengeActive },
    recordMathAnswer,
    nextMathQuestion,
    awardMathStars,
  } = useGameStore();

  const [feedbackState, setFeedbackState] = useState(null); // 'correct', 'wrong', null
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStartedInteraction, setHasStartedInteraction] = useState(false);

  // Redirect if no active challenge or out of bounds
  useEffect(() => {
    if (!isMathChallengeActive || mathActiveQuestions.length === 0 || mathCurrentQuestionIndex >= mathActiveQuestions.length) {
      navigate('/math');
    }
  }, [isMathChallengeActive, mathActiveQuestions, mathCurrentQuestionIndex, navigate]);

  const currentQ = mathActiveQuestions[mathCurrentQuestionIndex];

  if (!currentQ) {
    return (
      <div className="screen-container" style={{ background: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#b45309' }}>Loading Math Challenge...</h2>
      </div>
    );
  }

  const handleAnswer = (isCorrect, attemptsTaken) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (isCorrect) {
      setFeedbackState('correct');
      // Calculate stars: 3 for 1st attempt, 2 for 2nd, 1 for 3+
      const stars = Math.max(1, 4 - attemptsTaken);
      awardMathStars(stars);
      recordMathAnswer(currentQ.skillId, attemptsTaken === 1, currentQ.difficulty);
      
      const startTime = Date.now();
      const proceed = () => {
        const elapsed = Date.now() - startTime;
        const delayNeeded = Math.max(0, 1500 - elapsed);
        
        setTimeout(() => {
          setIsProcessing(false);
          if (mathCurrentQuestionIndex + 1 >= mathActiveQuestions.length) {
            navigate('/reward?subject=math');
          } else {
            setFeedbackState(null);
            nextMathQuestion();
          }
        }, delayNeeded);
      };

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const praises = attemptsTaken === 1 ? ["Great job!", "Awesome math!"] : ["Good try, you found it!"];
        const utterance = new SpeechSynthesisUtterance(praises[Math.floor(Math.random() * praises.length)]);
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }

      audioEngine.play('assets/correct_chime.mp3').catch(() => {}).finally(proceed);
    } else {
      recordMathAnswer(currentQ.skillId, false, currentQ.difficulty);
      setFeedbackState('wrong');
      
      setTimeout(() => {
        setFeedbackState(prev => prev === 'wrong' ? null : prev);
        setIsProcessing(false);
      }, 1000);
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Let's try again.");
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const progressPercent = Math.max(5, (mathCurrentQuestionIndex / mathActiveQuestions.length) * 100);

  return (
    <div className="screen-container" style={{ background: '#fffbeb', alignItems: 'center' }}>
      
      {!hasStartedInteraction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeInWipe 0.5s' }}>
          <div style={{ transform: 'scale(1.5)', marginBottom: '2rem' }}>
            <MathMascot feedbackState="happy" />
          </div>
          <h2 style={{ fontSize: '3rem', color: '#b45309', marginBottom: '2rem' }}>Ready for Maths?</h2>
          <button className="btn-primary" style={{ fontSize: '3rem', padding: '2rem 4rem', animation: 'pulse-glow 2s infinite', background: '#f59e0b' }} onClick={() => setHasStartedInteraction(true)}>
            Let's Go!
          </button>
        </div>
      )}
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => {
          if (window.confirm("Are you sure you want to quit? You will lose today's progress!")) {
             navigate('/math');
          }
        }}>
          <X size={24} />
        </button>
        
        <div style={{ flex: 1, margin: '0 2rem', height: '16px', background: '#fef3c7', borderRadius: '8px', overflow: 'hidden', border: '2px solid #fde68a' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#f59e0b', borderRadius: '8px', transition: 'width 0.3s ease' }}></div>
        </div>
        
        <span style={{ fontWeight: 'bold', color: '#b45309', fontSize: '1.25rem' }}>
          {mathCurrentQuestionIndex + 1}/{mathActiveQuestions.length}
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Mascot floating nearby */}
        <div style={{ position: 'absolute', top: 0, right: '10%', width: '120px', height: '120px', zIndex: 10 }}>
           <MathMascot style={{ width: '100%', height: '100%' }} feedbackState={feedbackState} />
           {feedbackState === 'correct' && <CorrectFeedback trigger={true} style={{ position: 'absolute', inset: 0 }} />}
           {feedbackState === 'wrong' && <WrongFeedback trigger={true} style={{ position: 'absolute', inset: 0 }} />}
        </div>

        {/* Question Renderer */}
        <div style={{ 
          width: '100%', 
          maxWidth: '800px', 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '24px', 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          pointerEvents: isProcessing ? 'none' : 'auto'
        }}>
          <MathQuestionRenderer question={currentQ} onAnswer={handleAnswer} />
        </div>
      </div>
    </div>
  );
}
