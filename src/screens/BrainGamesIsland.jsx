import React from 'react';
import { Brain, Lock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import ExperienceFrame from '../components/ExperienceFrame';
import '../styles/brain-games.css';

const games = [
  { route: '/games/soundcatcher', emoji: '🫧', title: 'soundCatcher', description: 'popBubbles', tone: 'pink' },
  { route: '/games/memorymatch', emoji: '🃏', title: 'memoryMatch', description: 'matchSounds', tone: 'purple' },
  { route: '/games/soundballoonpop', emoji: '🎈', title: 'balloonPop', description: 'popBalloons', tone: 'blue' },
];

export default function BrainGamesIsland() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tickets = useGameStore((state) => state.tickets);

  return (
    <ExperienceFrame world="益智遊戲島" title={t('brainGamesIsland')} subtitle="短短一局，聽音、記憶、反應都練到。" backTo="/phonics" tone="violet">
      <div className="brain-intro"><span className="brain-intro__icon"><Brain size={34} /></span><div><strong>{t('useTicketsToPlay')}</strong><p>每局用一張門票；完成每日任務可以再拎。</p></div><span className="brain-ticket">🎟️ {tickets}</span></div>
      {tickets <= 0 && <p className="brain-empty">{t('outOfTickets')}</p>}
      <div className="brain-game-grid">
        {games.map(({ route, emoji, title, description, tone }) => {
          const enabled = tickets > 0;
          return <article className={`brain-game-card brain-game-card--${tone}`} key={route}>
            <span className="brain-game-card__emoji" aria-hidden="true">{emoji}</span>
            <h2>{t(title)}</h2>
            <p>{t(description)}</p>
            <button type="button" className="btn-primary" disabled={!enabled} onClick={() => enabled && navigate(route)}>
              {enabled ? <><Play size={18} /> {t('playCost')}</> : <><Lock size={18} /> {t('needTickets')}</>}
            </button>
          </article>;
        })}
      </div>
    </ExperienceFrame>
  );
}
