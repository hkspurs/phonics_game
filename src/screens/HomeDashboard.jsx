import React, { useEffect, useState } from 'react';
import { ClipboardList, Map, Play, Puzzle, Settings, ShoppingCart, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import ExperienceFrame from '../components/ExperienceFrame';
import MascotRabbit from '../components/MascotRabbit';
import MissionSun from '../components/MissionSun';
import ParentGateModal from '../components/ParentGateModal';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/phonics-dashboard.css';

export default function HomeDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showParentGate, setShowParentGate] = useState(false);
  const {
    unlockedSounds,
    startDailyChallenge,
    startBubbleChallenge,
    tickets,
    hasCompletedDaily,
    checkDailyReset,
    authenticateParent,
    isParentAuthenticated,
  } = useGameStore();

  useEffect(() => { checkDailyReset(); }, [checkDailyReset]);

  const startMission = () => {
    audioEngine.playUI('pop');
    startDailyChallenge();
    navigate('/challenge');
  };

  const openParent = () => {
    if (isParentAuthenticated) navigate('/parent');
    else setShowParentGate(true);
  };
  return (
    <ExperienceFrame
      world={t('phonics')}
      title={t('readyToLearn')}
      subtitle={t('phonicsWorldSubtitle')}
      backTo="/"
      tone="sky"
    >
      {showParentGate && <ParentGateModal onClose={() => setShowParentGate(false)} onSuccess={() => { authenticateParent(true); navigate('/parent'); }} />}

      <section className="phonics-hero-card">
        <div>
          <span className="phonics-hero-card__kicker">{t('phonicsMissionKicker')}</span>
          <h2>{t('todayMissionWaiting')}</h2>
          <p>{t('phonicsMissionDescription')}</p>
          <button type="button" className="btn-primary phonics-hero-card__button" onClick={startMission}>
            <Play size={24} /> {t('startTodayMission')}
          </button>
        </div>
        <div className="phonics-hero-card__characters"><MascotRabbit style={{ width: 120, height: 120 }} /><MissionSun /></div>
      </section>

      <div className="phonics-dashboard__tools" aria-label={t('phonicsTools')}>
        <button type="button" className="world-tool world-tool--map" onClick={() => navigate('/map')}><Map size={22} /> {t('soundMap')}</button>
        <button type="button" className="world-tool" onClick={() => navigate('/assignments')}><ClipboardList size={22} /> {t('assignments')}</button>
        <button type="button" className="world-tool" onClick={openParent}><Settings size={22} /> {t('settingsTool')}</button>
        <button type="button" className="world-tool" onClick={() => navigate('/shop')}><ShoppingCart size={22} /> {t('shopTool')}</button>
      </div>

      <section className="phonics-learning-split" aria-label={t('chooseLearningWorld')}>
        <article className="phonics-world-card phonics-world-card--blend">
          <span className="phonics-world-card__emoji">🐰</span>
          <div>
            <span className="phonics-world-card__eyebrow">{t('newLearningWorld')}</span>
            <h2>{t('blendingTitle')}</h2>
            <p>{t('blendingDescription')}</p>
            <button type="button" className="btn-secondary" onClick={() => navigate('/blending')}>{t('openBlendingWorld')} <span aria-hidden="true">→</span></button>
            <details open className="phonics-world-card__legacy">
              <summary>{t('legacyCompatibility')}</summary>
              <div>
                <button type="button" className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/simple-words?mode=learn'); }}>{t('learnToBlend')}</button>
                <button type="button" className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/simple-words'); }}>{t('simpleWord')}</button>
              </div>
            </details>
          </div>
        </article>

        <article className="phonics-world-card phonics-world-card--forest">
          <span className="phonics-world-card__emoji">🌳</span>
          <div>
            <span className="phonics-world-card__eyebrow">{t('forestAdventure')}</span>
            <h2>{t('phonics')}</h2>
            <p>{t('forestDescription')}</p>
            <button type="button" className="btn-secondary" onClick={() => navigate('/map')}><Map size={20} /> {t('exploreForest')}</button>
          </div>
        </article>
      </section>

      <section className="phonics-legacy-row" aria-label={t('forestTools')}>
        {unlockedSounds.length >= 10 && (
          <button type="button" className="btn-secondary phonics-legacy-row__bubble" onClick={() => { startBubbleChallenge(); navigate('/bubble'); }}><span aria-hidden="true">🎈</span> {t('bubbleChallenge')}</button>
        )}
        <button
          type="button"
          className="btn-secondary"
          disabled={!hasCompletedDaily && tickets <= 0}
          onClick={() => (hasCompletedDaily || tickets > 0) && navigate('/braingames')}
        >
          {(hasCompletedDaily || tickets > 0) ? <Puzzle size={21} /> : <span aria-hidden="true">🔒</span>} {t('brainGames')}
        </button>
      </section>

      <button type="button" className="phonics-read-aloud" aria-label={t('listenInstructions')} onClick={() => audioEngine.playUI('pop')}>
        <Volume2 size={18} /> {t('listenInstructions')}
      </button>
    </ExperienceFrame>
  );
}
