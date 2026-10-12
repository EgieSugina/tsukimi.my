import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { ease, spring } from '../../motion/motion';
import { useDevice } from '../../device/device';
import { bp } from '../../tokens/breakpoints.stylex';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';

export interface AiringEntry {
  id: string;
  title: string;
  episode: number;
  /** ISO date-time of the broadcast/release, e.g. "2026-10-14T23:30:00+09:00". */
  airsAt: string;
  coverSrc?: string;
  /** e.g. "SUB", "DUB", "SUB+DUB" */
  version?: string;
  /** Season premiere / finale flags. */
  premiere?: boolean;
  finale?: boolean;
  /** Shown as a pink "followed" mark. */
  followed?: boolean;
}

export interface AiringCalendarProps {
  entries: AiringEntry[];
  /** Any date inside the week to show initially. Defaults to today. */
  initialDate?: Date;
  /** "now" used for aired / airing-soon state — override in tests & stories. */
  now?: Date;
  /** IANA timezone for display, e.g. "Asia/Jakarta". Defaults to the browser's. */
  timeZone?: string;
  /** Week starts on Monday (true) or Sunday (false). */
  weekStartsMonday?: boolean;
  onSelect?: (entry: AiringEntry) => void;
  onlyFollowedDefault?: boolean;
  xstyle?: stylex.StyleXStyles;
}

const DAY = 86_400_000;

function startOfWeek(d: Date, monday: boolean) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = monday ? (x.getDay() + 6) % 7 : x.getDay();
  return new Date(x.getTime() - offset * DAY);
}
/** Calendar column key (YYYY-MM-DD) for a plain local date. */
const localKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function countdown(ms: number) {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `in ${h}h ${m % 60}m` : `in ${Math.floor(h / 24)}d ${h % 24}h`;
}

/** Weekly airing schedule: 7 day columns, today highlighted, aired / soon / upcoming states. */
export function AiringCalendar({
  entries,
  initialDate,
  now = new Date(),
  timeZone,
  weekStartsMonday = true,
  onSelect,
  onlyFollowedDefault = false,
  xstyle,
}: AiringCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(initialDate ?? now, weekStartsMonday));
  const [onlyFollowed, setOnlyFollowed] = useState(onlyFollowedDefault);
  /** -1 = went back a week, 1 = forward — drives the slide direction. */
  const [dir, setDir] = useState(0);
  const shiftWeek = (d: number) => {
    setDir(d);
    setWeekStart((w) => new Date(w.getTime() + d * 7 * DAY));
  };

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY)), [weekStart]);
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }), [timeZone]);
  // column dates are plain calendar days, so format them without a timezone shift
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: 'short' }), []);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }), []);
  const tzLabel = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  // broadcast instants are bucketed by their calendar date *in the display timezone*
  const tzKeyFmt = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }), [timeZone]);
  const todayKey = tzKeyFmt.format(now);

  const byDay = useMemo(() => {
    const list = entries
      .filter((e) => !onlyFollowed || e.followed)
      .map((e) => ({ ...e, at: new Date(e.airsAt) }))
      .sort((a, b) => a.at.getTime() - b.at.getTime());
    return days.map((d) => list.filter((e) => tzKeyFmt.format(e.at) === localKey(d)));
  }, [entries, days, onlyFollowed, tzKeyFmt]);

  const total = byDay.reduce((n, d) => n + d.length, 0);

  // phones & tablets: one day at a time with a day picker
  const { isHandheld } = useDevice();
  const todayIdx = days.findIndex((d) => localKey(d) === todayKey);
  const [dayIdx, setDayIdx] = useState(todayIdx >= 0 ? todayIdx : 0);
  useEffect(() => setDayIdx(todayIdx >= 0 ? todayIdx : 0), [weekStart.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = isHandheld ? [dayIdx] : days.map((_, i) => i);
  const weekEnd = days[6];

  return (
    <section {...stylex.props(styles.root, xstyle)}>
      <header {...stylex.props(styles.header)}>
        <Icon name="calendar" size={20} xstyle={styles.pink} />
        <h2 {...stylex.props(styles.h2)}>Airing Schedule</h2>
        <span {...stylex.props(styles.range)}>
          {dateFmt.format(days[0])} – {dateFmt.format(weekEnd)}
        </span>
        <Badge tone="indigo">{total} episodes</Badge>
        <span {...stylex.props(styles.grow)} />
        <label {...stylex.props(styles.toggle)}>
          <input type="checkbox" checked={onlyFollowed} onChange={(e) => setOnlyFollowed(e.target.checked)} {...stylex.props(styles.checkbox)} />
          Followed only
        </label>
        <span {...stylex.props(styles.tz)}>
          <Icon name="globe" size={12} /> {tzLabel}
        </span>
        <div {...stylex.props(styles.nav)}>
          <button type="button" aria-label="Previous week" onClick={() => shiftWeek(-1)} {...stylex.props(styles.navBtn)}>
            <Icon name="chevronLeft" size={16} />
          </button>
          <button type="button" onClick={() => {
              const target = startOfWeek(now, weekStartsMonday);
              setDir(Math.sign(target.getTime() - weekStart.getTime()));
              setWeekStart(target);
            }} {...stylex.props(styles.navBtn, styles.todayBtn)}>
            This week
          </button>
          <button type="button" aria-label="Next week" onClick={() => shiftWeek(1)} {...stylex.props(styles.navBtn)}>
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </header>

      {isHandheld && (
        <div role="tablist" aria-label="Day" {...stylex.props(styles.dayPicker)}>
          {days.map((d, i) => {
            const on = i === dayIdx;
            return (
              <motion.button
                key={d.toISOString()}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setDayIdx(i)}
                whileTap={{ scale: 0.94 }}
                {...stylex.props(styles.dayChip, on && styles.dayChipOn)}
              >
                {on && <motion.span layoutId="air-day" transition={spring.layout} {...stylex.props(styles.dayChipPill)} />}
                <span {...stylex.props(styles.dayChipInner)}>
                  <span {...stylex.props(styles.dayName)}>{dayFmt.format(d)}</span>
                  <span {...stylex.props(styles.dayDate)}>{d.getDate()}</span>
                  <span {...stylex.props(styles.dayCount)}>{byDay[i].length}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
      <div {...stylex.props(styles.viewport)}>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.div
        key={isHandheld ? `${weekStart.toISOString()}-${dayIdx}` : weekStart.toISOString()}
        custom={dir}
        variants={{
          enter: (d: number) => ({ opacity: 0, x: d * 40 }),
          center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: ease.out, staggerChildren: 0.04 } },
          exit: (d: number) => ({ opacity: 0, x: d * -40, transition: { duration: 0.18 } }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        {...stylex.props(styles.grid, isHandheld && styles.gridSingle)}
      >
        {shown.map((i) => {
          const d = days[i];
          const today = localKey(d) === todayKey;
          return (
            <motion.div
              key={d.toISOString()}
              variants={{ enter: { opacity: 0, y: 10 }, center: { opacity: 1, y: 0 } }}
              {...stylex.props(styles.col, today && styles.colToday)}
            >
              <div {...stylex.props(styles.dayHead, today && styles.dayHeadToday)}>
                <span {...stylex.props(styles.dayName)}>{dayFmt.format(d)}</span>
                <span {...stylex.props(styles.dayDate)}>{dateFmt.format(d)}</span>
                {today && <span {...stylex.props(styles.todayTag)}>TODAY</span>}
              </div>
              <ul {...stylex.props(styles.list)}>
                {byDay[i].length === 0 && <li {...stylex.props(styles.empty)}>No episodes</li>}
                <AnimatePresence initial={false}>
                {byDay[i].map((e) => {
                  const diff = e.at.getTime() - now.getTime();
                  const state = diff <= 0 ? 'aired' : diff < 3 * 3_600_000 ? 'soon' : 'upcoming';
                  return (
                    <motion.li key={e.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={spring.soft}>
                      <motion.button
                        type="button"
                        onClick={() => onSelect?.(e)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={spring.snappy}
                        {...stylex.props(styles.entry, entryTone[state], e.followed && styles.followed)}
                      >
                        <span {...stylex.props(styles.entryTop)}>
                          <span {...stylex.props(styles.time)}>{timeFmt.format(e.at)}</span>
                          <span {...stylex.props(styles.grow)} />
                          {e.followed && <Icon name="heart" size={12} xstyle={styles.pink} />}
                        </span>
                        <span {...stylex.props(styles.entryBody)}>
                          <span {...stylex.props(styles.thumb)}>
                            {e.coverSrc ? <img src={e.coverSrc} alt="" {...stylex.props(styles.thumbImg)} /> : <Icon name="tv" size={14} />}
                          </span>
                          <span {...stylex.props(styles.entryText)}>
                            <span {...stylex.props(styles.title)}>{e.title}</span>
                            <span {...stylex.props(styles.ep)}>
                              EP {e.episode}
                              {e.version ? ` · ${e.version}` : ''}
                            </span>
                          </span>
                        </span>
                        <span {...stylex.props(styles.tags)}>
                          {state === 'aired' && <Badge tone="green" icon="check">Aired</Badge>}
                          {state === 'soon' && <Badge tone="orange" icon="clock">{countdown(diff)}</Badge>}
                          {state === 'upcoming' && <Badge tone="neutral" icon="clock">{countdown(diff)}</Badge>}
                          {e.premiere && <Badge tone="gradient">PREMIERE</Badge>}
                          {e.finale && <Badge tone="solidRed">FINALE</Badge>}
                        </span>
                      </motion.button>
                    </motion.li>
                  );
                })}
                </AnimatePresence>
              </ul>
            </motion.div>
          );
        })}
      </motion.div>
      </AnimatePresence>
      </div>
    </section>
  );
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    fontFamily: fonts.body,
    color: colors.textPrimary,
  },
  header: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  h2: { margin: 0, fontSize: { default: 22, [bp.mobile]: 18 }, fontWeight: 800 },
  range: { fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: colors.textAccent },
  pink: { color: colors.pink },
  grow: { flexGrow: 1 },
  toggle: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: colors.textSecondary, cursor: 'pointer' },
  checkbox: { accentColor: colors.pink },
  tz: { display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, color: colors.textMuted },
  nav: { display: 'inline-flex', gap: 4 },
  navBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    paddingBlock: 6,
    paddingInline: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: { default: colors.surfaceSoft, ':hover': colors.chipPink },
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  todayBtn: { paddingInline: 12 },
  viewport: { overflow: 'hidden' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: 8, overflowX: 'auto' },
  gridSingle: { gridTemplateColumns: 'minmax(0, 1fr)' },
  dayPicker: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollSnapType: 'x mandatory' },
  dayChip: {
    position: 'relative',
    flexShrink: 0,
    minWidth: { default: 72, [bp.mobile]: 58 },
    paddingBlock: 8,
    paddingInline: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    cursor: 'pointer',
    scrollSnapAlign: 'start',
  },
  dayChipOn: { borderColor: colors.pink, color: '#ffffff' },
  dayChipPill: { position: 'absolute', inset: -1, borderRadius: 12, backgroundImage: gradients.pinkRose },
  dayChipInner: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  dayCount: { fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, opacity: 0.8 },
  col: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, padding: 6, borderRadius: 12, backgroundColor: colors.surfaceSoft },
  colToday: { backgroundColor: colors.chipPink, boxShadow: 'inset 0 0 0 1.5px #ec4899' },
  dayHead: { display: 'flex', alignItems: 'baseline', gap: 6, paddingBlock: 6, paddingInline: 8, borderRadius: 8 },
  dayHeadToday: { backgroundImage: gradients.pinkRose, color: '#ffffff' },
  dayName: { fontSize: 14, fontWeight: 800 },
  dayDate: { fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, opacity: 0.8 },
  todayTag: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 10, fontWeight: 700 },
  list: { display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none' },
  empty: { paddingBlock: 16, textAlign: 'center', fontSize: 12, color: colors.textMuted },
  entry: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    backgroundColor: colors.surfaceStrong,
    color: colors.textPrimary,
    textAlign: 'start',
    fontFamily: fonts.body,
    cursor: 'pointer',
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: '200ms',
    boxShadow: { default: null, ':hover': shadows.card },
  },
  followed: { borderLeftWidth: 3, borderLeftColor: colors.pink },
  entryTop: { display: 'flex', alignItems: 'center' },
  time: { fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: colors.textAccent },
  entryBody: { display: 'flex', gap: 8, alignItems: 'center' },
  thumb: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 36,
    height: 50,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundImage: gradients.placeholderCover,
    color: '#ffffff',
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  entryText: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  title: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  ep: { fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, color: colors.textSecondary },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 4 },
});

const entryTone = stylex.create({
  aired: { borderColor: colors.borderSubtle, opacity: 0.75 },
  soon: { borderColor: colors.amber },
  upcoming: { borderColor: colors.borderSubtle },
});
