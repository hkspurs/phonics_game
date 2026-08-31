# Master Character Specification (角色美術標準規範)

## 1. Overview & Vision
本規範定義《升夢大冒險》（P1 Adventure）角色換裝系統（Dream Wardrobe）的生產級（Production-quality）角色美術標準。
為杜絕粗糙的 PNG 貼紙感（PNG overlay / Vector sticker）與畫風割裂問題，主要服裝（Major Outfits）採用 **全角色整套繪製（Full Character Sprite Set）** 架構，確保角色在各種姿勢與動畫中維持 100% 畫風與身份一致性。

---

## 2. Master Character Dimensions & Canvas Standards

| 規範項目 | 規格值 | 說明 |
|---|---|---|
| **Canvas 尺寸** | `512 x 512 px` (高解析度) | 遊戲中由 Phaser 動態 Downscale 至目標視口尺寸，保證 Retina 高畫質 |
| **角色佔比 (Height Ratio)** | `75% - 82%` Canvas 高度 | 角色身高約 `390px - 420px`，上下預留安全空間避免頭飾/跳躍裁切 |
| **水平中心 (Center X)** | `X = 256 px` (正中) | 角色身體軀幹中軸線與 Canvas 中心完全對齊 |
| **地表基準線 (Ground Y / Baseline)** | `Y = 460 px` | 雙腳著地點，保證所有服裝與姿勢在更換時零垂直抖動 |
| **頭部錨點 (Head Center)** | `(256, 175)` | 直徑約 `160px`，大頭 Q 版 (Chibi 1:2.5 頭身比) |
| **雙眼定位 (Eyes Level)** | `Y = 185 px` | 臉部特徵基準，適用眼鏡與臉部飾品對齊 |
| **肩膀中線 (Shoulder Level)** | `Y = 270 px` | 寬度約 `180px`，雙肩自然下垂或微張 |
| **腰部水平 (Waist Level)** | `Y = 350 px` | 上衣下擺與褲裙分界線 |
| **腳踝著地 (Feet Base)** | `Y = 445 - 460 px` | 穿著鞋襪的接觸地面 |

---

## 3. Character Identity & Visual Constants (角色身份與不變特徵)

所有 Outfit 必須遵循 **「同一個孩子換衣服 (Same Child, New Clothes)」** 原則：

```
[SAME CHARACTER IDENTITY]
├── 面部特徵 (Face): 圓潤萌系大眼、微笑小嘴、自然微腮紅、溫暖膚色 (#fcd5b5)
├── 髮型髮色 (Hair): 招牌蓬鬆淺棕短髮 (#a06535)，朝氣前額劉海，頂部自然髮束微翹
├── 頭身比例 (Proportion): 1:2.5 Chibi Q版，大頭、短軀幹、小手小腳
├── 視角鏡頭 (Camera): 正面微 3/4 視角 (Frontal 2.5D Orthographic)，無誇張透視畸變
├── 輪廓描邊 (Outline): 2.5px - 3.5px 柔和深褐色描邊 (#3d2314)，非生硬死黑
└── 光影色彩 (Lighting): 頂部偏左前方漫射暖光，柔和二階賽璐璐陰影 (Soft 2-step Cel-shading)
```

---

## 4. Outfit Asset Directory Architecture

```
assets/characters/main/outfits/
├── school_uniform/          # 經典名校校服 (Milestone 1)
│   ├── thumbnail.png        # 商城 128x128 圓角預覽圖
│   ├── idle/
│   │   └── idle_01.png      # 正面站立待機
│   ├── run/
│   │   ├── run_01.png       # 跑步循環幀 1-6
│   │   ├── run_02.png
│   │   ├── run_03.png
│   │   ├── run_04.png
│   │   ├── run_05.png
│   │   └── run_06.png
│   └── cheer/
│       ├── cheer_01.png     # 慶祝跳躍幀 1-4
│       ├── cheer_02.png
│       ├── cheer_03.png
│       └── cheer_04.png
├── scholar_gown/            # 升小一榮譽學士袍
├── princess_dress/          # 夢幻粉紅公主裙
├── dino_onesie/             # 萌萌小恐龍連身衣
├── magic_robe/              # 星光魔法學徒袍
└── star_hoodie/             # 閃爍星光連帽衛衣
```

---

## 5. Layering & Modular Accessories Stacking

飾品與配件採用獨立圖層化（Modular Layered）渲染，分層深度順序如下：

```
[Layer 01] BACK_ACCESSORY  (潔白天使羽翼 angel_wings 位於軀幹背後)
    │
[Layer 02] FULL_OUTFIT_SPRITE (主服裝全角色繪製: 校服 / 學士袍 / 公主裙 / 恐龍裝)
    │
[Layer 03] FRONT_ACCESSORY (星光背包 star_backpack 斜挎於胸前/單肩)
    │
[Layer 04] FACE_ACCESSORY  (星星眼鏡 star_glasses 貼合雙眼水平線)
    │
[Layer 05] HAT / HEADWEAR  (貓耳 cat_ears / 學士帽 scholar_cap / 電車帽 tram_hat 貼合頭頂)
    │
[Layer 06] FX / PARTICLES  (星光光環、走動微粒、金幣反光)
```

---

## 6. Art Quality Assurance Gate (美術驗收 12 條鐵則)

- [x] **AC01 穿著真實性**：服裝必須為自然包裹角色軀幹與四肢的完整插畫，嚴禁矩形貼圖貼在胸口。
- [x] **AC02 身份一致性**：髮型、髮色、膚色、五官在所有服裝間 100% 保持同一角色。
- [x] **AC03 解析度充足**：Master 資產均為 512x512 以上高畫質，不得放大低像素圖。
- [x] **AC04 飾品層級正確**：天使羽翼必定在背後（BACK_ACCESSORY），不得遮擋胸膛與面部。
- [x] **AC05 零文字與假校徽**：嚴禁生成隨機亂碼文字、假學校 Logo 或怪異符號。
- [x] **AC06 背景純透明**：所有幀均為透明 PNG，邊緣平滑抗鋸齒，無白邊或黑邊瑕疵。
- [x] **AC07 基準線對齊**：所有動畫幀的腳底水平線必須穩定在 Y = 460 px，切換無跳躍抖動。
- [x] **AC08 肢體完整無畸變**：雙手手指、雙腳結構自然清晰，無多餘手指或肢體融合。
- [x] **AC09 動畫流暢性**：Run 幀形成完整循環，Cheer 幀展現舉手跳躍歡呼。
- [x] **AC10 色彩風格統一**：符合小學一年級歡樂溫馨童話繪本風格。
- [x] **AC11 健全容錯降級**：若某動作幀缺失，Phaser 自動平滑降級至 Idle 幀或骨骼補間，絕不報錯黑屏。
- [x] **AC12 經濟邏輯零破壞**：換裝系統與 DataManager 存檔、金幣購買邏輯 100% 兼容。
