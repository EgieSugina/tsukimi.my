import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { press } from '../../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export interface ChipProps {
  label: string;
  active?: boolean;
  icon?: IconName;
  onClick?: () => void;
  xstyle?: stylex.StyleXStyles;
}

/** Genre / filter chip. `active` = currently selected genre. */
export function Chip({ label, active = false, icon, onClick, xstyle }: ChipProps) {
  return (
    <motion.button
      type="button"
      {...press}
      layout="position"
      aria-pressed={active}
      onClick={onClick}
      {...stylex.props(styles.base, active ? styles.active : styles.idle, xstyle)}
    >
      {icon && <Icon name={icon} size={12} strokeWidth={2.4} />}
      {label}
    </motion.button>
  );
}

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 8,
    paddingInline: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transitionProperty: 'box-shadow, background-color, color',
    transitionDuration: '200ms',
  },
  idle: {
    backgroundColor: { default: colors.surfaceStrong, ':hover': colors.chipPink },
    borderColor: colors.borderPink,
    color: colors.textAccent,
  },
  active: {
    backgroundImage: gradients.pinkRose,
    borderColor: 'transparent',
    color: colors.textOnDark,
    boxShadow: shadows.glowPink,
  },
});
