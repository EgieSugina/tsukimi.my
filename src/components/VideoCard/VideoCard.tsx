import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useId, useState } from 'react';
import { fadeUp, spring } from '../../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Badge } from '../Badge/Badge';
import { Icon, type IconName } from '../Icon/Icon';
import { MediaFrame } from '../MediaFrame/MediaFrame';

export interface VideoAttributes {
  views: string;
  rating: string;
  genre: string;
  released: string;
}

export interface VideoCardProps {
  title: string;
  cast: string;
  views: string;
  subtitle: string;
  duration: string;
  synopsis: string;
  attributes: VideoAttributes;
  quality?: string;
  /** Corner tag, e.g. NEW / HOT / FREE / 4K. */
  tag?: string;
  coverSrc?: string;
  selected?: boolean;
  onPlay?: () => void;
  xstyle?: stylex.StyleXStyles;
}

const tabs: { id: 'info' | 'cast' | 'tags'; label: string; icon: IconName }[] = [
  { id: 'info', label: 'Info', icon: 'grid' },
  { id: 'cast', label: 'Cast', icon: 'user' },
  { id: 'tags', label: 'Tags', icon: 'tag' },
];

/** Library/grid card modeled on the Guest List card: 250 × 351 cover left, info right. */
export function VideoCard({
  title,
  cast,
  views,
  subtitle,
  duration,
  synopsis,
  attributes,
  quality = 'FULL HD',
  tag,
  coverSrc,
  selected = false,
  onPlay,
  xstyle,
}: VideoCardProps) {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('info');
  const uid = useId();
  const rows: [IconName, string, string][] = [
    ['eye', 'Views', attributes.views],
    ['star', 'Rating', attributes.rating],
    ['tag', 'Genre', attributes.genre],
    ['calendar', 'Released', attributes.released],
  ];

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      whileHover={{ y: -3 }}
      transition={spring.soft}
      {...stylex.props(styles.card, selected && styles.selected, xstyle)}
    >
      <MediaFrame src={coverSrc} alt={title}>
        <Badge tone="dark" xstyle={styles.tl}>{quality}</Badge>
        {tag && <Badge tone="amber" xstyle={styles.tr}>{tag}</Badge>}
        <motion.button type="button" onClick={onPlay} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring.snappy} {...stylex.props(styles.playBar)}>
          <Icon name="play" size={12} />
          {duration}
        </motion.button>
      </MediaFrame>

      <div {...stylex.props(styles.info)}>
        <div {...stylex.props(styles.head)}>
          <h3 {...stylex.props(styles.title)}>{title}</h3>
          <span {...stylex.props(styles.views)}>{views}</span>
        </div>
        <Badge tone="gradient">★ {cast}</Badge>
        <span {...stylex.props(styles.subtitle)}>{subtitle}</span>

        <div role="tablist" {...stylex.props(styles.tabs)}>
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              {...stylex.props(styles.tab, tab === t.id && styles.tabActive)}
            >
              {tab === t.id && <motion.span layoutId={`vc-tab-${uid}`} transition={spring.layout} {...stylex.props(styles.tabPill)} />}
              <span {...stylex.props(styles.tabInner)}>
                <Icon name={t.icon} size={12} />
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <div {...stylex.props(styles.synopsisBox)}>
          <span {...stylex.props(styles.synopsisHead)}>
            <Icon name="sparkles" size={14} xstyle={styles.red} />
            Synopsis:
          </span>
          <p {...stylex.props(styles.synopsis)}>{synopsis}</p>
        </div>

        <dl {...stylex.props(styles.attrs)}>
          {rows.map(([icon, k, v]) => (
            <div key={k} {...stylex.props(styles.attr)}>
              <Icon name={icon} size={12} />
              <dt {...stylex.props(styles.dt)}>{k}:</dt>
              <dd {...stylex.props(styles.dd)}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.article>
  );
}

const styles = stylex.create({
  card: {
    display: 'flex',
    width: { default: 470, [bp.mobile]: '100%' },
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: '250ms',
    minHeight: { default: 351, [bp.mobile]: 0 },
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    boxShadow: { default: shadows.card, ':hover': shadows.glass },
    fontFamily: fonts.body,
  },
  selected: { borderWidth: 2, borderColor: colors.pink },
  tl: { position: 'absolute', top: 10, left: 10 },
  tr: { position: 'absolute', top: 10, right: 10 },
  playBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundImage: gradients.pinkRose,
    color: colors.textOnDark,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    filter: { default: null, ':hover': 'brightness(1.08)' },
  },
  info: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, flexGrow: 1, minWidth: 0, padding: { default: 14, [bp.mobile]: 10 } },
  head: { display: 'flex', alignItems: 'center', gap: 6, width: '100%' },
  title: {
    margin: 0,
    flexGrow: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: 700,
    color: colors.textPrimary,
    whiteSpace: { default: 'nowrap', [bp.mobile]: 'normal' },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  views: { fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: colors.textAccent },
  subtitle: { fontSize: 12, fontWeight: 500, color: colors.textSecondary },
  tabs: {
    display: { default: 'flex', [bp.mobile]: 'none' },
    gap: 4,
    width: '100%',
    paddingBlock: 5,
    paddingInline: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
  },
  tab: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    paddingBlock: 3,
    paddingInline: 6,
    borderWidth: 0,
    borderRadius: radius.xs,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabActive: { color: colors.textAccent },
  tabPill: { position: 'absolute', inset: 0, borderRadius: radius.xs, backgroundColor: colors.chipPink },
  tabInner: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 },
  synopsisBox: { display: { default: 'flex', [bp.mobile]: 'none' }, flexDirection: 'column', gap: 4, width: '100%', padding: 10, borderRadius: 10, backgroundColor: colors.chipRose },
  synopsisHead: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: colors.textAccent },
  red: { color: colors.red },
  synopsis: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    fontStyle: 'italic',
    lineHeight: 1.5,
    color: colors.textPrimary,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  attrs: { display: { default: 'flex', [bp.mobile]: 'none' }, flexDirection: 'column', gap: 6, margin: 0 },
  attr: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSecondary },
  dt: { fontWeight: 500 },
  dd: { margin: 0, fontWeight: 700, color: colors.textPrimary },
});
