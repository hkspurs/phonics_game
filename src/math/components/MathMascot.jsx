import React from 'react';
import MascotRabbit from '../../components/MascotRabbit';

export default function MathMascot({ style, isListening = false, feedbackState = null, onClick }) {
  // A wrapper around MascotRabbit to allow easy additions for the math domain later
  // such as holding a ruler or wearing glasses.
  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', ...style }}>
      <MascotRabbit isListening={isListening} feedbackState={feedbackState} />
    </div>
  );
}
