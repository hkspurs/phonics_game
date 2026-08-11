import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PhaserAdventureWorld from './PhaserAdventureWorld';

vi.mock('phaser', () => ({ default: {} }));

describe('PhaserAdventureWorld', () => {
  it('keeps the answer hidden while the child is still trying', () => {
    render(<PhaserAdventureWorld progress={0} total={5} word="CAT" />);

    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('Keep going!')).toBeInTheDocument();
    expect(screen.queryByText('Keep going! CAT')).not.toBeInTheDocument();
  });

  it('shows the answer only after a correct response', () => {
    render(<PhaserAdventureWorld progress={0} total={5} status="correct" word="CAT" />);

    expect(screen.getByText('Great work! CAT')).toBeInTheDocument();
  });
});
