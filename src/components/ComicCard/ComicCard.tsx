import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { fadeUp, lift } from '../../motion/motion';
import { colors, fonts, radius, shadows } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { MediaFrame } from '../MediaFrame/MediaFrame';

export type ComicFormat = 'manga' | 'manhwa' | 'manhua';
export type ComicStatus = 'ongoing' | 'completed' | 'hiatus';

export interface ComicCardProps {
  title: string;
  author: string;
  format: ComicFormat;
  status?: ComicStatus;
  /** e.g. "Ch. 128" */
  latestChapter: string;
  rating?: string;
  /** e.g. "#1 Manhwa" */
  rank?: string;
  /** Shows a "Ch. 42 · 3h ago" style update line in pink. */
  updatedAt?: string;
  coverSrc?: string;
  onClick?: () => void;
  xstyle?: stylex.StyleXStyles;
}

const formatTone = { manga: 'solidRed', manhwa: 'solidIndigo', manhua: 'emerald' } as const;
const statusLabel: Record<ComicStatus, string> = { ongoing: 'ONGOING', completed: 'COMPLETED', hiatus: 'HIATUS' };

/** Comic cover card for manga / manhwa / manhua. Cover 250 × 351, same as video posters. */
export function ComicCard({
  title,
  author,
  format,
  status = 'ongoing',
  latestChapter,
  rating,
  rank,
  updatedAt,
  coverSrc,
  onClick,
  xstyle,
}: ComicCardProps) {
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      {...stylex.props(styles.root, xstyle)}
    >
      <motion.button type="button" onClick={onClick} aria-label={`Read ${title}`} {...lift} {...stylex.props(styles.coverBtn)}>
        <MediaFrame src={coverSrc} alt={title} xstyle={styles.cover}>
          <Badge tone={formatTone[format]} xstyle={styles.tl}>{format.toUpperCase()}</Badge>
          {rank && <Badge tone="gradient" xstyle={styles.tr}>{rank}</Badge>}
          <div {...stylex.props(styles.bottom)}>
            <Badge tone={status === 'completed' ? 'emerald' : status === 'hiatus' ? 'neutral' : 'orange'}>{statusLabel[status]}</Badge>
            <span {...stylex.props(styles.grow)} />
            <span {...stylex.props(styles.chapter)}>
              <Icon name="book" size={12} />
              {latestChapter}
            </span>
          </div>
        </MediaFrame>
      </motion.button>
      <h3 {...stylex.props(styles.title)}>{title}</h3>
      <div {...stylex.props(styles.meta)}>
        <span {...stylex.props(styles.author)}>{author}</span>
        {rating && (
          <>
            <span aria-hidden>·</span>
            <Icon name="star" size={12} xstyle={styles.amber} />
            <span>{rating}</span>
          </>
        )}
      </div>
      {updatedAt && <span {...stylex.props(styles.updated)}>{updatedAt}</span>}
    </motion.article>
  );
}

const styles = stylex.create({
  root: { flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 8, width: { default: 250, [bp.mobile]: 150 }, fontFamily: fonts.body },
  coverBtn: { padding: 0, borderWidth: 0, backgroundColor: 'transparent', cursor: 'pointer', borderRadius: radius.md },
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
  tl: { position: 'absolute', top: 10, left: 10 },
  tr: { position: 'absolute', top: 10, right: 10 },
  bottom: { position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', alignItems: 'center', gap: 6 },
  grow: { flexGrow: 1 },
  chapter: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    paddingBlock: 4,
    paddingInline: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    color: colors.textOnDark,
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
  author: { fontWeight: 700, color: colors.textAccent },
  amber: { color: colors.amber },
  updated: { fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: colors.textAccent },
});
