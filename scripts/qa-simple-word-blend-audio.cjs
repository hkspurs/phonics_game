const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'data/audio_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const blends = Object.values(manifest).filter((item) => item.curriculum === 'simple_word_blend');
let errors = 0;

function probe(file) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simple-word-blend-qa-'));
  const output = path.join(tempDir, 'probe.json');
  const fd = fs.openSync(output, 'w');
  try {
    const result = spawnSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels',
      '-of', 'json', file,
    ], { stdio: ['ignore', fd, 'inherit'] });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr || `ffprobe exited with ${result.status}`);
    return JSON.parse(fs.readFileSync(output, 'utf8'));
  } finally {
    fs.closeSync(fd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

if (!blends.length) {
  console.error('No simple word blend entries found. Run the blend generator first.');
  process.exit(1);
}

for (const item of blends) {
  const file = path.join(root, 'public', item.file);
  if (!fs.existsSync(file)) {
    console.error(`Missing ${item.id}: ${file}`);
    errors += 1;
    continue;
  }
  if (item.type !== 'phonics_blend' || item.generatedBy !== 'piper' || item.language !== 'en-GB') {
    console.error(`Invalid blend metadata for ${item.id}`);
    errors += 1;
    continue;
  }
  if (!/^\[\[[^\s\]]+\]\]$/.test(item.blendText || '')) {
    console.error(`Invalid raw IPA blend text for ${item.id}`);
    errors += 1;
    continue;
  }
  try {
    const info = probe(file);
    const stream = info.streams.find((candidate) => candidate.codec_name);
    const duration = Number(info.format.duration || 0);
    if (!stream || stream.codec_name !== 'mp3' || Number(stream.sample_rate) !== 24000 || Number(stream.channels) !== 1 || duration <= 0 || duration > 3) {
      console.error(`Invalid format for ${item.id}: expected mono 24kHz MP3 under 3 seconds.`);
      errors += 1;
      continue;
    }
    item.durationMs = Math.round(duration * 1000);
    item.sampleRate = Number(stream.sample_rate);
    item.channels = Number(stream.channels);
    item.format = 'mp3';
  } catch (error) {
    console.error(`Could not inspect ${item.id}: ${error.message}`);
    errors += 1;
  }
}

if (errors) process.exit(1);

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${blends.length} dedicated Simple Word blend files passed automated QA; qaStatus remains review_required.`);
