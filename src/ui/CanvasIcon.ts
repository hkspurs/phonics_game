/**
 * CanvasIcon.ts
 * Specification V2 — Unified Vector Icon System
 * 
 * Provides crisp, procedural canvas vector icons at standard sizes (20, 24, 32, 48px).
 * Eliminates OS emoji dependencies across all platforms and resolutions.
 */

import Phaser from 'phaser';

export type IconName =
  | 'coin'
  | 'gem'
  | 'star'
  | 'chinese'
  | 'math'
  | 'english'
  | 'check'
  | 'cross'
  | 'lock'
  | 'trophy'
  | 'home'
  | 'map'
  | 'report'
  | 'settings'
  | 'retry'
  | 'next'
  | 'sound_on'
  | 'sound_off'
  | 'hint'
  | 'back'
  | 'close'
  | 'speaker'
  | 'shop'
  | 'rocket'
  | 'play'
  | 'pause'
  | 'wardrobe'
  | 'pet'
  | 'skip';

export type IconSize = 20 | 24 | 32 | 48;

export function getIconTextureKey(name: IconName, size: IconSize = 32): string {
  return `vec_icon_${name}_${size}`;
}

function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else if (typeof ctx.rect === 'function') {
    ctx.rect(x, y, w, h);
  } else if (typeof ctx.fillRect === 'function') {
    ctx.fillRect(x, y, w, h);
  }
}

export function drawVectorIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  size: number,
  color?: string
): void {
  ctx.save();
  const s = size;
  const half = s / 2;

  switch (name) {
    case 'shop': {
      // Shopping Bag with Handles
      ctx.fillStyle = color || '#f59e0b';
      ctx.beginPath();
      safeRoundRect(ctx, s * 0.18, s * 0.32, s * 0.64, s * 0.58, s * 0.1);
      ctx.fill();

      // Handle
      ctx.strokeStyle = color || '#fef08a';
      ctx.lineWidth = Math.max(1.5, s * 0.08);
      ctx.beginPath();
      ctx.arc(half, s * 0.32, s * 0.2, Math.PI, 0);
      ctx.stroke();

      // Star emblem on bag
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(half, s * 0.62, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rocket': {
      // Launch Rocket
      ctx.fillStyle = color || '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(half, s * 0.1);
      ctx.quadraticCurveTo(s * 0.75, s * 0.35, s * 0.7, s * 0.75);
      ctx.lineTo(s * 0.3, s * 0.75);
      ctx.quadraticCurveTo(s * 0.25, s * 0.35, half, s * 0.1);
      ctx.fill();

      // Side fins
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(s * 0.3, s * 0.55);
      ctx.lineTo(s * 0.12, s * 0.78);
      ctx.lineTo(s * 0.3, s * 0.75);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(s * 0.7, s * 0.55);
      ctx.lineTo(s * 0.88, s * 0.78);
      ctx.lineTo(s * 0.7, s * 0.75);
      ctx.fill();

      // Window
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(half, s * 0.42, s * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Flame
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(s * 0.38, s * 0.75);
      ctx.lineTo(half, s * 0.95);
      ctx.lineTo(s * 0.62, s * 0.75);
      ctx.fill();
      break;
    }

    case 'play': {
      // Play Triangle
      ctx.fillStyle = color || '#22c55e';
      ctx.beginPath();
      ctx.moveTo(s * 0.28, s * 0.18);
      ctx.lineTo(s * 0.78, half);
      ctx.lineTo(s * 0.28, s * 0.82);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'pause': {
      // Two rounded bars
      ctx.fillStyle = color || '#ffffff';
      ctx.beginPath();
      safeRoundRect(ctx, s * 0.25, s * 0.2, s * 0.18, s * 0.6, s * 0.06);
      safeRoundRect(ctx, s * 0.57, s * 0.2, s * 0.18, s * 0.6, s * 0.06);
      ctx.fill();
      break;
    }

    case 'wardrobe': {
      // Shirt / Outfit
      ctx.fillStyle = color || '#a855f7';
      ctx.beginPath();
      ctx.moveTo(half, s * 0.22);
      ctx.lineTo(s * 0.75, s * 0.22);
      ctx.lineTo(s * 0.88, s * 0.45);
      ctx.lineTo(s * 0.74, s * 0.52);
      ctx.lineTo(s * 0.7, s * 0.45);
      ctx.lineTo(s * 0.7, s * 0.82);
      ctx.lineTo(s * 0.3, s * 0.82);
      ctx.lineTo(s * 0.3, s * 0.45);
      ctx.lineTo(s * 0.26, s * 0.52);
      ctx.lineTo(s * 0.12, s * 0.45);
      ctx.lineTo(s * 0.25, s * 0.22);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'pet': {
      // Paw Print
      ctx.fillStyle = color || '#fbbf24';
      // Main pad
      ctx.beginPath();
      ctx.arc(half, s * 0.62, s * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // 4 Toe pads
      const toes = [
        { x: s * 0.25, y: s * 0.38, r: s * 0.08 },
        { x: s * 0.42, y: s * 0.26, r: s * 0.09 },
        { x: s * 0.58, y: s * 0.26, r: s * 0.09 },
        { x: s * 0.75, y: s * 0.38, r: s * 0.08 },
      ];
      for (const t of toes) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'skip': {
      // Fast Forward >>
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(s * 0.2, s * 0.25);
      ctx.lineTo(s * 0.48, half);
      ctx.lineTo(s * 0.2, s * 0.75);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.25);
      ctx.lineTo(s * 0.78, half);
      ctx.lineTo(s * 0.5, s * 0.75);
      ctx.stroke();
      break;
    }
    case 'coin': {
      // Golden Disc with outer rim & star/symbol
      const grad = ctx.createRadialGradient(half * 0.8, half * 0.8, s * 0.1, half, half, half);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(half, half, half * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Inner ring
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = Math.max(1, s * 0.08);
      ctx.beginPath();
      ctx.arc(half, half, half * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Center coin stamp
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(half - s * 0.1, half - s * 0.22, s * 0.2, s * 0.44);
      break;
    }

    case 'gem': {
      // Brilliant Sky Blue Diamond
      const grad = ctx.createLinearGradient(half, s * 0.1, half, s * 0.9);
      grad.addColorStop(0, '#bae6fd');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(half, s * 0.1);
      ctx.lineTo(s * 0.9, half * 0.7);
      ctx.lineTo(half, s * 0.92);
      ctx.lineTo(s * 0.1, half * 0.7);
      ctx.closePath();
      ctx.fill();

      // Table facet
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(half, s * 0.1);
      ctx.lineTo(half * 1.3, half * 0.5);
      ctx.lineTo(half, half * 0.7);
      ctx.lineTo(half * 0.7, half * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'star': {
      // 5-Point Golden Star
      ctx.fillStyle = color || '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = Math.max(1, s * 0.06);

      const spikes = 5;
      const outerRadius = half * 0.88;
      const innerRadius = half * 0.44;
      let rot = (Math.PI / 2) * 3;
      let x = half;
      let y = half;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(half, half - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = half + Math.cos(rot) * outerRadius;
        y = half + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = half + Math.cos(rot) * innerRadius;
        y = half + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(half, half - outerRadius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'chinese': {
      // Chinese Character Icon: '文'
      ctx.fillStyle = color || '#f97316';
      ctx.beginPath();
      ctx.arc(half, half, half * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(s * 0.55)}px 'Noto Sans TC', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('中', half, half + 1);
      break;
    }

    case 'math': {
      // Math Numbers/Symbols Icon: '數' / '+ -'
      ctx.fillStyle = color || '#3b82f6';
      ctx.beginPath();
      ctx.arc(half, half, half * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(s * 0.55)}px 'Noto Sans TC', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('數', half, half + 1);
      break;
    }

    case 'english': {
      // English Alphabet Icon: 'ABC'
      ctx.fillStyle = color || '#10b981';
      ctx.beginPath();
      ctx.arc(half, half, half * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(s * 0.5)}px 'Kenney Future', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EN', half, half + 1);
      break;
    }

    case 'check': {
      // Checkmark (Success)
      ctx.strokeStyle = color || '#22c55e';
      ctx.lineWidth = Math.max(2, s * 0.14);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.22, half * 1.05);
      ctx.lineTo(half * 0.85, s * 0.78);
      ctx.lineTo(s * 0.82, s * 0.26);
      ctx.stroke();
      break;
    }

    case 'cross': {
      // Cross / X (Error)
      ctx.strokeStyle = color || '#ef4444';
      ctx.lineWidth = Math.max(2, s * 0.14);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.25, s * 0.25);
      ctx.lineTo(s * 0.75, s * 0.75);
      ctx.moveTo(s * 0.75, s * 0.25);
      ctx.lineTo(s * 0.25, s * 0.75);
      ctx.stroke();
      break;
    }

    case 'lock': {
      // Padlock
      ctx.fillStyle = color || '#94a3b8';
      ctx.strokeStyle = color || '#94a3b8';
      ctx.lineWidth = Math.max(2, s * 0.1);

      // Shackle
      ctx.beginPath();
      ctx.arc(half, half * 0.7, s * 0.22, Math.PI, 0);
      ctx.stroke();

      // Body
      ctx.fillRect(half - s * 0.28, half * 0.7, s * 0.56, s * 0.5);

      // Keyhole
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(half, half * 0.95, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(half - s * 0.03, half * 0.95, s * 0.06, s * 0.12);
      break;
    }

    case 'trophy': {
      // Golden Trophy Cup
      ctx.fillStyle = color || '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(s * 0.25, s * 0.2);
      ctx.lineTo(s * 0.75, s * 0.2);
      ctx.lineTo(s * 0.65, s * 0.55);
      ctx.quadraticCurveTo(half, s * 0.68, s * 0.35, s * 0.55);
      ctx.closePath();
      ctx.fill();

      // Stem & Base
      ctx.fillRect(half - s * 0.06, s * 0.62, s * 0.12, s * 0.16);
      ctx.fillRect(s * 0.28, s * 0.78, s * 0.44, s * 0.1);

      // Handles
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.beginPath();
      ctx.arc(s * 0.22, s * 0.35, s * 0.1, 0, Math.PI * 2);
      ctx.arc(s * 0.78, s * 0.35, s * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'home': {
      // Home House Icon
      ctx.fillStyle = color || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(half, s * 0.18);
      ctx.lineTo(s * 0.85, half * 0.95);
      ctx.lineTo(s * 0.75, half * 0.95);
      ctx.lineTo(s * 0.75, s * 0.85);
      ctx.lineTo(s * 0.25, s * 0.85);
      ctx.lineTo(s * 0.25, half * 0.95);
      ctx.lineTo(s * 0.15, half * 0.95);
      ctx.closePath();
      ctx.fill();

      // Doorway
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(half - s * 0.1, s * 0.55, s * 0.2, s * 0.3);
      break;
    }

    case 'map': {
      // Folded Map
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = Math.max(2, s * 0.08);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.18, s * 0.25);
      ctx.lineTo(s * 0.4, s * 0.18);
      ctx.lineTo(s * 0.6, s * 0.25);
      ctx.lineTo(s * 0.82, s * 0.18);
      ctx.lineTo(s * 0.82, s * 0.78);
      ctx.lineTo(s * 0.6, s * 0.85);
      ctx.lineTo(s * 0.4, s * 0.78);
      ctx.lineTo(s * 0.18, s * 0.85);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s * 0.4, s * 0.18);
      ctx.lineTo(s * 0.4, s * 0.78);
      ctx.moveTo(s * 0.6, s * 0.25);
      ctx.lineTo(s * 0.6, s * 0.85);
      ctx.stroke();
      break;
    }

    case 'report': {
      // Diagnostic Bar Chart / Document
      ctx.fillStyle = color || '#ffffff';
      ctx.fillRect(s * 0.2, s * 0.6, s * 0.15, s * 0.25);
      ctx.fillRect(s * 0.42, s * 0.38, s * 0.15, s * 0.47);
      ctx.fillRect(s * 0.65, s * 0.2, s * 0.15, s * 0.65);
      break;
    }

    case 'settings': {
      // Gear / Cog
      ctx.fillStyle = color || '#ffffff';
      ctx.beginPath();
      ctx.arc(half, half, half * 0.6, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const gx = half + Math.cos(angle) * half * 0.75;
        const gy = half + Math.sin(angle) * half * 0.75;
        ctx.beginPath();
        ctx.arc(gx, gy, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(half, half, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'hint': {
      // Lightbulb (Hint)
      ctx.fillStyle = color || '#fbbf24';
      ctx.beginPath();
      ctx.arc(half, half * 0.7, s * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Bulb Base
      ctx.fillRect(half - s * 0.14, half * 0.85, s * 0.28, s * 0.22);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(half - s * 0.1, s * 0.72, s * 0.2, s * 0.08);
      break;
    }

    case 'speaker': {
      // Speaker Audio Icon
      ctx.fillStyle = color || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(s * 0.18, half * 0.75);
      ctx.lineTo(half * 0.7, half * 0.75);
      ctx.lineTo(s * 0.65, s * 0.2);
      ctx.lineTo(s * 0.65, s * 0.8);
      ctx.lineTo(half * 0.7, half * 1.25);
      ctx.lineTo(s * 0.18, half * 1.25);
      ctx.closePath();
      ctx.fill();

      // Sound waves
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = Math.max(1, s * 0.08);
      ctx.beginPath();
      ctx.arc(half * 0.9, half, s * 0.22, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(half * 0.9, half, s * 0.36, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      break;
    }

    case 'back': {
      // Left Arrow
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.65, s * 0.2);
      ctx.lineTo(s * 0.3, half);
      ctx.lineTo(s * 0.65, s * 0.8);
      ctx.stroke();
      break;
    }

    case 'close': {
      // Close Cross
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.25, s * 0.25);
      ctx.lineTo(s * 0.75, s * 0.75);
      ctx.moveTo(s * 0.75, s * 0.25);
      ctx.lineTo(s * 0.25, s * 0.75);
      ctx.stroke();
      break;
    }

    case 'retry': {
      // Circular Refresh Arrow
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = Math.max(2, s * 0.1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(half, half, half * 0.65, Math.PI * 0.2, Math.PI * 1.8);
      ctx.stroke();

      ctx.fillStyle = color || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(s * 0.75, half * 0.6);
      ctx.lineTo(s * 0.9, half * 0.35);
      ctx.lineTo(s * 0.62, half * 0.3);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'next': {
      // Right Arrow
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.35, s * 0.2);
      ctx.lineTo(s * 0.7, half);
      ctx.lineTo(s * 0.35, s * 0.8);
      ctx.stroke();
      break;
    }

    default:
      ctx.fillStyle = color || '#ffffff';
      ctx.fillRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6);
  }

  ctx.restore();
}

export function registerAllVectorIcons(scene: Phaser.Scene): void {
  if (!scene.textures) return;

  const iconNames: IconName[] = [
    'coin',
    'gem',
    'star',
    'chinese',
    'math',
    'english',
    'check',
    'cross',
    'lock',
    'trophy',
    'home',
    'map',
    'report',
    'settings',
    'retry',
    'next',
    'sound_on',
    'sound_off',
    'hint',
    'back',
    'close',
    'speaker',
    'shop',
    'rocket',
    'play',
    'pause',
    'wardrobe',
    'pet',
    'skip',
  ];

  const sizes: IconSize[] = [20, 24, 32, 48];

  for (const name of iconNames) {
    for (const size of sizes) {
      const key = getIconTextureKey(name, size);
      if (scene.textures.exists(key)) continue;

      if (typeof scene.textures.createCanvas === 'function') {
        const canvas = scene.textures.createCanvas(key, size, size);
        if (canvas) {
          const ctx = canvas.getContext();
          if (ctx) {
            drawVectorIcon(ctx, name, size);
            canvas.refresh();
          }
        }
      }
    }
  }
}
