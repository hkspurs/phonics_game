import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import { X, Volume2, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BubbleChallenge() {
  const navigate = useNavigate();
  const { activeQuestions, currentQuestionIndex, nextQuestion, completeBubbleChallenge, isChallengeActive, currentChallengeType } = useGameStore();
  
  const [mistakes, setMistakes] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [poppedBubbles, setPoppedBubbles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

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
          nextQuestion();
        }
      }, 1500);

    } else {
      // Wrong!
      audioEngine.playUI('error');
      setMistakes(m => m + 1);
      setPoppedBubbles([...poppedBubbles, index]); // Pop the wrong bubble so it disappears
      playTargetAudio(); // Replay the hint
    }
  };

  // Generate 10 fixed cells to prevent major overlap, but give them organic floating
  // We'll use a 2x5 or 5x2 grid depending on orientation. For simplicity, just absolute positions using %
  const bubblePositions = [
    { top: '15%', left: '10%' }, { top: '10%', left: '30%' }, { top: '20%', left: '50%' }, { top: '10%', left: '70%' }, { top: '15%', left: '90%' },
    { top: '65%', left: '15%' }, { top: '60%', left: '35%' }, { top: '70%', left: '55%' }, { top: '60%', left: '75%' }, { top: '65%', left: '85%' }
  ];

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(to bottom, #0284c7, #38bdf8)', overflow: 'hidden', position: 'relative' }}>
      
      {/* Background Bubbles Animation via CSS */}
      <style>{`
        @keyframes floatBubble {
          0% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        .bubble-btn {
          animation: floatBubble 6s ease-in-out infinite;
        }
        @keyframes popOut {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
        .bubble-pop {
          animation: popOut 0.3s forwards;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', alignItems: 'center', zIndex: 10 }}>
        <button className="btn-secondary" style={{ background: 'rgba(255,255,255,0.8)' }} onClick={() => {
            useGameStore.setState({ isChallengeActive: false, currentChallengeType: null });
            navigate('/map');
        }}>
          <X size={24} /> Quit
        </button>
        
        {/* Progress & Hearts */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1.5rem', borderRadius: '100px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '1.25rem' }}>
            {currentQuestionIndex + 1} / 10
          </span>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            {mistakes === 0 ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontWeight: 'bold' }}>
                 <Heart size={20} fill="#e11d48" /> Perfect Run!
               </div>
            ) : (
               <div style={{ color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                 Mistakes: {mistakes}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Central Audio Button */}
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          onClick={playTargetAudio} 
          style={{ 
            background: '#fef08a', border: 'none', borderRadius: '50%', width: '120px', height: '120px', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', 
            boxShadow: '0 8px 0 #ca8a04, 0 0 40px rgba(254, 240, 138, 0.5)', 
            animation: isProcessing ? 'pulse-glow 1s infinite' : 'pulse-glow 3s infinite',
            transform: isProcessing ? 'scale(0.95)' : 'none',
            transition: 'transform 0.2s'
          }}
        >
          <Volume2 size={64} color="#a16207" />
        </button>
        <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.8)', padding: '0.5rem 1.5rem', borderRadius: '100px', fontWeight: 'bold', color: '#0284c7', fontSize: '1.5rem' }}>
          Listen & Pop!
        </div>
      </div>

      {/* Bubbles Area */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {currentQ.choices.map((choice, i) => {
          const isPopped = poppedBubbles.includes(i);
          const pos = bubblePositions[i];
          const delay = i * -0.7; // Desync animations

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
                className={isPopped ? 'bubble-pop' : 'bubble-btn'}
                style={{
                  width: '90px', height: '90px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '4px solid rgba(255, 255, 255, 1)',
                  boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px 15px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 'bold', color: '#0369a1',
                  cursor: 'pointer',
                  animationDelay: `${delay}s`,
                  backdropFilter: 'blur(4px)'
                }}
              >
                {choice}
                {/* Bubble highlight for 3D effect */}
                <div style={{ position: 'absolute', top: '10%', left: '20%', width: '20%', height: '20%', background: 'white', borderRadius: '50%', opacity: 0.8 }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Completion Overlay */}
      {showCompletion && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s' }}>
          <h1 style={{ color: '#0369a1', fontSize: '4rem', marginBottom: '1rem', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>Challenge Complete!</h1>
          <div style={{ fontSize: '3rem', display: 'flex', gap: '2rem', animation: 'popIn 0.5s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
            <span>+10 ⭐</span>
            {mistakes === 0 && <span>+1 🎟️</span>}
          </div>
          {mistakes === 0 && <p style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '2rem', marginTop: '2rem', animation: 'popIn 0.5s 0.4s both' }}>Perfect Score Bonus!</p>}
        </div>
      )}

    </div>
  );
}
