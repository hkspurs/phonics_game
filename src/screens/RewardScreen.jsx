import React, { useState } from 'react';
import { Home, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import TreasureChest from '../components/TreasureChest';
import RewardSticker from '../components/RewardSticker';
import ConfettiSVG from '../components/ConfettiSVG';
import { audioEngine } from '../audio/AudioEngine';
import { useTranslation } from '../hooks/useTranslation';
import ExperienceFrame from '../components/ExperienceFrame';
import '../styles/reward-screen.css';

export default function RewardScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const subject = params.get('subject') || 'phonics';
  const { sessionScore, endChallenge, math, completeMathDaily, currentChallengeType } = useGameStore();
  const [chestState, setChestState] = useState('closed');
  const opened = chestState === 'open';

  const openChest = () => {
    if (chestState !== 'closed') return;
    audioEngine.playUI('correct');
    setChestState('shaking');
    window.setTimeout(() => setChestState('open'), 650);
  };

  const goHome = () => {
    if (subject === 'math') { completeMathDaily(); navigate('/math', { replace: true }); }
    else { endChallenge(); navigate('/', { replace: true }); }
  };

  const stars = subject === 'math' ? math.mathSessionScore.stars : sessionScore.stars;
  const gems = sessionScore.gems;

  return (
    <ExperienceFrame world="Reward Village" title={t('missionComplete')} subtitle={opened ? 'You moved the adventure forward.' : 'Tap the chest when you are ready.'} backTo={subject === 'math' ? '/math' : '/phonics'} tone="violet">
      <ConfettiSVG isVisible={opened} />
      {!opened ? (
        <button type="button" className={`reward-chest ${chestState === 'shaking' ? 'reward-chest--shaking' : ''}`} onClick={openChest} aria-label={t('tapToOpen')}>
          <TreasureChest state={chestState} />
          <span>{t('tapToOpen')} ✨</span>
        </button>
      ) : (
        <section className="reward-card">
          <div className="reward-card__sticker"><RewardSticker isRevealed /></div>
          <h2><Sparkles size={24} /> {t('youEarned')}</h2>
          {subject === 'math' && <p>{t('questionsCompleted')} <strong>+8 ⭐</strong></p>}
          <div className="reward-card__numbers"><span>+{stars} ⭐</span>{subject !== 'math' && <span>+{gems} 💎</span>}</div>
          {(currentChallengeType === 'daily' || currentChallengeType === 'gym' || subject === 'math') && <p className="reward-ticket">🎟️ {subject === 'math' ? t('ticketUnlocked1') : t('ticketUnlocked2')}</p>}
          <button type="button" className="btn-primary reward-card__home" onClick={goHome}><Home size={21} /> {t('backToHome')}</button>
        </section>
      )}
    </ExperienceFrame>
  );
}
