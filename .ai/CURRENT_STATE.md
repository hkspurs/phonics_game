# Current State of P1 Adventure (升夢大冒險)

**Last Updated**: 2026-08-31T11:50:00+08:00  
**Current Version**: `v1.1.0`  
**Git Head**: `8086be3e` (`master`, `main`, `p1-adventure`)  
**Engine**: Phaser 3.87.0 + TypeScript 5.5 + Vite 5.3 + Vitest 2.0  

---

## 1. Project Overview & Architecture Summary

《升夢大冒險》（P1 Adventure）是一套專為香港幼小銜接（升小一）設計的綜合互動學習遊戲，涵蓋中文（粵語發音）、英文（Phonics 拼音與語法）與數學（基礎算術與時鐘）三大主科。

### 核心系統架構
1. **Scene 狀態機**：
   - `PreloadScene`: 預加載紋理、音訊、字型與程式化 Canvas 紋理（金幣、寶石、跳板、苔蘚岩石、雲朵）。
   - `TitleScene`: 主標題選單、進入冒險、商城入口與個人資料面板。
   - `MapScene`: 世界地圖節點（中環冒險島、九龍文化島等），管理關卡解鎖進度與星級。
   - `QuestionScene`: 核心作答介面（多選 Choice、字詞入框 Token Scramble、數學算式），配備手繪黑板木框、語音朗讀與連勝特效。
   - `RunnerScene`: 跑酷衝刺關卡（視差背景、物理重力、雙跳、護盾氣泡、彈簧跳板、動態接地陰影、寶箱開箱爆發、萌寵跟隨）。
   - `ShopScene`: 夢幻衣櫥與冒險商店（角色造型、18 件換裝部位、萌寵伴侶、OOTD 拍立得相框、舞台聚光燈）。

2. **核心服務 (Services & Singletons)**：
   - `DataManager`: 單例狀態管理器，負責 LocalStorage 存檔（`p1_adventure_save_v1`）、金幣/寶石/星星經濟系統、背包、造型解鎖與換裝裝備持久化。
   - `SoundManager`: Web Audio API 音訊合成器（點擊、金幣拾取琶音、彈簧音、成就音），無需依賴外部音檔。
   - `SpeechService`: Web Speech API 語音合成器，支援粵語（`zh-HK`）、國語（`zh-TW`）與英語（`en-US` / `en-GB`）。
   - `PlayerAvatarService`: 跨場景主角外觀、姿勢與紋理映射快取。

3. **換裝與立繪渲染管線 (Wardrobe Pipeline)**：
   - `CharacterOutfitCompositor`: 計算人體工學換裝座標與向量圖層渲染。
   - `OutfitRenderer`: 混合渲染架構（`FULL_SPRITE`, `RIGGED`, `ACCESSORY_LAYER`），負責 512x512 高解析度立繪自動 Downscale（`0.23x`）與紋理快取。
   - `CharacterPreviewController`: 商城即時展示台控制器，支援 Stand / Run / Cheer 動畫切換與換裝粒子反光。

---

## 2. Completed Major Features (已實裝重大功能)

- [x] **學科題庫引擎**：支援中文句子重組（標點符號保護）、英文 CVC 拼音單詞卡、數學加減法自動題目生成。
- [x] **字詞入框互動**：點擊選詞、拖曳放置、點擊放回、重置按鈕、高解析度字體（`>= 28px`）。
- [x] **五大角色造型**：冒險家（Adventurer）、女英雄（Heroine）、戰士（Soldier）、騎士（Knight）、忍者（Ninja），各自具備跑速/跳躍/磁力加成。
- [x] **五大主題服裝全套 Sprite 升級**：
  - 經典名校校服（`school_uniform` / `hk_school_shirt`）
  - 升小一榮譽學士袍（`scholar_gown` / `scholar_robe`）
  - 夢幻粉紅公主裙（`princess_dress`）
  - 萌萌小恐龍連身衣（`dino_onesie`）
  - 星光魔法學徒袍（`magic_robe`）
  均已產出 512x512 高畫質透明立繪（Idle / Run / Cheer / Thumb），告別貼紙感。
- [x] **18 件模組化換裝飾品與互斥邏輯**：連身裙（Dress）與上衣/下裝（Top/Bottom）嚴格互斥，背後飾品（`angel_wings`）在 Depth 35 渲染於身體後方。
- [x] **萌寵伴侶系統**：太空柴犬、魔法貓咪、恐龍寶寶跟隨奔跑與勝利舞蹈。
- [x] **跑酷衝刺物理與動效**：
  - 地表動態接地陰影（跳躍高度縮放衰減）
  - 繪本風苔蘚障礙巨石與跳躍警告光弧
  - 彈簧跳板 Squash-and-Stretch 擠壓回彈動畫
  - 終點寶箱扇形拋物線金幣噴發
  - 衝刺大成功高對比深藍卡片底板
  - 頂部進度條金星跑者 Pin 針
- [x] **OOTD 今日穿搭拍立得**：手繪紙膠帶相框、金牌滿分穿搭印章、全套立繪預覽。

---

## 3. Current Development Direction (當前開發方向)

1. **多平台與行動端響應式體驗**：確保 iPhone 16 Pro Max、iPhone SE、iPad 與桌面端在 `Phaser.Scale.FIT` 模式下無任何觸控死區或文字裁切。
2. **多語言與音訊發音精準度**：強化 SpeechService 在不同瀏覽器（Safari / Chrome / iOS WebKit）上的語音容錯降級。
3. **後續主題關卡擴展**：世界 2（九龍半島）與世界 3（新界探索）題目與專屬場景美術擴展。

---

## 4. Known Issues & Edge Cases (已知注意事項與邊界情況)

- **Phaser 測試環境 Mock 限制**：Vitest 跑在 Node.js JSDOM 環境下，`Phaser.GameObjects.Graphics` 缺少 `strokeCircle` 或 `lineBetween` 等非標準 Canvas 方法。在撰寫圖形代碼時，必須使用 `CharacterOutfitCompositor.drawLine()` 或檢查 `typeof g.strokeCircle === 'function'` 安全回退。
- **LocalStorage 容錯**：所有讀取 `localStorage` 的代碼必須以 `try/catch` 包裹，防止隱私模式或 JSON 損毀導致黑屏。
- **高解析度 Sprite 比例**：512x512 Master 資產在展示台或跑酷中需透過 `OutfitRenderer` 正確縮放（`0.23x` ~ `0.42x`），切勿以 `1.0` 原始尺寸直接渲染導致角色佔滿螢幕。

---

## 5. Important Technical Decisions (重要技術決策)

- **ADR-001**: 採用 512x512 Master Character Sprite 標準（地表基準線 Y=460，水平中軸 X=256，Chibi 1:2.5 比例），主要服裝全套繪製，飾品分層（Back Accessory: Depth 35, Front Accessory: Depth 45）。
- **ADR-002**: 建立 `.ai/` 單一真相來源協同控制系統，Google AGY 與 OpenAI Codex 嚴格遵守文件協議、任務看板與鎖定機制。
