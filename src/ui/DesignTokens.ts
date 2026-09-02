/**
 * DesignTokens.ts
 * Specification V2 — Core Visual Foundation Tokens
 * 
 * Formal design tokens covering:
 * - Spacing scale (4 to 64 logical pixels)
 * - Corner radii (10 to 26px)
 * - Typography hierarchy (16px minRendered to 52px display)
 * - Semantic color palette (surface, text, action, state, subject, currency)
 */

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const RADIUS = {
  sm: 10,   // Small controls, badges, chips
  md: 14,   // Standard buttons, cards, list items
  lg: 18,   // Interactive option cards, modal buttons
  xl: 22,   // Panels, detail docks, HUD containers
  xxl: 26,  // Large modals, dialogue containers
  round: 999, // Pill shapes
} as const;

export const TYPOGRAPHY = {
  fontFamily: "'Kenney Future', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
  fontFamilyContent: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
  
  // Sizes at reference 1280x720 canvas
  display: {
    fontSize: '48px',
    lineHeight: 1.25,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: '34px',
    lineHeight: 1.3,
    fontWeight: 'bold',
  },
  prompt: {
    fontSize: '30px',
    lineHeight: 1.35,
    fontWeight: 'bold',
  },
  primaryAnswer: {
    fontSize: '32px',
    lineHeight: 1.35,
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: '24px',
    lineHeight: 1.4,
    fontWeight: 'bold',
  },
  body: {
    fontSize: '22px',
    lineHeight: 1.45,
    fontWeight: 'normal',
  },
  button: {
    fontSize: '22px',
    lineHeight: 1.3,
    fontWeight: 'bold',
  },
  metadata: {
    fontSize: '18px',
    lineHeight: 1.4,
    fontWeight: '500',
  },
  minRendered: {
    fontSize: '16px',
    lineHeight: 1.4,
    fontWeight: '500',
  },
} as const;

export const COLORS = {
  surface: {
    page: 0x0f172a,         // Deep navy midnight background
    pageHex: '#0f172a',
    panel: 0x1e293b,        // Slate panel background
    panelHex: '#1e293b',
    elevated: 0x334155,     // Elevated surface / card
    elevatedHex: '#334155',
    overlay: 'rgba(15, 23, 42, 0.75)',
    modalBackdrop: 'rgba(5, 10, 25, 0.85)',
  },
  text: {
    primary: '#ffffff',     // High contrast white
    secondary: '#cbd5e1',   // Soft light grey-blue (AA compliant)
    muted: '#94a3b8',       // Muted slate
    inverse: '#0f172a',     // Dark text on gold/light chips
    accent: '#fbbf24',      // Warm golden highlight
    concept: '#fef08a',     // Highlighted keyword in feedback
  },
  action: {
    primary: 0x3b82f6,      // Royal blue
    primaryHex: '#3b82f6',
    primaryGold: 0xf59e0b,  // Golden CTA
    primaryGoldHex: '#f59e0b',
    secondary: 0x475569,    // Secondary slate
    secondaryHex: '#475569',
    quiet: 0x1e293b,        // Minimal background
    quietHex: '#1e293b',
    destructive: 0xef4444,  // Danger / unequip / delete
    destructiveHex: '#ef4444',
  },
  state: {
    success: 0x22c55e,      // Green
    successHex: '#22c55e',
    successBg: 'rgba(34, 197, 94, 0.15)',
    error: 0xef4444,        // Red
    errorHex: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    warning: 0xf59e0b,      // Amber
    warningHex: '#f59e0b',
    info: 0x38bdf8,         // Sky blue
    infoHex: '#38bdf8',
    disabled: 0x64748b,     // Disabled grey
    disabledHex: '#64748b',
  },
  subject: {
    chinese: 0xf97316,      // Orange
    chineseHex: '#f97316',
    chineseBg: 'rgba(249, 115, 22, 0.15)',
    mathematics: 0x3b82f6,  // Blue
    mathematicsHex: '#3b82f6',
    mathematicsBg: 'rgba(59, 130, 246, 0.15)',
    english: 0x10b981,      // Emerald
    englishHex: '#10b981',
    englishBg: 'rgba(16, 185, 129, 0.15)',
  },
  currency: {
    coin: 0xfbbf24,         // Gold Coin
    coinHex: '#fbbf24',
    gem: 0x38bdf8,          // Radiant Diamond Gem
    gemHex: '#38bdf8',
    star: 0xfacc15,         // Achievement Star
    starHex: '#facc15',
  },
} as const;

export const ELEVATION = {
  flat: {
    shadowOffset: 0,
    shadowBlur: 0,
  },
  card: {
    shadowOffset: 3,
    shadowBlur: 8,
    shadowColor: 'rgba(0, 0, 0, 0.35)',
  },
  modal: {
    shadowOffset: 6,
    shadowBlur: 20,
    shadowColor: 'rgba(0, 0, 0, 0.55)',
  },
} as const;

export const TOUCH_TARGET = {
  min: 48,          // Absolute minimum for touch controls
  standard: 52,     // Standard button touch target
  comfortable: 56,  // Young child friendly touch target
  runner: 64,       // Action platformer controls
} as const;

export const MOTION = {
  durationFast: 120,
  durationNormal: 220,
  durationSlow: 320,
  toastDuration: 3500,
  prefersReducedMotion: false,
} as const;

