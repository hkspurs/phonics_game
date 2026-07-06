import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { audioEngine } from '../audio/AudioEngine'
import ReplayHelper from '../components/ReplayHelper'
import CorrectFeedback from '../components/CorrectFeedback'
import WrongFeedback from '../components/WrongFeedback'
import AppleIcon from '../components/AppleIcon'
import MascotRabbit from '../components/MascotRabbit'

export default function DailyChallenge() {
  const navigate = useNavigate()
  
  const { 
    activeQuestions, 
    currentQuestionIndex, 
    answerQuestion, 
    nextQuestion, 
    isChallengeActive,
    recordAnswer 
  } = useGameStore()

  const [selected, setSelected] = useState(null)
  const [feedbackState, setFeedbackState] = useState(null) // 'correct', 'wrong', null
  const [attemptCount, setAttemptCount] = useState(1) // QA FIX (Challenge 27): Track attempts for reward inflation
  const [disabledChoices, setDisabledChoices] = useState([]) // QA FIX: Track disabled choices
  const [isProcessing, setIsProcessing] = useState(false) // QA FIX: Spam-click Cooldown

  // Redirect if no active challenge or out of bounds (QA FIX)
  useEffect(() => {
    if (!isChallengeActive || activeQuestions.length === 0 || currentQuestionIndex >= activeQuestions.length) {
      navigate('/')
    }
  }, [isChallengeActive, activeQuestions, currentQuestionIndex, navigate])

  // Preload all audio for the challenge
  useEffect(() => {
    if (activeQuestions.length > 0) {
      const urls = [];
      activeQuestions.forEach(q => {
        if (q.targetSound?.audio_url) urls.push(q.targetSound.audio_url);
        if (q.compareSound?.audio_url) urls.push(q.compareSound.audio_url);
      });
      audioEngine.preload(urls);
    }
  }, [activeQuestions])

  const currentQ = activeQuestions[currentQuestionIndex]
  const [hasStartedInteraction, setHasStartedInteraction] = useState(false)

  // Play audio when question loads, if interaction started
  useEffect(() => {
    if (currentQ && hasStartedInteraction) {
      setIsProcessing(true);
      
      // Voice-over instruction
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // R3-C3: Prevent speech overlapping
        const text = currentQ.type === 'compare' ? "Are these sounds the same, or different?" : "Listen and choose the right sound.";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }

      setTimeout(() => {
        // Playback Speed (Challenge 26): 0.9x speed for better accessibility
        audioEngine.play(currentQ.targetSound.audio_url, 0, 0, 0.9).catch(() => {}).finally(() => setIsProcessing(false))
      }, 1000); // Wait 1s for voice-over
    }
    // Cleanup on unmount
    return () => {
      audioEngine.stop()
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  }, [currentQ, hasStartedInteraction])

  if (!currentQ) {
    return (
      <div className="screen-container" style={{ background: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#065f46' }}>Loading Challenge...</h2>
      </div>
    );
  }

  const handleAnswer = (choice) => {
    if (isProcessing) return;
    setIsProcessing(true);

    setSelected(choice)
    const isCorrect = (choice === currentQ.correctAnswer)

    if (isCorrect) {
      setFeedbackState('correct')
      answerQuestion(true, attemptCount)
      
      // QA FIX: Record learning stats
      if (attemptCount === 1) {
        recordAnswer(currentQ.targetSound.label, true, null);
      }
      
      // QA FIX: Enforce minimum display time for Correct Feedback
      const startTime = Date.now();
      const proceed = () => {
        const elapsed = Date.now() - startTime;
        const delayNeeded = Math.max(0, 1500 - elapsed); // Ensure at least 1.5s delay
        
        setTimeout(() => {
          setIsProcessing(false);
          if (currentQuestionIndex + 1 >= activeQuestions.length) {
            navigate('/reward')
          } else {
            setFeedbackState(null)
            setSelected(null)
            setAttemptCount(1)
            setDisabledChoices([])
            nextQuestion()
          }
        }, delayNeeded);
      }

      // Pedagogy FIX: Vocal Praise
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Prevent overlap
        const praises = ["Great job!", "Awesome!", "You did it!"];
        const utterance = new SpeechSynthesisUtterance(praises[Math.floor(Math.random() * praises.length)]);
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }

      // Play mock correct sound, proceed after sound finishes (or fallback delay)
      audioEngine.play('assets/correct_chime.mp3').catch(() => {}).finally(proceed);

    } else {
      // QA FIX: Remove traumatic 'wrong' state delay. Just fade out the button instantly.
      answerQuestion(false, attemptCount)
      
      if (attemptCount === 1) {
        recordAnswer(currentQ.targetSound.label, false, choice);
      }
      
      setAttemptCount(prev => prev + 1)
      setDisabledChoices(prev => [...prev, choice])
      
      setFeedbackState('wrong')
      setTimeout(() => {
        setFeedbackState(prev => prev === 'wrong' ? null : prev)
      }, 1000)
      
      // Play target audio again as a hint, and DO NOT unlock until it finishes!
      audioEngine.play(currentQ.targetSound.audio_url, 0, 0, 0.9).catch(() => {}).finally(() => {
        setIsProcessing(false)
      })
    }
  }

  const handlePlayAudio = () => {
    if (isProcessing) return; // QA FIX: Prevent audio overlap spam
    audioEngine.play(currentQ.targetSound.audio_url, 0, 0, 0.9)
  }

  const progressPercent = Math.max(5, (currentQuestionIndex / activeQuestions.length) * 100)

  return (
    <div className="screen-container" style={{ background: '#ecfdf5', alignItems: 'center' }}>
      
      {/* Safari Autoplay Blocker Overlay */}
      {!hasStartedInteraction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeInWipe 0.5s' }}>
          <div style={{ transform: 'scale(1.5)', marginBottom: '2rem' }}>
            <MascotRabbit feedbackState="happy" />
          </div>
          <h2 style={{ fontSize: '3rem', color: '#047857', marginBottom: '2rem' }}>Ready?</h2>
          <button className="btn-primary" style={{ fontSize: '3rem', padding: '2rem 4rem', animation: 'pulse-glow 2s infinite' }} onClick={() => setHasStartedInteraction(true)}>
            <Volume2 size={48} /> Let's Go!
          </button>
        </div>
      )}
      
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => {
          if (window.confirm("Are you sure you want to quit? You will lose today's progress!")) {
             navigate('/');
          }
        }}>
          <X size={24} />
        </button>
        
        {/* Progress Bar (QA FIX: A11y Contrast) */}
        <div style={{ flex: 1, margin: '0 2rem', height: '16px', background: '#cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#059669', borderRadius: '8px', transition: 'width 0.3s ease' }}></div>
        </div>
        
        <span style={{ fontWeight: 'bold', color: '#047857', fontSize: '1.25rem' }}>
          {currentQuestionIndex + 1}/{activeQuestions.length}
        </span>
      </div>

      <h2 style={{ 
        color: currentQ.type === 'boss' ? '#e11d48' : '#065f46', 
        fontSize: currentQ.type === 'boss' ? '2.5rem' : '2rem', 
        marginBottom: '1rem',
        textTransform: currentQ.type === 'boss' ? 'uppercase' : 'none',
        animation: currentQ.type === 'boss' ? 'pulse-glow 2s infinite' : 'none'
      }}>
        {currentQ.type === 'boss' ? '⭐ Final Boss Challenge! ⭐' : 'Listen and Choose'}
      </h2>

      {/* QA FIX (Challenge 1 & 2): Boss Visuals */}
      {currentQ.type === 'boss' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <svg width="120" height="120" viewBox="0 0 100 100" style={{ animation: 'float 2s ease-in-out infinite alternate, shake 5s infinite' }}>
            <circle cx="50" cy="50" r="45" fill="#f43f5e" />
            <circle cx="35" cy="40" r="10" fill="white" />
            <circle cx="65" cy="40" r="10" fill="white" />
            <circle cx="35" cy="40" r="4" fill="black" />
            <circle cx="65" cy="40" r="4" fill="black" />
            <path d="M 30 25 L 45 35 M 70 25 L 55 35" stroke="#9f1239" strokeWidth="4" strokeLinecap="round" />
            <path d="M 35 70 Q 50 60 65 70" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" />
            <path d="M 45 70 L 45 75 M 55 70 L 55 75" stroke="white" strokeWidth="4" />
          </svg>
          <div style={{ width: '200px', height: '12px', background: '#fecdd3', borderRadius: '6px', marginTop: '1rem', overflow: 'hidden' }}>
            <div style={{ width: attemptCount === 1 ? '100%' : (attemptCount === 2 ? '30%' : '0%'), height: '100%', background: '#e11d48', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Question Area (QA FIX: Implement Comparison Template) */}
      {currentQ.type === 'compare' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: '#1e3a8a', marginBottom: '2rem' }}>Are these sounds the same or different?</h2>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              className="btn-primary" 
              style={{ padding: '2rem', background: '#38bdf8', borderRadius: '50%' }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url, 0, 0, 0.9).catch(()=>{})}
            >
              <Volume2 size={48} />
              <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>Sound 1</div>
              {feedbackState && <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{currentQ.targetSound.label}</div>}
            </button>
            <button 
              className="btn-primary" 
              style={{ padding: '2rem', background: '#818cf8', borderRadius: '50%' }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.compareSound.audio_url, 0, 0, 0.9).catch(()=>{})}
            >
              <Volume2 size={48} />
              <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>Sound 2</div>
              {feedbackState && <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{currentQ.compareSound.label}</div>}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentQ.choices.map((choice, i) => {
              const isDisabled = disabledChoices.includes(choice);
              // QA FIX: Literacy Rule - Use visuals for Same/Different
              const isSame = choice === 'Same';
              const labelText = isSame ? 'Same' : 'Different';

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  disabled={isProcessing || feedbackState !== null || isDisabled}
                  className={`btn-secondary ${feedbackState === 'correct' && choice === selected ? 'correct-sparkle' : ''} ${feedbackState === 'wrong' && choice === selected ? 'wobble-wrong' : ''}`}
                  style={{
                    width: '240px', minHeight: '140px', height: 'auto', padding: '1rem', // QA FIX (Challenge 27)
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'white', color: '#1e3a8a',
                    borderColor: '#bae6fd', borderWidth: '4px', borderStyle: 'solid', borderRadius: '24px',
                    opacity: isDisabled ? 0 : (feedbackState !== null && choice !== selected ? 0 : 1),
                    transform: isDisabled ? 'scale(0.8)' : 'none',
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    transition: 'opacity 0.3s, transform 0.3s',
                    cursor: (feedbackState !== null || isDisabled) ? 'default' : 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    {isSame ? (
                      <div style={{ display: 'flex' }}>
                         <div style={{ width: 40, height: 40, background: '#4ade80', borderRadius: '8px' }} />
                         <div style={{ width: 40, height: 40, background: '#4ade80', borderRadius: '8px', marginLeft: '-10px', mixBlendMode: 'multiply' }} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                         <div style={{ width: 40, height: 40, background: '#38bdf8', borderRadius: '50%' }} />
                         <div style={{ width: 40, height: 40, background: '#f472b6', transform: 'rotate(45deg)' }} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 'bold' }}>{labelText}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
            <button 
              className="btn-primary" 
              style={{ 
                padding: '3rem', 
                background: isProcessing ? '#0ea5e9' : '#38bdf8', 
                borderRadius: '50%', 
                animation: isProcessing ? 'pulse-glow 1s infinite' : (attemptCount === 1 ? 'pulse-glow 2s infinite' : 'none'), 
                zIndex: 2,
                transition: 'background 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url, 0, 0, 0.9).catch(()=>{})}
            >
              {isProcessing ? (
                <div style={{ width: '64px', height: '64px', border: '6px solid #e0f2fe', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <Volume2 size={64} color={'white'} />
              )}
            </button>
            <div style={{ position: 'absolute', right: '-140px', bottom: '0', width: '140px', height: '140px', padding: '10px' }}>
              <ReplayHelper 
                isPlaying={isProcessing} 
                onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url, 0, 0, 0.9).catch(()=>{})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentQ.choices.map((choice, i) => {
              const isDisabled = disabledChoices.includes(choice);
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  disabled={isProcessing || feedbackState !== null || isDisabled}
                  className={`${feedbackState === 'correct' && choice === selected ? 'correct-sparkle' : ''} ${feedbackState === 'wrong' && choice === selected ? 'wobble-wrong' : ''}`}
                  style={{
                    width: '160px', minHeight: '200px', height: 'auto', padding: '1rem', // QA FIX (Challenge 27)
                    fontSize: '4rem', fontWeight: 'bold', color: isDisabled ? '#94a3b8' : '#1e3a8a',
                    background: isDisabled ? '#f1f5f9' : 'linear-gradient(135deg, #ffffff, #f0f9ff)', 
                    border: `4px solid ${isDisabled ? '#cbd5e1' : '#7dd3fc'}`, 
                    borderRadius: '32px',
                    boxShadow: isDisabled ? 'none' : '0 12px 0 #38bdf8, 0 16px 20px rgba(0,0,0,0.1)', 
                    cursor: (feedbackState !== null || isDisabled) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isDisabled ? 0.6 : (feedbackState !== null && choice !== selected ? 0.3 : 1),
                    transform: isDisabled ? 'scale(0.95)' : (choice === selected && feedbackState === 'correct' ? 'scale(1.1) translateY(-10px)' : 'none'),
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    transition: 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  {choice}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Mascot Feedback Area */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', width: '180px', height: '180px', pointerEvents: 'none', zIndex: 10 }}>
        {feedbackState === 'correct' && (
          <div style={{ position: 'absolute', top: '-40px', right: '-80px', background: 'white', padding: '0.5rem 1rem', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#047857', animation: 'popIn 0.3s ease-out' }}>
            Great job!
            <div style={{ position: 'absolute', bottom: '-10px', left: '20px', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid white' }}></div>
          </div>
        )}
        <MascotRabbit style={{ width: '100%', height: '100%' }} feedbackState={feedbackState} />
        {feedbackState === 'correct' && <CorrectFeedback trigger={true} style={{ position: 'absolute', inset: 0 }} />}
        {feedbackState === 'wrong' && <WrongFeedback trigger={true} style={{ position: 'absolute', inset: 0 }} />}
      </div>

    </div>
  )
}
