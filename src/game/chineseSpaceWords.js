import wordCatalog from '../../data/chinese_space_words.json';

export const CHINESE_SPACE_CHAPTERS = wordCatalog;

export function getChineseSpaceChapter(chapterId) {
  return CHINESE_SPACE_CHAPTERS.find((chapter) => chapter.id === chapterId);
}

export function getChineseSpaceWord(wordId) {
  return CHINESE_SPACE_CHAPTERS
    .flatMap((chapter) => chapter.words)
    .find((word) => word.id === wordId);
}
