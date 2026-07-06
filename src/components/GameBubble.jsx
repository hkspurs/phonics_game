import React from 'react';
import './GameBubble.css';

export default function GameBubble({ letter, onClick, style, isPopping = false }) {
  return (
    <div 
      className={`game-bubble-container ${isPopping ? 'popping' : ''}`} 
      style={{ cursor: 'pointer', ...style }}
      onClick={onClick}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="game-bubble">
          <circle id="bubble-bg" cx="50" cy="50" r="40" fill="#FFFFFF" stroke="#8D7A6F" strokeWidth="2" opacity="0.9"/>
          
          <text id="letter-content" x="50" y="65" fontFamily="Arial, sans-serif" fontSize="45" fontWeight="bold" fill="#FF9AA2" textAnchor="middle">
            {letter}
          </text>
          
          <path id="bubble-gloss" d="M 25 30 A 25 25 0 0 1 75 30 A 20 20 0 0 0 25 30 Z" fill="#FFFFFF" opacity="0.6"/>
          <circle cx="70" cy="70" r="4" fill="#FFFFFF" opacity="0.6"/>
        </g>
      </svg>
    </div>
  );
}
