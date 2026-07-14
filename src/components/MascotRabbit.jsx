import React from 'react';
import './MascotRabbit.css';
import { useGameStore } from '../store/gameStore';

export default function MascotRabbit({ style, isListening = false, feedbackState = null }) {
  const isCorrect = feedbackState === 'correct';
  const isWrong = feedbackState === 'wrong';
  const equipped = useGameStore(state => state.equipped);

  return (
    <div className={`mascot-rabbit-container ${isListening ? 'listening' : 'idle'}`} 
         style={{ 
           ...style, 
           transform: isCorrect ? 'translateY(-20px) scale(1.1)' : 'none', 
           transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           position: 'relative'
         }}>
      <svg viewBox="-10 -10 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <g id="mascot-rabbit">
          {/* Shadow */}
          <ellipse id="shadow" cx="50" cy="92" rx="20" ry="4" fill="rgba(0,0,0,0.15)"/>
          
          <g id="body" style={{ transform: isCorrect ? 'translateY(-5px)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M 35 60 Q 50 90 65 60 Q 65 50 50 50 Q 35 50 35 60 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
            {/* Legs */}
            <g id="legs">
              <path d="M 35 55 L 35 80" stroke="#8D7A6F" strokeWidth="2"/>
              <path d="M 30 75 L 35 80 L 40 70 Z" fill="#FFDAC1" />
              <rect x="28" y="72" width="14" height="12" rx="4" fill="#FFDAC1" stroke="#8D7A6F" strokeWidth="2" transform="rotate(15 35 78)"/>
              <circle cx="36" cy="78" r="1.5" fill="#8D7A6F" transform="rotate(15 35 78)"/>
              
              <path d="M 65 55 L 65 80" stroke="#8D7A6F" strokeWidth="2"/>
              <path d="M 60 75 L 65 80 L 70 70 Z" fill="#FFDAC1" />
              <rect x="58" y="72" width="14" height="12" rx="4" fill="#FFDAC1" stroke="#8D7A6F" strokeWidth="2" transform="rotate(-15 65 78)"/>
              <circle cx="64" cy="78" r="1.5" fill="#8D7A6F" transform="rotate(-15 65 78)"/>
            </g>

            {/* Arms */}
            <g id="arms" style={{ transform: isCorrect ? 'translateY(-10px) rotate(-10deg)' : 'none', transition: 'all 0.2s' }}>
              <path d="M 36 65 C 30 75 32 80 35 78" fill="none" stroke="#FFFDF8" strokeWidth="6" strokeLinecap="round"/>
              <path d="M 36 65 C 30 75 32 80 35 78" fill="none" stroke="#8D7A6F" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 64 65 C 70 75 68 80 65 78" fill="none" stroke="#FFFDF8" strokeWidth="6" strokeLinecap="round"/>
              <path d="M 64 65 C 70 75 68 80 65 78" fill="none" stroke="#8D7A6F" strokeWidth="2" strokeLinecap="round"/>
            </g>

            {/* Headphones around the neck! (Fixes the anatomy issue) */}
            <g id="headphones-neck">
              <path d="M 32 62 C 32 75 68 75 68 62" fill="none" stroke="#B5EAD7" strokeWidth="5" strokeLinecap="round"/>
              <ellipse cx="32" cy="62" rx="4" ry="7" fill="#B5EAD7" stroke="#8D7A6F" strokeWidth="1.5" transform="rotate(20 32 62)"/>
              <ellipse cx="68" cy="62" rx="4" ry="7" fill="#B5EAD7" stroke="#8D7A6F" strokeWidth="1.5" transform="rotate(-20 68 62)"/>
            </g>

            {/* Head */}
            <g id="head-group" style={{ transform: isCorrect ? 'translateY(-2px)' : (isWrong ? 'translateY(5px) rotate(5deg)' : 'none'), transition: 'all 0.3s' }}>
              {/* Front Ear (Left Ear) */}
              <g transform="translate(35, 35) rotate(-15)">
                <g id="left-ear">
                  <path d="M 0 0 C -15 -25 -5 -40 5 -35 C 15 -30 10 -15 0 0 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
                  <path d="M 1 -5 C -8 -20 -2 -32 3 -28 C 8 -24 6 -15 1 -5 Z" fill="#FFD1D1"/>
                </g>
              </g>
              {/* Back Ear (Right Ear) */}
              <g transform="translate(65, 35) rotate(15)">
                <g id="right-ear">
                  <path d="M 0 0 C 15 -25 5 -40 -5 -35 C -15 -30 -10 -15 0 0 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
                  <path d="M -1 -5 C 8 -20 2 -32 -3 -28 C -8 -24 -6 -15 -1 -5 Z" fill="#FFD1D1"/>
                </g>
              </g>
              
              {/* Big cute squircle head */}
              <path id="head-base" d="M 20 45 C 20 20 80 20 80 45 C 80 70 20 70 20 45 Z" fill="#FFFDF8" stroke="#8D7A6F" strokeWidth="2"/>
              
              {/* Kawaii Face */}
              <g id="face">
                {isWrong ? (
                  <>
                    <path d="M 32 44 L 38 48 M 38 44 L 32 48" stroke="#4A3F35" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 62 44 L 68 48 M 68 44 L 62 48" stroke="#4A3F35" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 45 52 Q 50 48 55 52" fill="none" stroke="#4A3F35" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                ) : isCorrect ? (
                  <>
                    <path d="M 32 46 Q 35 43 38 46" fill="none" stroke="#4A3F35" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 62 46 Q 65 43 68 46" fill="none" stroke="#4A3F35" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 45 49 C 45 54 55 54 55 49 Z" fill="#4A3F35" />
                    <path d="M 47 50 C 47 54 53 54 53 50 Z" fill="#FFB3B3" />
                  </>
                ) : (
                  <>
                    {/* Big eyes set wide apart */}
                    <circle className="eye" cx="35" cy="46" r="4.5" fill="#4A3F35"/>
                    <circle className="eye-sparkle" cx="33.5" cy="44.5" r="1.5" fill="#FFFFFF"/>
                    
                    <circle className="eye" cx="65" cy="46" r="4.5" fill="#4A3F35"/>
                    <circle className="eye-sparkle" cx="63.5" cy="44.5" r="1.5" fill="#FFFFFF"/>
                    
                    {/* Cute cat-like mouth */}
                    <path d="M 46 50 C 48 53 50 53 50 50 C 50 53 52 53 54 50" fill="none" stroke="#4A3F35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 48 51 C 48 55 52 55 52 51 Z" fill="#FFB3B3" />
                  </>
                )}
                
                {/* Blushes */}
                <ellipse cx="28" cy="52" rx="5" ry="2.5" fill="#FFA6A6" opacity="0.6"/>
                <ellipse cx="72" cy="52" rx="5" ry="2.5" fill="#FFA6A6" opacity="0.6"/>
              </g>
            </g>
            {/* Emojis as Accessories */}
            {equipped?.hat === 'hat_wizard' && (
              <text x="50" y="30" fontSize="35" textAnchor="middle" style={{ transform: isCorrect ? 'translateY(-10px)' : 'none', transition: 'transform 0.2s' }}>🧙‍♂️</text>
            )}
            {equipped?.hat === 'hat_crown' && (
              <text x="50" y="30" fontSize="35" textAnchor="middle" style={{ transform: isCorrect ? 'translateY(-10px)' : 'none', transition: 'transform 0.2s' }}>👑</text>
            )}
            {equipped?.glasses === 'glasses_cool' && (
              <text x="50" y="52" fontSize="25" textAnchor="middle" style={{ transform: isCorrect ? 'translateY(-5px)' : 'none', transition: 'transform 0.2s' }}>🕶️</text>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
