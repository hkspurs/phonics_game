import React from 'react';
import './MascotRabbit.css';

export default function MascotRabbit({ style, isListening = false }) {
  return (
    <div className={`mascot-rabbit-container ${isListening ? 'listening' : 'idle'}`} style={style}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="mascot-rabbit">
          <ellipse id="shadow" cx="50" cy="92" rx="20" ry="4" fill="#E6E0D8"/>
          <g id="body">
            <path d="M 35 60 Q 50 90 65 60 Q 65 50 50 50 Q 35 50 35 60 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
            <circle cx="40" cy="80" r="5" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
            <circle cx="60" cy="80" r="5" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
          </g>
          <g id="satchel" transform="translate(0, 5)">
            <path d="M 40 65 L 60 75" stroke="#8D7A6F" strokeWidth="2"/>
            <rect x="52" y="68" width="12" height="10" rx="3" fill="#FFDAC1" stroke="#8D7A6F" strokeWidth="2"/>
          </g>
          <g id="head-group">
            <g id="left-ear" transform="translate(38, 30)">
              <path d="M 0 0 Q -10 -20 0 -30 Q 10 -20 5 0 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
              <path d="M 0 -5 Q -5 -18 1 -25 Q 5 -18 3 -5 Z" fill="#FFD1D1"/>
            </g>
            <g id="right-ear" transform="translate(62, 30)">
              <path d="M 0 0 Q 10 -20 0 -30 Q -10 -20 -5 0 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
              <path d="M 0 -5 Q 5 -18 -1 -25 Q -5 -18 -3 -5 Z" fill="#FFD1D1"/>
            </g>
            <path id="head-base" d="M 30 45 Q 30 25 50 25 Q 70 25 70 45 Q 70 60 50 60 Q 30 60 30 45 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
            <g id="face">
              <circle className="eye" cx="42" cy="45" r="3" fill="#8D7A6F"/>
              <circle className="eye" cx="58" cy="45" r="3" fill="#8D7A6F"/>
              <ellipse cx="37" cy="48" rx="4" ry="2" fill="#FFD1D1" opacity="0.8"/>
              <ellipse cx="63" cy="48" rx="4" ry="2" fill="#FFD1D1" opacity="0.8"/>
              <path d="M 48 48 Q 50 50 52 48" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
            <g id="headphones">
              <path d="M 28 45 A 24 24 0 0 1 72 45" fill="none" stroke="#B5EAD7" strokeWidth="4" strokeLinecap="round"/>
              <rect x="25" y="40" width="8" height="15" rx="4" fill="#B5EAD7" stroke="#8D7A6F" strokeWidth="1.5"/>
              <rect x="67" y="40" width="8" height="15" rx="4" fill="#B5EAD7" stroke="#8D7A6F" strokeWidth="1.5"/>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
