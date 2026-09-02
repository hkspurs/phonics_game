import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Decode 512x512 RGBA PNG using pure Node.js builtins (fs, path, zlib)
 */
export function decodePng(buffer) {
  if (buffer.length < 8) throw new Error('File too short to be a PNG');
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== signature[i]) throw new Error('Invalid PNG signature');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let compressionMethod = 0;
  let filterMethod = 0;
  let interlaceMethod = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      compressionMethod = data[10];
      filterMethod = data[11];
      interlaceMethod = data[12];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (width !== 512 || height !== 512) {
    throw new Error(`Expected 512x512, got ${width}x${height}`);
  }
  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`Expected 8-bit RGBA (colorType 6), got bitDepth ${bitDepth}, colorType ${colorType}`);
  }
  if (compressionMethod !== 0 || filterMethod !== 0 || interlaceMethod !== 0) {
    throw new Error('Unsupported PNG options (interlaced or non-standard compression)');
  }

  const compressedData = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressedData);

  const bytesPerPixel = 4;
  const rowBytes = width * bytesPerPixel;
  const expectedLength = height * (rowBytes + 1);

  if (decompressed.length !== expectedLength) {
    throw new Error(`Decompressed length mismatch: expected ${expectedLength}, got ${decompressed.length}`);
  }

  const rgba = Buffer.alloc(width * height * 4);
  const prevRow = Buffer.alloc(rowBytes);

  let srcOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcOffset++];
    const row = Buffer.alloc(rowBytes);

    for (let i = 0; i < rowBytes; i++) {
      const raw = decompressed[srcOffset++];
      const a = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0;
      const b = prevRow[i];
      const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;

      let val = 0;
      switch (filterType) {
        case 0: // None
          val = raw;
          break;
        case 1: // Sub
          val = (raw + a) & 0xff;
          break;
        case 2: // Up
          val = (raw + b) & 0xff;
          break;
        case 3: // Average
          val = (raw + Math.floor((a + b) / 2)) & 0xff;
          break;
        case 4: { // Paeth
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          let pr = c;
          if (pa <= pb && pa <= pc) pr = a;
          else if (pb <= pc) pr = b;
          val = (raw + pr) & 0xff;
          break;
        }
        default:
          throw new Error(`Unknown filter type ${filterType}`);
      }
      row[i] = val;
    }

    row.copy(prevRow);
    row.copy(rgba, y * rowBytes);
  }

  return { width, height, data: rgba };
}

/**
 * Analyze RGBA pixel buffer against Art Bible constraints
 */
export function analyzeCharacterPixels(rgbaBuffer, poseName = 'idle_front') {
  const width = 512;
  const height = 512;
  const totalPixels = width * height;

  let visibleCount = 0;
  let faintCount = 0;
  let transparentCount = 0;
  let outerEdgeOccupied = 0;
  let safeBoxViolations = 0;

  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  const visibleGrid = new Uint8Array(totalPixels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = rgbaBuffer[idx + 3];
      const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;

      if (alpha >= 16) {
        visibleCount++;
        visibleGrid[y * width + x] = 1;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        if (isEdge) outerEdgeOccupied++;
        if (x < 116 || x > 396 || y < 48 || y > 460) {
          safeBoxViolations++;
        }
      } else if (alpha > 0) {
        faintCount++;
        if (x < 116 || x > 396 || y < 48 || y > 460) {
          safeBoxViolations++;
        }
      } else {
        transparentCount++;
      }
    }
  }

  const boundW = maxX >= minX ? maxX - minX + 1 : 0;
  const boundH = maxY >= minY ? maxY - minY + 1 : 0;
  const centerX = minX + boundW / 2;
  const centerY = minY + boundH / 2;
  const transparentRatio = transparentCount / totalPixels;

  // Largest 4-connected component analysis (flood-fill BFS)
  let largestComponentSize = 0;
  const visited = new Uint8Array(totalPixels);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const pIdx = y * width + x;
      if (visibleGrid[pIdx] && !visited[pIdx]) {
        let currentSize = 0;
        const queue = [pIdx];
        visited[pIdx] = 1;

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          currentSize++;
          const cx = curr % width;
          const cy = Math.floor(curr / width);

          // 4-neighbors
          const neighbors = [];
          if (cx > 0) neighbors.push(curr - 1);
          if (cx < width - 1) neighbors.push(curr + 1);
          if (cy > 0) neighbors.push(curr - width);
          if (cy < height - 1) neighbors.push(curr + width);

          for (const n of neighbors) {
            if (visibleGrid[n] && !visited[n]) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }

        if (currentSize > largestComponentSize) {
          largestComponentSize = currentSize;
        }
      }
    }
  }

  const connectedRatio = visibleCount > 0 ? largestComponentSize / visibleCount : 0;

  // Rules evaluation
  const errors = [];

  if (outerEdgeOccupied > 0) {
    errors.push(`Outer-canvas edge pixels have alpha >= 16 (count: ${outerEdgeOccupied})`);
  }
  if (transparentRatio < 0.60) {
    errors.push(`Canvas is not sufficiently transparent (${(transparentRatio * 100).toFixed(1)}% < 60%)`);
  }
  if (safeBoxViolations > 64) {
    errors.push(`Safe-box (116-396, 48-460) violated by ${safeBoxViolations} pixels`);
  }
  if (visibleCount < 5000) {
    errors.push(`Visible pixel count too low (${visibleCount} < 5000)`);
  }
  if (boundW < 96 || boundH < 160) {
    errors.push(`Character bounds too small (${boundW}x${boundH})`);
  }
  if (centerX < 252 || centerX > 260) {
    errors.push(`Character centre X (${centerX.toFixed(1)}) outside allowable range 252-260`);
  }

  if (poseName === 'jump') {
    if (maxY > 440) {
      errors.push(`Jump pose must be airborne (maxY ${maxY} > 440)`);
    }
  } else {
    // Grounded poses
    if (maxY < 452 || maxY > 460) {
      errors.push(`Grounded pose foot baseline maxY (${maxY}) outside allowable range 452-460`);
    }
  }

  if (poseName === 'idle_front' || poseName === 'shop_preview') {
    if (boundW < 190 || boundW > 235 || boundH < 350 || boundH > 405) {
      errors.push(`Hero pose bounds (${boundW}x${boundH}) outside target 190-235 x 350-405`);
    }
  }

  if (connectedRatio < 0.995) {
    errors.push(`Disconnected body parts detected: largest component has ${(connectedRatio * 100).toFixed(2)}% of visible pixels (< 99.5%)`);
  }

  const suggestedDx = Math.round(256 - centerX);
  const targetMaxY = poseName === 'jump' ? 420 : 456;
  const suggestedDy = Math.round(targetMaxY - maxY);

  return {
    valid: errors.length === 0,
    errors,
    bounds: { minX, maxX, minY, maxY, width: boundW, height: boundH },
    centerX,
    centerY,
    baseline: maxY,
    visibleCount,
    faintCount,
    transparentPercentage: +(transparentRatio * 100).toFixed(2),
    connectedPercentage: +(connectedRatio * 100).toFixed(2),
    suggestedOffset: { dx: suggestedDx, dy: suggestedDy },
  };
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const character = process.argv[2] || 'adventurer';
  const poseFilter = process.argv.slice(3);

  const ALL_POSES = [
    'idle_front',
    'idle_side',
    'run',
    'jump',
    'landing',
    'cheer',
    'hurt',
    'celebration',
    'shop_preview',
  ];

  const targetPoses = poseFilter.length > 0 ? poseFilter : ALL_POSES;
  const basePath = path.resolve(process.cwd(), 'public/assets/characters', character, 'sprites');

  console.log(`\n🔍 Validating character: ${character} (${targetPoses.length} poses)`);
  console.log(`   Path: ${basePath}\n`);

  let allPassed = true;

  for (const pose of targetPoses) {
    const filename = `${pose}.png`;
    const filePath = path.join(basePath, filename);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ [${pose}] File not found: ${filePath}`);
      allPassed = false;
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const decoded = decodePng(buffer);
      const analysis = analyzeCharacterPixels(decoded.data, pose);

      if (analysis.valid) {
        console.log(`✅ [${pose}] VALID | Bounds: ${analysis.bounds.width}x${analysis.bounds.height} | Centre: ${analysis.centerX.toFixed(1)} | Base: ${analysis.baseline} | Trans: ${analysis.transparentPercentage}% | Conn: ${analysis.connectedPercentage}%`);
      } else {
        allPassed = false;
        console.error(`❌ [${pose}] FAILED`);
        console.error(`   Bounds: ${analysis.bounds.width}x${analysis.bounds.height} (minX:${analysis.bounds.minX}, maxX:${analysis.bounds.maxX}, minY:${analysis.bounds.minY}, maxY:${analysis.bounds.maxY})`);
        console.error(`   Centre X: ${analysis.centerX.toFixed(1)} | Baseline maxY: ${analysis.baseline}`);
        console.error(`   Suggested Offset: dx=${analysis.suggestedOffset.dx}, dy=${analysis.suggestedOffset.dy}`);
        for (const err of analysis.errors) {
          console.error(`   - ${err}`);
        }
      }
    } catch (e) {
      allPassed = false;
      console.error(`❌ [${pose}] Decode error: ${e.message}`);
    }
  }

  if (!allPassed) {
    console.error(`\n⛔ Asset validation failed for ${character}.\n`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All validated poses for ${character} strictly comply with the Art Bible!\n`);
    process.exit(0);
  }
}
