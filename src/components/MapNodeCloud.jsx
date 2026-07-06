import React from 'react';
import './MapNodeCloud.css';

export default function MapNodeCloud({ isMastered, isLocked, style, onClick }) {
  const isPractised = !isLocked && !isMastered;

  return (
    <div 
      className={`map-node-container ${isMastered ? 'mastered' : isLocked ? 'locked' : 'practised'}`} 
      style={{ cursor: isLocked ? 'default' : 'pointer', ...style }}
      onClick={!isLocked ? onClick : undefined}
    >
      <svg viewBox="0 0 100 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="map-node">
          <ellipse cx="50" cy="65" rx="30" ry="5" fill="#E6E0D8" opacity="0.6"/>
          
          <path id="cloud-base" d="M 30 50 A 15 15 0 0 1 35 25 A 20 20 0 0 1 65 20 A 15 15 0 0 1 80 40 A 15 15 0 0 1 70 60 L 30 60 A 12 12 0 0 1 30 50 Z" 
                fill={isLocked ? "#E2E8F0" : "#FFFFFF"} 
                stroke={isLocked ? "#94A3B8" : "#8D7A6F"} 
                strokeWidth="2" strokeLinejoin="round"/>
          
          {!isLocked && (
            <g id="face-mastered">
              <path d="M 42 40 Q 45 38 48 40" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M 52 40 Q 55 38 58 40" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="40" cy="45" r="3" fill="#FFD1D1" opacity="0.8"/>
              <circle cx="60" cy="45" r="3" fill="#FFD1D1" opacity="0.8"/>
            </g>
          )}

          {isLocked && (
            <g id="face-locked">
              <path d="M 42 42 Q 45 42 48 42" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M 52 42 Q 55 42 58 42" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          )}

          {isMastered && (
            <g id="mastery-star" transform="translate(70, 20)">
              <polygon points="0,-8 2,-2 8,-2 3,2 5,8 0,4 -5,8 -3,2 -8,-2 -2,-2" fill="#FFB347" stroke="#8D7A6F" strokeWidth="1"/>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
