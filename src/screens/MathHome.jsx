import React from 'react';
import { Dumbbell, Map as MapIcon, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MathMascot from '../math/components/MathMascot';
import { audioEngine } from '../audio/AudioEngine';
import { useGameStore } from '../store/gameStore';
import { mathQuestionEngine } from '../math/engine/MathQuestionEngine';
import { createRandom } from '../math/engine/random';
import { composeMathSession } from '../math/engine/difficulty';
import { useTranslation } from '../hooks/useTranslation';
import ExperienceFrame from '../components/ExperienceFrame';
import '../styles/math-home.css';

export default function MathHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { math, startMathSession, getMathSkillStatus } = useGameStore();

  const startDaily = () => {
    audioEngine.playUI('pop');
    const plan = composeMathSession(math.unlockedSkillIds, math, getMathSkillStatus);
    const questions = plan.map((item, index) => {
      const question = mathQuestionEngine.generateQuestion(item.skillId, { difficulty: item.difficulty, random: createRandom(Date.now() + index) });
      if (question) question.id = crypto.randomUUID();
      return question;
    }).filter(Boolean);
    startMathSession(questions);
    navigate('/math/daily');
  };

  const startGym = () => {
    audioEngine.playUI('pop');
    const weakestSkill = Object.entries(math.learningStats || {})
      .filter(([, stats]) => stats.attempts >= 3)
      .sort(([, a], [, b]) => (a.firstAttemptHits / a.attempts) - (b.firstAttemptHits / b.attempts))[0]?.[0] || math.unlockedSkillIds[0];
    const questions = Array.from({ length: 5 }, (_, index) => {
      const question = mathQuestionEngine.generateQuestion(weakestSkill, { difficulty: Math.floor(Math.random() * 3) + 1, random: createRandom(Date.now() + index) });
      if (question) question.id = crypto.randomUUID();
      return question;
    }).filter(Boolean);
    startMathSession(questions);
    navigate('/math/gym');
  };

  return (
    <ExperienceFrame world={t('maths')} title={t('maths')} subtitle={t('mathWorldSubtitle')} backTo="/" tone="sun">
      <div className="math-hero">
        <MathMascot style={{ width: 150, height: 150 }} />
        <div><span className="math-hero__kicker">{t('numberAdventure')}</span><h2>{t('mathPrompt')}</h2><p>{t('mathDescription')}</p></div>
      </div>

      {math.completedToday ? (
        <section className="math-complete-card"><h2>{t('greatJobToday')}</h2><p>{t('completedDaily')}</p><span>{t('mathCompletedLabel')}</span></section>
      ) : (
        <button type="button" className="btn-primary math-primary-action" onClick={startDaily}><Play size={27} /> {t('dailyChallenge')}</button>
      )}

      <div className="math-choice-grid">
        <button type="button" className="math-choice-card" onClick={() => navigate('/math/map')}><MapIcon size={32} /><strong>{t('masteryMap')}</strong><span>{t('mapDescription')}</span></button>
        <button type="button" className="math-choice-card" onClick={startGym}><Dumbbell size={32} /><strong>{t('trainingGym')}</strong><span>{t('gymDescription')}</span></button>
      </div>
    </ExperienceFrame>
  );
}
