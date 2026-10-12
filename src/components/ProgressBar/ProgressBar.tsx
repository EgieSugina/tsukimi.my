import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { spring } from '../../motion/motion';
import { colors, gradients } from '../../tokens/tokens.stylex';

export interface ProgressBarProps {
  /** 0–100. */
  value: number;
  /** Solid fill color; defaults to the rose→amber gradient. */
  color?: string;
  height?: number;
  label?: string;
  xstyle?: stylex.StyleXStyles;
}

/** Thin progress track (stat bars, continue-watching progress). */
export function ProgressBar({ value, color, height = 4, label, xstyle }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      {...stylex.props(styles.track, dyn.height(height), xstyle)}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={spring.soft}
        {...stylex.props(styles.fill, color ? dyn.color(color) : styles.gradient)}
      />
    </div>
  );
}

const styles = stylex.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: 999, backgroundColor: colors.borderSubtle },
  fill: { height: '100%', borderRadius: 999 },
  gradient: { backgroundImage: gradients.roseAmber },
});

const dyn = stylex.create({
  height: (h: number) => ({ height: h }),
  color: (c: string) => ({ backgroundColor: c }),
});
