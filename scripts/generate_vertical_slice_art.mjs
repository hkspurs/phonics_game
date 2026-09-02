import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('🚀 Launching Playwright Canvas Render Engine for Vertical Slice Art...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Create standard 512x512 canvas in page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; background: transparent;">
        <canvas id="c" width="512" height="512"></canvas>
      </body>
    </html>
  `);

  // Target directories
  const adventurerDir = path.join(rootDir, 'public/assets/characters/adventurer/sprites');
  const heroineDir = path.join(rootDir, 'public/assets/characters/heroine/sprites');
  const schoolOutfitDir = path.join(rootDir, 'public/assets/character/outfits/school_uniform');
  const petDir = path.join(rootDir, 'public/assets/pets/mecha_cat');

  [adventurerDir, heroineDir, schoolOutfitDir, petDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const scriptContent = `
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');

    // Drawing Helper: Inking & Outline
    function strokeAndFill(pathFn, fillStyle, strokeStyle = '#2d1a0e', lineWidth = 3) {
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

    // Drawing Helper: Cel-Shading Shadow
    function drawShading(pathFn, shadowColor = 'rgba(45, 26, 14, 0.15)') {
      ctx.save();
      ctx.beginPath();
      pathFn();
      ctx.fillStyle = shadowColor;
      ctx.fill();
      ctx.restore();
    }

    // Helper: Star Highlight
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

    // Clear Canvas
    function clear() {
      ctx.clearRect(0, 0, 512, 512);
    }

    // Draw Master Chibi Face & Head
    function drawHead(cx, cy, charType, expression = 'smile') {
      const isHeroine = charType === 'heroine';
      const skinBase = '#fcd5b5';
      const skinShadow = '#e8a87c';
      const hairBase = isHeroine ? '#dc2626' : '#a16207';
      const hairShadow = isHeroine ? '#991b1b' : '#78350f';
      const hairGloss = isHeroine ? '#fca5a5' : '#fef08a';

      // 1. Back Hair
      strokeAndFill(() => {
        ctx.arc(cx, cy - 5, 84, 0, Math.PI * 2);
      }, hairShadow, '#2d1a0e', 3.5);

      if (isHeroine) {
        // Heroine twin side-tufts
        strokeAndFill(() => {
          ctx.ellipse(cx - 75, cy + 25, 24, 45, -0.3, 0, Math.PI * 2);
          ctx.ellipse(cx + 75, cy + 25, 24, 45, 0.3, 0, Math.PI * 2);
        }, hairBase, '#2d1a0e', 3);
      }

      // 2. Face Base (Head Shape)
      strokeAndFill(() => {
        ctx.moveTo(cx - 65, cy - 30);
        ctx.bezierCurveTo(cx - 75, cy + 35, cx - 45, cy + 70, cx, cy + 72);
        ctx.bezierCurveTo(cx + 45, cy + 70, cx + 75, cy + 35, cx + 65, cy - 30);
        ctx.bezierCurveTo(cx + 50, cy - 80, cx - 50, cy - 80, cx - 65, cy - 30);
      }, skinBase, '#2d1a0e', 3);

      // Face Shadow (Right & Under Jaw)
      drawShading(() => {
        ctx.moveTo(cx, cy + 72);
        ctx.bezierCurveTo(cx + 45, cy + 70, cx + 75, cy + 35, cx + 65, cy - 10);
        ctx.quadraticCurveTo(cx + 30, cy + 50, cx, cy + 72);
      });

      // 3. Cheerful Blush
      ctx.save();
      ctx.fillStyle = 'rgba(248, 113, 113, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx - 45, cy + 22, 16, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 45, cy + 22, 16, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Eyes & Eyebrows
      if (expression === 'hurt') {
        // Hurt > < eyes
        ctx.save();
        ctx.strokeStyle = '#2d1a0e';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        // Left >
        ctx.beginPath();
        ctx.moveTo(cx - 52, cy - 2);
        ctx.lineTo(cx - 36, cy + 8);
        ctx.lineTo(cx - 52, cy + 18);
        ctx.stroke();
        // Right <
        ctx.beginPath();
        ctx.moveTo(cx + 52, cy - 2);
        ctx.lineTo(cx + 36, cy + 8);
        ctx.lineTo(cx + 52, cy + 18);
        ctx.stroke();
        ctx.restore();
      } else if (expression === 'cheer' || expression === 'celebration') {
        // Joyous curved arc eyes ^ ^
        ctx.save();
        ctx.strokeStyle = '#2d1a0e';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx - 38, cy + 12, 18, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 38, cy + 12, 18, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.restore();
      } else {
        // Standard large water-sparkle anime eyes
        [-38, 38].forEach((eyeX, idx) => {
          const ex = cx + eyeX;
          const ey = cy + 6;
          // Outer eye contour
          strokeAndFill(() => {
            ctx.ellipse(ex, ey, 17, 22, 0, 0, Math.PI * 2);
          }, '#1e1b4b', '#2d1a0e', 2.5);

          // Iris gradient
          const irisGrad = ctx.createLinearGradient(ex, ey - 22, ex, ey + 22);
          irisGrad.addColorStop(0, isHeroine ? '#991b1b' : '#1e3a8a');
          irisGrad.addColorStop(1, isHeroine ? '#f87171' : '#60a5fa');
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(ex, ey + 4, 13, 16, 0, 0, Math.PI * 2);
          ctx.fillStyle = irisGrad;
          ctx.fill();

          // Dual starburst & dot highlights
          drawStar(ex - 4, ey - 6, 6, '#ffffff');
          ctx.beginPath();
          ctx.arc(ex + 5, ey + 8, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();

          // Eyelashes & Upper Lid
          ctx.save();
          ctx.strokeStyle = '#2d1a0e';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(ex, ey - 10, 20, Math.PI * 1.2, Math.PI * 1.8);
          ctx.stroke();
          ctx.restore();
        });
      }

      // 5. Mouth
      ctx.save();
      ctx.strokeStyle = '#2d1a0e';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (expression === 'cheer' || expression === 'celebration') {
        // Open laughing mouth
        ctx.arc(cx, cy + 34, 14, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (expression === 'hurt') {
        // Small wavy sad mouth
        ctx.arc(cx, cy + 42, 10, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        // Cheerful sweet smile
        ctx.arc(cx, cy + 30, 10, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();

      // 6. Front Bangs & Fluffy Hair
      strokeAndFill(() => {
        ctx.moveTo(cx - 75, cy - 25);
        ctx.quadraticCurveTo(cx - 60, cy + 10, cx - 45, cy + 2);
        ctx.quadraticCurveTo(cx - 25, cy + 20, cx - 15, cy - 5);
        ctx.quadraticCurveTo(cx + 10, cy + 22, cx + 25, cy - 2);
        ctx.quadraticCurveTo(cx + 50, cy + 15, cx + 75, cy - 25);
        ctx.bezierCurveTo(cx + 80, cy - 85, cx - 80, cy - 85, cx - 75, cy - 25);
      }, hairBase, '#2d1a0e', 3.5);

      // Hair Gloss Crescent (45° lighting reflection)
      ctx.save();
      ctx.strokeStyle = hairGloss;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx - 20, cy - 48, 42, Math.PI * 1.15, Math.PI * 1.7);
      ctx.stroke();
      ctx.restore();

      // Signature Head Gear (Adventurer Goggles / Heroine Tiara)
      if (!isHeroine) {
        // Adventurer Golden Goggles on forehead
        strokeAndFill(() => {
          ctx.roundRect(cx - 58, cy - 65, 45, 26, 8);
          ctx.roundRect(cx + 13, cy - 65, 45, 26, 8);
        }, '#fbbf24', '#2d1a0e', 3);
        // Strap
        ctx.save();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 78, cy - 52);
        ctx.lineTo(cx - 58, cy - 52);
        ctx.moveTo(cx + 58, cy - 52);
        ctx.lineTo(cx + 78, cy - 52);
        ctx.stroke();
        // Lenses
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx - 50, cy - 59, 29, 14);
        ctx.fillRect(cx + 21, cy - 59, 29, 14);
        ctx.restore();
      } else {
        // Heroine Emerald/Ruby Headband
        strokeAndFill(() => {
          ctx.arc(cx, cy - 42, 68, Math.PI * 1.1, Math.PI * 1.9);
        }, null, '#fbbf24', 6);
        drawStar(cx, cy - 70, 8, '#38bdf8');
      }
    }

    // Draw Master Body, Costume & Pose
    function drawCharacter(charType, pose) {
      clear();
      const cx = 256;
      const isHeroine = charType === 'heroine';
      const mainColor = isHeroine ? '#dc2626' : '#2563eb';
      const secColor = isHeroine ? '#fef08a' : '#f59e0b';

      let headY = 175;
      let bodyOffset = 0;
      let expression = 'smile';

      if (pose === 'run') {
        headY = 170;
        bodyOffset = 4;
      } else if (pose === 'jump') {
        headY = 155;
        bodyOffset = -20;
      } else if (pose === 'landing') {
        headY = 188;
        bodyOffset = 12;
      } else if (pose === 'cheer' || pose === 'celebration') {
        headY = 168;
        expression = 'cheer';
      } else if (pose === 'hurt') {
        headY = 178;
        expression = 'hurt';
      }

      // 1. Legs & Shoes (Ground Baseline Y=460)
      if (pose === 'run') {
        // Dynamic running legs
        strokeAndFill(() => {
          // Left leg back
          ctx.moveTo(cx - 20, 350 + bodyOffset);
          ctx.lineTo(cx - 55, 415 + bodyOffset);
          ctx.lineTo(cx - 75, 440 + bodyOffset);
          // Left shoe
          ctx.roundRect(cx - 95, 435 + bodyOffset, 38, 22, 8);
          // Right leg forward
          ctx.moveTo(cx + 20, 350 + bodyOffset);
          ctx.lineTo(cx + 45, 410 + bodyOffset);
          ctx.lineTo(cx + 60, 455);
          // Right shoe on baseline Y=460
          ctx.roundRect(cx + 40, 442, 44, 20, 8);
        }, '#fcd5b5', '#2d1a0e', 3);

        // Shoes color
        strokeAndFill(() => {
          ctx.roundRect(cx - 95, 435 + bodyOffset, 38, 22, 8);
          ctx.roundRect(cx + 40, 442, 44, 20, 8);
        }, '#e11d48', '#2d1a0e', 3);
      } else if (pose === 'jump') {
        // Tucked jumping legs
        strokeAndFill(() => {
          ctx.roundRect(cx - 48, 385 + bodyOffset, 36, 48, 10);
          ctx.roundRect(cx + 12, 385 + bodyOffset, 36, 48, 10);
        }, '#e11d48', '#2d1a0e', 3);
      } else if (pose === 'landing') {
        // Wide squatted stance
        strokeAndFill(() => {
          ctx.roundRect(cx - 65, 436, 48, 24, 8);
          ctx.roundRect(cx + 17, 436, 48, 24, 8);
        }, '#e11d48', '#2d1a0e', 3);
      } else {
        // Standing straight on baseline Y=460
        strokeAndFill(() => {
          // Legs
          ctx.roundRect(cx - 36, 350 + bodyOffset, 28, 85, 6);
          ctx.roundRect(cx + 8, 350 + bodyOffset, 28, 85, 6);
        }, '#fcd5b5', '#2d1a0e', 3);

        // Shoes
        strokeAndFill(() => {
          ctx.roundRect(cx - 42, 436 + bodyOffset, 36, 24, 8);
          ctx.roundRect(cx + 6, 436 + bodyOffset, 36, 24, 8);
        }, '#e11d48', '#2d1a0e', 3);
      }

      // 2. Torso / Master Outfit (Upper body)
      strokeAndFill(() => {
        ctx.moveTo(cx - 48, 265 + bodyOffset);
        ctx.lineTo(cx + 48, 265 + bodyOffset);
        ctx.lineTo(cx + 42, 350 + bodyOffset);
        ctx.lineTo(cx - 42, 350 + bodyOffset);
        ctx.closePath();
      }, mainColor, '#2d1a0e', 3);

      // Shirt Inner & Scarf/Belt
      strokeAndFill(() => {
        ctx.moveTo(cx, 265 + bodyOffset);
        ctx.lineTo(cx - 16, 305 + bodyOffset);
        ctx.lineTo(cx + 16, 305 + bodyOffset);
        ctx.closePath();
      }, '#ffffff', '#2d1a0e', 2);

      // Belt
      strokeAndFill(() => {
        ctx.roundRect(cx - 43, 340 + bodyOffset, 86, 16, 4);
      }, '#78350f', '#2d1a0e', 2.5);
      strokeAndFill(() => {
        ctx.roundRect(cx - 10, 337 + bodyOffset, 20, 22, 4);
      }, secColor, '#2d1a0e', 2);

      // 3. Arms & Hands
      if (pose === 'cheer' || pose === 'celebration') {
        // Raised arms
        strokeAndFill(() => {
          ctx.moveTo(cx - 45, 270 + bodyOffset);
          ctx.lineTo(cx - 78, 205 + bodyOffset);
          ctx.lineTo(cx - 56, 195 + bodyOffset);
          ctx.lineTo(cx - 32, 260 + bodyOffset);
          // Left hand fist
          ctx.arc(cx - 72, 190 + bodyOffset, 14, 0, Math.PI * 2);

          ctx.moveTo(cx + 45, 270 + bodyOffset);
          ctx.lineTo(cx + 78, 205 + bodyOffset);
          ctx.lineTo(cx + 56, 195 + bodyOffset);
          ctx.lineTo(cx + 32, 260 + bodyOffset);
          // Right hand fist
          ctx.arc(cx + 72, 190 + bodyOffset, 14, 0, Math.PI * 2);
        }, mainColor, '#2d1a0e', 3);
      } else if (pose === 'run') {
        // Running arms swing
        strokeAndFill(() => {
          // Left arm forward
          ctx.moveTo(cx - 45, 270 + bodyOffset);
          ctx.lineTo(cx - 72, 300 + bodyOffset);
          ctx.arc(cx - 72, 300 + bodyOffset, 14, 0, Math.PI * 2);

          // Right arm back
          ctx.moveTo(cx + 45, 270 + bodyOffset);
          ctx.lineTo(cx + 65, 315 + bodyOffset);
          ctx.arc(cx + 65, 315 + bodyOffset, 14, 0, Math.PI * 2);
        }, mainColor, '#2d1a0e', 3);
      } else {
        // Standing arms at sides
        strokeAndFill(() => {
          ctx.roundRect(cx - 68, 268 + bodyOffset, 24, 68, 10);
          ctx.roundRect(cx + 44, 268 + bodyOffset, 24, 68, 10);
        }, mainColor, '#2d1a0e', 3);
        // Hands
        strokeAndFill(() => {
          ctx.arc(cx - 56, 342 + bodyOffset, 12, 0, Math.PI * 2);
          ctx.arc(cx + 56, 342 + bodyOffset, 12, 0, Math.PI * 2);
        }, '#fcd5b5', '#2d1a0e', 2.5);
      }

      // 4. Draw Master Head on top
      drawHead(cx, headY, charType, expression);

      // Celebration Star Sparkles
      if (pose === 'celebration') {
        drawStar(cx - 100, headY - 40, 14, '#facc15');
        drawStar(cx + 105, headY - 35, 16, '#facc15');
        drawStar(cx, headY - 110, 20, '#fbbf24');
      }

      return canvas.toDataURL('image/png');
    }

    // Draw Dedicated School Uniform Outfit Layer
    function drawSchoolUniformOutfit(pose) {
      clear();
      const cx = 256;
      let bodyOffset = 0;
      if (pose === 'run') bodyOffset = 4;
      else if (pose === 'jump') bodyOffset = -20;
      else if (pose === 'landing') bodyOffset = 12;

      // 1. Navy Blazer & Vest
      strokeAndFill(() => {
        ctx.moveTo(cx - 50, 265 + bodyOffset);
        ctx.lineTo(cx + 50, 265 + bodyOffset);
        ctx.lineTo(cx + 45, 355 + bodyOffset);
        ctx.lineTo(cx - 45, 355 + bodyOffset);
        ctx.closePath();
      }, '#1e3a8a', '#2d1a0e', 3);

      // 2. White Inner Shirt & Striped Tie
      strokeAndFill(() => {
        ctx.moveTo(cx - 20, 265 + bodyOffset);
        ctx.lineTo(cx + 20, 265 + bodyOffset);
        ctx.lineTo(cx, 310 + bodyOffset);
        ctx.closePath();
      }, '#ffffff', '#2d1a0e', 2);

      // Red Tie
      strokeAndFill(() => {
        ctx.moveTo(cx - 6, 275 + bodyOffset);
        ctx.lineTo(cx + 6, 275 + bodyOffset);
        ctx.lineTo(cx + 10, 325 + bodyOffset);
        ctx.lineTo(cx, 335 + bodyOffset);
        ctx.lineTo(cx - 10, 325 + bodyOffset);
        ctx.closePath();
      }, '#dc2626', '#2d1a0e', 2);

      // Gold Buttons
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(cx - 16, 330 + bodyOffset, 4, 0, Math.PI * 2);
      ctx.arc(cx + 16, 330 + bodyOffset, 4, 0, Math.PI * 2);
      ctx.fill();

      // 3. Pleated Skirt / Tailored Shorts
      strokeAndFill(() => {
        ctx.moveTo(cx - 48, 350 + bodyOffset);
        ctx.lineTo(cx + 48, 350 + bodyOffset);
        ctx.lineTo(cx + 62, 395 + bodyOffset);
        ctx.lineTo(cx - 62, 395 + bodyOffset);
        ctx.closePath();
      }, '#1e293b', '#2d1a0e', 3);

      // Pleat creases
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      for (let x = -35; x <= 35; x += 14) {
        ctx.beginPath();
        ctx.moveTo(cx + x * 0.8, 352 + bodyOffset);
        ctx.lineTo(cx + x * 1.25, 393 + bodyOffset);
        ctx.stroke();
      }
      ctx.restore();

      return canvas.toDataURL('image/png');
    }

    // Draw Companion Pet (Mecha Cat)
    function drawMechaCat(pose) {
      clear();
      const cx = 256;
      const cy = 256;

      // Hover Jet Thruster Glow
      ctx.save();
      const glowGrad = ctx.createRadialGradient(cx, cy + 85, 5, cx, cy + 85, 45);
      glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
      glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy + 85, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Metallic Body
      strokeAndFill(() => {
        ctx.roundRect(cx - 50, cy - 10, 100, 80, 28);
      }, '#93c5fa', '#1e3a8a', 3.5);

      // Cute Robotic Cat Head
      strokeAndFill(() => {
        ctx.ellipse(cx, cy - 40, 75, 60, 0, 0, Math.PI * 2);
      }, '#bfdbfe', '#1e3a8a', 3.5);

      // Triangular Robotic Ears with Golden Antennae
      strokeAndFill(() => {
        // Left ear
        ctx.moveTo(cx - 60, cy - 75);
        ctx.lineTo(cx - 40, cy - 120);
        ctx.lineTo(cx - 15, cy - 85);
        ctx.closePath();
        // Right ear
        ctx.moveTo(cx + 60, cy - 75);
        ctx.lineTo(cx + 40, cy - 120);
        ctx.lineTo(cx + 15, cy - 85);
        ctx.closePath();
      }, '#60a5fa', '#1e3a8a', 3.5);

      // Golden Ear Inserts
      strokeAndFill(() => {
        ctx.moveTo(cx - 50, cy - 80);
        ctx.lineTo(cx - 38, cy - 110);
        ctx.lineTo(cx - 25, cy - 85);
        ctx.closePath();
        ctx.moveTo(cx + 50, cy - 80);
        ctx.lineTo(cx + 38, cy - 110);
        ctx.lineTo(cx + 25, cy - 85);
        ctx.closePath();
      }, '#fbbf24', '#b45309', 2);

      // Cyan Digital Visor Eyes
      strokeAndFill(() => {
        ctx.roundRect(cx - 52, cy - 55, 104, 34, 14);
      }, '#0f172a', '#1e3a8a', 2.5);

      // Glowing Cyan Eye Shapes
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      if (pose === 'cheer') {
        // Happy ^ ^ visor lights
        ctx.arc(cx - 24, cy - 40, 10, Math.PI * 1.2, Math.PI * 1.8);
        ctx.arc(cx + 24, cy - 40, 10, Math.PI * 1.2, Math.PI * 1.8);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
      } else {
        ctx.ellipse(cx - 24, cy - 38, 10, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 24, cy - 38, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Cat Whiskers
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      [-1, 1].forEach(side => {
        ctx.beginPath();
        ctx.moveTo(cx + side * 45, cy - 25);
        ctx.lineTo(cx + side * 75, cy - 28);
        ctx.moveTo(cx + side * 45, cy - 15);
        ctx.lineTo(cx + side * 75, cy - 12);
        ctx.stroke();
      });
      ctx.restore();

      // Paws
      strokeAndFill(() => {
        ctx.ellipse(cx - 30, cy + 55, 14, 18, -0.2, 0, Math.PI * 2);
        ctx.ellipse(cx + 30, cy + 55, 14, 18, 0.2, 0, Math.PI * 2);
      }, '#ffffff', '#1e3a8a', 3);

      return canvas.toDataURL('image/png');
    }

    window.drawCharacter = drawCharacter;
    window.drawSchoolUniformOutfit = drawSchoolUniformOutfit;
    window.drawMechaCat = drawMechaCat;
  `;

  await page.evaluate(scriptContent);

  const poses = ['idle_front', 'idle_side', 'run', 'jump', 'landing', 'cheer', 'hurt', 'celebration', 'shop_preview'];

  // 1. Generate Adventurer Poses
  for (const pose of poses) {
    const dataUrl = await page.evaluate((p) => window.drawCharacter('adventurer', p), pose);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const targetFile = path.join(adventurerDir, `${pose}.png`);
    fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));
    console.log(`✅ Generated Adventurer: ${pose}.png`);
  }

  // 2. Generate Heroine Poses
  for (const pose of poses) {
    const dataUrl = await page.evaluate((p) => window.drawCharacter('heroine', p), pose);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const targetFile = path.join(heroineDir, `${pose}.png`);
    fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));
    console.log(`✅ Generated Heroine: ${pose}.png`);
  }

  // 3. Generate Complete School Uniform Outfit Poses
  const outfitPoses = ['idle', 'run', 'cheer', 'jump', 'celebration'];
  for (const pose of outfitPoses) {
    const dataUrl = await page.evaluate((p) => window.drawSchoolUniformOutfit(p), pose);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const targetFile = path.join(schoolOutfitDir, `${pose}.png`);
    fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));
    console.log(`✅ Generated School Uniform Outfit: ${pose}.png`);
  }

  // Also create outfit thumbnail
  const thumbUrl = await page.evaluate(() => window.drawSchoolUniformOutfit('idle'));
  fs.writeFileSync(path.join(schoolOutfitDir, 'thumbnail.png'), Buffer.from(thumbUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));

  // 4. Generate Equipped Pet: Mecha Cat
  const petPoses = ['idle', 'fly', 'cheer'];
  for (const pose of petPoses) {
    const dataUrl = await page.evaluate((p) => window.drawMechaCat(p), pose);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const targetFile = path.join(petDir, `${pose}.png`);
    fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));
    console.log(`✅ Generated Mecha Cat Pet: ${pose}.png`);
  }

  // Also create pet thumbnail
  const petThumbUrl = await page.evaluate(() => window.drawMechaCat('idle'));
  fs.writeFileSync(path.join(petDir, 'thumbnail.png'), Buffer.from(petThumbUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));

  await browser.close();
  console.log('🎉 Production-Quality Vertical Slice Generation Complete!');
}

main().catch(err => {
  console.error('❌ Error generating vertical slice:', err);
  process.exit(1);
});
