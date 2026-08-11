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
      world="Rabbit Academy"
      title={language === 'en' ? 'Ready to Learn?' : t('readyToLearn')}
      subtitle="選一個世界，完成一個小任務，再返嚟玩。"
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
            {language === 'en' && <span className="encouragement-card__bilingual">你有一封新信件！💌</span>}
            <p>“{currentEncouragement.message}”</p>
          </div>
          <button type="button" className="btn-primary" onClick={claim}>{t('claimReward')} / 領取獎勵 🎟️</button>
        </aside>
      )}

      <div className="academy-tools">
        <button type="button" className="academy-language" onClick={toggleLanguage} aria-label="Change language">
          <Globe2 size={18} /> {language === 'zh' ? '中' : 'EN'} / {language === 'zh' ? 'EN' : '中'}
        </button>
        <button type="button" className="academy-settings" onClick={() => setShowParentGate(true)} aria-label="Settings"><Settings size={20} /> Parents</button>
      </div>

      <section className="subject-grid" aria-label="Choose a subject">
        <button type="button" className="subject-card subject-card--phonics" onClick={() => navigate('/phonics')}>
          <span className="subject-card__art" aria-hidden="true">🌲 🌱 ✨</span>
          <span className="subject-card__eyebrow">LANGUAGE ADVENTURE</span>
          <h2>{t('phonics')}</h2>
          <p>Hear sounds, follow the path, and unlock the forest.</p>
          <span className="subject-card__cta">{t('explore')} <span aria-hidden="true">→</span></span>
        </button>
        <button type="button" className="subject-card subject-card--math" onClick={() => navigate('/math')}>
          <span className="subject-card__art" aria-hidden="true">🔢 🍎 ⭐</span>
          <span className="subject-card__eyebrow">NUMBER ADVENTURE</span>
          <h2>{t('maths')}</h2>
          <p>Build number confidence through daily missions and practice.</p>
          <span className="subject-card__cta">{t('start')} <span aria-hidden="true">→</span></span>
          {math?.completedToday && <span className="subject-card__complete">✅</span>}
        </button>
      </section>

      <p className="academy-footer">Rabbit Adventure keeps learning, practice and rewards in one place.</p>
    </ExperienceFrame>
  );
}
