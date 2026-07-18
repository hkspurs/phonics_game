# Simple Word Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ('- [ ]') syntax for tracking.

**Goal:** Add a standalone 16-question Simple Word spelling game using the final teacher-recorded word from each video segment.

**Architecture:** Keep the existing AEIOU game untouched. Add 16 reviewed target-audio entries, expose them through one small word/queue module, and add one local-state React screen that reuses the existing AudioEngine, VirtualKeyboard, mascot, routes, and Phonics home.

**Tech Stack:** React 18, React Router 6, Vitest, Testing Library, Playwright, Web Audio API, FFmpeg, existing vanilla CSS.

## Global Constraints

- The words are exactly BUS, COT, DIG, FOG, GOD, HIT, JET, KEN, LIP, MET, NUT, POT, RED, SUM, TUG, and VET.
- Use only the final complete-word utterance, excluding split phonemes.
- Shuffle once per session; all 16 words appear exactly once with no duplicate or omission.
- The child enters exactly three letters with the fixed A-Z VirtualKeyboard; there are no answer choices.
- A wrong answer clears, replays, and stays on the same word without revealing letters.
- Preserve all existing AEIOU routes, curriculum, state, rewards, maps, and progress.
- Target audio must be teacher-recorded, marked QA pass, and must never fall back to speech synthesis.
- Keep Vite/GitHub Pages paths relative and add no dependency.
- Do not add persistent Simple Word mastery or rewards in this version.

---

### Task 1: Extract and register the teacher recordings

**Files:**
- Create: public/assets/simple-words/01_bus.mp3 through public/assets/simple-words/16_vet.mp3
- Modify: data/audio_manifest.json
- Create: src/game/simpleWords.test.js

**Interfaces:**
- Consumes: videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov
- Produces: audio IDs WORD_BUS_01 through WORD_VET_01, each playable by audioEngine.playAudioById(id)

- [ ] **Step 1: Write the failing audio-corpus test**

Create src/game/simpleWords.test.js:

~~~js
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import audioManifest from '../../data/audio_manifest.json';

const EXPECTED_WORDS = [
  'BUS', 'COT', 'DIG', 'FOG',
  'GOD', 'HIT', 'JET', 'KEN',
  'LIP', 'MET', 'NUT', 'POT',
  'RED', 'SUM', 'TUG', 'VET',
];

describe('Simple Word audio corpus', () => {
  it('contains all 16 reviewed teacher clips in teaching order', () => {
    const clips = Object.values(audioManifest)
      .filter((item) => item.curriculum === 'simple_word')
      .sort((a, b) => a.sequence - b.sequence);

    expect(clips.map((item) => item.expectedText)).toEqual(EXPECTED_WORDS);
    expect(new Set(clips.map((item) => item.id)).size).toBe(16);

    for (const clip of clips) {
      expect(clip.type).toBe('phonics_target');
      expect(clip.generatedBy).toBe('teacher_recording');
      expect(clip.qaStatus).toBe('pass');
      expect(clip.sourceFile).toBe('videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov');
      expect(clip.sourceEndMs).toBeGreaterThan(clip.sourceStartMs);
      expect(existsSync(resolve('public', clip.file))).toBe(true);
    }
  });
});
~~~

- [ ] **Step 2: Run the test to prove the corpus is absent**

Run: npm test -- src/game/simpleWords.test.js

Expected: FAIL because the filtered clips array is empty.

- [ ] **Step 3: Extract the 16 exact MP3 clips**

Run mkdir -p public/assets/simple-words, then run these commands from the repository root:

~~~bash
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 6.18 -t 0.68 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/01_bus.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 9.85 -t 0.65 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/02_cot.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 13.68 -t 1.04 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/03_dig.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 17.35 -t 0.79 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/04_fog.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 21.40 -t 1.07 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/05_god.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 25.23 -t 0.61 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/06_hit.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 29.06 -t 0.60 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/07_jet.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 32.45 -t 1.10 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/08_ken.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 36.21 -t 0.95 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/09_lip.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 39.87 -t 1.07 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/10_met.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 43.68 -t 1.07 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/11_nut.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 47.98 -t 0.63 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/12_pot.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 51.88 -t 0.73 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/13_red.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 55.40 -t 1.08 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/14_sum.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 59.52 -t 0.59 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/15_tug.mp3
ffmpeg -y -hide_banner -loglevel error -i videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov -ss 63.22 -t 0.86 -vn -ac 1 -ar 44100 -codec:a libmp3lame -b:a 192k public/assets/simple-words/16_vet.mp3
~~~

- [ ] **Step 4: Append exact manifest metadata**

Append these entries to data/audio_manifest.json. Every object also has language 'en', type 'phonics_target', curriculum 'simple_word', generatedBy 'teacher_recording', qaStatus 'pass', sourceFile 'videos/a8be0b54-8ab9-4f84-aec3-02b0beaa561e.mov', and qaNotes ['Final blended word extracted from teacher video; split phonemes excluded.'].

| id | file | expectedText | sequence | sourceStartMs | sourceEndMs |
|---|---|---:|---:|---:|---:|
| WORD_BUS_01 | assets/simple-words/01_bus.mp3 | BUS | 1 | 6180 | 6860 |
| WORD_COT_01 | assets/simple-words/02_cot.mp3 | COT | 2 | 9850 | 10500 |
| WORD_DIG_01 | assets/simple-words/03_dig.mp3 | DIG | 3 | 13680 | 14720 |
| WORD_FOG_01 | assets/simple-words/04_fog.mp3 | FOG | 4 | 17350 | 18140 |
| WORD_GOD_01 | assets/simple-words/05_god.mp3 | GOD | 5 | 21400 | 22470 |
| WORD_HIT_01 | assets/simple-words/06_hit.mp3 | HIT | 6 | 25230 | 25840 |
| WORD_JET_01 | assets/simple-words/07_jet.mp3 | JET | 7 | 29060 | 29660 |
| WORD_KEN_01 | assets/simple-words/08_ken.mp3 | KEN | 8 | 32450 | 33550 |
| WORD_LIP_01 | assets/simple-words/09_lip.mp3 | LIP | 9 | 36210 | 37160 |
| WORD_MET_01 | assets/simple-words/10_met.mp3 | MET | 10 | 39870 | 40940 |
| WORD_NUT_01 | assets/simple-words/11_nut.mp3 | NUT | 11 | 43680 | 44750 |
| WORD_POT_01 | assets/simple-words/12_pot.mp3 | POT | 12 | 47980 | 48610 |
| WORD_RED_01 | assets/simple-words/13_red.mp3 | RED | 13 | 51880 | 52610 |
| WORD_SUM_01 | assets/simple-words/14_sum.mp3 | SUM | 14 | 55400 | 56480 |
| WORD_TUG_01 | assets/simple-words/15_tug.mp3 | TUG | 15 | 59520 | 60110 |
| WORD_VET_01 | assets/simple-words/16_vet.mp3 | VET | 16 | 63220 | 64080 |

- [ ] **Step 5: Run focused validation**

Run: node scripts/validate-audio-manifest.cjs

Expected: Audio manifest validation passed with no missing Simple Word file warnings.

Run: npm test -- src/game/simpleWords.test.js

Expected: 1 test passes.

- [ ] **Step 6: Commit the audio corpus**

~~~bash
git add data/audio_manifest.json public/assets/simple-words src/game/simpleWords.test.js
git commit -m "feat: add teacher simple word audio"
~~~

---

### Task 2: Build the unique randomized word queue

**Files:**
- Create: src/game/simpleWords.js
- Modify: src/game/simpleWords.test.js

**Interfaces:**
- Produces: SIMPLE_WORDS as Array<{ id: string, word: string }>
- Produces: shuffleWords(words, random = Math.random) returning a new shuffled array without mutating words

- [ ] **Step 1: Add failing queue tests**

Add these imports and test block to src/game/simpleWords.test.js:

~~~js
import { SIMPLE_WORDS, shuffleWords } from './simpleWords';

describe('Simple Word queue', () => {
  it('loads all words and shuffles a copy deterministically', () => {
    expect(SIMPLE_WORDS.map((item) => item.word)).toEqual(EXPECTED_WORDS);

    const original = SIMPLE_WORDS.slice(0, 4);
    const random = () => 0;
    const shuffled = shuffleWords(original, random);

    expect(shuffled.map((item) => item.word)).toEqual(['COT', 'DIG', 'FOG', 'BUS']);
    expect(original.map((item) => item.word)).toEqual(['BUS', 'COT', 'DIG', 'FOG']);
    expect(new Set(shuffleWords(SIMPLE_WORDS).map((item) => item.id)).size).toBe(16);
  });
});
~~~

- [ ] **Step 2: Run the test to prove the module is absent**

Run: npm test -- src/game/simpleWords.test.js

Expected: FAIL because ./simpleWords does not exist.

- [ ] **Step 3: Implement the minimal corpus reader and Fisher-Yates shuffle**

Create src/game/simpleWords.js:

~~~js
import audioManifest from '../../data/audio_manifest.json';

export const SIMPLE_WORDS = Object.values(audioManifest)
  .filter((item) => item.curriculum === 'simple_word')
  .sort((a, b) => a.sequence - b.sequence)
  .map((item) => ({ id: item.id, word: item.expectedText }));

export function shuffleWords(words, random = Math.random) {
  const shuffled = [...words];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
~~~

- [ ] **Step 4: Run the queue tests**

Run: npm test -- src/game/simpleWords.test.js

Expected: 2 tests pass.

- [ ] **Step 5: Commit the queue**

~~~bash
git add src/game/simpleWords.js src/game/simpleWords.test.js
git commit -m "feat: add randomized simple word queue"
~~~

---

### Task 3: Add the typed-answer game and navigation

**Files:**
- Create: src/screens/SimpleWords.jsx
- Create: src/screens/SimpleWords.test.jsx
- Modify: src/App.jsx
- Modify: src/screens/HomeDashboard.jsx
- Modify: src/i18n/translations.js
- Create: tests/simple-words.spec.js

**Interfaces:**
- Consumes: SIMPLE_WORDS and shuffleWords from src/game/simpleWords.js
- Consumes: audioEngine.playAudioById(id), audioEngine.playUI(type), audioEngine.stop()
- Consumes: VirtualKeyboard({ onKeyPress, disabled })
- Produces: /simple-words route reachable from the Phonics home

- [ ] **Step 1: Write the failing component test**

Create src/screens/SimpleWords.test.jsx:

~~~jsx
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SimpleWords from './SimpleWords';
import { audioEngine } from '../audio/AudioEngine';

vi.mock('../audio/AudioEngine', () => ({
  audioEngine: {
    playAudioById: vi.fn(() => Promise.resolve(true)),
    playUI: vi.fn(),
    stop: vi.fn(),
  },
}));

const WORDS = [
  'BUS', 'COT', 'DIG', 'FOG',
  'GOD', 'HIT', 'JET', 'KEN',
  'LIP', 'MET', 'NUT', 'POT',
  'RED', 'SUM', 'TUG', 'VET',
];

describe('SimpleWords', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries a wrong spelling and completes all 16 typed words', async () => {
    render(
      <MemoryRouter>
        <SimpleWords />
      </MemoryRouter>,
    );

    await waitFor(() => expect(audioEngine.playAudioById).toHaveBeenCalledWith('WORD_BUS_01'));
    expect(screen.getByText('1 / 16')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit / 確定' })).toBeDisabled();

    for (const letter of 'ZZZ') {
      fireEvent.click(screen.getByRole('button', { name: letter }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
    expect(screen.getByText('差少少，再聽一次 🌟')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByLabelText('Current answer: empty')).toBeInTheDocument();
    expect(screen.getByText('1 / 16')).toBeInTheDocument();

    for (let index = 0; index < WORDS.length; index += 1) {
      for (const letter of WORDS[index]) {
        fireEvent.click(screen.getByRole('button', { name: letter }));
      }
      fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
      await act(async () => {
        vi.advanceTimersByTime(700);
      });
    }

    expect(screen.getByRole('heading', { name: 'Simple Word Complete!' })).toBeInTheDocument();
    expect(screen.getByText('First try: 15 / 16')).toBeInTheDocument();
  });
});
~~~

- [ ] **Step 2: Write the failing browser route test**

Create tests/simple-words.spec.js:

~~~js
import { expect, test } from '@playwright/test';

test('Simple Word is reachable and accepts a three-letter spelling', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.999999;
  });
  await page.goto('/#/phonics');

  await page.getByRole('button', { name: 'Simple Word' }).click();
  await expect(page).toHaveURL(/simple-words/);
  await expect(page.getByText('1 / 16')).toBeVisible();

  for (const letter of 'BUS') {
    await page.getByRole('button', { name: letter, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Submit / 確定' }).click();
  await expect(page.getByText('2 / 16')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Play word' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
~~~

- [ ] **Step 3: Run both tests to prove the screen and route are absent**

Run: npm test -- src/screens/SimpleWords.test.jsx

Expected: FAIL because ./SimpleWords does not exist.

Run: npx playwright test tests/simple-words.spec.js

Expected: FAIL because the Simple Word button is absent.

- [ ] **Step 4: Implement src/screens/SimpleWords.jsx**

Implement one local-state screen with these exact behaviors:

~~~jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { audioEngine } from '../audio/AudioEngine';
import MascotRabbit from '../components/MascotRabbit';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { SIMPLE_WORDS, shuffleWords } from '../game/simpleWords';

export default function SimpleWords() {
  const navigate = useNavigate();
  const timerRef = useRef();
  const [queue, setQueue] = useState(() => shuffleWords(SIMPLE_WORDS));
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState('idle');
  const [attempted, setAttempted] = useState(false);
  const [firstAttemptHits, setFirstAttemptHits] = useState(0);
  const [complete, setComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const current = queue[index];

  const playCurrent = useCallback(async () => {
    if (!current) return;
    setIsPlaying(true);
    setAudioFailed(false);
    const played = await audioEngine.playAudioById(current.id);
    setAudioFailed(!played);
    setIsPlaying(false);
  }, [current]);

  useEffect(() => {
    if (!complete) playCurrent();
    return () => audioEngine.stop();
  }, [complete, playCurrent]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const restart = () => {
    clearTimeout(timerRef.current);
    audioEngine.stop();
    setQueue(shuffleWords(SIMPLE_WORDS));
    setIndex(0);
    setTyped('');
    setFeedback('idle');
    setAttempted(false);
    setFirstAttemptHits(0);
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
      if (!attempted) setFirstAttemptHits((hits) => hits + 1);
      setFeedback('correct');
      audioEngine.playUI('correct');
      timerRef.current = setTimeout(() => {
        setTyped('');
        setFeedback('idle');
        setAttempted(false);
        if (index === queue.length - 1) {
          setComplete(true);
        } else {
          setIndex((value) => value + 1);
        }
      }, 650);
      return;
    }

    setAttempted(true);
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={restart}><RotateCcw /> Play Again</button>
          <button className="btn-secondary" onClick={() => navigate('/phonics')}><ArrowLeft /> Back to Phonics</button>
        </div>
      </div>
    );
  }

  const disabled = feedback !== 'idle' || isPlaying;

  return (
    <div className="screen-container" style={{ overflowY: 'auto', alignItems: 'center', background: 'linear-gradient(180deg, #dbeafe, #ecfeff)', padding: 'max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom))' }}>
      <header style={{ width: '100%', maxWidth: 760, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-secondary" onClick={() => navigate('/phonics')}><ArrowLeft /> Back</button>
        <strong style={{ color: '#1e3a8a', fontSize: '1.25rem' }}>{index + 1} / {queue.length}</strong>
      </header>

      <div style={{ width: '100%', maxWidth: 760, height: 14, borderRadius: 999, background: '#bfdbfe', overflow: 'hidden', marginTop: '1rem' }}>
        <div style={{ width: ((index + 1) / queue.length * 100) + '%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #22c55e)', transition: 'width 0.3s' }} />
      </div>

      <MascotRabbit isListening={isPlaying} feedbackState={feedback === 'correct' ? 'correct' : null} style={{ width: 150, height: 150, marginTop: '0.5rem' }} />
      <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: 'clamp(2rem, 7vw, 3rem)' }}>Simple Word</h1>
      <p style={{ color: '#475569', fontSize: '1.15rem', fontWeight: 700 }}>Listen and spell the word</p>

      <button
        aria-label="Play word"
        className="btn-primary"
        onClick={playCurrent}
        disabled={isPlaying}
        style={{ width: 104, height: 104, borderRadius: '50%', justifyContent: 'center', padding: 0 }}
      >
        <Volume2 size={52} />
      </button>

      {audioFailed && <p role="status" style={{ color: '#b45309', fontWeight: 800 }}>Tap the speaker to try again.</p>}

      <div aria-label={'Current answer: ' + (typed || 'empty')} style={{ display: 'flex', gap: '0.75rem', margin: '1.25rem 0' }}>
        {[0, 1, 2].map((slot) => (
          <div key={slot} className={feedback === 'retry' ? 'wobble-wrong' : ''} style={{ width: 'clamp(64px, 20vw, 92px)', height: 'clamp(76px, 23vw, 108px)', borderRadius: 22, border: '4px solid #7dd3fc', background: 'white', boxShadow: '0 8px 0 #38bdf8', display: 'grid', placeItems: 'center', color: '#1e3a8a', fontSize: 'clamp(2.75rem, 12vw, 4.5rem)', fontWeight: 900 }}>
            {typed[slot] || ''}
          </div>
        ))}
      </div>

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
~~~

- [ ] **Step 5: Wire the route, home entry, and copy**

In src/App.jsx, import SimpleWords from './screens/SimpleWords' and add:

~~~jsx
<Route path="/simple-words" element={<SimpleWords />} />
~~~

In src/screens/HomeDashboard.jsx, import SpellCheck from lucide-react and add this unlocked secondary action immediately after Sound Map:

~~~jsx
<button className="btn-secondary" onClick={() => { audioEngine.playUI('pop'); navigate('/simple-words'); }}>
  <SpellCheck size={24} /> {t('simpleWord')}
</button>
~~~

In both language objects in src/i18n/translations.js add:

~~~js
simpleWord: 'Simple Word',
~~~

- [ ] **Step 6: Run the focused component and browser tests**

Run: npm test -- src/screens/SimpleWords.test.jsx src/game/simpleWords.test.js

Expected: 3 tests pass.

Run: npx playwright test tests/simple-words.spec.js

Expected: 1 test passes on Chromium.

- [ ] **Step 7: Commit the integrated game**

~~~bash
git add src/App.jsx src/screens/HomeDashboard.jsx src/i18n/translations.js src/screens/SimpleWords.jsx src/screens/SimpleWords.test.jsx tests/simple-words.spec.js
git commit -m "feat: add typed simple word game"
~~~

---

### Task 4: Prove the complete feature and the preserved game

**Files:**
- Verify only; no new production file

**Interfaces:**
- Verifies the complete feature against the design and all existing behavior against the repository test suite

- [ ] **Step 1: Validate audio metadata and files**

Run: node scripts/validate-audio-manifest.cjs

Expected: Audio manifest validation passed with zero errors and no missing Simple Word warnings.

Run:

~~~bash
for file in public/assets/simple-words/*.mp3; do
  ffprobe -v error -show_entries format=filename,duration -of csv=p=0 "$file"
done
~~~

Expected: 16 rows, each duration greater than 0.5 seconds and less than 1.7 seconds.

- [ ] **Step 2: Run all unit tests**

Run: npm test

Expected: all Vitest suites pass.

- [ ] **Step 3: Run the production build**

Run: npm run build

Expected: Vite exits 0 and emits dist assets without unresolved imports.

- [ ] **Step 4: Run the focused browser test**

Run: npx playwright test tests/simple-words.spec.js

Expected: 1 Chromium test passes at desktop and mobile viewport sizes.

- [ ] **Step 5: Inspect the final scope**

Run: git status --short

Expected: clean worktree.

Run: git diff HEAD~3 -- src/game/QuestionEngine.js src/store/gameStore.js src/screens/DailyChallenge.jsx

Expected: no output, proving the existing AEIOU engine, state, and challenge were not edited.
