import React from 'react';
import './MascotRabbit.css';

export default function MascotRabbit({ style, isListening = false, feedbackState = null }) {
  const isCorrect = feedbackState === 'correct';
  
  return (
    <div className={`mascot-rabbit-container ${isListening ? 'listening' : 'idle'}`} 
         style={{ ...style, transform: isCorrect ? 'translateY(-20px)' : 'none', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
      <svg viewBox="0 -30 100 130" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="mascot-rabbit">
          {/* Shadow */}
          <ellipse id="shadow" cx="50" cy="94" rx="24" ry="4" fill="#E6E0D8"/>
          
          {/* Back Ear (Right Ear) */}
          <g transform="translate(65, 25) rotate(15)">
            <g id="right-ear" style={{ transformOrigin: '-5px 5px' }}>
              <path d="M -5 5 C 15 -35 5 -45 -5 -40 C -15 -35 -10 -15 -5 5 Z" fill="var(--mascot-fur)" stroke="var(--mascot-stroke)" strokeWidth="2"/>
              <path d="M -4 2 C 8 -25 2 -37 -3 -33 C -8 -29 -6 -15 -4 2 Z" fill="var(--mascot-inner-ear)"/>
            </g>
          </g>

          {/* Body */}
          <g id="body">
            {/* Main torso */}
            <path d="M 35 55 C 30 85 40 92 50 92 C 60 92 70 85 65 55 Z" fill="var(--mascot-fur)" stroke="var(--mascot-stroke)" strokeWidth="2"/>
            {/* Belly patch */}
            <path d="M 40 65 C 38 82 45 88 50 88 C 55 88 62 82 60 65 Z" fill="#FFF0F0" opacity="0.6"/>
          </g>

          {/* Feet */}
          <g id="feet">
            <ellipse cx="38" cy="90" rx="7" ry="4" fill="var(--mascot-fur)" stroke="var(--mascot-stroke)" strokeWidth="2"/>
            <ellipse cx="62" cy="90" rx="7" ry="4" fill="var(--mascot-fur)" stroke="var(--mascot-stroke)" strokeWidth="2"/>
          </g>

          {/* Arms */}
          <g id="arms">
            <path d="M 36 60 C 30 70 32 75 35 73" fill="none" stroke="var(--mascot-fur)" strokeWidth="6" strokeLinecap="round"/>
            <path d="M 36 60 C 30 70 32 75 35 73" fill="none" stroke="var(--mascot-stroke)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M 64 60 C 70 70 68 75 65 73" fill="none" stroke="var(--mascot-fur)" strokeWidth="6" strokeLinecap="round"/>
            <path d="M 64 60 C 70 70 68 75 65 73" fill="none" stroke="var(--mascot-stroke)" strokeWidth="2" strokeLinecap="round"/>
          </g>

          {/* Satchel (Crossbody bag) */}
          <g id="satchel" transform="translate(0, 0)">
            <path d="M 35 55 L 65 80" stroke="#8D7A6F" strokeWidth="2"/>
            <path d="M 60 75 L 65 80 L 70 70 Z" fill="#FFDAC1" />
            <rect x="58" y="72" width="14" height="12" rx="4" fill="#FFDAC1" stroke="#8D7A6F" strokeWidth="2" transform="rotate(-15 65 78)"/>
            <circle cx="64" cy="78" r="1.5" fill="#8D7A6F" transform="rotate(-15 65 78)"/>
          </g>

          {/* Head */}
          <g id="head-group">
            {/* Front Ear (Left Ear) */}
            <g transform="translate(35, 25) rotate(-15)">
              <g id="left-ear" style={{ transformOrigin: '5px 5px' }}>
                <path d="M 5 5 C -15 -35 -5 -45 5 -40 C 15 -35 10 -15 5 5 Z" fill="var(--mascot-fur)" stroke="var(--mascot-stroke)" strokeWidth="2"/>
                <path d="M 4 2 C -8 -25 -2 -37 3 -33 C 8 -29 6 -15 4 2 Z" fill="var(--mascot-inner-ear)"/>
              </g>
            </g>
            
            {/* Big cute squircle head - Shifting down so ears don't get cut off entirely, plus overflow: visible */}
            <path id="head-base" d="M 20 50 C 20 15 80 15 80 50 C 80 75 20 75 20 50 Z" fill="var(--mascot-fur)" stroke="var(--mascot-stroke)" strokeWidth="2"/>
            
            {/* Kawaii Face */}
            <g id="face">
              {/* Eyes with blinking animation */}
              <g style={{ animation: 'mascot-blink 4s infinite' }}>
                {!isCorrect ? (
                  <>
                    <circle cx="33" cy="46" r="4.5" fill="#4A3F35"/>
                    <circle cx="31.5" cy="44.5" r="1.5" fill="#FFFFFF"/>
                    <circle cx="67" cy="46" r="4.5" fill="#4A3F35"/>
                    <circle cx="65.5" cy="44.5" r="1.5" fill="#FFFFFF"/>
                  </>
                ) : (
                  <>
                    {/* Happy closed eyes (arcs) */}
                    <path d="M 28 46 Q 33 42 38 46" fill="none" stroke="#4A3F35" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M 62 46 Q 67 42 72 46" fill="none" stroke="#4A3F35" strokeWidth="2" strokeLinecap="round"/>
                  </>
                )}
              </g>
              
              {/* Blushes */}
              <ellipse cx="26" cy="52" rx="5" ry="2.5" fill="#FFA6A6" opacity={isCorrect ? "0.9" : "0.6"}/>
              <ellipse cx="74" cy="52" rx="5" ry="2.5" fill="#FFA6A6" opacity={isCorrect ? "0.9" : "0.6"}/>
              
              {/* Cute cat-like mouth */}
              {!isCorrect ? (
                <>
                  <path d="M 46 50 C 48 53 50 53 50 50 C 50 53 52 53 54 50" fill="none" stroke="#4A3F35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M 48 51 C 48 55 52 55 52 51 Z" fill="#FFB3B3" />
                </>
              ) : (
                /* Big happy open mouth */
                <path d="M 44 50 Q 50 60 56 50 Z" fill="#FFB3B3" stroke="#4A3F35" strokeWidth="1.5" strokeLinejoin="round"/>
              )}
            </g>

            {/* Proper Headphones on the head! */}
            <g id="headphones">
              {/* Headband */}
              <path d="M 22 45 C 22 10 78 10 78 45" fill="none" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round"/>
              {/* Ear Muffs */}
              <rect x="16" y="38" width="8" height="18" rx="4" fill="#38BDF8" stroke="#1E3A8A" strokeWidth="1.5"/>
              <rect x="76" y="38" width="8" height="18" rx="4" fill="#38BDF8" stroke="#1E3A8A" strokeWidth="1.5"/>
              {/* Ear Muff padding */}
              <path d="M 24 40 C 27 40 27 54 24 54" fill="#FFF" stroke="#1E3A8A" strokeWidth="1"/>
              <path d="M 76 40 C 73 40 73 54 76 54" fill="#FFF" stroke="#1E3A8A" strokeWidth="1"/>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
