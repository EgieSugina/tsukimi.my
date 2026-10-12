import * as stylex from '@stylexjs/stylex';

/**
 * Device breakpoints (CSS px).
 *   mobile  < 640   · tablet 640–1023 · laptop 1024–1439 · pc 1440–2559 · tv ≥ 2560
 * Smart TVs that report a small CSS viewport (e.g. 1920 / 960 wide) are detected by
 * user agent in `useDevice()` and get the TV treatment (scaled UI + D-pad focus).
 *
 * Usage: `padding: { default: 24, [bp.mobile]: 12 }`
 */
export const bp = stylex.defineConsts({
  mobile: '@media (max-width: 639px)',
  tablet: '@media (min-width: 640px) and (max-width: 1023px)',
  belowLaptop: '@media (max-width: 1023px)',
  laptop: '@media (min-width: 1024px) and (max-width: 1439px)',
  belowPc: '@media (max-width: 1439px)',
  pc: '@media (min-width: 1440px)',
  tv: '@media (min-width: 2560px)',
  touch: '@media (hover: none) and (pointer: coarse)',
});

/** Same numbers for JS (matchMedia / useDevice). Keep in sync with `bp`. */
export const BREAKPOINTS = { tablet: 640, laptop: 1024, pc: 1440, tv: 2560 } as const;
