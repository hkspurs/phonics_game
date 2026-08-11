import React, { useState } from 'react';
import { ArrowLeft, Diamond, Settings, ShoppingCart, Star, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import MascotRabbit from './MascotRabbit';
import WorldProgress from './WorldProgress';
import ParentGateModal from './ParentGateModal';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/experience.css';

export default function ExperienceFrame({
  world = 'Adventure',
  title,
  subtitle,
  progress,
  backTo = '/',
  showBack = true,
  showShop = true,
  showSettings = true,
  children,
  tone = 'sky',
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { stars, gems, tickets, isParentAuthenticated, authenticateParent } = useGameStore();
  const [showParentGate, setShowParentGate] = useState(false);

  const go = (destination) => {
    audioEngine.playUI('pop');
    navigate(destination);
  };

  const openSettings = () => {
    audioEngine.playUI('pop');
    if (isParentAuthenticated) navigate('/parent');
    else setShowParentGate(true);
  };

  return (
    <div className={`screen-container experience-frame experience-frame--${tone}`}>
      {showParentGate && <ParentGateModal onClose={() => setShowParentGate(false)} onSuccess={() => { authenticateParent(true); navigate('/parent'); }} />}
      <header className="experience-topbar" role="banner">
        <div className="experience-topbar__left">
          {showBack ? (
            <button className="experience-icon-button" type="button" onClick={() => go(backTo)} aria-label={t('back')}>
              <ArrowLeft size={22} />
              <span className="experience-back-label">{t('back')}</span>
            </button>
          ) : (
            <MascotRabbit className="experience-topbar__mascot" style={{ width: 42, height: 42 }} />
          )}
          <div>
            <span className="experience-eyebrow">🐰 {world !== title ? world : ''}</span>
            <strong className="experience-brand">{t('brand')}</strong>
          </div>
        </div>

        <div className="experience-currency" aria-label={t('rewards')}>
          <span title={t('stars')}><Star size={16} fill="currentColor" /> {stars}</span>
          <span title={t('diamonds')}><Diamond size={16} fill="currentColor" /> {gems}</span>
          <span title={t('tickets')}><Ticket size={16} fill="currentColor" /> {tickets} {t('ticketsWithCount')}</span>
        </div>

        <div className="experience-topbar__actions">
          {showShop && <button className="experience-icon-button" type="button" onClick={() => go('/shop')} aria-label={t('shopTool')}>
            <ShoppingCart size={21} />
          </button>}
          {showSettings && <button className="experience-icon-button" type="button" onClick={openSettings} aria-label={t('settings')}>
            <Settings size={21} />
          </button>}
        </div>
      </header>

      <main className="experience-main">
        <section className="experience-heading" aria-labelledby="experience-title">
          {world !== title && <span className="experience-heading__world">{world}</span>}
          <h1 id="experience-title">{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {progress && <WorldProgress {...progress} />}
        </section>
        <section className="experience-content">{children}</section>
      </main>
    </div>
  );
}
