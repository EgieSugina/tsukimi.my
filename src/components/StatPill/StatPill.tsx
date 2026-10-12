import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import { colors, fonts, radius } from '../../tokens/tokens.stylex';

export type StatPillTone = 'rose' | 'indigo' | 'slate' | 'amber' | 'green';

export interface StatPillProps {
  children: ReactNode;
  tone?: StatPillTone;
  xstyle?: stylex.StyleXStyles;
}

/** Monospace counter pill used in the top bar (like `DAY 20` / `reputation:97`). */
export function StatPill({ children, tone = 'rose', xstyle }: StatPillProps) {
  return <span {...stylex.props(styles.base, tones[tone], xstyle)}>{children}</span>;
}

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 6,
    paddingInline: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
});

const tones = stylex.create({
  rose: { backgroundColor: colors.chipRose, borderColor: colors.borderPink, color: colors.textAccent },
  indigo: { backgroundColor: colors.chipIndigo, borderColor: colors.indigo, color: colors.textIndigo },
  slate: { backgroundColor: colors.surfaceSoft, borderColor: colors.borderSubtle, color: colors.textPrimary },
  amber: { backgroundColor: colors.chipAmber, borderColor: colors.amber, color: colors.textAmber },
  green: { backgroundColor: colors.chipGreen, borderColor: colors.green, color: colors.textGreen },
});
