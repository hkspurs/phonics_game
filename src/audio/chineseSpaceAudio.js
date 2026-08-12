import audioManifest from '../../data/chinese_space_audio.json';

export function getChineseSpaceAudioItem(wordId) {
  return audioManifest.find((item) => item.id === wordId);
}

export function getChineseSpaceAudioUrl(wordId, baseUrl = import.meta.env.BASE_URL) {
  const item = getChineseSpaceAudioItem(wordId);
  return item && `${baseUrl}${item.file}`;
}

export function getChineseSpaceAudioIds(chapterId) {
  return audioManifest
    .filter((item) => item.id.startsWith(`${chapterId}-`))
    .map((item) => item.id);
}
