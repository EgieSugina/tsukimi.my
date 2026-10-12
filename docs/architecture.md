# Architecture

```
src/
  tokens/
    tokens.stylex.ts      colors, gradients, radius, space, fonts, shadows, media  (stylex.defineVars)
    themes.ts             dark / light / system themes                             (stylex.createTheme)
    breakpoints.stylex.ts media-query constants `bp`                               (stylex.defineConsts)
  device/device.tsx       DeviceProvider, useDevice, TV detection + spatial navigation
  motion/motion.tsx       Motion presets, MotionProvider, Reveal / Stagger
  components/<Name>/      <Name>.tsx + <Name>.stories.tsx
  seo/                    seo.ts (pure functions), Seo.tsx, SeoOptimizer.tsx
  pages/pages.tsx         page compositions used by the "Pages" stories
  mocks/                  sample data (data.ts, seo.ts)
  index.ts                public exports
```

## Styling with StyleX

- Styles are written with `stylex.create` **at module level** and applied with `{...stylex.props(...)}`.
- Values come from tokens: `colors.pink`, `radius.md`, `fonts.mono`, `shadows.card`, `gradients.primary`.
- Responsive values use the `bp` constants:

  ```ts
  padding: { default: 24, [bp.tablet]: 20, [bp.mobile]: 12 },
  ```

- Hover / focus use per-property conditions: `backgroundColor: { default: x, ':hover': y }`.
  (Top-level `':hover': {…}` blocks are not allowed in StyleX.)
- Dynamic values (widths, colors from props) use function styles:
  `const dyn = stylex.create({ width: (w: string) => ({ width: w }) })`.
- Every component accepts **`xstyle`** so callers can override layout without forking it.

## Component rules

1. One folder per component with a story file; export it from `src/index.ts`.
2. Covers & profile photos go through `MediaFrame` (250 × 351, 150 wide on phones).
3. Interactive elements are real `<button>` / `<input>` / `<select>` with labels (keyboard + screen readers).
4. Animations use presets from `src/motion/motion.tsx` (`spring.snappy`, `fadeUp`, …).
5. Layout differences between devices: prefer CSS (`bp`) — use `useDevice()` only when the
   *structure* changes (drawer vs sidebar, one-day calendar, touch gestures).
6. No hardcoded light-only colors — use tokens so dark / light themes both work.

## Adding a component

```tsx
// src/components/Rating/Rating.tsx
import * as stylex from '@stylexjs/stylex';
import { colors, fonts } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';

export interface RatingProps { value: number; xstyle?: stylex.StyleXStyles }

export function Rating({ value, xstyle }: RatingProps) {
  return <span {...stylex.props(styles.root, xstyle)}>★ {value.toFixed(1)}</span>;
}

const styles = stylex.create({
  root: { fontFamily: fonts.mono, color: colors.amber, fontSize: { default: 14, [bp.mobile]: 12 } },
});
```

Then add `Rating.stories.tsx` and `export * from './components/Rating/Rating';` in `src/index.ts`.
