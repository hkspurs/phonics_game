const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const corpus = JSON.parse(fs.readFileSync(path.join(root, 'data/simple_words.json'), 'utf8'));
const manifestPath = path.join(root, 'data/audio_manifest.json');
const outputDir = path.join(root, 'public/assets/simple-words/generated');
const cvcPattern = /^[B-DF-HJ-NP-TV-XZ][AEIOU][B-DF-HJ-NP-TV-XZ]$/;

function help() {
  console.log(`Generate reviewed-later MP3s for the real CVC corpus.

GPT-SoVITS (preferred):
  GPT_SOVITS_COMMAND='your-command --text {text} --output {output}'
  GPT_SOVITS_MODEL=/path/to/model node scripts/generate-simple-word-audio.cjs

Piper fallback:
  PIPER_MODEL=/path/to/voice.onnx node scripts/generate-simple-word-audio.cjs

Both engines must write one complete-word utterance to {output}; ffmpeg then
normalizes it to mono 24 kHz MP3. Files are marked review_required until the
manual QA script marks them pass.`);
}

function commandExists(command) {
  return Boolean(command) && spawnSync(command, ['--help'], { stdio: 'ignore' }).status === 0;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function renderCommand(template, word, output, model) {
  return template
    .replaceAll('{text}', shellQuote(word.toLowerCase()))
    .replaceAll('{output}', shellQuote(output))
    .replaceAll('{model}', shellQuote(model || ''));
}

function selectEngine() {
  const gptModel = process.env.GPT_SOVITS_MODEL || '';
  if (process.env.GPT_SOVITS_COMMAND && (!gptModel || fs.existsSync(gptModel))) {
    return {
      name: 'gpt-sovits',
      model: gptModel,
      voice: process.env.GPT_SOVITS_VOICE || 'configured GPT-SoVITS voice',
      run(word, output) {
        execFileSync('/bin/sh', ['-c', renderCommand(process.env.GPT_SOVITS_COMMAND, word, output, gptModel)], {
          cwd: root,
          stdio: 'inherit',
          env: { ...process.env, TTS_TEXT: word.toLowerCase(), TTS_OUTPUT: output, TTS_MODEL: gptModel },
        });
      },
    };
  }

  const piperCommand = process.env.PIPER_COMMAND || 'piper';
  const piperModel = process.env.PIPER_MODEL || '';
  if (piperModel && fs.existsSync(piperModel) && commandExists(piperCommand)) {
    return {
      name: 'piper',
      model: piperModel,
      voice: process.env.PIPER_VOICE || path.basename(piperModel),
      run(word, output) {
        execFileSync(piperCommand, ['-m', piperModel, '-f', output, '--', word.toLowerCase()], {
          cwd: root,
          stdio: 'inherit',
        });
      },
    };
  }

  throw new Error('No audio engine found. Set GPT_SOVITS_COMMAND (preferred) or PIPER_MODEL with piper installed.');
}

function normalizeToMp3(source, output) {
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', source,
    '-vn', '-ac', '1', '-ar', '24000',
    '-map_metadata', '-1', '-codec:a', 'libmp3lame', '-b:a', '96k', output,
  ], { cwd: root, stdio: 'inherit' });
}

function createEntry(item, engine) {
  const id = item.id ? `${item.id.replace(/_01$/, '')}_GEN_01` : `WORD_${item.word}_GEN_01`;
  const file = `assets/simple-words/generated/${String(item.sequence).padStart(3, '0')}_${item.word.toLowerCase()}.mp3`;
  return {
    id,
    file,
    type: 'phonics_target',
    curriculum: 'simple_word',
    language: 'en-US',
    expectedText: item.word,
    sequence: item.sequence,
    generatedBy: engine.name,
    voice: engine.voice,
    model: engine.model || 'configured command/model',
    source: engine.name === 'piper' ? 'Piper local neural TTS' : 'GPT-SoVITS local TTS',
    license: process.env.TTS_LICENSE || 'verify the selected model license before publishing',
    qaStatus: 'review_required',
    qaNotes: ['Generated as one complete word; manual listening QA is required before use.'],
  };
}

function generate() {
  if (process.argv.includes('--help')) {
    help();
    return;
  }

  if (!corpus.length || corpus.some((item) => !cvcPattern.test(item.word))) {
    throw new Error('data/simple_words.json contains a non-regular CVC word.');
  }

  const engine = selectEngine();
  fs.mkdirSync(outputDir, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'simple-word-audio-'));
  const entries = {};

  try {
    for (const item of corpus) {
      const entry = createEntry(item, engine);
      const output = path.join(root, 'public', entry.file);
      const source = path.join(tempDir, `${item.word.toLowerCase()}.wav`);
      engine.run(item.word, source);
      if (!fs.existsSync(source)) throw new Error(`${engine.name} did not create ${source}`);
      normalizeToMp3(source, output);
      entries[entry.id] = entry;
      console.log(`generated ${item.word} -> ${entry.file}`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const oldManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const preserved = Object.fromEntries(Object.entries(oldManifest).filter(([, item]) => item.curriculum !== 'simple_word'));
  const teacherEntries = Object.fromEntries(Object.entries(oldManifest).filter(([, item]) => item.curriculum === 'simple_word'));
  fs.writeFileSync(manifestPath, `${JSON.stringify({ ...preserved, ...teacherEntries, ...entries }, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(entries).length} generated entries as review_required.`);
}

try {
  generate();
} catch (error) {
  console.error(`Audio generation failed: ${error.message}`);
  process.exitCode = 1;
}
