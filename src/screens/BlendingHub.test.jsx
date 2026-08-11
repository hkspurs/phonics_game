import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BlendingHub from './BlendingHub';

vi.mock('../components/PhaserAdventureWorld', () => ({
  default: () => <div data-testid="adventure-world">Rabbit Adventure world</div>,
}));

describe('BlendingHub', () => {
  it('keeps blending and simple words together under their own learning world', () => {
    render(<MemoryRouter initialEntries={['/blending']}><BlendingHub /></MemoryRouter>);
    expect(screen.getAllByRole('heading', { name: 'Learn to Blend' })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Simple Word' })).toBeInTheDocument();
    expect(screen.getByTestId('adventure-world')).toBeInTheDocument();
    expect(screen.queryByText('英語拼音森林')).not.toBeInTheDocument();
  });

  it('opens a short adventure session without changing the legacy route', () => {
    render(
      <MemoryRouter initialEntries={['/blending']}>
        <Routes>
          <Route path="/blending" element={<BlendingHub />} />
          <Route path="/simple-words" element={<div data-testid="simple-words">Simple Words</div>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Start learning/i }));
    expect(screen.getByTestId('simple-words')).toBeInTheDocument();
  });
});
