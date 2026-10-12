# SEO

Everything lives in `src/seo/`.

## 1. `<Seo>` — head tags

```tsx
<Seo
  title="Blue Sky Refrain Manga — Read Online"
  description="Read Blue Sky Refrain manga online: 42 chapters…"
  canonical="https://tsukimi.my/comics/blue-sky-refrain"
  image="https://tsukimi.my/og/blue-sky-refrain.jpg" imageWidth={1200} imageHeight={630}
  imageAlt="Blue Sky Refrain cover art"
  type="book"
  alternates={[{ hrefLang: 'en', href: '…' }, { hrefLang: 'x-default', href: '…' }]}
  jsonLd={[comicSeriesJsonLd({ … }), breadcrumbJsonLd([…])]}
/>
```

Renders `<title>` (with the "| Tsukimi" template), description, robots, canonical, hreflang,
Open Graph, Twitter card and JSON-LD. React 19 hoists them into `<head>`. For Next.js / Remix use
`buildHeadTags(meta)` or `headTagsToHtml(...)` with the framework's head API.

Change the site name / URL / template in `SITE` (`src/seo/seo.ts`).

## 2. Structured data builders

| Builder | schema.org type | Use on |
| --- | --- | --- |
| `websiteJsonLd()` | WebSite + SearchAction | home |
| `breadcrumbJsonLd(items)` | BreadcrumbList | every inner page |
| `videoJsonLd(...)` | VideoObject | video pages |
| `personJsonLd(...)` | Person | cast profiles |
| `animeSeriesJsonLd(...)` | TVSeries + TVSeason | anime series |
| `animeEpisodeJsonLd(...)` | TVEpisode | watch page |
| `comicSeriesJsonLd(...)` | ComicSeries | comic detail |
| `comicChapterJsonLd(...)` | ComicIssue | reader / chapter |

Ready-made examples for every page type: `src/mocks/seo.ts`.

## 3. Audit & optimizer

`auditSeo(meta, { slug, h1Count })` → `{ score 0–100, grade A–D, checks[] }`.

| Check | Target |
| --- | --- |
| Title | 30–60 chars incl. suffix |
| Description | 70–160 chars |
| Focus keyword | in title (near the start), description and slug |
| Slug | lowercase, hyphens, ≤ 75 chars |
| Canonical | absolute `https://` |
| Social image | 1200 × 630 + alt text |
| Structured data | ≥ 1 JSON-LD block |
| hreflang | includes `x-default` |
| Indexing | not `noindex` |
| H1 | exactly one |

`<SeoOptimizer initialMeta={…} pathPrefix="/comics/" />` is the editor UI: live Google result and
social card previews, animated score, checklist with suggested fixes, and a copyable `<head>` export.

## Tips for this site

- Use a 1200 × 630 crop of the key visual for `og:image` — not the 250 × 351 poster.
- Reader pages: canonical = chapter URL (not `?page=3`).
- Anime episodes: one URL per episode (`/anime/<series>/season-2/episode-3`) with `TVEpisode` JSON-LD.
