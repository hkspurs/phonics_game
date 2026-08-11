const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const corpus = JSON.parse(fs.readFileSync(path.join(root, 'data/simple_words.json'), 'utf8'));
const manifestPath = path.join(root, 'data/audio_manifest.json');
const outputDir = path.join(root, 'public/assets/simple-words/blends');
const cvcPattern = /^[B-DF-HJ-NP-TV-XZ][AEIOU][B-DF-HJ-NP-TV-XZ]$/;
const BLEND_TEMPO = 0.8;

const VOWEL_PHONEMES = { A: 'æ', E: 'ɛ', I: 'ɪ', O: 'ɒ', U: 'ʌ' };
const CONSONANT_PHONEMES = {
  B: 'b', C: 'k', D: 'd', F: 'f', G: 'ɡ', H: 'h', J: 'dʒ', K: 'k',
  L: 'l', M: 'm', N: 'n', P: 'p', Q: 'k', R: 'ɹ', S: 's', T: 't',
  V: 'v', W: 'w', X: 'ks', Y: 'j', Z: 'z',
};
const CONTINUOUS_INITIALS = new Set(['f', 'h', 'l', 'm', 'n', 'r', 's', 'v', 'w', 'z']);

function buildRawBlendText(word) {
  const value = String(word).toUpperCase();
  if (!cvcPattern.test(value)) throw new Error(`Cannot blend non-CVC word: ${value}`);
  const initial = CONSONANT_PHONEMES[value[0]];
  const vowel = VOWEL_PHONEMES[value[1]];
  const final = CONSONANT_PHONEMES[value[2]];
  const heldInitial = CONTINUOUS_INITIALS.has(initial) ? initial.repeat(3) : initial;
  return `[[${heldInitial}${vowel.repeat(2)}${final}]]`;
}

function commandExists(command) {
  return Boolean(command) && spawnSync(command, ['--help'], { stdio: 'ignore' }).status === 0;
}

function selectEngine() {
  const command = process.env.PIPER_COMMAND || 'piper';
  const model = process.env.PIPER_MODEL || '';
  if (!model || !fs.existsSync(model) || !commandExists(command)) {
    throw new Error('Blend generation requires PIPER_MODEL and a working PIPER_COMMAND.');
  }
  return {
    name: 'piper',
    model,
    voice: process.env.PIPER_VOICE || path.basename(model),
    run(rawPhonemes, output) {
      execFileSync(command, ['-m', model, '-f', output, '--', rawPhonemes], { cwd: root, stdio: 'inherit' });
    },
  };
}

function normalizeToMp3(source, output) {
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-i', source, '-vn', '-ac', '1', '-ar', '24000',
    '-af', `atempo=${BLEND_TEMPO}`,
    '-map_metadata', '-1', '-codec:a', 'libmp3lame', '-b:a', '96k', output,
  ], { cwd: root, stdio: 'inherit' });
}

function createEntry(item, engine) {
  const word = item.word.toUpperCase();
  return {
    id: `BLEND_${word}_SLOW`,
    file: `assets/simple-words/blends/${String(item.sequence).padStart(3, '0')}_${word.toLowerCase()}_blend.mp3`,
    type: 'phonics_blend',
    curriculum: 'simple_word_blend',
    language: 'en-GB',
    expectedText: word,
    sequence: item.sequence,
    generatedBy: engine.name,
    voice: engine.voice,
    model: engine.model,
    source: 'Piper local neural TTS using raw IPA phonemes, slowed offline with pitch preserved',
    tempo: BLEND_TEMPO,
    license: process.env.TTS_LICENSE || 'verify the selected model license before publishing',
    blendText: buildRawBlendText(word),
    qaStatus: 'review_required',
    qaNotes: ['Generated as one dedicated continuous-blend utterance; manual listening QA is required before use.'],
  };
}

function mergeManifest(oldManifest, entries) {
  const merged = Object.fromEntries(
    Object.entries(oldManifest).map(([id, item]) => [id, entries[id] || item])
  );
  for (const [id, item] of Object.entries(entries)) {
    if (!merged[id]) merged[id] = item;
  }
  return merged;
}

function generate() {
  if (process.argv.includes('--help')) {
    console.log('PIPER_COMMAND=/path/to/piper PIPER_MODEL=/path/to/voice.onnx PIPER_VOICE=en_GB-alan-medium node scripts/generate-simple-word-blend-audio.cjs');
    return;
  }
  if (!corpus.length || corpus.some((item) => !cvcPattern.test(item.word))) {
    throw new Error('data/simple_words.json contains a non-regular CVC word.');
  }

  const engine = selectEngine();
  fs.mkdirSync(outputDir, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simple-word-blend-audio-'));
  const entries = {};

  try {
    for (const item of corpus) {
      const entry = createEntry(item, engine);
      const output = path.join(root, 'public', entry.file);
      const source = path.join(tempDir, `${item.word.toLowerCase()}.wav`);
      engine.run(entry.blendText, source);
      if (!fs.existsSync(source)) throw new Error(`${engine.name} did not create ${source}`);
      normalizeToMp3(source, output);
      entries[entry.id] = entry;
      console.log(`generated ${item.word} -> ${entry.file}`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const oldManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  fs.writeFileSync(manifestPath, `${JSON.stringify(mergeManifest(oldManifest, entries), null, 2)}\n`);
  console.log(`Wrote ${Object.keys(entries).length} dedicated blend entries as review_required.`);
}

if (require.main === module) {
  try {
    generate();
  } catch (error) {
    console.error(`Blend audio generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { BLEND_TEMPO, buildRawBlendText, mergeManifest };
