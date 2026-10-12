import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { spring } from '../../motion/motion';
import { colors, fonts, radius, shadows } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Badge } from '../Badge/Badge';
import { MediaFrame } from '../MediaFrame/MediaFrame';

export interface CastPolaroidProps {
  name: string;
  /** Italic caption, e.g. "— 128 videos · 2.4M views —". */
  subtitle: string;
  /** e.g. "#1". Hidden when omitted. */
  rank?: string;
  photoSrc?: string;
  tape?: boolean;
  /** Slight tilt in degrees, like the main-menu photo frames. */
  tilt?: number;
  onClick?: () => void;
  xstyle?: stylex.StyleXStyles;
}

/** Polaroid cast card (tape + italic caption). Used in the Popular Actress row. */
export function CastPolaroid({ name, subtitle, rank, photoSrc, tape = true, tilt = 0, onClick, xstyle }: CastPolaroidProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 24, rotate: tilt * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      whileHover={{ y: -6, rotate: 0, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={spring.soft}
      {...stylex.props(styles.root, xstyle)}
    >
      {tape && (
        <motion.span
          {...stylex.props(styles.tape)}
          initial={{ scaleX: 0, rotate: -4 }}
          whileInView={{ scaleX: 1, rotate: -4 }}
          viewport={{ once: true }}
          transition={{ ...spring.snappy, delay: 0.15 }}
          aria-hidden
        />
      )}
      <MediaFrame kind="photo" src={photoSrc} alt={name} xstyle={styles.photo}>
        {rank && (
          <Badge tone="solidPink" icon="crown" size="md" xstyle={styles.rank}>
            {rank}
          </Badge>
        )}
      </MediaFrame>
      <span {...stylex.props(styles.name)}>{name}</span>
      <span {...stylex.props(styles.subtitle)}>{subtitle}</span>
    </motion.button>
  );
}

const styles = stylex.create({
  root: {
    position: 'relative',
    flexShrink: 0,
    scrollSnapAlign: 'start',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingInline: 10,
    paddingBottom: 14,
    borderWidth: 0,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceCard,
    boxShadow: { default: shadows.card, ':hover': shadows.glass },
    cursor: 'pointer',
    fontFamily: fonts.body,
    transitionProperty: 'box-shadow',
    transitionDuration: '250ms',
  },
  tape: {
    position: 'absolute',
    top: -12,
    left: '50%',
    width: 90,
    height: 22,
    marginLeft: -45,
    backgroundColor: 'rgba(244, 114, 182, 0.7)',
    zIndex: 1,
  },
  photo: { borderRadius: 2 },
  rank: { position: 'absolute', top: 10, left: 10 },
  name: { fontSize: { default: 16, [bp.mobile]: 13 }, fontWeight: 700, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: { default: 13, [bp.mobile]: 11 }, color: colors.textAccent, textAlign: 'center' },
});
