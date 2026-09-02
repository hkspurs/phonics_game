import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCharacterPixels } from './validate-character-assets.mjs';

function createSyntheticBuffer(width = 512, height = 512) {
  return Buffer.alloc(width * height * 4); // all transparent
}

function drawRect(buffer, x0, y0, w, h, alpha = 255) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (x >= 0 && x < 512 && y >= 0 && y < 512) {
        const idx = (y * 512 + x) * 4;
        buffer[idx] = 100;     // R
        buffer[idx + 1] = 150; // G
        buffer[idx + 2] = 200; // B
        buffer[idx + 3] = alpha; // A
      }
    }
  }
}

test('Synthetic validator tests', async (t) => {
  await t.test('passes for a perfectly centered, connected, grounded figure', () => {
    const buffer = createSyntheticBuffer();
    // Body: w=200, h=360, minX=156, maxX=355 -> center=(156+355)/2=255.5 (range 252-260)
    // minY=96, maxY=455 (grounded baseline 452-460)
    drawRect(buffer, 156, 96, 200, 360, 255);
    const result = analyzeCharacterPixels(buffer, 'idle_front');
    assert.equal(result.valid, true, `Expected valid, got errors: ${result.errors.join(', ')}`);
    assert.equal(result.connectedPercentage, 100);
  });

  await t.test('fails for a fully opaque canvas', () => {
    const buffer = createSyntheticBuffer();
    buffer.fill(255); // 100% opaque
    const result = analyzeCharacterPixels(buffer, 'idle_front');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('transparent') || e.includes('Outer-canvas')));
  });

  await t.test('fails for an off-centre figure', () => {
    const buffer = createSyntheticBuffer();
    // Shifted far right: minX=280, maxX=400 -> center=340
    drawRect(buffer, 280, 96, 120, 360, 255);
    const result = analyzeCharacterPixels(buffer, 'run');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('centre X')));
  });

  await t.test('fails for an incorrect baseline (floating)', () => {
    const buffer = createSyntheticBuffer();
    // Floats at y=300
    drawRect(buffer, 156, 50, 200, 250, 255);
    const result = analyzeCharacterPixels(buffer, 'idle_front');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('foot baseline')));
  });

  await t.test('fails for disconnected body components (floating head)', () => {
    const buffer = createSyntheticBuffer();
    // Main body: 6000 pixels
    drawRect(buffer, 156, 200, 100, 256, 255);
    // Floating head separate by 50px transparent gap: 4000 pixels
    drawRect(buffer, 176, 70, 60, 60, 255);
    const result = analyzeCharacterPixels(buffer, 'idle_side');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Disconnected body parts')));
  });

  await t.test('passes for airborne jump below ground guide', () => {
    const buffer = createSyntheticBuffer();
    // Jump: maxY = 410 (<= 440)
    drawRect(buffer, 156, 90, 200, 320, 255);
    const result = analyzeCharacterPixels(buffer, 'jump');
    assert.equal(result.valid, true, `Expected jump valid, got: ${result.errors.join(', ')}`);
  });
});
