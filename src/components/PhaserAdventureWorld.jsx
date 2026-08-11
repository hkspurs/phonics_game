import React, { useEffect, useRef, useState } from 'react';
import { ADVENTURE_STEPS, getAdventureStep } from '../adventure/adventureEvents';
import '../styles/adventure-world.css';

export default function PhaserAdventureWorld({ progress = 0, total = 5, status = 'idle', word = '', onContinue }) {
  const mountRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const stateRef = useRef({ progress, total, status, word });
  const callbacksRef = useRef({ onContinue });
  const [loadError, setLoadError] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  callbacksRef.current.onContinue = onContinue;
  stateRef.current = { progress, total, status, word };

  useEffect(() => {
    let active = true;
    Promise.all([import('phaser'), import('../adventure/AdventureScene')])
      .then(([phaserModule, sceneModule]) => {
        if (!active || !mountRef.current) return;
        const Phaser = phaserModule.default || phaserModule;
        const Scene = sceneModule.createAdventureScene(Phaser, {
          onReady: (scene) => {
            sceneRef.current = scene;
            scene.setAdventureState({
              step: getAdventureStep(stateRef.current.progress, stateRef.current.total),
              status: stateRef.current.status,
              word: stateRef.current.word,
            });
            setSceneReady(true);
          },
          onContinue: () => callbacksRef.current.onContinue?.(),
        });
        gameRef.current = new Phaser.Game({
          type: Phaser.AUTO,
          parent: mountRef.current,
          width: 900,
          height: 180,
          transparent: true,
          banner: false,
          render: { antialias: true, roundPixels: true },
          scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
          scene: Scene,
        });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
      sceneRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    scene?.setAdventureState({ step: getAdventureStep(progress, total), status, word });
  }, [progress, status, total, word]);

  const step = getAdventureStep(progress, total);
  const fallbackCaption = word
    ? `${status === 'correct' ? 'Great work!' : 'Keep going!'} ${word}`
    : ADVENTURE_STEPS[step]?.label || 'Adventure';

  if (loadError) {
    return <div className="adventure-world adventure-world--fallback" data-testid="adventure-world-fallback"><span>🐰</span><span>{fallbackCaption}</span></div>;
  }

  return (
    <div className={`adventure-world ${sceneReady ? 'adventure-world--ready' : ''}`} data-testid="adventure-world" ref={mountRef} aria-label="Rabbit Adventure world">
      <div className="adventure-world__fallback-state" aria-hidden={sceneReady}>
        <span className="adventure-world__fallback-landmark" aria-hidden="true">{ADVENTURE_STEPS[step]?.emoji || '🌱'}</span>
        <span>{fallbackCaption}</span>
      </div>
    </div>
  );
}
