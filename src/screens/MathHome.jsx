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
    <ExperienceFrame world="數學王國" title={t('maths')} subtitle="每日一小步，數字信心行遠一步。" backTo="/" tone="sun">
      <div className="math-hero">
        <MathMascot style={{ width: 150, height: 150 }} />
        <div><span className="math-hero__kicker">🔢 NUMBER ADVENTURE</span><h2>今日去邊度？</h2><p>選 Mission、Map 或 Gym，唔同玩法都會幫你變強。</p></div>
      </div>

      {math.completedToday ? (
        <section className="math-complete-card"><h2>{t('greatJobToday')}</h2><p>{t('completedDaily')}</p><span>🌟 今日任務已完成</span></section>
      ) : (
        <button type="button" className="btn-primary math-primary-action" onClick={startDaily}><Play size={27} /> {t('dailyChallenge')}</button>
      )}

      <div className="math-choice-grid">
        <button type="button" className="math-choice-card" onClick={() => navigate('/math/map')}><MapIcon size={32} /><strong>{t('masteryMap')}</strong><span>睇吓你已經行到邊</span></button>
        <button type="button" className="math-choice-card" onClick={startGym}><Dumbbell size={32} /><strong>{t('trainingGym')}</strong><span>針對需要多啲練習嘅地方</span></button>
      </div>
    </ExperienceFrame>
  );
}
