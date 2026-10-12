/**
 * SEO utilities: meta model, JSON-LD (schema.org) builders and an audit/optimizer.
 * Pure functions — safe to use on the server (SSR) and in the browser.
 */

export type OgType = 'website' | 'video.movie' | 'video.episode' | 'video.other' | 'profile' | 'book' | 'article';

export interface SeoAlternate {
  /** BCP-47, e.g. "en", "ja", "id", or "x-default". */
  hrefLang: string;
  href: string;
}

export interface SeoMeta {
  title: string;
  description: string;
  /** Absolute canonical URL. */
  canonical?: string;
  /** Absolute image URL. Recommended 1200 × 630 for social cards. */
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  type?: OgType;
  siteName?: string;
  /** e.g. "en_US" */
  locale?: string;
  alternates?: SeoAlternate[];
  keywords?: string[];
  /** The main search phrase this page should rank for (used by the audit only). */
  focusKeyword?: string;
  twitterSite?: string;
  noindex?: boolean;
  nofollow?: boolean;
  /** Appended to `title` as "Title | Site" unless the title already contains it. */
  titleTemplate?: string;
  /** schema.org objects from the builders below. */
  jsonLd?: JsonLd[];
}

export type JsonLd = Record<string, unknown> & { '@type': string };

export const SITE = {
  name: 'Tsukimi',
  url: 'https://tsukimi.my',
  locale: 'en_US',
  twitter: '@tsukimi',
  titleTemplate: '%s | Tsukimi',
};

export function resolveTitle(meta: Pick<SeoMeta, 'title' | 'titleTemplate' | 'siteName'>): string {
  const template = meta.titleTemplate ?? SITE.titleTemplate;
  const site = meta.siteName ?? SITE.name;
  if (!meta.title) return site;
  if (meta.title.includes(site)) return meta.title;
  return template.replace('%s', meta.title);
}

export function absoluteUrl(path: string, base = SITE.url): string {
  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

/** "Blue Sky Refrain — Ep 1!" → "blue-sky-refrain-ep-1" */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9぀-ヿ一-鿿가-힯]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 75);
}

/** Trim to `max` chars on a word boundary, adding an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).trimEnd()}…`;
}

/** ISO-8601 duration from "1:42:10" / "24:18". */
export function toIsoDuration(clock: string): string {
  const parts = clock.split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0] ?? 0, parts[1] ?? 0];
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}` || 'PT0S';
}

/* ------------------------------------------------------------------ */
/* JSON-LD builders                                                    */
/* ------------------------------------------------------------------ */

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.url) })),
  };
}

export function videoJsonLd(v: {
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  uploadDate: string;
  duration: string;
  cast?: string[];
  genre?: string;
  views?: number;
  rating?: { value: number; count: number };
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description,
    thumbnailUrl: [absoluteUrl(v.thumbnail)],
    uploadDate: v.uploadDate,
    duration: toIsoDuration(v.duration),
    contentUrl: absoluteUrl(v.url),
    embedUrl: absoluteUrl(`${v.url}/embed`),
    ...(v.genre && { genre: v.genre }),
    ...(v.cast?.length && { actor: v.cast.map((name) => ({ '@type': 'Person', name })) }),
    ...(v.views !== undefined && {
      interactionStatistic: { '@type': 'InteractionCounter', interactionType: { '@type': 'WatchAction' }, userInteractionCount: v.views },
    }),
    ...(v.rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: v.rating.value, ratingCount: v.rating.count, bestRating: 5 } }),
  };
}

export function personJsonLd(p: { name: string; url: string; image?: string; description?: string; sameAs?: string[]; jobTitle?: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    url: absoluteUrl(p.url),
    jobTitle: p.jobTitle ?? 'Actress',
    ...(p.image && { image: absoluteUrl(p.image) }),
    ...(p.description && { description: p.description }),
    ...(p.sameAs?.length && { sameAs: p.sameAs }),
  };
}

export function comicSeriesJsonLd(c: {
  title: string;
  description: string;
  url: string;
  image?: string;
  author: string;
  genres?: string[];
  /** manga | manhwa | manhua */
  format: string;
  status?: string;
  rating?: { value: number; count: number };
  inLanguage?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ComicSeries',
    name: c.title,
    description: c.description,
    url: absoluteUrl(c.url),
    author: { '@type': 'Person', name: c.author },
    genre: [c.format, ...(c.genres ?? [])],
    ...(c.image && { image: absoluteUrl(c.image) }),
    ...(c.inLanguage && { inLanguage: c.inLanguage }),
    ...(c.status && { creativeWorkStatus: c.status }),
    ...(c.rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating.value, ratingCount: c.rating.count, bestRating: 5 } }),
  };
}

export function comicChapterJsonLd(c: { seriesTitle: string; seriesUrl: string; number: string; title: string; url: string; datePublished?: string; pageCount?: number }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ComicIssue',
    name: `${c.seriesTitle} — Chapter ${c.number}: ${c.title}`,
    issueNumber: c.number,
    url: absoluteUrl(c.url),
    isPartOf: { '@type': 'ComicSeries', name: c.seriesTitle, url: absoluteUrl(c.seriesUrl) },
    ...(c.datePublished && { datePublished: c.datePublished }),
    ...(c.pageCount && { numberOfPages: c.pageCount }),
  };
}

export function animeSeriesJsonLd(a: {
  title: string;
  description: string;
  url: string;
  image?: string;
  studio?: string;
  genres?: string[];
  seasons: { number: number; name: string; episodes: number; startDate?: string }[];
  rating?: { value: number; count: number };
  inLanguage?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: a.title,
    description: a.description,
    url: absoluteUrl(a.url),
    genre: ['Anime', ...(a.genres ?? [])],
    numberOfSeasons: a.seasons.length,
    numberOfEpisodes: a.seasons.reduce((n, s) => n + s.episodes, 0),
    containsSeason: a.seasons.map((s) => ({
      '@type': 'TVSeason',
      seasonNumber: s.number,
      name: s.name,
      numberOfEpisodes: s.episodes,
      ...(s.startDate && { startDate: s.startDate }),
    })),
    ...(a.image && { image: absoluteUrl(a.image) }),
    ...(a.studio && { productionCompany: { '@type': 'Organization', name: a.studio } }),
    ...(a.inLanguage && { inLanguage: a.inLanguage }),
    ...(a.rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: a.rating.value, ratingCount: a.rating.count, bestRating: 5 } }),
  };
}

export function animeEpisodeJsonLd(e: {
  seriesTitle: string;
  seriesUrl: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  datePublished?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: e.title,
    episodeNumber: e.episodeNumber,
    url: absoluteUrl(e.url),
    partOfSeason: { '@type': 'TVSeason', seasonNumber: e.seasonNumber },
    partOfSeries: { '@type': 'TVSeries', name: e.seriesTitle, url: absoluteUrl(e.seriesUrl) },
    ...(e.description && { description: e.description }),
    ...(e.datePublished && { datePublished: e.datePublished }),
    ...(e.thumbnail &&
      e.duration && {
        video: { '@type': 'VideoObject', name: e.title, thumbnailUrl: absoluteUrl(e.thumbnail), uploadDate: e.datePublished, duration: toIsoDuration(e.duration) },
      }),
  };
}

/* ------------------------------------------------------------------ */
/* Head tags (also used by <Seo> and for the "copy HTML" export)       */
/* ------------------------------------------------------------------ */

export type HeadTag =
  | { tag: 'title'; content: string }
  | { tag: 'meta'; name?: string; property?: string; content: string }
  | { tag: 'link'; rel: string; href: string; hrefLang?: string }
  | { tag: 'script'; type: 'application/ld+json'; content: string };

export function buildHeadTags(meta: SeoMeta): HeadTag[] {
  const title = resolveTitle(meta);
  const siteName = meta.siteName ?? SITE.name;
  const robots = [meta.noindex ? 'noindex' : 'index', meta.nofollow ? 'nofollow' : 'follow', 'max-image-preview:large'].join(', ');
  const tags: HeadTag[] = [
    { tag: 'title', content: title },
    { tag: 'meta', name: 'description', content: meta.description },
    { tag: 'meta', name: 'robots', content: robots },
  ];
  if (meta.keywords?.length) tags.push({ tag: 'meta', name: 'keywords', content: meta.keywords.join(', ') });
  if (meta.canonical) tags.push({ tag: 'link', rel: 'canonical', href: meta.canonical });
  for (const alt of meta.alternates ?? []) tags.push({ tag: 'link', rel: 'alternate', hrefLang: alt.hrefLang, href: alt.href });

  // Open Graph
  tags.push(
    { tag: 'meta', property: 'og:type', content: meta.type ?? 'website' },
    { tag: 'meta', property: 'og:site_name', content: siteName },
    { tag: 'meta', property: 'og:title', content: meta.title || siteName },
    { tag: 'meta', property: 'og:description', content: meta.description },
    { tag: 'meta', property: 'og:locale', content: meta.locale ?? SITE.locale },
  );
  if (meta.canonical) tags.push({ tag: 'meta', property: 'og:url', content: meta.canonical });
  if (meta.image) {
    tags.push({ tag: 'meta', property: 'og:image', content: meta.image });
    if (meta.imageWidth) tags.push({ tag: 'meta', property: 'og:image:width', content: String(meta.imageWidth) });
    if (meta.imageHeight) tags.push({ tag: 'meta', property: 'og:image:height', content: String(meta.imageHeight) });
    if (meta.imageAlt) tags.push({ tag: 'meta', property: 'og:image:alt', content: meta.imageAlt });
  }

  // Twitter / X
  tags.push(
    { tag: 'meta', name: 'twitter:card', content: meta.image ? 'summary_large_image' : 'summary' },
    { tag: 'meta', name: 'twitter:site', content: meta.twitterSite ?? SITE.twitter },
    { tag: 'meta', name: 'twitter:title', content: meta.title || siteName },
    { tag: 'meta', name: 'twitter:description', content: meta.description },
  );
  if (meta.image) tags.push({ tag: 'meta', name: 'twitter:image', content: meta.image });

  for (const ld of meta.jsonLd ?? []) tags.push({ tag: 'script', type: 'application/ld+json', content: JSON.stringify(ld) });
  return tags;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Serialize head tags to an HTML string (for SSR templates or the optimizer's export). */
export function headTagsToHtml(tags: HeadTag[], pretty = true): string {
  return tags
    .map((t) => {
      switch (t.tag) {
        case 'title':
          return `<title>${esc(t.content)}</title>`;
        case 'meta':
          return `<meta ${t.property ? `property="${t.property}"` : `name="${t.name}"`} content="${esc(t.content)}" />`;
        case 'link':
          return `<link rel="${t.rel}"${t.hrefLang ? ` hreflang="${t.hrefLang}"` : ''} href="${esc(t.href)}" />`;
        case 'script':
          return `<script type="application/ld+json">${pretty ? JSON.stringify(JSON.parse(t.content), null, 2) : t.content}</script>`;
      }
    })
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* Audit / optimizer                                                   */
/* ------------------------------------------------------------------ */

export type AuditStatus = 'pass' | 'warn' | 'fail';

export interface AuditCheck {
  id: string;
  label: string;
  status: AuditStatus;
  message: string;
  /** Concrete suggestion to fix it. */
  fix?: string;
}

export interface AuditResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  checks: AuditCheck[];
}

export const LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descMin: 70,
  descMax: 160,
  slugMax: 75,
  ogWidth: 1200,
  ogHeight: 630,
};

const has = (haystack: string, needle?: string) => !!needle && haystack.toLowerCase().includes(needle.toLowerCase());

export function auditSeo(meta: SeoMeta, extra: { slug?: string; h1Count?: number } = {}): AuditResult {
  const checks: AuditCheck[] = [];
  const add = (c: AuditCheck) => checks.push(c);
  const fullTitle = resolveTitle(meta);
  const kw = meta.focusKeyword?.trim();

  // title
  const tl = fullTitle.length;
  add({
    id: 'title-length',
    label: 'Title length',
    status: !meta.title ? 'fail' : tl < LIMITS.titleMin ? 'warn' : tl > 70 ? 'fail' : tl > LIMITS.titleMax ? 'warn' : 'pass',
    message: `${tl} characters (ideal ${LIMITS.titleMin}–${LIMITS.titleMax}).`,
    fix: tl > LIMITS.titleMax ? 'Shorten the title — Google truncates around 60 characters / 580px.' : tl < LIMITS.titleMin ? 'Add the genre, cast or format (e.g. “Manga”, “Episode 3”).' : undefined,
  });

  // description
  const dl = meta.description.trim().length;
  add({
    id: 'description-length',
    label: 'Meta description',
    status: dl === 0 ? 'fail' : dl < LIMITS.descMin || dl > LIMITS.descMax ? 'warn' : 'pass',
    message: dl === 0 ? 'Missing.' : `${dl} characters (ideal ${LIMITS.descMin}–${LIMITS.descMax}).`,
    fix: dl > LIMITS.descMax ? `Trim to: “${truncate(meta.description, LIMITS.descMax)}”` : dl < LIMITS.descMin ? 'Describe the plot, cast and what makes it worth watching/reading.' : undefined,
  });

  // focus keyword
  if (kw) {
    add({
      id: 'kw-title',
      label: 'Keyword in title',
      status: has(meta.title, kw) ? (meta.title.toLowerCase().indexOf(kw.toLowerCase()) < 20 ? 'pass' : 'warn') : 'fail',
      message: has(meta.title, kw) ? `“${kw}” found${meta.title.toLowerCase().indexOf(kw.toLowerCase()) < 20 ? ' near the start' : ', but not near the start'}.` : `“${kw}” is not in the title.`,
      fix: has(meta.title, kw) ? undefined : `Start the title with “${kw}”.`,
    });
    add({
      id: 'kw-description',
      label: 'Keyword in description',
      status: has(meta.description, kw) ? 'pass' : 'warn',
      message: has(meta.description, kw) ? 'Present.' : `“${kw}” is not in the description.`,
    });
    if (extra.slug !== undefined) {
      add({
        id: 'kw-slug',
        label: 'Keyword in URL',
        status: extra.slug.includes(slugify(kw)) ? 'pass' : 'warn',
        message: extra.slug.includes(slugify(kw)) ? 'Present.' : `Slug does not contain “${slugify(kw)}”.`,
        fix: extra.slug.includes(slugify(kw)) ? undefined : `Use /${slugify(kw)}`,
      });
    }
  } else {
    add({ id: 'kw', label: 'Focus keyword', status: 'warn', message: 'No focus keyword set.', fix: 'Pick the main phrase people search for, e.g. “blue sky refrain manga”.' });
  }

  // slug
  if (extra.slug !== undefined) {
    const clean = extra.slug === slugify(extra.slug);
    add({
      id: 'slug',
      label: 'URL slug',
      status: !extra.slug ? 'fail' : !clean || extra.slug.length > LIMITS.slugMax ? 'warn' : 'pass',
      message: !extra.slug ? 'Missing.' : clean ? `${extra.slug.length} chars, lowercase & hyphenated.` : 'Contains uppercase, spaces or symbols.',
      fix: clean ? undefined : `Use “${slugify(extra.slug)}”.`,
    });
  }

  // canonical
  add({
    id: 'canonical',
    label: 'Canonical URL',
    status: !meta.canonical ? 'fail' : meta.canonical.startsWith('https://') ? 'pass' : 'warn',
    message: !meta.canonical ? 'Missing — duplicate pages (filters, ?page=) may compete.' : meta.canonical.startsWith('https://') ? meta.canonical : 'Should be an absolute https:// URL.',
  });

  // image
  add({
    id: 'og-image',
    label: 'Social image',
    status: !meta.image ? 'fail' : meta.imageWidth && meta.imageWidth < LIMITS.ogWidth ? 'warn' : 'pass',
    message: !meta.image
      ? 'No og:image — shares on X / Facebook / LINE / Discord will look empty.'
      : meta.imageWidth
        ? `${meta.imageWidth} × ${meta.imageHeight ?? '?'} (recommended ${LIMITS.ogWidth} × ${LIMITS.ogHeight}).`
        : 'Set, size unknown.',
    fix: meta.image ? undefined : 'Use a 1200×630 crop of the cover/key visual (not the 250×351 poster).',
  });
  add({
    id: 'image-alt',
    label: 'Image alt text',
    status: !meta.image ? 'warn' : meta.imageAlt ? 'pass' : 'warn',
    message: meta.imageAlt ? 'Present.' : 'Add og:image:alt for accessibility.',
  });

  // structured data
  add({
    id: 'json-ld',
    label: 'Structured data',
    status: meta.jsonLd?.length ? 'pass' : 'warn',
    message: meta.jsonLd?.length ? meta.jsonLd.map((j) => j['@type']).join(', ') : 'No JSON-LD — eligible rich results (video, rating, breadcrumbs) are missed.',
    fix: meta.jsonLd?.length ? undefined : 'Add videoJsonLd / personJsonLd / comicSeriesJsonLd + breadcrumbJsonLd.',
  });

  // hreflang
  if (meta.alternates?.length) {
    const hasDefault = meta.alternates.some((a) => a.hrefLang === 'x-default');
    add({ id: 'hreflang', label: 'hreflang', status: hasDefault ? 'pass' : 'warn', message: hasDefault ? `${meta.alternates.length} languages incl. x-default.` : 'Add an x-default alternate.' });
  }

  // robots
  add({
    id: 'robots',
    label: 'Indexing',
    status: meta.noindex ? 'warn' : 'pass',
    message: meta.noindex ? 'Page is set to noindex — it will not appear in search.' : 'Indexable.',
  });

  // headings
  if (extra.h1Count !== undefined) {
    add({
      id: 'h1',
      label: 'H1 heading',
      status: extra.h1Count === 1 ? 'pass' : extra.h1Count === 0 ? 'fail' : 'warn',
      message: `${extra.h1Count} <h1> on the page (should be exactly 1).`,
    });
  }

  const points = checks.reduce((n, c) => n + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  const score = Math.round((points / checks.length) * 100);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : 'D';
  return { score, grade, checks };
}
