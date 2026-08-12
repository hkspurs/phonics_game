import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { audioEngine } from '../audio/AudioEngine';
import { getChineseSpaceAudioUrl } from '../audio/chineseSpaceAudio';
import { CHINESE_SPACE_COPY } from '../chinese-space/chineseSpaceCopy';
import '../styles/chinese-space.css';

const SFX_MAP = {
  correct: 'correct',
  damage: 'error',
  timeout: 'error',
  explosion: 'win',
};

function statusText(snapshot) {
  if (!snapshot || snapshot.screen === 'loading') return `${CHINESE_SPACE_COPY.title}：${CHINESE_SPACE_COPY.loading}`;
  const progress = snapshot.questionCount
    ? ` ${snapshot.questionIndex + 1}/${snapshot.questionCount}`
    : '';
  const hp = snapshot.hp == null ? '' : `　❤️ ${CHINESE_SPACE_COPY.hp} ${snapshot.hp}`;
  const timer = snapshot.screen === 'active' ? `　${(snapshot.countdownMs / 1000).toFixed(1)}s` : '';
  return `${CHINESE_SPACE_COPY.title}：${snapshot.screen}${progress}${hp}${timer}${snapshot.feedback ? `　${snapshot.feedback}` : ''}`;
}

export default function ChineseSpaceGame() {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const lastRewardRef = useRef(null);
  const [snapshot, setSnapshot] = useState({ screen: 'loading' });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([import('phaser'), import('../chinese-space/ChineseSpaceScene')])
      .then(([phaserModule, sceneModule]) => {
        if (!active || !mountRef.current) return;
        const Phaser = phaserModule.default || phaserModule;
        const Scene = sceneModule.createChineseSpaceScene(Phaser, {
          audio: {
            playWord: async (wordId) => {
              const url = getChineseSpaceAudioUrl(wordId);
              if (!url) return false;
              try {
                return (await audioEngine.play(url)) !== false;
              } catch {
                return false;
              }
            },
            playSfx: (name) => audioEngine.playUI(SFX_MAP[name] || 'pop'),
            stop: () => audioEngine.stop(),
          },
          store: {
            getState: () => useGameStore.getState().chineseSpace,
            addGems: (amount) => useGameStore.getState().addChineseSpaceGems(amount),
            markTutorialComplete: () => useGameStore.getState().markChineseSpaceTutorialComplete(),
            redeemBadge: (badgeId) => useGameStore.getState().redeemChineseSpaceBadge(badgeId),
          },
          onExit: () => navigate('/phonics'),
          onSessionComplete: (result) => {
            if (result !== lastRewardRef.current && result?.gems) {
              lastRewardRef.current = result;
              useGameStore.getState().addChineseSpaceGems(result.gems);
            }
          },
          onUiStateChange: (next) => active && setSnapshot(next),
          onReady: (scene) => { sceneRef.current = scene; },
        });

        gameRef.current = new Phaser.Game({
          type: Phaser.AUTO,
          parent: mountRef.current,
          width: 1280,
          height: 720,
          banner: false,
          backgroundColor: '#07152f',
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
      sceneRef.current?.destroyAudio?.();
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
      audioEngine.stop();
    };
  }, [navigate]);

  return (
    <main className="chinese-space-shell">
      <button type="button" className="chinese-space-shell__back" onClick={() => navigate('/phonics')}>
        ← 返回拼音世界
      </button>
      <div className="chinese-space-shell__rotate" aria-hidden="true">{CHINESE_SPACE_COPY.orientation}</div>
      {loadError ? (
        <div className="chinese-space-shell__error">
          <p>{CHINESE_SPACE_COPY.title} 暫時未能載入。</p>
          <button type="button" onClick={() => window.location.reload()}>重新載入</button>
        </div>
      ) : (
        <div className="chinese-space-canvas" data-testid="chinese-space-canvas" ref={mountRef} aria-label={CHINESE_SPACE_COPY.title} />
      )}
      <div className="chinese-space-status" data-testid="chinese-space-status" aria-live="polite">
        {statusText(snapshot)}
      </div>
    </main>
  );
}
