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

manifest["inst_compare_yue"] = {
  id: "inst_compare_yue",
  file: "assets/audio/instructions/compare_yue.mp3",
  type: "instruction",
  language: "yue-HK",
  expectedText: "聽一聽，呢兩個音係咪一樣？",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

manifest["inst_boss_yue"] = {
  id: "inst_boss_yue",
  file: "assets/audio/instructions/boss_yue.mp3",
  type: "instruction",
  language: "yue-HK",
  expectedText: "終極挑戰！聽一聽，揀啱嘅字母。",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

manifest["inst_gym_warmup_yue"] = {
  id: "inst_gym_warmup_yue",
  file: "assets/audio/instructions/gym_warmup_yue.mp3",
  type: "instruction",
  language: "yue-HK",
  expectedText: "第一關熱身！留心聽清楚。",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

manifest["inst_gym_lift_yue"] = {
  id: "inst_gym_lift_yue",
  file: "assets/audio/instructions/gym_lift_yue.mp3",
  type: "instruction",
  language: "yue-HK",
  expectedText: "第二關舉重！唔好俾相似嘅音呃到呀！",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

manifest["inst_gym_sprint_yue"] = {
  id: "inst_gym_sprint_yue",
  file: "assets/audio/instructions/gym_sprint_yue.mp3",
  type: "instruction",
  language: "yue-HK",
  expectedText: "第三關衝刺！快啲揀出正確嘅答案！",
  generatedBy: "gpt-sovits",
  qaStatus: "review_required",
  qaNotes: []
};

manifest["inst_bubble_yue"] = {
  id: "inst_bubble_yue",
  file: "assets/audio/instructions/bubble_yue.mp3",
  type: "instruction",
  language: "yue-HK",
  expectedText: "聽一聽，篤爆啱嗰個泡泡！",
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
