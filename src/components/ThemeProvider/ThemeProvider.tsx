import * as stylex from '@stylexjs/stylex';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  darkColorTheme,
  darkGradientTheme,
  darkShadowTheme,
  lightColorTheme,
  lightGradientTheme,
  lightShadowTheme,
  systemColorTheme,
  systemGradientTheme,
  systemShadowTheme,
} from '../../tokens/themes';
import { colors } from '../../tokens/tokens.stylex';
import { MotionProvider, type ReducedMotionMode } from '../../motion/motion';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeCtx {
  mode: ThemeMode;
  /** The mode actually shown (system resolved to light/dark). */
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<ThemeCtx>({ mode: 'dark', resolved: 'dark', setMode: () => {} });
export const useTheme = () => useContext(Ctx);

const STORAGE_KEY = 'tsukimi-theme';

export interface ThemeProviderProps {
  children: ReactNode;
  /** Controlled mode. Omit to let the provider manage it (persisted in localStorage). */
  mode?: ThemeMode;
  defaultMode?: ThemeMode;
  onModeChange?: (m: ThemeMode) => void;
  /** Passed to Motion: `user` respects the OS setting (default), `never` always animates. */
  reducedMotion?: ReducedMotionMode;
  xstyle?: stylex.StyleXStyles;
}

/**
 * Applies the light / dark / system theme to everything inside it by overriding
 * the StyleX token variables. Wrap the app (or a story) once.
 */
export function ThemeProvider({ children, mode: controlled, defaultMode = 'dark', onModeChange, reducedMotion = 'user', xstyle }: ThemeProviderProps) {
  const [own, setOwn] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || defaultMode;
    } catch {
      return defaultMode;
    }
  });
  const mode = controlled ?? own;
  const [osDark, setOsDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setOsDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const resolved = mode === 'system' ? (osDark ? 'dark' : 'light') : mode;
  const ctx = useMemo<ThemeCtx>(
    () => ({
      mode,
      resolved,
      setMode: (m) => {
        if (controlled === undefined) {
          setOwn(m);
          try {
            localStorage.setItem(STORAGE_KEY, m);
          } catch {
            /* storage unavailable */
          }
        }
        onModeChange?.(m);
      },
    }),
    [mode, resolved, controlled, onModeChange],
  );

  // let native controls, scrollbars and the document background follow the theme
  useEffect(() => {
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  return (
    <Ctx.Provider value={ctx}>
      <MotionProvider reducedMotion={reducedMotion}>
      <div
        data-theme={resolved}
        {...stylex.props(
          styles.root,
          mode === 'light' && [lightColorTheme, lightGradientTheme, lightShadowTheme],
          mode === 'dark' && [darkColorTheme, darkGradientTheme, darkShadowTheme],
          mode === 'system' && [systemColorTheme, systemGradientTheme, systemShadowTheme],
          xstyle,
        )}
      >
        {children}
      </div>
      </MotionProvider>
    </Ctx.Provider>
  );
}

const styles = stylex.create({
  root: {
    color: colors.textPrimary,
    backgroundColor: colors.bgPage,
    minHeight: '100%',
    // smooth cross-fade when switching light/dark
    transitionProperty: 'background-color, color',
    transitionDuration: '300ms',
  },
});
