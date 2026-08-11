import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { useTranslation } from '../hooks/useTranslation'

export default function AssignmentHub() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { activeAssignment, startAssignment } = useGameStore()

  const handleStartAssignment = () => {
    if (activeAssignment) {
      startAssignment(activeAssignment.targetSoundId)
      navigate('/challenge')
    }
  }

  return (
    <div className="screen-container" style={{ background: '#fffbeb', position: 'relative' }}>
      
      <button className="btn-secondary" style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.5rem 1rem' }} onClick={() => navigate('/', { replace: true })}>
        <ArrowLeft size={24} /> {t('back')}
      </button>

      <h1 style={{ textAlign: 'center', color: '#b45309', fontSize: '2.5rem', marginTop: '2rem' }}>{t('teacherAssignments')}</h1>
      
      {!activeAssignment || activeAssignment.completed ? (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <div style={{ fontSize: '6rem' }}>🎉</div>
          <h2 style={{ color: '#d97706' }}>{t('noNewAssignments')}</h2>
          <p style={{ color: '#b45309', marginTop: '1rem' }}>{t('allCaughtUp')}</p>
        </div>
      ) : (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #fcd34d', maxWidth: '600px', margin: '4rem auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
          <h2 style={{ color: '#b45309', marginBottom: '1rem' }}>{activeAssignment.title}</h2>
          <p style={{ color: '#d97706', textAlign: 'center', marginBottom: '2rem' }}>
            {t('assignedSoundDescription')}
          </p>
          <button className="btn-primary" style={{ background: '#f59e0b', boxShadow: '0 6px 0 #b45309' }} onClick={handleStartAssignment}>
            <Play size={24} /> {t('startAssignment')}
          </button>
        </div>
      )}

    </div>
  )
}
