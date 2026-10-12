import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { fadeUp, lift } from '../../motion/motion';
import { colors, fonts, radius, shadows } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { MediaFrame } from '../MediaFrame/MediaFrame';

export type AnimeKind = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';
export type AnimeStatus = 'airing' | 'finished' | 'upcoming';

export interface AnimeCardProps {
  title: string;
  /** e.g. "Fall 2026" */
  season: string;
  kind?: AnimeKind;
  status?: AnimeStatus;
  /** Episodes released so far. */
  episodesAired: number;
  /** Total planned episodes; omit when unknown. */
  episodesTotal?: number;
  studio?: string;
  rating?: string;
  sub?: boolean;
  dub?: boolean;
  rank?: string;
  /** e.g. "EP 8 · Sat 23:30" for airing shows */
  nextAiring?: string;
  coverSrc?: string;
  onClick?: () => void;
  xstyle?: stylex.StyleXStyles;
}

const statusTone = { airing: 'orange', finished: 'emerald', upcoming: 'neutral' } as const;
const statusLabel = { airing: 'AIRING', finished: 'FINISHED', upcoming: 'UPCOMING' } as const;

/** Anime cover card (250 × 351) with season, episode count, SUB/DUB and airing info. */
export function AnimeCard({
  title,
  season,
  kind = 'TV',
  status = 'airing',
  episodesAired,
  episodesTotal,
  studio,
  rating,
  sub = true,
  dub = false,
  rank,
  nextAiring,
  coverSrc,
  onClick,
  xstyle,
}: AnimeCardProps) {
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      {...stylex.props(styles.root, xstyle)}
    >
      <motion.button type="button" onClick={onClick} aria-label={`Watch ${title}`} {...lift} variants={{ rest: { y: 0 }, hover: { y: -4 } }} initial="rest" animate="rest" whileHover="hover" {...stylex.props(styles.coverBtn)}>
        <MediaFrame src={coverSrc} alt={title} xstyle={styles.cover}>
          <div {...stylex.props(styles.topLeft)}>
            <Badge tone="solidIndigo">{kind}</Badge>
            {sub && <Badge tone="dark">SUB</Badge>}
            {dub && <Badge tone="solidPink">DUB</Badge>}
          </div>
          {rank && <Badge tone="gradient" xstyle={styles.tr}>{rank}</Badge>}
          <motion.span
            variants={{ rest: { scale: 0.85, opacity: 0.75 }, hover: { scale: 1.08, opacity: 1 } }}
            {...stylex.props(styles.play)}
            aria-hidden
          >
            <Icon name="play" size={22} />
          </motion.span>
          <div {...stylex.props(styles.bottom)}>
            <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
            <span {...stylex.props(styles.grow)} />
            <span {...stylex.props(styles.eps)}>
              <Icon name="tv" size={12} />
              EP {episodesAired}
              {episodesTotal ? ` / ${episodesTotal}` : ''}
            </span>
          </div>
        </MediaFrame>
      </motion.button>
      <h3 {...stylex.props(styles.title)}>{title}</h3>
      <div {...stylex.props(styles.meta)}>
        <span {...stylex.props(styles.season)}>{season}</span>
        {studio && (
          <>
            <span aria-hidden>·</span>
            <span>{studio}</span>
          </>
        )}
        {rating && (
          <>
            <span aria-hidden>·</span>
            <Icon name="star" size={12} xstyle={styles.amber} />
            <span>{rating}</span>
          </>
        )}
      </div>
      {nextAiring && (
        <span {...stylex.props(styles.next)}>
          <Icon name="clock" size={11} />
          {nextAiring}
        </span>
      )}
    </motion.article>
  );
}

const styles = stylex.create({
  root: { flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 8, width: { default: 250, [bp.mobile]: 150 }, fontFamily: fonts.body },
  coverBtn: { position: 'relative', padding: 0, borderWidth: 0, backgroundColor: 'transparent', cursor: 'pointer', borderRadius: radius.md },
  cover: {
    borderRadius: radius.md,
    boxShadow: { default: shadows.card, ':hover': shadows.glass },
    outlineWidth: 3,
    outlineStyle: 'solid',
    outlineColor: colors.surfaceCard,
    outlineOffset: -3,
    transitionProperty: 'box-shadow',
    transitionDuration: '250ms',
  },
  topLeft: { position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4 },
  tr: { position: 'absolute', top: 10, right: 10 },
  play: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    display: 'inline-flex',
    padding: 14,
    marginTop: -25,
    marginLeft: -25,
    borderRadius: 999,
    backgroundColor: 'rgba(236, 72, 153, 0.85)',
    color: '#ffffff',
    boxShadow: shadows.glowPink,
    opacity: 0.9,
  },
  bottom: { position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  grow: { flexGrow: 1 },
  eps: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    paddingBlock: 4,
    paddingInline: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    color: '#ffffff',
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: { default: 16, [bp.mobile]: 14 },
    fontWeight: 700,
    lineHeight: 1.35,
    color: colors.textPrimary,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  meta: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: colors.textSecondary },
  season: { fontWeight: 700, color: colors.textAccent },
  amber: { color: colors.amber },
  next: { display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: colors.textIndigo },
});
