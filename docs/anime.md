# Anime

## AnimeCard

Cover 250 × 351 with type (TV / Movie / OVA / ONA / Special), SUB / DUB, status
(airing / finished / upcoming), episode count and next airing time.

```tsx
<AnimeCard title="Blue Sky Refrain" season="Fall 2026" kind="TV" status="airing"
  episodesAired={7} episodesTotal={12} studio="Aoharu Studio" rating="4.9"
  sub dub rank="#1 This Season" nextAiring="EP 8 · Sat 23:30" coverSrc={cover} />
```

## Seasons & episodes — `EpisodeList`

```ts
interface Season { id: string; label: string; period?: string; episodes: Episode[] }
interface Episode {
  id: string; number: number; title: string; duration: string; airDate: string;
  synopsis?: string; thumbnailSrc?: string; progress?: number;   // 0–100
  filler?: boolean; recap?: boolean; isNew?: boolean; upcoming?: boolean; dub?: boolean;
}
```

- Season tabs (Season 1, Season 2, Movie …) with a sliding pill.
- "Hide filler" toggle, watched progress bar, NOW overlay for the current episode.
- `variant="compact"` for the watch-page sidebar.

## Airing calendar — `AiringCalendar`

```tsx
<AiringCalendar entries={schedule} timeZone="Asia/Jakarta" onSelect={openEpisode} />
```

```ts
interface AiringEntry {
  id: string; title: string; episode: number;
  airsAt: string;          // ISO with offset, e.g. "2026-10-17T23:30:00+09:00"
  coverSrc?: string; version?: string; premiere?: boolean; finale?: boolean; followed?: boolean;
}
```

- Mon–Sun week, today highlighted, previous / next week, "This week".
- States: **Aired**, **in 2h 30m** (≤ 3h, amber), upcoming countdown, PREMIERE / FINALE.
- Episodes are grouped by their calendar day **in the chosen `timeZone`** (an 00:30 JST episode
  shows on Thursday in Tokyo but Wednesday in Jakarta).
- "Followed only" filter.
- Phones & tablets: day picker + one day at a time.

## Pages

*Pages → Anime* (season browser + calendar), *Anime Detail*, *Watch (video player)*.
