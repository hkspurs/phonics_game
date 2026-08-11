import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeDashboard from './HomeDashboard';
import { useGameStore } from '../store/gameStore';

vi.mock('../audio/AudioEngine', () => ({
  audioEngine: { playUI: vi.fn() },
}));
vi.mock('../components/ParentGateModal', () => ({ default: () => null }));

describe('HomeDashboard CVC navigation', () => {
  beforeEach(() => useGameStore.setState(useGameStore.getInitialState()));

  it('keeps /blending as the primary CVC entry and labels legacy routes explicitly', () => {
    render(
      <MemoryRouter initialEntries={['/phonics']}>
        <Routes>
          <Route path="/phonics" element={<HomeDashboard />} />
          <Route path="/blending" element={<div data-testid="blending">Blending world</div>} />
          <Route path="/simple-words" element={<div data-testid="simple-words">Simple words</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('region', { name: 'Quick practice' })).not.toBeInTheDocument();
    expect(screen.getByText('Legacy compatibility')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn to Blend' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simple Word' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open blending world/i }));
    expect(screen.getByTestId('blending')).toBeInTheDocument();
  });
});
