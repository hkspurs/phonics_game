import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Volume2 } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { audioEngine } from '../audio/AudioEngine'
import MascotRabbit from '../components/MascotRabbit'
import ParentGateModal from '../components/ParentGateModal'
import { useTranslation } from '../hooks/useTranslation'
import { SUBJECTS } from '../platform/subjects'

/**
 * SubjectGateway — The NEW homepage ("/").
 * Displays shared currency, the mascot, and large subject cards
 * for Phonics Forest and Math Kingdom.
 */
export default function SubjectGateway() {
  const navigate = useNavigate()
  const { t, language, toggleLanguage } = useTranslation()
  const [showParentGate, setShowParentGate] = useState(false)
  const [isEntering, setIsEntering] = useState(true)

  const { 
    stars, gems, tickets, streak, hasCompletedDaily, authenticateParent, math,
    encouragements, claimEncouragement, addTicket
  } = useGameStore()
  
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [currentEncouragement, setCurrentEncouragement] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isEntering) {
      const unclaimed = encouragements?.filter(e => !e.claimedAt) || [];
      if (unclaimed.length > 0) {
        setCurrentEncouragement(unclaimed[0]);
        setShowEncouragement(true);
      }
    }
  }, [isEntering, encouragements]);

  const handleClaimEncouragement = () => {
    if (currentEncouragement) {
      audioEngine.playUI('correct');
      // For MVP, just give 1 ticket as a simple reward
      addTicket();
      claimEncouragement(currentEncouragement.id);
      setShowEncouragement(false);
    }
  };

  const handleParentAccess = () => {
    authenticateParent(true)
    navigate('/parent')
  }

  const handleSubjectClick = (route) => {
    audioEngine.playUI('pop')
    navigate(route)
  }

  return (
    <div className="screen-container" style={{
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: 'linear-gradient(to bottom, #ecfdf5, #dbeafe)',
      padding: '1rem',
      minHeight: '100vh'
    }}>
      {showParentGate && (
        <ParentGateModal
          onClose={() => setShowParentGate(false)}
          onSuccess={handleParentAccess}
        />
      )}

      {/* Encouragement Modal */}
      {showEncouragement && currentEncouragement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeInWipe 0.5s' }}>
          <div style={{ transform: 'scale(1.5)', marginBottom: '2rem' }}>
            <MascotRabbit feedbackState="happy" />
          </div>
          <h1 style={{ fontSize: '2.5rem', color: '#1e293b', margin: 0, textShadow: '0 2px 4px rgba(255,255,255,0.5)', textAlign: 'center' }}>
            {t('newLetter')}
          </h1>
          <div style={{ background: '#fef3c7', padding: '2rem', borderRadius: '24px', maxWidth: '80%', marginBottom: '2rem', border: '2px dashed #f59e0b', fontSize: '1.5rem', color: '#92400e', textAlign: 'center' }}>
            "{currentEncouragement.message}"
          </div>
          <button className="btn-primary" style={{ fontSize: '2rem', padding: '1.5rem 3rem', animation: 'pulse-glow 2s infinite', background: '#f59e0b' }} onClick={handleClaimEncouragement}>
            {t('claimReward')} 🎟️
          </button>
        </div>
      )}

      {/* ── Header Bar: Currency + Settings ── */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        zIndex: 10
      }}>
        {/* Currency pills */}
        <div style={{
          background: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '100px',
          display: 'flex',
          gap: '0.75rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#eab308' }}>⭐ {stars}</span>
          {gems > 0 && <span style={{ color: '#0ea5e9' }}>💎 {gems}</span>}
          {tickets > 0 && <span style={{ color: '#a855f7' }}>🎟️ {tickets}</span>}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div 
            style={{ 
              display: 'flex', 
              background: '#e2e8f0', 
              borderRadius: '2rem', 
              padding: '0.25rem',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={toggleLanguage}
          >
            <div style={{
              position: 'absolute',
              top: '0.25rem',
              bottom: '0.25rem',
              left: language === 'zh' ? '0.25rem' : '50%',
              width: 'calc(50% - 0.25rem)',
              background: 'white',
              borderRadius: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} />
            <span style={{ 
              padding: '0.4rem 1rem', 
              fontWeight: 'bold', 
              color: language === 'zh' ? '#3b82f6' : '#64748b',
              zIndex: 1,
              transition: 'color 0.3s ease'
            }}>中</span>
            <span style={{ 
              padding: '0.4rem 1rem', 
              fontWeight: 'bold', 
              color: language === 'en' ? '#3b82f6' : '#64748b',
              zIndex: 1,
              transition: 'color 0.3s ease'
            }}>EN</span>
          </div>

          {/* Settings gear */}
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '0.5rem',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => { audioEngine.playUI('pop'); setShowParentGate(true); }}
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* ── Mascot + Title ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '2rem',
        opacity: isEntering ? 0 : 1,
        transform: isEntering ? 'translateY(30px)' : 'translateY(0)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
      }}>
        <div style={{ filter: 'drop-shadow(0 8px 8px rgba(0,0,0,0.1))', marginBottom: '1rem' }}>
          <MascotRabbit style={{ width: '180px', height: '180px' }} />
        </div>
        <h1 
          style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            color: '#1e3a8a',
            marginBottom: '0.25rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}
          onClick={() => {
            audioEngine.playUI('pop');
            // If we had TTS, we would play the translated string here.
            // For MVP, just play a cheerful sound.
          }}
        >
          {t('readyToLearn')} <Volume2 size={32} color="#3b82f6" />
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          color: '#64748b',
          textAlign: 'center'
        }}>
          {t('pickSubject')}
        </p>
      </div>

      {/* ── Subject Cards ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '600px',
        opacity: isEntering ? 0 : 1,
        transform: isEntering ? 'translateY(40px)' : 'translateY(0)',
        transition: 'all 0.6s ease-out 0.3s'
      }}>
        {/* Phonics Card */}
        <div
          onClick={() => handleSubjectClick(SUBJECTS.phonics.route)}
          style={{
            background: SUBJECTS.phonics.gradient,
            borderRadius: '24px',
            padding: '1.5rem',
            flex: '1 1 240px',
            minWidth: '240px',
            maxWidth: '300px',
            minHeight: '180px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(59,130,246,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(59,130,246,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(59,130,246,0.3)'; }}
        >
          {/* Completion badge */}
          {hasCompletedDaily && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}>✅</div>
          )}

          <div style={{ display: 'flex', gap: '0.25rem', fontSize: '2.5rem' }}>
            🐱 🐶 🐰
          </div>
          <h2 style={{
            color: 'white',
            fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {t('phonics')}
          </h2>
          <button
            className="btn-primary"
            style={{
              padding: '0.6rem 2rem',
              fontSize: '1rem',
              minWidth: '44px',
              minHeight: '44px',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={(e) => { e.stopPropagation(); handleSubjectClick(SUBJECTS.phonics.route); }}
          >
            {t('start')} ▶
          </button>
        </div>

        {/* Maths Card */}
        <div
          onClick={() => handleSubjectClick(SUBJECTS.math.route)}
          style={{
            background: SUBJECTS.math.gradient,
            borderRadius: '24px',
            padding: '1.5rem',
            flex: '1 1 240px',
            minWidth: '240px',
            maxWidth: '300px',
            minHeight: '180px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(245,158,11,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(245,158,11,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(245,158,11,0.3)'; }}
        >
          {/* Completion badge for math */}
          {math.hasCompletedDaily && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}>✅</div>
          )}

          <div style={{ display: 'flex', gap: '0.25rem', fontSize: '2.5rem' }}>
            🍎 🍎 🍎
          </div>
          <h2 style={{
            color: 'white',
            fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {t('maths')}
          </h2>
          <button
            className="btn-primary"
            style={{
              padding: '0.6rem 2rem',
              fontSize: '1rem',
              minWidth: '44px',
              minHeight: '44px',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={(e) => { e.stopPropagation(); handleSubjectClick(SUBJECTS.math.route); }}
          >
            {t('start')}
          </button>
        </div>
      </div>

      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '8%', left: '3%', fontSize: '3rem', opacity: 0.4, animation: 'float 5s ease-in-out infinite alternate', pointerEvents: 'none' }}>☁️</div>
      <div style={{ position: 'absolute', top: '20%', right: '5%', fontSize: '4rem', opacity: 0.3, animation: 'float 7s ease-in-out infinite alternate-reverse', pointerEvents: 'none' }}>☁️</div>
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', fontSize: '2.5rem', opacity: 0.3, animation: 'float 4s ease-in-out infinite alternate', pointerEvents: 'none' }}>✨</div>
      <div style={{ position: 'absolute', bottom: '20%', right: '8%', fontSize: '3rem', opacity: 0.3, animation: 'float 6s ease-in-out infinite alternate-reverse', pointerEvents: 'none' }}>🌈</div>
    </div>
  )
}
