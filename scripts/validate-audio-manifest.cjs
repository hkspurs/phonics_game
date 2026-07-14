const fs = require('fs');
const path = require('path');

function validate() {
  const manifestPath = path.join(__dirname, '../data/audio_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error("❌ audio_manifest.json not found!");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let errors = 0;
  const ids = new Set();

  for (const [key, item] of Object.entries(manifest)) {
    if (key !== item.id) {
      console.error(`❌ Mismatched key and id for ${key}`);
      errors++;
    }
    if (ids.has(item.id)) {
      console.error(`❌ Duplicate ID found: ${item.id}`);
      errors++;
    }
    ids.add(item.id);

    if (!item.file || !item.type || !item.qaStatus) {
      console.error(`❌ Missing required fields for ${item.id}`);
      errors++;
    }

    if (!item.language && !item.expectedPhoneme && !item.expectedText) {
      console.error(`❌ Missing text/phoneme/language for ${item.id}`);
      errors++;
    }

    if (item.file.startsWith('http')) {
      console.error(`❌ External URL found (not allowed unless approved): ${item.file}`);
      errors++;
    }

    if (item.type === 'phonics_target' && item.generatedBy === 'gpt-sovits' && item.qaStatus !== 'pass') {
      if (item.qaStatus !== 'review_required') {
        console.error(`❌ GPT-SoVITS phonics target MUST be 'review_required' unless 'pass': ${item.id}`);
        errors++;
      }
    }
    
    // Check file existence
    const absolutePath = path.join(__dirname, '..', 'public', item.file);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ Warning: Audio file does not exist at ${absolutePath} for ID: ${item.id}`);
    }
  }

  if (errors > 0) {
    console.error(`\n❌ Validation failed with ${errors} errors.`);
    process.exit(1);
  } else {
    console.log("\n✅ Audio manifest validation passed!");
  }
}

validate();
