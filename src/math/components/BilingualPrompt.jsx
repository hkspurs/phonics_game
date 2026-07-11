import React from 'react';
import { getMathCopy } from '../content/mathCopy';

export default function BilingualPrompt({ promptKey, promptParams = {} }) {
  const { zh, en } = getMathCopy(promptKey, promptParams);

  return (
    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
        {zh}
      </div>
      <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>
        {en}
      </div>
    </div>
  );
}
