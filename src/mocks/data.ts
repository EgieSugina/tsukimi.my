import type { AnimeCardProps } from '../components/AnimeCard/AnimeCard';
import type { Season } from '../components/EpisodeList/EpisodeList';
import type { AiringEntry } from '../components/AiringCalendar/AiringCalendar';
import type { ComicCardProps } from '../components/ComicCard/ComicCard';
import type { Chapter } from '../components/ChapterList/ChapterList';
import type { ComicPage } from '../components/ComicReader/ComicReader';
import type { VideoCardProps } from '../components/VideoCard/VideoCard';
import type { CastRosterCardProps } from '../components/CastRosterCard/CastRosterCard';

/** Sample content only — replace with API data. Images are omitted, so placeholders show. */

export const genres = ['All', 'Romance', 'Drama', 'School Life', 'Comedy', 'Slice of Life', 'Idol', 'Fantasy', 'Mystery', 'Music', 'Seasonal', 'Exclusive'];

export const categories = [
  { title: 'Drama & Romance', description: 'Story-driven series, love stories & slice of life', icon: 'film' as const },
  { title: 'Variety & Music', description: 'Idol stages, live concerts & behind the scenes', icon: 'sparkles' as const },
  { title: 'Exclusive & Premium', description: 'Members-only specials, director’s cuts & 4K', icon: 'crown' as const },
];

export const popularCast = [
  { name: 'Misaki Sakurai', subtitle: '— 128 videos · 2.4M views —' },
  { name: 'Aoi Kiryu', subtitle: '— 96 videos · 1.9M views —' },
  { name: 'Ryoka Tachibana', subtitle: '— 74 videos · 1.5M views —' },
  { name: 'Hinano Momoi', subtitle: '— 63 videos · 1.2M views —' },
  { name: 'Rin Shirase', subtitle: '— 51 videos · 980K views —' },
];

type V = Pick<VideoCardProps, 'title' | 'cast' | 'views' | 'subtitle' | 'duration' | 'tag'>;
const base: V[] = [
  { title: 'Summer Rooftop Confession', cast: 'Misaki Sakurai', views: '1.2M', subtitle: 'Drama · Season 1 · Ep 3', duration: '24:18', tag: 'NEW' },
  { title: 'Night Festival Promise', cast: 'Aoi Kiryu', views: '982K', subtitle: 'Romance · Season 2 · Ep 1', duration: '31:40', tag: 'HOT' },
  { title: 'Aquarium Date', cast: 'Misaki Sakurai', views: '876K', subtitle: 'Slice of Life · Special', duration: '18:05', tag: 'NEW' },
  { title: 'Ferris Wheel at Dusk', cast: 'Hinano Momoi', views: '743K', subtitle: 'Romance · Movie', duration: '1:42:10', tag: '4K' },
  { title: 'Seaside Sunset Letter', cast: 'Ryoka Tachibana', views: '701K', subtitle: 'Drama · Season 1 · Ep 7', duration: '27:55', tag: 'HOT' },
  { title: 'Cherry Blossom Hill', cast: 'Rin Shirase', views: '655K', subtitle: 'School Life · Ep 2', duration: '22:30', tag: 'NEW' },
  { title: 'Convenience Store at 2AM', cast: 'Aoi Kiryu', views: '598K', subtitle: 'Comedy · Short', duration: '12:48', tag: 'FREE' },
  { title: 'Atelier of Colors', cast: 'Hinano Momoi', views: '540K', subtitle: 'Slice of Life · Ep 5', duration: '26:12', tag: 'NEW' },
  { title: 'Rainy Day Umbrella', cast: 'Ryoka Tachibana', views: '512K', subtitle: 'Drama · Ep 4', duration: '29:01', tag: 'HOT' },
  { title: 'Letters to Spring', cast: 'Misaki Sakurai', views: '498K', subtitle: 'Romance · Ep 1', duration: '21:44', tag: 'NEW' },
];

export const videos: VideoCardProps[] = base.map((v) => ({
  ...v,
  synopsis: 'After class on the school rooftop, two old friends finally say what they could not for years.',
  attributes: { views: '1,204,330', rating: '4.8 / 5', genre: v.subtitle.split(' · ')[0], released: '2026-10-01' },
}));

export const castRoster: CastRosterCardProps[] = [
  { name: 'Misaki Sakurai', videoCount: '128 videos', rankNo: 'No.1', castId: 'ID:cast_misaki', bio: 'Graceful lead of slice-of-life dramas, loved for her warm smile.' },
  { name: 'Aoi Kiryu', videoCount: '96 videos', rankNo: 'No.2', castId: 'ID:cast_aoi', bio: 'Cool-headed heroine of mystery and school series.' },
  { name: 'Ryoka Tachibana', videoCount: '74 videos', rankNo: 'No.3', castId: 'ID:cast_ryoka', bio: 'Elegant performer known for emotional drama roles.' },
  { name: 'Hinano Momoi', videoCount: '63 videos', rankNo: 'No.4', castId: 'ID:cast_hinano', bio: 'Energetic idol-turned-actress with a huge fan club.' },
  { name: 'Rin Shirase', videoCount: '51 videos', rankNo: 'No.5', castId: 'ID:cast_rin', bio: 'Rising star of seasonal romance specials.' },
  { name: 'Ashley Johnson', videoCount: '12 videos', rankNo: 'No.48', castId: 'ID:cast_ashley', bio: 'Currently on hiatus — returning next season.', status: 'hiatus' },
];

/* ---------- Comics (manga / manhwa) ---------- */

export const comics: Omit<ComicCardProps, 'onClick' | 'xstyle'>[] = [
  { title: 'Blue Sky Refrain', author: 'Aoharu Studio', format: 'manga', status: 'ongoing', latestChapter: 'Ch. 42', rating: '4.9', rank: '#1 Manga', updatedAt: 'Ch. 42 · 3h ago' },
  { title: 'Rooftop After School', author: 'Kiryu Aoi', format: 'manhwa', status: 'ongoing', latestChapter: 'Ch. 128', rating: '4.8', rank: '#1 Manhwa', updatedAt: 'Ch. 128 · 1d ago' },
  { title: 'Night Festival Promise', author: 'Momoi Hinano', format: 'manhwa', status: 'ongoing', latestChapter: 'Ch. 87', rating: '4.7', rank: '#2 Manhwa', updatedAt: 'Ch. 87 · 2d ago' },
  { title: 'Letters from the Seaside', author: 'Tachibana Ryoka', format: 'manga', status: 'completed', latestChapter: 'Ch. 64', rating: '4.9' },
  { title: 'Cherry Blossom Hill', author: 'Shirase Rin', format: 'manga', status: 'ongoing', latestChapter: 'Ch. 19', rating: '4.6', updatedAt: 'Ch. 19 · 5d ago' },
  { title: 'The Jade Garden Pavilion', author: 'Lin Yue', format: 'manhua', status: 'ongoing', latestChapter: 'Ch. 210', rating: '4.5' },
  { title: 'Atelier of Colors', author: 'Momoi Hinano', format: 'manhwa', status: 'hiatus', latestChapter: 'Ch. 56', rating: '4.4' },
  { title: 'Ferris Wheel at Dusk', author: 'Sakurai Misaki', format: 'manga', status: 'completed', latestChapter: 'Ch. 30', rating: '4.8' },
  { title: 'Convenience Store at 2AM', author: 'Kiryu Aoi', format: 'manhwa', status: 'ongoing', latestChapter: 'Ch. 12', rating: '4.3', updatedAt: 'Ch. 12 · 6h ago' },
  { title: 'Rainy Day Umbrella', author: 'Tachibana Ryoka', format: 'manga', status: 'ongoing', latestChapter: 'Ch. 8', rating: '4.5' },
];

const chapterTitles = ['Under the Clear Sky', 'The Promise', 'A Letter Never Sent', 'Summer Festival', 'Rooftop Confession', 'Rainy Season', 'The Aquarium', 'First Snow'];

/** Newest first. Chapters 1–37 read, 41–42 new, 42 VIP. */
export const mangaChapters: Chapter[] = Array.from({ length: 42 }, (_, i) => {
  const n = 42 - i;
  return {
    id: `ch-${n}`,
    number: String(n),
    title: chapterTitles[n % chapterTitles.length],
    date: n > 40 ? `${43 - n}d ago` : `2026-${String(1 + Math.floor((n - 1) / 4)).padStart(2, '0')}-${String(((n * 7) % 27) + 1).padStart(2, '0')}`,
    read: n <= 37,
    isNew: n >= 41,
    locked: n === 42,
  };
});

export const mangaPages: ComicPage[] = Array.from({ length: 18 }, () => ({ width: 720, height: 1024 }));
export const manhwaPages: ComicPage[] = Array.from({ length: 12 }, (_, i) => ({ width: 720, height: i % 3 === 0 ? 2000 : 1500 }));

/* ---------- Anime ---------- */
export const anime: Omit<AnimeCardProps, 'onClick' | 'xstyle'>[] = [
  { title: 'Blue Sky Refrain', season: 'Fall 2026', kind: 'TV', status: 'airing', episodesAired: 7, episodesTotal: 12, studio: 'Aoharu Studio', rating: '4.9', sub: true, dub: true, rank: '#1 This Season', nextAiring: 'EP 8 · Sat 23:30' },
  { title: 'Rooftop After School', season: 'Fall 2026', kind: 'TV', status: 'airing', episodesAired: 5, episodesTotal: 24, studio: 'Kiryu Pictures', rating: '4.8', sub: true, rank: '#2 This Season', nextAiring: 'EP 6 · Sun 01:00' },
  { title: 'Night Festival Promise', season: 'Fall 2026', kind: 'TV', status: 'airing', episodesAired: 6, episodesTotal: 13, studio: 'Momoi Works', rating: '4.7', sub: true, dub: true, nextAiring: 'EP 7 · Fri 22:00' },
  { title: 'Letters from the Seaside', season: 'Summer 2026', kind: 'TV', status: 'finished', episodesAired: 12, episodesTotal: 12, studio: 'Tachibana Anim.', rating: '4.9', sub: true, dub: true },
  { title: 'Ferris Wheel at Dusk — The Movie', season: 'Summer 2026', kind: 'Movie', status: 'finished', episodesAired: 1, episodesTotal: 1, studio: 'Aoharu Studio', rating: '4.8', sub: true },
  { title: 'Cherry Blossom Hill', season: 'Winter 2027', kind: 'TV', status: 'upcoming', episodesAired: 0, studio: 'Shirase Lab', sub: true },
  { title: 'Atelier of Colors OVA', season: 'Spring 2026', kind: 'OVA', status: 'finished', episodesAired: 2, episodesTotal: 2, studio: 'Momoi Works', rating: '4.5', sub: true },
  { title: 'Convenience Store at 2AM', season: 'Fall 2026', kind: 'ONA', status: 'airing', episodesAired: 9, studio: 'Kiryu Pictures', rating: '4.4', sub: true, nextAiring: 'EP 10 · Wed 18:00' },
];

const epTitles = ['Under the Clear Sky', 'The Promise', 'A Letter Never Sent', 'Summer Festival', 'Rooftop Confession', 'Rainy Season', 'The Aquarium', 'Fireworks', 'First Snow', 'Ferris Wheel', 'Graduation', 'Refrain'];

function makeSeason(id: string, label: string, period: string, total: number, aired: number, startDate: Date, watchedUntil = 0): Season {
  return {
    id,
    label,
    period,
    episodes: Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      const d = new Date(startDate.getTime() + i * 7 * 86_400_000);
      return {
        id: `${id}-ep-${n}`,
        number: n,
        title: epTitles[i % epTitles.length],
        duration: n === total ? '24:00' : '23:40',
        airDate: d.toISOString().slice(0, 10),
        synopsis: 'Under the clear early-summer sky, a promise made years ago starts to change everything for Misaki and her friends.',
        progress: n < watchedUntil ? 100 : n === watchedUntil ? 45 : 0,
        filler: id === 's1' && n === 9,
        recap: id === 's1' && n === 7,
        isNew: n === aired && aired < total,
        upcoming: n > aired,
        dub: n <= aired - 2,
      };
    }),
  };
}

export const animeSeasons: Season[] = [
  makeSeason('s1', 'Season 1', 'Spring 2025', 12, 12, new Date('2025-04-05'), 13),
  makeSeason('s2', 'Season 2', 'Fall 2026', 12, 7, new Date('2026-08-29'), 3),
  { id: 'movie', label: 'Movie', period: 'Summer 2026', episodes: [{ id: 'movie-1', number: 1, title: 'Ferris Wheel at Dusk', duration: '1:52:00', airDate: '2026-07-18', synopsis: 'The theatrical film set between seasons 1 and 2.' }] },
];

/** Week of 2026-10-12 (Mon) – used by the airing calendar stories (now = Wed 14 Oct 20:00 JST). */
export const airingNow = new Date('2026-10-14T20:00:00+09:00');
const air = (day: number, hhmm: string) => `2026-10-${String(12 + day).padStart(2, '0')}T${hhmm}:00+09:00`;
export const airingSchedule: AiringEntry[] = [
  { id: 'a1', title: 'Convenience Store at 2AM', episode: 9, airsAt: air(2, '18:00'), version: 'SUB' },
  { id: 'a2', title: 'Night Festival Promise', episode: 7, airsAt: air(4, '22:00'), version: 'SUB+DUB', followed: true },
  { id: 'a3', title: 'Blue Sky Refrain', episode: 8, airsAt: air(5, '23:30'), version: 'SUB+DUB', followed: true },
  { id: 'a4', title: 'Rooftop After School', episode: 6, airsAt: air(6, '01:00'), version: 'SUB', followed: true },
  { id: 'a5', title: 'Idol Stage Encore', episode: 12, airsAt: air(0, '21:00'), version: 'SUB', finale: true },
  { id: 'a6', title: 'Jade Garden Pavilion', episode: 1, airsAt: air(1, '19:30'), version: 'SUB', premiere: true },
  { id: 'a7', title: 'Moonlit Library', episode: 4, airsAt: air(2, '22:30'), version: 'SUB' },
  { id: 'a8', title: 'Summer Rooftop Diaries', episode: 10, airsAt: air(3, '00:30'), version: 'SUB' },
  { id: 'a9', title: 'Aquarium Days', episode: 3, airsAt: air(3, '23:00'), version: 'SUB', followed: true },
  { id: 'a10', title: 'Festival of Lanterns', episode: 6, airsAt: air(5, '17:00'), version: 'DUB' },
  { id: 'a11', title: 'Seaside Radio', episode: 2, airsAt: air(6, '20:00'), version: 'SUB' },
];

export const sampleVideo = {
  // Local 10-minute demo clip (public/sample). Swap for real CDN / HLS URLs per quality.
  sources: [
    { label: '1080p', src: '/sample/sample.mp4', type: 'video/mp4' },
    { label: '720p', src: '/sample/sample.mp4', type: 'video/mp4' },
    { label: '480p', src: '/sample/sample.mp4', type: 'video/mp4' },
  ],
  subtitles: [
    { label: 'English', srcLang: 'en', src: '/sample/subs-en.vtt', default: true },
    { label: 'Bahasa Indonesia', srcLang: 'id', src: '/sample/subs-id.vtt' },
  ],
  intro: { start: 9, end: 90 },
  outro: { start: 540, end: 596 },
  markers: [
    { time: 9, label: 'Opening' },
    { time: 90, label: 'Part A' },
    { time: 300, label: 'Part B' },
    { time: 540, label: 'Ending' },
  ],
};
