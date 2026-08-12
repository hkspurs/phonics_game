import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChineseSpaceGame from './ChineseSpaceGame';

const mocks = vi.hoisted(() => ({ games: [], audioStop: vi.fn() }));

vi.mock('../audio/AudioEngine', () => ({
  audioEngine: {
    play: vi.fn(() => Promise.resolve(true)),
    playUI: vi.fn(),
    stop: mocks.audioStop,
  },
}));

vi.mock('phaser', () => ({
  default: {
    AUTO: 0,
    Scale: { RESIZE: 1, CENTER_BOTH: 2 },
    Game: vi.fn(function FakeGame(config) {
      this.config = config;
      this.destroy = vi.fn();
      mocks.games.push(this);
    }),
  },
}));

vi.mock('../chinese-space/ChineseSpaceScene', () => ({
  createChineseSpaceScene: vi.fn((_Phaser, callbacks) => {
    callbacks.onUiStateChange?.({ screen: 'home', phase: 'home', hp: 3, questionIndex: 0, questionCount: 0, countdownMs: 8000 });
    return class FakeScene {};
  }),
}));

describe('ChineseSpaceGame', () => {
  beforeEach(() => {
    mocks.games.length = 0;
    mocks.audioStop.mockClear();
  });

  afterEach(() => cleanup());

  it('mounts one Phaser game and exposes a live traditional-Chinese status', async () => {
    render(
      <MemoryRouter initialEntries={['/chinese-space']}>
        <Routes><Route path="/chinese-space" element={<ChineseSpaceGame />} /></Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('chinese-space-canvas')).toBeInTheDocument());
    expect(mocks.games).toHaveLength(1);
    expect(screen.getByTestId('chinese-space-status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByTestId('chinese-space-status')).toHaveTextContent('中文字');
  });

  it('destroys Phaser and stops word audio on unmount', async () => {
    const view = render(
      <MemoryRouter initialEntries={['/chinese-space']}>
        <Routes><Route path="/chinese-space" element={<ChineseSpaceGame />} /></Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(mocks.games).toHaveLength(1));

    view.unmount();

    expect(mocks.games[0].destroy).toHaveBeenCalledWith(true);
    expect(mocks.audioStop).toHaveBeenCalled();
  });
});
