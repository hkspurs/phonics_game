export const mathCopy = {
  countObjects: {
    zh: (params) => `有多少個${params.objectNameZh}？`,
    en: (params) => `How many ${params.objectNameEn} are there?`
  },
  compareQuantityBigger: {
    zh: () => '哪邊比較多？',
    en: () => 'Which side has more?'
  },
  compareQuantitySmaller: {
    zh: () => '哪邊比較少？',
    en: () => 'Which side has less?'
  },
  compareQuantityEqual: {
    zh: () => '兩邊一樣多嗎？',
    en: () => 'Are they equal?'
  },
  compareQuantity: {
    zh: () => '兩邊比一比',
    en: () => 'Compare the two sides'
  },
  orderNumbersAsc: {
    zh: () => '把數字從小排到大',
    en: () => 'Order the numbers from smallest to largest'
  },
  orderNumbersDesc: {
    zh: () => '把數字從大排到小',
    en: () => 'Order the numbers from largest to smallest'
  },
  numberBond: {
    zh: (params) => `什麼數字加上 ${params.givenPart} 會等於 ${params.target}？`,
    en: (params) => `What number makes ${params.target} with ${params.givenPart}?`
  },
  visualAddition: {
    zh: () => '加起來總共是多少？',
    en: () => 'How many in total?'
  },
  visualSubtraction: {
    zh: () => '剩下多少？',
    en: () => 'How many are left?'
  },
  ordinalPosition: {
    zh: (params) => `請找出排在第 ${params.position} 個的圖案`,
    en: (params) => `Find the ${getOrdinalSuffix(params.position)} one in line`
  },
  shapePattern: {
    zh: () => '下一個圖案是什麼？',
    en: () => 'What comes next in the pattern?'
  }
};

function getOrdinalSuffix(i) {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
      return i + "st";
  }
  if (j == 2 && k != 12) {
      return i + "nd";
  }
  if (j == 3 && k != 13) {
      return i + "rd";
  }
  return i + "th";
}

export function getMathCopy(key, params = {}) {
  const entry = mathCopy[key];
  if (!entry) {
    console.warn(`Missing math copy for key: ${key}`);
    return { zh: key, en: key };
  }
  return {
    zh: entry.zh(params),
    en: entry.en(params)
  };
}
