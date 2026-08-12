import { describe, expect, it } from 'vitest';

import audioManifest from '../../data/chinese_space_audio.json';
import wordCatalog from '../../data/chinese_space_words.json';
import {
  getChineseSpaceAudioIds,
  getChineseSpaceAudioItem,
  getChineseSpaceAudioUrl,
} from './chineseSpaceAudio';

const words = wordCatalog.flatMap((chapter) => chapter.words.map((word) => ({
  ...word,
  chapterId: chapter.id,
})));

describe('Chinese Space audio manifest', () => {
  it('contains one review-required Cantonese item for every catalog word', () => {
    expect(audioManifest).toHaveLength(84);

    for (const word of words) {
      expect(getChineseSpaceAudioItem(word.id)).toEqual({
        id: word.id,
        file: `assets/chinese-space/audio/${word.chapterId}/${word.id}.mp3`,
        expectedText: word.text,
        language: 'yue-HK',
        generatedBy: 'gpt-sovits',
        qaStatus: 'review_required',
      });
    }
  });

  it('prefixes a manifest file with the supplied Vite base URL', () => {
    expect(getChineseSpaceAudioUrl('school-teacher', '/phonics_game/'))
      .toBe('/phonics_game/assets/chinese-space/audio/school/school-teacher.mp3');
  });

  it('returns exactly the selected chapter’s 28 IDs', () => {
    const schoolIds = wordCatalog.find((chapter) => chapter.id === 'school').words.map((word) => word.id);

    expect(getChineseSpaceAudioIds('school')).toEqual(schoolIds);
    expect(getChineseSpaceAudioIds('school')).toHaveLength(28);
  });
});
