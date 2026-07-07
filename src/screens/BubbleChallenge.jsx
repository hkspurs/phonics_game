import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import { X, Volume2, Pause, Star } from 'lucide-react';
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
  const [mascotState, setMascotState] = useState('idle'); // idle, correct, wrong, pointing
  const [wrongBubble, setWrongBubble] = useState(null); 
  const [flyingStars, setFlyingStars] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  
  const playAreaRef = useRef(null);

  const currentQ = activeQuestions[currentQuestionIndex];
  
  useEffect(() => {
    if (!isChallengeActive || currentChallengeType !== 'bubble' || activeQuestions.length === 0) {
      navigate('/map');
      return;
    }
    playTargetAudio();
  }, [currentQuestionIndex]);

  useEffect(() => {
    // If child is idle for 5 seconds, mascot points
    const idleTimer = setTimeout(() => {
      if (!animatingOut && !showCompletion && !isPaused) {
        setMascotState('pointing'); // We will just use 'idle' or add a custom class for pointing
      }
    }, 5000);
    return () => clearTimeout(idleTimer);
  }, [animatingOut, currentQuestionIndex, isPaused, showCompletion]);

  const playTargetAudio = () => {
    if (!currentQ) return;
    setIsProcessing(true);
    setMascotState('idle');
    audioEngine.play(currentQ.targetSound.audio_url).catch(() => {}).finally(() => setIsProcessing(false));
  };

  if (!currentQ) return null;

  const handlePop = (e, choiceLabel, index) => {
    if (isProcessing || animatingOut || poppedBubbles.includes(index) || isPaused) return;
    
    if (choiceLabel === currentQ.correctAnswer) {
      // Correct!
      setAnimatingOut(true);
      setPoppedBubbles([...poppedBubbles, index]);
      audioEngine.playUI('pop');
      confetti({ particleCount: 50, spread: 60, origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight } });
      setMascotState('correct');
      
      // Spawn flying star
      const newStar = { id: Date.now(), x: e.clientX, y: e.clientY };
      setFlyingStars([...flyingStars, newStar]);

      setTimeout(() => {
        if (currentQuestionIndex >= activeQuestions.length - 1) {
          // Finished all
          audioEngine.playUI('correct');
          setShowCompletion(true);
          completeBubbleChallenge(mistakes === 0);
          setTimeout(() => {
            navigate('/');
          }, 4500);
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
      
      // Screen shake effect
      if (playAreaRef.current) {
        playAreaRef.current.classList.add('shake-screen');
        setTimeout(() => playAreaRef.current.classList.remove('shake-screen'), 300);
      }

      setTimeout(() => {
        setWrongBubble(null);
        setMascotState('idle');
      }, 600);
      playTargetAudio(); // Replay the hint
    }
  };

  // Organic floating positions that span the area, adapted to however many choices we have
  // We'll dynamically assign positions so they don't clump
  const getDynamicPositions = (numChoices) => {
    const positions = [];
    // We want to spread them across a grid
    const cols = numChoices > 5 ? 3 : (numChoices > 3 ? 2 : 2);
    const rows = Math.ceil(numChoices / cols);
    
    for (let i = 0; i < numChoices; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      // Base percentage + some organic jitter
      const baseX = 20 + (c * (60 / Math.max(1, cols - 1)));
      const baseY = 20 + (r * (60 / Math.max(1, rows - 1)));
      
      positions.push({
        top: `${baseY + (Math.random() * 10 - 5)}%`,
        left: `${baseX + (Math.random() * 15 - 7.5)}%`
      });
    }
    return positions;
  };
  
  // We compute positions once per question
  const [bubblePositions, setBubblePositions] = useState([]);
  useEffect(() => {
    if (currentQ) {
      setBubblePositions(getDynamicPositions(currentQ.choices.length));
    }
  }, [currentQuestionIndex, currentQ]);

  return (
    <div className="screen-container" style={{ 
      overflow: 'hidden', 
      position: 'relative',
      padding: 'max(env(safe-area-inset-top), 1rem) max(env(safe-area-inset-right), 1rem) max(env(safe-area-inset-bottom), 1rem) max(env(safe-area-inset-left), 1rem)',
      height: '100dvh',
      width: '100vw',
      touchAction: 'none',
      overscrollBehavior: 'none',
      display: 'flex',
      flexDirection: 'column',
      background: '#0ea5e9' // Ocean blue base
    }}>
      
      {/* Underwater Background SVG */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Sun rays */}
        <div style={{ position: 'absolute', top: -50, left: '20%', width: '60%', height: '150%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)', transform: 'rotate(15deg)', animation: 'pulse-glow 5s infinite alternate' }} />
        {/* Seabed */}
        <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0 }}>
          <path d="M0,800 C300,750 600,850 1000,750 L1000,1000 L0,1000 Z" fill="#0284c7" opacity="0.6" />
          <path d="M0,850 C400,900 800,800 1000,880 L1000,1000 L0,1000 Z" fill="#0369a1" />
        </svg>
      </div>

      <style>{`
        @keyframes floatBubble {
          0% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-30px) translateX(15px); }
          66% { transform: translateY(15px) translateX(-20px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        .bubble-btn {
          animation: floatBubble 6s ease-in-out infinite alternate;
          transition: transform 0.2s;
        }
        .bubble-btn:active {
          transform: scale(0.9) !important;
        }
        @keyframes popOut {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }
        .bubble-pop {
          animation: popOut 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes wobbleError {
          0%, 100% { transform: translateX(0) scale(1); }
          25% { transform: translateX(-15px) scale(0.9); }
          50% { transform: translateX(15px) scale(1.1); }
          75% { transform: translateX(-15px) scale(0.9); }
        }
        .bubble-error {
          animation: wobbleError 0.4s ease-in-out;
        }
        @keyframes shakeScreen {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .shake-screen {
          animation: shakeScreen 0.3s ease-in-out;
        }
        @keyframes starFly {
          0% { transform: translate(0,0) scale(2) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.5) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* Discrete Top UI (No ugly bars) */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10, padding: '1rem' }}>
        
        {/* Pause Button */}
        <button onClick={() => setIsPaused(true)} style={{
          width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)'
        }}>
          <Pause size={28} fill="white" />
        </button>
        
        {/* Star Jar (Progress) */}
        <div id="star-jar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem', borderRadius: '20px', boxShadow: '0 8px 15px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '1.5rem', fontFamily: '"Comic Sans MS", cursive' }}>
            {currentQuestionIndex + 1} / 10
          </div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill={i <= currentQuestionIndex / 2 ? '#eab308' : '#e2e8f0'} color={i <= currentQuestionIndex / 2 ? '#ca8a04' : '#cbd5e1'} />
            ))}
          </div>
        </div>

      </div>

      {/* Play Area */}
      <div ref={playAreaRef} style={{ flexGrow: 1, position: 'relative', width: '100%', zIndex: 5 }}>
        
        {/* Mascot - Positioned bottom left, heavily integrated */}
        <div style={{ 
          position: 'absolute', bottom: '5%', left: '5%', zIndex: 15, pointerEvents: 'none', 
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          transform: mascotState === 'correct' ? 'translateY(-40px) scale(1.2)' : (mascotState === 'pointing' ? 'rotate(5deg) scale(1.1)' : 'scale(1)') 
        }}>
          <MascotRabbit feedbackState={mascotState === 'pointing' ? 'idle' : mascotState} style={{ width: '180px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.3))' }} />
          {/* Mascot Speech Bubble for Context */}
          <div style={{
            position: 'absolute', top: '-60px', left: '120px', background: 'white', padding: '10px 20px', borderRadius: '30px', 
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontSize: '1.2rem', fontWeight: 'bold', color: '#0369a1',
            opacity: mascotState === 'pointing' ? 1 : 0, transform: mascotState === 'pointing' ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.3s', pointerEvents: 'none', whiteSpace: 'nowrap'
          }}>
            {mascotState === 'pointing' ? `Where is "${currentQ.correctAnswer}"?` : ''}
            <div style={{ position: 'absolute', bottom: '-10px', left: '20px', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid white' }} />
          </div>
        </div>

        {/* Central Audio Button (Floating) */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button 
            onClick={playTargetAudio} 
            style={{ 
              background: 'linear-gradient(135deg, #fef08a, #fde047)', border: '4px solid white', borderRadius: '50%', width: '120px', height: '120px', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', 
              boxShadow: '0 10px 20px rgba(0,0,0,0.3), inset 0 -5px 10px rgba(202,138,4,0.5)', 
              animation: isProcessing ? 'pulse-glow 0.8s infinite' : 'pulse-glow 3s infinite',
              transform: isProcessing ? 'scale(0.9)' : 'scale(1)',
              transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            <Volume2 size={60} color="#a16207" fill="#a16207" />
          </button>
        </div>

        {/* Bubbles */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 6 }}>
          {currentQ.choices.map((choice, i) => {
            const isPopped = poppedBubbles.includes(i);
            const isWrong = wrongBubble === i;
            const pos = bubblePositions[i] || { top: '50%', left: '50%' };
            
            const duration = 4 + (i % 4); 
            const delay = i * -0.7;

            let className = 'bubble-btn';
            if (isPopped) className = 'bubble-pop';
            else if (isWrong) className = 'bubble-error';

            return (
              <button
                key={`${currentQuestionIndex}-${i}`}
                onClick={(e) => handlePop(e, choice, i)}
                className={className}
                style={{
                  position: 'absolute',
                  top: pos.top, left: pos.left,
                  width: '100px', height: '100px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(224,242,254,0.8) 70%, rgba(186,230,253,0.9) 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: 'inset -10px -10px 20px rgba(2,132,199,0.2), 0 15px 25px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', fontWeight: 'bold', color: '#0369a1',
                  cursor: 'pointer',
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  backdropFilter: 'blur(2px)',
                  fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                  pointerEvents: isPopped ? 'none' : 'auto',
                  transformOrigin: 'center'
                }}
              >
                {choice}
                {/* Specular highlight */}
                <div style={{ position: 'absolute', top: '15%', left: '20%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', opacity: 0.9, pointerEvents: 'none' }} />
              </button>
            );
          })}
        </div>
        
        {/* Flying Stars Animation Layer */}
        {flyingStars.map(star => {
           const jarEl = document.getElementById('star-jar');
           let tx = 0, ty = 0;
           if (jarEl) {
             const rect = jarEl.getBoundingClientRect();
             tx = rect.left + rect.width/2 - star.x;
             ty = rect.top + rect.height/2 - star.y;
           }
           return (
             <div key={star.id} style={{
               position: 'absolute', left: star.x - 24, top: star.y - 24, zIndex: 100, pointerEvents: 'none',
               animation: 'starFly 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards',
               '--tx': `${tx}px`, '--ty': `${ty}px`
             }}>
               <Star size={48} fill="#eab308" color="#ca8a04" filter="drop-shadow(0 0 10px rgba(234,179,8,0.8))" />
             </div>
           );
        })}

      </div>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(2,132,199,0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s' }}>
          <h2 style={{ color: 'white', fontSize: '3rem', marginBottom: '2rem', fontFamily: '"Comic Sans MS", cursive' }}>Paused</h2>
          <button onClick={() => setIsPaused(false)} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '2rem', marginBottom: '1rem' }}>Resume</button>
          <button onClick={() => {
            useGameStore.setState({ isChallengeActive: false, currentChallengeType: null });
            navigate('/map');
          }} className="btn-secondary" style={{ padding: '1rem 3rem', fontSize: '1.5rem', background: '#ef4444', color: 'white', borderColor: '#b91c1c' }}>Quit Game</button>
        </div>
      )}

      {/* Completion Overlay */}
      {showCompletion && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(2,132,199,0.9)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(253,224,71,0.5) 0%, rgba(255,255,255,0) 70%)', transform: 'translate(-50%, -50%)', animation: 'spin 10s linear infinite', zIndex: -1 }} />
          <MascotRabbit feedbackState="correct" style={{ width: '250px', marginBottom: '2rem', animation: 'bounce 1s infinite' }} />
          <h1 style={{ color: 'white', fontSize: '5rem', textShadow: '0 5px 15px rgba(0,0,0,0.3)', marginBottom: '1rem', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>Incredible!</h1>
          
          <div style={{ fontSize: '3.5rem', display: 'flex', gap: '2rem', fontWeight: 'bold', animation: 'popIn 0.5s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both', background: 'rgba(255,255,255,0.9)', padding: '1rem 3rem', borderRadius: '100px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <span style={{ color: '#eab308' }}>+10 ⭐</span>
            {mistakes === 0 && <span style={{ color: '#d946ef' }}>+1 🎟️</span>}
          </div>
          
          {mistakes === 0 ? (
            <p style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '2.5rem', marginTop: '2rem', textShadow: '0 2px 5px rgba(0,0,0,0.2)', animation: 'popIn 0.5s 0.4s both' }}>Perfect Run!</p>
          ) : (
            <p style={{ color: '#bae6fd', fontWeight: 'bold', fontSize: '2rem', marginTop: '2rem', animation: 'popIn 0.5s 0.4s both' }}>Mistakes: {mistakes}</p>
          )}
        </div>
      )}

    </div>
  );
}
