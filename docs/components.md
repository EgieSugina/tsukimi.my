# Components

All components accept an optional `xstyle` for style overrides. Full, interactive docs (controls,
every prop) are in Storybook → each component's **Docs** tab.

## Foundations

| Component | Main props | Notes |
| --- | --- | --- |
| `Icon` | `name`, `size`, `strokeWidth`, `label` | 30+ line icons, inherit `currentColor` |
| `ThemeProvider` | `mode`, `defaultMode` (`'dark'`), `onModeChange`, `reducedMotion` | see [theming](theming.md) |
| `ThemeToggle` | `compact` | Light / Dark / Auto switch with sliding pill |
| `DeviceProvider` | `force`, `tvZoom`, `spatialNavigation` | see [responsive](responsive.md) |
| `MotionProvider`, `Reveal`, `Stagger`, `StaggerItem` | `reducedMotion`, `delay`, `stagger` | see [motion](motion.md) |

## Basic components

| Component | Main props |
| --- | --- |
| `Badge` | `tone` (amber, pink, rose, indigo, green, neutral, dark, solidPink, solidRed, solidIndigo, gradient, orange, emerald), `icon`, `shape` (`pill`/`tag`), `size` |
| `Button` | `variant` (primary, secondary, ghost, outline, soft, danger), `size`, `icon`, `fullWidth` + native button props |
| `Chip` | `label`, `active`, `icon`, `onClick` |
| `StatPill` | `tone` (rose, indigo, slate, amber, green) — mono counters in the top bar |
| `NavTab` | `label`, `icon`, `active`, `indicatorId` (shared sliding pill) |
| `SearchField` | native `<input>` props, `placeholder` |
| `FilterDropdown` | `options`, `value`, `onChange`, `icon`, `highlighted` |
| `CategoryTile` | `title`, `description`, `icon`, `active` |
| `SectionHeader` | `overline`, `title`, `icon`, `linkLabel`, `onLinkClick` |
| `ProgressBar` | `value` (0–100), `color`, `height`, `label` |
| `MediaFrame` | `src`, `alt`, `kind` (`cover`/`photo`), `shade`, `children` (overlays) |

## Cards

| Component | Main props |
| --- | --- |
| `VideoPoster` | `title`, `cast`, `views`, `duration`, `quality`, `rank`, `coverSrc`, `coverOnly` |
| `VideoCard` | `title`, `cast`, `views`, `subtitle`, `duration`, `synopsis`, `attributes {views, rating, genre, released}`, `tag`, `selected`, `onPlay` |
| `CastPolaroid` | `name`, `subtitle`, `rank`, `photoSrc`, `tape`, `tilt` |
| `CastRosterCard` | `name`, `castId`, `videoCount`, `bio`, `rankNo`, `status` (`active`/`hiatus`), `tags`, `stats`, `tiles`, `photoBadges`, `photoSrc`, `onProfile` / `onFollow` / `onWatch` |
| `AnimeCard` | `title`, `season`, `kind` (TV/Movie/OVA/ONA/Special), `status`, `episodesAired`, `episodesTotal`, `studio`, `rating`, `sub`, `dub`, `rank`, `nextAiring` |
| `ComicCard` | `title`, `author`, `format` (manga/manhwa/manhua), `status`, `latestChapter`, `rating`, `rank`, `updatedAt` |

## Lists & media

| Component | Main props |
| --- | --- |
| `EpisodeList` | `seasons`, `initialSeasonId`, `currentEpisodeId`, `onSelect(episode, season)`, `variant` (`list`/`compact`), `maxHeight` |
| `AiringCalendar` | `entries`, `now`, `initialDate`, `timeZone`, `weekStartsMonday`, `onlyFollowedDefault`, `onSelect` |
| `ChapterList` | `chapters`, `currentId`, `onSelect`, `maxHeight` |
| `ComicReader` | `comicTitle`, `format`, `chapters`, `currentChapterId`, `pages`, `initialMode`, `initialDirection`, `initialSpread`, `initialPage`, `onBack`, `onChapterChange`, `onPageChange`, `height` |
| `VideoPlayer` | `sources`, `poster`, `title`, `subtitle`, `subtitles`, `audioOptions` / `audio` / `onAudioChange`, `intro`, `outro`, `markers`, `nextEpisode`, `onNext`, `autoNextSeconds`, `startTime`, `autoPlay`, `onProgress`, `onTheaterChange` |

## Layout

| Component | Main props |
| --- | --- |
| `TopBar` | `brand`, `mode`, `username`, `stats`, `navItems`, `activeNav`, `onNavigate`, `favorites`, `language`, `onMenu` |
| `Sidebar` | `featured`, `continueWatching`, `watchlist`, `genres`, `activeGenre`, `onGenreChange` |
| `BottomNav` | `items`, `active`, `onNavigate` (mobile only) |
| `AppShell` | `topBar`, `sidebar`, `hideSidebar`, `children` — responsive frame with drawer + bottom nav |

## SEO

| Export | |
| --- | --- |
| `Seo` | renders all head tags for a page — see [SEO](seo.md) |
| `SeoOptimizer` | `initialMeta`, `pathPrefix`, `initialSlug`, `h1Count`, `onChange` |
| `auditSeo`, `buildHeadTags`, `headTagsToHtml`, `*JsonLd` builders | pure functions |
