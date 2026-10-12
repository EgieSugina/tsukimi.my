# Theming

## Tokens

`src/tokens/tokens.stylex.ts` defines the design tokens with `stylex.defineVars`:

| Group | Examples |
| --- | --- |
| `colors` | `bgPage`, `surfaceStrong`, `surfaceCard`, `borderSubtle`, `pink`, `rose`, `indigo`, `amber`, `chipPink`, `textPrimary`, `textAccent` … |
| `gradients` | `primary`, `pinkRose`, `roseAmber`, `logo`, `page`, `hero`, `placeholderCover` … |
| `radius` | `xs 6` · `sm 8` · `md 14` · `lg 20` · `xl 28` · `pill` |
| `fonts` | `display` (Playfair Display) · `body` (Plus Jakarta Sans) · `mono` (JetBrains Mono) |
| `shadows` | `card`, `glass`, `glowPink` (kept subtle; no pink glow in dark mode) |
| `media` | `coverWidth 250px`, `coverHeight 351px` |

They mirror the variables in the Figma file *Web Stream — UI Reference*.

## Themes

`src/tokens/themes.ts` creates three themes with `stylex.createTheme`:

- **dark** — night-city palette (default)
- **light** — the original pastel pink look
- **system** — follows `prefers-color-scheme`

```tsx
<ThemeProvider>                 {/* dark by default, remembers the user's choice */}
<ThemeProvider defaultMode="system">
<ThemeProvider mode={mode} onModeChange={setMode}>   {/* controlled */}
```

- The choice is stored in `localStorage` (`tsukimi-theme`).
- `useTheme()` → `{ mode, resolved, setMode }`.
- `<ThemeToggle />` is already in the `TopBar`.
- Providers can be nested (e.g. a light preview inside the dark app).

## Rules

- Never hardcode light colors (`#ffffff`, pastel hex) in components — use tokens so dark mode works.
- Translucent tints (`rgba(236,72,153,0.1)`) are fine: they work on both backgrounds.
- New tokens must be added to `tokens.stylex.ts` **and** to the dark / light / system objects in `themes.ts`.
