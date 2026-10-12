import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ease, pop, spring } from '../../motion/motion';
import { useDevice } from '../../device/device';
import { bp } from '../../tokens/breakpoints.stylex';
import { colors, fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { Badge } from '../Badge/Badge';
import type { Chapter } from '../ChapterList/ChapterList';
import type { ComicFormat } from '../ComicCard/ComicCard';
import { Icon, type IconName } from '../Icon/Icon';

export interface ComicPage {
  /** Image URL. Without one a numbered placeholder panel is drawn. */
  src?: string;
  /** Intrinsic size, used for the placeholder aspect ratio. */
  width?: number;
  height?: number;
}

export type ReadingMode = 'vertical' | 'paged';
export type ReadingDirection = 'rtl' | 'ltr';
export type PageFit = 'width' | 'height';

export interface ComicReaderProps {
  comicTitle: string;
  format: ComicFormat;
  chapters: Chapter[];
  currentChapterId: string;
  pages: ComicPage[];
  /** Defaults: manga → paged + rtl, manhwa/manhua → vertical. */
  initialMode?: ReadingMode;
  initialDirection?: ReadingDirection;
  initialSpread?: 'single' | 'double';
  /** Start on this page (0-based), e.g. resume position. */
  initialPage?: number;
  onBack?: () => void;
  onChapterChange?: (chapterId: string) => void;
  /** Fires whenever the visible page changes — persist reading progress here. */
  onPageChange?: (page: number, total: number) => void;
  /** Height of the reader viewport. Defaults to the full window. */
  height?: number | string;
  xstyle?: stylex.StyleXStyles;
}

/**
 * Comic reader for manga & manhwa.
 * - **Vertical** (webtoon): continuous scroll, gap-less strips — default for manhwa.
 * - **Paged**: one/two pages per view, click/arrow-key navigation, RTL by default for manga.
 * Click the middle of the page to hide/show the toolbars.
 */
export function ComicReader({
  comicTitle,
  format,
  chapters,
  currentChapterId,
  pages,
  initialMode = format === 'manga' ? 'paged' : 'vertical',
  initialDirection = format === 'manga' ? 'rtl' : 'ltr',
  initialSpread = 'single',
  initialPage = 0,
  onBack,
  onChapterChange,
  onPageChange,
  height = '100vh',
  xstyle,
}: ComicReaderProps) {
  const [mode, setMode] = useState<ReadingMode>(initialMode);
  const [direction, setDirection] = useState<ReadingDirection>(initialDirection);
  const [spread, setSpread] = useState(initialSpread);
  const { device } = useDevice();
  // phones are too narrow for two-page spreads
  const twoUp = spread === 'double' && device !== 'mobile';
  const [fit, setFit] = useState<PageFit>(initialMode === 'paged' ? 'height' : 'width');
  const [page, setPage] = useState(initialPage);
  const [uiVisible, setUiVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** 1 = turned forward, -1 = back — drives the page-turn slide direction. */
  const [navDir, setNavDir] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const total = pages.length;
  const step = mode === 'paged' && twoUp ? 2 : 1;
  const chapterIndex = chapters.findIndex((c) => c.id === currentChapterId);
  const chapter = chapters[chapterIndex];
  // chapters are listed newest first → "next" chapter is the previous array item
  const nextChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : undefined;
  const prevChapter = chapterIndex >= 0 && chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : undefined;
  const atEnd = page >= total; // page === total → end-of-chapter card

  useEffect(() => {
    if (page < total) onPageChange?.(page, total);
  }, [page, total, onPageChange]);

  // reset when chapter changes
  useEffect(() => {
    setPage(0);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [currentChapterId]);

  const goTo = useCallback(
    (p: number) => {
      const clamped = Math.max(0, Math.min(total, p));
      setNavDir(Math.sign(clamped - page));
      setPage(clamped);
      if (mode === 'vertical') {
        const el = clamped >= total ? scrollRef.current?.lastElementChild : pageRefs.current[clamped];
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [mode, total, page],
  );
  const forward = useCallback(() => goTo(page + step), [goTo, page, step]);
  const backward = useCallback(() => goTo(page - step), [goTo, page, step]);

  // keyboard: arrows follow reading direction in paged mode; space/PageDown always forward
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') (mode === 'paged' && direction === 'rtl' ? backward : forward)();
      else if (e.key === 'ArrowLeft') (mode === 'paged' && direction === 'rtl' ? forward : backward)();
      else if (mode === 'paged' && (e.key === ' ' || e.key === 'PageDown')) {
        e.preventDefault();
        forward();
      } else if (e.key === 'Escape') setSettingsOpen(false);
      else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, direction, forward, backward]);

  // vertical mode: derive current page from scroll position
  const onScroll = () => {
    if (mode !== 'vertical' || !scrollRef.current) return;
    const top = scrollRef.current.scrollTop + scrollRef.current.clientHeight * 0.35;
    let idx = 0;
    pageRefs.current.forEach((el, i) => {
      if (el && el.offsetTop <= top) idx = i;
    });
    const nearBottom = scrollRef.current.scrollTop + scrollRef.current.clientHeight >= scrollRef.current.scrollHeight - 8;
    setPage(nearBottom ? total : idx);
  };

  const changeMode = (m: ReadingMode) => {
    setMode(m);
    setFit(m === 'paged' ? 'height' : 'width');
    requestAnimationFrame(() => pageRefs.current[Math.min(page, total - 1)]?.scrollIntoView({ block: 'start' }));
  };

  const goChapter = (c?: Chapter) => c && onChapterChange?.(c.id);

  const endCard = (
    <motion.div variants={pop} initial="hidden" animate="show" {...stylex.props(styles.endCard)}>
      <Icon name="sparkles" size={28} xstyle={styles.pink} />
      <strong {...stylex.props(styles.endTitle)}>End of Chapter {chapter?.number}</strong>
      <span {...stylex.props(styles.endSub)}>{nextChapter ? `Up next: Ch. ${nextChapter.number} — ${nextChapter.title}` : 'You’re all caught up!'}</span>
      <div {...stylex.props(styles.row)}>
        {prevChapter && (
          <ReaderButton icon="chevronLeft" onClick={() => goChapter(prevChapter)}>Previous</ReaderButton>
        )}
        {nextChapter ? (
          <ReaderButton icon="chevronRight" primary onClick={() => goChapter(nextChapter)}>Next Chapter</ReaderButton>
        ) : (
          <ReaderButton icon="list" primary onClick={onBack}>Back to series</ReaderButton>
        )}
      </div>
    </motion.div>
  );

  // pages shown in paged mode
  const visible: number[] = [];
  if (mode === 'paged' && !atEnd) {
    visible.push(page);
    if (twoUp && page + 1 < total) visible.push(page + 1);
    if (direction === 'rtl') visible.reverse();
  }

  return (
    <div {...stylex.props(styles.root, dyn.height(height), xstyle)} data-mode={mode} data-own-arrows="">
      {/* ---------- top toolbar ---------- */}
      <motion.header
        initial={false}
        animate={uiVisible ? { y: 0, opacity: 1 } : { y: '-100%', opacity: 0 }}
        transition={{ duration: 0.25, ease: ease.out }}
        {...stylex.props(styles.toolbar, styles.top, !uiVisible && styles.noPointer)}
      >
        <ToolIcon icon="chevronLeft" label="Back" onClick={onBack} />
        <div {...stylex.props(styles.titleBlock)}>
          <span {...stylex.props(styles.comicTitle)}>{comicTitle}</span>
          <span {...stylex.props(styles.chapterTitle)}>
            Ch. {chapter?.number} — {chapter?.title}
          </span>
        </div>
        <span {...stylex.props(styles.hideMobile)}>
        <Badge tone={format === 'manga' ? 'solidRed' : format === 'manhwa' ? 'solidIndigo' : 'emerald'}>{format.toUpperCase()}</Badge>
        </span>
        <span {...stylex.props(styles.grow)} />
        <span {...stylex.props(styles.hideMobile)}>
          <ToolIcon icon="chevronLeft" label="Previous chapter" disabled={!prevChapter} onClick={() => goChapter(prevChapter)} />
        </span>
        <select
          aria-label="Chapter"
          value={currentChapterId}
          onChange={(e) => onChapterChange?.(e.target.value)}
          {...stylex.props(styles.chapterSelect)}
        >
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              Ch. {c.number} — {c.title}
            </option>
          ))}
        </select>
        <span {...stylex.props(styles.hideMobile)}>
          <ToolIcon icon="chevronRight" label="Next chapter" disabled={!nextChapter} onClick={() => goChapter(nextChapter)} />
        </span>
        <span {...stylex.props(styles.divider)} />
        <Segmented
          label="Reading mode"
          value={mode}
          onChange={changeMode}
          options={[
            ['vertical', 'rows', 'Vertical'],
            ['paged', 'columns', 'Paged'],
          ]}
        />
        <ToolIcon icon="settings" label="Reader settings" active={settingsOpen} onClick={() => setSettingsOpen((v) => !v)} />
      </motion.header>

      <AnimatePresence>
      {settingsOpen && (
        <motion.div
          variants={pop}
          initial="hidden"
          animate="show"
          exit="exit"
          style={{ transformOrigin: 'top right' }}
          {...stylex.props(styles.settings)}
          role="dialog"
          aria-label="Reader settings"
        >
          <SettingRow label="Page fit">
            <Segmented label="Page fit" value={fit} onChange={setFit} options={[['width', 'maximize', 'Fit width'], ['height', 'rows', 'Fit height']]} />
          </SettingRow>
          <SettingRow label="Direction" hint={mode === 'vertical' ? 'Paged mode only' : undefined}>
            <Segmented
              label="Direction"
              value={direction}
              onChange={setDirection}
              disabled={mode === 'vertical'}
              options={[['rtl', 'arrowLeftRight', 'Right → Left'], ['ltr', 'arrowLeftRight', 'Left → Right']]}
            />
          </SettingRow>
          <SettingRow label="Pages per view" hint={mode === 'vertical' ? 'Paged mode only' : undefined}>
            <Segmented
              label="Pages per view"
              value={spread}
              onChange={setSpread}
              disabled={mode === 'vertical'}
              options={[['single', 'columns', 'Single'], ['double', 'book', 'Double']]}
            />
          </SettingRow>
          <span {...stylex.props(styles.keysHint)}>Keys: ← → turn pages · Space next · Esc close</span>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ---------- canvas ---------- */}
      {mode === 'vertical' ? (
        <div ref={scrollRef} onScroll={onScroll} onClick={() => setUiVisible((v) => !v)} {...stylex.props(styles.scroll)}>
          {pages.map((p, i) => (
            <div key={i} ref={(el) => { pageRefs.current[i] = el; }} {...stylex.props(styles.strip, fit === 'height' && styles.stripNarrow)}>
              <PageImage page={p} index={i} total={total} format={format} fit="width" />
            </div>
          ))}
          <div onClick={(e) => e.stopPropagation()} {...stylex.props(styles.endWrap)}>{endCard}</div>
        </div>
      ) : (
        <div {...stylex.props(styles.paged)}>
          <AnimatePresence mode="popLayout" initial={false} custom={navDir * (direction === 'rtl' ? -1 : 1)}>
            {atEnd ? (
              <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {endCard}
              </motion.div>
            ) : (
              <motion.div
                key={`spread-${visible.join('-')}`}
                custom={navDir * (direction === 'rtl' ? -1 : 1)}
                variants={{
                  enter: (x: number) => ({ opacity: 0, x: x * 80, scale: 0.98 }),
                  center: { opacity: 1, x: 0, scale: 1 },
                  exit: (x: number) => ({ opacity: 0, x: x * -80, scale: 0.98 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: ease.out }}
                {...stylex.props(styles.spread, fit === 'width' && styles.spreadWidth)}
              >
                {visible.map((i) => (
                  <div key={i} {...stylex.props(styles.pageBox, fit === 'height' ? styles.fitHeight : styles.fitWidth)}>
                    <PageImage page={pages[i]} index={i} total={total} format={format} fit={fit} />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {/* click zones: outer thirds turn pages, middle toggles UI */}
          <button
            type="button"
            aria-label={direction === 'rtl' ? 'Next page' : 'Previous page'}
            onClick={direction === 'rtl' ? forward : backward}
            {...stylex.props(styles.zone, styles.zoneLeft)}
          />
          <button type="button" aria-label="Toggle toolbars" onClick={() => setUiVisible((v) => !v)} {...stylex.props(styles.zone, styles.zoneMid)} />
          <button
            type="button"
            aria-label={direction === 'rtl' ? 'Previous page' : 'Next page'}
            onClick={direction === 'rtl' ? backward : forward}
            {...stylex.props(styles.zone, styles.zoneRight)}
          />
        </div>
      )}

      {/* ---------- bottom bar ---------- */}
      <motion.footer
        initial={false}
        animate={uiVisible ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
        transition={{ duration: 0.25, ease: ease.out }}
        {...stylex.props(styles.toolbar, styles.bottom, !uiVisible && styles.noPointer)}
      >
        <ToolIcon
          icon="chevronLeft"
          label={mode === 'paged' && direction === 'rtl' ? 'Next page' : 'Previous page'}
          onClick={mode === 'paged' && direction === 'rtl' ? forward : backward}
        />
        <span {...stylex.props(styles.pageCount)}>
          {atEnd ? 'END' : `${page + 1}${step === 2 && page + 1 < total ? `–${page + 2}` : ''}`} / {total}
        </span>
        <input
          type="range"
          min={0}
          max={total}
          value={page}
          onChange={(e) => goTo(Number(e.target.value))}
          aria-label="Page"
          {...stylex.props(styles.slider, mode === 'paged' && direction === 'rtl' && styles.sliderRtl)}
        />
        <span {...stylex.props(styles.percent)}>{Math.round((Math.min(page + step, total) / total) * 100)}%</span>
        <ToolIcon
          icon="chevronRight"
          label={mode === 'paged' && direction === 'rtl' ? 'Previous page' : 'Next page'}
          onClick={mode === 'paged' && direction === 'rtl' ? backward : forward}
        />
      </motion.footer>
    </div>
  );
}

/* ---------- internal pieces ---------- */

function PageImage({ page, index, total, format, fit }: { page: ComicPage; index: number; total: number; format: ComicFormat; fit: PageFit }) {
  const sizing = fit === 'height' ? styles.byHeight : styles.byWidth;
  const w = page.width ?? 720;
  const h = page.height ?? (format === 'manga' ? 1024 : 1600);
  if (page.src) {
    return <img src={page.src} alt={`Page ${index + 1}`} loading={index < 3 ? 'eager' : 'lazy'} width={w} height={h} {...stylex.props(styles.img, sizing)} />;
  }
  return (
    <div {...stylex.props(styles.placeholder, sizing, dyn.aspect(`${w} / ${h}`), index % 2 === 1 && styles.placeholderAlt)} role="img" aria-label={`Page ${index + 1} placeholder`}>
      <Icon name="image" size={40} />
      <span {...stylex.props(styles.phNum)}>PAGE {index + 1} / {total}</span>
      <span {...stylex.props(styles.phSize)}>{w} × {h}</span>
    </div>
  );
}

function ToolIcon({ icon, label, onClick, disabled, active }: { icon: IconName; label: string; onClick?: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={spring.snappy}
      {...stylex.props(styles.toolIcon, active && styles.toolIconActive)}
    >
      <Icon name={icon} size={18} />
    </motion.button>
  );
}

function ReaderButton({ icon, children, onClick, primary }: { icon: IconName; children: ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <motion.button type="button" onClick={onClick} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} transition={spring.snappy} {...stylex.props(styles.readerBtn, primary && styles.readerBtnPrimary)}>
      {icon === 'chevronLeft' && <Icon name={icon} size={16} />}
      {children}
      {icon !== 'chevronLeft' && <Icon name={icon} size={16} />}
    </motion.button>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, IconName, string][];
  disabled?: boolean;
}) {
  const uid = useId();
  return (
    <div role="radiogroup" aria-label={label} {...stylex.props(styles.segment, disabled && styles.segmentDisabled)}>
      {options.map(([v, ic, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          disabled={disabled}
          onClick={() => onChange(v)}
          {...stylex.props(styles.segBtn, value === v && styles.segActive)}
        >
          {value === v && <motion.span layoutId={`seg-${uid}`} transition={spring.layout} {...stylex.props(styles.segPill)} />}
          <span {...stylex.props(styles.segInner)}>
            <Icon name={ic} size={14} />
            <span {...stylex.props(styles.hideMobile)}>{l}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div {...stylex.props(styles.settingRow)}>
      <span {...stylex.props(styles.settingLabel)}>
        {label}
        {hint && <span {...stylex.props(styles.settingHint)}>{hint}</span>}
      </span>
      {children}
    </div>
  );
}

const READER_BG = '#0b1020';

const styles = stylex.create({
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: READER_BG,
    fontFamily: fonts.body,
    color: colors.textOnDark,
    userSelect: 'none',
  },
  grow: { flexGrow: 1 },
  hideMobile: { display: { default: 'contents', [bp.mobile]: 'none' } },
  row: { display: 'flex', gap: 10 },
  pink: { color: colors.pink },

  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    paddingInline: { default: 16, [bp.mobile]: 8 },
    gap: { default: 10, [bp.mobile]: 6 },
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    backdropFilter: 'blur(12px)',
  },
  top: { top: 0, height: { default: 60, [bp.mobile]: 54 }, borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: 'rgba(236, 72, 153, 0.55)' },
  bottom: { bottom: 0, height: 56, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(255, 255, 255, 0.08)' },
  noPointer: { pointerEvents: 'none' },

  titleBlock: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  comicTitle: { fontFamily: fonts.display, fontSize: { default: 18, [bp.mobile]: 15 }, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  chapterTitle: { fontSize: 12, fontWeight: 600, color: '#f9a8d4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  divider: { width: 1, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  chapterSelect: {
    maxWidth: { default: 260, [bp.mobile]: 120 },
    height: 36,
    paddingInline: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: colors.textOnDark,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  toolIcon: {
    display: 'inline-flex',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: { default: 'rgba(255, 255, 255, 0.06)', ':hover': 'rgba(236, 72, 153, 0.25)' },
    color: colors.textOnDark,
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    opacity: { default: 1, ':disabled': 0.35 },
  },
  toolIconActive: { backgroundColor: colors.pink, borderColor: colors.pink },

  segment: { display: 'inline-flex', gap: 2, padding: 3, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  segmentDisabled: { opacity: 0.4 },
  segBtn: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 6,
    paddingInline: 10,
    borderWidth: 0,
    borderRadius: 9,
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
  },
  segActive: { color: colors.textOnDark },
  segPill: { position: 'absolute', inset: 0, borderRadius: 9, backgroundImage: gradients.pinkRose, boxShadow: shadows.glowPink },
  segInner: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 },

  settings: {
    position: 'absolute',
    top: 70,
    right: 16,
    zIndex: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    width: 'min(380px, calc(100vw - 24px))',
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
  },
  settingRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingLabel: { display: 'flex', flexDirection: 'column', fontSize: 13, fontWeight: 700 },
  settingHint: { fontSize: 10, fontWeight: 500, color: colors.textMuted },
  keysHint: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },

  scroll: { flexGrow: 1, overflowY: 'auto', paddingTop: 60, paddingBottom: 56, scrollbarColor: '#ec4899 transparent' },
  strip: { width: '100%', maxWidth: 800, marginInline: 'auto' },
  stripNarrow: { maxWidth: 560 },
  endWrap: { display: 'flex', justifyContent: 'center', paddingBlock: 48 },

  paged: { position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', paddingTop: 68, paddingBottom: 64 },
  spread: { display: 'flex', justifyContent: 'center', gap: 4, height: '100%' },
  spreadWidth: { width: '100%', maxWidth: 1400, height: 'auto' },
  pageBox: { display: 'flex', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.45)' },
  fitHeight: { height: '100%' },
  fitWidth: { flexGrow: 1, flexBasis: 0 },
  zone: { position: 'absolute', top: 60, bottom: 56, zIndex: 1, borderWidth: 0, backgroundColor: 'transparent', padding: 0 },
  zoneLeft: { left: 0, width: '33%', cursor: 'w-resize' },
  zoneMid: { left: '33%', width: '34%', cursor: 'pointer' },
  zoneRight: { right: 0, width: '33%', cursor: 'e-resize' },

  img: { display: 'block', objectFit: 'contain' },
  byWidth: { width: '100%', height: 'auto' },
  byHeight: { width: 'auto', height: '100%' },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundImage: 'linear-gradient(180deg, #fdf2f8, #fbcfe8 55%, #e9d5ff)',
    color: '#9d174d',
  },
  placeholderAlt: { backgroundImage: 'linear-gradient(180deg, #eef2ff, #e0e7ff 55%, #fbcfe8)', color: '#4338ca' },
  phNum: { fontFamily: fonts.mono, fontSize: 18, fontWeight: 700 },
  phSize: { fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, opacity: 0.7 },

  endCard: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    paddingBlock: 32,
    paddingInline: { default: 40, [bp.mobile]: 20 },
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(236, 72, 153, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    textAlign: 'center',
  },
  endTitle: { fontFamily: fonts.display, fontSize: 28 },
  endSub: { fontSize: 14, color: '#cbd5e1', marginBottom: 6 },
  readerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 11,
    paddingInline: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: colors.textOnDark,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  readerBtnPrimary: { backgroundImage: gradients.primary, borderColor: 'transparent', boxShadow: shadows.glowPink },

  pageCount: { minWidth: 72, fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, textAlign: 'center' },
  percent: { minWidth: 44, fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, color: '#f9a8d4', textAlign: 'end' },
  slider: { flexGrow: 1, accentColor: colors.pink, cursor: 'pointer' },
  sliderRtl: { direction: 'rtl' },
});

const dyn = stylex.create({
  height: (h: number | string) => ({ height: h }),
  aspect: (ratio: string) => ({ aspectRatio: ratio }),
});
