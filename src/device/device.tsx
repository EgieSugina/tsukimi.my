import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BREAKPOINTS } from '../tokens/breakpoints.stylex';

export type Device = 'mobile' | 'tablet' | 'laptop' | 'pc' | 'tv';

export interface DeviceInfo {
  device: Device;
  /** Phone or tablet: drawer navigation, compact layouts. */
  isHandheld: boolean;
  /** Primary input is touch (no hover). */
  isTouch: boolean;
  /** 10-foot UI: scaled up, remote / D-pad navigation. */
  isTV: boolean;
  width: number;
  /** CSS zoom applied to the app on TV (1 elsewhere). */
  scale: number;
}

const TV_UA = /(smart-?tv|tizen|web0s|webos|netcast|hbbtv|bravia|aftb|aftm|aftt|afts|android tv|googletv|crkey|appletv|roku|vidaa|viera|philipstv|operatv)/i;

export function isTvUserAgent(ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  return TV_UA.test(ua);
}

export function deviceForWidth(width: number, tvUa = false): Device {
  if (tvUa || width >= BREAKPOINTS.tv) return 'tv';
  if (width >= BREAKPOINTS.pc) return 'pc';
  if (width >= BREAKPOINTS.laptop) return 'laptop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

/** TV scale: the 1600px desktop layout blown up to fill the screen, clamped to 1–2.4×. */
export function tvScale(width: number) {
  return Math.min(2.4, Math.max(1, width / 1600));
}

function measure(force?: Device): DeviceInfo {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const tvUa = isTvUserAgent();
  const device = force ?? deviceForWidth(width, tvUa);
  const isTouch = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches;
  const isTV = device === 'tv';
  return { device, isHandheld: device === 'mobile' || device === 'tablet', isTouch, isTV, width, scale: isTV ? tvScale(width) : 1 };
}

const Ctx = createContext<DeviceInfo | null>(null);

/** Current device tier. Works with or without <DeviceProvider> (falls back to measuring). */
export function useDevice(): DeviceInfo {
  const ctx = useContext(Ctx);
  const [own, setOwn] = useState(() => measure());
  useEffect(() => {
    if (ctx) return;
    const on = () => setOwn(measure());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [ctx]);
  return ctx ?? own;
}

export interface DeviceProviderProps {
  children: ReactNode;
  /** Force a tier (e.g. `tv` for a TV build or Storybook). Omit to auto-detect. */
  force?: Device;
  /** Scale the UI on TV with CSS zoom. Default true. */
  tvZoom?: boolean;
  /** Arrow-key / D-pad focus navigation on TV. Default true. */
  spatialNavigation?: boolean;
}

/**
 * Detects mobile / tablet / laptop / pc / tv, exposes it via `useDevice()`, sets
 * `<html data-device>` (used by global focus styles), and on TV scales the UI and
 * enables D-pad navigation.
 */
export function DeviceProvider({ children, force, tvZoom = true, spatialNavigation = true }: DeviceProviderProps) {
  const [info, setInfo] = useState(() => measure(force));

  useEffect(() => {
    const on = () => setInfo(measure(force));
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [force]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.device = info.device;
    // zoom keeps the laptop/pc layout but makes it readable from the sofa
    root.style.zoom = info.isTV && tvZoom ? String(info.scale) : '';
    return () => {
      root.style.zoom = '';
    };
  }, [info.device, info.isTV, info.scale, tvZoom]);

  useSpatialNavigation(info.isTV && spatialNavigation);

  const value = useMemo(() => info, [info]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ------------------------------------------------------------------ */
/* D-pad spatial navigation (TV remotes send arrow keys)               */
/* ------------------------------------------------------------------ */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Dir = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

function visible(el: Element) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"], [inert]');
}

/** Pick the nearest focusable element in the pressed direction. Exported for tests. */
export function findNext(from: DOMRect, candidates: { el: Element; r: DOMRect }[], dir: Dir) {
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height / 2;
  let best: Element | null = null;
  let bestScore = Infinity;
  for (const { el, r } of candidates) {
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const primary = dir === 'ArrowRight' ? dx : dir === 'ArrowLeft' ? -dx : dir === 'ArrowDown' ? dy : -dy;
    if (primary <= 4) continue; // must actually be in that direction
    const ortho = dir === 'ArrowLeft' || dir === 'ArrowRight' ? Math.abs(dy) : Math.abs(dx);
    const score = primary + ortho * 2.5;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

export function useSpatialNavigation(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || e.defaultPrevented) return;
      const active = document.activeElement as HTMLElement | null;
      // let text inputs, sliders, the comic reader and the video player keep their own arrow keys
      if (active?.closest('input, textarea, select, [data-own-arrows]')) return;
      const from = active && active !== document.body ? active.getBoundingClientRect() : new DOMRect(0, 0, 0, 0);
      const candidates = Array.from(document.querySelectorAll(FOCUSABLE))
        .filter((el) => el !== active && visible(el))
        .map((el) => ({ el, r: el.getBoundingClientRect() }));
      const next = findNext(from, candidates, e.key as Dir);
      if (next instanceof HTMLElement) {
        e.preventDefault();
        next.focus({ preventScroll: true });
        next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
