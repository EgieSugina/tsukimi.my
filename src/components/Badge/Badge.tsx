import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import { colors, fonts, gradients, radius } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export type BadgeTone =
  | 'amber'
  | 'pink'
  | 'rose'
  | 'indigo'
  | 'green'
  | 'neutral'
  | 'dark'
  | 'solidPink'
  | 'solidRed'
  | 'solidIndigo'
  | 'gradient'
  | 'orange'
  | 'emerald';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: IconName;
  /** `pill` = fully rounded, `tag` = 6px corners (Cast Roster tags). */
  shape?: 'pill' | 'tag';
  size?: 'sm' | 'md';
  xstyle?: stylex.StyleXStyles;
}

/** Small status pill: quality (HD/4K), NEW, ranks, cast tags. */
export function Badge({ children, tone = 'pink', icon, shape = 'pill', size = 'sm', xstyle }: BadgeProps) {
  return (
    <span {...stylex.props(styles.base, styles[shape], sizes[size], tones[tone], xstyle)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 11 : 13} strokeWidth={2.4} />}
      {children}
    </span>
  );
}

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: fonts.body,
    fontWeight: 700,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  pill: { borderRadius: radius.pill },
  tag: { borderRadius: radius.xs },
});

const sizes = stylex.create({
  sm: { fontSize: 11, paddingBlock: 3, paddingInline: 8 },
  md: { fontSize: 13, paddingBlock: 5, paddingInline: 10 },
});

const tones = stylex.create({
  amber: { backgroundColor: colors.chipAmber, color: colors.textAmber },
  pink: { backgroundColor: colors.chipPink, color: colors.textAccent, borderColor: colors.borderPink },
  rose: { backgroundColor: colors.chipRose, color: colors.textAccent },
  indigo: { backgroundColor: colors.chipIndigo, color: colors.textIndigo },
  green: { backgroundColor: colors.chipGreen, color: colors.textGreen },
  neutral: { backgroundColor: colors.surfaceSoft, color: colors.textPrimary, borderColor: colors.borderSubtle },
  dark: { backgroundColor: 'rgba(15, 23, 42, 0.72)', color: colors.textOnDark },
  solidPink: { backgroundColor: colors.pink, color: colors.textOnDark },
  solidRed: { backgroundColor: colors.red, color: colors.textOnDark },
  solidIndigo: { backgroundColor: colors.indigo, color: colors.textOnDark },
  gradient: { backgroundImage: gradients.amberPink, color: colors.textOnDark },
  orange: { backgroundImage: gradients.orange, color: colors.textOnDark },
  emerald: { backgroundImage: gradients.teal, color: colors.textOnDark },
});
