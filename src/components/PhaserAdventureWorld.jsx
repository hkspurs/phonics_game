import React, { useEffect, useRef, useState } from 'react';
import { ADVENTURE_STEPS, getAdventureStep } from '../adventure/adventureEvents';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/adventure-world.css';

export default function PhaserAdventureWorld({ progress = 0, total = 5, status = 'idle', word = '', onContinue }) {
  const { language } = useTranslation();
  const labels = language === 'zh'
    ? { world: '兔仔冒險世界', steps: ['兔仔屋', '河上小橋', '紅蘿蔔城堡'], adventure: '冒險', greatWork: '做得好！', keepGoing: '繼續努力！' }
    : { world: 'Rabbit Adventure world', steps: ['Rabbit House', 'River Bridge', 'Carrot Castle'], adventure: 'Adventure', greatWork: 'Great work!', keepGoing: 'Keep going!' };
  const mountRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const stateRef = useRef({ progress, total, status, word, labels });
  const callbacksRef = useRef({ onContinue });
  const [loadError, setLoadError] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  callbacksRef.current.onContinue = onContinue;
  stateRef.current = { progress, total, status, word, labels };

  useEffect(() => {
    let active = true;
    Promise.all([import('phaser'), import('../adventure/AdventureScene')])
      .then(([phaserModule, sceneModule]) => {
        if (!active || !mountRef.current) return;
        const Phaser = phaserModule.default || phaserModule;
        const Scene = sceneModule.createAdventureScene(Phaser, {
          labels,
          onReady: (scene) => {
            sceneRef.current = scene;
            scene.setAdventureState({
              step: getAdventureStep(stateRef.current.progress, stateRef.current.total),
              status: stateRef.current.status,
              word: stateRef.current.word,
              labels: stateRef.current.labels,
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
    scene?.setAdventureState({ step: getAdventureStep(progress, total), status, word, labels });
  }, [progress, status, total, word, language]);

  const step = getAdventureStep(progress, total);
  const fallbackCaption = word
    ? `${status === 'correct' ? labels.greatWork : labels.keepGoing} ${word}`
    : labels.steps[step] || labels.adventure;

  if (loadError) {
    return <div className="adventure-world adventure-world--fallback" data-testid="adventure-world-fallback"><span>🐰</span><span>{fallbackCaption}</span></div>;
  }

  return (
    <div className={`adventure-world ${sceneReady ? 'adventure-world--ready' : ''}`} data-testid="adventure-world" ref={mountRef} aria-label={labels.world}>
      <div className="adventure-world__fallback-state" aria-hidden={sceneReady}>
        <span className="adventure-world__fallback-landmark" aria-hidden="true">{ADVENTURE_STEPS[step]?.emoji || '🌱'}</span>
        <span>{fallbackCaption}</span>
      </div>
    </div>
  );
}
