import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useId, useState } from 'react';
import { fadeUp, pop, spring, staggerContainer } from '../../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Badge, type BadgeTone } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Icon, type IconName } from '../Icon/Icon';
import { MediaFrame } from '../MediaFrame/MediaFrame';
import { ProgressBar } from '../ProgressBar/ProgressBar';

export interface CastStat {
  label: string;
  icon: IconName;
  grade: string;
  value: string;
  /** 0–100 */
  percent: number;
  color: string;
}

export interface CastTile {
  label: string;
  icon: IconName;
  value: string;
  tone: 'green' | 'amber' | 'rose' | 'purple';
}

export interface CastTag {
  label: string;
  tone: BadgeTone;
  icon?: IconName;
}

export interface CastRosterCardProps {
  name: string;
  castId: string;
  videoCount: string;
  bio: string;
  rankNo?: string;
  status?: 'active' | 'hiatus';
  tags?: CastTag[];
  stats?: CastStat[];
  tiles?: CastTile[];
  /** Pills on the photo (bottom-left), e.g. Debut 2024 / Trending. */
  photoBadges?: CastTag[];
  photoSrc?: string;
  favorite?: boolean;
  onProfile?: () => void;
  onFollow?: () => void;
  onWatch?: () => void;
  xstyle?: stylex.StyleXStyles;
}

const defaultStats: CastStat[] = [
  { label: 'Popularity', icon: 'heart', grade: 'A', value: '9,630', percent: 86, color: '#f43f5e' },
  { label: 'Acting', icon: 'sparkles', grade: 'B', value: '8,020', percent: 70, color: '#a855f7' },
  { label: 'Visual', icon: 'star', grade: 'A', value: '9,100', percent: 82, color: '#ec4899' },
  { label: 'Fan Engagement', icon: 'flame', grade: 'S', value: '10,000', percent: 100, color: '#10b981' },
];
const defaultTiles: CastTile[] = [
  { label: 'Views', icon: 'eye', value: '2.4M', tone: 'green' },
  { label: 'Likes', icon: 'heart', value: '96%', tone: 'amber' },
  { label: 'Followers', icon: 'user', value: '128K', tone: 'rose' },
  { label: 'Rating', icon: 'star', value: '4.9', tone: 'purple' },
];
const defaultTags: CastTag[] = [
  { label: 'Actress', tone: 'solidPink', icon: 'heart' },
  { label: 'Rank 2', tone: 'solidRed' },
  { label: 'SP 1385', tone: 'solidIndigo' },
  { label: 'Romance', tone: 'pink' },
];
const defaultPhotoBadges: CastTag[] = [
  { label: 'Debut 2024', tone: 'neutral' },
  { label: 'Trending', tone: 'orange', icon: 'flame' },
  { label: 'Top 10', tone: 'gradient', icon: 'heart' },
  { label: 'Exclusive', tone: 'emerald', icon: 'crown' },
];
const tabs: [IconName, string][] = [
  ['grid', 'Stats'],
  ['film', 'Videos'],
  ['user', 'Profile'],
  ['heart', 'Fans'],
];

/** Cast directory card modeled on the in-game Cast Roster card. Photo 250 × 351. */
export function CastRosterCard({
  name,
  castId,
  videoCount,
  bio,
  rankNo,
  status = 'active',
  tags = defaultTags,
  stats = defaultStats,
  tiles = defaultTiles,
  photoBadges = defaultPhotoBadges,
  photoSrc,
  favorite = true,
  onProfile,
  onFollow,
  onWatch,
  xstyle,
}: CastRosterCardProps) {
  const [tab, setTab] = useState('Stats');
  const uid = useId();
  const active = status === 'active';

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      whileHover={{ y: -3 }}
      transition={spring.soft}
      {...stylex.props(styles.card, !active && styles.inactive, xstyle)}
    >
      <MediaFrame kind="photo" src={photoSrc} alt={name}>
        <Badge tone="solidPink" icon="sparkles" xstyle={styles.tl}>Actress</Badge>
        <Badge tone="dark" icon="film" xstyle={styles.tr}>{videoCount}</Badge>
        <div {...stylex.props(styles.photoBadges)}>
          {photoBadges.map((b) => (
            <Badge key={b.label} tone={b.tone} icon={b.icon} shape="tag">{b.label}</Badge>
          ))}
        </div>
      </MediaFrame>

      <div {...stylex.props(styles.info)}>
        <div {...stylex.props(styles.head)}>
          <h3 {...stylex.props(styles.name)}>{name}</h3>
          {favorite && (
            <span {...stylex.props(styles.star)} aria-label="Favorite">
              <Icon name="star" size={14} />
            </span>
          )}
          {rankNo && <Badge tone="solidRed" icon="crown" size="md" shape="tag">{rankNo}</Badge>}
          <span {...stylex.props(styles.grow)} />
          <span {...stylex.props(styles.status, active ? styles.statusOn : styles.statusOff)}>
            {active ? (
              <motion.span
                animate={{ rotate: [0, 18, -12, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
                {...stylex.props(styles.inline)}
              >
                <Icon name="sparkles" size={16} />
              </motion.span>
            ) : (
              <Icon name="sparkles" size={16} />
            )}
            {active ? 'ACTIVE' : 'ON HIATUS'}
          </span>
        </div>

        <div {...stylex.props(styles.tags)}>
          {tags.map((t) => (
            <Badge key={t.label} tone={t.tone} icon={t.icon} shape="tag">{t.label}</Badge>
          ))}
          <span {...stylex.props(styles.grow)} />
          <span {...stylex.props(styles.id)}>{castId}</span>
        </div>

        <div {...stylex.props(styles.bio)}>
          <Icon name="sparkles" size={14} xstyle={styles.amber} />
          <strong {...stylex.props(styles.bioLabel)}>Bio:</strong>
          <span {...stylex.props(styles.bioText)}>{bio}</span>
        </div>

        <div role="tablist" {...stylex.props(styles.tabs)}>
          {tabs.map(([ic, label]) => (
            <button
              key={label}
              role="tab"
              type="button"
              aria-selected={tab === label}
              onClick={() => setTab(label)}
              {...stylex.props(styles.tab, tab === label && styles.tabActive)}
            >
              {tab === label && <motion.span layoutId={`crc-tab-${uid}`} transition={spring.layout} {...stylex.props(styles.tabPill)} />}
              <span {...stylex.props(styles.tabInner)}>
                <Icon name={ic} size={14} />
                {label}
              </span>
            </button>
          ))}
        </div>

        <div {...stylex.props(styles.body)}>
          <div {...stylex.props(styles.bars)}>
            {stats.map((s) => (
              <div key={s.label} {...stylex.props(styles.bar)}>
                <div {...stylex.props(styles.barTop)}>
                  <Icon name={s.icon} size={13} xstyle={styles.red} />
                  <span {...stylex.props(styles.barLabel)}>{s.label}</span>
                  <span {...stylex.props(styles.grade)}>{s.grade}</span>
                  <span {...stylex.props(styles.barValue)}>{s.value}</span>
                </div>
                <ProgressBar value={s.percent} color={s.color} label={s.label} />
              </div>
            ))}
          </div>
          <motion.div
            variants={staggerContainer(0.06, 0.15)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            {...stylex.props(styles.tiles)}
          >
            {tiles.map((t) => (
              <motion.div key={t.label} variants={pop} whileHover={{ y: -2 }} {...stylex.props(styles.tile, tileTones[t.tone])}>
                <span {...stylex.props(styles.tileLabel)}>
                  <Icon name={t.icon} size={11} />
                  {t.label}
                </span>
                <span {...stylex.props(styles.tileValue)}>{t.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div {...stylex.props(styles.actions)}>
          <Button variant="outline" size="sm" icon="user" fullWidth onClick={onProfile}>Profile</Button>
          <Button variant="soft" size="sm" icon="heart" fullWidth onClick={onFollow}>Follow</Button>
          <Button variant="primary" size="sm" icon="play" fullWidth onClick={onWatch} xstyle={styles.watch}>Watch</Button>
        </div>
      </div>
    </motion.article>
  );
}

const styles = stylex.create({
  card: {
    display: 'flex',
    width: { default: 760, [bp.belowLaptop]: '100%' },
    minHeight: { default: 351, [bp.mobile]: 0 },
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: colors.borderPink,
    backgroundColor: colors.surfaceStrong,
    boxShadow: { default: shadows.card, ':hover': shadows.glass },
    transitionProperty: 'box-shadow',
    transitionDuration: '250ms',
    fontFamily: fonts.body,
  },
  inactive: { opacity: 0.6, filter: 'grayscale(0.6)' },
  tl: { position: 'absolute', top: 10, left: 10 },
  tr: { position: 'absolute', top: 10, right: 10 },
  photoBadges: { position: 'absolute', left: 10, right: 10, bottom: 10, display: { default: 'flex', [bp.mobile]: 'none' }, flexWrap: 'wrap', gap: 6 },
  info: { display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1, minWidth: 0, paddingBlock: 12, paddingInline: { default: 16, [bp.mobile]: 10 } },
  head: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  name: { margin: 0, fontSize: { default: 22, [bp.mobile]: 17 }, fontWeight: 800, color: colors.textAccent, whiteSpace: { default: 'nowrap', [bp.mobile]: 'normal' } },
  star: { display: 'inline-flex', padding: 5, borderRadius: radius.xs, backgroundImage: gradients.orange, color: colors.textOnDark },
  grow: { flexGrow: 1 },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 6,
    paddingInline: 14,
    borderRadius: radius.sm,
    fontSize: 16,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  statusOn: { backgroundImage: gradients.emerald, color: colors.textOnDark },
  statusOff: { backgroundColor: colors.surfaceSoft, color: colors.textMuted, borderWidth: 1, borderStyle: 'solid', borderColor: colors.borderSubtle },
  tags: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  id: { fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: colors.textSecondary },
  bio: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 6,
    paddingInline: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.chipAmber,
    backgroundColor: colors.chipAmber,
  },
  amber: { color: colors.amber },
  bioLabel: { fontSize: 14, color: colors.textAmber },
  bioText: { flexGrow: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: colors.textPrimary, whiteSpace: { default: 'nowrap', [bp.mobile]: 'normal' }, overflow: 'hidden', textOverflow: 'ellipsis' },
  tabs: { display: { default: 'flex', [bp.mobile]: 'none' }, gap: 6, flexWrap: 'wrap' },
  tab: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 6,
    paddingInline: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabActive: { borderColor: colors.pink, color: colors.textOnDark },
  tabPill: { position: 'absolute', inset: -1, borderRadius: radius.sm, backgroundColor: colors.pink },
  tabInner: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 },
  inline: { display: 'inline-flex' },
  body: { display: { default: 'flex', [bp.mobile]: 'none' }, gap: 12, flexWrap: { default: 'nowrap', [bp.tablet]: 'wrap' } },
  bars: { display: 'flex', flexDirection: 'column', gap: 7, flexGrow: 1, minWidth: 0 },
  bar: { display: 'flex', flexDirection: 'column', gap: 3 },
  barTop: { display: 'flex', alignItems: 'center', gap: 6 },
  red: { color: colors.red },
  barLabel: { flexGrow: 1, fontSize: 13, fontWeight: 700, color: colors.textPrimary },
  grade: { paddingInline: 4, borderRadius: 4, backgroundColor: colors.surfaceSoft, color: colors.textAccent, fontSize: 11, fontWeight: 700 },
  barValue: { fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.textPrimary },
  tiles: { display: 'grid', gridTemplateColumns: 'repeat(2, 108px)', gap: 8, alignContent: 'start' },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingBlock: 8,
    paddingInline: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  tileLabel: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700 },
  tileValue: { fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: colors.textPrimary },
  actions: { display: 'flex', gap: 8, marginTop: { default: 0, [bp.mobile]: 'auto' } },
  watch: { boxShadow: 'none', backgroundImage: gradients.pinkRose },
});

const tileTones = stylex.create({
  green: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: colors.textGreen },
  amber: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: colors.textAmber },
  rose: { backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)', color: colors.textAccent },
  purple: { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', color: colors.purple },
});
