import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useId } from 'react';
import { spring } from '../../motion/motion';
import { colors, fonts } from '../../tokens/tokens.stylex';
import { Icon } from '../Icon/Icon';
import type { NavItem } from '../TopBar/TopBar';

export interface BottomNavProps {
  items: NavItem[];
  active?: string;
  onNavigate?: (id: string) => void;
  xstyle?: stylex.StyleXStyles;
}

/** Thumb-reachable tab bar for phones (max 5 items). Sits above the iOS home indicator. */
export function BottomNav({ items, active, onNavigate, xstyle }: BottomNavProps) {
  const uid = useId();
  return (
    <motion.nav
      aria-label="Main"
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={spring.soft}
      {...stylex.props(styles.bar, xstyle)}
    >
      {items.slice(0, 5).map((it) => {
        const on = it.id === active;
        return (
          <motion.button
            key={it.id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onNavigate?.(it.id)}
            whileTap={{ scale: 0.9 }}
            {...stylex.props(styles.item, on && styles.itemOn)}
          >
            {on && <motion.span layoutId={`bn-${uid}`} transition={spring.layout} {...stylex.props(styles.pill)} />}
            <span {...stylex.props(styles.inner)}>
              <Icon name={it.icon} size={20} />
              <span {...stylex.props(styles.label)}>{it.label}</span>
            </span>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

const styles = stylex.create({
  bar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    display: 'flex',
    justifyContent: 'space-around',
    gap: 4,
    paddingTop: 6,
    paddingInline: 8,
    paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
    backgroundColor: colors.surfaceBar,
    backdropFilter: 'blur(14px)',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.borderSubtle,
    fontFamily: fonts.body,
  },
  item: {
    position: 'relative',
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 52,
    paddingBlock: 6,
    borderWidth: 0,
    borderRadius: 14,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
  },
  itemOn: { color: colors.textAccent },
  pill: { position: 'absolute', inset: 0, borderRadius: 14, backgroundColor: colors.chipPink },
  inner: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  label: { fontSize: 11, fontWeight: 700 },
});
