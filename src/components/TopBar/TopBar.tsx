import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useId } from 'react';
import { ease } from '../../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Icon, type IconName } from '../Icon/Icon';
import { NavTab } from '../NavTab/NavTab';
import { StatPill, type StatPillTone } from '../StatPill/StatPill';
import { ThemeToggle } from '../ThemeProvider/ThemeToggle';

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
}

export interface TopBarStat {
  label: string;
  tone: StatPillTone;
}

export interface TopBarProps {
  brand?: string;
  mode?: string;
  username?: string;
  stats?: TopBarStat[];
  navItems?: NavItem[];
  activeNav?: string;
  onNavigate?: (id: string) => void;
  favorites?: number;
  language?: string;
  /** Hamburger (shown below laptop width) — open the navigation drawer. */
  onMenu?: () => void;
  xstyle?: stylex.StyleXStyles;
}

export const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'videos', label: 'Videos', icon: 'film' },
  { id: 'cast', label: 'Cast', icon: 'user' },
  { id: 'anime', label: 'Anime', icon: 'tv' },
  { id: 'comics', label: 'Comics', icon: 'book' },
  { id: 'genres', label: 'Genres', icon: 'tag' },
  { id: 'categories', label: 'Categories', icon: 'grid' },
];

const defaultStats: TopBarStat[] = [
  { label: 'VIDEOS 12,480', tone: 'rose' },
  { label: 'CAST 356', tone: 'indigo' },
  { label: 'NEW TODAY 24', tone: 'rose' },
  { label: 'ONLINE 3.2K', tone: 'slate' },
];

const iconButtons: { icon: IconName; label: string; tone: 'indigo' | 'pink' | 'amber' }[] = [
  { icon: 'bell', label: 'Notifications', tone: 'indigo' },
  { icon: 'heart', label: 'Favorites', tone: 'pink' },
];

/** Global header: user chip, gradient logo, mono stat pills, nav tabs, icon buttons, language. */
export function TopBar({
  brand = 'Tsukimi',
  mode = 'Streaming',
  username = 'Guest',
  stats = defaultStats,
  navItems = defaultNavItems,
  activeNav = 'home',
  onNavigate,
  onMenu,
  favorites = 42,
  language = 'English',
  xstyle,
}: TopBarProps) {
  const navId = useId();
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: ease.out }}
      {...stylex.props(styles.bar, xstyle)}
    >
      <button type="button" aria-label="Open menu" onClick={onMenu} {...stylex.props(styles.menuBtn)}>
        <Icon name="menu" size={20} />
      </button>
      <button type="button" aria-label={username} {...stylex.props(styles.user)}>
        <Icon name="user" size={16} />
        <span {...stylex.props(styles.hideMobile)}>{username}</span>
      </button>
      <span {...stylex.props(styles.logo)}>{brand}</span>
      <span {...stylex.props(styles.mode)}>{mode}</span>
      <span {...stylex.props(styles.divider)} aria-hidden />
      <span {...stylex.props(styles.stats)}>
        {stats.map((s) => (
          <StatPill key={s.label} tone={s.tone}>{s.label}</StatPill>
        ))}
      </span>
      <span {...stylex.props(styles.grow)} />
      <nav {...stylex.props(styles.nav)} aria-label="Main">
        {navItems.map((n) => (
          <NavTab key={n.id} label={n.label} icon={n.icon} active={n.id === activeNav} indicatorId={`nav-${navId}`} onClick={() => onNavigate?.(n.id)} />
        ))}
      </nav>
      <span {...stylex.props(styles.grow)} />
      <span {...stylex.props(styles.fav, styles.hideBelowWide)}>
        <Icon name="heart" size={13} />
        FAV {favorites}
      </span>
      {iconButtons.map((b) => (
        <button key={b.icon} type="button" aria-label={b.label} {...stylex.props(styles.iconBtn, iconTones[b.tone], b.icon !== 'bell' && styles.hideMobile)}>
          <Icon name={b.icon} size={16} />
        </button>
      ))}
      <ThemeToggle compact />
      <button type="button" {...stylex.props(styles.lang)}>
        <Icon name="globe" size={14} />
        <span {...stylex.props(styles.hideMobile)}>{language}</span>
        <span {...stylex.props(styles.hideMobile)}>
          <Icon name="chevronDown" size={14} />
        </span>
      </button>
    </motion.header>
  );
}

const styles = stylex.create({
  bar: {
    display: 'flex',
    alignItems: 'center',
    height: { default: 64, [bp.mobile]: 56 },
    paddingInline: { default: 20, [bp.mobile]: 10 },
    gap: { default: 10, [bp.mobile]: 6 },
    backgroundColor: colors.surfaceBar,
    backdropFilter: 'blur(12px)',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.borderPink,
    fontFamily: fonts.body,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  user: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 7,
    paddingInlineStart: 12,
    paddingInlineEnd: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    boxShadow: shadows.glowPink,
    color: colors.textIndigo,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: { default: 24, [bp.mobile]: 19 },
    fontWeight: 700,
    whiteSpace: 'nowrap',
    backgroundImage: gradients.logo,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  },
  mode: {
    // secondary chrome collapses first so the nav never overflows (7 tabs at 1920px)
    display: { default: 'inline-block', '@media (max-width: 2199px)': 'none' },
    paddingBlock: 5,
    paddingInline: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#d8b4fe',
    backgroundColor: colors.chipPurple,
    color: '#7e22ce',
    fontSize: 13,
    fontWeight: 700,
  },
  divider: { display: { default: 'block', [bp.belowPc]: 'none' }, width: 1, height: 28, backgroundColor: colors.borderSubtle },
  // stat pills collapse first on narrower desktops so the nav never overflows
  stats: { display: { default: 'flex', '@media (max-width: 1799px)': 'none' }, gap: 10 },
  grow: { flexGrow: 1 },
  nav: { display: { default: 'flex', [bp.belowLaptop]: 'none' }, alignItems: 'center', gap: 4 },
  hideMobile: { display: { default: 'inline-flex', [bp.mobile]: 'none' } },
  hideBelowWide: { display: { default: 'inline-flex', '@media (max-width: 2199px)': 'none' } },
  menuBtn: {
    display: { default: 'none', [bp.belowLaptop]: 'inline-flex' },
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
    cursor: 'pointer',
  },
  fav: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 6,
    paddingInline: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderPink,
    backgroundColor: colors.chipPink,
    color: colors.textAccent,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
  },
  iconBtn: {
    display: 'inline-flex',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    cursor: 'pointer',
  },
  lang: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 7,
    paddingInline: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
});

const iconTones = stylex.create({
  indigo: { backgroundColor: colors.chipIndigo, color: colors.indigo },
  pink: { backgroundColor: colors.chipPink, color: colors.pink },
  amber: { backgroundColor: colors.chipAmber, color: colors.amber },
});
