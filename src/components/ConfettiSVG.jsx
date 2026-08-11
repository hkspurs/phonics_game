import React, { useEffect, useRef } from 'react';

export default function ConfettiSVG({ isVisible }) {
  const canvasRef = useRef(null);
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    if (reducedMotion) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height * 0.8,
        w: Math.random() * 10 + 5,
        h: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 360,
        spin: Math.random() * 0.2 - 0.1
      });
    }

    let animationId;
    const startedAt = performance.now();
    const render = (now) => {
      if (now - startedAt >= 900 || document.visibilityState === 'hidden') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speed;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isVisible, reducedMotion]);

  if (!isVisible) return null;
  if (reducedMotion) return <span className="reward-confetti-static" aria-hidden="true">✨</span>;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}
