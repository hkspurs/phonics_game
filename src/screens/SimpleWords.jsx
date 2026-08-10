import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { audioEngine } from '../audio/AudioEngine';
import MascotRabbit from '../components/MascotRabbit';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { SIMPLE_WORDS } from '../game/simpleWords';
import { buildSimpleWordQueue, calculateSimpleWordGems } from '../game/simpleWordReview';
import { useGameStore } from '../store/gameStore';

export default function SimpleWords() {
  const navigate = useNavigate();
  const simpleWordStats = useGameStore((state) => state.simpleWordStats);
  const recordSimpleWordAnswer = useGameStore((state) => state.recordSimpleWordAnswer);
  const awardSimpleWordGems = useGameStore((state) => state.awardSimpleWordGems);
  const timerRef = useRef();
  const playRequestRef = useRef(0);
  const [queue, setQueue] = useState(() => buildSimpleWordQueue(SIMPLE_WORDS, simpleWordStats));
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState('idle');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [firstAttemptHits, setFirstAttemptHits] = useState(0);
  const [earnedGems, setEarnedGems] = useState(0);
  const [complete, setComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const current = queue[index];

  const playCurrent = useCallback(async () => {
    if (!current) return;
    const requestId = ++playRequestRef.current;
    setIsPlaying(true);
    setAudioFailed(false);
    const played = await audioEngine.playAudioById(current.id);
    if (playRequestRef.current !== requestId) return;
    setAudioFailed(!played);
    setIsPlaying(false);
  }, [current]);

  useEffect(() => {
    if (!complete) playCurrent();
    return () => {
      playRequestRef.current += 1;
      audioEngine.stop();
    };
  }, [complete, playCurrent]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const restart = () => {
    clearTimeout(timerRef.current);
    audioEngine.stop();
    setQueue(buildSimpleWordQueue(SIMPLE_WORDS, useGameStore.getState().simpleWordStats));
    setIndex(0);
    setTyped('');
    setFeedback('idle');
    setWrongAttempts(0);
    setFirstAttemptHits(0);
    setEarnedGems(0);
    setComplete(false);
  };

  const handleKey = (key) => {
    if (feedback !== 'idle' || isPlaying) return;
    if (key === 'BACKSPACE') {
      setTyped((answer) => answer.slice(0, -1));
    } else {
      setTyped((answer) => answer.length < 3 ? answer + key : answer);
    }
  };

  const handleSubmit = () => {
    if (typed.length !== 3 || feedback !== 'idle' || isPlaying) return;
    if (typed === current.word) {
      const firstTry = wrongAttempts === 0;
      const nextFirstAttemptHits = firstAttemptHits + (firstTry ? 1 : 0);
      if (firstTry) setFirstAttemptHits((hits) => hits + 1);
      recordSimpleWordAnswer(current.id, firstTry, wrongAttempts);
      setFeedback('correct');
      audioEngine.playUI('correct');
      timerRef.current = setTimeout(() => {
        setTyped('');
        setFeedback('idle');
        setWrongAttempts(0);
        if (index === queue.length - 1) {
          const reward = calculateSimpleWordGems(nextFirstAttemptHits, queue.length);
          awardSimpleWordGems(nextFirstAttemptHits, queue.length);
          setEarnedGems(reward);
          setComplete(true);
        } else {
          setIndex((value) => value + 1);
        }
      }, 650);
      return;
    }

    setWrongAttempts((attempts) => Math.min(3, attempts + 1));
    setFeedback('retry');
    timerRef.current = setTimeout(() => {
      setTyped('');
      setFeedback('idle');
      playCurrent();
    }, 450);
  };

  if (complete) {
    return (
      <div className="screen-container" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(180deg, #dbeafe, #fef3c7)', padding: '2rem' }}>
        <MascotRabbit feedbackState="correct" style={{ width: 220, height: 220 }} />
        <h1 style={{ color: '#1e3a8a', fontSize: 'clamp(2rem, 7vw, 3.5rem)' }}>Simple Word Complete!</h1>
        <p style={{ color: '#475569', fontSize: '1.5rem', fontWeight: 800 }}>First try: {firstAttemptHits} / 16</p>
        <p style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 800 }}>Earned: +{earnedGems} 💎</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={restart}><RotateCcw /> Play Again</button>
          <button className="btn-secondary" onClick={() => navigate('/phonics')}><ArrowLeft /> Back to Phonics</button>
        </div>
      </div>
    );
  }

  const disabled = feedback !== 'idle' || isPlaying;
  const hint = wrongAttempts === 1
    ? '_ _ _'
    : wrongAttempts === 2
      ? `${current.word.slice(0, 2)} _`
      : wrongAttempts >= 3 ? current.word : null;

  return (
    <div className="screen-container" style={{ overflowY: 'auto', alignItems: 'center', background: 'linear-gradient(180deg, #dbeafe, #ecfeff)', padding: 'max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom))' }}>
      <header style={{ width: '100%', maxWidth: 760, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-secondary" onClick={() => navigate('/phonics')}><ArrowLeft /> Back</button>
        <strong style={{ color: '#1e3a8a', fontSize: '1.25rem' }}>{index + 1} / {queue.length}</strong>
      </header>

      <div style={{ width: '100%', maxWidth: 760, height: 14, borderRadius: 999, background: '#bfdbfe', overflow: 'hidden', marginTop: '1rem' }}>
        <div style={{ width: `${(index + 1) / queue.length * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #22c55e)', transition: 'width 0.3s' }} />
      </div>

      <MascotRabbit isListening={isPlaying} feedbackState={feedback === 'correct' ? 'correct' : null} style={{ width: 150, height: 150, marginTop: '0.5rem' }} />
      <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: 'clamp(2rem, 7vw, 3rem)' }}>Simple Word</h1>
      <p style={{ color: '#475569', fontSize: '1.15rem', fontWeight: 700 }}>Listen and spell the word</p>

      <button
        aria-label="Play word"
        className="btn-primary"
        onClick={playCurrent}
        aria-busy={isPlaying}
        style={{ width: 104, height: 104, borderRadius: '50%', justifyContent: 'center', padding: 0 }}
      >
        <Volume2 size={52} />
      </button>

      {audioFailed && <p role="status" style={{ color: '#b45309', fontWeight: 800 }}>Tap the speaker to try again.</p>}

      <div aria-label={`Current answer: ${typed || 'empty'}`} style={{ display: 'flex', gap: '0.75rem', margin: '1.25rem 0' }}>
        {[0, 1, 2].map((slot) => (
          <div key={slot} className={feedback === 'retry' ? 'wobble-wrong' : ''} style={{ width: 'clamp(64px, 20vw, 92px)', height: 'clamp(76px, 23vw, 108px)', borderRadius: 22, border: '4px solid #7dd3fc', background: 'white', boxShadow: '0 8px 0 #38bdf8', display: 'grid', placeItems: 'center', color: '#1e3a8a', fontSize: 'clamp(2.75rem, 12vw, 4.5rem)', fontWeight: 900 }}>
            {typed[slot] || ''}
          </div>
        ))}
      </div>

      {hint && (
        <div aria-label={`Hint: ${hint}`} style={{ minHeight: 36, color: '#1d4ed8', fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.12em' }}>
          Hint: {hint}
        </div>
      )}

      <div aria-live="polite" style={{ minHeight: 32, color: feedback === 'correct' ? '#15803d' : '#7c3aed', fontWeight: 900, fontSize: '1.2rem' }}>
        {feedback === 'correct' && '做得好！ 🎉'}
        {feedback === 'retry' && '差少少，再聽一次 🌟'}
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={disabled || typed.length !== 3} style={{ width: 'min(400px, 100%)', justifyContent: 'center', margin: '0.75rem 0' }}>
        Submit / 確定
      </button>

      <VirtualKeyboard onKeyPress={handleKey} disabled={disabled} />
    </div>
  );
}
