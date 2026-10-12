import * as stylex from '@stylexjs/stylex';
import type { InputHTMLAttributes } from 'react';
import { colors, fonts } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Icon } from '../Icon/Icon';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style' | 'type'> {
  xstyle?: stylex.StyleXStyles;
}

/** Search input with leading magnifier (Guest List filter bar). */
export function SearchField({ placeholder = 'Search title, cast or tag…', xstyle, ...rest }: SearchFieldProps) {
  return (
    <label {...stylex.props(styles.wrap, xstyle)}>
      <Icon name="search" size={16} xstyle={styles.icon} />
      <input type="search" placeholder={placeholder} aria-label={placeholder} {...rest} {...stylex.props(styles.input)} />
    </label>
  );
}

const styles = stylex.create({
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: { default: 280, [bp.mobile]: '100%' },
    height: 46,
    paddingInline: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: { default: colors.borderSubtle, ':focus-within': colors.pink },
    backgroundColor: colors.surfaceStrong,
    boxShadow: { default: 'none', ':focus-within': '0 0 0 3px rgba(236, 72, 153, 0.18)' },
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '200ms',
    cursor: 'text',
  },
  icon: { color: colors.textMuted },
  input: {
    flexGrow: 1,
    minWidth: 0,
    borderWidth: 0,
    outline: 'none',
    backgroundColor: 'transparent',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 500,
    color: colors.textPrimary,
    '::placeholder': { color: colors.textMuted },
  },
});
