import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('🎨 Starting Playwright Canvas Engine for Full Character & Outfit Cast...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; background: transparent;">
        <canvas id="c" width="512" height="512"></canvas>
      </body>
    </html>
  `);

  const characters = ['adventurer', 'heroine', 'soldier', 'knight', 'ninja'];
  const outfits = ['school_uniform', 'scholar_gown', 'princess_dress', 'dino_onesie', 'magic_robe', 'star_hoodie'];
  const pets = ['mecha_cat', 'pixie_dragon', 'panda_cub', 'phoenix_chick'];

  // Ensure all output directories exist
  characters.forEach(char => {
    const p = path.join(rootDir, `public/assets/characters/${char}/sprites`);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  outfits.forEach(outfit => {
    const p = path.join(rootDir, `public/assets/character/outfits/${outfit}`);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    const p2 = path.join(rootDir, `public/assets/outfits/${outfit}`);
    if (!fs.existsSync(p2)) fs.mkdirSync(p2, { recursive: true });
  });

  pets.forEach(pet => {
    const p = path.join(rootDir, `public/assets/pets/${pet}`);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  // Inject render script into headless Chromium page
  await page.evaluate(`
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');

    function strokeAndFill(pathFn, fillStyle, strokeStyle = '#2d1a0e', lineWidth = 3.0) {
      ctx.save();
      ctx.beginPath();
      pathFn();
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle && lineWidth > 0) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawShading(pathFn, shadowColor = 'rgba(45, 26, 14, 0.15)') {
      ctx.save();
      ctx.beginPath();
      pathFn();
      ctx.fillStyle = shadowColor;
      ctx.fill();
      ctx.restore();
    }

    function drawStar(cx, cy, r, color = '#ffffff') {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 72 - 90) * Math.PI / 180;
        const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
        const x1 = cx + Math.cos(a1) * r;
        const y1 = cy + Math.sin(a1) * r;
        const x2 = cx + Math.cos(a2) * (r * 0.45);
        const y2 = cy + Math.sin(a2) * (r * 0.45);
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function clear() {
      ctx.clearRect(0, 0, 512, 512);
    }

    const PALETTES = {
      adventurer: { hair: '#a16207', hairShadow: '#78350f', top: '#0284c7', topShadow: '#0369a1', bottom: '#ca8a04', accent: '#16a34a' },
      heroine: { hair: '#dc2626', hairShadow: '#991b1b', top: '#e11d48', topShadow: '#be123c', bottom: '#9f1239', accent: '#f43f5e' },
      soldier: { hair: '#475569', hairShadow: '#334155', top: '#2563eb', topShadow: '#1d4ed8', bottom: '#1e293b', accent: '#3b82f6' },
      knight: { hair: '#3b82f6', hairShadow: '#1d4ed8', top: '#64748b', topShadow: '#475569', bottom: '#334155', accent: '#f59e0b' },
      ninja: { hair: '#0f172a', hairShadow: '#020617', top: '#1e293b', topShadow: '#0f172a', bottom: '#0f172a', accent: '#10b981' }
    };

    function drawHead(cx, cy, charType, expression = 'smile', facing = 'front') {
      const pal = PALETTES[charType] || PALETTES.adventurer;
      const skinBase = '#fcd5b5';
      const skinShadow = '#e8a87c';

      // 1. Hair Back
      if (charType === 'heroine') {
        // Twin Tails
        strokeAndFill(() => {
          ctx.ellipse(cx - 72, cy + 25, 26, 46, -0.3, 0, Math.PI * 2);
          ctx.ellipse(cx + 72, cy + 25, 26, 46, 0.3, 0, Math.PI * 2);
        }, pal.hairBase || pal.hair);
      } else if (charType === 'knight') {
        // Helm Feather
        strokeAndFill(() => {
          ctx.ellipse(cx, cy - 75, 14, 34, -0.2, 0, Math.PI * 2);
        }, '#f59e0b');
      }

      // 2. Head Base (Cheek & Chin)
      strokeAndFill(() => {
        ctx.arc(cx, cy, 76, 0, Math.PI * 2);
      }, skinBase);

      // Chin / Neck Shadow
      drawShading(() => {
        ctx.arc(cx, cy + 30, 52, 0, Math.PI);
      }, skinShadow);

      // 3. Cheeks Blush
      ctx.fillStyle = 'rgba(248, 113, 113, 0.35)';
      ctx.beginPath();
      ctx.arc(cx - 42, cy + 18, 14, 0, Math.PI * 2);
      ctx.arc(cx + 42, cy + 18, 14, 0, Math.PI * 2);
      ctx.fill();

      // 4. Eyes & Expressions
      if (expression === 'smile' || expression === 'cheer' || expression === 'celebration') {
        if (expression === 'cheer' || expression === 'celebration') {
          // Happy Joy Arc Eyes ^ ^
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#2d1a0e';
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx - 30, cy + 5, 15, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx + 30, cy + 5, 15, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        } else {
          // Big Chibi Anime Eyes
          strokeAndFill(() => {
            ctx.ellipse(cx - 30, cy + 5, 16, 22, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 30, cy + 5, 16, 22, 0, 0, Math.PI * 2);
          }, '#1e1b4b');

          // Iris Gradient Tone
          ctx.fillStyle = pal.accent || '#38bdf8';
          ctx.beginPath();
          ctx.arc(cx - 30, cy + 12, 11, 0, Math.PI * 2);
          ctx.arc(cx + 30, cy + 12, 11, 0, Math.PI * 2);
          ctx.fill();

          // Big Highlight & Secondary Glint
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 34, cy - 2, 6, 0, Math.PI * 2);
          ctx.arc(cx + 26, cy - 2, 6, 0, Math.PI * 2);
          ctx.arc(cx - 25, cy + 12, 3, 0, Math.PI * 2);
          ctx.arc(cx + 35, cy + 12, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Mouth
        ctx.strokeStyle = '#2d1a0e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (expression === 'cheer' || expression === 'celebration') {
          ctx.fillStyle = '#f43f5e';
          ctx.arc(cx, cy + 30, 14, 0, Math.PI);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.arc(cx, cy + 28, 9, 0.2, Math.PI - 0.2);
          ctx.stroke();
        }
      } else if (expression === 'hurt') {
        // > < Pain Eyes
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#2d1a0e';
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Left Eye >
        ctx.moveTo(cx - 42, cy - 4);
        ctx.lineTo(cx - 24, cy + 4);
        ctx.lineTo(cx - 42, cy + 12);
        // Right Eye <
        ctx.moveTo(cx + 42, cy - 4);
        ctx.lineTo(cx + 24, cy + 4);
        ctx.lineTo(cx + 42, cy + 12);
        ctx.stroke();

        // O mouth
        strokeAndFill(() => {
          ctx.ellipse(cx, cy + 30, 8, 12, 0, 0, Math.PI * 2);
        }, '#f43f5e');
      }

      // 5. Hair Front & Bangs / Headwear
      strokeAndFill(() => {
        if (charType === 'ninja') {
          // Ninja Cowl
          ctx.arc(cx, cy - 10, 78, Math.PI * 0.8, Math.PI * 2.2);
          ctx.lineTo(cx + 65, cy + 45);
          ctx.lineTo(cx - 65, cy + 45);
        } else if (charType === 'knight') {
          // Knight Helm
          ctx.arc(cx, cy - 15, 78, Math.PI * 0.85, Math.PI * 2.15);
          ctx.lineTo(cx + 60, cy + 10);
          ctx.lineTo(cx - 60, cy + 10);
        } else if (charType === 'soldier') {
          // Soldier Cap
          ctx.arc(cx, cy - 15, 78, Math.PI * 0.9, Math.PI * 2.1);
          ctx.lineTo(cx + 65, cy + 15);
          ctx.lineTo(cx - 65, cy + 15);
        } else {
          // Adventurer / Heroine Bangs
          ctx.arc(cx, cy - 10, 78, Math.PI * 0.85, Math.PI * 2.15);
          ctx.lineTo(cx + 55, cy + 5);
          ctx.lineTo(cx + 35, cy - 8);
          ctx.lineTo(cx + 15, cy + 12);
          ctx.lineTo(cx - 5, cy - 8);
          ctx.lineTo(cx - 25, cy + 12);
          ctx.lineTo(cx - 45, cy - 5);
          ctx.lineTo(cx - 65, cy + 10);
        }
      }, pal.hair);

      // Headwear Special Features
      if (charType === 'adventurer') {
        // Green Adventurer Explorer Cap
        strokeAndFill(() => {
          ctx.ellipse(cx, cy - 60, 68, 26, 0, 0, Math.PI * 2);
        }, '#16a34a');
        strokeAndFill(() => {
          ctx.ellipse(cx, cy - 54, 78, 12, 0, 0, Math.PI * 2);
        }, '#15803d');
        // Cap Golden Badge
        strokeAndFill(() => {
          ctx.arc(cx, cy - 60, 9, 0, Math.PI * 2);
        }, '#f59e0b');
      } else if (charType === 'soldier') {
        // Soldier Helmet Badge
        strokeAndFill(() => {
          ctx.rect(cx - 15, cy - 55, 30, 14);
        }, '#e2e8f0');
      } else if (charType === 'ninja') {
        // Ninja Forehead Protector
        strokeAndFill(() => {
          ctx.rect(cx - 36, cy - 35, 72, 18);
        }, '#94a3b8');
        strokeAndFill(() => {
          ctx.arc(cx, cy - 26, 5, 0, Math.PI * 2);
        }, '#10b981');
      }
    }

    function drawBody(cx, cy, charType, pose = 'idle') {
      const pal = PALETTES[charType] || PALETTES.adventurer;
      const skinBase = '#fcd5b5';

      if (pose === 'run') {
        // Running Dynamic Torso & Legs
        // Back Leg
        strokeAndFill(() => {
          ctx.roundRect(cx - 52, cy + 70, 24, 65, 10);
        }, pal.bottom);
        strokeAndFill(() => {
          ctx.ellipse(cx - 44, cy + 140, 18, 12, -0.3, 0, Math.PI * 2);
        }, '#991b1b');

        // Front Leg (Forward Step)
        strokeAndFill(() => {
          ctx.roundRect(cx + 18, cy + 60, 26, 68, 10);
        }, pal.bottom);
        strokeAndFill(() => {
          ctx.ellipse(cx + 34, cy + 135, 20, 13, 0.3, 0, Math.PI * 2);
        }, '#991b1b');

        // Torso
        strokeAndFill(() => {
          ctx.roundRect(cx - 36, cy + 10, 72, 70, 14);
        }, pal.top);

        // Arms Running Motion
        strokeAndFill(() => {
          ctx.roundRect(cx - 48, cy + 18, 20, 48, 8);
        }, skinBase);
        strokeAndFill(() => {
          ctx.roundRect(cx + 28, cy + 12, 20, 48, 8);
        }, skinBase);
      } else if (pose === 'jump') {
        // Jumping Air Torso & Legs Tucked
        strokeAndFill(() => {
          ctx.roundRect(cx - 40, cy + 58, 30, 52, 10);
          ctx.roundRect(cx + 10, cy + 58, 30, 52, 10);
        }, pal.bottom);
        // Feet
        strokeAndFill(() => {
          ctx.ellipse(cx - 26, cy + 115, 18, 12, 0.4, 0, Math.PI * 2);
          ctx.ellipse(cx + 26, cy + 115, 18, 12, -0.4, 0, Math.PI * 2);
        }, '#991b1b');

        // Torso
        strokeAndFill(() => {
          ctx.roundRect(cx - 36, cy, 72, 70, 14);
        }, pal.top);

        // Raised Arms \\ ^ /
        strokeAndFill(() => {
          ctx.roundRect(cx - 52, cy - 15, 20, 50, 8);
          ctx.roundRect(cx + 32, cy - 15, 20, 50, 8);
        }, skinBase);
      } else {
        // Standard Standing Body (Y=460 Foot Baseline Anchor)
        // Legs & Shoes (Ground baseline at Y=460)
        strokeAndFill(() => {
          ctx.roundRect(cx - 34, cy + 70, 26, 75, 10);
          ctx.roundRect(cx + 8, cy + 70, 26, 75, 10);
        }, pal.bottom);

        // Shoes resting on Y=460 baseline
        strokeAndFill(() => {
          ctx.ellipse(cx - 22, cy + 148, 22, 12, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 22, cy + 148, 22, 12, 0, 0, Math.PI * 2);
        }, '#991b1b');

        // Torso
        strokeAndFill(() => {
          ctx.roundRect(cx - 36, cy + 10, 72, 72, 14);
        }, pal.top);

        // Belt & Buckle
        strokeAndFill(() => {
          ctx.rect(cx - 36, cy + 62, 72, 14);
        }, '#78350f');
        strokeAndFill(() => {
          ctx.rect(cx - 12, cy + 59, 24, 20);
        }, '#f59e0b');

        if (pose === 'cheer' || pose === 'celebration') {
          // Arms Up Raised \o/
          strokeAndFill(() => {
            ctx.roundRect(cx - 54, cy - 10, 20, 52, 8);
            ctx.roundRect(cx + 34, cy - 10, 20, 52, 8);
          }, skinBase);
        } else {
          // Arms Down Idle
          strokeAndFill(() => {
            ctx.roundRect(cx - 48, cy + 18, 18, 55, 8);
            ctx.roundRect(cx + 30, cy + 18, 18, 55, 8);
          }, skinBase);
        }
      }
    }

    window.renderCharacterPose = function(charType, pose) {
      clear();
      const cx = 256;
      let headY = 175;
      let bodyY = 295;
      let expr = 'smile';

      if (pose === 'jump') {
        headY = 150;
        bodyY = 265;
        expr = 'cheer';
      } else if (pose === 'landing') {
        headY = 205;
        bodyY = 325;
        expr = 'smile';
      } else if (pose === 'cheer' || pose === 'celebration') {
        headY = 165;
        bodyY = 285;
        expr = 'cheer';
      } else if (pose === 'hurt') {
        headY = 180;
        bodyY = 300;
        expr = 'hurt';
      }

      // Draw Character Rig
      drawBody(cx, bodyY, charType, pose);
      drawHead(cx, headY, charType, expr);

      if (pose === 'celebration') {
        // Star Confetti & Celebration Sparkles
        drawStar(110, 130, 24, '#fde047');
        drawStar(400, 120, 28, '#fde047');
        drawStar(80, 260, 16, '#67e8f9');
        drawStar(430, 280, 20, '#ec4899');
        drawStar(256, 60, 26, '#ffd700');
      }

      return canvas.toDataURL('image/png');
    };

    window.renderOutfitPose = function(outfitId, pose) {
      clear();
      const cx = 256;
      let cy = 300;

      if (outfitId === 'school_uniform') {
        // Classic White Shirt & Navy Blue Vest
        strokeAndFill(() => {
          ctx.roundRect(cx - 36, cy - 20, 72, 70, 12);
        }, '#ffffff');
        // Navy Vest
        strokeAndFill(() => {
          ctx.moveTo(cx - 36, cy - 10);
          ctx.lineTo(cx - 15, cy + 25);
          ctx.lineTo(cx - 36, cy + 45);
        }, '#1e3a8a');
        strokeAndFill(() => {
          ctx.moveTo(cx + 36, cy - 10);
          ctx.lineTo(cx + 15, cy + 25);
          ctx.lineTo(cx + 36, cy + 45);
        }, '#1e3a8a');
        // Red Tie
        strokeAndFill(() => {
          ctx.moveTo(cx - 6, cy - 10);
          ctx.lineTo(cx + 6, cy - 10);
          ctx.lineTo(cx + 9, cy + 25);
          ctx.lineTo(cx, cy + 38);
          ctx.lineTo(cx - 9, cy + 25);
          ctx.closePath();
        }, '#dc2626');
        // Pleated Skirt
        strokeAndFill(() => {
          ctx.moveTo(cx - 42, cy + 45);
          ctx.lineTo(cx + 42, cy + 45);
          ctx.lineTo(cx + 52, cy + 85);
          ctx.lineTo(cx - 52, cy + 85);
          ctx.closePath();
        }, '#1e3a8a');
      } else if (outfitId === 'scholar_gown') {
        // Velvet Midnight Blue Academic Gown
        strokeAndFill(() => {
          ctx.moveTo(cx - 40, cy - 30);
          ctx.lineTo(cx + 40, cy - 30);
          ctx.lineTo(cx + 60, cy + 120);
          ctx.lineTo(cx - 60, cy + 120);
          ctx.closePath();
        }, '#1e1b4b');
        // Gold Ribbon Stole
        strokeAndFill(() => {
          ctx.moveTo(cx - 18, cy - 25);
          ctx.lineTo(cx - 12, cy + 80);
          ctx.lineTo(cx - 4, cy + 80);
          ctx.lineTo(cx - 8, cy - 25);
          ctx.closePath();
        }, '#f59e0b');
        strokeAndFill(() => {
          ctx.moveTo(cx + 18, cy - 25);
          ctx.lineTo(cx + 12, cy + 80);
          ctx.lineTo(cx + 4, cy + 80);
          ctx.lineTo(cx + 8, cy - 25);
          ctx.closePath();
        }, '#f59e0b');
      } else if (outfitId === 'princess_dress') {
        // Sparkly Rose Pink Royal Dress
        strokeAndFill(() => {
          ctx.roundRect(cx - 32, cy - 20, 64, 55, 10);
        }, '#ec4899');
        // Fluffy Princess Ballgown Skirt
        strokeAndFill(() => {
          ctx.moveTo(cx - 34, cy + 30);
          ctx.lineTo(cx + 34, cy + 30);
          ctx.bezierCurveTo(cx + 90, cy + 80, cx + 75, cy + 125, cx, cy + 125);
          ctx.bezierCurveTo(cx - 75, cy + 125, cx - 90, cy + 80, cx - 34, cy + 30);
          ctx.closePath();
        }, '#f472b6');
        // Gold Ribbon Trim
        drawStar(cx, cy - 5, 8, '#fde047');
      } else if (outfitId === 'dino_onesie') {
        // Green Dino Onesie
        strokeAndFill(() => {
          ctx.roundRect(cx - 44, cy - 30, 88, 140, 24);
        }, '#10b981');
        // Yellow Belly Patch
        strokeAndFill(() => {
          ctx.ellipse(cx, cy + 35, 26, 42, 0, 0, Math.PI * 2);
        }, '#fde047');
      } else if (outfitId === 'magic_robe') {
        // Starlight Violet Magic Robe
        strokeAndFill(() => {
          ctx.moveTo(cx - 42, cy - 30);
          ctx.lineTo(cx + 42, cy - 30);
          ctx.lineTo(cx + 65, cy + 125);
          ctx.lineTo(cx - 65, cy + 125);
          ctx.closePath();
        }, '#6366f1');
        // Astral Runes
        drawStar(cx - 25, cy + 40, 10, '#fde047');
        drawStar(cx + 25, cy + 60, 8, '#67e8f9');
        drawStar(cx, cy + 90, 12, '#ffd700');
      } else if (outfitId === 'star_hoodie') {
        // Pastel Cyan Star Hoodie
        strokeAndFill(() => {
          ctx.roundRect(cx - 40, cy - 25, 80, 80, 18);
        }, '#38bdf8');
        // Front Pocket
        strokeAndFill(() => {
          ctx.roundRect(cx - 24, cy + 20, 48, 25, 8);
        }, '#0284c7');
        // Big Center Star
        drawStar(cx, cy, 15, '#fde047');
      }

      return canvas.toDataURL('image/png');
    };

    window.renderPetPose = function(petId, pose) {
      clear();
      const cx = 256;
      const cy = 256;

      if (petId === 'mecha_cat') {
        // Mecha Cat Cyber Kitty
        strokeAndFill(() => {
          ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        }, '#e2e8f0');
        // Gold Antenna Ears
        strokeAndFill(() => {
          ctx.moveTo(cx - 45, cy - 50);
          ctx.lineTo(cx - 70, cy - 100);
          ctx.lineTo(cx - 20, cy - 65);
          ctx.closePath();
          ctx.moveTo(cx + 45, cy - 50);
          ctx.lineTo(cx + 70, cy - 100);
          ctx.lineTo(cx + 20, cy - 65);
          ctx.closePath();
        }, '#f59e0b');
        // Blue LED Visor
        strokeAndFill(() => {
          ctx.roundRect(cx - 48, cy - 15, 96, 28, 8);
        }, '#0284c7');
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(cx - 36, cy - 8, 25, 14);
        ctx.fillRect(cx + 11, cy - 8, 25, 14);
      } else if (petId === 'pixie_dragon') {
        // Lavender Pixie Dragon
        strokeAndFill(() => {
          ctx.ellipse(cx, cy, 65, 75, 0, 0, Math.PI * 2);
        }, '#c084fc');
        // Fairy Wings
        strokeAndFill(() => {
          ctx.ellipse(cx - 75, cy - 25, 35, 55, -0.4, 0, Math.PI * 2);
          ctx.ellipse(cx + 75, cy - 25, 35, 55, 0.4, 0, Math.PI * 2);
        }, '#67e8f9');
        // Turquoise Belly
        strokeAndFill(() => {
          ctx.ellipse(cx, cy + 20, 32, 40, 0, 0, Math.PI * 2);
        }, '#2dd4bf');
        // Big Cute Eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(cx - 24, cy - 15, 12, 0, Math.PI * 2);
        ctx.arc(cx + 24, cy - 15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 28, cy - 18, 5, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy - 18, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (petId === 'panda_cub') {
        // Panda Head
        strokeAndFill(() => {
          ctx.arc(cx, cy, 75, 0, Math.PI * 2);
        }, '#ffffff');
        // Black Ears
        strokeAndFill(() => {
          ctx.arc(cx - 55, cy - 60, 24, 0, Math.PI * 2);
          ctx.arc(cx + 55, cy - 60, 24, 0, Math.PI * 2);
        }, '#0f172a');
        // Black Eye Patches
        strokeAndFill(() => {
          ctx.ellipse(cx - 28, cy - 10, 18, 22, -0.2, 0, Math.PI * 2);
          ctx.ellipse(cx + 28, cy - 10, 18, 22, 0.2, 0, Math.PI * 2);
        }, '#0f172a');
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 28, cy - 14, 6, 0, Math.PI * 2);
        ctx.arc(cx + 28, cy - 14, 6, 0, Math.PI * 2);
        ctx.fill();
        // Nose & Mouth
        strokeAndFill(() => {
          ctx.ellipse(cx, cy + 20, 10, 7, 0, 0, Math.PI * 2);
        }, '#0f172a');
        // Green Headband
        strokeAndFill(() => {
          ctx.rect(cx - 70, cy - 40, 140, 14);
        }, '#10b981');
      } else if (petId === 'phoenix_chick') {
        // Fiery Amber Chick
        strokeAndFill(() => {
          ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        }, '#f59e0b');
        // Flame Crest
        strokeAndFill(() => {
          ctx.moveTo(cx - 25, cy - 60);
          ctx.lineTo(cx, cy - 110);
          ctx.lineTo(cx + 25, cy - 60);
          ctx.closePath();
        }, '#ef4444');
        // Beak
        strokeAndFill(() => {
          ctx.moveTo(cx - 15, cy + 10);
          ctx.lineTo(cx + 15, cy + 10);
          ctx.lineTo(cx, cy + 30);
          ctx.closePath();
        }, '#dc2626');
        // Big Shiny Eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(cx - 26, cy - 12, 12, 0, Math.PI * 2);
        ctx.arc(cx + 26, cy - 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 30, cy - 15, 5, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 15, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      return canvas.toDataURL('image/png');
    };
  `);

  const poses = ['idle_front', 'idle_side', 'run', 'jump', 'landing', 'cheer', 'hurt', 'celebration', 'shop_preview'];
  const outfitPoses = ['idle', 'run', 'cheer', 'jump', 'celebration', 'thumbnail'];
  const petPoses = ['idle', 'fly', 'cheer', 'thumbnail'];

  // Helper to save base64 PNG
  function savePng(filePath, base64Data) {
    const data = base64Data.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  }

  // 1. Generate All Characters (Adventurer, Heroine, Soldier, Knight, Ninja)
  for (const char of characters) {
    console.log(`👤 Generating 512x512 Master Art for Character: ${char}...`);
    for (const pose of poses) {
      const dataUrl = await page.evaluate(({ char, pose }) => {
        return window.renderCharacterPose(char, pose);
      }, { char, pose });
      const outPath = path.join(rootDir, `public/assets/characters/${char}/sprites/${pose}.png`);
      savePng(outPath, dataUrl);
    }
  }

  // 2. Generate All Major Outfits
  for (const outfit of outfits) {
    console.log(`👗 Generating 512x512 Master Art for Outfit: ${outfit}...`);
    for (const pose of outfitPoses) {
      const dataUrl = await page.evaluate(({ outfit, pose }) => {
        return window.renderOutfitPose(outfit, pose);
      }, { outfit, pose });
      const outPath1 = path.join(rootDir, `public/assets/character/outfits/${outfit}/${pose}.png`);
      savePng(outPath1, dataUrl);
      const outPath2 = path.join(rootDir, `public/assets/outfits/${outfit}/${pose}.png`);
      savePng(outPath2, dataUrl);
    }
  }

  // 3. Generate All Companion Pets
  for (const pet of pets) {
    console.log(`🐾 Generating 512x512 Master Art for Pet: ${pet}...`);
    for (const pose of petPoses) {
      const dataUrl = await page.evaluate(({ pet, pose }) => {
        return window.renderPetPose(pet, pose);
      }, { pet, pose });
      const outPath = path.join(rootDir, `public/assets/pets/${pet}/${pose}.png`);
      savePng(outPath, dataUrl);
    }
  }

  await browser.close();
  console.log('✅ Successfully generated all characters, outfits, and pets!');
}

main().catch(err => {
  console.error('❌ Error generating art:', err);
  process.exit(1);
});
