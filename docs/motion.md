# Motion

Animations use **[Motion](https://motion.dev)** (`motion/react`, formerly Framer Motion).
All presets live in `src/motion/motion.tsx`.

| Preset | Use for |
| --- | --- |
| `spring.snappy` | buttons, chips, tabs, icons |
| `spring.soft` | cards, panels, list items |
| `spring.layout` | sliding active pills (`layoutId`) |
| `press` / `lift` | hover + tap feedback (controls / cards) |
| `fadeUp`, `fade`, `pop` | enter / exit variants |
| `staggerContainer(stagger, delay)` | staggered children |
| `<Reveal>`, `<Stagger>`, `<StaggerItem>` | animate any block in on scroll |

## What animates

- **Controls** — hover lift, tap squash.
- **Tabs** — the active pill slides (nav, theme toggle, season tabs, reader/SEO tabs, bottom nav).
- **Cards** — fade-up on scroll, lift on hover; polaroids straighten their tilt.
- **Lists** — staggered entry, smooth re-ordering on filter / sort (`layout` + `AnimatePresence`).
- **Calendar** — week change slides in the direction of travel.
- **Reader** — pages slide in the reading direction (RTL for manga), toolbars slide away.
- **Player** — controls fade, big play pops, Skip Intro slides in, menus pop, countdown ticks.
- **Data** — progress bars and the SEO score animate to their value.
- **Drawer** — slides in, swipe to close.

## Reduced motion

`ThemeProvider` wraps the app in `MotionProvider` with `reducedMotion="user"`: users who enabled
*Reduce motion* in their OS get instant transitions. Pass `reducedMotion="never"` to always animate
(Storybook does this by default — switch it in the **Motion** toolbar).

## Rules

- Keep durations ≤ 400ms and springs well-damped — smooth, not bouncy.
- Animate `transform` / `opacity`; avoid animating layout-heavy CSS properties.
- Don't mix a CSS `transform` transition with a Motion animation on the same element.
