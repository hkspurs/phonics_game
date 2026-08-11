import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Volume2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { audioEngine } from '../audio/AudioEngine';
import MascotRabbit from '../components/MascotRabbit';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { SIMPLE_WORDS } from '../game/simpleWords';
import { buildSimpleWordQueue, calculateSimpleWordGems } from '../game/simpleWordReview';
import {
  buildBlendingSession,
  buildBlendingTestSession,
  getBlendAudioId,
  shuffleWordLetters,
} from '../game/simpleWordLearning';
import { useGameStore } from '../store/gameStore';

const LEARNING_BLEND_PLAYBACK_RATE = 0.7;

function createQueues(learningMode, stats) {
  const reviewedQueue = buildSimpleWordQueue(SIMPLE_WORDS, stats);
  if (!learningMode) return { learningQueue: [], testQueue: reviewedQueue };

  const learningQueue = buildBlendingSession(reviewedQueue, Math.random, 16);
  return {
    learningQueue,
    testQueue: buildBlendingTestSession(SIMPLE_WORDS, learningQueue, Math.random, 16),
  };
}

export default function SimpleWords() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const learningMode = searchParams.get('mode') === 'learn';
  const simpleWordStats = useGameStore((state) => state.simpleWordStats);
  const recordSimpleWordAnswer = useGameStore((state) => state.recordSimpleWordAnswer);
  const awardSimpleWordGems = useGameStore((state) => state.awardSimpleWordGems);
  const timerRef = useRef();
  const playRequestRef = useRef(0);
  const [queues, setQueues] = useState(() => createQueues(learningMode, simpleWordStats));
  const [stage, setStage] = useState(learningMode ? 'learn' : 'test');
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState('idle');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [firstAttemptHits, setFirstAttemptHits] = useState(0);
  const [earnedGems, setEarnedGems] = useState(0);
  const [complete, setComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const queue = learningMode && stage === 'learn' ? queues.learningQueue : queues.testQueue;
  const current = queue[index];
  const [learningLetters, setLearningLetters] = useState(() => current ? shuffleWordLetters(current) : []);
  const [selectedLearningTiles, setSelectedLearningTiles] = useState([]);
  const [learningFeedback, setLearningFeedback] = useState('idle');
  const learningAnswer = selectedLearningTiles.map((tileIndex) => learningLetters[tileIndex]).join('');

  const playAudioSequence = useCallback(async (audioIds, playbackRate = 1) => {
    const requestId = ++playRequestRef.current;
    setIsPlaying(true);
    setAudioFailed(false);

    for (const audioId of audioIds) {
      const played = playbackRate === 1
        ? await audioEngine.playAudioById(audioId)
        : await audioEngine.playAudioById(audioId, { playbackRate });
      if (playRequestRef.current !== requestId) return false;
      if (!played) {
        setAudioFailed(true);
        setIsPlaying(false);
        return false;
      }
    }

    if (playRequestRef.current !== requestId) return false;
    setIsPlaying(false);
    return true;
  }, []);

  const playCurrent = useCallback(() => {
    if (!current) return Promise.resolve(false);
    const isLearningBlend = learningMode && stage === 'learn';
    return playAudioSequence(
      isLearningBlend ? [getBlendAudioId(current)] : [current.id],
      isLearningBlend ? LEARNING_BLEND_PLAYBACK_RATE : 1,
    );
  }, [current, learningMode, playAudioSequence, stage]);

  useEffect(() => {
    if (!complete && current) void playCurrent();
    return () => {
      playRequestRef.current += 1;
      audioEngine.stop();
    };
  }, [complete, current, playCurrent]);

  useEffect(() => {
    if (!learningMode || stage !== 'learn' || !current) return;
    setLearningLetters(shuffleWordLetters(current));
    setSelectedLearningTiles([]);
    setLearningFeedback('idle');
  }, [current, learningMode, stage]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const restart = () => {
    clearTimeout(timerRef.current);
    playRequestRef.current += 1;
    audioEngine.stop();
    const nextQueues = createQueues(learningMode, useGameStore.getState().simpleWordStats);
    setQueues(nextQueues);
    setStage(learningMode ? 'learn' : 'test');
    setIndex(0);
    setTyped('');
    setFeedback('idle');
    setWrongAttempts(0);
    setFirstAttemptHits(0);
    setEarnedGems(0);
    setComplete(false);
    setLearningLetters(nextQueues.learningQueue[0] ? shuffleWordLetters(nextQueues.learningQueue[0]) : []);
    setSelectedLearningTiles([]);
    setLearningFeedback('idle');
  };

  const moveToNextLearningWord = () => {
    if (isPlaying || learningFeedback !== 'correct') return;
    setAudioFailed(false);
    if (index === queue.length - 1) {
      setStage('test');
      setIndex(0);
    } else {
      setIndex((value) => value + 1);
    }
  };

  const handleLearningTile = (tileIndex) => {
    if (stage !== 'learn' || isPlaying || learningFeedback !== 'idle' || selectedLearningTiles.includes(tileIndex)) return;

    const nextTiles = [...selectedLearningTiles, tileIndex];
    setSelectedLearningTiles(nextTiles);
    if (nextTiles.length !== learningLetters.length) return;

    const answer = nextTiles.map((selectedIndex) => learningLetters[selectedIndex]).join('');
    if (answer === current.word) {
      setLearningFeedback('correct');
      audioEngine.playUI('correct');
      return;
    }

    setLearningFeedback('retry');
    timerRef.current = setTimeout(() => {
      setSelectedLearningTiles([]);
      setLearningFeedback('idle');
    }, 450);
  };

  const handleKey = (key) => {
    if (stage !== 'test' || feedback !== 'idle' || isPlaying) return;
    if (key === 'BACKSPACE') {
      setTyped((answer) => answer.slice(0, -1));
    } else {
      setTyped((answer) => answer.length < 3 ? answer + key : answer);
    }
  };

  const handleSubmit = () => {
    if (stage !== 'test' || !current || typed.length !== 3 || feedback !== 'idle' || isPlaying) return;
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
      void playCurrent();
    }, 450);
  };

  if (complete) {
    return (
      <div className="screen-container" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(180deg, #dbeafe, #fef3c7)', padding: '2rem' }}>
        <MascotRabbit feedbackState="correct" style={{ width: 220, height: 220 }} />
        <h1 style={{ color: '#1e3a8a', fontSize: 'clamp(2rem, 7vw, 3.5rem)' }}>{learningMode ? 'Learn & Test Complete!' : 'Simple Word Complete!'}</h1>
        <p style={{ color: '#475569', fontSize: '1.5rem', fontWeight: 800 }}>First try: {firstAttemptHits} / {queue.length}</p>
        <p style={{ color: '#0ea5e9', fontSize: '1.5rem', fontWeight: 800 }}>Earned: +{earnedGems} 💎</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={restart}><RotateCcw /> Play Again</button>
          <button className="btn-secondary" onClick={() => navigate('/phonics')}><ArrowLeft /> Back to Phonics</button>
        </div>
      </div>
    );
  }

  if (learningMode && stage === 'learn') {
    return (
      <div className="screen-container" style={{ overflowY: 'auto', alignItems: 'center', background: 'linear-gradient(180deg, #dbeafe, #ecfeff)', padding: 'max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom))' }}>
        <header style={{ width: '100%', maxWidth: 760, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('/phonics')}><ArrowLeft /> Back</button>
          <strong style={{ color: '#1e3a8a', fontSize: '1.25rem' }}>{index + 1} / {queue.length}</strong>
        </header>
        <MascotRabbit isListening={isPlaying} style={{ width: 160, height: 160, marginTop: '1rem' }} />
        <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: 'clamp(2rem, 7vw, 3rem)' }}>Learn to Blend</h1>
        <p style={{ color: '#475569', fontSize: '1.2rem', fontWeight: 800 }}>Listen → Join → Build</p>
        <div data-testid="learning-word" data-word={current.word} style={{ color: '#1e3a8a', fontSize: 'clamp(3rem, 16vw, 6rem)', fontWeight: 900, letterSpacing: '0.18em', margin: '1rem 0' }}>
          {learningFeedback === 'correct' ? current.word : '___'}
        </div>
        <div aria-label={`Your blend: ${learningAnswer || 'empty'}`} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          {[0, 1, 2].map((slot) => <span key={slot} style={{ minWidth: 64, minHeight: 64, display: 'grid', placeItems: 'center', borderRadius: 18, background: 'white', color: '#1d4ed8', border: '3px solid #93c5fd', fontSize: '2.5rem', fontWeight: 900 }}>{learningAnswer[slot] || ''}</span>)}
        </div>
        <p style={{ color: '#2563eb', fontSize: '1.4rem', fontWeight: 900 }}>Join the sounds, then build the word</p>
        <div aria-label="Choose the letters in order" style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {learningLetters.map((letter, tileIndex) => (
            <button
              key={`${letter}-${tileIndex}`}
              type="button"
              data-testid="learning-letter"
              data-letter={letter}
              aria-label={`Choose letter ${letter}`}
              aria-pressed={selectedLearningTiles.includes(tileIndex)}
              disabled={isPlaying || learningFeedback !== 'idle' || selectedLearningTiles.includes(tileIndex)}
              onClick={() => handleLearningTile(tileIndex)}
              style={{ minWidth: 64, minHeight: 64, borderRadius: 18, background: selectedLearningTiles.includes(tileIndex) ? '#bfdbfe' : 'white', color: '#1d4ed8', border: '3px solid #60a5fa', fontSize: '2.5rem', fontWeight: 900, cursor: 'pointer' }}
            >
              {letter}
            </button>
          ))}
        </div>
        {learningFeedback === 'correct' && <p role="status" style={{ color: '#15803d', fontWeight: 900 }}>Great blending!</p>}
        {learningFeedback === 'retry' && <p role="status" style={{ color: '#7c3aed', fontWeight: 900 }}>Listen once more and try again 🌟</p>}
        <button aria-label="Play blend" className="btn-primary" onClick={() => void playCurrent()} disabled={isPlaying} aria-busy={isPlaying} style={{ width: 104, height: 104, borderRadius: '50%', justifyContent: 'center', padding: 0 }}>
          <Volume2 size={52} />
        </button>
        {audioFailed && <p role="alert" style={{ color: '#b45309', fontWeight: 800 }}>Lesson audio is not installed correctly. Please check the blending audio pack.</p>}
        <button className="btn-primary" onClick={moveToNextLearningWord} disabled={isPlaying || learningFeedback !== 'correct'} style={{ width: 'min(400px, 100%)', justifyContent: 'center', margin: '1.25rem 0' }}>
          {index === queue.length - 1 ? 'Start test' : 'Next word'}
        </button>
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
      <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: 'clamp(2rem, 7vw, 3rem)' }}>{learningMode ? 'Test Your Blending' : 'Simple Word'}</h1>
      <p style={{ color: '#475569', fontSize: '1.15rem', fontWeight: 700 }}>{learningMode ? 'Listen, blend, and spell the word' : 'Listen and spell the word'}</p>
      <span data-testid="test-word" data-word={current.word} aria-hidden="true" style={{ display: 'none' }} />

      <button aria-label="Play word" className="btn-primary" onClick={() => void playCurrent()} aria-busy={isPlaying} style={{ width: 104, height: 104, borderRadius: '50%', justifyContent: 'center', padding: 0 }}>
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
