import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SimpleWords from './SimpleWords';
import { audioEngine } from '../audio/AudioEngine';
import { SIMPLE_WORDS } from '../game/simpleWords';
import { getBlendAudioId } from '../game/simpleWordLearning';
import { useGameStore } from '../store/gameStore';

vi.mock('../audio/AudioEngine', () => ({
  audioEngine: {
    playAudioById: vi.fn(() => Promise.resolve(true)),
    playUI: vi.fn(),
    stop: vi.fn(),
  },
}));

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function settleLearningAudio() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function assembleLearningWord() {
  await settleLearningAudio();
  const word = screen.getByTestId('learning-word').getAttribute('data-word');
  for (const letter of word) {
    const tile = screen.getAllByTestId('learning-letter').find((candidate) => (
      candidate.getAttribute('data-letter') === letter && !candidate.disabled
    ));
    fireEvent.click(tile);
  }
  expect(screen.getByText('Great blending!')).toBeInTheDocument();
  return word;
}

describe('SimpleWords', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    vi.clearAllMocks();
    audioEngine.playAudioById.mockResolvedValue(true);
    useGameStore.setState(useGameStore.getInitialState());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries a wrong spelling and completes all 16 typed words', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SimpleWords />
      </MemoryRouter>,
    );

    expect(audioEngine.playAudioById).toHaveBeenCalledWith(SIMPLE_WORDS[0].id);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('1 / 16')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit / 確定' })).toBeDisabled();

    audioEngine.playAudioById.mockClear();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play word' }));
      await Promise.resolve();
    });
    expect(audioEngine.playAudioById).toHaveBeenCalledWith(SIMPLE_WORDS[0].id);

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

    const remainingWords = [
      'BUS', 'COT', 'DIG', 'FOG',
      'GOD', 'HIT', 'JET', 'KEN',
      'LIP', 'MET', 'NUT', 'POT',
      'RED', 'SUM', 'TUG', 'VET',
    ];
    for (const word of remainingWords) {
      for (const letter of word) {
        fireEvent.click(screen.getByRole('button', { name: letter }));
      }
      fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
      await act(async () => {
        vi.advanceTimersByTime(700);
      });
    }

    expect(screen.getByRole('heading', { name: 'Simple Word Complete!' })).toBeInTheDocument();
    expect(screen.getByText('First try: 15 / 16')).toBeInTheDocument();
    expect(screen.getByText('Earned: +15 💎')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
      await Promise.resolve();
    });
    expect(screen.getByText('1 / 16')).toBeInTheDocument();
    expect(screen.getByLabelText('Current answer: empty')).toBeInTheDocument();
  });

  it('progresses from blanks to a partial hint to the full word', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SimpleWords />
      </MemoryRouter>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    for (const letter of 'ZZZ') fireEvent.click(screen.getByRole('button', { name: letter }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
    await act(async () => vi.advanceTimersByTime(500));
    expect(screen.getByLabelText('Hint: _ _ _')).toBeInTheDocument();

    for (const letter of 'ZZZ') fireEvent.click(screen.getByRole('button', { name: letter }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
    await act(async () => vi.advanceTimersByTime(500));
    expect(screen.getByLabelText('Hint: BU _')).toBeInTheDocument();

    for (const letter of 'ZZZ') fireEvent.click(screen.getByRole('button', { name: letter }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
    await act(async () => vi.advanceTimersByTime(500));
    expect(screen.getByLabelText('Hint: BUS')).toBeInTheDocument();

    for (const letter of 'BUS') fireEvent.click(screen.getByRole('button', { name: letter }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
    await act(async () => vi.advanceTimersByTime(700));
    expect(screen.getByText('2 / 16')).toBeInTheDocument();
  });

  it('keeps replay available without enabling input for a stale audio request', async () => {
    const firstPlay = deferred();
    const replay = deferred();
    audioEngine.playAudioById
      .mockReturnValueOnce(firstPlay.promise)
      .mockReturnValueOnce(replay.promise);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SimpleWords />
      </MemoryRouter>,
    );

    const playButton = screen.getByRole('button', { name: 'Play word' });
    expect(playButton).toBeEnabled();
    fireEvent.click(playButton);
    expect(audioEngine.playAudioById).toHaveBeenCalledTimes(2);

    await act(async () => firstPlay.resolve(true));
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();

    await act(async () => replay.resolve(true));
    expect(screen.getByRole('button', { name: 'A' })).toBeEnabled();
  });

  it('teaches a continuous blend before entering the spelling test', async () => {
    render(
      <MemoryRouter
        initialEntries={['/simple-words?mode=learn']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SimpleWords />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Learn to Blend' })).toBeInTheDocument();
    const word = screen.getByTestId('learning-word').getAttribute('data-word');
    expect(word).toMatch(/^[A-Z]{3}$/);
    expect(audioEngine.playAudioById).toHaveBeenCalledWith(getBlendAudioId(word));
    expect(screen.getByText(/Join the sounds/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next word' })).toBeDisabled();
    await settleLearningAudio();
    expect(audioEngine.playAudioById).toHaveBeenNthCalledWith(2, SIMPLE_WORDS.find((item) => item.word === word).id);

    const learnedWords = new Set();
    for (let index = 0; index < 16; index += 1) {
      learnedWords.add(await assembleLearningWord());
      fireEvent.click(screen.getByRole('button', { name: index === 15 ? 'Start test' : 'Next word' }));
    }

    await settleLearningAudio();
    expect(screen.getByRole('heading', { name: 'Test Your Blending' })).toBeInTheDocument();
    expect(screen.getByText('1 / 16')).toBeInTheDocument();
    expect(learnedWords.has(screen.getByTestId('test-word').getAttribute('data-word'))).toBe(false);
    expect(screen.queryByText(/First try:/)).not.toBeInTheDocument();
  });

  it('does not advance until the child assembles the letters in order', async () => {
    render(
      <MemoryRouter
        initialEntries={['/simple-words?mode=learn']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SimpleWords />
      </MemoryRouter>,
    );

    await settleLearningAudio();
    const target = screen.getByTestId('learning-word').getAttribute('data-word');
    const tiles = screen.getAllByTestId('learning-letter');
    let wrongOrder = [...tiles].reverse();
    if (wrongOrder.map((tile) => tile.getAttribute('data-letter')).join('') === target) {
      wrongOrder = [wrongOrder[1], wrongOrder[0], wrongOrder[2]];
    }
    wrongOrder.forEach((tile) => fireEvent.click(tile));

    expect(screen.getByText('Listen once more and try again 🌟')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next word' })).toBeDisabled();
    await act(async () => vi.advanceTimersByTime(500));
    expect(screen.getByLabelText('Your blend: empty')).toBeInTheDocument();
  });

  it('keeps a test word on screen after a wrong spelling', async () => {
    render(
      <MemoryRouter
        initialEntries={['/simple-words?mode=learn']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SimpleWords />
      </MemoryRouter>,
    );

    const learnedWords = new Set();
    for (let index = 0; index < 16; index += 1) {
      learnedWords.add(await assembleLearningWord());
      fireEvent.click(screen.getByRole('button', { name: index === 15 ? 'Start test' : 'Next word' }));
    }

    await settleLearningAudio();
    const firstWord = screen.getByTestId('test-word').getAttribute('data-word');
    expect(learnedWords.has(firstWord)).toBe(false);
    for (const letter of 'ZZZ') fireEvent.click(screen.getByRole('button', { name: letter }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit / 確定' }));
    expect(screen.getByTestId('test-word')).toHaveAttribute('data-word', firstWord);
    expect(screen.getByText('差少少，再聽一次 🌟')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('1 / 16')).toBeInTheDocument();
  });
});
