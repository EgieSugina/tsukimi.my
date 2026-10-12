import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { lift } from '../../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export interface CategoryTileProps {
  title: string;
  description: string;
  icon?: IconName;
  active?: boolean;
  onClick?: () => void;
  xstyle?: stylex.StyleXStyles;
}

/** Big category selector (Supplies & Facility top tiles). Active = rose→amber gradient. */
export function CategoryTile({ title, description, icon = 'film', active = false, onClick, xstyle }: CategoryTileProps) {
  return (
    <motion.button
      type="button"
      {...lift}
      whileHover={{ y: -3 }}
      aria-pressed={active}
      onClick={onClick}
      {...stylex.props(styles.base, active ? styles.active : styles.idle, xstyle)}
    >
      <span {...stylex.props(styles.row)}>
        <Icon name={icon} size={18} xstyle={active ? styles.iconActive : styles.icon} />
        <span {...stylex.props(styles.title)}>{title}</span>
      </span>
      <span {...stylex.props(styles.desc, active && styles.descActive)}>{description}</span>
    </motion.button>
  );
}

const styles = stylex.create({
  base: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
    paddingBlock: 14,
    paddingInline: 16,
    borderRadius: radius.md,
    borderStyle: 'solid',
    textAlign: 'start',
    fontFamily: fonts.body,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: '250ms',
  },
  idle: { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.borderSubtle, color: colors.textPrimary },
  active: {
    backgroundImage: gradients.roseAmber,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    color: colors.textOnDark,
    boxShadow: shadows.glowPink,
  },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  icon: { color: colors.pink },
  iconActive: { color: colors.textOnDark },
  title: { fontSize: 16, fontWeight: 700 },
  desc: { fontSize: 12, fontWeight: 500, color: colors.textSecondary },
  descActive: { color: 'rgba(255, 255, 255, 0.9)' },
});
