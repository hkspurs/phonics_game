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
  const { t, language } = useTranslation();
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
  const readyTitle = language === 'en' ? 'Ready to Learn?' : t('readyToLearn');

  return (
    <ExperienceFrame
      world="英語拼音森林"
      title={readyTitle}
      subtitle="今日嘅森林任務：聽音、認音、一步一步前進"
      backTo="/"
      tone="sky"
    >
      {showParentGate && <ParentGateModal onClose={() => setShowParentGate(false)} onSuccess={() => { authenticateParent(true); navigate('/parent'); }} />}

      <section className="phonics-hero-card">
        <div>
          <span className="phonics-hero-card__kicker">🌲 Phonics Forest mission</span>
          <h2>{t('todayMissionWaiting')}</h2>
          <p>完成一個小任務，兔仔就會向森林深處行一步。</p>
          <button type="button" className="btn-primary phonics-hero-card__button" onClick={startMission}>
            <Play size={24} /> {t('startTodayMission')}
          </button>
        </div>
        <div className="phonics-hero-card__characters"><MascotRabbit style={{ width: 120, height: 120 }} /><MissionSun /></div>
      </section>

      <div className="phonics-dashboard__tools" aria-label="Phonics Forest tools">
        <button type="button" className="world-tool world-tool--map" onClick={() => navigate('/map')}><Map size={22} /> {t('soundMap')}</button>
        <button type="button" className="world-tool" onClick={() => navigate('/assignments')}><ClipboardList size={22} /> {t('assignments')}</button>
        <button type="button" className="world-tool" onClick={openParent}><Settings size={22} /> Settings</button>
        <button type="button" className="world-tool" onClick={() => navigate('/shop')}><ShoppingCart size={22} /> Shop</button>
      </div>

      <section className="phonics-learning-split" aria-label="Choose a learning world">
        <article className="phonics-world-card phonics-world-card--blend">
          <span className="phonics-world-card__emoji">🐰</span>
          <div>
            <span className="phonics-world-card__eyebrow">NEW LEARNING WORLD</span>
            <h2>學習拼音併音</h2>
            <p>先聽同併音，再入 Simple Word 測試。CVC 字留喺自己嘅小世界。</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/blending')}>Open blending world <span aria-hidden="true">→</span></button>
            <div className="phonics-world-card__legacy">
              <span>Legacy compatibility</span>
              <button type="button" className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/simple-words?mode=learn'); }}>Learn to Blend</button>
              <button type="button" className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/simple-words'); }}>Simple Word</button>
            </div>
          </div>
        </article>

        <article className="phonics-world-card phonics-world-card--forest">
          <span className="phonics-world-card__emoji">🌳</span>
          <div>
            <span className="phonics-world-card__eyebrow">FOREST ADVENTURE</span>
            <h2>英語拼音森林</h2>
            <p>每日任務、Sound Map 同進階 phonics challenge。</p>
            <button type="button" className="btn-secondary" onClick={() => navigate('/map')}><Map size={20} /> Explore the forest</button>
          </div>
        </article>
      </section>

      <section className="phonics-legacy-row" aria-label="Forest tools">
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

      <button type="button" className="phonics-read-aloud" aria-label="Listen to instructions" onClick={() => audioEngine.playUI('pop')}>
        <Volume2 size={18} /> Listen to instructions
      </button>
    </ExperienceFrame>
  );
}
