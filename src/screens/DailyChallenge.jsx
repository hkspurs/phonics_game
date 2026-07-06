import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { audioEngine } from '../audio/AudioEngine'

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

  // Play audio when question loads
  useEffect(() => {
    if (currentQ) {
      audioEngine.play(currentQ.targetSound.audio_url)
    }
    // Cleanup on unmount
    return () => audioEngine.stop()
  }, [currentQ])

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
      
      // QA FIX: Use Web Audio Engine for feedback SFX
      const proceed = () => {
        setIsProcessing(false);
        if (currentQuestionIndex + 1 >= activeQuestions.length) {
          navigate('/reward')
        } else {
          setFeedbackState(null)
          setSelected(null)
          setIsFirstAttempt(true)
          setDisabledChoices([]) // QA FIX: Reset disabled choices
          nextQuestion()
        }
      }

      // Play mock correct sound, proceed immediately if missing
      audioEngine.play('assets/correct_chime.mp3').then(proceed);

    } else {
      // QA FIX: Remove traumatic 'wrong' state delay. Just fade out the button instantly.
      answerQuestion(false, isFirstAttempt)
      
      if (isFirstAttempt) {
        recordAnswer(currentQ.targetSound.label, false, choice);
      }
      
      setIsFirstAttempt(false)
      setDisabledChoices(prev => [...prev, choice])
      
      // Play target audio again as a hint
      audioEngine.play(currentQ.targetSound.audio_url)
      
      setIsProcessing(false)
    }
  }

  const handlePlayAudio = () => {
    if (isProcessing) return; // QA FIX: Prevent audio overlap spam
    audioEngine.play(currentQ.targetSound.audio_url)
  }

  const progressPercent = Math.max(5, (currentQuestionIndex / activeQuestions.length) * 100)

  return (
    <div className="screen-container" style={{ background: '#ecfdf5', alignItems: 'center' }}>
      
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => navigate('/')}>
          <X size={24} />
        </button>
        
        {/* Progress Bar */}
        <div style={{ flex: 1, margin: '0 2rem', height: '16px', background: '#d1fae5', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#34d399', borderRadius: '8px', transition: 'width 0.3s ease' }}></div>
        </div>
        
        <span style={{ fontWeight: 'bold', color: '#047857', fontSize: '1.25rem' }}>
          {currentQuestionIndex + 1}/{activeQuestions.length}
        </span>
      </div>

      <h2 style={{ color: '#065f46', fontSize: '2rem', marginBottom: '2rem' }}>
        {currentQ.type === 'boss' ? '⭐ Final Challenge! ⭐' : 'Listen and Choose'}
      </h2>

      {/* Question Area (QA FIX: Implement Comparison Template) */}
      {currentQ.type === 'compare' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <h2 style={{ color: '#1e3a8a', marginBottom: '2rem' }}>Are these sounds the same or different?</h2>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              className="btn-primary" 
              style={{ padding: '2rem', background: '#38bdf8', borderRadius: '50%' }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url)}
            >
              <Volume2 size={48} />
              <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>Sound 1</div>
            </button>
            <button 
              className="btn-primary" 
              style={{ padding: '2rem', background: '#818cf8', borderRadius: '50%' }}
              onClick={() => !isProcessing && audioEngine.play(currentQ.compareSound.audio_url)}
            >
              <Volume2 size={48} />
              <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>Sound 2</div>
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
          
          <button 
            className="btn-primary" 
            style={{ padding: '3rem', background: '#38bdf8', borderRadius: '50%', marginBottom: '3rem', animation: isFirstAttempt ? 'pulse-glow 2s infinite' : 'none' }}
            onClick={() => !isProcessing && audioEngine.play(currentQ.targetSound.audio_url)}
          >
            <Volume2 size={64} />
          </button>

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
                    fontSize: '4rem', fontWeight: 'bold', color: '#1e3a8a',
                    background: 'linear-gradient(135deg, #ffffff, #f0f9ff)', 
                    border: '4px solid #7dd3fc', borderRadius: '32px',
                    boxShadow: '0 12px 0 #38bdf8, 0 16px 20px rgba(0,0,0,0.1)', 
                    cursor: (feedbackState !== null || isDisabled) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isDisabled ? 0 : (feedbackState !== null && choice !== selected ? 0 : 1),
                    transform: isDisabled ? 'scale(0.8)' : (choice === selected && feedbackState === 'correct' ? 'scale(1.1) translateY(-10px)' : 'none'),
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
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', fontSize: '6rem', transition: 'all 0.3s' }}>
        {feedbackState === 'correct' ? '🎉' : '👀'}
      </div>

    </div>
  )
}
