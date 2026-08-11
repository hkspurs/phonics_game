import React, { useEffect, useState } from 'react';
import { Globe2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import ExperienceFrame from '../components/ExperienceFrame';
import ParentGateModal from '../components/ParentGateModal';
import MascotRabbit from '../components/MascotRabbit';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/subject-gateway.css';

export default function SubjectGateway() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useTranslation();
  const [showParentGate, setShowParentGate] = useState(false);
  const [currentEncouragement, setCurrentEncouragement] = useState(null);
  const { encouragements, claimEncouragement, addTicket, authenticateParent, math } = useGameStore();

  useEffect(() => {
    const next = encouragements?.find((item) => !item.claimedAt);
    if (next) setCurrentEncouragement(next);
  }, [encouragements]);

  const claim = () => {
    if (!currentEncouragement) return;
    audioEngine.playUI('correct');
    addTicket();
    claimEncouragement(currentEncouragement.id);
    setCurrentEncouragement(null);
  };

  return (
    <ExperienceFrame
      world={t('rabbitAcademy')}
      title={t('readyToLearn')}
      subtitle={t('academySubtitle')}
      showBack={false}
      showSettings={false}
      tone="academy"
    >
      {showParentGate && <ParentGateModal onClose={() => setShowParentGate(false)} onSuccess={() => { authenticateParent(true); navigate('/parent'); }} />}

      {currentEncouragement && (
        <aside className="encouragement-card" role="status">
          <MascotRabbit feedbackState="correct" style={{ width: 72, height: 72 }} />
          <div>
            <strong>{t('newLetter')}</strong>
            <p>“{currentEncouragement.message}”</p>
          </div>
          <button type="button" className="btn-primary" onClick={claim}>{t('claimReward')} 🎟️</button>
        </aside>
      )}

      <div className="academy-tools">
        <button type="button" className="academy-language" onClick={toggleLanguage} aria-label={t('changeLanguage')}>
          <Globe2 size={18} /> {language === 'zh' ? '中 / EN' : 'EN / 中'}
        </button>
        <button type="button" className="academy-settings" onClick={() => setShowParentGate(true)} aria-label={t('settings')}><Settings size={20} /> {t('parents')}</button>
      </div>

      <section className="subject-grid" aria-label={t('chooseSubject')}>
        <button type="button" className="subject-card subject-card--phonics" onClick={() => navigate('/phonics')}>
          <span className="subject-card__art" aria-hidden="true">🌲 🌱 ✨</span>
          <span className="subject-card__eyebrow">{t('languageAdventure')}</span>
          <h2>{t('phonics')}</h2>
          <p>{t('subjectPhonicsDescription')}</p>
          <span className="subject-card__cta">{t('explore')} <span aria-hidden="true">→</span></span>
        </button>
        <button type="button" className="subject-card subject-card--math" onClick={() => navigate('/math')}>
          <span className="subject-card__art" aria-hidden="true">🔢 🍎 ⭐</span>
          <span className="subject-card__eyebrow">{t('numberAdventure')}</span>
          <h2>{t('maths')}</h2>
          <p>{t('subjectMathDescription')}</p>
          <span className="subject-card__cta">{t('start')} <span aria-hidden="true">→</span></span>
          {math?.completedToday && <span className="subject-card__complete">✅</span>}
        </button>
      </section>

      <p className="academy-footer">{t('academyFooter')}</p>
    </ExperienceFrame>
  );
}
