import * as stylex from '@stylexjs/stylex';

/** Color tokens — mirror the "Color" variable collection in the Figma file. */
export const colors = stylex.defineVars({
  bgNight: '#0f172a',
  bgDeep: '#020617',
  bgPage: '#fff5f7',
  bgSidebar: '#fafafb',

  surfaceGlass: 'rgba(255, 255, 255, 0.72)',
  surfaceStrong: 'rgba(255, 255, 255, 0.9)',
  surfaceSoft: '#f8fafc',
  /** Solid card face (polaroids, poster outlines). */
  surfaceCard: '#ffffff',
  /** Sticky top bar. */
  surfaceBar: 'rgba(255, 255, 255, 0.88)',

  borderGlass: 'rgba(255, 255, 255, 0.7)',
  borderSubtle: '#e2e8f0',
  borderPink: '#fbcfe8',

  pink: '#ec4899',
  rose: '#f43f5e',
  red: '#e11d48',
  purple: '#a855f7',
  indigo: '#6366f1',
  amber: '#f59e0b',
  sky: '#60a5fa',
  green: '#10b981',

  chipPink: '#fce7f3',
  chipRose: '#ffe4e6',
  chipAmber: '#fef3c7',
  chipIndigo: '#e0e7ff',
  chipPurple: '#f3e8ff',
  chipGreen: '#ecfdf5',
  chipSky: '#e0f2fe',

  textPrimary: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textAccent: '#be185d',
  textAmber: '#b45309',
  textGreen: '#047857',
  textIndigo: '#4338ca',
  textOnDark: '#ffffff',
});

export const gradients = stylex.defineVars({
  primary: 'linear-gradient(90deg, #db2777, #f43f5e, #f59e0b)',
  pinkRose: 'linear-gradient(90deg, #ec4899, #f43f5e)',
  roseAmber: 'linear-gradient(90deg, #e11d48, #f43f5e, #f59e0b)',
  amberPink: 'linear-gradient(90deg, #f59e0b, #ec4899)',
  orange: 'linear-gradient(90deg, #f97316, #f59e0b)',
  emerald: 'linear-gradient(90deg, #10b981, #059669)',
  teal: 'linear-gradient(90deg, #10b981, #14b8a6)',
  logo: 'linear-gradient(90deg, #3b82f6, #a855f7, #e11d48)',
  titleBlue: 'linear-gradient(180deg, #60a5fa, #3b82f6, #6366f1)',
  titleRose: 'linear-gradient(180deg, #fb7185, #e11d48, #9f1239)',
  page: 'linear-gradient(180deg, #ffffff, #fdf2f8, #ffe4e6)',
  heroHaze: 'linear-gradient(90deg, rgba(255,241,242,0.92), rgba(253,242,248,0.7) 50%, rgba(253,242,248,0.15))',
  hero: 'linear-gradient(90deg, rgba(255,241,242,0.92), rgba(253,242,248,0.7) 50%, rgba(253,242,248,0.15)), linear-gradient(120deg, #0f172a, #312e81, #9d174d)',
  panelSoft: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(253,242,248,0.9))',
  placeholderCover: 'linear-gradient(135deg, #fbcfe8, #e9d5ff, #c7d2fe)',
  placeholderPhoto: 'linear-gradient(180deg, #fce7f3, #fbcfe8, #ddd6fe)',
  coverShade: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 65%, rgba(15, 23, 42, 0.55) 100%)',
});

export const radius = stylex.defineVars({
  xs: '6px',
  sm: '8px',
  md: '14px',
  lg: '20px',
  xl: '28px',
  pill: '999px',
});

export const space = stylex.defineVars({
  s4: '4px',
  s8: '8px',
  s12: '12px',
  s16: '16px',
  s24: '24px',
  s32: '32px',
  s48: '48px',
});

export const fonts = stylex.defineVars({
  display: '"Playfair Display", "Noto Serif JP", Georgia, serif',
  body: '"Plus Jakarta Sans", "Noto Sans JP", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
});

export const shadows = stylex.defineVars({
  card: '0 2px 8px rgba(15, 23, 42, 0.08)',
  glass: '0 6px 18px rgba(15, 23, 42, 0.12)',
  glowPink: '0 2px 8px rgba(236, 72, 153, 0.25)',
});

/** Profile photo & video cover size — always 250 × 351. */
export const media = stylex.defineVars({
  coverWidth: '250px',
  coverHeight: '351px',
});
