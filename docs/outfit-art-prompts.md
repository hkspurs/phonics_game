# 🎨 角色服飾美術提示詞工程規範 (Nano Banana / AI Character Outfit Prompts)

本文件定義《升夢大冒險》（P1 Adventure）中所有角色服飾在 **Nano Banana / Midjourney / Stable Diffusion / DALL-E 3** 中的標準提示詞工程模版與一致性參數。

---

## 📐 1. 核心風格與一致性參數 (Universal Consistency Guidelines)

為確保所有生成的角色服裝與現有遊戲美術 100% 融合，所有提示詞必須嚴格遵循以下約束：

- **頭身比例**: 2.5 頭身 Q 版小學生 (2.5-head chibi proportion, cute primary-school child).
- **美術風格**: 乾淨柔和賽璐珞動漫風 (Clean soft cel-shaded anime mobile game sprite art).
- **光影方向**: 左上方 45 度柔和頂光 (Top-left soft lighting, subtle gradient shading).
- **線條標準**: 統一清晰深色描邊 (Consistent clean dark outlines, 2px stroke width).
- **視角與姿勢**: 正面站立/三態動作 (Front-facing neutral pose, orthographic 2D view).
- **背景規範**: 絕對純透明背景 (Pure transparent background, alpha PNG, isolated character).
- **負向提示詞 (Negative Prompts)**: `realistic, 3D render, photorealistic, adult, tall, distorted limbs, text, watermark, UI, buttons, blurry, messy outlines, noisy background`.

---

## 👘 2. 四大核心連身洋裝 / 長袍套裝 (Level 1 Full-Body Outfits)

### 🎓 套裝 1：升小一榮譽學士袍 (Scholar Gown)
- **道具 ID**: `scholar_robe`
- **中文名稱**: 升小一榮譽學士袍
- **英文名稱**: Scholar Gown
- **部位分類**: `dress` (連身套裝)
- **Prompt (Idle 站立/呼吸姿勢)**:
  ```text
  Cute chibi 2.5-head primary-school boy character, full body, wearing an elegant royal navy-blue graduation scholar gown, gold embroidered lapels and golden sash down the center, crisp white collared shirt visible at neck with a small navy necktie, wearing a black square mortarboard cap with a golden hanging tassel, brown clean short hair, cheerful smiling face with large sparkling eyes, front-facing, neutral idle standing pose, clean 2D vector-style mobile game sprite, soft cel shading, consistent dark outline, transparent background, isolated, no UI, no text, children friendly --ar 1:1 --no background, photorealistic, 3d, watermark
  ```
- **Prompt (Run 奔跑姿勢)**:
  ```text
  Cute chibi 2.5-head primary-school boy character, full body running to the right, dynamic side-angle 3/4 view, wearing an elegant royal navy-blue graduation scholar gown billowing slightly behind, gold embroidered lapels, black mortarboard cap with swinging golden tassel, energetic running pose with bent knees and swinging arms, clean 2D game sprite, transparent background --ar 1:1 --no background
  ```
- **Prompt (Cheer 歡呼姿勢)**:
  ```text
  Cute chibi 2.5-head primary-school boy character, full body jumping in celebration, both arms raised high in victory holding a rolled golden graduation diploma with red ribbon, wearing royal navy graduation scholar gown and black mortarboard cap, joyful open-mouth smiling expression, sparkling star particles around, transparent background --ar 1:1 --no background
  ```
- **Prompt (Thumbnail 商城展示圖)**:
  ```text
  Item illustration of an elegant folded royal navy graduation scholar gown with gold embroidered lapel ribbons and a miniature black graduation cap with golden tassel beside it, soft floating sparkles, 2.5D isometric view, cute children game inventory icon, clean vector graphic, solid white background, high contrast --ar 1:1
  ```

---

### 👗 套裝 2：夢幻粉紅公主裙 (Princess Dress)
- **道具 ID**: `princess_dress`
- **中文名稱**: 夢幻粉紅公主裙
- **英文名稱**: Princess Dress
- **部位分類**: `dress` (連身套裝)
- **Prompt (Idle 站立姿勢)**:
  ```text
  Cute chibi 2.5-head primary-school girl character, full body, wearing a fairytale pastel pink layered princess dress with soft magenta ruffles, white lace waist sash, small sparkling golden star brooch at neckline, wearing a petite golden princess tiara on head, cheerful friendly expression with sparkling eyes, front-facing idle pose, clean 2D anime mobile game sprite, soft cel shading, transparent background --ar 1:1 --no background
  ```
- **Prompt (Thumbnail 商城展示圖)**:
  ```text
  Item illustration of a luxurious pastel pink princess gown on a miniature wooden mannequin, sparkling diamond accents, golden tiara resting beside, soft glowing fairy sparkles, isometric inventory icon, clean vector art, transparent background --ar 1:1
  ```

---

### 🦖 套裝 3：萌萌小恐龍連身衣 (Dino Onesie)
- **道具 ID**: `dino_onesie`
- **中文名稱**: 萌萌小恐龍連身衣
- **英文名稱**: Dino Onesie
- **部位分類**: `dress` (連身套裝)
- **Prompt (Idle 站立姿勢)**:
  ```text
  Cute chibi 2.5-head primary-school child character, full body, wearing an emerald green plush dinosaur onesie costume with a soft pastel yellow oval tummy patch, soft yellow dinosaur back ridges along spine and hood, dinosaur face hood resting over forehead with cute round eyes, front-facing cute standing pose, clean 2D mobile game sprite, transparent background --ar 1:1 --no background
  ```
- **Prompt (Thumbnail 商城展示圖)**:
  ```text
  Item illustration of an adorable folded emerald green dinosaur onesie pajama with yellow felt spikes and dino hood, cute cozy children game inventory icon, clean 2D vector art, transparent background --ar 1:1
  ```

---

### 🧙‍♀️ 套裝 4：星光魔法學徒袍 (Magic Robe)
- **道具 ID**: `magic_robe`
- **中文名稱**: 星光魔法學徒袍
- **英文名稱**: Magic Robe
- **部位分類**: `dress` (連身套裝)
- **Prompt (Idle 站立姿勢)**:
  ```text
  Cute chibi 2.5-head primary-school child character, full body, wearing a celestial deep indigo-purple wizard apprentice robe with golden crescent moon and star runes embroidered along the hem and sleeves, glowing violet leather sash belt with a small potion vial, pointy wizard hat with a golden buckle, front-facing magical stance, transparent background --ar 1:1 --no background
  ```

---

## 👕 3. 潮流上衣與校服部件 (Level 2 Layered Tops)

### ⚓ 上衣 1：天星小輪水手襯衫 (`sailor_top`)
- **Prompt (Layered Top)**:
  ```text
  Crisp white sailor uniform shirt for a chibi child character, navy blue sailor flap collar on back and shoulders, small red silk ribbon bowtie at chest, tailored short sleeves, clean 2D game sprite asset, front-facing, perfectly centered, transparent background, no character body, item only --ar 1:1
  ```

### 🏫 上衣 2：經典名校白色校服衫 (`hk_school_shirt`)
- **Prompt (Layered Top)**:
  ```text
  Crisp ironed pure white school uniform button-down shirt for a primary school child, neat stiff collar with royal blue necktie, left chest pocket with miniature blue school crest badge, clean 2D sprite asset, transparent background --ar 1:1
  ```

### 🎽 上衣 3：運動健將亮藍球衣 (`sport_jersey`)
- **Prompt (Layered Top)**:
  ```text
  Vibrant cyan-blue athletic sports jersey shirt for a chibi child, dual white racing stripes along sides, circular white chest badge with bold number '1', clean 2D vector game sprite, transparent background --ar 1:1
  ```

### 🧥 上衣 4：暖陽金星連帽衛衣 (`hoodie_star`)
- **Prompt (Layered Top)**:
  ```text
  Warm golden amber hoodie sweater for a chibi child, thick drawstring hood resting behind neck, front kangaroo hand pocket, white five-pointed star emblem printed on chest, clean 2D game asset, transparent background --ar 1:1
  ```

---

## 👖 4. 褲裝與裙裝部件 (Level 2 Layered Bottoms)

### 🩳 下裝 1：英倫名校深藍百褶短裙 (`pleated_skirt`)
- **Prompt (Layered Bottom)**:
  ```text
  Traditional British navy-blue pleated school uniform skirt for a chibi child, sharp vertical pleat folds with soft lighting shadows, neat waistband, clean 2D game sprite asset, transparent background --ar 1:1
  ```

### 👖 下裝 2：經典百搭牛仔短褲 (`denim_shorts`)
- **Prompt (Layered Bottom)**:
  ```text
  Casual denim blue shorts for a chibi child, copper rivet details, double-stitched hem lines, neat belt loops, clean 2D game sprite, transparent background --ar 1:1
  ```

---

## 🎀 5. 配件與飾品部件 (Level 3 Accessories)

### 🪽 配件 1：潔白天使羽翼 (`angel_wings`)
- **Prompt**: `Dual layered pure white feathered angel wings for a chibi child game character, soft sky-blue inner glow, spread symmetrically, clean 2D game asset, transparent background --ar 1:1`

### 🎒 配件 2：星星探險小背囊 (`star_backpack`)
- **Prompt**: `Cute golden yellow five-pointed star shaped small adventure backpack for a child, dark brown leather shoulder straps, zipper pull tab, 3D isometric angle, clean vector game asset, transparent background --ar 1:1`

### 👓 配件 3：智慧小博士星光眼鏡 (`star_glasses`)
- **Prompt**: `Cute round golden metallic wireframe glasses for a chibi child face, thin metal bridge and temples, transparent lenses with subtle white light reflection glint, clean 2D sprite, transparent background --ar 1:1`

### 🎓 配件 4：小一榮譽學士帽 (`scholar_cap`)
- **Prompt**: `Classic black square mortarboard graduation cap for a child, gold button on top with hanging golden tassel draped to the right, isometric 2.5D angle, clean vector game icon, transparent background --ar 1:1`

### 🐱 配件 5：萌萌貓耳髮箍 (`cat_ears`)
- **Prompt**: `Adorable pastel pink cat ears headband for a child character, soft inner pink fluff, thin black headband band, clean 2D vector game sprite, transparent background --ar 1:1`

### 🧢 配件 6：叮叮車可愛車長帽 (`tram_hat`)
- **Prompt**: `Vintage Hong Kong dark green tram conductor visor cap for a child, golden braided rope band above glossy black visor brim, clean 2D game icon, transparent background --ar 1:1`
