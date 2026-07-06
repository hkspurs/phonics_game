import React from 'react';

export default function MapNodeCloud({ status, statusColor, isMastered, isLocked, style, onClick }) {
  const isPractising = status === 'practising';

  return (
    <div 
      className={`map-node-container ${status}`} 
      style={{ cursor: isLocked ? 'default' : 'pointer', ...style }}
      onClick={!isLocked ? onClick : undefined}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-label={`${status} node`}
    >
      <svg viewBox="-10 -10 120 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={`glow-${status}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={isPractising ? "4" : "2"} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g id="map-node">
          {/* Shadow */}
          <ellipse cx="50" cy="70" rx="30" ry="5" fill="#E6E0D8" opacity="0.6"/>
          
          <path id="cloud-base" d="M 30 55 A 15 15 0 0 1 35 30 A 20 20 0 0 1 65 25 A 15 15 0 0 1 80 45 A 15 15 0 0 1 70 65 L 30 65 A 12 12 0 0 1 30 55 Z" 
                fill={isLocked ? "#E2E8F0" : "#FFFFFF"} 
                stroke={isLocked ? "#94A3B8" : statusColor} 
                strokeWidth={isPractising ? "4" : "2"} 
                strokeLinejoin="round"
                filter={`url(#glow-${status})`}
                style={{ transition: 'all 0.3s' }}
          />
          
          {/* Face moved down to avoid text collision */}
          {!isLocked && (
            <g id="face-mastered" style={{ animation: 'bob 3s infinite alternate' }}>
              <path d="M 42 50 Q 45 48 48 50" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M 52 50 Q 55 48 58 50" fill="none" stroke="#8D7A6F" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="40" cy="53" r="3" fill="#FFD1D1" opacity="0.8"/>
              <circle cx="60" cy="53" r="3" fill="#FFD1D1" opacity="0.8"/>
            </g>
          )}

          {isLocked && (
            <g id="face-locked">
              <path d="M 42 52 Q 45 52 48 52" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M 52 52 Q 55 52 58 52" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
          )}

          {isMastered && (
            <g id="mastery-star" transform="translate(75, 20)" style={{ animation: 'spin 4s linear infinite', transformOrigin: '0px 0px' }}>
              <polygon points="0,-8 2,-2 8,-2 3,2 5,8 0,4 -5,8 -3,2 -8,-2 -2,-2" fill="#FFB347" stroke="#8D7A6F" strokeWidth="1"/>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
