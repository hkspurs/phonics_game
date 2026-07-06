import React from 'react';
import './WrongFeedback.css';

export default function WrongFeedback({ trigger, style }) {
  return (
    <div className={`wrong-feedback-container ${trigger ? 'active' : ''}`} style={style}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="wrong-feedback">
          <path id="bubble-drop" d="M 35 50 Q 35 30 50 30 Q 65 30 65 50 Q 65 70 50 70 Q 40 70 35 75 Q 38 65 35 50 Z" fill="#D6EAF8" stroke="#8D7A6F" strokeWidth="2" strokeLinejoin="round"/>
          <text id="question-mark" x="50" y="56" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#8D7A6F" textAnchor="middle">?</text>
          <path id="sweat-drop" d="M 60 40 Q 63 45 60 48 Q 57 45 60 40 Z" fill="#B5EAD7" opacity="0.8"/>
        </g>
      </svg>
    </div>
  );
}
