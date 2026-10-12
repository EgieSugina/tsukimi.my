import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { fadeUp, press, staggerContainer } from '../../motion/motion';
import { colors, fonts, radius } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export interface SectionHeaderProps {
  overline: string;
  title: string;
  icon?: IconName;
  linkLabel?: string;
  onLinkClick?: () => void;
  xstyle?: stylex.StyleXStyles;
}

/** Heading above every content row (Popular Actress, Trending, Categories…). */
export function SectionHeader({ overline, title, icon = 'crown', linkLabel = 'See all', onLinkClick, xstyle }: SectionHeaderProps) {
  return (
    <motion.header
      variants={staggerContainer(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      {...stylex.props(styles.root, xstyle)}
    >
      <div {...stylex.props(styles.group)}>
        <motion.span variants={fadeUp} {...stylex.props(styles.overline)}>
          <Icon name={icon} size={12} strokeWidth={2.4} />
          {overline}
        </motion.span>
        <motion.h2 variants={fadeUp} {...stylex.props(styles.title)}>
          {title}
        </motion.h2>
      </div>
      {linkLabel && (
        <motion.button type="button" onClick={onLinkClick} variants={fadeUp} whileHover={{ x: 3 }} whileTap={press.whileTap} {...stylex.props(styles.link)}>
          {linkLabel}
          <Icon name="chevronRight" size={16} />
        </motion.button>
      )}
    </motion.header>
  );
}

const styles = stylex.create({
  root: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, width: '100%' },
  group: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  overline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 5,
    paddingInlineStart: 10,
    paddingInlineEnd: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.chipPink,
    color: colors.textAccent,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  },
  title: { margin: 0, fontFamily: fonts.body, fontSize: { default: 28, [bp.mobile]: 21 }, fontWeight: 800, lineHeight: 1.25, color: colors.textPrimary },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors.textAccent,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: { default: 'none', ':hover': 'underline' },
  },
});
