import { UserProfile, GameSettings, Trophy, SubjectType, PetDefinition, GadgetDefinition, EquippedWardrobe, QuestionAttempt, RewardTransaction } from '../types';
import { WARDROBE_ITEMS, WardrobeItem, WardrobeCategory } from '../config/wardrobe';

const STORAGE_KEY = 'p1_adventure_save_v1';

export const TROPHY_DEFINITIONS: Trophy[] = [
  // --- Consistency (持之以恆) ---
  {
    id: 'first_question',
    name: '初試啼聲',
    description: '完成並答對第 1 道題目',
    category: 'consistency',
    rewardCoins: 10,
    rewardGems: 1,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 1,
  },
  {
    id: 'total_questions_5',
    name: '漸入佳境',
    description: '累積答對 5 道題目',
    category: 'consistency',
    rewardCoins: 20,
    rewardGems: 2,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 5,
  },
  {
    id: 'total_questions_10',
    name: '好學不倦 (銅)',
    description: '累積答對 10 道題目',
    category: 'consistency',
    rewardCoins: 30,
    rewardGems: 3,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 10,
  },
  {
    id: 'total_questions_25',
    name: '好學不倦 (銀)',
    description: '累積答對 25 道題目',
    category: 'consistency',
    rewardCoins: 50,
    rewardGems: 5,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 25,
  },
  {
    id: 'total_questions_50',
    name: '好學不倦 (金)',
    description: '累積答對 50 道題目',
    category: 'consistency',
    rewardCoins: 100,
    rewardGems: 10,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 50,
  },
  {
    id: 'total_questions_100',
    name: '學霸小達人',
    description: '累積答對 100 道題目',
    category: 'consistency',
    rewardCoins: 200,
    rewardGems: 20,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 100,
  },
  {
    id: 'total_questions_200',
    name: '知識百科',
    description: '累積答對 200 道題目',
    category: 'consistency',
    rewardCoins: 350,
    rewardGems: 35,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 200,
  },
  {
    id: 'total_questions_500',
    name: '博學大師',
    description: '累積答對 500 道題目',
    category: 'consistency',
    rewardCoins: 800,
    rewardGems: 80,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 500,
  },
  {
    id: 'total_questions_1000',
    name: '無雙學聖',
    description: '累積答對 1000 道題目',
    category: 'consistency',
    rewardCoins: 2000,
    rewardGems: 200,
    condition: (p) => (p.stats.chineseCorrect + p.stats.mathCorrect + p.stats.englishCorrect) >= 1000,
  },
  {
    id: 'streak_2_days',
    name: '堅持兩天',
    description: '連續學習 2 天',
    category: 'consistency',
    rewardCoins: 20,
    rewardGems: 2,
    condition: (p) => p.stats.streakDays >= 2,
  },
  {
    id: 'streak_3_days',
    name: '連續學習 (銅)',
    description: '連續學習 3 天',
    category: 'consistency',
    rewardCoins: 30,
    rewardGems: 3,
    condition: (p) => p.stats.streakDays >= 3,
  },
  {
    id: 'streak_5_days',
    name: '連續學習 (銀)',
    description: '連續學習 5 天',
    category: 'consistency',
    rewardCoins: 50,
    rewardGems: 5,
    condition: (p) => p.stats.streakDays >= 5,
  },
  {
    id: 'streak_7_days',
    name: '連續學習 (金)',
    description: '連續學習 7 天 (滿一週)',
    category: 'consistency',
    rewardCoins: 100,
    rewardGems: 10,
    condition: (p) => p.stats.streakDays >= 7,
  },
  {
    id: 'streak_10_days',
    name: '持之以恆 (十天)',
    description: '連續學習 10 天',
    category: 'consistency',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => p.stats.streakDays >= 10,
  },
  {
    id: 'streak_14_days',
    name: '雙週學神',
    description: '連續學習 14 天 (滿兩週)',
    category: 'consistency',
    rewardCoins: 250,
    rewardGems: 25,
    condition: (p) => p.stats.streakDays >= 14,
  },
  {
    id: 'streak_21_days',
    name: '三週習慣養成',
    description: '連續學習 21 天 (習慣成自然)',
    category: 'consistency',
    rewardCoins: 400,
    rewardGems: 40,
    condition: (p) => p.stats.streakDays >= 21,
  },
  {
    id: 'streak_30_days',
    name: '月度學習傳奇',
    description: '連續學習 30 天 (滿一個月)',
    category: 'consistency',
    rewardCoins: 600,
    rewardGems: 60,
    condition: (p) => p.stats.streakDays >= 30,
  },
  {
    id: 'streak_60_days',
    name: '雙月榮耀',
    description: '連續學習 60 天',
    category: 'consistency',
    rewardCoins: 1200,
    rewardGems: 120,
    condition: (p) => p.stats.streakDays >= 60,
  },
  {
    id: 'streak_100_days',
    name: '百日築夢王者',
    description: '連續學習 100 天！',
    category: 'consistency',
    rewardCoins: 2500,
    rewardGems: 250,
    condition: (p) => p.stats.streakDays >= 100,
  },
  {
    id: 'tri_master_1',
    name: '三科並進 (初級)',
    description: '中、英、數各答對至少 1 題',
    category: 'consistency',
    rewardCoins: 20,
    rewardGems: 2,
    condition: (p) => p.stats.chineseCorrect >= 1 && p.stats.mathCorrect >= 1 && p.stats.englishCorrect >= 1,
  },
  {
    id: 'tri_master_5',
    name: '三科並進 (銅)',
    description: '中、英、數各答對至少 5 題',
    category: 'consistency',
    rewardCoins: 40,
    rewardGems: 4,
    condition: (p) => p.stats.chineseCorrect >= 5 && p.stats.mathCorrect >= 5 && p.stats.englishCorrect >= 5,
  },
  {
    id: 'tri_master_10',
    name: '三科並進 (銀)',
    description: '中、英、數各答對至少 10 題',
    category: 'consistency',
    rewardCoins: 80,
    rewardGems: 8,
    condition: (p) => p.stats.chineseCorrect >= 10 && p.stats.mathCorrect >= 10 && p.stats.englishCorrect >= 10,
  },
  {
    id: 'tri_master_25',
    name: '三科並進 (金)',
    description: '中、英、數各答對至少 25 題',
    category: 'consistency',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => p.stats.chineseCorrect >= 25 && p.stats.mathCorrect >= 25 && p.stats.englishCorrect >= 25,
  },
  {
    id: 'tri_master_50',
    name: '全能學術專家',
    description: '中、英、數各答對至少 50 題',
    category: 'consistency',
    rewardCoins: 300,
    rewardGems: 30,
    condition: (p) => p.stats.chineseCorrect >= 50 && p.stats.mathCorrect >= 50 && p.stats.englishCorrect >= 50,
  },
  {
    id: 'tri_master_100',
    name: '文武全才滿貫王',
    description: '中、英、數各答對至少 100 題',
    category: 'consistency',
    rewardCoins: 600,
    rewardGems: 60,
    condition: (p) => p.stats.chineseCorrect >= 100 && p.stats.mathCorrect >= 100 && p.stats.englishCorrect >= 100,
  },
  {
    id: 'tri_master_200',
    name: '升夢全能至尊',
    description: '中、英、數各答對至少 200 題',
    category: 'consistency',
    rewardCoins: 1500,
    rewardGems: 150,
    condition: (p) => p.stats.chineseCorrect >= 200 && p.stats.mathCorrect >= 200 && p.stats.englishCorrect >= 200,
  },

  // --- Chinese (中文名師) ---
  {
    id: 'chinese_1',
    name: '字詞啟蒙',
    description: '答對第 1 道中文題目',
    category: 'chinese',
    rewardCoins: 10,
    rewardGems: 1,
    condition: (p) => p.stats.chineseCorrect >= 1,
  },
  {
    id: 'chinese_3',
    name: '認字新苗',
    description: '答對 3 道中文題目',
    category: 'chinese',
    rewardCoins: 15,
    rewardGems: 1,
    condition: (p) => p.stats.chineseCorrect >= 3,
  },
  {
    id: 'chinese_5',
    name: '造句小手',
    description: '答對 5 道中文題目',
    category: 'chinese',
    rewardCoins: 20,
    rewardGems: 2,
    condition: (p) => p.stats.chineseCorrect >= 5,
  },
  {
    id: 'chinese_10',
    name: '語文小秀才',
    description: '答對 10 道中文題目',
    category: 'chinese',
    rewardCoins: 35,
    rewardGems: 3,
    condition: (p) => p.stats.chineseCorrect >= 10,
  },
  {
    id: 'chinese_15',
    name: '妙筆生花 (入門)',
    description: '答對 15 道中文題目',
    category: 'chinese',
    rewardCoins: 45,
    rewardGems: 4,
    condition: (p) => p.stats.chineseCorrect >= 15,
  },
  {
    id: 'chinese_20',
    name: '妙筆生花 (初階)',
    description: '答對 20 道中文題目',
    category: 'chinese',
    rewardCoins: 60,
    rewardGems: 5,
    condition: (p) => p.stats.chineseCorrect >= 20,
  },
  {
    id: 'chinese_25',
    name: '妙筆生花 (中階)',
    description: '答對 25 道中文題目',
    category: 'chinese',
    rewardCoins: 75,
    rewardGems: 7,
    condition: (p) => p.stats.chineseCorrect >= 25,
  },
  {
    id: 'chinese_30',
    name: '文思泉湧',
    description: '答對 30 道中文題目',
    category: 'chinese',
    rewardCoins: 90,
    rewardGems: 9,
    condition: (p) => p.stats.chineseCorrect >= 30,
  },
  {
    id: 'chinese_40',
    name: '詞句通曉',
    description: '答對 40 道中文題目',
    category: 'chinese',
    rewardCoins: 120,
    rewardGems: 12,
    condition: (p) => p.stats.chineseCorrect >= 40,
  },
  {
    id: 'chinese_50',
    name: '語文小狀元',
    description: '答對 50 道中文題目',
    category: 'chinese',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => p.stats.chineseCorrect >= 50,
  },
  {
    id: 'chinese_60',
    name: '詞章達人',
    description: '答對 60 道中文題目',
    category: 'chinese',
    rewardCoins: 180,
    rewardGems: 18,
    condition: (p) => p.stats.chineseCorrect >= 60,
  },
  {
    id: 'chinese_75',
    name: '文采斐然',
    description: '答對 75 道中文題目',
    category: 'chinese',
    rewardCoins: 220,
    rewardGems: 22,
    condition: (p) => p.stats.chineseCorrect >= 75,
  },
  {
    id: 'chinese_100',
    name: '中文小翰林',
    description: '答對 100 道中文題目',
    category: 'chinese',
    rewardCoins: 300,
    rewardGems: 30,
    condition: (p) => p.stats.chineseCorrect >= 100,
  },
  {
    id: 'chinese_125',
    name: '國學小鴻儒',
    description: '答對 125 道中文題目',
    category: 'chinese',
    rewardCoins: 380,
    rewardGems: 38,
    condition: (p) => p.stats.chineseCorrect >= 125,
  },
  {
    id: 'chinese_150',
    name: '重組句子宗師',
    description: '答對 150 道中文題目',
    category: 'chinese',
    rewardCoins: 450,
    rewardGems: 45,
    condition: (p) => p.stats.chineseCorrect >= 150,
  },
  {
    id: 'chinese_175',
    name: '成語文法通',
    description: '答對 175 道中文題目',
    category: 'chinese',
    rewardCoins: 520,
    rewardGems: 52,
    condition: (p) => p.stats.chineseCorrect >= 175,
  },
  {
    id: 'chinese_200',
    name: '中文名師 (大成)',
    description: '答對 200 道中文題目',
    category: 'chinese',
    rewardCoins: 600,
    rewardGems: 60,
    condition: (p) => p.stats.chineseCorrect >= 200,
  },
  {
    id: 'chinese_300',
    name: '文曲星下凡',
    description: '答對 300 道中文題目',
    category: 'chinese',
    rewardCoins: 900,
    rewardGems: 90,
    condition: (p) => p.stats.chineseCorrect >= 300,
  },
  {
    id: 'chinese_500',
    name: '當代文聖',
    description: '答對 500 道中文題目',
    category: 'chinese',
    rewardCoins: 1500,
    rewardGems: 150,
    condition: (p) => p.stats.chineseCorrect >= 500,
  },

  // --- Math (數學之星) ---
  {
    id: 'math_1',
    name: '數數起步',
    description: '答對第 1 道數學題目',
    category: 'math',
    rewardCoins: 10,
    rewardGems: 1,
    condition: (p) => p.stats.mathCorrect >= 1,
  },
  {
    id: 'math_3',
    name: '數字精靈',
    description: '答對 3 道數學題目',
    category: 'math',
    rewardCoins: 15,
    rewardGems: 1,
    condition: (p) => p.stats.mathCorrect >= 3,
  },
  {
    id: 'math_5',
    name: '加法小幫手',
    description: '答對 5 道數學題目',
    category: 'math',
    rewardCoins: 20,
    rewardGems: 2,
    condition: (p) => p.stats.mathCorrect >= 5,
  },
  {
    id: 'math_10',
    name: '心算小神童',
    description: '答對 10 道數學題目',
    category: 'math',
    rewardCoins: 35,
    rewardGems: 3,
    condition: (p) => p.stats.mathCorrect >= 10,
  },
  {
    id: 'math_15',
    name: '減法高手 (入門)',
    description: '答對 15 道數學題目',
    category: 'math',
    rewardCoins: 45,
    rewardGems: 4,
    condition: (p) => p.stats.mathCorrect >= 15,
  },
  {
    id: 'math_20',
    name: '加減算術通',
    description: '答對 20 道數學題目',
    category: 'math',
    rewardCoins: 60,
    rewardGems: 5,
    condition: (p) => p.stats.mathCorrect >= 20,
  },
  {
    id: 'math_25',
    name: '二十以內加減神童',
    description: '答對 25 道數學題目',
    category: 'math',
    rewardCoins: 75,
    rewardGems: 7,
    condition: (p) => p.stats.mathCorrect >= 25,
  },
  {
    id: 'math_30',
    name: '邏輯分析師',
    description: '答對 30 道數學題目',
    category: 'math',
    rewardCoins: 90,
    rewardGems: 9,
    condition: (p) => p.stats.mathCorrect >= 30,
  },
  {
    id: 'math_40',
    name: '應用題小行家',
    description: '答對 40 道數學題目',
    category: 'math',
    rewardCoins: 120,
    rewardGems: 12,
    condition: (p) => p.stats.mathCorrect >= 40,
  },
  {
    id: 'math_50',
    name: '數學小博士',
    description: '答對 50 道數學題目',
    category: 'math',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => p.stats.mathCorrect >= 50,
  },
  {
    id: 'math_60',
    name: '數感敏銳',
    description: '答對 60 道數學題目',
    category: 'math',
    rewardCoins: 180,
    rewardGems: 18,
    condition: (p) => p.stats.mathCorrect >= 60,
  },
  {
    id: 'math_75',
    name: '計算閃電俠',
    description: '答對 75 道數學題目',
    category: 'math',
    rewardCoins: 220,
    rewardGems: 22,
    condition: (p) => p.stats.mathCorrect >= 75,
  },
  {
    id: 'math_100',
    name: '數學之星 (大成)',
    description: '答對 100 道數學題目',
    category: 'math',
    rewardCoins: 300,
    rewardGems: 30,
    condition: (p) => p.stats.mathCorrect >= 100,
  },
  {
    id: 'math_125',
    name: '幾何數字通',
    description: '答對 125 道數學題目',
    category: 'math',
    rewardCoins: 380,
    rewardGems: 38,
    condition: (p) => p.stats.mathCorrect >= 125,
  },
  {
    id: 'math_150',
    name: '奧數苗子',
    description: '答對 150 道數學題目',
    category: 'math',
    rewardCoins: 450,
    rewardGems: 45,
    condition: (p) => p.stats.mathCorrect >= 150,
  },
  {
    id: 'math_175',
    name: '算術大師',
    description: '答對 175 道數學題目',
    category: 'math',
    rewardCoins: 520,
    rewardGems: 52,
    condition: (p) => p.stats.mathCorrect >= 175,
  },
  {
    id: 'math_200',
    name: '數學傳奇',
    description: '答對 200 道數學題目',
    category: 'math',
    rewardCoins: 600,
    rewardGems: 60,
    condition: (p) => p.stats.mathCorrect >= 200,
  },
  {
    id: 'math_300',
    name: '高斯傳人',
    description: '答對 300 道數學題目',
    category: 'math',
    rewardCoins: 900,
    rewardGems: 90,
    condition: (p) => p.stats.mathCorrect >= 300,
  },
  {
    id: 'math_500',
    name: '極限數神',
    description: '答對 500 道數學題目',
    category: 'math',
    rewardCoins: 1500,
    rewardGems: 150,
    condition: (p) => p.stats.mathCorrect >= 500,
  },

  // --- English (英語達人) ---
  {
    id: 'english_1',
    name: 'Phonics 初體驗',
    description: '答對第 1 道英文題目',
    category: 'english',
    rewardCoins: 10,
    rewardGems: 1,
    condition: (p) => p.stats.englishCorrect >= 1,
  },
  {
    id: 'english_3',
    name: 'ABC 探險者',
    description: '答對 3 道英文題目',
    category: 'english',
    rewardCoins: 15,
    rewardGems: 1,
    condition: (p) => p.stats.englishCorrect >= 3,
  },
  {
    id: 'english_5',
    name: 'Sight Words 小能手',
    description: '答對 5 道英文題目',
    category: 'english',
    rewardCoins: 20,
    rewardGems: 2,
    condition: (p) => p.stats.englishCorrect >= 5,
  },
  {
    id: 'english_10',
    name: '英語小苗子',
    description: '答對 10 道英文題目',
    category: 'english',
    rewardCoins: 35,
    rewardGems: 3,
    condition: (p) => p.stats.englishCorrect >= 10,
  },
  {
    id: 'english_15',
    name: '生字百寶箱 (初階)',
    description: '答對 15 道英文題目',
    category: 'english',
    rewardCoins: 45,
    rewardGems: 4,
    condition: (p) => p.stats.englishCorrect >= 15,
  },
  {
    id: 'english_20',
    name: '句子小拼圖',
    description: '答對 20 道英文題目',
    category: 'english',
    rewardCoins: 60,
    rewardGems: 5,
    condition: (p) => p.stats.englishCorrect >= 20,
  },
  {
    id: 'english_25',
    name: '英文語感通',
    description: '答對 25 道英文題目',
    category: 'english',
    rewardCoins: 75,
    rewardGems: 7,
    condition: (p) => p.stats.englishCorrect >= 25,
  },
  {
    id: 'english_30',
    name: '文法小先鋒',
    description: '答對 30 道英文題目',
    category: 'english',
    rewardCoins: 90,
    rewardGems: 9,
    condition: (p) => p.stats.englishCorrect >= 30,
  },
  {
    id: 'english_40',
    name: '英文流利通',
    description: '答對 40 道英文題目',
    category: 'english',
    rewardCoins: 120,
    rewardGems: 12,
    condition: (p) => p.stats.englishCorrect >= 40,
  },
  {
    id: 'english_50',
    name: '英語小主播',
    description: '答對 50 道英文題目',
    category: 'english',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => p.stats.englishCorrect >= 50,
  },
  {
    id: 'english_60',
    name: '單字富翁',
    description: '答對 60 道英文題目',
    category: 'english',
    rewardCoins: 180,
    rewardGems: 18,
    condition: (p) => p.stats.englishCorrect >= 60,
  },
  {
    id: 'english_75',
    name: '拼讀高手',
    description: '答對 75 道英文題目',
    category: 'english',
    rewardCoins: 220,
    rewardGems: 22,
    condition: (p) => p.stats.englishCorrect >= 75,
  },
  {
    id: 'english_100',
    name: '英語達人 (百題榮耀)',
    description: '答對 100 道英文題目',
    category: 'english',
    rewardCoins: 300,
    rewardGems: 30,
    condition: (p) => p.stats.englishCorrect >= 100,
  },
  {
    id: 'english_125',
    name: '英文故事王',
    description: '答對 125 道英文題目',
    category: 'english',
    rewardCoins: 380,
    rewardGems: 38,
    condition: (p) => p.stats.englishCorrect >= 125,
  },
  {
    id: 'english_150',
    name: '句型大師',
    description: '答對 150 道英文題目',
    category: 'english',
    rewardCoins: 450,
    rewardGems: 45,
    condition: (p) => p.stats.englishCorrect >= 150,
  },
  {
    id: 'english_175',
    name: '朗讀之星',
    description: '答對 175 道英文題目',
    category: 'english',
    rewardCoins: 520,
    rewardGems: 52,
    condition: (p) => p.stats.englishCorrect >= 175,
  },
  {
    id: 'english_200',
    name: '英文博覽群書',
    description: '答對 200 道英文題目',
    category: 'english',
    rewardCoins: 600,
    rewardGems: 60,
    condition: (p) => p.stats.englishCorrect >= 200,
  },
  {
    id: 'english_300',
    name: '莎士比亞之星',
    description: '答對 300 道英文題目',
    category: 'english',
    rewardCoins: 900,
    rewardGems: 90,
    condition: (p) => p.stats.englishCorrect >= 300,
  },
  {
    id: 'english_500',
    name: '英語國際大師',
    description: '答對 500 道英文題目',
    category: 'english',
    rewardCoins: 1500,
    rewardGems: 150,
    condition: (p) => p.stats.englishCorrect >= 500,
  },

  // --- Adventure (冒險王者) ---
  {
    id: 'adv_station_2',
    name: '踏出第一步',
    description: '解鎖第 2 關 (綠野小徑)',
    category: 'adventure',
    rewardCoins: 30,
    rewardGems: 3,
    condition: (p) => p.unlockedStations >= 2,
  },
  {
    id: 'adv_station_3',
    name: '櫻花之約',
    description: '解鎖第 3 關 (櫻花樹)',
    category: 'adventure',
    rewardCoins: 40,
    rewardGems: 4,
    condition: (p) => p.unlockedStations >= 3,
  },
  {
    id: 'adv_station_4',
    name: '螢火引路',
    description: '解鎖第 4 關 (螢火森林)',
    category: 'adventure',
    rewardCoins: 50,
    rewardGems: 5,
    condition: (p) => p.unlockedStations >= 4,
  },
  {
    id: 'adv_station_5',
    name: '漫步花海',
    description: '解鎖第 5 關 (花海)',
    category: 'adventure',
    rewardCoins: 60,
    rewardGems: 6,
    condition: (p) => p.unlockedStations >= 5,
  },
  {
    id: 'adv_station_6',
    name: '彩蝶飛舞',
    description: '解鎖第 6 關 (蝴蝶園)',
    category: 'adventure',
    rewardCoins: 70,
    rewardGems: 7,
    condition: (p) => p.unlockedStations >= 6,
  },
  {
    id: 'adv_station_7',
    name: '清泉叮咚',
    description: '解鎖第 7 關 (清泉小溪)',
    category: 'adventure',
    rewardCoins: 80,
    rewardGems: 8,
    condition: (p) => p.unlockedStations >= 7,
  },
  {
    id: 'adv_station_8',
    name: '魔法樹屋探秘',
    description: '解鎖第 8 關 (魔法樹屋)',
    category: 'adventure',
    rewardCoins: 90,
    rewardGems: 9,
    condition: (p) => p.unlockedStations >= 8,
  },
  {
    id: 'adv_station_9',
    name: '蘑菇幻境',
    description: '解鎖第 9 關 (蘑菇圈)',
    category: 'adventure',
    rewardCoins: 100,
    rewardGems: 10,
    condition: (p) => p.unlockedStations >= 9,
  },
  {
    id: 'adv_station_10',
    name: '南瓜豐收季',
    description: '解鎖第 10 關 (南瓜田)',
    category: 'adventure',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => p.unlockedStations >= 10,
  },
  {
    id: 'adv_stars_3',
    name: '摘星初現',
    description: '全地圖累積獲得 3 顆星星',
    category: 'adventure',
    rewardCoins: 20,
    rewardGems: 2,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 3,
  },
  {
    id: 'adv_stars_6',
    name: '繁星點點',
    description: '全地圖累積獲得 6 顆星星',
    category: 'adventure',
    rewardCoins: 35,
    rewardGems: 3,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 6,
  },
  {
    id: 'adv_stars_9',
    name: '璀璨星空 (初階)',
    description: '全地圖累積獲得 9 顆星星',
    category: 'adventure',
    rewardCoins: 50,
    rewardGems: 5,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 9,
  },
  {
    id: 'adv_stars_12',
    name: '璀璨星空 (中階)',
    description: '全地圖累積獲得 12 顆星星',
    category: 'adventure',
    rewardCoins: 75,
    rewardGems: 7,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 12,
  },
  {
    id: 'adv_stars_15',
    name: '銀河半程',
    description: '全地圖累積獲得 15 顆星星 (半程滿星)',
    category: 'adventure',
    rewardCoins: 100,
    rewardGems: 10,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 15,
  },
  {
    id: 'adv_stars_18',
    name: '星光閃爍',
    description: '全地圖累積獲得 18 顆星星',
    category: 'adventure',
    rewardCoins: 125,
    rewardGems: 12,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 18,
  },
  {
    id: 'adv_stars_21',
    name: '耀眼星芒',
    description: '全地圖累積獲得 21 顆星星',
    category: 'adventure',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 21,
  },
  {
    id: 'adv_stars_24',
    name: '群星璀璨',
    description: '全地圖累積獲得 24 顆星星',
    category: 'adventure',
    rewardCoins: 200,
    rewardGems: 20,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 24,
  },
  {
    id: 'adv_stars_27',
    name: '星辰守護者',
    description: '全地圖累積獲得 27 顆星星',
    category: 'adventure',
    rewardCoins: 250,
    rewardGems: 25,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 27,
  },
  {
    id: 'adv_stars_30',
    name: '升夢大滿貫 (全三星通關)',
    description: '全 10 關全三星完美通關 (30 顆星)！',
    category: 'adventure',
    rewardCoins: 1000,
    rewardGems: 100,
    condition: (p) => Object.values(p.stationStars).reduce((a, b) => a + b, 0) >= 30,
  },
  {
    id: 'adv_perfect_1',
    name: '完美第一關',
    description: '在至少 1 個關卡獲得 3 星滿分',
    category: 'adventure',
    rewardCoins: 30,
    rewardGems: 3,
    condition: (p) => Object.values(p.stationStars).filter((s) => s === 3).length >= 1,
  },
  {
    id: 'adv_perfect_3',
    name: '完美三連冠',
    description: '在至少 3 個關卡獲得 3 星滿分',
    category: 'adventure',
    rewardCoins: 75,
    rewardGems: 7,
    condition: (p) => Object.values(p.stationStars).filter((s) => s === 3).length >= 3,
  },
  {
    id: 'adv_perfect_5',
    name: '五星級冒險家',
    description: '在至少 5 個關卡獲得 3 星滿分',
    category: 'adventure',
    rewardCoins: 150,
    rewardGems: 15,
    condition: (p) => Object.values(p.stationStars).filter((s) => s === 3).length >= 5,
  },
  {
    id: 'adv_perfect_8',
    name: '八方完美',
    description: '在至少 8 個關卡獲得 3 星滿分',
    category: 'adventure',
    rewardCoins: 300,
    rewardGems: 30,
    condition: (p) => Object.values(p.stationStars).filter((s) => s === 3).length >= 8,
  },
  {
    id: 'adv_skin_2',
    name: '變裝新秀',
    description: '擁有 2 款角色造型',
    category: 'adventure',
    rewardCoins: 50,
    rewardGems: 5,
    condition: (p) => p.ownedSkins.length >= 2,
  },
  {
    id: 'adv_skin_3',
    name: '時裝達人',
    description: '擁有 3 款角色造型',
    category: 'adventure',
    rewardCoins: 100,
    rewardGems: 10,
    condition: (p) => p.ownedSkins.length >= 3,
  },
  {
    id: 'adv_skin_4',
    name: '角色收藏家',
    description: '擁有 4 款角色造型',
    category: 'adventure',
    rewardCoins: 200,
    rewardGems: 20,
    condition: (p) => p.ownedSkins.length >= 4,
  },
  {
    id: 'adv_skin_5',
    name: '升夢全明星',
    description: '解鎖全部 5 款冒險家造型 (冒險家、女英雄、士兵、騎士、忍者)',
    category: 'adventure',
    rewardCoins: 500,
    rewardGems: 50,
    condition: (p) => p.ownedSkins.length >= 5,
  },

  // --- Wealth (寶藏大亨) ---
  {
    id: 'wealth_coin_10',
    name: '第一桶金',
    description: '累積獲得 10 枚金幣',
    category: 'wealth',
    rewardCoins: 5,
    rewardGems: 0,
    condition: (p) => p.coins >= 10,
  },
  {
    id: 'wealth_coin_25',
    name: '零錢罐',
    description: '累積獲得 25 枚金幣',
    category: 'wealth',
    rewardCoins: 10,
    rewardGems: 0,
    condition: (p) => p.coins >= 25,
  },
  {
    id: 'wealth_coin_50',
    name: '儲蓄小能手',
    description: '累積獲得 50 枚金幣',
    category: 'wealth',
    rewardCoins: 20,
    rewardGems: 0,
    condition: (p) => p.coins >= 50,
  },
  {
    id: 'wealth_coin_100',
    name: '小富翁 (百幣榮耀)',
    description: '累積獲得 100 枚金幣',
    category: 'wealth',
    rewardCoins: 35,
    rewardGems: 0,
    condition: (p) => p.coins >= 100,
  },
  {
    id: 'wealth_coin_200',
    name: '財富增長 (銅)',
    description: '累積獲得 200 枚金幣',
    category: 'wealth',
    rewardCoins: 50,
    rewardGems: 0,
    condition: (p) => p.coins >= 200,
  },
  {
    id: 'wealth_coin_300',
    name: '財富增長 (銀)',
    description: '累積獲得 300 枚金幣',
    category: 'wealth',
    rewardCoins: 75,
    rewardGems: 0,
    condition: (p) => p.coins >= 300,
  },
  {
    id: 'wealth_coin_500',
    name: '金幣滿溢 (金)',
    description: '累積獲得 500 枚金幣',
    category: 'wealth',
    rewardCoins: 120,
    rewardGems: 0,
    condition: (p) => p.coins >= 500,
  },
  {
    id: 'wealth_coin_750',
    name: '寶藏獵人',
    description: '累積獲得 750 枚金幣',
    category: 'wealth',
    rewardCoins: 180,
    rewardGems: 0,
    condition: (p) => p.coins >= 750,
  },
  {
    id: 'wealth_coin_1000',
    name: '千金大亨',
    description: '累積獲得 1,000 枚金幣',
    category: 'wealth',
    rewardCoins: 250,
    rewardGems: 0,
    condition: (p) => p.coins >= 1000,
  },
  {
    id: 'wealth_coin_1500',
    name: '金幣小王爺',
    description: '累積獲得 1,500 枚金幣',
    category: 'wealth',
    rewardCoins: 350,
    rewardGems: 0,
    condition: (p) => p.coins >= 1500,
  },
  {
    id: 'wealth_coin_2000',
    name: '金庫守門人',
    description: '累積獲得 2,000 枚金幣',
    category: 'wealth',
    rewardCoins: 500,
    rewardGems: 0,
    condition: (p) => p.coins >= 2000,
  },
  {
    id: 'wealth_coin_3000',
    name: '黃金巨擘',
    description: '累積獲得 3,000 枚金幣',
    category: 'wealth',
    rewardCoins: 750,
    rewardGems: 0,
    condition: (p) => p.coins >= 3000,
  },
  {
    id: 'wealth_coin_5000',
    name: '富甲一方',
    description: '累積獲得 5,000 枚金幣',
    category: 'wealth',
    rewardCoins: 1200,
    rewardGems: 0,
    condition: (p) => p.coins >= 5000,
  },
  {
    id: 'wealth_coin_10000',
    name: '升夢首富傳奇',
    description: '累積獲得 10,000 枚金幣！',
    category: 'wealth',
    rewardCoins: 3000,
    rewardGems: 0,
    condition: (p) => p.coins >= 10000,
  },
  {
    id: 'wealth_gem_5',
    name: '初得寶石',
    description: '累積擁有 5 顆鑽石',
    category: 'wealth',
    rewardCoins: 20,
    rewardGems: 0,
    condition: (p) => p.gems >= 5,
  },
  {
    id: 'wealth_gem_10',
    name: '閃耀寶石 (銅)',
    description: '累積擁有 10 顆鑽石',
    category: 'wealth',
    rewardCoins: 40,
    rewardGems: 0,
    condition: (p) => p.gems >= 10,
  },
  {
    id: 'wealth_gem_20',
    name: '閃耀寶石 (銀)',
    description: '累積擁有 20 顆鑽石',
    category: 'wealth',
    rewardCoins: 80,
    rewardGems: 0,
    condition: (p) => p.gems >= 20,
  },
  {
    id: 'wealth_gem_30',
    name: '閃耀寶石 (金)',
    description: '累積擁有 30 顆鑽石 (足夠換女英雄造型！)',
    category: 'wealth',
    rewardCoins: 120,
    rewardGems: 0,
    condition: (p) => p.gems >= 30,
  },
  {
    id: 'wealth_gem_50',
    name: '鑽石袋子',
    description: '累積擁有 50 顆鑽石',
    category: 'wealth',
    rewardCoins: 180,
    rewardGems: 0,
    condition: (p) => p.gems >= 50,
  },
  {
    id: 'wealth_gem_75',
    name: '鑽石項鍊',
    description: '累積擁有 75 顆鑽石',
    category: 'wealth',
    rewardCoins: 250,
    rewardGems: 0,
    condition: (p) => p.gems >= 75,
  },
  {
    id: 'wealth_gem_100',
    name: '百鑽富翁 (可換騎士造型！)',
    description: '累積擁有 100 顆鑽石',
    category: 'wealth',
    rewardCoins: 350,
    rewardGems: 0,
    condition: (p) => p.gems >= 100,
  },
  {
    id: 'wealth_gem_150',
    name: '忍者召喚師 (可換忍者造型！)',
    description: '累積擁有 150 顆鑽石',
    category: 'wealth',
    rewardCoins: 500,
    rewardGems: 0,
    condition: (p) => p.gems >= 150,
  },
  {
    id: 'wealth_gem_200',
    name: '鑽石寶盒',
    description: '累積擁有 200 顆鑽石',
    category: 'wealth',
    rewardCoins: 700,
    rewardGems: 0,
    condition: (p) => p.gems >= 200,
  },
  {
    id: 'wealth_gem_300',
    name: '璀璨水晶宮',
    description: '累積擁有 300 顆鑽石',
    category: 'wealth',
    rewardCoins: 1000,
    rewardGems: 0,
    condition: (p) => p.gems >= 300,
  },
  {
    id: 'wealth_gem_500',
    name: '至尊寶石之神',
    description: '累積擁有 500 顆鑽石！',
    category: 'wealth',
    rewardCoins: 2000,
    rewardGems: 0,
    condition: (p) => p.gems >= 500,
  },
];

export const PET_DEFINITIONS: PetDefinition[] = [
  {
    id: 'dino',
    name: '小恐龍 (Dino)',
    nameEn: 'Baby Dino',
    description: '綠色萌萌恐龍，跑酷時吸金半徑 +60px，每次成功跳過石仔額外獎勵 +1 金幣！',
    costCoins: 300,
    costGems: 30,
    perkDescription: '🧲 磁鐵範圍 +60px，跳石 +1 金幣',
    magnetBonus: 60,
    bonusCoinRate: 1,
    icon: '🦖',
    tint: 0x55ee77,
  },
  {
    id: 'mecha_cat',
    name: '機械貓 (Mecha Cat)',
    nameEn: 'Cyber Kitty',
    description: '藍銀機甲科技貓，跑酷時吸金半徑 +90px，自動預警前方石仔障礙！',
    costCoins: 500,
    costGems: 50,
    perkDescription: '🧲 磁鐵範圍 +90px，前方障礙閃光預警',
    magnetBonus: 90,
    icon: '🐱',
    tint: 0x55ccff,
  },
  {
    id: 'pixie_dragon',
    name: '飛天小精靈 (Pixie Dragon)',
    nameEn: 'Pixie Dragon',
    description: '粉紫羽翼小精靈，賦予跑酷二段跳高空浮力，全域吸金半徑 +120px！',
    costCoins: 800,
    costGems: 80,
    perkDescription: '🪶 二段跳浮空 +20%，全域吸金 +120px',
    magnetBonus: 120,
    jumpBonus: 0.20,
    icon: '🧚',
    tint: 0xff77ee,
  },
];

export const GADGET_DEFINITIONS: GadgetDefinition[] = [
  {
    id: 'shield',
    name: '🛡️ 護盾泡泡 (Shield Bubble)',
    description: '跑酷時自動吸收 1 次石頭障礙撞擊，免受減速與踉蹌！',
    costCoins: 50,
    costGems: 5,
    effectType: 'shield',
    icon: '🛡️',
  },
  {
    id: 'magnet_potion',
    name: '🧲 超級磁鐵水 (Magnet Potion)',
    description: '跑酷前 12 秒全屏金幣強力吸取！',
    costCoins: 60,
    costGems: 6,
    effectType: 'magnet_potion',
    icon: '🧲',
    duration: 12,
  },
  {
    id: 'hint_coupon',
    name: '💡 免費提示券 (Free Hint)',
    description: '答題時免費獲取正確答案提示，不扣減三星評級！',
    costCoins: 40,
    costGems: 4,
    effectType: 'hint_coupon',
    icon: '💡',
  },
];

export class DataManager {
  private static instance?: DataManager;
  private profile: UserProfile;

  private constructor() {
    this.profile = this.load();
    this.updateStreak();
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  private getDefaultProfile(): UserProfile {
    const today = this.getLocalDateString();
    return {
      coins: 0,
      gems: 0,
      unlockedStations: 1,
      stationStars: {},
      equippedSkin: 'adventurer',
      ownedSkins: ['adventurer'],
      equippedPet: '',
      ownedPets: [],
      equippedWardrobe: {},
      ownedWardrobe: [],
      inventory: {},
      trophies: {},
      stats: {
        chineseCorrect: 0,
        mathCorrect: 0,
        englishCorrect: 0,
        streakDays: 1,
        lastPlayedDate: today,
      },
      settings: {
        chineseEnabled: true,
        mathEnabled: true,
        englishEnabled: true,
        voiceLanguage: 'zh-HK',
        difficulty: 1,
        soundVolume: 1.0,
      },
      dailyQuest: {
        date: today,
        completed: false,
        spinClaimed: false,
      },
      rewardLedger: [],
      questionAttempts: [],
      mistakeReviewQueue: [],
      completedStations: [],
      runnerTutorialCompleted: false,
      runnerSkippedCount: 0,
    };
  }

  private load(): UserProfile {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const defaultProf = this.getDefaultProfile();
          return {
            ...defaultProf,
            ...parsed,
            stats: {
              ...defaultProf.stats,
              ...(parsed.stats || {}),
            },
            settings: {
              ...defaultProf.settings,
              ...(parsed.settings || {}),
            },
            stationStars: parsed.stationStars || {},
            ownedSkins: Array.isArray(parsed.ownedSkins) && parsed.ownedSkins.length > 0
              ? parsed.ownedSkins
              : ['adventurer'],
            equippedPet: typeof parsed.equippedPet === 'string' ? parsed.equippedPet : '',
            ownedPets: Array.isArray(parsed.ownedPets) ? parsed.ownedPets : [],
            equippedWardrobe: parsed.equippedWardrobe && typeof parsed.equippedWardrobe === 'object'
              ? parsed.equippedWardrobe
              : {},
            ownedWardrobe: Array.isArray(parsed.ownedWardrobe) ? parsed.ownedWardrobe : [],
            inventory: parsed.inventory && typeof parsed.inventory === 'object' ? parsed.inventory : {},
            trophies: parsed.trophies || {},
            rewardLedger: Array.isArray(parsed.rewardLedger) ? parsed.rewardLedger : [],
            questionAttempts: Array.isArray(parsed.questionAttempts) ? parsed.questionAttempts : [],
            mistakeReviewQueue: Array.isArray(parsed.mistakeReviewQueue) ? parsed.mistakeReviewQueue : [],
            completedStations: Array.isArray(parsed.completedStations) ? parsed.completedStations : [],
            runnerTutorialCompleted: typeof parsed.runnerTutorialCompleted === 'boolean' ? parsed.runnerTutorialCompleted : false,
            runnerSkippedCount: typeof parsed.runnerSkippedCount === 'number' ? parsed.runnerSkippedCount : 0,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load save data from localStorage, falling back to default:', e);
    }
    return this.getDefaultProfile();
  }

  public recordAttempt(attempt: QuestionAttempt): void {
    if (!this.profile.questionAttempts) {
      this.profile.questionAttempts = [];
    }
    this.profile.questionAttempts.push(attempt);

    if (!this.profile.mistakeReviewQueue) {
      this.profile.mistakeReviewQueue = [];
    }

    if (!attempt.isCorrect || attempt.hintLevelUsed >= 3) {
      if (!this.profile.mistakeReviewQueue.includes(attempt.questionId)) {
        this.profile.mistakeReviewQueue.push(attempt.questionId);
      }
    }
    this.save();
  }

  public getQuestionAttempts(): QuestionAttempt[] {
    return this.profile.questionAttempts || [];
  }

  public isFirstAttemptCorrect(questionId: string): boolean {
    const attempts = (this.profile.questionAttempts || []).filter((a) => a.questionId === questionId);
    if (attempts.length === 0) return false;
    const first = attempts.find((a) => a.attemptNumber === 1) || attempts[0];
    return first.isCorrect && (first.hintLevelUsed === 0 || first.hintLevelUsed < 3);
  }

  public isQuestionCompleted(questionId: string): boolean {
    const attempts = (this.profile.questionAttempts || []).filter((a) => a.questionId === questionId);
    return attempts.some((a) => a.isCorrect);
  }

  public getMistakeReviewQueue(): string[] {
    return this.profile.mistakeReviewQueue || [];
  }

  public removeMistakeFromQueue(questionId: string): void {
    if (!this.profile.mistakeReviewQueue) return;
    this.profile.mistakeReviewQueue = this.profile.mistakeReviewQueue.filter((id) => id !== questionId);
    this.save();
  }

  public recordTransaction(
    sourceType: 'learning' | 'runner_pickups' | 'first_clear' | 'achievement' | 'shop_purchase' | 'migration' | 'daily_quest',
    sourceId: string,
    currencyType: 'coins' | 'gems' | 'stars',
    amount: number
  ): RewardTransaction | null {
    if (!this.profile.rewardLedger) {
      this.profile.rewardLedger = [];
    }

    if (amount > 0 && (sourceType === 'first_clear' || sourceType === 'achievement' || sourceType === 'daily_quest')) {
      const existing = this.profile.rewardLedger.find(
        (t) => t.sourceType === sourceType && t.sourceId === sourceId && t.currencyType === currencyType
      );
      if (existing) {
        return existing;
      }
    }

    let balanceBefore = 0;
    if (currencyType === 'coins') balanceBefore = this.profile.coins;
    else if (currencyType === 'gems') balanceBefore = this.profile.gems;
    else if (currencyType === 'stars') balanceBefore = this.getTotalStars();

    if (amount < 0 && balanceBefore + amount < 0) {
      return null;
    }

    const balanceAfter = balanceBefore + amount;

    if (currencyType === 'coins') this.profile.coins = Math.max(0, balanceAfter);
    else if (currencyType === 'gems') this.profile.gems = Math.max(0, balanceAfter);

    const transaction: RewardTransaction = {
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceType,
      sourceId,
      currencyType,
      amount,
      balanceBefore,
      balanceAfter,
      timestamp: Date.now(),
    };

    this.profile.rewardLedger.push(transaction);
    this.save();
    return transaction;
  }

  public getRewardLedger(): RewardTransaction[] {
    return this.profile.rewardLedger || [];
  }

  public getCompletedStationCount(): number {
    return (this.profile.completedStations || []).length;
  }

  public isStationCompleted(stationId: number): boolean {
    return (this.profile.completedStations || []).includes(stationId);
  }

  public markStationCompleted(stationId: number): boolean {
    if (!this.profile.completedStations) {
      this.profile.completedStations = [];
    }
    if (!this.profile.completedStations.includes(stationId)) {
      this.profile.completedStations.push(stationId);
      this.save();
      return true;
    }
    return false;
  }

  public isRunnerTutorialCompleted(): boolean {
    return !!this.profile.runnerTutorialCompleted;
  }

  public setRunnerTutorialCompleted(completed: boolean): void {
    this.profile.runnerTutorialCompleted = completed;
    this.save();
  }

  public incrementRunnerSkippedCount(): void {
    this.profile.runnerSkippedCount = (this.profile.runnerSkippedCount || 0) + 1;
    this.save();
  }

  public getRunnerSkippedCount(): number {
    return this.profile.runnerSkippedCount || 0;
  }

  public getDiagnosticSummary(): {
    totalQuestionsCompleted: number;
    totalAttempts: number;
    firstAttemptAccuracyRate: number;
    eventualCompletionRate: number;
    totalHintsUsed: number;
    totalMistakes: number;
    subjectBreakdown: {
      chinese: { completed: number; totalAttempts: number; firstAttemptCorrect: number; firstAttemptAccuracy: number };
      math: { completed: number; totalAttempts: number; firstAttemptCorrect: number; firstAttemptAccuracy: number };
      english: { completed: number; totalAttempts: number; firstAttemptCorrect: number; firstAttemptAccuracy: number };
    };
    mistakeQueue: string[];
  } {
    const attempts = this.profile.questionAttempts || [];
    const questionIds = Array.from(new Set(attempts.map((a) => a.questionId)));

    let totalCompleted = 0;
    let firstAttemptCorrectCount = 0;
    let totalHints = 0;
    let totalMistakes = 0;

    const subjectStats: Record<SubjectType, { completed: number; totalAttempts: number; firstAttemptCorrect: number }> = {
      chinese: { completed: 0, totalAttempts: 0, firstAttemptCorrect: 0 },
      math: { completed: 0, totalAttempts: 0, firstAttemptCorrect: 0 },
      english: { completed: 0, totalAttempts: 0, firstAttemptCorrect: 0 },
    };

    for (const qId of questionIds) {
      const qAttempts = attempts.filter((a) => a.questionId === qId);
      const isCompleted = qAttempts.some((a) => a.isCorrect);
      if (isCompleted) totalCompleted++;

      const firstAttempt = qAttempts.find((a) => a.attemptNumber === 1) || qAttempts[0];
      const isFirstCorrect = firstAttempt && firstAttempt.isCorrect && (firstAttempt.hintLevelUsed === 0 || firstAttempt.hintLevelUsed < 3);

      if (isFirstCorrect) firstAttemptCorrectCount++;

      const subject = firstAttempt?.subject || 'chinese';
      if (subjectStats[subject]) {
        if (isCompleted) subjectStats[subject].completed++;
        if (isFirstCorrect) subjectStats[subject].firstAttemptCorrect++;
      }
    }

    for (const a of attempts) {
      if (subjectStats[a.subject]) {
        subjectStats[a.subject].totalAttempts++;
      }
      if (a.hintLevelUsed > 0) totalHints += a.hintLevelUsed;
      if (!a.isCorrect) totalMistakes++;
    }

    const calcAcc = (correct: number, total: number) => (total > 0 ? correct / total : 0);

    return {
      totalQuestionsCompleted: totalCompleted,
      totalAttempts: attempts.length,
      firstAttemptAccuracyRate: calcAcc(firstAttemptCorrectCount, questionIds.length),
      eventualCompletionRate: calcAcc(totalCompleted, questionIds.length),
      totalHintsUsed: totalHints,
      totalMistakes,
      subjectBreakdown: {
        chinese: {
          ...subjectStats.chinese,
          firstAttemptAccuracy: calcAcc(subjectStats.chinese.firstAttemptCorrect, subjectStats.chinese.completed),
        },
        math: {
          ...subjectStats.math,
          firstAttemptAccuracy: calcAcc(subjectStats.math.firstAttemptCorrect, subjectStats.math.completed),
        },
        english: {
          ...subjectStats.english,
          firstAttemptAccuracy: calcAcc(subjectStats.english.firstAttemptCorrect, subjectStats.english.completed),
        },
      },
      mistakeQueue: this.getMistakeReviewQueue(),
    };
  }

  public getProfile(): UserProfile {
    return this.profile;
  }

  public addCoins(amount: number): void {
    if (amount <= 0) return;
    this.profile.coins += amount;
    this.save();
  }

  public addGems(amount: number): void {
    if (amount <= 0) return;
    this.profile.gems += amount;
    this.save();
  }

  public setStationStars(stationId: number, stars: number): void {
    const clampedStars = Math.max(0, Math.min(3, Math.floor(stars)));
    const currentStars = this.profile.stationStars[stationId] || 0;
    if (clampedStars > currentStars) {
      this.profile.stationStars[stationId] = clampedStars;
      this.save();
    }
  }

  public getStationStars(stationId: number): number {
    return this.profile.stationStars[stationId] || 0;
  }

  public getTotalStars(): number {
    return Object.values(this.profile.stationStars).reduce((sum, s) => sum + s, 0);
  }

  public unlockNextStation(currentStationId: number): void {
    if (currentStationId >= this.profile.unlockedStations) {
      this.profile.unlockedStations = Math.min(10, currentStationId + 1);
      this.save();
    }
  }

  public isStationUnlocked(stationId: number): boolean {
    return stationId <= this.profile.unlockedStations;
  }

  public unlockSkin(skinId: string, costGems: number = 0, costCoins: number = 0): boolean {
    if (this.profile.ownedSkins.includes(skinId)) {
      return true;
    }
    if (costGems > 0) {
      if (this.profile.gems < costGems) return false;
      const tx = this.recordTransaction('shop_purchase', `skin_${skinId}`, 'gems', -costGems);
      if (!tx) return false;
      this.profile.ownedSkins.push(skinId);
      this.save();
      return true;
    }
    if (costCoins > 0) {
      if (this.profile.coins < costCoins) return false;
      const tx = this.recordTransaction('shop_purchase', `skin_${skinId}`, 'coins', -costCoins);
      if (!tx) return false;
      this.profile.ownedSkins.push(skinId);
      this.save();
      return true;
    }
    if (costGems === 0 && costCoins === 0) {
      this.profile.ownedSkins.push(skinId);
      this.save();
      return true;
    }
    return false;
  }

  public equipSkin(skinId: string): boolean {
    if (this.profile.ownedSkins.includes(skinId)) {
      this.profile.equippedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  public recordCorrectAnswer(subject: SubjectType): void {
    if (subject === 'chinese') {
      this.profile.stats.chineseCorrect += 1;
    } else if (subject === 'math') {
      this.profile.stats.mathCorrect += 1;
    } else if (subject === 'english') {
      this.profile.stats.englishCorrect += 1;
    }
    this.updateStreak();
    this.save();
  }

  private getLocalDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public updateStreak(): void {
    const todayStr = this.getLocalDateString();
    const lastDateStr = this.profile.stats.lastPlayedDate;

    if (!lastDateStr) {
      this.profile.stats.streakDays = 1;
    } else if (lastDateStr === todayStr) {
      // Already played today, streak remains
    } else {
      const lastDate = new Date(lastDateStr);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        this.profile.stats.streakDays += 1;
      } else {
        this.profile.stats.streakDays = 1;
      }
    }
    this.profile.stats.lastPlayedDate = todayStr;
    this.save();
  }

  public checkTrophies(): string[] {
    const allNewlyUnlocked: string[] = [];
    let hadNewUnlocks = true;

    while (hadNewUnlocks) {
      hadNewUnlocks = false;

      for (const trophy of TROPHY_DEFINITIONS) {
        if (!this.profile.trophies[trophy.id] && trophy.condition(this.profile)) {
          this.profile.trophies[trophy.id] = true;
          if (trophy.rewardCoins) {
            this.recordTransaction('achievement', trophy.id, 'coins', trophy.rewardCoins);
          }
          if (trophy.rewardGems) {
            this.recordTransaction('achievement', trophy.id, 'gems', trophy.rewardGems);
          }
          allNewlyUnlocked.push(trophy.id);
          hadNewUnlocks = true;
        }
      }
    }

    if (allNewlyUnlocked.length > 0) {
      this.save();
    }
    return allNewlyUnlocked;
  }

  public getTrophies(): Trophy[] {
    return TROPHY_DEFINITIONS;
  }

  public updateSettings(settings: Partial<GameSettings>): void {
    this.profile.settings = {
      ...this.profile.settings,
      ...settings,
    };
    this.save();
  }

  /**
   * 3-6-9 Fast Hatching Companion Pet System
   */
  public getPetCompanion(): {
    stage: 'none' | 'egg' | 'cracking' | 'hatched';
    name: string;
    icon: string;
    progress: number;
    target: number;
  } {
    const totalCorrect =
      (this.profile.stats.chineseCorrect || 0) +
      (this.profile.stats.mathCorrect || 0) +
      (this.profile.stats.englishCorrect || 0);

    if (totalCorrect >= 9) {
      return {
        stage: 'hatched',
        name: '星光小幼龍 (Star Hatchling)',
        icon: '🐲',
        progress: totalCorrect,
        target: 9,
      };
    } else if (totalCorrect >= 6) {
      return {
        stage: 'cracking',
        name: '微光破裂蛋 (Cracking Egg)',
        icon: '🐣',
        progress: totalCorrect,
        target: 9,
      };
    } else if (totalCorrect >= 3) {
      return {
        stage: 'egg',
        name: '神祕星光蛋 (Mystery Egg)',
        icon: '🥚',
        progress: totalCorrect,
        target: 6,
      };
    } else {
      return {
        stage: 'none',
        name: '未解鎖 (Locked)',
        icon: '🔒',
        progress: totalCorrect,
        target: 3,
      };
    }
  }

  /**
   * Stamp Collection Book (Hong Kong Landmarks)
   */
  public getStamps(): string[] {
    if (!Array.isArray(this.profile.stamps)) {
      this.profile.stamps = [];
    }
    return this.profile.stamps;
  }

  public unlockStamp(stampId: string): boolean {
    if (!Array.isArray(this.profile.stamps)) {
      this.profile.stamps = [];
    }
    if (!this.profile.stamps.includes(stampId)) {
      this.profile.stamps.push(stampId);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Daily Quest & Lucky Spin Wheel
   */
  public getDailyQuest(): { date: string; completed: boolean; spinClaimed: boolean } {
    const todayStr = this.getLocalDateString();
    if (!this.profile.dailyQuest || this.profile.dailyQuest.date !== todayStr) {
      this.profile.dailyQuest = {
        date: todayStr,
        completed: false,
        spinClaimed: false,
      };
      this.save();
    }
    return this.profile.dailyQuest;
  }

  public completeDailyQuest(): void {
    const quest = this.getDailyQuest();
    quest.completed = true;
    this.save();
  }

  public claimDailySpin(rewardCoins: number = 30): boolean {
    const quest = this.getDailyQuest();
    if (quest.spinClaimed) {
      return false; // Idempotency protection
    }
    quest.spinClaimed = true;
    this.addCoins(rewardCoins);
    this.save();
    return true;
  }

  // --- Companion Pets System ---
  public getPets(): PetDefinition[] {
    return PET_DEFINITIONS;
  }

  public buyPet(petId: string, currency: 'gems' | 'coins' = 'gems'): boolean {
    const pet = PET_DEFINITIONS.find((p) => p.id === petId);
    if (!pet) return false;

    if (!Array.isArray(this.profile.ownedPets)) {
      this.profile.ownedPets = [];
    }

    if (this.profile.ownedPets.includes(petId)) {
      return true; // Already owned
    }

    const cost = currency === 'gems' ? pet.costGems : pet.costCoins;
    if (cost > 0) {
      if (currency === 'gems' && this.profile.gems < cost) return false;
      if (currency === 'coins' && this.profile.coins < cost) return false;
      const tx = this.recordTransaction('shop_purchase', `pet_${petId}`, currency, -cost);
      if (!tx) return false;
    }

    this.profile.ownedPets.push(petId);
    this.profile.equippedPet = petId;
    this.save();
    return true;
  }

  public equipPet(petId: string): boolean {
    if (petId === '') {
      this.profile.equippedPet = '';
      this.save();
      return true;
    }
    if (!Array.isArray(this.profile.ownedPets) || !this.profile.ownedPets.includes(petId)) {
      return false;
    }
    this.profile.equippedPet = petId;
    this.save();
    return true;
  }

  public getEquippedPetId(): string | null {
    return this.profile.equippedPet || null;
  }

  // --- Gadgets & Inventory System ---
  public getGadgets(): GadgetDefinition[] {
    return GADGET_DEFINITIONS;
  }

  public getGadgetCount(gadgetId: string): number {
    if (!this.profile.inventory || typeof this.profile.inventory !== 'object') {
      this.profile.inventory = {};
    }
    return this.profile.inventory[gadgetId] || 0;
  }

  public buyGadget(gadgetId: string, count: number = 1, currency: 'coins' | 'gems' = 'coins'): boolean {
    const gadget = GADGET_DEFINITIONS.find((g) => g.id === gadgetId);
    if (!gadget || count <= 0) return false;

    const totalCoins = gadget.costCoins * count;
    const totalGems = gadget.costGems * count;
    const cost = currency === 'coins' ? totalCoins : totalGems;

    if (cost > 0) {
      if (currency === 'coins' && this.profile.coins < cost) return false;
      if (currency === 'gems' && this.profile.gems < cost) return false;
      const tx = this.recordTransaction('shop_purchase', `gadget_${gadgetId}_x${count}`, currency, -cost);
      if (!tx) return false;
    }

    if (!this.profile.inventory || typeof this.profile.inventory !== 'object') {
      this.profile.inventory = {};
    }
    this.profile.inventory[gadgetId] = (this.profile.inventory[gadgetId] || 0) + count;
    this.save();
    return true;
  }

  public consumeGadget(gadgetId: string): boolean {
    if (!this.profile.inventory || typeof this.profile.inventory !== 'object') {
      this.profile.inventory = {};
    }
    const current = this.profile.inventory[gadgetId] || 0;
    if (current <= 0) return false;

    this.profile.inventory[gadgetId] = current - 1;
    this.save();
    return true;
  }

  // --- Wardrobe & Dress-up System ---
  public getWardrobeItems(category?: WardrobeCategory): readonly WardrobeItem[] {
    if (!category) return WARDROBE_ITEMS;
    return WARDROBE_ITEMS.filter((item) => item.category === category);
  }

  public isWardrobeOwned(itemId: string): boolean {
    if (!this.profile.ownedWardrobe || !Array.isArray(this.profile.ownedWardrobe)) {
      this.profile.ownedWardrobe = [];
    }
    return this.profile.ownedWardrobe.includes(itemId);
  }

  public getEquippedWardrobe(): EquippedWardrobe {
    if (!this.profile.equippedWardrobe || typeof this.profile.equippedWardrobe !== 'object') {
      this.profile.equippedWardrobe = {};
    }
    return this.profile.equippedWardrobe;
  }

  public buyWardrobeItem(itemId: string, currency: 'coins' | 'gems' = 'coins'): boolean {
    const item = WARDROBE_ITEMS.find((w) => w.id === itemId);
    if (!item || this.isWardrobeOwned(itemId)) return false;

    const cost = currency === 'coins' ? item.costCoins : item.costGems;
    if (cost > 0) {
      if (currency === 'coins' && this.profile.coins < cost) return false;
      if (currency === 'gems' && this.profile.gems < cost) return false;
      const tx = this.recordTransaction('shop_purchase', `wardrobe_${itemId}`, currency, -cost);
      if (!tx) return false;
    }

    if (!Array.isArray(this.profile.ownedWardrobe)) {
      this.profile.ownedWardrobe = [];
    }
    this.profile.ownedWardrobe.push(itemId);
    this.save();
    return true;
  }

  public equipWardrobeItem(slot: keyof EquippedWardrobe, itemId: string): boolean {
    if (!this.isWardrobeOwned(itemId)) return false;
    if (!this.profile.equippedWardrobe || typeof this.profile.equippedWardrobe !== 'object') {
      this.profile.equippedWardrobe = {};
    }

    // If equipping a dress, unequip top & bottom to avoid overlapping
    if (slot === 'dress') {
      delete this.profile.equippedWardrobe.top;
      delete this.profile.equippedWardrobe.bottom;
    } else if (slot === 'top' || slot === 'bottom') {
      // If equipping top or bottom, unequip one-piece dress
      delete this.profile.equippedWardrobe.dress;
    }

    this.profile.equippedWardrobe[slot] = itemId;
    this.save();
    return true;
  }

  public unequipWardrobeItem(slot: keyof EquippedWardrobe): boolean {
    if (!this.profile.equippedWardrobe || typeof this.profile.equippedWardrobe !== 'object') {
      return false;
    }
    delete this.profile.equippedWardrobe[slot];
    this.save();
    return true;
  }

  public clearAllWardrobe(): void {
    this.profile.equippedWardrobe = {};
    this.save();
  }

  public save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('Failed to save data to localStorage:', e);
    }
  }

  public reset(): void {
    this.profile = this.getDefaultProfile();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.warn('Failed to clear save in localStorage:', e);
    }
  }
}
