import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CountingQuestion from './CountingQuestion';
import OrderingQuestion from './OrderingQuestion';
import ChoiceQuestion from './ChoiceQuestion';
import NumberBondQuestion from './NumberBondQuestion';
import PatternQuestion from './PatternQuestion';

describe('Math Renderers', () => {
  it('CountingQuestion renders and answers', () => {
    const question = {
      values: { count: 3, emoji: '🍎' },
      choices: [1, 2, 3, 4],
      answer: 3
    };
    const onAnswer = vi.fn();
    render(<CountingQuestion question={question} onAnswer={onAnswer} />);
    
    expect(screen.getByText('How many items?')).toBeInTheDocument();
    
    // Click incorrect
    fireEvent.click(screen.getByText('1'));
    expect(onAnswer).toHaveBeenCalledWith(false, 1);
    
    // Click correct
    fireEvent.click(screen.getByText('3'));
    expect(onAnswer).toHaveBeenCalledWith(true, 2);
  });

  it('OrderingQuestion renders and swaps', () => {
    const question = {
      values: { direction: 'ascending' },
      choices: [3, 1, 2],
      answer: [1, 2, 3]
    };
    const onAnswer = vi.fn();
    render(<OrderingQuestion question={question} onAnswer={onAnswer} />);
    
    // Click 'Check Answer' with wrong order
    fireEvent.click(screen.getByText('Check Answer'));
    expect(onAnswer).toHaveBeenCalledWith(false, 1);
    
    // Swap 3 and 1
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('1'));
    
    // Swap 3 and 2
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('2'));
    
    // Check answer again
    fireEvent.click(screen.getByText('Check Answer'));
    expect(onAnswer).toHaveBeenCalledWith(true, 2);
  });

  it('ChoiceQuestion renders for addition', () => {
    const question = {
      type: 'addition',
      values: { a: 2, b: 3 },
      choices: [4, 5, 6],
      answer: 5
    };
    const onAnswer = vi.fn();
    render(<ChoiceQuestion question={question} onAnswer={onAnswer} />);
    
    expect(screen.getByText('How many altogether?')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('5'));
    expect(onAnswer).toHaveBeenCalledWith(true, 1);
  });

  it('ChoiceQuestion extracts labels for comparison', () => {
    const question = {
      type: 'comparison',
      values: { a: 5, b: 2, choiceLabels: [{ value: 'bigger', label: 'More' }] },
      choices: ['bigger'],
      answer: 'bigger'
    };
    const onAnswer = vi.fn();
    render(<ChoiceQuestion question={question} onAnswer={onAnswer} />);
    
    expect(screen.getByText('Which is more?')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('More'));
    expect(onAnswer).toHaveBeenCalledWith(true, 1);
  });

  it('NumberBondQuestion renders and answers', () => {
    const question = {
      values: { target: 10, givenPart: 7 },
      choices: [2, 3, 4],
      answer: 3
    };
    const onAnswer = vi.fn();
    render(<NumberBondQuestion question={question} onAnswer={onAnswer} />);
    
    expect(screen.getByText('Make 10!')).toBeInTheDocument();
    // Use container query or multiple text checks
    expect(screen.getByText((content, element) => element.textContent === '7 and ? make 10')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('3'));
    expect(onAnswer).toHaveBeenCalledWith(true, 1);
  });

  it('PatternQuestion renders and answers', () => {
    const question = {
      values: { visibleItems: ['🔴', '🔵', '🔴'] },
      choices: ['🔴', '🔵'],
      answer: '🔵'
    };
    const onAnswer = vi.fn();
    render(<PatternQuestion question={question} onAnswer={onAnswer} />);
    
    expect(screen.getByText('What comes next?')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: '🔵' }));
    expect(onAnswer).toHaveBeenCalledWith(true, 1);
  });
});
