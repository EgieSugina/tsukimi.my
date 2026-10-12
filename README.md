# Tsukimi UI

Reusable **React 19 + StyleX** component library for the **Tsukimi** web app — video streaming,
cast profiles, **anime** (seasons, episodes, airing calendar), **manga / manhwa** reader and an
**SEO optimizer** — documented in **Storybook 10**. Dark theme by default, animated with **Motion**,
and responsive from **mobile → tablet → laptop → PC → TV**.

![Home — PC, dark theme](docs/screenshots/home-pc.jpg)

## Features

| | |
| --- | --- |
| 🎬 **Video** | Posters & library cards (cover 250 × 351), custom **VideoPlayer** (quality, speed, subtitles, SUB/DUB, skip intro/outro, chapters, autoplay next, PiP, theater, keyboard & touch gestures) |
| 👩 **Cast** | Popular-actress polaroids, Cast Roster cards with stats & actions |
| 📺 **Anime** | Anime cards, season/episode list (filler, recap, progress), weekly **airing calendar** (timezone-aware) |
| 📖 **Comics** | Manga / manhwa / manhua cards, chapter list, **reader** (vertical webtoon, paged RTL/LTR, 2-page spreads) |
| 🔎 **SEO** | `<Seo>` head tags + JSON-LD builders + **SeoOptimizer** (score, checklist, Google & social previews) |
| 🌗 **Theme** | Dark (default) · Light · System, persisted per user |
| ✨ **Motion** | Spring animations, sliding tab pills, reveal-on-scroll, page turns — respects *Reduce motion* |
| 📱 **Devices** | Mobile bottom nav & drawer, tablet drawer, laptop/PC full layout, **TV** 10-foot UI with D-pad navigation |

## Quick start

```bash
npm install
npm run storybook        # http://localhost:6006
```

```bash
npm run typecheck        # TypeScript
npm run build-storybook  # static site → storybook-static/
npm run screenshots      # regenerate docs/screenshots (needs Storybook running)
```

```tsx
import { ThemeProvider, DeviceProvider, AppShell, VideoCard } from '@tsukimi/ui';

export function App() {
  return (
    <DeviceProvider>
      <ThemeProvider>
        <AppShell topBar={{ activeNav: 'videos' }}>
          <VideoCard {...video} coverSrc={video.cover} />
        </AppShell>
      </ThemeProvider>
    </DeviceProvider>
  );
}
```

## Screenshots

### Desktop (PC 1920 × 1080)

| Video library (laptop 1366) | Cast directory |
| --- | --- |
| ![Video library](docs/screenshots/video-library-laptop.jpg) | ![Cast directory](docs/screenshots/cast-directory-pc.jpg) |

| Anime + airing calendar | Anime detail |
| --- | --- |
| ![Anime](docs/screenshots/anime-pc.jpg) | ![Anime detail](docs/screenshots/anime-detail-pc.jpg) |

| Watch (video player) | Airing calendar |
| --- | --- |
| ![Watch](docs/screenshots/watch-pc.jpg) | ![Airing calendar](docs/screenshots/airing-calendar-pc.jpg) |

| Comics | Comic detail |
| --- | --- |
| ![Comics](docs/screenshots/comics-pc.jpg) | ![Comic detail](docs/screenshots/comic-detail-pc.jpg) |

| Manga reader (2-page spread, RTL) | SEO optimizer |
| --- | --- |
| ![Manga reader](docs/screenshots/reader-manga-spread.jpg) | ![SEO optimizer](docs/screenshots/seo-optimizer.jpg) |

### Themes

| Dark & light side by side | Light theme |
| --- | --- |
| ![Themes](docs/screenshots/theme-side-by-side.jpg) | ![Light](docs/screenshots/home-light-pc.jpg) |

### Mobile, tablet & TV

| Home — mobile | Watch — mobile | Calendar — mobile | Manhwa reader — mobile |
| --- | --- | --- | --- |
| ![Home mobile](docs/screenshots/home-mobile.jpg) | ![Watch mobile](docs/screenshots/watch-mobile.jpg) | ![Calendar mobile](docs/screenshots/calendar-mobile.jpg) | ![Reader mobile](docs/screenshots/reader-manhwa-mobile.jpg) |

| Cast — tablet | Drawer — tablet | TV (10-foot UI) |
| --- | --- | --- |
| ![Cast tablet](docs/screenshots/cast-tablet.jpg) | ![Drawer tablet](docs/screenshots/drawer-tablet.jpg) | ![TV](docs/screenshots/home-tv.jpg) |

## Documentation

| Guide | |
| --- | --- |
| [Getting started](docs/getting-started.md) | Install, run, use in an app, Storybook toolbars |
| [Architecture](docs/architecture.md) | Folder layout, StyleX conventions, adding a component |
| [Components](docs/components.md) | Every component and its main props |
| [Theming](docs/theming.md) | Tokens, dark/light/system, `ThemeProvider` |
| [Responsive & devices](docs/responsive.md) | Breakpoints, `useDevice`, mobile/tablet/TV behaviour |
| [Motion](docs/motion.md) | Animation presets and rules |
| [Video player](docs/video-player.md) | Sources, subtitles, intro/outro, shortcuts, gestures |
| [Anime](docs/anime.md) | Anime cards, seasons & episodes, airing calendar |
| [Comic reader](docs/comic-reader.md) | Manga / manhwa reading modes |
| [SEO](docs/seo.md) | `<Seo>`, JSON-LD, audit rules |

## Project structure

```
src/
  tokens/        tokens.stylex.ts · themes.ts · breakpoints.stylex.ts
  device/        DeviceProvider, useDevice, TV spatial navigation
  motion/        Motion presets (springs, variants, Reveal/Stagger)
  components/    one folder per component: <Name>.tsx + <Name>.stories.tsx
  seo/           <Seo>, SeoOptimizer, audit + JSON-LD builders
  pages/         full-page compositions (Home, Videos, Cast, Anime, Comics, Watch…)
  mocks/         sample data for stories
public/sample/   demo video + WebVTT subtitles
docs/            guides + screenshots
scripts/         capture-screenshots.cjs
```

## Conventions

- **Photos & covers are always 250 × 351** (150 wide on phones, same ratio) — pass `coverSrc` / `photoSrc`.
- Every component accepts `xstyle` (a `stylex.create(...)` style) for overrides.
- Use tokens (`colors.pink`, `radius.md`, `bp.mobile`, `spring.soft`) — never raw values in new code.
- Sample names, titles and numbers in `src/mocks/` are placeholders.
