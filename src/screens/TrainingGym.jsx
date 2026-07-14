import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import MascotRabbit from '../components/MascotRabbit';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { X, Play, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TrainingGym() {
  const navigate = useNavigate();
  const { activeQuestions, currentQuestionIndex, answerQuestion, nextQuestion, completeGymWorkout, currentNode, isChallengeActive, currentChallengeType } = useGameStore();
  
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState(''); // Added for dictation
  const [attempts, setAttempts] = useState(0);
  const [animState, setAnimState] = useState('idle'); // idle, success, fail
  const processingRef = useRef(false);

  const currentQ = activeQuestions[currentQuestionIndex];
  
  useEffect(() => {
    if (!isChallengeActive || currentChallengeType !== 'gym' || activeQuestions.length === 0) {
      navigate('/map');
      return;
    }
    // Auto-play audio on mount
    playQuestionAudio();
  }, [currentQuestionIndex]);

  const playQuestionAudio = () => {
    if (!currentQ) return;
    if (currentQ.type === 'gym_warmup') {
      // Play slow
      audioEngine.play(currentQ.targetSound.audio_url, 0, 0, 0.8);
    } else {
      audioEngine.play(currentQ.targetSound.audio_url);
    }
  };

  if (!currentQ) return null;

  const handleChoice = (choiceLabel) => {
    if (processingRef.current || isRevealed) return;
    processingRef.current = true;
    
    const isCorrect = choiceLabel === currentQ.correctAnswer;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (isCorrect) {
      setIsRevealed(true);
      setSelectedId(choiceLabel);
      setAnimState('success');
      audioEngine.playUI('correct');
      
      if (currentQ.type === 'gym_sprint') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      answerQuestion(true, newAttempts);

      setTimeout(() => {
        if (currentQuestionIndex >= activeQuestions.length - 1) {
          audioEngine.playUI('pop'); // Or cheer
          processingRef.current = false;
          completeGymWorkout(currentNode);
          useGameStore.setState({ isChallengeActive: false, currentChallengeType: null });
          navigate('/map');
        } else {
          setIsRevealed(false);
          setSelectedId(null);
          setTypedAnswer('');
          setAttempts(0);
          setAnimState('idle');
          processingRef.current = false;
          nextQuestion();
        }
      }, 2000);
    } else {
      setAnimState('fail');
      audioEngine.playUI('error');
      setTimeout(() => {
        setAnimState('idle');
        processingRef.current = false;
      }, 1000);
      playQuestionAudio(); // Replay audio as a gentle hint
    }
  };

  const renderStageVisuals = () => {
    if (currentQ.type === 'gym_warmup') {
      return (
        <div style={{ position: 'relative', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <MascotRabbit feedbackState={animState === 'success' ? 'correct' : null} style={{ width: '100px', transform: animState === 'success' ? 'translateY(-30px)' : 'none' }} />
          {/* Jump rope visual */}
          <svg style={{ position: 'absolute', bottom: -20, width: '200px', height: '100px', pointerEvents: 'none' }}>
            <path d="M 10 50 Q 100 120 190 50" fill="none" stroke="#3b82f6" strokeWidth={animState === 'success' ? 4 : 2} className={animState === 'success' ? 'animate-spin' : ''} />
          </svg>
        </div>
      );
    } else if (currentQ.type === 'gym_lift') {
      return (
        <div style={{ position: 'relative', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <MascotRabbit feedbackState={animState === 'success' ? 'correct' : null} style={{ width: '100px' }} />
          {/* Barbell visual */}
          <div style={{ 
            position: 'absolute', 
            top: animState === 'success' ? -20 : (animState === 'fail' ? 60 : 20), 
            transition: 'top 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <svg width="160" height="40">
              <rect x="10" y="15" width="140" height="6" fill="#94a3b8" />
              <rect x="20" y="5" width="20" height="26" fill="#334155" rx="4" />
              <rect x="120" y="5" width="20" height="26" fill="#334155" rx="4" />
            </svg>
          </div>
        </div>
      );
    } else {
      // Sprint
      return (
        <div style={{ position: 'relative', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          {/* Track background */}
          <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '40px', background: '#fca5a5', borderTop: '4px solid white', borderBottom: '4px solid white' }}></div>
          <div style={{ 
            position: 'absolute', 
            left: animState === 'success' ? '120%' : '50%',
            transform: 'translate(-50%, 0)',
            transition: animState === 'success' ? 'left 1s linear' : 'none'
          }}>
             <MascotRabbit style={{ width: '100px' }} />
          </div>
        </div>
      );
    }
  };

  const stageTitles = {
    gym_warmup: 'Stage 1: Warm-up! Listen carefully...',
    gym_lift: 'Stage 2: Heavy Lifting! Don\'t get tricked!',
    gym_sprint: 'Stage 3: The Sprint! Go go go!'
  };

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(to bottom, #dbeafe, #eff6ff)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', alignItems: 'center' }}>
        <button className="btn-secondary" onClick={() => {
            useGameStore.setState({ isChallengeActive: false, currentChallengeType: null });
            navigate('/map');
        }}>
          <X size={24} /> Quit
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 'bold', color: '#3b82f6' }}>
            🏋️‍♂️ Phonics Gym
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
        <h2 style={{ color: '#1e40af', fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          {stageTitles[currentQ.type]}
        </h2>

        {/* Visual Stage */}
        <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '24px', padding: '2rem 1rem', marginBottom: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          {renderStageVisuals()}
        </div>

        {/* Big Replay Audio Button */}
        <button 
          onClick={playQuestionAudio} 
          style={{ 
            background: '#38bdf8', border: 'none', borderRadius: '50%', width: '80px', height: '80px', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', 
            boxShadow: '0 8px 0 #0284c7', marginBottom: '2rem', transform: animState === 'fail' ? 'scale(1.1)' : 'none', transition: 'transform 0.2s'
          }}
        >
          <Volume2 size={40} color="white" />
        </button>

        {/* Dictation Input */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (processingRef.current || isRevealed || !typedAnswer.trim()) return;
              
              const choice = typedAnswer.trim().toUpperCase();
              const actualAnswer = currentQ.correctAnswer.toUpperCase();
              
              if (choice === actualAnswer) {
                handleChoice(currentQ.correctAnswer);
              } else {
                handleChoice(choice);
                setTimeout(() => setTypedAnswer(''), 1000); // clear on wrong
              }
            }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input 
              type="text" 
              value={typedAnswer}
              inputMode="none" // Prevent native keyboard
              onChange={(e) => {
                const val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                if (val.length <= 2) setTypedAnswer(val);
              }}
              disabled={processingRef.current || isRevealed}
              maxLength={2}
              className={`font-phonics ${animState === 'fail' ? 'wobble-wrong' : ''}`}
              placeholder="Type here..."
              style={{
                width: '100%',
                fontSize: '4.5rem',
                textAlign: 'center',
                padding: '1rem',
                borderRadius: '32px',
                border: `4px solid ${animState === 'success' ? '#4ade80' : (animState === 'fail' ? '#f43f5e' : '#7dd3fc')}`,
                outline: 'none',
                color: '#1e3a8a',
                background: 'white',
                boxShadow: '0 12px 0 #38bdf8, 0 16px 20px rgba(0,0,0,0.1)',
                textTransform: 'uppercase'
              }}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={processingRef.current || isRevealed || !typedAnswer.trim()}
              style={{ fontSize: '2rem', padding: '1rem 3rem', width: '100%' }}
            >
              Submit / 確定
            </button>
          </form>
          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'center' }}>
            <VirtualKeyboard 
              disabled={processingRef.current || isRevealed}
              onKeyPress={(key) => {
                if (key === 'BACKSPACE') {
                  setTypedAnswer(prev => prev.slice(0, -1));
                } else {
                  setTypedAnswer(prev => {
                    const next = prev + key;
                    return next.length <= 2 ? next : prev;
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
