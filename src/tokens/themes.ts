import * as stylex from '@stylexjs/stylex';
import { colors, gradients, shadows } from './tokens.stylex';

/**
 * Dark theme — "night city" palette from the title screen:
 * deep navy surfaces, the same pink / rose / indigo accents, lighter text tints.
 */
const darkColors = {
  bgNight: '#0b1020',
  bgDeep: '#020617',
  bgPage: '#0b1020',
  bgSidebar: '#0f1629',

  surfaceGlass: 'rgba(17, 24, 45, 0.72)',
  surfaceStrong: 'rgba(20, 28, 52, 0.92)',
  surfaceSoft: '#18213d',
  surfaceCard: '#1b2545',
  surfaceBar: 'rgba(11, 16, 32, 0.88)',

  borderGlass: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: '#283454',
  borderPink: 'rgba(236, 72, 153, 0.3)',

  pink: '#f472b6',
  rose: '#fb7185',
  red: '#f43f5e',
  purple: '#c084fc',
  indigo: '#818cf8',
  amber: '#fbbf24',
  sky: '#7dd3fc',
  green: '#34d399',

  chipPink: 'rgba(236, 72, 153, 0.16)',
  chipRose: 'rgba(244, 63, 94, 0.16)',
  chipAmber: 'rgba(245, 158, 11, 0.16)',
  chipIndigo: 'rgba(99, 102, 241, 0.2)',
  chipPurple: 'rgba(168, 85, 247, 0.18)',
  chipGreen: 'rgba(16, 185, 129, 0.16)',
  chipSky: 'rgba(56, 189, 248, 0.16)',

  textPrimary: '#e7eaf6',
  textSecondary: '#a5b0cc',
  textMuted: '#6b7799',
  textAccent: '#f9a8d4',
  textAmber: '#fcd34d',
  textGreen: '#6ee7b7',
  textIndigo: '#a5b4fc',
  textOnDark: '#ffffff',
};

const darkGradients = {
  page: 'linear-gradient(180deg, #0b1020, #111a33 60%, #1a1030)',
  heroHaze: 'linear-gradient(90deg, rgba(11,16,32,0.92), rgba(11,16,32,0.6) 50%, rgba(11,16,32,0.1))',
  hero: 'linear-gradient(90deg, rgba(11,16,32,0.92), rgba(11,16,32,0.6) 50%, rgba(11,16,32,0.1)), linear-gradient(120deg, #0f172a, #312e81, #9d174d)',
  panelSoft: 'linear-gradient(90deg, rgba(20,28,52,0.95), rgba(40,20,52,0.9))',
  placeholderCover: 'linear-gradient(135deg, #3b1d4a, #2a2a5e, #1e3a5f)',
  placeholderPhoto: 'linear-gradient(180deg, #3a1f45, #4a1f3d, #2a2a5e)',
  titleRose: 'linear-gradient(180deg, #fda4af, #fb7185, #f43f5e)',
};

// Dark UI: depth comes from surface contrast, so shadows stay tight and neutral (no pink bloom).
const darkShadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.4)',
  glass: '0 4px 12px rgba(0, 0, 0, 0.35)',
  glowPink: 'none',
};

export const darkColorTheme = stylex.createTheme(colors, darkColors);
export const darkGradientTheme = stylex.createTheme(gradients, darkGradients);
export const darkShadowTheme = stylex.createTheme(shadows, darkShadows);

/** Follows the OS setting via `prefers-color-scheme`. */
const DARK = '@media (prefers-color-scheme: dark)';
// Light values duplicated here because StyleX must evaluate them statically.
const lightColors = {
  bgNight: '#0f172a', bgDeep: '#020617', bgPage: '#fff5f7', bgSidebar: '#fafafb',
  surfaceGlass: 'rgba(255, 255, 255, 0.72)', surfaceStrong: 'rgba(255, 255, 255, 0.9)', surfaceSoft: '#f8fafc', surfaceCard: '#ffffff', surfaceBar: 'rgba(255, 255, 255, 0.88)',
  borderGlass: 'rgba(255, 255, 255, 0.7)', borderSubtle: '#e2e8f0', borderPink: '#fbcfe8',
  pink: '#ec4899', rose: '#f43f5e', red: '#e11d48', purple: '#a855f7', indigo: '#6366f1', amber: '#f59e0b', sky: '#60a5fa', green: '#10b981',
  chipPink: '#fce7f3', chipRose: '#ffe4e6', chipAmber: '#fef3c7', chipIndigo: '#e0e7ff', chipPurple: '#f3e8ff', chipGreen: '#ecfdf5', chipSky: '#e0f2fe',
  textPrimary: '#1e293b', textSecondary: '#475569', textMuted: '#94a3b8', textAccent: '#be185d', textAmber: '#b45309', textGreen: '#047857', textIndigo: '#4338ca', textOnDark: '#ffffff',
};
const lightGradients = {
  page: 'linear-gradient(180deg, #ffffff, #fdf2f8, #ffe4e6)',
  heroHaze: 'linear-gradient(90deg, rgba(255,241,242,0.92), rgba(253,242,248,0.7) 50%, rgba(253,242,248,0.15))',
  hero: 'linear-gradient(90deg, rgba(255,241,242,0.92), rgba(253,242,248,0.7) 50%, rgba(253,242,248,0.15)), linear-gradient(120deg, #0f172a, #312e81, #9d174d)',
  panelSoft: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(253,242,248,0.9))',
  placeholderCover: 'linear-gradient(135deg, #fbcfe8, #e9d5ff, #c7d2fe)',
  placeholderPhoto: 'linear-gradient(180deg, #fce7f3, #fbcfe8, #ddd6fe)',
  titleRose: 'linear-gradient(180deg, #fb7185, #e11d48, #9f1239)',
};
const lightShadows = { card: '0 2px 8px rgba(15, 23, 42, 0.08)', glass: '0 6px 18px rgba(15, 23, 42, 0.12)', glowPink: '0 2px 8px rgba(236, 72, 153, 0.25)' };

export const systemColorTheme = stylex.createTheme(colors, {
  bgNight: { default: lightColors.bgNight, [DARK]: darkColors.bgNight },
  bgDeep: { default: lightColors.bgDeep, [DARK]: darkColors.bgDeep },
  bgPage: { default: lightColors.bgPage, [DARK]: darkColors.bgPage },
  bgSidebar: { default: lightColors.bgSidebar, [DARK]: darkColors.bgSidebar },
  surfaceGlass: { default: lightColors.surfaceGlass, [DARK]: darkColors.surfaceGlass },
  surfaceStrong: { default: lightColors.surfaceStrong, [DARK]: darkColors.surfaceStrong },
  surfaceSoft: { default: lightColors.surfaceSoft, [DARK]: darkColors.surfaceSoft },
  surfaceCard: { default: lightColors.surfaceCard, [DARK]: darkColors.surfaceCard },
  surfaceBar: { default: lightColors.surfaceBar, [DARK]: darkColors.surfaceBar },
  borderGlass: { default: lightColors.borderGlass, [DARK]: darkColors.borderGlass },
  borderSubtle: { default: lightColors.borderSubtle, [DARK]: darkColors.borderSubtle },
  borderPink: { default: lightColors.borderPink, [DARK]: darkColors.borderPink },
  pink: { default: lightColors.pink, [DARK]: darkColors.pink },
  rose: { default: lightColors.rose, [DARK]: darkColors.rose },
  red: { default: lightColors.red, [DARK]: darkColors.red },
  purple: { default: lightColors.purple, [DARK]: darkColors.purple },
  indigo: { default: lightColors.indigo, [DARK]: darkColors.indigo },
  amber: { default: lightColors.amber, [DARK]: darkColors.amber },
  sky: { default: lightColors.sky, [DARK]: darkColors.sky },
  green: { default: lightColors.green, [DARK]: darkColors.green },
  chipPink: { default: lightColors.chipPink, [DARK]: darkColors.chipPink },
  chipRose: { default: lightColors.chipRose, [DARK]: darkColors.chipRose },
  chipAmber: { default: lightColors.chipAmber, [DARK]: darkColors.chipAmber },
  chipIndigo: { default: lightColors.chipIndigo, [DARK]: darkColors.chipIndigo },
  chipPurple: { default: lightColors.chipPurple, [DARK]: darkColors.chipPurple },
  chipGreen: { default: lightColors.chipGreen, [DARK]: darkColors.chipGreen },
  chipSky: { default: lightColors.chipSky, [DARK]: darkColors.chipSky },
  textPrimary: { default: lightColors.textPrimary, [DARK]: darkColors.textPrimary },
  textSecondary: { default: lightColors.textSecondary, [DARK]: darkColors.textSecondary },
  textMuted: { default: lightColors.textMuted, [DARK]: darkColors.textMuted },
  textAccent: { default: lightColors.textAccent, [DARK]: darkColors.textAccent },
  textAmber: { default: lightColors.textAmber, [DARK]: darkColors.textAmber },
  textGreen: { default: lightColors.textGreen, [DARK]: darkColors.textGreen },
  textIndigo: { default: lightColors.textIndigo, [DARK]: darkColors.textIndigo },
  textOnDark: { default: lightColors.textOnDark, [DARK]: darkColors.textOnDark },
});
export const systemGradientTheme = stylex.createTheme(gradients, {
  page: { default: lightGradients.page, [DARK]: darkGradients.page },
  heroHaze: { default: lightGradients.heroHaze, [DARK]: darkGradients.heroHaze },
  hero: { default: lightGradients.hero, [DARK]: darkGradients.hero },
  panelSoft: { default: lightGradients.panelSoft, [DARK]: darkGradients.panelSoft },
  placeholderCover: { default: lightGradients.placeholderCover, [DARK]: darkGradients.placeholderCover },
  placeholderPhoto: { default: lightGradients.placeholderPhoto, [DARK]: darkGradients.placeholderPhoto },
  titleRose: { default: lightGradients.titleRose, [DARK]: darkGradients.titleRose },
});
export const systemShadowTheme = stylex.createTheme(shadows, {
  card: { default: lightShadows.card, [DARK]: darkShadows.card },
  glass: { default: lightShadows.glass, [DARK]: darkShadows.glass },
  glowPink: { default: lightShadows.glowPink, [DARK]: darkShadows.glowPink },
});

/** Explicit light theme — lets a light subtree sit inside a dark one. */
export const lightColorTheme = stylex.createTheme(colors, lightColors);
export const lightGradientTheme = stylex.createTheme(gradients, lightGradients);
export const lightShadowTheme = stylex.createTheme(shadows, lightShadows);
