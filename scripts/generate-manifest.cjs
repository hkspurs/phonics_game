const fs = require('fs');
const sounds = JSON.parse(fs.readFileSync('data/sounds.json')).sounds;

const manifest = {};

// Standard instructions and feedback
manifest["inst_listen_and_choose_yue"] = {
  id: "inst_listen_and_choose_yue",
  file: "assets/audio/instructions/listen_choose_yue.mp3",
  type: "instruction",
  language: "yue-HK",
  expectedText: "聽一聽，揀啱嘅字母。",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

manifest["fb_correct_yue_001"] = {
  id: "fb_correct_yue_001",
  file: "assets/audio/feedback/correct_yue_001.mp3",
  type: "feedback",
  language: "yue-HK",
  expectedText: "做得好！你答啱咗！",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

manifest["fb_wrong_yue_001"] = {
  id: "fb_wrong_yue_001",
  file: "assets/audio/feedback/wrong_yue_001.mp3",
  type: "feedback",
  language: "yue-HK",
  expectedText: "差少少，再聽多一次。",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

sounds.forEach(s => {
  manifest[s.sound_id] = {
    id: s.sound_id,
    file: s.audio_url,
    type: "phonics_target",
    language: "en",
    expectedPhoneme: `/${s.label}/`,
    generatedBy: s.human_review_status === 'approved' ? 'teacher_recording' : 'gpt-sovits',
    qaStatus: s.human_review_status === 'approved' ? 'pass' : 'review_required',
    qaNotes: [s.notes]
  };
});

fs.writeFileSync('data/audio_manifest.json', JSON.stringify(manifest, null, 2));
console.log("Created data/audio_manifest.json");
