import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { spring } from '../../motion/motion';
import { colors, fonts, gradients, radius } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { ProgressBar } from '../ProgressBar/ProgressBar';

export interface Episode {
  id: string;
  /** Number within the season. */
  number: number;
  title: string;
  /** "24:00" */
  duration: string;
  airDate: string;
  synopsis?: string;
  thumbnailSrc?: string;
  /** 0–100 watched progress. */
  progress?: number;
  filler?: boolean;
  recap?: boolean;
  isNew?: boolean;
  /** Not aired yet (shows the air date instead of play). */
  upcoming?: boolean;
  dub?: boolean;
}

export interface Season {
  id: string;
  /** "Season 1", "Part 2", "Movie" */
  label: string;
  /** "Spring 2025" */
  period?: string;
  episodes: Episode[];
}

export interface EpisodeListProps {
  seasons: Season[];
  initialSeasonId?: string;
  currentEpisodeId?: string;
  onSelect?: (episode: Episode, season: Season) => void;
  /** `list` = rows with synopsis (detail page), `compact` = slim rows (watch-page sidebar). */
  variant?: 'list' | 'compact';
  maxHeight?: number;
  xstyle?: stylex.StyleXStyles;
}

/** Season tabs + episode rows with 16:9 thumbnail, progress, filler/recap/dub flags. */
export function EpisodeList({ seasons, initialSeasonId, currentEpisodeId, onSelect, variant = 'list', maxHeight = 640, xstyle }: EpisodeListProps) {
  const initial =
    initialSeasonId ?? seasons.find((s) => s.episodes.some((e) => e.id === currentEpisodeId))?.id ?? seasons[0]?.id;
  const [seasonId, setSeasonId] = useState(initial);
  const [hideFiller, setHideFiller] = useState(false);
  const season = seasons.find((s) => s.id === seasonId) ?? seasons[0];
  const episodes = season.episodes.filter((e) => !(hideFiller && e.filler));
  const compact = variant === 'compact';
  const uid = useId();

  return (
    <section {...stylex.props(styles.root, xstyle)}>
      <div role="tablist" aria-label="Seasons" {...stylex.props(styles.seasons)}>
        {seasons.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === season.id}
            onClick={() => setSeasonId(s.id)}
            {...stylex.props(styles.seasonTab, s.id === season.id && styles.seasonActive)}
          >
            {s.id === season.id && <motion.span layoutId={`season-${uid}`} transition={spring.layout} {...stylex.props(styles.seasonPill)} />}
            <span {...stylex.props(styles.rel)}>{s.label}</span>
            {s.period && !compact && <span {...stylex.props(styles.period, styles.rel)}>{s.period}</span>}
          </button>
        ))}
      </div>

      <div {...stylex.props(styles.toolbar)}>
        <Icon name="tv" size={15} xstyle={styles.pink} />
        <strong {...stylex.props(styles.count)}>
          {season.episodes.filter((e) => !e.upcoming).length} / {season.episodes.length} episodes
        </strong>
        <span {...stylex.props(styles.grow)} />
        <label {...stylex.props(styles.filler)}>
          <input type="checkbox" checked={hideFiller} onChange={(e) => setHideFiller(e.target.checked)} {...stylex.props(styles.checkbox)} />
          Hide filler
        </label>
      </div>

      <ol {...stylex.props(styles.list, dyn.maxHeight(maxHeight))}>
        <AnimatePresence mode="popLayout" initial={false}>
        {episodes.map((ep, i) => {
          const current = ep.id === currentEpisodeId;
          return (
            <motion.li
              key={ep.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0, transition: { ...spring.soft, delay: Math.min(i, 10) * 0.03 } }}
              exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
            >
              <button
                type="button"
                disabled={ep.upcoming}
                aria-current={current ? 'true' : undefined}
                onClick={() => onSelect?.(ep, season)}
                {...stylex.props(styles.row, compact && styles.rowCompact, current && styles.current, ep.upcoming && styles.upcoming)}
              >
                <span {...stylex.props(styles.thumb, compact && styles.thumbCompact)}>
                  {ep.thumbnailSrc ? (
                    <img src={ep.thumbnailSrc} alt="" loading="lazy" {...stylex.props(styles.thumbImg)} />
                  ) : (
                    !current && <span {...stylex.props(styles.thumbPh)}>EP {ep.number}</span>
                  )}
                  {current ? (
                    <span {...stylex.props(styles.nowPlaying)}>
                      <Icon name="play" size={12} /> NOW
                    </span>
                  ) : (
                    <span {...stylex.props(styles.dur)}>{ep.upcoming ? 'SOON' : ep.duration}</span>
                  )}
                  {!!ep.progress && (
                    <span {...stylex.props(styles.progress)}>
                      <ProgressBar value={ep.progress} height={3} color="#ec4899" />
                    </span>
                  )}
                </span>
                <span {...stylex.props(styles.body)}>
                  <span {...stylex.props(styles.head)}>
                    <span {...stylex.props(styles.epNum, current && styles.epNumCurrent)}>EP {ep.number}</span>
                    {ep.isNew && <Badge tone="gradient">NEW</Badge>}
                    {ep.filler && <Badge tone="amber">FILLER</Badge>}
                    {ep.recap && <Badge tone="neutral">RECAP</Badge>}
                    {ep.dub && !compact && <Badge tone="solidPink">DUB</Badge>}
                  </span>
                  <span {...stylex.props(styles.epTitle)}>{ep.title}</span>
                  {!compact && ep.synopsis && <span {...stylex.props(styles.synopsis)}>{ep.synopsis}</span>}
                  <span {...stylex.props(styles.date)}>
                    <Icon name="calendar" size={11} />
                    {ep.upcoming ? `Airs ${ep.airDate}` : ep.airDate}
                    {ep.progress === 100 && (
                      <span {...stylex.props(styles.watched)}>
                        <Icon name="check" size={11} /> Watched
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </motion.li>
          );
        })}
        </AnimatePresence>
      </ol>
    </section>
  );
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  seasons: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 },
  seasonTab: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
    paddingBlock: 7,
    paddingInline: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: { default: colors.surfaceSoft, ':hover': colors.chipPink },
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  seasonActive: { borderColor: colors.pink, color: '#ffffff' },
  seasonPill: { position: 'absolute', inset: -1, borderRadius: 10, backgroundColor: colors.pink },
  rel: { position: 'relative' },
  period: { fontSize: 10, fontWeight: 600, opacity: 0.8 },
  toolbar: { display: 'flex', alignItems: 'center', gap: 8 },
  pink: { color: colors.pink },
  count: { fontFamily: fonts.mono, fontSize: 12, color: colors.textAccent },
  grow: { flexGrow: 1 },
  filler: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textSecondary, cursor: 'pointer' },
  checkbox: { accentColor: colors.pink },
  list: { display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none', overflowY: 'auto' },
  row: {
    display: 'flex',
    gap: 12,
    transitionProperty: 'background-color, border-color',
    transitionDuration: '200ms',
    width: '100%',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: { default: colors.surfaceSoft, ':hover': colors.chipPink },
    color: colors.textPrimary,
    textAlign: 'start',
    fontFamily: fonts.body,
    cursor: { default: 'pointer', ':disabled': 'default' },
  },
  rowCompact: { gap: 10, padding: 6 },
  current: { borderColor: colors.pink, borderWidth: 1.5, backgroundColor: colors.chipPink },
  upcoming: { opacity: 0.55 },
  thumb: { position: 'relative', flexShrink: 0, width: { default: 192, [bp.mobile]: 120 }, aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 8, backgroundImage: gradients.placeholderCover },
  thumbCompact: { width: 128 },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbPh: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.mono, fontSize: 14, fontWeight: 700, color: '#ffffff' },
  dur: { position: 'absolute', right: 6, bottom: 6, paddingInline: 6, paddingBlock: 2, borderRadius: 6, backgroundColor: 'rgba(15, 23, 42, 0.75)', color: '#ffffff', fontFamily: fonts.mono, fontSize: 10, fontWeight: 700 },
  nowPlaying: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.55)',
    color: '#ffffff',
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
  },
  progress: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  body: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, paddingBlock: 2 },
  head: { display: 'flex', alignItems: 'center', gap: 6 },
  epNum: { fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.textSecondary },
  epNumCurrent: { color: colors.textAccent },
  epTitle: { fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  synopsis: {
    fontSize: 12,
    lineHeight: 1.5,
    color: colors.textSecondary,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  date: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: colors.textMuted },
  watched: { display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 8, color: colors.green },
});

const dyn = stylex.create({
  maxHeight: (h: number) => ({ maxHeight: h }),
});
