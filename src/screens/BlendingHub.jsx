import React from 'react';
import { BookOpen, ChevronRight, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExperienceFrame from '../components/ExperienceFrame';
import PhaserAdventureWorld from '../components/PhaserAdventureWorld';
import '../styles/blending-hub.css';

const paths = [
  {
    id: 'learn',
    icon: BookOpen,
    title: 'Learn to Blend',
    description: 'Listen → join → build the word',
    action: 'Start learning',
    href: '/simple-words?mode=learn&adventure=1&sessionSize=5',
  },
  {
    id: 'test',
    icon: Gamepad2,
    title: 'Simple Word',
    description: 'Listen and spell the CVC word',
    action: 'Play Simple Word',
    href: '/simple-words?adventure=1&sessionSize=5',
  },
];

export default function BlendingHub() {
  const navigate = useNavigate();

  return (
    <ExperienceFrame
      world="學習拼音併音"
      title="學習拼音併音"
      subtitle="先聽清楚，再慢慢拼出真正嘅字"
      backTo="/phonics"
      tone="mint"
    >
      <section className="blending-intro" aria-label="Blending lesson introduction">
        <div>
          <span className="blending-intro__kicker">🐰 Rabbit Adventure</span>
          <h2>幫 Bunny 行到 Carrot Castle</h2>
          <p>每次只學一小段，學完再測，唔使死背。</p>
        </div>
        <span className="blending-intro__badge">5 words</span>
      </section>

      <PhaserAdventureWorld progress={0} total={5} />

      <div className="blending-path-grid">
        {paths.map(({ id, icon: Icon, title, description, action, href }) => (
          <article className={`blending-path-card blending-path-card--${id}`} key={id}>
            <div className="blending-path-card__icon"><Icon size={30} /></div>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <button type="button" className="btn-primary blending-path-card__button" onClick={() => navigate(href)}>
              {action} <ChevronRight size={20} />
            </button>
          </article>
        ))}
      </div>

      <p className="blending-note">CVC words stay here. 英語拼音森林會有另一套冒險任務。</p>
    </ExperienceFrame>
  );
}
