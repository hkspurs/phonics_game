import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

describe('SimpleWords', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    vi.clearAllMocks();
    audioEngine.playAudioById.mockResolvedValue(true);
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

    expect(audioEngine.playAudioById).toHaveBeenCalledWith('WORD_BUS_01');
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
    expect(audioEngine.playAudioById).toHaveBeenCalledWith('WORD_BUS_01');

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

    for (const word of WORDS) {
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

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));
      await Promise.resolve();
    });
    expect(screen.getByText('1 / 16')).toBeInTheDocument();
    expect(screen.getByLabelText('Current answer: empty')).toBeInTheDocument();
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
});
