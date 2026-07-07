import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import { X, Volume2, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import MascotRabbit from '../components/MascotRabbit';

export default function BubbleChallenge() {
  const navigate = useNavigate();
  const { activeQuestions, currentQuestionIndex, nextQuestion, completeBubbleChallenge, isChallengeActive, currentChallengeType } = useGameStore();
  
  const [mistakes, setMistakes] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [poppedBubbles, setPoppedBubbles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [mascotState, setMascotState] = useState('idle'); // idle, correct, wrong
  const [wrongBubble, setWrongBubble] = useState(null); // track which bubble just got tapped wrong

  const currentQ = activeQuestions[currentQuestionIndex];
  
  useEffect(() => {
    if (!isChallengeActive || currentChallengeType !== 'bubble' || activeQuestions.length === 0) {
      navigate('/map');
      return;
    }
    playTargetAudio();
  }, [currentQuestionIndex]);

  const playTargetAudio = () => {
    if (!currentQ) return;
    setIsProcessing(true);
    audioEngine.play(currentQ.targetSound.audio_url).catch(() => {}).finally(() => setIsProcessing(false));
  };

  if (!currentQ) return null;

  const handlePop = (choiceLabel, index) => {
    if (isProcessing || animatingOut || poppedBubbles.includes(index)) return;
    
    if (choiceLabel === currentQ.correctAnswer) {
      // Correct!
      setAnimatingOut(true);
      setPoppedBubbles([...poppedBubbles, index]);
      audioEngine.playUI('pop');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      setMascotState('correct');

      setTimeout(() => {
        if (currentQuestionIndex >= activeQuestions.length - 1) {
          // Finished all 10
          audioEngine.playUI('correct');
          setShowCompletion(true);
          completeBubbleChallenge(mistakes === 0);
          setTimeout(() => {
            navigate('/');
          }, 4000);
        } else {
          setAnimatingOut(false);
          setPoppedBubbles([]);
          setMascotState('idle');
          nextQuestion();
        }
      }, 1500);

    } else {
      // Wrong!
      audioEngine.playUI('error');
      setMistakes(m => m + 1);
      setWrongBubble(index);
      setMascotState('wrong');
      setTimeout(() => {
        setWrongBubble(null);
        setMascotState('idle');
      }, 500);
      playTargetAudio(); // Replay the hint
    }
  };

  // Generate 10 fixed cells to prevent major overlap, but we will give them strong organic floating animations
  const bubblePositions = [
    { top: '15%', left: '15%' }, { top: '10%', left: '40%' }, { top: '18%', left: '70%' }, { top: '25%', left: '90%' },
    { top: '45%', left: '10%' }, { top: '40%', left: '85%' },
    { top: '75%', left: '15%' }, { top: '80%', left: '40%' }, { top: '70%', left: '65%' }, { top: '80%', left: '85%' }
  ];

  return (
    <div className="screen-container" style={{ 
      background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', 
      overflow: 'hidden', 
      position: 'relative',
      padding: 'max(env(safe-area-inset-top), 1rem) max(env(safe-area-inset-right), 1rem) max(env(safe-area-inset-bottom), 1rem) max(env(safe-area-inset-left), 1rem)',
      height: '100dvh',
      width: '100vw',
      touchAction: 'none',
      overscrollBehavior: 'none',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      <style>{`
        @keyframes floatBubble {
          0% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-40px) translateX(20px); }
          66% { transform: translateY(20px) translateX(-30px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        .bubble-btn {
          animation: floatBubble 6s ease-in-out infinite alternate;
        }
        @keyframes popOut {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
        .bubble-pop {
          animation: popOut 0.3s forwards;
        }
        @keyframes wobbleError {
          0%, 100% { transform: translateX(0) scale(1); }
          25% { transform: translateX(-10px) scale(0.9); }
          50% { transform: translateX(10px) scale(1.1); }
          75% { transform: translateX(-10px) scale(0.9); }
        }
        .bubble-error {
          animation: wobbleError 0.5s ease-in-out;
        }
      `}</style>

      {/* Header Area - Cleaned up */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        {/* Discrete Quit Button */}
        <button onClick={() => {
            useGameStore.setState({ isChallengeActive: false, currentChallengeType: null });
            navigate('/map');
        }} style={{
          width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', border: 'none', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer'
        }}>
          <X size={24} />
        </button>
        
        {/* Progress & Mistakes */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1.5rem', borderRadius: '100px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '1.5rem' }}>
            Round {currentQuestionIndex + 1}
          </span>
          <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
            {mistakes === 0 ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontWeight: 'bold' }}>
                 <Heart size={24} fill="#e11d48" /> Perfect!
               </div>
            ) : (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontWeight: 'bold', fontSize: '1.2rem' }}>
                 ❌ {mistakes}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Play Area */}
      <div style={{ flexGrow: 1, position: 'relative', width: '100%' }}>
        
        {/* Mascot Feedback */}
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', zIndex: 5, pointerEvents: 'none', transition: 'transform 0.3s', transform: mascotState === 'correct' ? 'translateY(-20px) scale(1.1)' : 'none' }}>
          <MascotRabbit feedbackState={mascotState} style={{ width: '150px' }} />
        </div>

        {/* Central Audio Button */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button 
            onClick={playTargetAudio} 
            style={{ 
              background: '#fef08a', border: 'none', borderRadius: '50%', width: '140px', height: '140px', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', 
              boxShadow: '0 8px 0 #ca8a04, 0 0 40px rgba(254, 240, 138, 0.5)', 
              animation: isProcessing ? 'pulse-glow 1s infinite' : 'pulse-glow 3s infinite',
              transform: isProcessing ? 'scale(0.95)' : 'none',
              transition: 'transform 0.2s'
            }}
          >
            <Volume2 size={72} color="#a16207" />
          </button>
          <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1.5rem', borderRadius: '100px', fontWeight: 'bold', color: '#0369a1', fontSize: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            Pop this sound!
          </div>
        </div>

        {/* Bubbles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {currentQ.choices.map((choice, i) => {
            const isPopped = poppedBubbles.includes(i);
            const isWrong = wrongBubble === i;
            const pos = bubblePositions[i];
            
            // Randomize duration and delay to make them float organically and asynchronously
            const duration = 5 + (i % 3); 
            const delay = i * -0.5;

            let className = 'bubble-btn';
            if (isPopped) className = 'bubble-pop';
            else if (isWrong) className = 'bubble-error';

            return (
              <div key={`${currentQuestionIndex}-${i}`} style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                transform: 'translate(-50%, -50%)',
                pointerEvents: isPopped ? 'none' : 'auto'
              }}>
                <button
                  onClick={() => handlePop(choice, i)}
                  className={className}
                  style={{
                    width: '96px', height: '96px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(224,242,254,0.95) 100%)',
                    border: '4px solid rgba(255, 255, 255, 1)',
                    boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px 15px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.5rem', fontWeight: 'bold', color: '#0369a1',
                    cursor: 'pointer',
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    backdropFilter: 'blur(4px)',
                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif'
                  }}
                >
                  {choice}
                  {/* Bubble highlight for 3D effect */}
                  <div style={{ position: 'absolute', top: '15%', left: '20%', width: '25%', height: '25%', background: 'white', borderRadius: '50%', opacity: 0.8 }} />
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* Completion Overlay */}
      {showCompletion && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s' }}>
          <MascotRabbit feedbackState="correct" style={{ width: '200px', marginBottom: '2rem', animation: 'bounce 1s infinite' }} />
          <h1 style={{ color: '#0369a1', fontSize: '4rem', marginBottom: '1rem', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>Mission Complete!</h1>
          <div style={{ fontSize: '3rem', display: 'flex', gap: '2rem', fontWeight: 'bold', animation: 'popIn 0.5s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
            <span style={{ color: '#eab308' }}>+10 ⭐</span>
            {mistakes === 0 && <span style={{ color: '#d946ef' }}>+1 🎟️</span>}
          </div>
          {mistakes === 0 && <p style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '2rem', marginTop: '2rem', padding: '1rem 2rem', background: '#ffe4e6', borderRadius: '100px', animation: 'popIn 0.5s 0.4s both' }}>Perfect Score Bonus!</p>}
        </div>
      )}

    </div>
  );
}
