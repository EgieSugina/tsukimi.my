import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { spring } from '../../motion/motion';
import { colors, fonts, radius } from '../../tokens/tokens.stylex';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';

export interface Chapter {
  id: string;
  /** Display number, e.g. "128" or "12.5". */
  number: string;
  title: string;
  date: string;
  read?: boolean;
  isNew?: boolean;
  /** Locked / members-only chapter. */
  locked?: boolean;
}

export interface ChapterListProps {
  chapters: Chapter[];
  /** Chapter currently being read (highlighted). */
  currentId?: string;
  onSelect?: (chapter: Chapter) => void;
  /** Max height before the list scrolls. */
  maxHeight?: number;
  xstyle?: stylex.StyleXStyles;
}

/** Chapter list with search + newest/oldest sort (Watchlist-style rows). */
export function ChapterList({ chapters, currentId, onSelect, maxHeight = 520, xstyle }: ChapterListProps) {
  const [query, setQuery] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = chapters.filter((c) => !q || c.number.includes(q) || c.title.toLowerCase().includes(q));
    return newestFirst ? list : [...list].reverse();
  }, [chapters, query, newestFirst]);
  const readCount = chapters.filter((c) => c.read).length;

  return (
    <section {...stylex.props(styles.root, xstyle)}>
      <header {...stylex.props(styles.head)}>
        <Icon name="list" size={16} xstyle={styles.pink} />
        <h3 {...stylex.props(styles.title)}>Chapters</h3>
        <span {...stylex.props(styles.count)}>
          {readCount} / {chapters.length} read
        </span>
        <span {...stylex.props(styles.grow)} />
        <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={() => setNewestFirst((v) => !v)} {...stylex.props(styles.sort)}>
          <motion.span animate={{ rotate: newestFirst ? 90 : 270 }} transition={spring.snappy} {...stylex.props(styles.inline)}>
            <Icon name="arrowLeftRight" size={13} />
          </motion.span>
          {newestFirst ? 'Newest first' : 'Oldest first'}
        </motion.button>
      </header>
      <label {...stylex.props(styles.search)}>
        <Icon name="search" size={14} xstyle={styles.muted} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Go to chapter…"
          aria-label="Search chapters"
          {...stylex.props(styles.input)}
        />
      </label>
      <ul {...stylex.props(styles.list, dyn.maxHeight(maxHeight))}>
        <AnimatePresence mode="popLayout" initial={false}>
        {shown.map((c) => {
          const current = c.id === currentId;
          return (
            <motion.li
              key={c.id}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
              transition={spring.soft}
            >
              <button
                type="button"
                onClick={() => onSelect?.(c)}
                aria-current={current ? 'true' : undefined}
                {...stylex.props(styles.row, c.read && styles.read, current && styles.current)}
              >
                <span {...stylex.props(styles.num, current && styles.numCurrent)}>Ch. {c.number}</span>
                <span {...stylex.props(styles.chTitle)}>{c.title}</span>
                {c.isNew && <Badge tone="gradient">NEW</Badge>}
                {c.locked && <Badge tone="amber" icon="crown">VIP</Badge>}
                <span {...stylex.props(styles.date)}>{c.date}</span>
                {c.read && <Icon name="check" size={14} xstyle={styles.green} />}
              </button>
            </motion.li>
          );
        })}
        </AnimatePresence>
        {shown.length === 0 && <li {...stylex.props(styles.empty)}>No chapter matches “{query}”.</li>}
      </ul>
    </section>
  );
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    fontFamily: fonts.body,
  },
  head: { display: 'flex', alignItems: 'center', gap: 8 },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: colors.textPrimary },
  count: { fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: colors.textAccent },
  grow: { flexGrow: 1 },
  pink: { color: colors.pink },
  muted: { color: colors.textMuted },
  green: { color: colors.green },
  inline: { display: 'inline-flex' },
  sort: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 6,
    paddingInline: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  search: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingInline: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: { default: colors.borderSubtle, ':focus-within': colors.pink },
    backgroundColor: colors.surfaceSoft,
  },
  input: {
    flexGrow: 1,
    minWidth: 0,
    borderWidth: 0,
    outline: 'none',
    backgroundColor: 'transparent',
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none', overflowY: 'auto' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    transitionProperty: 'background-color, border-color, opacity',
    transitionDuration: '200ms',
    width: '100%',
    paddingBlock: 10,
    paddingInline: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: { default: colors.surfaceSoft, ':hover': colors.chipPink },
    textAlign: 'start',
    fontFamily: fonts.body,
    cursor: 'pointer',
  },
  read: { opacity: 0.65 },
  current: { opacity: 1, borderColor: colors.pink, borderWidth: 1.5, backgroundColor: colors.chipPink },
  num: { minWidth: 64, fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: colors.textPrimary },
  numCurrent: { color: colors.textAccent },
  chTitle: {
    flexGrow: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: 600,
    color: colors.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  date: { fontSize: 11, fontWeight: 500, color: colors.textSecondary, whiteSpace: 'nowrap' },
  empty: { padding: 12, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});

const dyn = stylex.create({
  maxHeight: (h: number) => ({ maxHeight: h }),
});
