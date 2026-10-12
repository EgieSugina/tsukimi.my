import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
import { fadeUp, spring, staggerContainer } from '../../motion/motion';
import { colors, fonts, radius } from '../../tokens/tokens.stylex';
import { Chip } from '../Chip/Chip';
import { Icon, type IconName } from '../Icon/Icon';
import { ProgressBar } from '../ProgressBar/ProgressBar';

export interface WatchlistItem {
  title: string;
  status: string;
  done: boolean;
}

export interface SidebarProps {
  featured?: { name: string; badge: string; subtitle: string };
  continueWatching?: { title: string; position: string; duration: string; percent: number; nextEpisode: string; nextIn: string };
  watchlist?: WatchlistItem[];
  genres?: string[];
  activeGenre?: string;
  onGenreChange?: (genre: string) => void;
  xstyle?: stylex.StyleXStyles;
}

const quickTabs: [IconName, string][] = [
  ['sparkles', 'For You'],
  ['flame', 'Trending'],
  ['star', 'New'],
  ['grid', 'All'],
];

function Card({ icon, iconTone, title, aside, children }: { icon: IconName; iconTone: stylex.StyleXStyles; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <motion.section variants={fadeUp} {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.cardHead)}>
        <Icon name={icon} size={16} xstyle={iconTone} />
        <h3 {...stylex.props(styles.cardTitle)}>{title}</h3>
        <span {...stylex.props(styles.grow)} />
        {aside}
      </div>
      {children}
    </motion.section>
  );
}

/** Left rail: featured cast, quick tabs, continue-watching, watchlist checklist, popular genres. */
export function Sidebar({
  featured = { name: 'Misaki Sakurai', badge: 'Cast of the Week', subtitle: 'New series every Friday 20:00' },
  continueWatching = { title: 'Summer Rooftop · Ep 3', position: '24:18', duration: '48:02', percent: 50.6, nextEpisode: 'Friday 20:00', nextIn: '2 days' },
  watchlist = [
    { title: 'Under the Clear Summer Sky', status: 'Finished', done: true },
    { title: 'Night Festival Promise', status: 'Ep 2 of 8', done: false },
    { title: 'Aquarium Date with Misaki', status: 'Finished', done: true },
    { title: 'Ferris Wheel at Dusk', status: 'Finished', done: true },
    { title: 'Seaside Sunset Letter', status: 'Not started', done: false },
  ],
  genres = ['Romance', 'Drama', 'School Life', 'Comedy', 'Slice of Life', 'Idol', 'Fantasy', 'Mystery'],
  activeGenre,
  onGenreChange,
  xstyle,
}: SidebarProps) {
  const [quick, setQuick] = useState('For You');
  const [items, setItems] = useState(watchlist);
  const [genre, setGenre] = useState(activeGenre ?? genres[0]);
  const uid = useId();

  return (
    <motion.aside variants={staggerContainer(0.07, 0.1)} initial="hidden" animate="show" {...stylex.props(styles.rail, xstyle)}>
      <motion.div variants={fadeUp} {...stylex.props(styles.featured)}>
        <span {...stylex.props(styles.avatar)}>
          <Icon name="heart" size={16} />
        </span>
        <div {...stylex.props(styles.featuredText)}>
          <div {...stylex.props(styles.row)}>
            <strong {...stylex.props(styles.featuredName)}>{featured.name}</strong>
            <span {...stylex.props(styles.featuredBadge)}>{featured.badge}</span>
          </div>
          <span {...stylex.props(styles.small)}>{featured.subtitle}</span>
        </div>
        <motion.button type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }} {...stylex.props(styles.details)}>
          Details
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp} role="tablist" {...stylex.props(styles.quick)}>
        {quickTabs.map(([ic, label]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={quick === label}
            onClick={() => setQuick(label)}
            {...stylex.props(styles.quickTab, quick === label && styles.quickActive)}
          >
            {quick === label && <motion.span layoutId={`quick-${uid}`} transition={spring.layout} {...stylex.props(styles.quickPill)} />}
            <span {...stylex.props(styles.quickInner)}>
              <Icon name={ic} size={13} />
              {label}
            </span>
          </button>
        ))}
      </motion.div>

      <Card
        icon="play"
        iconTone={styles.red}
        title="Continue Watching"
        aside={<span {...stylex.props(styles.mono, styles.accent)}>{continueWatching.position} / {continueWatching.duration}</span>}
      >
        <ProgressBar value={continueWatching.percent} height={5} label="Watched" />
        <div {...stylex.props(styles.row)}>
          <span {...stylex.props(styles.mono, styles.muted)}>Watched:</span>
          <span {...stylex.props(styles.mono, styles.accent)}>{continueWatching.percent}%</span>
          <span {...stylex.props(styles.grow)} />
          <span {...stylex.props(styles.small)}>{continueWatching.title}</span>
        </div>
        <div {...stylex.props(styles.next)}>
          <Icon name="calendar" size={13} xstyle={styles.red} />
          <span {...stylex.props(styles.nextLabel)}>Next episode:</span>
          <span {...stylex.props(styles.nextValue)}>{continueWatching.nextEpisode}</span>
          <span {...stylex.props(styles.grow)} />
          <span {...stylex.props(styles.days)}>{continueWatching.nextIn}</span>
        </div>
      </Card>

      <Card icon="heart" iconTone={styles.pink} title="My Watchlist" aside={<span {...stylex.props(styles.small, styles.accent)}>{items.length} titles</span>}>
        {items.map((it, i) => (
          <label key={it.title} {...stylex.props(styles.item)}>
            <motion.input
              type="checkbox"
              whileTap={{ scale: 0.8 }}
              animate={it.done ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={spring.snappy}
              checked={it.done}
              onChange={() => setItems((prev) => prev.map((p, j) => (j === i ? { ...p, done: !p.done } : p)))}
              {...stylex.props(styles.checkbox)}
            />
            <span {...stylex.props(styles.itemText)}>
              <motion.span animate={{ opacity: it.done ? 0.55 : 1 }} {...stylex.props(styles.itemTitle, it.done && styles.itemDone)}>
                {it.title}
              </motion.span>
              <span {...stylex.props(styles.itemStatus)}>{it.status}</span>
            </span>
          </label>
        ))}
      </Card>

      <Card icon="tag" iconTone={styles.purple} title="Popular Genres">
        <div {...stylex.props(styles.chips)}>
          {genres.map((g) => (
            <Chip
              key={g}
              label={g}
              active={g === genre}
              onClick={() => {
                setGenre(g);
                onGenreChange?.(g);
              }}
            />
          ))}
        </div>
      </Card>
    </motion.aside>
  );
}

const styles = stylex.create({
  rail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    width: 380,
    flexShrink: 0,
    padding: 16,
    backgroundColor: colors.bgSidebar,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: colors.borderSubtle,
    fontFamily: fonts.body,
  },
  grow: { flexGrow: 1 },
  row: { display: 'flex', alignItems: 'center', gap: 6 },
  small: { fontSize: 12, fontWeight: 500, color: colors.textSecondary },
  mono: { fontFamily: fonts.mono, fontSize: 12, fontWeight: 700 },
  muted: { color: colors.textSecondary },
  accent: { color: colors.textAccent },
  red: { color: colors.red },
  pink: { color: colors.pink },
  purple: { color: colors.purple },
  featured: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBlock: 10,
    paddingInline: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
  },
  avatar: { display: 'inline-flex', padding: 9, borderRadius: radius.pill, backgroundColor: colors.chipPink, color: colors.pink },
  featuredText: { display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, minWidth: 0 },
  featuredName: { fontSize: 14, color: colors.textPrimary },
  featuredBadge: { paddingBlock: 2, paddingInline: 6, borderRadius: 4, backgroundColor: colors.chipRose, color: colors.textAccent, fontSize: 9, fontWeight: 700 },
  details: {
    paddingBlock: 6,
    paddingInline: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 700,
    color: colors.textPrimary,
    cursor: 'pointer',
  },
  quick: {
    display: 'flex',
    gap: 4,
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
  },
  quickTab: {
    position: 'relative',
    flexGrow: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingBlock: 8,
    borderWidth: 0,
    borderRadius: 10,
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  quickActive: { color: colors.textOnDark },
  quickPill: { position: 'absolute', inset: 0, borderRadius: 10, backgroundImage: 'linear-gradient(90deg, #e11d48, #ec4899)' },
  quickInner: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 5 },
  itemDone: { textDecorationLine: 'line-through', textDecorationColor: colors.textMuted },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 6 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary },
  next: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 8,
    paddingInline: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    fontSize: 11,
    fontWeight: 700,
  },
  nextLabel: { color: colors.textPrimary },
  nextValue: { color: colors.textIndigo },
  days: { paddingBlock: 2, paddingInline: 6, borderRadius: 4, backgroundColor: colors.chipIndigo, color: colors.textIndigo, fontSize: 10 },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBlock: 8,
    paddingInline: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    cursor: 'pointer',
  },
  checkbox: { width: 16, height: 16, margin: 0, accentColor: colors.red, cursor: 'pointer' },
  itemText: { display: 'flex', flexDirection: 'column', gap: 1 },
  itemTitle: { fontSize: 12, fontWeight: 700, color: colors.textPrimary },
  itemStatus: { fontSize: 10, fontWeight: 500, color: colors.textSecondary },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
});
