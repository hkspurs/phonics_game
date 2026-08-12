# 《太空中文字保衛戰》Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在現有 React/Vite 遊戲加入一個獨立 Phaser 章節《太空中文字保衛戰》，讓小朋友以粵語讀音反應，控制戰機射中正確常用中文字，並支援章節、HP、太空寶石及徽章兌換。

**Architecture:** React 只負責路由、掛載及銷毀 Phaser；新遊戲由一個 Phaser scene 以內部 screen mode 管理主畫面、章節選擇、教學、遊戲、結果、爆機及徽章頁。字詞資料、抽題、計時、扣血、獎勵和兌換規則全部放在純 JavaScript 模組，方便 Vitest 驗證。現有 Zustand store 加入獨立 `chineseSpace` slice，避免污染舊有 phonics 的 `gems`。

**Tech Stack:** React 18, React Router, Zustand, Phaser 4.2.1, Vite, Vitest, Playwright, 現有 `AudioEngine`、Kenney 音效及 CSS；GPT-SoVITS 只在開發機以 CPU 離線產生 MP3，不在瀏覽器執行 TTS。

## Global Constraints

- 新入口為 `/chinese-space`，主畫面新增「常用中文字」卡片；新遊戲介面只用繁體中文。
- 三個章節各 28 個字，總數 84 個，完全使用 spec 中的字詞及指定字形，包括 `户外`、`起牀`。
- 每局從所選章節抽 10 個不重複答案；每題再抽同章節兩個不同干擾字，三個目標同時出現。
- 每題音訊自動播放一次；音訊完成後才開始 8 秒倒數。音訊未完成時可移動但不可開火。
- HP 每局開始為 3，跨 10 題保留；射錯或超時扣 1 HP，錯誤目標每題最多扣一次，超時後重播音訊並重新倒數 8 秒；HP 歸零顯示爆機頁。
- 正確答案位置每題隨機；三條固定慢速航道；長按開火鍵或 Space 以 220ms 間隔連續發射；目標不會自行離開畫面。
- 完成 10 題固定獲得 5 顆獨立 `太空寶石`；爆機不獲寶石。每章 3 枚徽章，價格為 5、15、30，每枚只能兌換一次。
- 遊戲中途離開或重新載入不保存局中進度；只保存太空寶石、已兌換徽章及教學完成狀態。
- 橫向優先；直向只顯示旋轉裝置提示。所有新畫面用 Phaser 繪製，React 不重做遊戲 UI。
- 不新增 npm 套件；不把參考聲音、GPT-SoVITS 模型或生成中間檔提交到 repository。
- 每個任務先寫失敗測試，再以最小改動令測試通過；每個任務完成後建立一個清晰 commit。

---

## Task 1: 建立 84 個字詞目錄及純抽題規則

**Files:**

- Create `data/chinese_space_words.json`。
- Create `src/game/chineseSpaceWords.js`。
- Create `src/game/chineseSpaceGame.js`。
- Create `src/game/chineseSpaceGame.test.js`。

**Interfaces:**

```js
// chineseSpaceWords.js
export const CHINESE_SPACE_CHAPTERS = [
  { id: 'school', label: '學校篇', words: [{ id: 'school-teacher', text: '老師' }, ...] },
  { id: 'park', label: '公園篇', words: [{ id: 'park-older-brother', text: '哥哥' }, ...] },
  { id: 'family', label: '家庭篇', words: [{ id: 'family-family', text: '家人' }, ...] },
];
export function getChineseSpaceChapter(chapterId) {}
export function getChineseSpaceWord(wordId) {}

// chineseSpaceGame.js
export const CHINESE_SPACE_QUESTION_COUNT = 10;
export const CHINESE_SPACE_STARTING_HP = 3;
export const CHINESE_SPACE_TIME_LIMIT_MS = 8000;
export const CHINESE_SPACE_FIRE_INTERVAL_MS = 220;
export const CHINESE_SPACE_GEM_REWARD = 5;
export const CHINESE_SPACE_BADGES = [
  { id: 'school-common', chapterId: 'school', label: '學校小飛行員', tier: 'common', price: 5 },
  { id: 'school-rare', chapterId: 'school', label: '學校星際隊長', tier: 'rare', price: 15 },
  { id: 'school-special', chapterId: 'school', label: '學校銀河守護者', tier: 'special', price: 30 },
  // park-common/rare/special and family-common/rare/special use the same tier names.
];
export function buildChineseSpaceSession(chapterId, random = Math.random, size = CHINESE_SPACE_QUESTION_COUNT) {}
export function calculateAverageReactionTime(reactionTimes) {}
export function getChineseSpaceBadge(badgeId) {}
export function canRedeemChineseSpaceBadge(badgeId, spaceGems, ownedBadgeIds) {}
```

**Steps:**

- [ ] 先寫 `chineseSpaceGame.test.js`：驗證三章各 28 個字、總數 84、每局 10 個唯一答案、每題答案與干擾字均來自同章且互不重複、平均反應時間及 9 枚徽章價格。
- [ ] 執行 `npm test -- src/game/chineseSpaceGame.test.js --run`，確認新測試先失敗。
- [ ] 以 spec 的三組原始清單建立 JSON；每個字用穩定 ASCII id，顯示文字只來自 `text`。
- [ ] 實作目錄查找及抽題；以注入的 `random` 令測試可重現，抽題結果只包含 `{ id, answer, distractors }` 所需資料，不把 Phaser 或 store 引入純模組。
- [ ] 實作平均值：空陣列回傳 `0`，其餘回傳實際毫秒平均值並四捨五入至整數。
- [ ] 實作徽章查找和「寶石足夠且未持有」判斷；9 枚徽章完整列出學校、公園、家庭三章的 common/rare/special。
- [ ] 重跑上述 Vitest，確認通過；執行 `git diff --check`。
- [ ] Commit `feat: add Chinese space word catalog and game rules`。

**Verification:**

```bash
npm test -- src/game/chineseSpaceGame.test.js --run
git diff --check
```

---

## Task 2: 寫純局內 reducer，鎖定 HP、8 秒及反應時間行為

**Files:**

- Create `src/game/chineseSpaceSession.js`。
- Create `src/game/chineseSpaceSession.test.js`。

**Interfaces:**

```js
export function createChineseSpaceSession(questions, now = 0) {}
export function beginChineseSpaceCountdown(state, now) {}
export function resolveChineseSpaceTarget(state, targetId, now, timeLimitMs = 8000) {}
export function resolveChineseSpaceTimeout(state, now, timeLimitMs = 8000) {}
export function advanceChineseSpaceQuestion(state) {}
```

State 必須有以下欄位：

```js
{
  phase: 'audio' | 'active' | 'correct' | 'complete' | 'gameOver',
  questions,
  questionIndex,
  hp: 3,
  activeStartedAt: null,
  activeTimeMs: 0,
  wrongTargetIds: [],
  reactionTimes: [],
  correctCount: 0,
}
```

`resolve...` 一律回傳 `{ state, event }`，event 只可以是 `correct`、`wrong`、`ignored`、`timeout` 或 `gameOver`，不可原地修改輸入 state。

**Steps:**

- [ ] 先寫 reducer 測試：音訊 phase 不可答題；開始倒數才設定 `activeStartedAt`；正確答案累積從第一次倒數開始的 active interval；同題第一次射錯扣一次 HP，第二次射同一錯誤目標回 `ignored`；超時扣血、保留題目並回到 audio；HP 歸零回 `gameOver`；最後一題正確後回 `complete`。
- [ ] 特別測試錯題後重播再倒數：`activeTimeMs` 要累積前一段，新的 `activeStartedAt` 只代表新一段，平均時間不包括音訊及正確爆炸動畫。
- [ ] 執行 `npm test -- src/game/chineseSpaceSession.test.js --run`，確認先失敗。
- [ ] 實作不可變的 reducer helper；正確命中只接受目前三個 target id，無效 id 回 `ignored`；timeout 使用 `Math.min(elapsed, timeLimitMs)`，避免計時器漂移多扣時間。
- [ ] 實作 `advanceChineseSpaceQuestion`：正確動畫完成後進下一題，重設該題欄位但保留 HP、反應時間及正確數；最後一題轉 `complete`。
- [ ] 重跑測試及 `git diff --check`。
- [ ] Commit `feat: add Chinese space session reducer`。

**Verification:**

```bash
npm test -- src/game/chineseSpaceSession.test.js --run
git diff --check
```

---

## Task 3: 加入獨立太空寶石及徽章 persistence slice

**Files:**

- Create `src/store/chineseSpaceSlice.js`。
- Create `src/store/chineseSpaceSlice.test.js`。
- Modify `src/store/gameStore.js`。

**Interfaces:**

```js
export const CHINESE_SPACE_DEFAULTS = {
  spaceGems: 0,
  ownedBadgeIds: [],
  tutorialComplete: false,
};

export const createChineseSpaceSlice = (set, get) => ({
  chineseSpace: CHINESE_SPACE_DEFAULTS,
  addChineseSpaceGems(amount) {},
  markChineseSpaceTutorialComplete() {},
  redeemChineseSpaceBadge(badgeId) {},
});
```

`redeemChineseSpaceBadge` 成功回傳 `true` 並扣除價格、只加入一次；寶石不足或徽章已持有回傳 `false` 且 state 不變。

**Steps:**

- [ ] 先寫 store 測試：預設值、完成一局加 5、成功兌換、寶石不足、重複兌換、localStorage reload 及 `resetProgress` 清除新 slice。
- [ ] 執行 `npm test -- src/store/chineseSpaceSlice.test.js --run`，確認先失敗。
- [ ] 以現有 `mathSlice` 的 nested slice 寫法建立 `chineseSpace`，將 slice 合併到 `gameStore.js`。
- [ ] 將 `chineseSpace` 加入現有 `migrate`、`partialize` 及 reset flow；保留舊版本 localStorage migration 的兼容行為，舊存檔缺欄位時使用 defaults。
- [ ] 不使用既有 top-level `gems`，也不把局中 question/HP 放入 persist。
- [ ] 重跑 store 測試、現有 store 相關測試及 `git diff --check`。
- [ ] Commit `feat: persist Chinese space gems and badges`。

**Verification:**

```bash
npm test -- src/store/chineseSpaceSlice.test.js src/store --run
git diff --check
```

---

## Task 4: 建立 GPT-SoVITS 離線產音 pipeline 及 84 個音訊 manifest

**Files:**

- Create `scripts/generate-chinese-space-audio.py`。
- Create `src/audio/chineseSpaceAudio.js`。
- Create `src/audio/chineseSpaceAudio.test.js`。
- Generate `data/chinese_space_audio.json`。
- Generate `public/assets/chinese-space/audio/<chapter>/<word-id>.mp3` 共 84 個。
- If needed for explicit playback failure status, modify `src/audio/AudioEngine.js` and its existing test only to return `true` on a buffer that starts and `false` when loading fails; existing callers ignore this return value.

**Interfaces:**

```js
export function getChineseSpaceAudioUrl(wordId, baseUrl = import.meta.env.BASE_URL) {}
export function getChineseSpaceAudioItem(wordId) {}
export function getChineseSpaceAudioIds(chapterId) {}
```

Manifest 每項固定為：

```json
{
  "id": "school-teacher",
  "file": "assets/chinese-space/audio/school/school-teacher.mp3",
  "expectedText": "老師",
  "language": "yue-HK",
  "generatedBy": "gpt-sovits",
  "qaStatus": "review_required"
}
```

產生器接受：`--api-url`、`--reference-audio`、`--prompt-text-file`、`--output-dir`、`--manifest`；讀取 canonical word JSON，對每個字 POST 到 GPT-SoVITS API，接收 WAV 後用 ffmpeg 轉 MP3，任何失敗都列出 word id 並以非零狀態結束。

API body 固定使用：

```json
{
  "refer_wav_path": "/tmp/h77yz-65zza.mp3",
  "prompt_text": "<經人工核對的參考音訊文字>",
  "prompt_language": "yue",
  "text": "老師",
  "text_language": "yue"
}
```

**Steps:**

- [ ] 先寫 manifest/helper 測試：84 個 id 都有 manifest、manifest text 與 word catalog 相同、URL 使用 Vite base path、章節過濾只回傳該章 28 個 id。
- [ ] 執行 `npm test -- src/audio/chineseSpaceAudio.test.js --run`，確認先失敗。
- [ ] 寫產生器，使用 Python stdlib `argparse`、`json`、`urllib.request`、`subprocess`；先寫 WAV 暫存檔，ffmpeg 成功後才保留 MP3，單字失敗不假裝成功。
- [ ] 在機器上以 CPU 建立 GPT-SoVITS 環境；官方 README 目前支援 Python 3.10–3.12、粵語及 CPU API，使用現有 Python 3.12，不加入 repository：

  ```bash
  git clone --depth 1 https://github.com/RVC-Boss/GPT-SoVITS.git /data/gpt-sovits
  python3 -m venv /data/gpt-sovits-venv
  /data/gpt-sovits-venv/bin/pip install --upgrade pip
  /data/gpt-sovits-venv/bin/pip install torch torchcodec --index-url https://download.pytorch.org/whl/cpu
  /data/gpt-sovits-venv/bin/pip install -r /data/gpt-sovits/extra-req.txt --no-deps
  /data/gpt-sovits-venv/bin/pip install -r /data/gpt-sovits/requirements.txt
  ```

- [ ] 用官方 FunASR script 對 `/tmp/h77yz-65zza.mp3` 做 ASR，人工核對粵語內容，將一行 prompt 寫入 `/tmp/chinese_space_prompt.txt`；參考音訊及 transcript 不放入 repo：

  ```bash
  /data/gpt-sovits-venv/bin/python /data/gpt-sovits/tools/asr/funasr_asr.py \
    -i /tmp/h77yz-65zza.mp3 -o /tmp/chinese-space-asr -l zh
  ```

- [ ] 在獨立 terminal 啟動 CPU API，不用背景程序遮掩錯誤：

  ```bash
  cd /data/gpt-sovits
  /data/gpt-sovits-venv/bin/python api.py \
    -dr /tmp/h77yz-65zza.mp3 \
    -dt "$(tr '\n' ' ' < /tmp/chinese_space_prompt.txt)" \
    -dl yue -d cpu -a 127.0.0.1 -p 9880
  ```

- [ ] 執行 84 段離線生成：

  ```bash
  python3 scripts/generate-chinese-space-audio.py \
    --api-url http://127.0.0.1:9880 \
    --reference-audio /tmp/h77yz-65zza.mp3 \
    --prompt-text-file /tmp/chinese_space_prompt.txt \
    --output-dir public/assets/chinese-space/audio \
    --manifest data/chinese_space_audio.json
  ```

- [ ] 逐段人工播放及核對 84 個 MP3；全部正確後把 manifest 的 `qaStatus` 由 `review_required` 改為 `pass`，錯誤字音重新生成，並確認 reference MP3 未出現在 git status。
- [ ] 重跑 helper/manifest 測試、音訊檔案檢查及 `git diff --check`。
- [ ] Commit `feat: add Cantonese Chinese space audio assets`。

**Verification:**

```bash
npm test -- src/audio/chineseSpaceAudio.test.js --run
find public/assets/chinese-space/audio -name '*.mp3' | wc -l
git status --short --ignored
git diff --check
```

---

## Task 5: 實作 Phaser 遊戲 scene 及三章遊戲流程

**Files:**

- Create `src/chinese-space/ChineseSpaceScene.js`。
- Create `src/chinese-space/chineseSpaceCopy.js`。
- Create `src/chinese-space/ChineseSpaceScene.test.js` only for scene factory contracts that do not require a real browser canvas.

**Factory contract:**

```js
export function createChineseSpaceScene(Phaser, {
  audio: {
    playWord(wordId),
    playSfx(name),
    stop(),
  },
  store: {
    getState(),
    addGems(amount),
    markTutorialComplete(),
    redeemBadge(badgeId),
  },
  onExit(),
  onSessionComplete(result),
  onUiStateChange(snapshot),
}) {}
```

Scene 必須公開 `showHome()`、`showChapterSelect()`、`startChapter(chapterId)`、`showBadges()`、`destroyAudio()`，讓 wrapper 和測試可以控制生命週期。

**Steps:**

- [ ] 先寫 scene factory 測試，驗證 factory 回傳 Phaser scene config、copy 不含簡體中文、`destroyAudio` 會呼叫 audio stop；執行 `npm test -- src/chinese-space/ChineseSpaceScene.test.js --run` 確認先失敗。
- [ ] 用 Phaser Graphics、Text、Container、Particles/簡單幾何畫出太空站／公園星球／家庭基地三個主題、可愛小戰機、三條航道、心心 HP、倒數、分數及太空寶石；不引入新 bitmap 素材。
- [ ] 以內部 screen mode 管理 `home`、`chapterSelect`、`tutorial`、`audio`、`active`、`result`、`gameOver`、`badges`、`orientation`；所有按鈕同時支援 pointer 及鍵盤可操作路徑。
- [ ] `startChapter` 呼叫 `buildChineseSpaceSession`，固定 10 題；每題建立三個 target，正確 lane 用注入 random 產生，三個 target 保持在固定航道。
- [ ] 音訊流程遵守以下狀態轉換：

  ```js
  startQuestion();
  // phase === 'audio'; movement allowed, firing disabled
  playWord(answer.id).then((ok) => {
    if (!ok) return showAudioRetry();
    state = beginChineseSpaceCountdown(state, performance.now());
    // phase === 'active'; start the 8-second countdown
  });
  ```

- [ ] `update` 只在 active phase 處理長按開火；以 220ms fire interval 生成子彈，手動檢查子彈與三個 target 的 bounds overlap，命中後呼叫 reducer，避免加入 physics plugin。
- [ ] 錯誤 target 立即播放 damage 音效、扣 HP；若同一 target 再射只顯示短提示，不再扣血；重新播放該題粵語並在音訊完成後重開 8 秒。
- [ ] 超時播放 timeout/explosion 音效、扣 HP、同題重播；HP 歸零停止輸入及 timer，顯示爆機並提供「再玩一次」及「選擇章節」。
- [ ] 正確命中播放短促開心提示音及目標爆炸音效，記錄反應時間；動畫後進下一題。完成後計算平均反應時間、顯示正確數／10、剩餘 HP、寶石，呼叫 `onSessionComplete` 一次並由 wrapper 加 5 寶石。
- [ ] 實作教學只首次顯示：解釋「聽聲音、移動戰機、射正確中文字」，完成後呼叫 `markTutorialComplete`；中途離開不保存局中 state。
- [ ] 實作徽章頁：顯示三章九枚徽章、價格、已擁有狀態及當前太空寶石；呼叫 `redeemBadge` 後立即重畫，寶石不足顯示短訊息。
- [ ] 實作最後 3 秒視覺警告、音效只在 timeout/HP 歸零使用；不加入背景音樂、排名、每日任務或 streak。
- [ ] 重跑 scene 測試及 `git diff --check`。
- [ ] Commit `feat: add Phaser Chinese space shooter scene`。

**Verification:**

```bash
npm test -- src/chinese-space/ChineseSpaceScene.test.js src/game/chineseSpaceSession.test.js --run
git diff --check
```

---

## Task 6: 接入 React route、主畫面入口及響應式外殼

**Files:**

- Create `src/screens/ChineseSpaceGame.jsx`。
- Create `src/styles/chinese-space.css`。
- Create `src/screens/ChineseSpaceGame.test.jsx`。
- Modify `src/App.jsx`。
- Modify `src/screens/HomeDashboard.jsx`。
- Modify `src/screens/HomeDashboard.test.jsx`。
- Modify `src/i18n/translations.js`。

**Wrapper contract:**

```jsx
export default function ChineseSpaceGame() {
  // one Phaser.Game per mount; destroy it and stop audio on unmount
}
```

Phaser config 使用 `Phaser.Scale.RESIZE`、parent ref、1280x720 logical size；React 用 lazy import 保持主 bundle 不預先載入新 scene。audio adapter 由現有 `audioEngine` 播放 `getChineseSpaceAudioUrl(wordId)`，SFX 重用 `audioEngine.playUI` 及現有音效檔。

**Steps:**

- [ ] 先寫 React/route 測試：mount 有一個 game container、unmount 呼叫 Phaser destroy 及 audio stop、`/chinese-space` 可顯示、主畫面「常用中文字」卡片導向新 route；執行相關 Vitest 確認先失敗。
- [ ] 建立 `ChineseSpaceGame`，動態 import `phaser` 及 `ChineseSpaceScene`，只在 effect 建立一次 `new Phaser.Game`，cleanup 必須 destroy 並停止 audio。
- [ ] 將 Zustand `useGameStore.getState()` 動作包成 scene adapter；完成 callback 只加一次 5 顆太空寶石，徽章兌換使用 `redeemChineseSpaceBadge` 規則。
- [ ] 加入 visually-hidden `aria-live` status mirror，讓鍵盤／讀屏及 Playwright 能取得目前 screen、題號、HP、倒數及結果；畫面本身仍由 Phaser 繪製。
- [ ] 在 `App.jsx` 加 lazy route `/chinese-space`，沿用現有 HashRouter、錯誤 fallback 及回主頁導航模式。
- [ ] 在 HomeDashboard 的現有學習區加入獨立卡片及繁體中文 translation keys，不改舊 blending／phonics 卡片行為。
- [ ] 加入 landscape canvas CSS、safe-area、touch-action 及 portrait rotate overlay；保證 pointer 操作在窄屏仍可點擊。
- [ ] 重跑新測試、HomeDashboard 既有測試及 `git diff --check`。
- [ ] Commit `feat: expose Chinese space shooter route`。

**Verification:**

```bash
npm test -- src/screens/ChineseSpaceGame.test.jsx src/screens/HomeDashboard.test.jsx --run
git diff --check
```

---

## Task 7: 加入瀏覽器 smoke tests、全量驗證及部署

**Files:**

- Create `tests/chinese-space.spec.js`。
- Modify existing test helpers only if the current audio route mock cannot serve a short deterministic audio response.

**E2E coverage:**

- [ ] 由首頁點「常用中文字」進入 `/chinese-space`，確認 container、canvas 及繁體中文 accessible status 出現。
- [ ] 確認三章選擇、首次教學、回到章節頁及徽章入口；使用 browser localStorage 清理確保測試獨立。
- [ ] Mock 84 個 MP3 request 為短 audio response，避免 E2E 依賴本機 GPT-SoVITS；另以 fixed viewport 驗證 portrait rotate prompt 及 landscape game canvas。
- [ ] 以 pointer/keyboard 觸發左、右、Space 控制，確認音訊 phase 不開火、active phase 可開火；用 accessible status 驗證錯題／超時會扣 HP、完成頁顯示結果及寶石 persistence。
- [ ] 測試徽章：完成局後有 5 顆太空寶石，兌換 5 價格徽章成功，再次兌換及餘額不足均不會重複扣款。

**Verification and release steps:**

```bash
npm test -- --run
npx playwright test tests/chinese-space.spec.js
npm run build
git diff --check
git status --short
```

- [ ] 檢查 production build 不把 `/tmp/h77yz-65zza.mp3`、GPT-SoVITS 路徑或 prompt 文字打包入 `dist`。
- [ ] 檢查 manifest 為 84 項、每個 MP3 可讀、所有 `qaStatus` 為 `pass`，並手動確認至少每章的首、中、尾字音質。
- [ ] 檢查 `git diff --stat` 只包含新中文遊戲及必要 route/store/audio 接線；保留使用者現有未相關修改，不 reset 或覆蓋。
- [ ] Commit `test: verify Chinese space shooter flow`。
- [ ] 按 user 已授權的 GitHub workflow 執行 `git push origin main`；如 repository 的 deploy script 是既有正式流程，再執行 `npm run deploy`，最後用公開網址做一次首頁及 `/chinese-space` smoke check。
- [ ] 最終回報 commit、push/deploy 結果、測試命令及音訊 QA 結果；若 push 或 deploy 需要額外憑證，只回報具體阻塞，不修改本地完成狀態。

---

## Acceptance Checklist

- [ ] 首頁有「常用中文字」入口，三章均可開始。
- [ ] 每局 10 題、每題三個同章中文字、正確答案隨機 lane。
- [ ] 粵語音訊完成後才開始 8 秒；錯射／超時扣 HP 並重播；HP 由 3 跨題保留，歸零爆機。
- [ ] 長按／Space 連射、左右慢速移動、固定三 lane、目標不落底。
- [ ] 完成結果顯示平均反應時間、正確數、剩餘 HP、5 顆太空寶石。
- [ ] 三章共九枚徽章，5/15/30 價格，兌換入口在主畫面及完成頁，且每枚只能兌換一次。
- [ ] 84 個 MP3 由 GPT-SoVITS CPU 離線生成並人工核對，reference audio 不入 repo。
- [ ] `npm test -- --run`、`npx playwright test tests/chinese-space.spec.js`、`npm run build` 全部通過。
