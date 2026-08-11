import React from 'react';
import { BookOpen, ChevronRight, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExperienceFrame from '../components/ExperienceFrame';
import PhaserAdventureWorld from '../components/PhaserAdventureWorld';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/blending-hub.css';

const paths = [
  {
    id: 'learn',
    icon: BookOpen,
    titleKey: 'learnToBlend',
    descriptionKey: 'listenJoinBuild',
    actionKey: 'startLearning',
    href: '/simple-words?mode=learn&adventure=1&sessionSize=5',
  },
  {
    id: 'test',
    icon: Gamepad2,
    titleKey: 'simpleWord',
    descriptionKey: 'simpleWordDescription',
    actionKey: 'playSimpleWord',
    href: '/simple-words?adventure=1&sessionSize=5',
  },
];

export default function BlendingHub() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <ExperienceFrame
      world={t('blendingTitle')}
      title={t('blendingTitle')}
      subtitle={t('blendingIntroDescription')}
      backTo="/phonics"
      tone="mint"
    >
      <section className="blending-intro" aria-label={t('blendingIntroLabel')}>
        <div>
          <span className="blending-intro__kicker">{t('rabbitAdventure')}</span>
          <h2>{t('carrotCastle')}</h2>
          <p>{t('blendingIntroDescription')}</p>
        </div>
        <span className="blending-intro__badge">{t('wordsCount')}</span>
      </section>

      <PhaserAdventureWorld progress={0} total={5} />

      <div className="blending-path-grid">
        {paths.map(({ id, icon: Icon, titleKey, descriptionKey, actionKey, href }) => (
          <article className={`blending-path-card blending-path-card--${id}`} key={id}>
            <div className="blending-path-card__icon"><Icon size={30} /></div>
            <div>
              <span className="blending-path-card__tag">{t(id === 'learn' ? 'learnPathLabel' : 'testPathLabel')}</span>
              <h2>{t(titleKey)}</h2>
                <p>{t(descriptionKey)}</p>
            </div>
            <button type="button" className={`btn-${id === 'learn' ? 'primary' : 'secondary'} blending-path-card__button`} onClick={() => navigate(href)}>
              {t(actionKey)} <ChevronRight size={20} />
            </button>
          </article>
        ))}
      </div>

      <p className="blending-note">{t('blendingNote')}</p>
    </ExperienceFrame>
  );
}
