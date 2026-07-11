import React from 'react';
import CountingQuestion from './CountingQuestion';
import OrderingQuestion from './OrderingQuestion';
import ChoiceQuestion from './ChoiceQuestion';
import NumberBondQuestion from './NumberBondQuestion';
import PatternQuestion from './PatternQuestion';

/**
 * Registry of renderers by question type.
 */
const rendererByType = {
  counting: CountingQuestion,
  ordering: OrderingQuestion,
  comparison: ChoiceQuestion,
  addition: ChoiceQuestion,
  subtraction: ChoiceQuestion,
  ordinal: ChoiceQuestion,
  number_bonds: NumberBondQuestion,
  pattern: PatternQuestion,
};

export default function MathQuestionRenderer({ question, onAnswer }) {
  if (!question) return null;

  const Renderer = rendererByType[question.type];

  if (!Renderer) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
        Unknown question type: {question.type}
      </div>
    );
  }

  // Use key to force unmount/remount between questions
  return <Renderer key={question.id} question={question} onAnswer={onAnswer} />;
}
