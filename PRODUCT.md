# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

香港小一學生與陪同家長；學生在短時間、觸控優先的遊戲流程中完成中文、數學及英文學習任務，並在獎勵商店管理角色造型。

## Product Purpose

「升夢大冒險」把小一學科練習放進可探索的冒險流程。答題、跑酷與關卡進度會產生金幣、寶石和榮譽，成功標準是孩子能清楚完成學習任務、看見進度並安全使用獎勵系統。

## Positioning

學習結果直接驅動冒險進度與可穿戴角色收藏；夢幻衣櫥不是獨立展示，而是學習獎勵回到角色身份的可見回饋。

## Operating Context

遊戲以 Phaser 3 WebGL/Canvas 執行，使用 Phaser Scale.FIT 適配 desktop、tablet 與 mobile landscape。玩家從主頁進入地圖、學科題目、跑酷、結算與商店；本地 profile 透過 DataManager 和 localStorage 保存。

## Capabilities and Constraints

- TypeScript、Phaser 3、Web Audio API、Web Speech API。
- 商店保留角色 skin、夢幻衣櫥、萌寵伴侶與冒險道具四個既有入口。
- 商品選擇只能試穿；購買按鈕才可扣除貨幣、保存 inventory、標記擁有及穿戴。
- Outfit 必須能在正式美術缺失時安全回退到 base character，不能因 texture missing crash。
- 重要操作符合兒童觸控目標與低刺激動畫要求；不以顏色作為唯一 selected 狀態。

## Brand Commitments

產品名稱為「升夢大冒險」；Dream Wardrobe 使用暗紫、皇室藍與暖金的可愛 fantasy adventure 語彙，保持兒童友善，不做成人 RPG。

## Evidence on Hand

- 現有 Kenney platformer character base/pose/limb assets：`public/assets/kenney/platformer-characters/`。
- 目前沒有 Scholar Gown、Princess Dress、Dino Onesie、Magic Robe 的正式 wearing sprite 或商品 thumbnail；後續美術需求記錄於 `docs/outfit-art-prompts.md` 與 generated outfit placeholder。
- 既有 currency、inventory、profile、audio、course progress 與 1,025 個 unit tests。

## Product Principles

- 學習回饋要能被孩子立即看見。
- 試穿和購買是兩個清楚、可逆的狀態。
- 角色服裝應是角色的一部分，而非漂浮 icon。
- 缺少美術不能破壞遊戲流程。

## Accessibility & Inclusion

文字保持可讀大小；重要按鈕至少 44×44 CSS px equivalent；selected 狀態同時使用邊框、光暈與 checkmark；避免 rapid flashing、screen shake 和高頻刺激。
