import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { press, spring } from '../../motion/motion';
import { colors, fonts, shadows } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export interface NavTabProps {
  label: string;
  icon?: IconName;
  active?: boolean;
  onClick?: () => void;
  /**
   * Shared-layout id for the active pill. Tabs in the same group with the same id
   * animate the pill sliding between them.
   */
  indicatorId?: string;
  xstyle?: stylex.StyleXStyles;
}

/** Top navigation tab (Cast Roster / Guest List style). Active = solid pink pill that slides between tabs. */
export function NavTab({ label, icon, active = false, onClick, indicatorId = 'navtab-active', xstyle }: NavTabProps) {
  return (
    <motion.button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      {...press}
      {...stylex.props(styles.base, active ? styles.active : styles.idle, xstyle)}
    >
      {active && <motion.span layoutId={indicatorId} transition={spring.layout} {...stylex.props(styles.pill)} aria-hidden />}
      <span {...stylex.props(styles.content)}>
        {icon && <Icon name={icon} size={16} />}
        {label}
      </span>
    </motion.button>
  );
}

const styles = stylex.create({
  base: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    paddingBlock: 9,
    paddingInline: 14,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transitionProperty: 'color, background-color',
    transitionDuration: '200ms',
  },
  idle: {
    backgroundColor: { default: 'transparent', ':hover': colors.chipPink },
    color: colors.textPrimary,
  },
  active: { color: colors.textOnDark },
  pill: {
    position: 'absolute',
    inset: 0,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: '#9d174d',
    backgroundColor: colors.pink,
    boxShadow: shadows.glowPink,
  },
  content: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 },
});
