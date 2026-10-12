import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { press } from '../../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft' | 'danger';

type NativeButton = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'>;

export interface ButtonProps extends NativeButton {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: IconName;
  fullWidth?: boolean;
  xstyle?: stylex.StyleXStyles;
}

/**
 * Primary = pink→rose→amber CTA (age-gate / menu). Secondary = white glass pill.
 * Ghost = for dark or image backgrounds. Outline / soft / danger = card actions.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  type = 'button',
  xstyle,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      {...press}
      whileHover={rest.disabled ? undefined : press.whileHover}
      whileTap={rest.disabled ? undefined : press.whileTap}
      {...rest}
      {...stylex.props(styles.base, sizes[size], variants[variant], fullWidth && styles.full, xstyle)}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 16} xstyle={iconTone[variant]} />}
      {children}
    </motion.button>
  );
}

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: radius.md,
    fontFamily: fonts.body,
    fontWeight: 700,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    opacity: { default: 1, ':disabled': 0.5 },
    transitionProperty: 'filter, box-shadow',
    transitionDuration: '150ms',
    filter: { default: null, ':hover': 'brightness(1.05)' },
  },
  full: { width: '100%' },
});

const sizes = stylex.create({
  sm: { fontSize: 13, paddingBlock: 8, paddingInline: 14, borderRadius: radius.sm },
  md: { fontSize: 14, paddingBlock: 12, paddingInline: 22 },
});

const variants = stylex.create({
  primary: { backgroundImage: gradients.primary, color: colors.textOnDark, boxShadow: shadows.glowPink },
  secondary: { backgroundColor: colors.surfaceStrong, borderColor: 'rgba(245, 158, 11, 0.45)', color: colors.textPrimary },
  ghost: { backgroundColor: 'rgba(255, 255, 255, 0.14)', borderColor: colors.borderGlass, color: colors.textOnDark },
  outline: { backgroundColor: colors.surfaceStrong, borderColor: colors.borderPink, borderWidth: 1.5, color: colors.textPrimary },
  soft: { backgroundColor: colors.surfaceSoft, color: colors.textPrimary },
  danger: { backgroundImage: 'linear-gradient(90deg, #e11d48, #dc2626)', color: colors.textOnDark, boxShadow: shadows.glowPink },
});

const iconTone = stylex.create({
  primary: {},
  secondary: { color: colors.amber },
  ghost: {},
  outline: { color: colors.red },
  soft: { color: colors.amber },
  danger: {},
});
