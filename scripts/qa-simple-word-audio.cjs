const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'data/audio_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const generated = Object.values(manifest).filter((item) => item.curriculum === 'simple_word' && item.generatedBy !== 'teacher_recording');
const markPass = process.argv.includes('--mark-pass');
const manualQa = process.argv.includes('--manual-qa');
const removeLegacy = process.argv.includes('--remove-legacy');
let errors = 0;

function probe(file) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simple-word-qa-'));
  const output = path.join(tempDir, 'probe.json');
  const fd = fs.openSync(output, 'w');
  try {
    const result = spawnSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels',
      '-of', 'json', file,
    ], { stdio: ['ignore', fd, 'inherit'] });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`ffprobe exited with ${result.status}`);
    return JSON.parse(fs.readFileSync(output, 'utf8'));
  } finally {
    fs.closeSync(fd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

if (!generated.length) {
  console.error('No generated Simple Word entries found. Run the generator first.');
  process.exit(1);
}

for (const item of generated) {
  const file = path.join(root, 'public', item.file);
  if (!fs.existsSync(file)) {
    console.error(`Missing ${item.id}: ${file}`);
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

if (markPass) {
  if (!manualQa) {
    console.error('Refusing to mark audio pass without --manual-qa after listening to every word.');
    process.exit(1);
  }
  for (const item of generated) {
    item.qaStatus = 'pass';
    item.qaNotes = [...(item.qaNotes || []), 'Automated format check passed.', 'Manual listening QA recorded.'];
  }
  if (removeLegacy) {
    for (const [id, item] of Object.entries(manifest)) {
      if (item.curriculum === 'simple_word' && item.generatedBy === 'teacher_recording') {
        const legacyFile = path.join(root, 'public', item.file);
        if (fs.existsSync(legacyFile)) fs.unlinkSync(legacyFile);
        delete manifest[id];
      }
    }
  }
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`${generated.length} generated Simple Word files passed automated QA${markPass ? ' and were marked pass' : ''}.`);
