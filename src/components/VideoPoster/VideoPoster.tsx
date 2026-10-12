import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { fadeUp, lift } from '../../motion/motion';
import { colors, fonts, radius, shadows } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { MediaFrame } from '../MediaFrame/MediaFrame';

export interface VideoPosterProps {
  title: string;
  cast: string;
  views: string;
  duration: string;
  quality?: string;
  /** e.g. "#1 Trending". Hidden when omitted. */
  rank?: string;
  coverSrc?: string;
  /** Hide title + meta (used for decorative posters in the hero). */
  coverOnly?: boolean;
  onClick?: () => void;
  xstyle?: stylex.StyleXStyles;
}

/** Vertical poster for carousels (Trending, New Releases). Cover 250 × 351. */
export function VideoPoster({ title, cast, views, duration, quality = '4K', rank, coverSrc, coverOnly, onClick, xstyle }: VideoPosterProps) {
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      {...stylex.props(styles.root, xstyle)}
    >
      <motion.button type="button" onClick={onClick} aria-label={`Play ${title}`} {...lift} {...stylex.props(styles.coverBtn)}>
        <MediaFrame src={coverSrc} alt={title} xstyle={styles.cover}>
          <Badge tone="dark" xstyle={styles.tl}>{quality}</Badge>
          {rank && <Badge tone="gradient" xstyle={styles.tr}>{rank}</Badge>}
          <span {...stylex.props(styles.duration)}>
            <Icon name="clock" size={12} />
            {duration}
          </span>
        </MediaFrame>
      </motion.button>
      {!coverOnly && (
        <>
          <h3 {...stylex.props(styles.title)}>{title}</h3>
          <div {...stylex.props(styles.meta)}>
            <span {...stylex.props(styles.cast)}>{cast}</span>
            <span aria-hidden>·</span>
            <Icon name="eye" size={12} />
            <span>{views}</span>
          </div>
        </>
      )}
    </motion.article>
  );
}

const styles = stylex.create({
  root: { flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 10, width: { default: 250, [bp.mobile]: 150 }, fontFamily: fonts.body },
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
  duration: {
    position: 'absolute',
    right: 10,
    bottom: 10,
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
  cast: { fontWeight: 700, color: colors.textAccent },
});
