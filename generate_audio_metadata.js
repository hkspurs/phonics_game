const fs = require('fs');
const path = require('path');

const baseDir = '/data/phonics_game/phonics_game/assets/AEIOU';
const outputDir = '/data/phonics_game/phonics_game/data';
const vowels = ['A', 'E', 'I', 'O', 'U'];

const sounds = [];

vowels.forEach(vowel => {
  const dirPath = path.join(baseDir, vowel);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      if (file.endsWith('.mp3')) {
        const parts = file.split('_');
        if (parts.length === 2) {
          const label = parts[1].replace('.mp3', '');
          const family = vowel + ' Families'; // Simple grouping
          
          sounds.push({
            sound_id: `${label}_01`,
            label: label,
            family: family,
            original_filename: file,
            audio_url: `assets/AEIOU/${vowel}/${file}`,
            slow_audio_url: null, // To be generated/added
            example_word: null, // Required for 'Picture Sound Match' template
            image_url: null, // Required for 'Picture Sound Match' template
            difficulty: "medium",
            start_time_ms: 0,
            end_time_ms: 0, // 0 indicates needs review/setting
            duration_ms: 0, // placeholder
            human_review_status: "pending_review", // strict rule from agent 3
            reviewer_name: null,
            version: 1,
            date_added: new Date().toISOString().split('T')[0],
            notes: "Initial import, requires human review to ensure final consonant is preserved."
          });
        }
      }
    });
  }
});

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'sounds.json'), JSON.stringify({ sounds }, null, 2));
console.log(`Successfully generated sounds.json with ${sounds.length} entries.`);
