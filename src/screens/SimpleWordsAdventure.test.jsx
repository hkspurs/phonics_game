import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SimpleWords from './SimpleWords';
import { useGameStore } from '../store/gameStore';

vi.mock('../components/PhaserAdventureWorld', () => ({
  default: ({ progress, total }) => <div data-testid="adventure-world">{progress}/{total}</div>,
}));
vi.mock('../audio/AudioEngine', () => ({
  audioEngine: { playAudioById: vi.fn(() => Promise.resolve(true)), playUI: vi.fn(), stop: vi.fn() },
}));

describe('SimpleWords adventure session', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
  });

  afterEach(() => vi.restoreAllMocks());

  it('offers a sixteen-question CVC level while preserving the adventure route', async () => {
    render(<MemoryRouter initialEntries={['/simple-words?mode=learn&adventure=1&sessionSize=5']}><SimpleWords /></MemoryRouter>);
    await act(async () => { await Promise.resolve(); });
    fireEvent.click(screen.getByRole('button', { name: /Level 1/i }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole('heading', { name: 'Learn to Blend' })).toBeInTheDocument();
    expect(screen.getByText('1 / 16')).toBeInTheDocument();
    expect(screen.getByTestId('adventure-world')).toHaveTextContent('0/16');
  });
});
