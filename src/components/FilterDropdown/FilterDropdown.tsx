import * as stylex from '@stylexjs/stylex';
import { colors, fonts } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export interface FilterDropdownProps {
  /** Options shown in the select. The first one is the "All …" default. */
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  icon?: IconName;
  /** Amber highlight — used for the active sort control. */
  highlighted?: boolean;
  label?: string;
  xstyle?: stylex.StyleXStyles;
}

/** Filter select (All Genres / All Categories / Sort). Native <select> for accessibility. */
export function FilterDropdown({
  options,
  value,
  onChange,
  icon = 'sparkles',
  highlighted = false,
  label,
  xstyle,
}: FilterDropdownProps) {
  return (
    <label {...stylex.props(styles.wrap, highlighted && styles.highlighted, xstyle)}>
      <Icon name={icon} size={16} xstyle={styles.icon} />
      <select
        aria-label={label ?? options[0]}
        value={value}
        defaultValue={value === undefined ? options[0] : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        {...stylex.props(styles.select)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={16} xstyle={styles.chevron} />
    </label>
  );
}

const styles = stylex.create({
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    height: 46,
    paddingInline: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: { default: colors.borderSubtle, ':focus-within': colors.pink },
    backgroundColor: colors.surfaceStrong,
    boxShadow: { default: 'none', ':focus-within': '0 0 0 3px rgba(236, 72, 153, 0.18)' },
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionDuration: '200ms',
  },
  highlighted: { backgroundColor: colors.chipAmber, borderColor: '#fcd34d' },
  icon: { color: colors.pink },
  chevron: { color: colors.textSecondary, pointerEvents: 'none' },
  select: {
    flexGrow: 1,
    minWidth: 0,
    appearance: 'none',
    borderWidth: 0,
    outline: 'none',
    backgroundColor: 'transparent',
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: 700,
    color: colors.textPrimary,
    textOverflow: 'ellipsis',
    cursor: 'pointer',
  },
});
