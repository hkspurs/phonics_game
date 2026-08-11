import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PhaserAdventureWorld from './PhaserAdventureWorld';

vi.mock('phaser', () => ({ default: {} }));

describe('PhaserAdventureWorld', () => {
  it('shows the current landmark and caption before Phaser is ready', () => {
    render(<PhaserAdventureWorld progress={0} total={5} word="CAT" />);

    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('Keep going! CAT')).toBeInTheDocument();
  });
});
