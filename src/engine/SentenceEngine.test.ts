import { describe, it, expect } from 'vitest';
import { SentenceEngine } from './SentenceEngine';

describe('SentenceEngine', () => {
  describe('Tokenization', () => {
    it('should tokenize space-separated Chinese sentences', () => {
      const sentence = '姐姐 吃 餅乾 。';
      const tokens = SentenceEngine.tokenize(sentence, 'chinese');
      expect(tokens).toEqual(['姐姐', '吃', '餅乾', '。']);
    });

    it('should tokenize Chinese sentences with punctuation and mixed spacing', () => {
      const sentence = '小鳥 在 樹上 唱歌 。';
      const tokens = SentenceEngine.tokenize(sentence, 'chinese');
      expect(tokens).toEqual(['小鳥', '在', '樹上', '唱歌', '。']);
    });

    it('should tokenize continuous Chinese sentence with punctuation when tokens are not space separated', () => {
      const sentence = '我們在公園跑步。';
      const tokens = SentenceEngine.tokenizeChinese(sentence);
      expect(tokens.length).toBeGreaterThan(1);
      expect(tokens[tokens.length - 1]).toBe('。');
    });

    it('should tokenize space-separated English sentences', () => {
      const sentence = 'The cat is sleeping .';
      const tokens = SentenceEngine.tokenize(sentence, 'english');
      expect(tokens).toEqual(['The', 'cat', 'is', 'sleeping', '.']);
    });

    it('should tokenize English sentences with attached punctuation', () => {
      const sentence = 'I like red apples.';
      const tokens = SentenceEngine.tokenize(sentence, 'english');
      expect(tokens).toEqual(['I', 'like', 'red', 'apples', '.']);
    });

    it('should tokenize English sentences with question marks or exclamation marks', () => {
      const qSentence = 'Can you jump?';
      expect(SentenceEngine.tokenize(qSentence, 'english')).toEqual(['Can', 'you', 'jump', '?']);

      const exSentence = 'Look at the big dog!';
      expect(SentenceEngine.tokenize(exSentence, 'english')).toEqual(['Look', 'at', 'the', 'big', 'dog', '!']);
    });

    it('should handle extra whitespace gracefully', () => {
      const sentence = '  She   has  a   bag  .  ';
      const tokens = SentenceEngine.tokenize(sentence, 'english');
      expect(tokens).toEqual(['She', 'has', 'a', 'bag', '.']);
    });
  });

  describe('Non-Identity Fisher-Yates Shuffle', () => {
    it('should shuffle tokens containing all original elements', () => {
      const original = ['姐姐', '吃', '餅乾', '。'];
      const shuffled = SentenceEngine.shuffleTokens(original);

      expect(shuffled).toHaveLength(original.length);
      expect([...shuffled].sort()).toEqual([...original].sort());
    });

    it('should guarantee shuffled tokens are never in the identical original order for length >= 2', () => {
      const original = ['The', 'cat', 'is', 'sleeping', '.'];

      for (let i = 0; i < 50; i++) {
        const shuffled = SentenceEngine.shuffleTokens(original);
        expect(shuffled).not.toEqual(original);
      }
    });

    it('should guarantee non-identity shuffle for 2-element arrays', () => {
      const original = ['小狗', '跑'];
      for (let i = 0; i < 20; i++) {
        const shuffled = SentenceEngine.shuffleTokens(original);
        expect(shuffled).toEqual(['跑', '小狗']);
      }
    });

    it('should handle edge cases: single token and empty array', () => {
      expect(SentenceEngine.shuffleTokens(['hello'])).toEqual(['hello']);
      expect(SentenceEngine.shuffleTokens([])).toEqual([]);
    });

    it('should handle arrays with identical elements without infinite looping', () => {
      const same = ['a', 'a', 'a'];
      const shuffled = SentenceEngine.shuffleTokens(same);
      expect(shuffled).toEqual(['a', 'a', 'a']);
    });
  });

  describe('Order Verification', () => {
    it('should return true when placed tokens match expected order exactly', () => {
      const expected = ['The', 'cat', 'is', 'sleeping', '.'];
      const placed = ['The', 'cat', 'is', 'sleeping', '.'];
      expect(SentenceEngine.verifyOrder(placed, expected)).toBe(true);
    });

    it('should return false when placed tokens are in wrong order', () => {
      const expected = ['The', 'cat', 'is', 'sleeping', '.'];
      const wrong = ['cat', 'The', 'is', 'sleeping', '.'];
      expect(SentenceEngine.verifyOrder(wrong, expected)).toBe(false);
    });

    it('should return false when placed tokens length differs from expected', () => {
      const expected = ['The', 'cat', 'is', 'sleeping', '.'];
      const incomplete = ['The', 'cat'];
      expect(SentenceEngine.verifyOrder(incomplete, expected)).toBe(false);
    });

    it('should correctly check prefix match for partial progress', () => {
      const expected = ['姐姐', '吃', '餅乾', '。'];
      expect(SentenceEngine.isPrefixMatch(['姐姐', '吃'], expected)).toBe(true);
      expect(SentenceEngine.isPrefixMatch(['姐姐', '餅乾'], expected)).toBe(false);
      expect(SentenceEngine.isPrefixMatch([], expected)).toBe(true);
    });
  });

  describe('Question Creation Helper', () => {
    it('should create a QuizQuestion object for sentence scramble', () => {
      const question = SentenceEngine.createSentenceQuestion({
        id: 'zh_scramble_1',
        subject: 'chinese',
        sentence: '老師 拿 粉筆 。',
        prompt: '重組句子：請把字詞排列成通順的句子。',
        speakText: '老師拿粉筆。',
        hintText: '提示：主語是「老師」',
      });

      expect(question.id).toBe('zh_scramble_1');
      expect(question.subject).toBe('chinese');
      expect(question.type).toBe('sentence_scramble');
      expect(question.correctTokens).toEqual(['老師', '拿', '粉筆', '。']);
      expect(question.shuffledTokens).toHaveLength(4);
      expect(question.shuffledTokens).not.toEqual(question.correctTokens);
      expect(question.prompt).toBe('重組句子：請把字詞排列成通順的句子。');
      expect(question.speakText).toBe('老師拿粉筆。');
      expect(question.hintText).toBe('提示：主語是「老師」');
    });
  });
});
