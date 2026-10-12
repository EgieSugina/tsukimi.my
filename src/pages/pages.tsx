import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { fadeUp, staggerContainer } from '../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../tokens/tokens.stylex';
import { bp } from '../tokens/breakpoints.stylex';
import { AppShell } from '../components/AppShell/AppShell';
import { Badge } from '../components/Badge/Badge';
import { Button } from '../components/Button/Button';
import { CastPolaroid } from '../components/CastPolaroid/CastPolaroid';
import { CastRosterCard } from '../components/CastRosterCard/CastRosterCard';
import { CategoryTile } from '../components/CategoryTile/CategoryTile';
import { Chip } from '../components/Chip/Chip';
import { FilterDropdown } from '../components/FilterDropdown/FilterDropdown';
import { Icon, type IconName } from '../components/Icon/Icon';
import { SearchField } from '../components/SearchField/SearchField';
import { SectionHeader } from '../components/SectionHeader/SectionHeader';
import { StatPill } from '../components/StatPill/StatPill';
import { VideoCard } from '../components/VideoCard/VideoCard';
import { VideoPoster } from '../components/VideoPoster/VideoPoster';
import { airingNow, airingSchedule, anime, animeSeasons, castRoster, categories, comics, genres, mangaChapters, mangaPages, manhwaPages, popularCast, sampleVideo, videos } from '../mocks/data';
import { AnimeCard } from '../components/AnimeCard/AnimeCard';
import { AiringCalendar } from '../components/AiringCalendar/AiringCalendar';
import { EpisodeList, type Episode } from '../components/EpisodeList/EpisodeList';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { ComicCard, type ComicFormat } from '../components/ComicCard/ComicCard';
import { ChapterList } from '../components/ChapterList/ChapterList';
import { ComicReader } from '../components/ComicReader/ComicReader';
import { MediaFrame } from '../components/MediaFrame/MediaFrame';
import { Seo } from '../seo/Seo';
import { seoPresets } from '../mocks/seo';

/* ---------- shared page pieces ---------- */

function HeaderCard({ icon, title, subtitle, aside }: { icon: IconName; title: string; subtitle?: string; aside?: ReactNode }) {
  return (
    <div {...stylex.props(s.panel, s.header)}>
      <Icon name={icon} size={24} xstyle={s.pink} />
      <h1 {...stylex.props(s.h1)}>{title}</h1>
      {subtitle && <span {...stylex.props(s.subtitle)}>{subtitle}</span>}
      <span {...stylex.props(s.grow)} />
      {aside}
    </div>
  );
}

function CountPill({ children }: { children: ReactNode }) {
  return <span {...stylex.props(s.countPill)}>{children}</span>;
}

function FilterBar({ filters }: { filters: { icon: IconName; options: string[] }[] }) {
  return (
    <div {...stylex.props(s.panelGlass, s.filterBar)}>
      <SearchField />
      {filters.map((f, i) => (
        <FilterDropdown key={f.options[0]} icon={f.icon} options={f.options} highlighted={i === filters.length - 1} xstyle={s.flex1} />
      ))}
    </div>
  );
}

/* ---------- pages ---------- */

export function HomePage() {
  const [genre, setGenre] = useState('All');
  const [cat, setCat] = useState(0);
  return (
    <AppShell topBar={{ activeNav: 'home' }}>
      <Seo {...seoPresets.home} />
      <section {...stylex.props(s.hero)}>
        <motion.div variants={staggerContainer(0.08, 0.15)} initial="hidden" animate="show" {...stylex.props(s.heroContent)}>
          <motion.span variants={fadeUp} {...stylex.props(s.tagline)}>
            <Icon name="sparkles" size={12} xstyle={s.pink} />
            Tonight’s featured premiere — new episode every Friday
            <Icon name="sparkles" size={12} xstyle={s.pink} />
          </motion.span>
          <motion.h1 variants={fadeUp} {...stylex.props(s.heroTitle)}>
            <span {...stylex.props(s.titleBlue)}>Blue Sky</span> <span {...stylex.props(s.titleRose)}>Refrain</span>
          </motion.h1>
          <motion.span variants={fadeUp} {...stylex.props(s.heroSub)}>~ The Shangri-La We Dreamed Of ~</motion.span>
          <motion.span variants={fadeUp} {...stylex.props(s.genrePill)}>Pure Love × Drama × Slice of Life</motion.span>
          <motion.div variants={fadeUp} {...stylex.props(s.row, s.wrap)}>
            <StatPill tone="amber">★ 4.9</StatPill>
            <StatPill tone="rose">12 EPISODES</StatPill>
            <StatPill tone="indigo">FULL HD</StatPill>
            <StatPill tone="slate">2026</StatPill>
          </motion.div>
          <motion.div variants={fadeUp} {...stylex.props(s.row, s.ctas)}>
            <Button icon="play">Watch Episode 1</Button>
            <Button variant="secondary" icon="heart">Add to Favorites</Button>
          </motion.div>
        </motion.div>
        <div {...stylex.props(s.heroPosters)}>
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 10 }}
            animate={{ opacity: 1, y: [0, -8, 0], rotate: 4 }}
            transition={{ opacity: { duration: 0.5, delay: 0.3 }, rotate: { duration: 0.6, delay: 0.3 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 } }}
            {...stylex.props(s.tiltA)}
          >
            <VideoPoster coverOnly title="Blue Sky Refrain — Ep 1" cast="Misaki Sakurai" views="2.4M" duration="48:02" rank="#1 Trending" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -12 }}
            animate={{ opacity: 1, y: [0, 8, 0], rotate: -5 }}
            transition={{ opacity: { duration: 0.5, delay: 0.45 }, rotate: { duration: 0.6, delay: 0.45 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
            {...stylex.props(s.tiltB)}
          >
            <VideoPoster coverOnly title="Summer Festival Night" cast="Aoi Kiryu" views="1.9M" duration="44:30" />
          </motion.div>
        </div>
      </section>

      <div {...stylex.props(s.row, s.wrap)}>
        {genres.map((g) => (
          <Chip key={g} label={g} icon="tag" active={g === genre} onClick={() => setGenre(g)} />
        ))}
      </div>

      <SectionHeader overline="Popular actress" title="Most-watched cast this week" icon="crown" linkLabel="All cast" />
      <div {...stylex.props(s.spread, s.tapeRoom)}>
        {popularCast.map((c, i) => (
          <CastPolaroid key={c.name} name={c.name} subtitle={c.subtitle} rank={`#${i + 1}`} />
        ))}
      </div>

      <SectionHeader overline="Trending now" title="Top videos today" icon="flame" />
      <div {...stylex.props(s.spread)}>
        {videos.slice(0, 5).map((v, i) => (
          <VideoPoster key={v.title} title={v.title} cast={v.cast} views={v.views} duration={v.duration} rank={i < 3 ? `#${i + 1} Trending` : undefined} />
        ))}
      </div>

      <SectionHeader overline="Categories" title="Browse by category" icon="grid" />
      <div {...stylex.props(s.row, s.gap20)}>
        {categories.map((c, i) => (
          <CategoryTile key={c.title} {...c} active={i === cat} onClick={() => setCat(i)} />
        ))}
      </div>

      <SectionHeader overline="New releases" title="Fresh episodes this week" icon="calendar" />
      <div {...stylex.props(s.grid3)}>
        {videos.slice(5, 8).map((v) => (
          <VideoCard key={v.title} {...v} xstyle={s.fillCard} />
        ))}
      </div>
    </AppShell>
  );
}

export function VideoLibraryPage() {
  const [selected, setSelected] = useState(6);
  return (
    <AppShell topBar={{ activeNav: 'videos' }}>
      <Seo {...seoPresets.videoLibrary} />
      <HeaderCard icon="film" title="Video Library" subtitle="Browse every title, series & episode" aside={<CountPill>Total Videos: 12,480</CountPill>} />
      <FilterBar
        filters={[
          { icon: 'tag', options: ['All Genres', ...genres.slice(1)] },
          { icon: 'grid', options: ['All Categories', ...categories.map((c) => c.title)] },
          { icon: 'user', options: ['All Cast', ...popularCast.map((c) => c.name)] },
          { icon: 'sparkles', options: ['All Quality', 'Full HD', '4K'] },
          { icon: 'flame', options: ['Sort: Most Viewed', 'Sort: Newest', 'Sort: Top Rated'] },
        ]}
      />
      <div {...stylex.props(s.grid3)}>
        {videos.slice(0, 9).map((v, i) => (
          <VideoCard key={v.title} {...v} selected={i === selected} onPlay={() => setSelected(i)} xstyle={s.fillCard} />
        ))}
      </div>
    </AppShell>
  );
}

export function CastDirectoryPage() {
  return (
    <AppShell topBar={{ activeNav: 'cast' }}>
      <Seo {...seoPresets.castDirectory} />
      <HeaderCard
        icon="user"
        title="Registered Cast (356 persons)"
        subtitle="Profiles, rankings & filmography"
        aside={<Button variant="danger" size="sm" icon="crown">Sort: Most Popular</Button>}
      />
      <FilterBar
        filters={[
          { icon: 'crown', options: ['All Ranks', 'Top 10', 'Top 50'] },
          { icon: 'tag', options: ['All Genres', ...genres.slice(1)] },
          { icon: 'grid', options: ['All Agencies', 'Tsukimi Agency', 'Independent'] },
          { icon: 'sparkles', options: ['Status: Active', 'Status: Hiatus', 'Status: All'] },
        ]}
      />
      <div {...stylex.props(s.grid2)}>
        {castRoster.map((c) => (
          <CastRosterCard key={c.castId} {...c} xstyle={s.fillCard} />
        ))}
      </div>
    </AppShell>
  );
}

export function CategoriesPage() {
  const [cat, setCat] = useState(0);
  const [tab, setTab] = useState(1);
  const subTabs: [IconName, string][] = [
    ['calendar', 'School Life (10)'],
    ['heart', 'Romance (7)'],
    ['star', 'Seasonal Specials (14)'],
  ];
  return (
    <AppShell topBar={{ activeNav: 'categories' }}>
      <div {...stylex.props(s.panel, s.header, s.tight)}>
        <span {...stylex.props(s.strip, s.stripAmber)}>
          <Icon name="film" size={16} xstyle={s.amber} />
          Titles: <b {...stylex.props(s.monoBig)}>2,140</b>
        </span>
        <span {...stylex.props(s.strip)}>
          <Icon name="tag" size={16} />
          Genres in category: <b {...stylex.props(s.monoBig)}>7</b>
          <span {...stylex.props(s.mono)}>/ 31 total</span>
        </span>
        <span {...stylex.props(s.grow)} />
        <Badge tone="indigo" icon="sparkles" size="md">Full HD: 1,820 titles</Badge>
        <Badge tone="pink" icon="crown" size="md">4K: 320 titles</Badge>
        <Badge tone="green" icon="calendar" size="md">New this week: 24 titles</Badge>
      </div>
      <div {...stylex.props(s.row, s.gap12)}>
        {categories.map((c, i) => (
          <CategoryTile key={c.title} {...c} active={i === cat} onClick={() => setCat(i)} />
        ))}
      </div>
      <div role="tablist" {...stylex.props(s.segment)}>
        {subTabs.map(([ic, l], i) => (
          <button key={l} type="button" role="tab" aria-selected={i === tab} onClick={() => setTab(i)} {...stylex.props(s.segTab, i === tab && s.segActive)}>
            <Icon name={ic} size={15} />
            {l}
          </button>
        ))}
      </div>
      <div {...stylex.props(s.panel, s.header, s.tight)}>
        <Icon name="sparkles" size={16} xstyle={s.pink} />
        <strong>Romance — pure love & heartfelt stories</strong>
        <span {...stylex.props(s.grow)} />
        <CountPill>Showing: 10 / 248 titles</CountPill>
      </div>
      <div {...stylex.props(s.spread, s.wrap, s.rowGap)}>
        {videos.map((v, i) => (
          <VideoPoster key={v.title} title={v.title} cast={v.cast} views={v.views} duration={v.duration} rank={i < 3 ? `#${i + 1} in Romance` : undefined} />
        ))}
      </div>
    </AppShell>
  );
}

export function ComicsPage() {
  const [format, setFormat] = useState<'all' | ComicFormat>('all');
  const [genre, setGenre] = useState('All');
  const list = comics.filter((c) => format === 'all' || c.format === format);
  const formats: ['all' | ComicFormat, IconName, string][] = [
    ['all', 'grid', `All (${comics.length})`],
    ['manga', 'book', `Manga (${comics.filter((c) => c.format === 'manga').length})`],
    ['manhwa', 'rows', `Manhwa (${comics.filter((c) => c.format === 'manhwa').length})`],
    ['manhua', 'columns', `Manhua (${comics.filter((c) => c.format === 'manhua').length})`],
  ];
  return (
    <AppShell topBar={{ activeNav: 'comics' }}>
      <Seo {...seoPresets.comics} />
      <HeaderCard icon="book" title="Comics" subtitle="Manga, manhwa & manhua — updated daily" aside={<CountPill>Titles: 3,862</CountPill>} />
      <div role="tablist" {...stylex.props(s.segment)}>
        {formats.map(([v, ic, l]) => (
          <button key={v} type="button" role="tab" aria-selected={v === format} onClick={() => setFormat(v)} {...stylex.props(s.segTab, v === format && s.segActive)}>
            <Icon name={ic} size={15} />
            {l}
          </button>
        ))}
      </div>
      <div {...stylex.props(s.row, s.wrap)}>
        {genres.map((g) => (
          <Chip key={g} label={g} icon="tag" active={g === genre} onClick={() => setGenre(g)} />
        ))}
      </div>
      <SectionHeader overline="Latest updates" title="New chapters today" icon="calendar" />
      <div {...stylex.props(s.spread, s.wrap, s.rowGap)}>
        {list.filter((c) => c.updatedAt).slice(0, 5).map((c) => (
          <ComicCard key={c.title} {...c} />
        ))}
      </div>
      <SectionHeader overline="Popular series" title="Most-read this week" icon="flame" />
      <div {...stylex.props(s.spread, s.wrap, s.rowGap)}>
        {list.map((c) => (
          <ComicCard key={c.title} {...c} />
        ))}
      </div>
    </AppShell>
  );
}

export function ComicDetailPage({ onRead }: { onRead?: (chapterId: string) => void }) {
  const comic = comics[0];
  const lastRead = mangaChapters.find((c) => c.read)!;
  const first = mangaChapters[mangaChapters.length - 1];
  return (
    <AppShell topBar={{ activeNav: 'comics' }}>
      <Seo {...seoPresets.comicSeries} />
      <section {...stylex.props(s.panel, s.detail)}>
        <MediaFrame src={comic.coverSrc} alt={comic.title} xstyle={s.detailCover}>
          <Badge tone="solidRed" xstyle={s.abs10}>MANGA</Badge>
        </MediaFrame>
        <div {...stylex.props(s.detailInfo)}>
          <div {...stylex.props(s.row)}>
            <Badge tone="orange" icon="flame">ONGOING</Badge>
            <Badge tone="gradient" icon="crown">#1 Manga</Badge>
            <Badge tone="neutral">Updated every Friday</Badge>
          </div>
          <h1 {...stylex.props(s.detailTitle)}>{comic.title}</h1>
          <span {...stylex.props(s.heroSub)}>~ The Shangri-La We Dreamed Of ~</span>
          <span {...stylex.props(s.subtitle)}>
            by <b {...stylex.props(s.accentText)}>{comic.author}</b> · Story & Art
          </span>
          <div {...stylex.props(s.row, s.wrap)}>
            <StatPill tone="amber">★ {comic.rating}</StatPill>
            <StatPill tone="rose">42 CHAPTERS</StatPill>
            <StatPill tone="indigo">1.2M READS</StatPill>
            <StatPill tone="slate">84K FOLLOWERS</StatPill>
          </div>
          <div {...stylex.props(s.synopsis)}>
            <Icon name="sparkles" size={14} xstyle={s.amber} />
            <p {...stylex.props(s.synopsisText)}>
              Under the clear early-summer sky, a boy and the childhood friend he promised to protect spin an irreplaceable page
              of youth — one chapter at a time.
            </p>
          </div>
          <div {...stylex.props(s.row, s.wrap)}>
            {['Romance', 'Drama', 'School Life', 'Slice of Life'].map((g) => (
              <Chip key={g} label={g} icon="tag" />
            ))}
          </div>
          <div {...stylex.props(s.row, s.ctas)}>
            <Button icon="book" onClick={() => onRead?.(`ch-${Number(lastRead.number) + 1}`)}>Continue Ch. {Number(lastRead.number) + 1}</Button>
            <Button variant="secondary" icon="list" onClick={() => onRead?.(first.id)}>Read from Ch. 1</Button>
            <Button variant="outline" icon="heart">Follow</Button>
          </div>
        </div>
      </section>
      <div {...stylex.props(s.detailBottom)}>
        <ChapterList chapters={mangaChapters} currentId={`ch-${Number(lastRead.number) + 1}`} onSelect={(c) => onRead?.(c.id)} xstyle={s.flex2} />
        <section {...stylex.props(s.panel, s.side)}>
          <SectionHeader overline="You may also like" title="Similar series" icon="sparkles" linkLabel="" />
          <div {...stylex.props(s.spread, s.wrap, s.rowGap)}>
            {comics.slice(1, 3).map((c) => (
              <ComicCard key={c.title} {...c} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function ComicReaderPage({ format = 'manga' }: { format?: ComicFormat }) {
  const [chapterId, setChapterId] = useState('ch-38');
  const comic = format === 'manga' ? comics[0] : comics[1];
  return (
    <>
    <Seo {...seoPresets.comicChapter} />
    <ComicReader
      comicTitle={comic.title}
      format={format}
      chapters={mangaChapters}
      currentChapterId={chapterId}
      onChapterChange={setChapterId}
      pages={format === 'manga' ? mangaPages : manhwaPages}
    />
    </>
  );
}

export function AnimePage() {
  const [season, setSeason] = useState('Fall');
  const [year, setYear] = useState(2026);
  const [kind, setKind] = useState('All');
  const list = anime.filter((a) => (kind === 'All' || a.kind === kind) && a.season === `${season} ${year}`);
  return (
    <AppShell topBar={{ activeNav: 'anime' }}>
      <Seo {...seoPresets.anime} />
      <HeaderCard
        icon="tv"
        title="Anime"
        subtitle="Seasonal anime with SUB & DUB — new episodes every day"
        aside={<CountPill>{season} {year}: {list.length} titles</CountPill>}
      />
      <div {...stylex.props(s.panel, s.header, s.tight)}>
        <Icon name="calendar" size={16} xstyle={s.pink} />
        <strong>Season</strong>
        <div {...stylex.props(s.row)}>
          {['Winter', 'Spring', 'Summer', 'Fall'].map((x) => (
            <Chip key={x} label={x} active={x === season} onClick={() => setSeason(x)} />
          ))}
        </div>
        <span {...stylex.props(s.grow)} />
        <Button variant="soft" size="sm" icon="chevronLeft" onClick={() => setYear((y) => y - 1)}>
          {year - 1}
        </Button>
        <span {...stylex.props(s.monoBig)}>{year}</span>
        <Button variant="soft" size="sm" icon="chevronRight" onClick={() => setYear((y) => y + 1)}>
          {year + 1}
        </Button>
      </div>
      <div role="tablist" {...stylex.props(s.segment)}>
        {(['All', 'TV', 'Movie', 'OVA', 'ONA'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={k === kind} onClick={() => setKind(k)} {...stylex.props(s.segTab, k === kind && s.segActive)}>
            {k}
          </button>
        ))}
      </div>
      <SectionHeader overline={`${season} ${year}`} title="Airing this season" icon="flame" />
      <div {...stylex.props(s.spread, s.wrap, s.rowGap)}>
        {list.length ? list.map((a) => <AnimeCard key={a.title} {...a} />) : <span {...stylex.props(s.subtitle)}>No titles for this filter yet.</span>}
      </div>
      <AiringCalendar entries={airingSchedule} now={airingNow} initialDate={airingNow} timeZone="Asia/Tokyo" />
      <SectionHeader overline="Completed" title="Binge-worthy finished series" icon="check" />
      <div {...stylex.props(s.spread, s.wrap, s.rowGap)}>
        {anime.filter((a) => a.status === 'finished').map((a) => (
          <AnimeCard key={a.title} {...a} />
        ))}
      </div>
    </AppShell>
  );
}

export function AnimeDetailPage({ onWatch }: { onWatch?: (episodeId: string) => void }) {
  const a = anime[0];
  return (
    <AppShell topBar={{ activeNav: 'anime' }}>
      <Seo {...seoPresets.animeSeries} />
      <section {...stylex.props(s.panel, s.detail)}>
        <MediaFrame src={a.coverSrc} alt={a.title} xstyle={s.detailCover}>
          <Badge tone="solidIndigo" xstyle={s.abs10}>TV</Badge>
        </MediaFrame>
        <div {...stylex.props(s.detailInfo)}>
          <div {...stylex.props(s.row)}>
            <Badge tone="orange" icon="flame">AIRING</Badge>
            <Badge tone="gradient" icon="crown">{a.rank}</Badge>
            <Badge tone="dark">SUB</Badge>
            <Badge tone="solidPink">DUB</Badge>
          </div>
          <h1 {...stylex.props(s.detailTitle)}>{a.title}</h1>
          <span {...stylex.props(s.heroSub)}>~ The Shangri-La We Dreamed Of ~</span>
          <span {...stylex.props(s.subtitle)}>
            Studio <b {...stylex.props(s.accentText)}>{a.studio}</b> · 2 seasons · 1 movie
          </span>
          <div {...stylex.props(s.row, s.wrap)}>
            <StatPill tone="amber">★ {a.rating}</StatPill>
            <StatPill tone="rose">S2 EP 7 / 12</StatPill>
            <StatPill tone="indigo">FALL 2026</StatPill>
            <StatPill tone="green">NEXT: SAT 23:30</StatPill>
          </div>
          <div {...stylex.props(s.synopsis)}>
            <Icon name="sparkles" size={14} xstyle={s.amber} />
            <p {...stylex.props(s.synopsisText)}>
              Under the clear early-summer sky, a promise made years ago starts to change everything for Misaki and her friends.
              Season 2 follows their last summer before graduation.
            </p>
          </div>
          <div {...stylex.props(s.row, s.wrap)}>
            {['Romance', 'Drama', 'School Life', 'Slice of Life'].map((g) => (
              <Chip key={g} label={g} icon="tag" />
            ))}
          </div>
          <div {...stylex.props(s.row, s.ctas)}>
            <Button icon="play" onClick={() => onWatch?.('s2-ep-3')}>Continue S2 EP 3</Button>
            <Button variant="secondary" icon="tv" onClick={() => onWatch?.('s1-ep-1')}>Watch from S1 EP 1</Button>
            <Button variant="outline" icon="bell">Notify new episodes</Button>
          </div>
        </div>
      </section>
      <div {...stylex.props(s.detailBottom)}>
        <EpisodeList seasons={animeSeasons} initialSeasonId="s2" currentEpisodeId="s2-ep-3" onSelect={(e) => onWatch?.(e.id)} xstyle={s.flex2} />
        <section {...stylex.props(s.panel, s.side)}>
          <SectionHeader overline="Same studio" title="You may also like" icon="sparkles" linkLabel="" />
          <div {...stylex.props(s.spread, s.wrap, s.rowGap)}>
            {anime.slice(1, 3).map((x) => (
              <AnimeCard key={x.title} {...x} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function WatchPage() {
  const all = animeSeasons.flatMap((season) => season.episodes.map((e) => ({ e, season })));
  const [current, setCurrent] = useState('s2-ep-3');
  const [audio, setAudio] = useState('SUB');
  const [theater, setTheater] = useState(false);
  const idx = all.findIndex((x) => x.e.id === current);
  const { e: ep, season } = all[idx];
  const next = all[idx + 1] && !all[idx + 1].e.upcoming ? all[idx + 1] : undefined;
  const select = (e: Episode) => setCurrent(e.id);

  const player = (
    <VideoPlayer
      key={current + audio}
      {...sampleVideo}
      sources={audio === 'DUB' ? [...sampleVideo.sources].reverse() : sampleVideo.sources}
      title="Blue Sky Refrain"
      subtitle={`${season.label} · EP ${ep.number} — ${ep.title}`}
      audioOptions={ep.dub ? ['SUB', 'DUB'] : undefined}
      audio={audio}
      onAudioChange={setAudio}
      nextEpisode={next ? { label: `${next.season.label} EP ${next.e.number}`, title: next.e.title } : undefined}
      onNext={() => next && setCurrent(next.e.id)}
      onTheaterChange={setTheater}
    />
  );

  return (
    <AppShell topBar={{ activeNav: 'anime' }} hideSidebar>
      <Seo {...seoPresets.animeEpisode} />
      {theater && player}
      <div {...stylex.props(s.watch)}>
        <div {...stylex.props(s.watchMain)}>
          {!theater && player}
          <div {...stylex.props(s.panel, s.watchInfo)}>
            <div {...stylex.props(s.row)}>
              <Badge tone="solidIndigo">{season.label}</Badge>
              <Badge tone="dark">EP {ep.number}</Badge>
              {ep.dub && <Badge tone="solidPink">DUB available</Badge>}
              {ep.filler && <Badge tone="amber">FILLER</Badge>}
            </div>
            <h1 {...stylex.props(s.h1)}>
              Blue Sky Refrain — EP {ep.number}: {ep.title}
            </h1>
            <span {...stylex.props(s.subtitle)}>
              Aired {ep.airDate} · {ep.duration} · Aoharu Studio
            </span>
            <p {...stylex.props(s.synopsisText)}>{ep.synopsis}</p>
            <div {...stylex.props(s.row, s.wrap)}>
              <Button variant="outline" size="sm" icon="heart">Add to list</Button>
              <Button variant="soft" size="sm" icon="chevronLeft" disabled={idx === 0} onClick={() => setCurrent(all[idx - 1].e.id)}>
                Previous
              </Button>
              <Button variant="soft" size="sm" icon="chevronRight" disabled={!next} onClick={() => next && setCurrent(next.e.id)}>
                Next
              </Button>
            </div>
          </div>
        </div>
        <EpisodeList seasons={animeSeasons} currentEpisodeId={current} onSelect={select} variant="compact" maxHeight={720} xstyle={s.watchSide} />
      </div>
    </AppShell>
  );
}

const s = stylex.create({
  grow: { flexGrow: 1 },
  flex1: { flexGrow: 1, flexBasis: 0, minWidth: 180 },
  pink: { color: colors.pink },
  amber: { color: colors.amber },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  // category tile rows stack on phones
  gap12: { gap: 12, flexDirection: { default: 'row', [bp.mobile]: 'column' }, alignItems: { default: 'center', [bp.mobile]: 'stretch' } },
  gap20: { gap: 20, flexDirection: { default: 'row', [bp.mobile]: 'column' }, alignItems: { default: 'center', [bp.mobile]: 'stretch' } },
  rowGap: { rowGap: 28 },
  ctas: { gap: 12, paddingTop: 6, flexWrap: 'wrap' },
  // rows of posters: wrap on desktop, horizontal swipe carousel on phones
  spread: {
    display: 'flex',
    flexWrap: { default: 'wrap', [bp.mobile]: 'nowrap' },
    justifyContent: { default: 'space-between', [bp.mobile]: 'flex-start' },
    gap: { default: 24, [bp.mobile]: 12 },
    overflowX: { default: 'visible', [bp.mobile]: 'auto' },
    scrollSnapType: { default: 'none', [bp.mobile]: 'x mandatory' },
    marginInline: { default: 0, [bp.mobile]: -12 },
    paddingInline: { default: 0, [bp.mobile]: 12 },
    paddingBottom: { default: 0, [bp.mobile]: 6 },
  },
  tapeRoom: { paddingTop: 14 },
  grid3: { display: 'grid', gridTemplateColumns: { default: 'repeat(auto-fill, minmax(470px, 1fr))', [bp.mobile]: 'minmax(0, 1fr)' }, gap: { default: 24, [bp.mobile]: 12 } },
  grid2: { display: 'grid', gridTemplateColumns: { default: 'repeat(auto-fill, minmax(720px, 1fr))', [bp.belowLaptop]: 'minmax(0, 1fr)' }, gap: { default: 24, [bp.mobile]: 12 } },
  fillCard: { width: '100%' },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
  },
  panelGlass: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceGlass,
  },
  header: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { default: 14, [bp.mobile]: 10 }, paddingBlock: { default: 16, [bp.mobile]: 12 }, paddingInlineStart: { default: 22, [bp.mobile]: 14 }, paddingInlineEnd: { default: 18, [bp.mobile]: 14 }, fontFamily: fonts.body },
  tight: { gap: 12, paddingBlock: 10, paddingInline: 16 },
  h1: { margin: 0, fontFamily: fonts.body, fontSize: { default: 24, [bp.mobile]: 19 }, fontWeight: 800, color: colors.textPrimary },
  subtitle: { fontSize: { default: 15, [bp.mobile]: 13 }, fontWeight: 500, color: colors.textSecondary },
  countPill: {
    paddingBlock: 8,
    paddingInline: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderPink,
    backgroundColor: colors.chipRose,
    color: colors.textAccent,
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  filterBar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingBlock: 14, paddingInline: 16 },
  hero: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    minHeight: { default: 400, [bp.belowLaptop]: 0 },
    overflow: 'hidden',
    borderRadius: { default: 22, [bp.mobile]: 16 },
    // Swap the first layer for the key visual: url(...) center / cover
    backgroundImage: gradients.hero,
    fontFamily: fonts.body,
  },
  heroContent: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: { default: 14, [bp.mobile]: 10 }, paddingBlock: { default: 44, [bp.mobile]: 24 }, paddingInline: { default: 56, [bp.tablet]: 32, [bp.mobile]: 18 } },
  tagline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 6,
    paddingInline: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderPink,
    backgroundColor: colors.surfaceStrong,
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textPrimary,
  },
  heroTitle: { margin: 0, fontFamily: fonts.display, fontSize: { default: 64, [bp.tablet]: 52, [bp.mobile]: 38 }, fontWeight: 700, lineHeight: 1.1 },
  titleBlue: { backgroundImage: gradients.titleBlue, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' },
  titleRose: { backgroundImage: gradients.titleRose, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' },
  heroSub: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: { default: 18, [bp.mobile]: 14 }, letterSpacing: '0.04em', color: colors.textPrimary },
  genrePill: {
    paddingBlock: 6,
    paddingInline: 16,
    borderRadius: radius.pill,
    backgroundImage: 'linear-gradient(90deg, #be123c, #e11d48, #4f46e5)',
    color: colors.textOnDark,
    fontSize: 13,
    fontWeight: 700,
  },
  heroPosters: { display: { default: 'block', [bp.belowLaptop]: 'none' }, position: 'relative', width: 440, flexShrink: 0 },
  tiltA: { position: 'absolute', top: 18, left: 0 },
  tiltB: { position: 'absolute', top: 30, left: 175 },
  strip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 8,
    paddingInline: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    fontSize: 16,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  stripAmber: { backgroundColor: colors.chipAmber },
  monoBig: { fontFamily: fonts.mono, fontSize: 18, color: colors.textAccent },
  mono: { fontFamily: fonts.mono, fontSize: 16, color: colors.textSecondary },
  segment: {
    display: 'flex',
    overflowX: 'auto',
    gap: 6,
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
  },
  segTab: {
    flexGrow: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 0,
    paddingBlock: { default: 11, [bp.mobile]: 9 },
    paddingInline: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: { default: 16, [bp.mobile]: 13 },
    fontWeight: 700,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  segActive: { backgroundColor: colors.surfaceStrong, borderColor: colors.pink, color: colors.textAccent },
  accentText: { color: colors.textAccent },
  watch: { display: 'flex', flexDirection: { default: 'row', [bp.belowLaptop]: 'column' }, alignItems: { default: 'flex-start', [bp.belowLaptop]: 'stretch' }, gap: { default: 24, [bp.mobile]: 14 } },
  watchMain: { display: 'flex', flexDirection: 'column', gap: 16, flexGrow: 1, minWidth: 0 },
  watchInfo: { display: 'flex', flexDirection: 'column', gap: 10, padding: { default: 20, [bp.mobile]: 14 } },
  watchSide: { width: { default: 400, [bp.belowLaptop]: '100%' }, flexShrink: 0 },
  abs10: { position: 'absolute', top: 10, left: 10 },
  flex2: { flexGrow: 2, flexBasis: { default: 0, [bp.belowLaptop]: 'auto' }, minWidth: 0 },
  detail: { display: 'flex', flexDirection: { default: 'row', [bp.mobile]: 'column' }, alignItems: { default: 'flex-start', [bp.mobile]: 'center' }, gap: { default: 32, [bp.tablet]: 20, [bp.mobile]: 18 }, padding: { default: 28, [bp.mobile]: 16 }, backgroundImage: gradients.panelSoft },
  detailCover: { borderRadius: radius.md, boxShadow: shadows.card },
  detailInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, minWidth: 0 },
  detailTitle: { margin: 0, fontFamily: fonts.display, fontSize: { default: 48, [bp.tablet]: 38, [bp.mobile]: 30 }, fontWeight: 700, lineHeight: 1.1, backgroundImage: gradients.logo, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' },
  synopsis: { display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: 760, paddingBlock: 10, paddingInline: 14, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'solid', borderColor: colors.chipAmber, backgroundColor: colors.chipAmber },
  synopsisText: { margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: colors.textPrimary },
  detailBottom: { display: 'flex', flexDirection: { default: 'row', [bp.belowLaptop]: 'column' }, alignItems: { default: 'flex-start', [bp.belowLaptop]: 'stretch' }, gap: 24 },
  side: { display: 'flex', flexDirection: 'column', gap: 16, flexGrow: 1, flexBasis: { default: 0, [bp.belowLaptop]: 'auto' }, minWidth: { default: 540, [bp.belowLaptop]: 0 }, padding: 18 },
});
