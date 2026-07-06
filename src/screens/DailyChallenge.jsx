import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { audioEngine } from '../audio/AudioEngine'
import ReplayHelper from '../components/ReplayHelper'
import CorrectFeedback from '../components/CorrectFeedback'
import WrongFeedback from '../components/WrongFeedback'

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
  const [isFirstAttempt, setIsFirstAttempt] = useState(true)
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
        audioEngine.play(currentQ.targetSound.audio_url).catch(() => {}).finally(() => setIsProcessing(false))
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
      answerQuestion(true, isFirstAttempt)
      
      // QA FIX: Record learning stats
      if (isFirstAttempt) {
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
            setIsFirstAttempt(true)
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
      answerQuestion(false, isFirstAttempt)
      
      if (isFirstAttempt) {
        recordAnswer(currentQ.targetSound.label, false, choice);
      }
      
      setIsFirstAttempt(false)
      setDisabledChoices(prev => [...prev, choice])
      
      setFeedbackState('wrong')
      setTimeout(() => {
        setFeedbackState(prev => prev === 'wrong' ? null : prev)
      }, 1000)
      
      // Play target audio again as a hint, and DO NOT unlock until it finishes!
      audioEngine.play(currentQ.targetSound.audio_url).catch(() => {}).finally(() => {
        setIsProcessing(false)
      })
    }
  }

  const handlePlayAudio = () => {
    if (isProcessing) return; // QA FIX: Prevent audio overlap spam
    audioEngine.play(currentQ.targetSound.audio_url)
  }

  const progressPercent = Math.max(5, (currentQuestionIndex / activeQuestions.length) * 100)

  return (
    <div className="screen-container" style={{ background: '#ecfdf5', alignItems: 'center' }}>
      
      {/* Safari Autoplay Blocker Overlay */}
      {!hasStartedInteraction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: '#047857', marginBottom: '2rem' }}>Ready?</h2>
          <button className="btn-primary" style={{ fontSize: '3rem', padding: '2rem 4rem' }} onClick={() => setHasStartedInteraction(true)}>
            <Volume2 size={48} /> Let's Go!
          </button>
        </div>
      )}
      
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => navigate('/')}>
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
        marginBottom: '2rem',
        textTransform: currentQ.type === 'boss' ? 'uppercase' : 'none',
        animation: currentQ.type === 'boss' ? 'pulse-glow 2s infinite' : 'none'
      }}>
        {currentQ.type === 'boss' ? '⭐ Final Boss Challenge! ⭐' : 'Listen and Choose'}
      </h2>

      {/* Question Area (QA FIX: Implement Comparison Template) */}
      {currentQ.type === 'compare' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <h2 style={{ color: '#1e3a8a', marginBottom: '2rem' }}>Are these sounds the same or different?</h2>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              className="btn-primary" 
              style={{ padding: '2rem', background: '#38bdf8', borderRadius: '50%' }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url).catch(()=>{})}
            >
              <Volume2 size={48} />
              <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>Sound 1</div>
              {feedbackState && <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{currentQ.targetSound.label}</div>}
            </button>
            <button 
              className="btn-primary" 
              style={{ padding: '2rem', background: '#818cf8', borderRadius: '50%' }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.compareSound.audio_url).catch(()=>{})}
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
              const labelIcon = isSame ? '🍏🍏' : '🍏🍎';
              const labelText = isSame ? 'Same' : 'Different'; // Keep text small as secondary

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  disabled={isProcessing || feedbackState !== null || isDisabled}
                  className={`btn-secondary ${feedbackState === 'correct' && choice === selected ? 'correct-sparkle' : ''}`}
                  style={{
                    width: '240px', height: '140px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'white', color: '#1e3a8a',
                    borderColor: '#bae6fd', borderWidth: '4px', borderStyle: 'solid', borderRadius: '24px',
                    opacity: isDisabled ? 0 : (feedbackState !== null && choice !== selected ? 0 : 1),
                    transform: isDisabled ? 'scale(0.8)' : 'none',
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    transition: 'all 0.3s',
                    cursor: (feedbackState !== null || isDisabled) ? 'default' : 'pointer'
                  }}
                >
                  <span style={{ fontSize: '4rem' }}>{labelIcon}</span>
                  <span style={{ fontSize: '1.2rem', color: '#94a3b8', marginTop: '0.5rem' }}>{labelText}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
            <button 
              className="btn-primary" 
              style={{ 
                padding: '3rem', 
                background: isProcessing ? '#0ea5e9' : '#38bdf8', 
                borderRadius: '50%', 
                animation: isProcessing ? 'pulse-glow 1s infinite' : (isFirstAttempt ? 'pulse-glow 2s infinite' : 'none'), 
                zIndex: 2,
                transition: 'background 0.3s'
              }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url).catch(()=>{})}
            >
              <Volume2 size={64} color={isProcessing ? '#e0f2fe' : 'white'} />
            </button>
            <div style={{ position: 'absolute', right: '-120px', bottom: '0', width: '120px', height: '120px' }}>
              <ReplayHelper 
                isPlaying={isProcessing} 
                onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url).catch(()=>{})} 
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
                  className={feedbackState === 'correct' && choice === selected ? 'correct-sparkle' : ''}
                  style={{
                    width: '160px', height: '200px',
                    fontSize: '4rem', fontWeight: 'bold', color: isDisabled ? '#94a3b8' : '#1e3a8a',
                    background: isDisabled ? '#f1f5f9' : 'linear-gradient(135deg, #ffffff, #f0f9ff)', 
                    border: `4px solid ${isDisabled ? '#cbd5e1' : '#7dd3fc'}`, 
                    borderRadius: '32px',
                    boxShadow: isDisabled ? 'none' : '0 12px 0 #38bdf8, 0 16px 20px rgba(0,0,0,0.1)', 
                    cursor: (feedbackState !== null || isDisabled) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isDisabled ? 0.6 : (feedbackState !== null && choice !== selected ? 0.3 : 1),
                    transform: isDisabled ? 'scale(0.95)' : (choice === selected && feedbackState === 'correct' ? 'scale(1.1) translateY(-10px)' : (choice === selected && feedbackState === 'wrong' ? 'translateX(10px)' : 'none')),
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
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
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', width: '180px', height: '180px', pointerEvents: 'none' }}>
        {feedbackState === 'correct' && <CorrectFeedback trigger={true} style={{ position: 'absolute', inset: 0 }} />}
        {feedbackState === 'wrong' && <WrongFeedback trigger={true} style={{ position: 'absolute', inset: 0 }} />}
      </div>

    </div>
  )
}
