import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ExperienceFrame from './ExperienceFrame';
import WorldProgress from './WorldProgress';
import { useGameStore } from '../store/gameStore';

vi.mock('../audio/AudioEngine', () => ({
  audioEngine: { playUI: vi.fn() },
}));

describe('experience frame', () => {
  it('opens the parent gate before navigating from unauthenticated settings', () => {
    useGameStore.setState(useGameStore.getInitialState());
    render(
      <MemoryRouter initialEntries={['/blending']}>
        <ExperienceFrame world="World" title="Title">
          <p>Content</p>
        </ExperienceFrame>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'For Parents Only' })).toBeInTheDocument();
  });

  it('still navigates authenticated settings to the parent dashboard', () => {
    useGameStore.setState({ ...useGameStore.getInitialState(), isParentAuthenticated: true });
    render(
      <MemoryRouter initialEntries={['/blending']}>
        <Routes>
          <Route path="/blending" element={<ExperienceFrame world="World" title="Title"><p>Content</p></ExperienceFrame>} />
          <Route path="/parent" element={<div data-testid="parent-dashboard">Parent dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByTestId('parent-dashboard')).toBeInTheDocument();
  });

  it('shows the world context, persisted currency and one child content area', () => {
    render(
      <MemoryRouter initialEntries={['/blending']}>
        <ExperienceFrame
          world="學習拼音併音"
          title="Rabbit Adventure"
          subtitle="Listen, join and build"
          backTo="/"
        >
          <div data-testid="child-content">Child content</div>
        </ExperienceFrame>
      </MemoryRouter>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('學習拼音併音');
    expect(screen.getByRole('heading', { name: 'Rabbit Adventure' })).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByTitle('Stars')).toBeInTheDocument();
    expect(screen.getByTitle('Diamonds')).toBeInTheDocument();
  });

  it('navigates to the supplied back destination', () => {
    render(
      <MemoryRouter initialEntries={['/start']}>
        <Routes>
          <Route
            path="/start"
            element={(
              <ExperienceFrame world="World" title="Title" backTo="/phonics">
                <p>Content</p>
              </ExperienceFrame>
            )}
          />
          <Route path="/phonics" element={<div data-testid="destination">Destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByTestId('destination')).toBeInTheDocument();
  });

  it('renders accessible world progress without accuracy percentages', () => {
    render(
      <WorldProgress
        steps={['Rabbit House', 'River Bridge', 'Carrot Castle']}
        activeStep={1}
        label="Adventure path"
      />,
    );

    expect(screen.getByRole('list', { name: 'Adventure path' })).toBeInTheDocument();
    expect(screen.getByText('River Bridge')).toHaveAttribute('data-active', 'true');
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
