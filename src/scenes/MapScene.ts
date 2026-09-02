import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { DataManager } from '../services/DataManager';
import { SoundManager } from '../services/SoundManager';
import { CanvasButton } from '../ui/CanvasButton';
import { CanvasModal } from '../ui/CanvasModal';
import { StarRating } from '../ui/StarRating';
import { PlayerAvatarBadge } from '../ui/PlayerAvatarBadge';
import { DiagnosticReportModal } from '../ui/DiagnosticReportModal';

export interface StationData {
  id: number;
  name: string;
  englishName: string;
  description: string;
  themeColor: number;
  icon: string;
  x: number;
  y: number;
  biome: string;
}

export const STATIONS: readonly StationData[] = [
  {
    id: 1,
    name: '小木屋',
    englishName: 'Log Cabin',
    description: '溫馨的冒險起點，林間小木屋',
    themeColor: 0x8b5a2b,
    icon: '🏡',
    x: 640,
    y: 2200,
    biome: '森林起點',
  },
  {
    id: 2,
    name: '綠野小徑',
    englishName: 'Green Trail',
    description: '青草芬芳的綠色步道',
    themeColor: 0x48b64e,
    icon: '🌿',
    x: 420,
    y: 1980,
    biome: '青翠步道',
  },
  {
    id: 3,
    name: '櫻花樹',
    englishName: 'Cherry Blossom Tree',
    description: '浪漫繽紛的粉紅花瓣飄落處',
    themeColor: 0xff85a2,
    icon: '🌸',
    x: 860,
    y: 1760,
    biome: '粉櫻花徑',
  },
  {
    id: 4,
    name: '螢火森林',
    englishName: 'Firefly Grove',
    description: '微光閃爍的神祕夜之林',
    themeColor: 0x2ec4b6,
    icon: '✨',
    x: 450,
    y: 1540,
    biome: '靜謐林地',
  },
  {
    id: 5,
    name: '花海',
    englishName: 'Wildflower Field',
    description: '開滿百花的向日葵花田',
    themeColor: 0xffb703,
    icon: '🌻',
    x: 840,
    y: 1320,
    biome: '彩蝶花原',
  },
  {
    id: 6,
    name: '蝴蝶園',
    englishName: 'Butterfly Meadow',
    description: '彩蝶翩翩起舞的花園綠洲',
    themeColor: 0x9b5de5,
    icon: '🦋',
    x: 480,
    y: 1100,
    biome: '繽紛花圃',
  },
  {
    id: 7,
    name: '清泉小溪',
    englishName: 'Stream',
    description: '清澈見底、水聲潺潺的溪流',
    themeColor: 0x00b4d8,
    icon: '🌊',
    x: 820,
    y: 880,
    biome: '清涼溪澗',
  },
  {
    id: 8,
    name: '魔法樹屋',
    englishName: 'Tree House',
    description: '高聳入雲的古代奇蹟樹屋',
    themeColor: 0x588157,
    icon: '🌳',
    x: 460,
    y: 660,
    biome: '奇幻樹屋',
  },
  {
    id: 9,
    name: '蘑菇圈',
    englishName: 'Mushroom Ring',
    description: '充滿童話色彩的七彩蘑菇秘境',
    themeColor: 0xe63946,
    icon: '🍄',
    x: 800,
    y: 440,
    biome: '童話菌林',
  },
  {
    id: 10,
    name: '南瓜田',
    englishName: 'Pumpkin Patch',
    description: '金黃豐收的大南瓜樂園終點站',
    themeColor: 0xf77f00,
    icon: '🎃',
    x: 640,
    y: 220,
    biome: '豐收農莊',
  },
];

export const MAP_WIDTH = 1280;
export const MAP_HEIGHT = 2450;

export class MapScene extends Phaser.Scene {
  public stations: readonly StationData[] = STATIONS;
  public stationNodes: Phaser.GameObjects.Container[] = [];
  public backButton: CanvasButton | null = null;
  public activeModal: CanvasModal | null = null;
  public headerContainer: Phaser.GameObjects.Container | null = null;
  public currentPinMarker: Phaser.GameObjects.Container | null = null;

  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private dragStartCamY: number = 0;
  private hasDragged: boolean = false;

  public coinText: Phaser.GameObjects.Text | null = null;
  public gemText: Phaser.GameObjects.Text | null = null;
  public starText: Phaser.GameObjects.Text | null = null;
  public progressText: Phaser.GameObjects.Text | null = null;
  public prefersReducedMotion: boolean = false;

  constructor() {
    super({ key: 'MapScene' });
  }

  create(): void {
    const width = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const height = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    this.prefersReducedMotion = this.prefersReducedMotion || this.detectReducedMotionPreference();

    // Reset list of station containers
    this.stationNodes = [];

    // 1. Setup Camera Bounds & Background
    this.setupCamera(width, height);
    this.createTerrainBackground(MAP_WIDTH, MAP_HEIGHT);

    // 2. Draw Curved Winding Asphalt Road
    this.createWindingRoad();

    // 3. Add Roadside Decorations (Lamp posts, trees, flowers, mushrooms, etc.)
    this.createRoadsideDecorations();

    // 4. Create Station Landmarks & Nodes
    this.createStationNodes();

    // 5. Setup Drag Scrolling & Camera Controls
    this.setupCameraControls(width, height);

    // 6. Create Fixed Header HUD (Back button, Stars, Coins, Gems)
    this.createHeaderHUD(width);

    // 7. Create Quick Jump Floating Navigation
    this.createQuickNavigation(width, height);

    // 8. Focus camera on the latest unlocked station
    this.focusOnCurrentStation(false);
  }

  private setupCamera(_width: number, _height: number): void {
    if (this.cameras?.main) {
      this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    }
  }

  private createTerrainBackground(mapW: number, mapH: number): void {
    if (!this.add) return;

    if (this.add.graphics) {
      const g = this.add.graphics();

      // Sky & Horizon gradient at top
      g.fillGradientStyle(0x3a7bd5, 0x3a7bd5, 0x86c5f7, 0xb8e2f2, 1);
      g.fillRect(0, 0, mapW, 250);

      // Section 1: Golden Farm Hills (Top: y 200 - 550)
      g.fillStyle(0x70a340, 1);
      g.fillRect(0, 250, mapW, 350);
      g.fillStyle(0x8cb85c, 0.4);
      g.fillCircle(200, 320, 220);
      g.fillCircle(1050, 380, 260);

      // Section 2: Enchanted Dusk Forest (y 550 - 1000)
      g.fillStyle(0x438a5e, 1);
      g.fillRect(0, 600, mapW, 420);
      g.fillStyle(0x56a673, 0.4);
      g.fillCircle(300, 750, 240);
      g.fillCircle(980, 850, 280);

      // Stream Water Accent near Station 7 (y 800 - 950)
      g.fillStyle(0x38a3a5, 0.85);
      g.fillRoundedRect(0, 910, mapW, 70, 20);
      g.fillStyle(0x57cc99, 0.5);
      g.fillRoundedRect(0, 920, mapW, 30, 10);

      // Section 3: Vibrant Flower Meadow & Butterfly Garden (y 1000 - 1500)
      g.fillStyle(0x40916c, 1);
      g.fillRect(0, 1020, mapW, 500);
      g.fillStyle(0x52b788, 0.45);
      g.fillCircle(220, 1200, 260);
      g.fillCircle(1080, 1350, 300);

      // Section 4: Firefly Grove & Cherry Blossom Meadow (y 1500 - 1950)
      g.fillStyle(0x2d6a4f, 1);
      g.fillRect(0, 1520, mapW, 450);
      g.fillStyle(0x40916c, 0.4);
      g.fillCircle(280, 1680, 250);
      g.fillCircle(1000, 1800, 270);

      // Section 5: Deep Forest Starting Trail (y 1950 - 2450)
      g.fillStyle(0x1b4332, 1);
      g.fillRect(0, 1970, mapW, 480);
      g.fillStyle(0x2d6a4f, 0.5);
      g.fillCircle(640, 2320, 360);

      // Subtle border lines along map edges
      g.lineStyle(6, 0x1b4332, 0.8);
      g.strokeRect(0, 0, mapW, mapH);
    } else if (this.add.rectangle) {
      this.add.rectangle(mapW / 2, mapH / 2, mapW, mapH, 0x2d6a4f);
    }
  }

  private createWindingRoad(): void {
    if (!this.add?.graphics) return;

    const g = this.add.graphics();

    // Stations sorted by ID (1 to 10)
    const points = STATIONS.map((s) => ({ x: s.x, y: s.y }));

    // 1. Draw outer road border / embankment (dark slate)
    g.lineStyle(92, 0x1e2430, 0.95);
    this.drawCurvedPath(g, points);

    // 2. Draw asphalt road surface (charcoal road)
    g.lineStyle(78, 0x3b4252, 1.0);
    this.drawCurvedPath(g, points);

    // 3. Draw dashed center line (golden yellow dashes)
    this.drawDashedCenterLine(g, points);
  }

  private drawCurvedPath(g: Phaser.GameObjects.Graphics, points: { x: number; y: number }[]): void {
    if (points.length < 2) return;

    g.beginPath();
    g.moveTo(points[0].x, points[0].y);

    const steps = 16;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;

      for (let j = 1; j <= steps; j++) {
        const t = j / steps;
        const x = this.getBezierPoint(p0.x, midX, p1.x, t);
        const y = this.getBezierPoint(p0.y, midY, p1.y, t);
        g.lineTo(x, y);
      }
    }
    g.strokePath();
  }

  private drawDashedCenterLine(g: Phaser.GameObjects.Graphics, points: { x: number; y: number }[]): void {
    g.lineStyle(4, 0xffd166, 0.9);

    // Interpolate points along the path to draw dashes
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const steps = 14;

      for (let j = 0; j < steps; j += 2) {
        const t1 = j / steps;
        const t2 = (j + 1) / steps;

        const x1 = this.getBezierPoint(p0.x, (p0.x + p1.x) / 2, p1.x, t1);
        const y1 = this.getBezierPoint(p0.y, (p0.y + p1.y) / 2, p1.y, t1);
        const x2 = this.getBezierPoint(p0.x, (p0.x + p1.x) / 2, p1.x, t2);
        const y2 = this.getBezierPoint(p0.y, (p0.y + p1.y) / 2, p1.y, t2);

        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath();
      }
    }
  }

  private getBezierPoint(p0: number, p1: number, p2: number, t: number): number {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  }

  private createRoadsideDecorations(): void {
    if (!this.add?.graphics) return;

    const g = this.add.graphics();

    // 1. Lamp Posts along the roadmap
    const lampPositions = [
      { x: 530, y: 2090 },
      { x: 740, y: 1870 },
      { x: 540, y: 1650 },
      { x: 750, y: 1430 },
      { x: 550, y: 1210 },
      { x: 730, y: 990 },
      { x: 550, y: 770 },
      { x: 720, y: 550 },
      { x: 550, y: 330 },
    ];

    for (const lamp of lampPositions) {
      // Lamp pole
      g.fillStyle(0x2b2d42, 1.0);
      g.fillRect(lamp.x - 3, lamp.y - 30, 6, 30);
      g.fillRect(lamp.x - 8, lamp.y - 34, 16, 5);

      // Lantern glow
      g.fillStyle(0xffd166, 0.25);
      g.fillCircle(lamp.x, lamp.y - 38, 22);
      g.fillStyle(0xfff3b0, 0.95);
      g.fillCircle(lamp.x, lamp.y - 38, 8);
    }

    // 2. Themed Biome Landmarks & Trees
    // Pine Trees (Forest section)
    this.drawPineTree(g, 220, 2180, 1.2);
    this.drawPineTree(g, 1020, 2160, 1.1);
    this.drawPineTree(g, 280, 2020, 0.9);
    this.drawPineTree(g, 980, 1950, 1.0);

    // Cherry Blossom Trees (Cherry section)
    this.drawCherryTree(g, 1040, 1720, 1.3);
    this.drawCherryTree(g, 720, 1700, 0.85);
    this.drawCherryTree(g, 980, 1820, 0.9);

    // Firefly Grove sparkles & mystical trees
    this.drawMagicTree(g, 260, 1500, 1.2);
    this.drawMagicTree(g, 620, 1530, 0.85);

    // Wildflowers & Sunflower patches (Flower field)
    this.drawWildflowerPatch(g, 980, 1300, 0xffb703);
    this.drawWildflowerPatch(g, 700, 1280, 0xf72585);
    this.drawWildflowerPatch(g, 260, 1220, 0x4cc9f0);

    // Stream bridge & water reeds
    this.drawBridgeAccents(g, 820, 880);

    // Giant Trees (Treehouse biome)
    this.drawBigOakTree(g, 260, 620, 1.3);
    this.drawBigOakTree(g, 680, 640, 0.9);

    // Fairy Mushrooms (Mushroom ring)
    this.drawMushroomGroup(g, 960, 420);
    this.drawMushroomGroup(g, 660, 430);

    // Pumpkins (Pumpkin patch)
    this.drawPumpkinGroup(g, 460, 200);
    this.drawPumpkinGroup(g, 800, 210);

    // 3. Floating Fireflies (Animated sparkles in Grove)
    this.createFloatingSparkles();
  }

  private fillTriangle(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ): void {
    if (typeof (g as any).fillTriangle === 'function') {
      (g as any).fillTriangle(x1, y1, x2, y2, x3, y3);
    } else {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineTo(x3, y3);
      g.closePath();
      g.fillPath();
    }
  }

  private drawPineTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillRect(x - 5 * scale, y - 10 * scale, 10 * scale, 20 * scale);
    g.fillStyle(0x1b4332, 1);
    this.fillTriangle(g, x, y - 60 * scale, x - 26 * scale, y - 25 * scale, x + 26 * scale, y - 25 * scale);
    g.fillStyle(0x2d6a4f, 1);
    this.fillTriangle(g, x, y - 48 * scale, x - 22 * scale, y - 15 * scale, x + 22 * scale, y - 15 * scale);
    g.fillStyle(0x40916c, 1);
    this.fillTriangle(g, x, y - 35 * scale, x - 18 * scale, y - 5 * scale, x + 18 * scale, y - 5 * scale);
  }

  private drawCherryTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillStyle(0x4a2810, 1);
    g.fillRect(x - 6 * scale, y - 10 * scale, 12 * scale, 24 * scale);
    g.fillStyle(0xff85a2, 0.95);
    g.fillCircle(x - 18 * scale, y - 32 * scale, 22 * scale);
    g.fillCircle(x + 18 * scale, y - 32 * scale, 22 * scale);
    g.fillCircle(x, y - 48 * scale, 26 * scale);
    g.fillStyle(0xffb3c6, 0.9);
    g.fillCircle(x, y - 35 * scale, 20 * scale);
  }

  private drawMagicTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillStyle(0x240046, 1);
    g.fillRect(x - 6 * scale, y - 10 * scale, 12 * scale, 24 * scale);
    g.fillStyle(0x3a0ca3, 0.9);
    g.fillCircle(x, y - 40 * scale, 30 * scale);
    g.fillStyle(0x4cc9f0, 0.85);
    g.fillCircle(x - 10 * scale, y - 45 * scale, 12 * scale);
    g.fillCircle(x + 12 * scale, y - 36 * scale, 14 * scale);
  }

  private drawBigOakTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillStyle(0x5c4033, 1);
    g.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 28 * scale);
    g.fillStyle(0x2d6a4f, 0.95);
    g.fillCircle(x - 22 * scale, y - 35 * scale, 26 * scale);
    g.fillCircle(x + 22 * scale, y - 35 * scale, 26 * scale);
    g.fillCircle(x, y - 55 * scale, 32 * scale);
    g.fillStyle(0x52b788, 0.9);
    g.fillCircle(x, y - 38 * scale, 22 * scale);
  }

  private drawWildflowerPatch(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    const offsets = [
      { dx: 0, dy: 0 },
      { dx: 14, dy: 6 },
      { dx: -12, dy: 8 },
      { dx: 8, dy: -10 },
      { dx: -8, dy: -8 },
    ];
    for (const off of offsets) {
      g.fillStyle(color, 0.95);
      g.fillCircle(x + off.dx, y + off.dy, 5);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(x + off.dx, y + off.dy, 2);
    }
  }

  private drawBridgeAccents(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // Wooden bridge railing across stream
    g.fillStyle(0x8b5a2b, 1);
    g.fillRoundedRect(x - 50, y - 35, 100, 8, 3);
    g.fillRoundedRect(x - 50, y + 27, 100, 8, 3);
  }

  private drawMushroomGroup(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // Stalks
    g.fillStyle(0xf1faee, 1);
    g.fillRect(x - 4, y - 5, 8, 14);
    g.fillRect(x + 12, y, 6, 10);

    // Caps
    g.fillStyle(0xe63946, 1);
    g.fillCircle(x, y - 6, 14);
    g.fillCircle(x + 15, y, 9);

    // White Spots
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x - 4, y - 9, 3);
    g.fillCircle(x + 4, y - 7, 2.5);
    g.fillCircle(x, y - 3, 2);
    g.fillCircle(x + 15, y - 2, 2);
  }

  private drawPumpkinGroup(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // Pumpkin 1
    g.fillStyle(0xf77f00, 1);
    g.fillEllipse(x, y, 26, 18);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(x - 2, y - 13, 4, 6);

    // Pumpkin 2
    g.fillStyle(0xf77f00, 1);
    g.fillEllipse(x + 22, y + 4, 18, 14);
    g.fillStyle(0x2d6a4f, 1);
    g.fillRect(x + 21, y - 6, 3, 5);
  }

  private createFloatingSparkles(): void {
    if (this.prefersReducedMotion || !this.add?.text || !this.tweens?.add) return;

    const sparkleCoords = [
      { x: 420, y: 1520 },
      { x: 490, y: 1560 },
      { x: 460, y: 1490 },
      { x: 380, y: 1570 },
      { x: 520, y: 1510 },
    ];

    for (const coord of sparkleCoords) {
      const sparkle = this.add.text(coord.x, coord.y, '✨', {
        fontSize: '18px',
      });
      if (typeof sparkle.setOrigin === 'function') sparkle.setOrigin(0.5);

      this.tweens.add({
        targets: sparkle,
        y: coord.y - 18,
        alpha: { from: 0.3, to: 1.0 },
        scale: { from: 0.8, to: 1.2 },
        duration: 1600 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createStationNodes(): void {
    let unlockedStations = 1;
    let stationStarsMap: Record<number, number> = {};

    try {
      const dm = DataManager.getInstance();
      unlockedStations = dm.getProfile().unlockedStations;
      stationStarsMap = dm.getProfile().stationStars || {};
    } catch {
      unlockedStations = 1;
    }

    for (const station of STATIONS) {
      const isUnlocked = station.id <= unlockedStations;
      const stars = stationStarsMap[station.id] || 0;
      const isCurrentActive = station.id === unlockedStations;

      const nodeContainer = this.createSingleStationNode(station, isUnlocked, stars, isCurrentActive);
      this.stationNodes.push(nodeContainer);
    }
  }

  private createSingleStationNode(
    station: StationData,
    isUnlocked: boolean,
    stars: number,
    isCurrentActive: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container
      ? this.add.container(station.x, station.y)
      : new Phaser.GameObjects.Container(this, station.x, station.y);

    container.setSize(110, 110);
    container.setDepth(20);

    // 1. Outer Glow / Pulsing Ring
    if (this.add.graphics) {
      const glowG = this.add.graphics();
      if (isUnlocked) {
        glowG.fillStyle(isCurrentActive ? 0xffd700 : station.themeColor, 0.25);
        glowG.fillCircle(0, 0, 52);
        glowG.lineStyle(3, isCurrentActive ? 0xffd700 : 0xffffff, 0.85);
        glowG.strokeCircle(0, 0, 46);
      } else {
        glowG.fillStyle(0x0f172a, 0.5);
        glowG.fillCircle(0, 0, 48);
        glowG.lineStyle(2, 0x475569, 0.7);
        glowG.strokeCircle(0, 0, 44);
      }
      container.add(glowG);

      // Subtle breathing tween for current active station
      if (isCurrentActive && !this.prefersReducedMotion && this.tweens?.add) {
        this.tweens.add({
          targets: glowG,
          scaleX: 1.12,
          scaleY: 1.12,
          alpha: 0.6,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // 2. Base Node Circle Body
    if (this.add.graphics) {
      const baseG = this.add.graphics();
      const fillColor = isUnlocked ? station.themeColor : 0x334155;
      baseG.fillStyle(fillColor, 1.0);
      baseG.fillCircle(0, 0, 40);

      baseG.lineStyle(3, isUnlocked ? 0xffffff : 0x1e293b, 0.9);
      baseG.strokeCircle(0, 0, 40);
      container.add(baseG);
    }

    // 3. Station Landmark Icon / Lock Icon
    if (this.add.text) {
      const iconEmoji = isUnlocked ? station.icon : '🔒';
      const iconText = this.add.text(0, -2, iconEmoji, {
        fontSize: isUnlocked ? '34px' : '30px',
      });
      if (typeof iconText.setOrigin === 'function') iconText.setOrigin(0.5);
      container.add(iconText);
    }

    // 4. Station Number Top Pill Badge
    if (this.add.graphics && this.add.text) {
      const badgeG = this.add.graphics();
      badgeG.fillStyle(0x0f172a, 0.9);
      badgeG.fillRoundedRect(-28, -54, 56, 24, 12);
      badgeG.lineStyle(1.5, isUnlocked ? 0xffd700 : 0x64748b, 0.9);
      badgeG.strokeRoundedRect(-28, -54, 56, 24, 12);
      container.add(badgeG);

      const numLabel = this.add.text(0, -42, `${station.id}`, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isUnlocked ? '#ffd700' : '#94a3b8',
        fontStyle: 'bold',
      });
      if (typeof numLabel.setOrigin === 'function') numLabel.setOrigin(0.5);
      container.add(numLabel);
    }

    // 5. Station Name & English Name Labels Below
    if (this.add.text) {
      const nameText = this.add.text(0, 52, station.name, {
        fontSize: '20px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: isUnlocked ? '#ffffff' : '#94a3b8',
        fontStyle: 'bold',
        stroke: '#0f172a',
        strokeThickness: 3,
        align: 'center',
      });
      if (typeof nameText.setOrigin === 'function') nameText.setOrigin(0.5);
      container.add(nameText);

      const engText = this.add.text(0, 74, station.englishName, {
        fontSize: '16px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: isUnlocked ? '#f1f5f9' : '#64748b',
        align: 'center',
      });
      if (typeof engText.setOrigin === 'function') engText.setOrigin(0.5);
      container.add(engText);

      // 6. Star Rating Badge (0 - 3 stars)
      if (isUnlocked) {
        const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        const starBadge = this.add.text(0, 96, starStr, {
          fontSize: '16px',
          align: 'center',
        });
        if (typeof starBadge.setOrigin === 'function') starBadge.setOrigin(0.5);
        container.add(starBadge);
      }
    }

    // 7. Active Player Character Pin / Indicator (on current active station)
    if (isCurrentActive) {
      this.createPlayerPinMarker(container);
    }

    // 8. Interactivity & Click Handling
    if (typeof container.setInteractive === 'function') {
      const nodeHitRect = (Phaser && Phaser.Geom && Phaser.Geom.Rectangle)
        ? new Phaser.Geom.Rectangle(-8, -8, 110 + 16, 110 + 16)
        : undefined;
      if (nodeHitRect) {
        container.setInteractive(nodeHitRect, Phaser.Geom.Rectangle.Contains);
      } else {
        container.setInteractive({ useHandCursor: isUnlocked });
      }

      container.on('pointerover', () => {
        if (isUnlocked && this.tweens?.add) {
          this.tweens.add({
            targets: container,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 150,
            ease: 'Sine.easeOut',
          });
        }
      });

      container.on('pointerout', () => {
        if (this.tweens?.add) {
          this.tweens.add({
            targets: container,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 150,
            ease: 'Sine.easeOut',
          });
        }
      });

      container.on('pointerup', () => {
        if (this.hasDragged) return;

        if (isUnlocked) {
          SoundManager.play('click');
          this.openStationModal(station);
        } else {
          SoundManager.play('wrong');
          this.showLockedFeedback(station, container);
        }
      });
    }

    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(container);
    }

    return container;
  }

  private createPlayerPinMarker(targetContainer: Phaser.GameObjects.Container): void {
    if (!this.add) return;

    const pinContainer = this.add.container
      ? this.add.container(0, -118)
      : new Phaser.GameObjects.Container(this, 0, -118);

    // 1. Mini Pointer Graphic pointing down to station
    if (this.add.graphics) {
      const g = this.add.graphics();
      g.fillStyle(0xf59e0b, 1.0);
      g.beginPath();
      g.moveTo(-8, 22);
      g.lineTo(8, 22);
      g.lineTo(0, 32);
      g.closePath();
      g.fillPath();
      pinContainer.add(g);
    }

    // 2. Real Player Avatar Badge (Size: 48px, showing equipped skin/wardrobe and pet)
    const avatarBadge = new PlayerAvatarBadge(this, {
      x: 0,
      y: 0,
      size: 48,
      showPet: true,
      showBorder: true,
      reducedMotion: this.prefersReducedMotion,
    });
    pinContainer.add(avatarBadge.container);

    // 3. Name Pill Tag Below Avatar
    if (this.add.graphics && this.add.text) {
      const tagBg = this.add.graphics();
      tagBg.fillStyle(0x0f172a, 0.90);
      tagBg.fillRoundedRect(-34, 16, 68, 18, 7);
      tagBg.lineStyle(1.5, 0xf59e0b, 0.95);
      tagBg.strokeRoundedRect(-34, 16, 68, 18, 7);
      pinContainer.add(tagBg);

      const tagText = this.add.text(0, 25, '我喺呢度', {
        fontSize: '11px',
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: '#fef08a',
        fontStyle: 'bold',
      });
      if (typeof tagText.setOrigin === 'function') tagText.setOrigin(0.5);
      pinContainer.add(tagText);
    }

    // Gentle floating bounce tween
    if (!this.prefersReducedMotion && this.tweens?.add) {
      this.tweens.add({
        targets: pinContainer,
        y: -128,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.currentPinMarker = pinContainer;
    targetContainer.add(pinContainer);
  }

  private showLockedFeedback(station: StationData, container: Phaser.GameObjects.Container): void {
    if (!this.prefersReducedMotion && this.tweens?.add) {
      const origX = container.x;
      this.tweens.add({
        targets: container,
        x: origX + 8,
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          container.x = origX;
        },
      });
    }

    // Brief floating feedback text
    if (this.add.text && this.cameras?.main) {
      const toast = this.add.text(
        station.x,
        station.y - 80,
        `🔒 第 ${station.id} 站尚未解鎖，請先通過上一站！`,
        {
          fontSize: '16px',
          fontFamily: "'Noto Sans TC', sans-serif",
          color: '#ffdd59',
          backgroundColor: '#0f172ae6',
          padding: { x: 12, y: 8 },
        }
      );
      if (typeof toast.setOrigin === 'function') toast.setOrigin(0.5);
      toast.setDepth(600);

      if (!this.prefersReducedMotion && this.tweens?.add) {
        this.tweens.add({
          targets: toast,
          y: station.y - 120,
          alpha: 0,
          duration: 1600,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (typeof toast.destroy === 'function') toast.destroy();
          },
        });
      } else if (this.prefersReducedMotion && this.time?.delayedCall) {
        this.time.delayedCall(1600, () => {
          if (typeof toast.destroy === 'function') toast.destroy();
        });
      }
    }
  }

  /**
   * Opens the station details CanvasModal with 3 sub-levels ([中], [數], [英]) and Enter button
   */
  public openStationModal(station: StationData): CanvasModal {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }

    const gameW = this.sys?.game?.config ? Number(this.sys.game.config.width) : GAME_WIDTH;
    const gameH = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;

    let stationStars = 0;
    try {
      stationStars = DataManager.getInstance().getProfile().stationStars[station.id] || 0;
    } catch {
      stationStars = 0;
    }

    const modal = new CanvasModal(this, {
      x: gameW / 2,
      y: gameH / 2,
      width: 680,
      height: 520,
      title: `第 ${station.id} 站 — ${station.name}`,
      theme: 'gold',
      closeOnBackdropClick: true,
      onClose: () => {
        this.activeModal = null;
      },
    });

    // Modal stays fixed to screen viewport
    modal.setScrollFactor(0);
    modal.setDepth(1000);

    const content = modal.getContentContainer();

    // 1. Subtitle Banner (English Name & Biome)
    if (this.add.text) {
      const subtitle = this.add.text(
        0,
        -155,
        `📍 ${station.englishName} • ${station.biome} — ${station.description}`,
        {
          fontSize: '17px',
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
          color: '#e2e8f0',
          align: 'center',
        }
      );
      if (typeof subtitle.setOrigin === 'function') subtitle.setOrigin(0.5);
      content.add(subtitle);
    }

    // 2. 3 Sub-Level Subject Cards
    const subLevels = [
      {
        id: 1,
        subject: 'chinese',
        badge: '第 ' + station.id + '-1 關 [中]',
        title: '中文語文閱讀與字詞',
        desc: '精選字詞、句型重組與生活閱讀',
        color: 0xe76f51,
        earnedStar: stationStars >= 1,
      },
      {
        id: 2,
        subject: 'math',
        badge: '第 ' + station.id + '-2 關 [數]',
        title: '數學趣味運算與邏輯',
        desc: '20以內加減、圖形與應用題',
        color: 0x2a9d8f,
        earnedStar: stationStars >= 2,
      },
      {
        id: 3,
        subject: 'english',
        badge: '第 ' + station.id + '-3 關 [英]',
        title: '英文 Phonics & Vocabulary',
        desc: 'Sight words, Phonics 與生活對話',
        color: 0x7209b7,
        earnedStar: stationStars >= 3,
      },
    ];

    const startY = -95;
    const rowHeight = 72;

    subLevels.forEach((sub, index) => {
      const rowY = startY + index * rowHeight;
      const rowContainer = this.add.container
        ? this.add.container(0, rowY)
        : new Phaser.GameObjects.Container(this, 0, rowY);

      rowContainer.setSize(580, 56);
      if (rowContainer && typeof rowContainer.setScrollFactor === 'function') {
        rowContainer.setScrollFactor(0);
      }

      // Card row background
      if (this.add.graphics) {
        const bgG = this.add.graphics();
        if (bgG && typeof bgG.setScrollFactor === 'function') {
          bgG.setScrollFactor(0);
        }
        bgG.fillStyle(0x0f172a, 0.8);
        bgG.fillRoundedRect(-290, -28, 580, 56, 12);
        bgG.lineStyle(1.5, sub.color, 0.85);
        bgG.strokeRoundedRect(-290, -28, 580, 56, 12);
        rowContainer.add(bgG);

        // Subject color indicator pill
        const pillG = this.add.graphics();
        if (pillG && typeof pillG.setScrollFactor === 'function') {
          pillG.setScrollFactor(0);
        }
        pillG.fillStyle(sub.color, 1.0);
        pillG.fillRoundedRect(-280, -21, 115, 42, 8);
        rowContainer.add(pillG);
      }

      if (this.add.text) {
        // Sub-level badge text
        const badgeLabel = this.add.text(-222, 0, sub.badge, {
          fontSize: '16px',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang HK', 'Noto Sans TC', sans-serif",
          color: '#ffffff',
          fontStyle: 'bold',
          resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
        });
        if (badgeLabel && typeof badgeLabel.setScrollFactor === 'function') {
          badgeLabel.setScrollFactor(0);
        }
        if (typeof badgeLabel.setOrigin === 'function') badgeLabel.setOrigin(0.5);
        rowContainer.add(badgeLabel);

        // Sub-level title & description
        const titleLabel = this.add.text(-150, -10, sub.title, {
          fontSize: '18px',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang HK', 'Noto Sans TC', sans-serif",
          color: '#ffd700',
          fontStyle: 'bold',
          resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
        });
        if (titleLabel && typeof titleLabel.setScrollFactor === 'function') {
          titleLabel.setScrollFactor(0);
        }
        rowContainer.add(titleLabel);

        const descLabel = this.add.text(-150, 11, sub.desc, {
          fontSize: '16px',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang HK', 'Noto Sans TC', sans-serif",
          color: '#94a3b8',
          resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
        });
        if (descLabel && typeof descLabel.setScrollFactor === 'function') {
          descLabel.setScrollFactor(0);
        }
        rowContainer.add(descLabel);

        // Sub-level star icon
        const starIcon = this.add.text(250, 0, sub.earnedStar ? '⭐' : '☆', {
          fontSize: '24px',
          resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
        });
        if (starIcon && typeof starIcon.setScrollFactor === 'function') {
          starIcon.setScrollFactor(0);
        }
        if (typeof starIcon.setOrigin === 'function') starIcon.setOrigin(0.5);
        rowContainer.add(starIcon);
      }

      // Make the entire row clickable to start this subject's question directly
      // Note: Container setSize(580, 56) shifts hit area by displayOrigin (290, 28)
      const padX = 16;
      const padY = 8;
      const hitRect = (Phaser && Phaser.Geom && Phaser.Geom.Rectangle)
        ? new Phaser.Geom.Rectangle(-padX, -padY, 580 + padX * 2, 56 + padY * 2)
        : undefined;

      if (typeof rowContainer.setInteractive === 'function') {
        if (hitRect) {
          rowContainer.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
        } else {
          rowContainer.setInteractive({ useHandCursor: true });
        }

        rowContainer.on('pointerover', () => {
          if (this.tweens?.killTweensOf) {
            this.tweens.killTweensOf(rowContainer);
          }
          if (this.tweens?.add) {
            this.tweens.add({
              targets: rowContainer,
              scaleX: 1.02,
              scaleY: 1.02,
              duration: 100,
              ease: 'Sine.easeOut',
            });
          }
        });

        rowContainer.on('pointerout', () => {
          if (this.tweens?.killTweensOf) {
            this.tweens.killTweensOf(rowContainer);
          }
          if (this.tweens?.add) {
            this.tweens.add({
              targets: rowContainer,
              scaleX: 1.0,
              scaleY: 1.0,
              duration: 100,
              ease: 'Sine.easeOut',
            });
          }
        });

        let isPressedOnRow = false;

        rowContainer.on('pointerdown', () => {
          isPressedOnRow = true;
          if (this.tweens?.killTweensOf) {
            this.tweens.killTweensOf(rowContainer);
          }
          if (this.tweens?.add) {
            this.tweens.add({
              targets: rowContainer,
              scaleX: 0.98,
              scaleY: 0.98,
              duration: 50,
              ease: 'Quad.easeIn',
            });
          }
        });

        rowContainer.on('pointerup', () => {
          isPressedOnRow = false;
          SoundManager.play('click');
          modal.close();
          if (this.scene) {
            this.scene.start('QuestionScene', {
              stationId: station.id,
              stationName: station.name,
              questionIndex: index,
            });
          }
        });

        rowContainer.on('pointerupoutside', () => {
          if (!isPressedOnRow) return;
          isPressedOnRow = false;
          if (this.tweens?.killTweensOf) {
            this.tweens.killTweensOf(rowContainer);
          }
          if (this.tweens?.add) {
            this.tweens.add({
              targets: rowContainer,
              scaleX: 1.0,
              scaleY: 1.0,
              duration: 100,
              ease: 'Sine.easeOut',
            });
          }
        });
      }

      content.add(rowContainer);
    });

    // 3. Station Star Rating Display
    const ratingContainer = this.add.container
      ? this.add.container(0, 115)
      : new Phaser.GameObjects.Container(this, 0, 115);
    if (ratingContainer && typeof ratingContainer.setScrollFactor === 'function') {
      ratingContainer.setScrollFactor(0);
    }

    if (this.add.text) {
      const starSummary = this.add.text(0, -18, `本站獲得星星：${stationStars}/3 ⭐`, {
        fontSize: '18px',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: '#ffdd59',
        fontStyle: 'bold',
      });
      if (starSummary && typeof starSummary.setScrollFactor === 'function') {
        starSummary.setScrollFactor(0);
      }
      if (typeof starSummary.setOrigin === 'function') starSummary.setOrigin(0.5);
      ratingContainer.add(starSummary);
    }

    try {
      const starRating = new StarRating(this, {
        x: 0,
        y: 8,
        maxStars: 3,
        initialStars: stationStars,
        starSize: 26,
        spacing: 12,
      });
      if (starRating && typeof starRating.setScrollFactor === 'function') {
        starRating.setScrollFactor(0);
      }
      ratingContainer.add(starRating);
    } catch {
      // Fallback star text if StarRating container fails
    }
    content.add(ratingContainer);

    // 4. Enter Button (進入)
    const enterBtn = new CanvasButton(this, {
      x: 0,
      y: 175,
      width: 280,
      height: 56,
      text: '⚔️ 進入關卡 (進入)',
      color: 'green',
      fontSize: '22px',
      onClick: () => {
        SoundManager.play('click');
        modal.close();
        if (this.scene) {
          this.scene.start('QuestionScene', {
            stationId: station.id,
            stationName: station.name,
          });
        }
      },
    });
    if (enterBtn && typeof enterBtn.setScrollFactor === 'function') {
      enterBtn.setScrollFactor(0);
    }
    content.add(enterBtn);

    this.activeModal = modal;
    modal.show();
    return modal;
  }

  public closeStationModal(): void {
    if (this.activeModal) {
      this.activeModal.close();
      this.activeModal = null;
    }
  }

  private setupCameraControls(_gameW: number, gameH: number): void {
    if (!this.input) return;

    // Pointer Drag Scrolling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.dragStartCamY = this.cameras?.main?.scrollY ?? 0;
      this.hasDragged = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown || !this.cameras?.main) return;

      const deltaY = pointer.y - this.dragStartY;
      if (Math.abs(deltaY) > 6) {
        this.hasDragged = true;
      }

      const maxScrollY = MAP_HEIGHT - gameH;
      this.cameras.main.scrollY = Phaser.Math.Clamp(this.dragStartCamY - deltaY, 0, maxScrollY);
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      // Reset drag flag shortly after pointerup
      this.time?.delayedCall?.(60, () => {
        this.hasDragged = false;
      });
    });

    // Mouse Wheel Scrolling
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (!this.cameras?.main) return;
      const maxScrollY = MAP_HEIGHT - gameH;
      this.cameras.main.scrollY = Phaser.Math.Clamp(
        this.cameras.main.scrollY + deltaY * 0.8,
        0,
        maxScrollY
      );
    });
  }

  private createHeaderHUD(width: number): void {
    if (!this.add) return;

    let profile: any;
    let totalStars = 0;
    try {
      const dm = DataManager.getInstance();
      profile = dm.getProfile();
      totalStars = dm.getTotalStars();
    } catch {
      profile = { coins: 0, gems: 0, unlockedStations: 1 };
    }

    const header = this.add.container
      ? this.add.container(0, 0)
      : new Phaser.GameObjects.Container(this, 0, 0);

    header.setScrollFactor(0);
    header.setDepth(500);

    // 1. Back Button (◀ 返回主頁)
    this.backButton = new CanvasButton(this, {
      x: 105,
      y: 42,
      width: 145,
      height: 48,
      text: '◀ 返回',
      color: 'blue',
      fontSize: '20px',
      onClick: () => {
        SoundManager.play('click');
        if (this.scene) {
          this.scene.start('TitleScene');
        }
      },
    });
    if (this.backButton && typeof this.backButton.setScrollFactor === 'function') {
      this.backButton.setScrollFactor(0);
    }
    header.add(this.backButton);

    // 1.1 Report Button (📊 報告)
    const reportBtn = new CanvasButton(this, {
      x: 260,
      y: 42,
      width: 140,
      height: 48,
      text: '📊 報告',
      color: 'yellow',
      fontSize: '20px',
      onClick: () => {
        SoundManager.play('click');
        this.openDiagnosticReport();
      },
    });
    if (reportBtn && typeof reportBtn.setScrollFactor === 'function') {
      reportBtn.setScrollFactor(0);
    }
    header.add(reportBtn);

    // 2. Status & Currency Bar Pill
    const barX = width / 2 + 150;
    const barY = 42;

    if (this.add.graphics) {
      const bg = this.add.graphics();
      bg.fillStyle(0x0e1320, 0.85);
      bg.fillRoundedRect(barX - 300, barY - 24, 600, 48, 24);
      bg.lineStyle(2, 0x4a90e2, 0.85);
      bg.strokeRoundedRect(barX - 300, barY - 24, 600, 48, 24);
      header.add(bg);
    }

    // 3. Status Labels
    if (this.add.text) {
      const completedCount = DataManager.getInstance().getCompletedStationCount();
      const progLabel = this.add.text(barX - 220, barY, `🚩 通關: ${completedCount}/10 站`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#67e8f9',
        fontStyle: 'bold',
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof progLabel.setOrigin === 'function') progLabel.setOrigin(0.5);
      this.progressText = progLabel;
      header.add(progLabel);

      // Resources use the same coin → gem → star order as Title, Shop, and Runner.
      const coinLabel = this.add.text(barX - 70, barY, `🪙 金幣: ${profile.coins}`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#fbbf24',
        fontStyle: 'bold',
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof coinLabel.setOrigin === 'function') coinLabel.setOrigin(0.5);
      this.coinText = coinLabel;
      header.add(coinLabel);

      const gemLabel = this.add.text(barX + 50, barY, `💎 寶石: ${profile.gems}`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#38bdf8',
        fontStyle: 'bold',
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof gemLabel.setOrigin === 'function') gemLabel.setOrigin(0.5);
      this.gemText = gemLabel;
      header.add(gemLabel);

      const starLabel = this.add.text(barX + 170, barY, `⭐ 星星: ${totalStars}/30`, {
        fontSize: '18px',
        fontFamily: "'Kenney Future', 'Noto Sans TC', sans-serif",
        color: '#fde047',
        fontStyle: 'bold',
        resolution: typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2,
      });
      if (typeof starLabel.setOrigin === 'function') starLabel.setOrigin(0.5);
      this.starText = starLabel;
      header.add(starLabel);
    }

    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(header);
    }

    this.headerContainer = header;
  }

  private createQuickNavigation(width: number, height: number): void {
    const navContainer = this.add.container
      ? this.add.container(width - 55, height - 120)
      : new Phaser.GameObjects.Container(this, width - 55, height - 120);

    navContainer.setScrollFactor(0);
    navContainer.setDepth(500);

    // Jump to Top Station 10 Button
    const upBtn = new CanvasButton(this, {
      x: 0,
      y: -60,
      width: 48,
      height: 48,
      variant: 'round',
      text: '⬆️',
      color: 'blue',
      fontSize: '18px',
      onClick: () => this.scrollToStation(10, 400),
    });
    if (upBtn && typeof upBtn.setScrollFactor === 'function') {
      upBtn.setScrollFactor(0);
    }
    navContainer.add(upBtn);

    // Jump to Current Active Station Button
    const targetBtn = new CanvasButton(this, {
      x: 0,
      y: 0,
      width: 48,
      height: 48,
      variant: 'round',
      text: '🎯',
      color: 'yellow',
      fontSize: '18px',
      onClick: () => this.focusOnCurrentStation(true),
    });
    if (targetBtn && typeof targetBtn.setScrollFactor === 'function') {
      targetBtn.setScrollFactor(0);
    }
    navContainer.add(targetBtn);

    // Jump to Bottom Station 1 Button
    const downBtn = new CanvasButton(this, {
      x: 0,
      y: 60,
      width: 48,
      height: 48,
      variant: 'round',
      text: '⬇️',
      color: 'blue',
      fontSize: '18px',
      onClick: () => this.scrollToStation(1, 400),
    });
    if (downBtn && typeof downBtn.setScrollFactor === 'function') {
      downBtn.setScrollFactor(0);
    }
    navContainer.add(downBtn);

    if (this.add && typeof this.add.existing === 'function') {
      this.add.existing(navContainer);
    }
  }

  public focusOnCurrentStation(animate = true): void {
    let unlockedStations = 1;
    try {
      unlockedStations = DataManager.getInstance().getProfile().unlockedStations;
    } catch {
      unlockedStations = 1;
    }
    this.scrollToStation(unlockedStations, animate ? 500 : 0);
  }

  public scrollToStation(stationId: number, duration = 400): void {
    const station = STATIONS.find((s) => s.id === stationId) || STATIONS[0];
    if (!this.cameras?.main) return;

    const gameH = this.sys?.game?.config ? Number(this.sys.game.config.height) : GAME_HEIGHT;
    const targetY = Phaser.Math.Clamp(station.y - gameH / 2, 0, MAP_HEIGHT - gameH);

    if (duration > 0 && this.tweens?.add) {
      this.tweens.add({
        targets: this.cameras.main,
        scrollY: targetY,
        duration: duration,
        ease: 'Cubic.easeOut',
      });
    } else {
      this.cameras.main.scrollY = targetY;
    }
  }

  public getUnlockedStationsCount(): number {
    try {
      return DataManager.getInstance().getProfile().unlockedStations;
    } catch {
      return 1;
    }
  }

  public openDiagnosticReport(): void {
    const modal = new DiagnosticReportModal(this, {
      onReviewMistakes: () => {
        this.startMistakeReview();
      },
    });
    modal.show();
  }

  public startMistakeReview(): void {
    const mistakeIds = DataManager.getInstance().getMistakeReviewQueue();
    if (mistakeIds.length === 0) return;

    if (this.scene) {
      this.scene.start('QuestionScene', {
        stationId: 1,
        stationName: '錯題溫習練習',
        questionIndex: 0,
        questions: [],
      });
    }
  }

  public getTotalStars(): number {
    try {
      return DataManager.getInstance().getTotalStars();
    } catch {
      return 0;
    }
  }

  private detectReducedMotionPreference(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    } catch {
      return false;
    }
  }
}
