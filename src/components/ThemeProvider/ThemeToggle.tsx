import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useId } from 'react';
import { spring } from '../../motion/motion';
import { colors, fonts, radius } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';
import { useTheme, type ThemeMode } from './ThemeProvider';

const options: [ThemeMode, IconName, string][] = [
  ['light', 'sparkles', 'Light'],
  ['dark', 'star', 'Dark'],
  ['system', 'tv', 'Auto'],
];

/** Light / Dark / Auto switch with a sliding pill. Must be inside <ThemeProvider>. */
export function ThemeToggle({ compact = false, xstyle }: { compact?: boolean; xstyle?: stylex.StyleXStyles }) {
  const { mode, setMode } = useTheme();
  const id = useId();
  return (
    <div role="radiogroup" aria-label="Theme" {...stylex.props(styles.root, xstyle)}>
      {options.map(([m, ic, label]) => (
        <motion.button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          title={`${label} theme`}
          onClick={() => setMode(m)}
          whileTap={{ scale: 0.92 }}
          {...stylex.props(styles.btn, mode === m && styles.active)}
        >
          {mode === m && <motion.span layoutId={`theme-pill-${id}`} transition={spring.layout} {...stylex.props(styles.pill)} />}
          <motion.span
            key={`${m}-${mode === m}`}
            initial={mode === m ? { rotate: -90, scale: 0.6 } : false}
            animate={{ rotate: 0, scale: 1 }}
            transition={spring.snappy}
            {...stylex.props(styles.content)}
          >
            <Icon name={ic} size={14} />
          </motion.span>
          {!compact && <span {...stylex.props(styles.content)}>{label}</span>}
        </motion.button>
      ))}
    </div>
  );
}

const styles = stylex.create({
  root: {
    display: 'inline-flex',
    gap: 2,
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
  },
  btn: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    paddingBlock: 5,
    paddingInline: 10,
    borderRadius: radius.pill,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transitionProperty: 'color',
    transitionDuration: '200ms',
  },
  active: { color: '#ffffff' },
  pill: { position: 'absolute', inset: 0, borderRadius: radius.pill, backgroundColor: colors.pink },
  content: { position: 'relative', display: 'inline-flex' },
});
