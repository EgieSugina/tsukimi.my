# Comic reader (manga / manhwa / manhua)

```tsx
<ComicReader
  comicTitle="Blue Sky Refrain"
  format="manga"                     // manga → paged RTL · manhwa/manhua → vertical
  chapters={chapters}                // newest first
  currentChapterId={chapterId}
  onChapterChange={setChapterId}
  pages={[{ src: '/ch38/001.webp', width: 720, height: 1024 }, …]}
  initialPage={savedPage}
  onPageChange={(p, total) => saveProgress(p, total)}
  onBack={() => router.back()}
/>
```

## Modes

| Mode | Default for | Behaviour |
| --- | --- | --- |
| **Vertical** | manhwa, manhua | Continuous webtoon scroll, gap-less strips, page counter follows scroll |
| **Paged** | manga | One page (or two-page spread) per view, page-turn animation |

Settings panel: fit width / height, direction **right → left** / left → right, single / double
spread (double is disabled on phones).

## Navigation

| Input | Action |
| --- | --- |
| ← / → | turn page (follows reading direction in paged mode) |
| Space / PageDown | next page |
| Click / tap left or right third | page turn |
| Click / tap centre | hide / show toolbars |
| Slider | jump to page (RTL in manga mode) |
| Chapter select, ‹ › | change chapter |

At the end of a chapter an **End of Chapter** card offers *Previous* / *Next Chapter*.

## ChapterList & ComicCard

- `ChapterList` — search ("Go to chapter…"), newest / oldest sort, read state, NEW and VIP badges.
- `ComicCard` — cover 250 × 351, format badge (MANGA red · MANHWA indigo · MANHUA green), status,
  latest chapter, rating and "updated" line.

## Images

Without `src`, numbered placeholder pages are drawn using `width` / `height` for the aspect ratio.
The first 3 pages load eagerly, the rest lazily.
