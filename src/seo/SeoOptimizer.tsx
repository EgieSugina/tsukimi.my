import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion, useMotionTemplate, useSpring, useTransform } from 'motion/react';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { fade, spring } from '../motion/motion';
import { colors, fonts, gradients, radius, shadows } from '../tokens/tokens.stylex';
import { bp } from '../tokens/breakpoints.stylex';
import { Badge } from '../components/Badge/Badge';
import { Icon, type IconName } from '../components/Icon/Icon';
import {
  LIMITS,
  SITE,
  auditSeo,
  buildHeadTags,
  headTagsToHtml,
  resolveTitle,
  slugify,
  truncate,
  type AuditStatus,
  type OgType,
  type SeoMeta,
} from './seo';

export interface SeoOptimizerProps {
  initialMeta: SeoMeta;
  /** URL path prefix, e.g. "/comics/". */
  pathPrefix?: string;
  initialSlug?: string;
  /** Number of <h1> on the page, if known. */
  h1Count?: number;
  onChange?: (meta: SeoMeta, slug: string) => void;
  xstyle?: stylex.StyleXStyles;
}

const ogTypes: OgType[] = ['website', 'video.movie', 'video.episode', 'video.other', 'profile', 'book', 'article'];
const statusIcon: Record<AuditStatus, IconName> = { pass: 'check', warn: 'sparkles', fail: 'flame' };

/**
 * SEO editor for a page: edit title / description / slug / keyword / image,
 * see Google + social previews update live, and fix issues from the audit.
 */
export function SeoOptimizer({ initialMeta, pathPrefix = '/', initialSlug, h1Count, onChange, xstyle }: SeoOptimizerProps) {
  const [meta, setMeta] = useState<SeoMeta>(initialMeta);
  const [slug, setSlug] = useState(initialSlug ?? slugify(initialMeta.title));
  const [tab, setTab] = useState<'google' | 'social' | 'code'>('google');
  const uid = useId();

  const canonical = `${SITE.url}${pathPrefix}${slug}`;
  const full = { ...meta, canonical: meta.canonical ?? canonical };
  const audit = useMemo(() => auditSeo(full, { slug, h1Count }), [full, slug, h1Count]);
  const html = useMemo(() => headTagsToHtml(buildHeadTags(full)), [full]);

  const update = (patch: Partial<SeoMeta>, nextSlug = slug) => {
    const next = { ...meta, ...patch };
    setMeta(next);
    setSlug(nextSlug);
    onChange?.(next, nextSlug);
  };

  const title = resolveTitle(full);
  const failing = audit.checks.filter((c) => c.status !== 'pass');

  return (
    <section {...stylex.props(styles.root, xstyle)}>
      <header {...stylex.props(styles.header)}>
        <Icon name="search" size={22} xstyle={styles.pink} />
        <h2 {...stylex.props(styles.h2)}>SEO Optimizer</h2>
        <span {...stylex.props(styles.muted)}>Live preview & audit for this page</span>
        <span {...stylex.props(styles.grow)} />
        <ScoreRing score={audit.score} grade={audit.grade} />
      </header>

      <div {...stylex.props(styles.columns)}>
        {/* ---------- form ---------- */}
        <div {...stylex.props(styles.card, styles.form)}>
          <Field label="SEO title" counter={<Counter value={title.length} min={LIMITS.titleMin} max={LIMITS.titleMax} />}>
            <input value={meta.title} onChange={(e) => update({ title: e.target.value })} {...stylex.props(styles.input)} />
            <span {...stylex.props(styles.hint)}>Rendered as “{title}”</span>
          </Field>
          <Field label="Meta description" counter={<Counter value={meta.description.length} min={LIMITS.descMin} max={LIMITS.descMax} />}>
            <textarea rows={3} value={meta.description} onChange={(e) => update({ description: e.target.value })} {...stylex.props(styles.input, styles.textarea)} />
          </Field>
          <Field label="URL slug">
            <div {...stylex.props(styles.slugRow)}>
              <span {...stylex.props(styles.prefix)}>{pathPrefix}</span>
              <input value={slug} onChange={(e) => update({}, e.target.value)} {...stylex.props(styles.input, styles.slugInput)} />
              <button type="button" onClick={() => update({}, slugify(meta.focusKeyword || meta.title))} {...stylex.props(styles.smallBtn)}>
                Auto
              </button>
            </div>
          </Field>
          <div {...stylex.props(styles.twoCol)}>
            <Field label="Focus keyword">
              <input value={meta.focusKeyword ?? ''} placeholder="e.g. blue sky refrain manga" onChange={(e) => update({ focusKeyword: e.target.value })} {...stylex.props(styles.input)} />
            </Field>
            <Field label="Page type (og:type)">
              <select value={meta.type ?? 'website'} onChange={(e) => update({ type: e.target.value as OgType })} {...stylex.props(styles.input)}>
                {ogTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Social image URL (1200 × 630)">
            <input value={meta.image ?? ''} placeholder="https://…/og/blue-sky-refrain.jpg" onChange={(e) => update({ image: e.target.value || undefined, imageWidth: e.target.value ? meta.imageWidth ?? 1200 : undefined, imageHeight: e.target.value ? meta.imageHeight ?? 630 : undefined })} {...stylex.props(styles.input)} />
          </Field>
          <Field label="Image alt text">
            <input value={meta.imageAlt ?? ''} onChange={(e) => update({ imageAlt: e.target.value || undefined })} {...stylex.props(styles.input)} />
          </Field>
          <label {...stylex.props(styles.toggle)}>
            <input type="checkbox" checked={!!meta.noindex} onChange={(e) => update({ noindex: e.target.checked })} {...stylex.props(styles.checkbox)} />
            Hide from search engines (noindex)
          </label>
        </div>

        {/* ---------- audit ---------- */}
        <div {...stylex.props(styles.card, styles.audit)}>
          <div {...stylex.props(styles.auditHead)}>
            <Icon name="list" size={16} xstyle={styles.pink} />
            <strong>Checklist</strong>
            <span {...stylex.props(styles.grow)} />
            <Badge tone={failing.length ? 'amber' : 'green'}>{failing.length ? `${failing.length} to improve` : 'All good'}</Badge>
          </div>
          <ul {...stylex.props(styles.checks)}>
            <AnimatePresence initial={false} mode="popLayout">
            {audit.checks.map((c, i) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, transition: { ...spring.soft, delay: i * 0.03 } }}
                exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                {...stylex.props(styles.check, checkTone[c.status])}
              >
                <motion.span
                  key={c.status}
                  initial={{ scale: 0.4, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={spring.snappy}
                  {...stylex.props(styles.checkIcon, iconTone[c.status])}
                >
                  <Icon name={statusIcon[c.status]} size={12} strokeWidth={2.6} />
                </motion.span>
                <span {...stylex.props(styles.checkBody)}>
                  <span {...stylex.props(styles.checkLabel)}>{c.label}</span>
                  <span {...stylex.props(styles.checkMsg)}>{c.message}</span>
                  {c.fix && <span {...stylex.props(styles.checkFix)}>→ {c.fix}</span>}
                </span>
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>

      {/* ---------- previews ---------- */}
      <div {...stylex.props(styles.card)}>
        <div role="tablist" {...stylex.props(styles.tabs)}>
          {(
            [
              ['google', 'search', 'Google result'],
              ['social', 'image', 'Social card'],
              ['code', 'list', 'HTML <head>'],
            ] as const
          ).map(([id, ic, l]) => (
            <motion.button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              whileTap={{ scale: 0.95 }}
              {...stylex.props(styles.tab, tab === id && styles.tabActive)}
            >
              {tab === id && <motion.span layoutId={`seo-tab-${uid}`} transition={spring.layout} {...stylex.props(styles.tabPill)} />}
              <span {...stylex.props(styles.tabInner)}>
                <Icon name={ic} size={14} />
                {l}
              </span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
        {tab === 'google' && (
          <motion.div key="google" variants={fade} initial="hidden" animate="show" exit="exit" {...stylex.props(styles.serp)}>
            <div {...stylex.props(styles.serpSite)}>
              <span {...stylex.props(styles.favicon)}>A</span>
              <span {...stylex.props(styles.serpSiteText)}>
                <span {...stylex.props(styles.serpSiteName)}>{SITE.name}</span>
                <span {...stylex.props(styles.serpUrl)}>{full.canonical.replace('https://', '').replace(/\//g, ' › ')}</span>
              </span>
            </div>
            <span {...stylex.props(styles.serpTitle)}>{truncate(title, LIMITS.titleMax)}</span>
            <span {...stylex.props(styles.serpDesc)}>{truncate(meta.description || 'Google will pick text from the page if no description is set.', LIMITS.descMax)}</span>
          </motion.div>
        )}

        {tab === 'social' && (
          <motion.div key="social" variants={fade} initial="hidden" animate="show" exit="exit" {...stylex.props(styles.social)}>
            <div {...stylex.props(styles.socialImg)}>
              {meta.image ? <img src={meta.image} alt={meta.imageAlt ?? ''} {...stylex.props(styles.socialImgEl)} /> : <span {...stylex.props(styles.socialEmpty)}>No og:image — 1200 × 630</span>}
            </div>
            <div {...stylex.props(styles.socialBody)}>
              <span {...stylex.props(styles.socialDomain)}>{SITE.url.replace('https://', '').toUpperCase()}</span>
              <span {...stylex.props(styles.socialTitle)}>{truncate(meta.title || SITE.name, 70)}</span>
              <span {...stylex.props(styles.socialDesc)}>{truncate(meta.description, 120)}</span>
            </div>
          </motion.div>
        )}

        {tab === 'code' && (
          <motion.div key="code" variants={fade} initial="hidden" animate="show" exit="exit" {...stylex.props(styles.codeWrap)}>
            <button type="button" onClick={() => navigator.clipboard?.writeText(html)} {...stylex.props(styles.smallBtn, styles.copy)}>
              Copy
            </button>
            <pre {...stylex.props(styles.code)}>{html}</pre>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ---------- pieces ---------- */

function Field({ label, counter, children }: { label: string; counter?: ReactNode; children: ReactNode }) {
  return (
    <label {...stylex.props(styles.field)}>
      <span {...stylex.props(styles.fieldHead)}>
        <span {...stylex.props(styles.label)}>{label}</span>
        {counter}
      </span>
      {children}
    </label>
  );
}

function Counter({ value, min, max }: { value: number; min: number; max: number }) {
  const status: AuditStatus = value === 0 ? 'fail' : value < min || value > max ? 'warn' : 'pass';
  const pct = Math.min(100, (value / max) * 100);
  return (
    <span {...stylex.props(styles.counter)}>
      <span {...stylex.props(styles.counterTrack)}>
        <motion.span animate={{ width: `${pct}%` }} transition={spring.soft} {...stylex.props(styles.counterFill, barTone[status])} />
      </span>
      <span {...stylex.props(styles.counterText, textTone[status])}>
        {value}/{max}
      </span>
    </span>
  );
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const tone = score >= 90 ? '#10b981' : score >= 75 ? '#ec4899' : score >= 55 ? '#f59e0b' : '#e11d48';
  // spring-animated score: the number counts and the ring sweeps to the new value
  const mv = useSpring(0, { stiffness: 90, damping: 20 });
  useEffect(() => mv.set(score), [mv, score]);
  const deg = useTransform(mv, (v) => v * 3.6);
  const label = useTransform(mv, (v) => Math.round(v));
  const bg = useMotionTemplate`conic-gradient(${tone} ${deg}deg, rgba(148, 163, 184, 0.25) 0deg)`;
  return (
    <motion.div style={{ backgroundImage: bg }} {...stylex.props(styles.ring)} role="img" aria-label={`SEO score ${score} of 100`}>
      <div {...stylex.props(styles.ringInner)}>
        <motion.span {...stylex.props(styles.ringScore)}>{label}</motion.span>
        <motion.span key={grade} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} {...stylex.props(styles.ringGrade)}>
          Grade {grade}
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ---------- styles ---------- */

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 1200, fontFamily: fonts.body, color: colors.textPrimary },
  grow: { flexGrow: 1 },
  pink: { color: colors.pink },
  muted: { fontSize: 14, color: colors.textSecondary },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingBlock: 14,
    paddingInline: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
  },
  h2: { margin: 0, fontSize: 22, fontWeight: 800 },
  columns: { display: 'grid', gridTemplateColumns: { default: 'minmax(0, 1.2fr) minmax(0, 1fr)', [bp.belowLaptop]: 'minmax(0, 1fr)' }, gap: 16 },
  card: { padding: 18, borderRadius: 16, borderWidth: 1, borderStyle: 'solid', borderColor: colors.borderSubtle, backgroundColor: colors.surfaceStrong },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 13, fontWeight: 700 },
  hint: { fontSize: 11, color: colors.textMuted },
  input: {
    width: '100%',
    paddingBlock: 10,
    paddingInline: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: { default: colors.borderSubtle, ':focus': colors.pink },
    outline: 'none',
    backgroundColor: colors.surfaceSoft,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textarea: { resize: 'vertical', lineHeight: 1.5 },
  slugRow: { display: 'flex', alignItems: 'center', gap: 6 },
  prefix: { fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: colors.textSecondary },
  slugInput: { fontFamily: fonts.mono, fontSize: 13 },
  smallBtn: {
    paddingBlock: 8,
    paddingInline: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderPink,
    backgroundColor: { default: colors.chipPink, ':hover': colors.borderPink },
    color: colors.textAccent,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  twoCol: { display: 'grid', gridTemplateColumns: { default: '1fr 1fr', [bp.mobile]: '1fr' }, gap: 12 },
  toggle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  checkbox: { width: 16, height: 16, accentColor: colors.red },

  counter: { display: 'inline-flex', alignItems: 'center', gap: 8 },
  counterTrack: { width: 80, height: 5, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.borderSubtle },
  counterFill: { display: 'block', height: '100%', borderRadius: 999 },
  counterText: { fontFamily: fonts.mono, fontSize: 11, fontWeight: 700 },

  audit: { display: 'flex', flexDirection: 'column', gap: 10 },
  auditHead: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 },
  checks: { display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none', maxHeight: 520, overflowY: 'auto' },
  check: { display: 'flex', gap: 10, paddingBlock: 8, paddingInline: 10, borderRadius: 10, borderWidth: 1, borderStyle: 'solid' },
  checkIcon: { display: 'inline-flex', flexShrink: 0, padding: 4, borderRadius: 999, color: colors.textOnDark, height: 'fit-content' },
  checkBody: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  checkLabel: { fontSize: 13, fontWeight: 700 },
  checkMsg: { fontSize: 12, color: colors.textSecondary, overflowWrap: 'anywhere' },
  checkFix: { fontSize: 12, fontWeight: 600, color: colors.textAccent, overflowWrap: 'anywhere' },

  tabs: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tab: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 8,
    paddingInline: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabActive: { borderColor: colors.pink, color: colors.textOnDark },
  tabPill: { position: 'absolute', inset: -1, borderRadius: 10, backgroundColor: colors.pink, boxShadow: shadows.glowPink },
  tabInner: { position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 },

  serp: { display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 650, padding: 16, borderRadius: 12, backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' },
  serpSite: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  favicon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 999, backgroundImage: gradients.logo, color: '#fff', fontSize: 13, fontWeight: 700 },
  serpSiteText: { display: 'flex', flexDirection: 'column' },
  serpSiteName: { fontSize: 14, color: '#202124' },
  serpUrl: { fontSize: 12, color: '#4d5156' },
  serpTitle: { fontSize: 20, lineHeight: 1.3, color: '#1a0dab' },
  serpDesc: { fontSize: 14, lineHeight: 1.58, color: '#4d5156' },

  social: { display: 'flex', flexDirection: 'column', width: 520, maxWidth: '100%', overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderStyle: 'solid', borderColor: '#cfd9de', backgroundColor: '#fff' },
  socialImg: { display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1200 / 630', backgroundImage: gradients.placeholderCover },
  socialImgEl: { width: '100%', height: '100%', objectFit: 'cover' },
  socialEmpty: { fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, color: '#ffffff' },
  socialBody: { display: 'flex', flexDirection: 'column', gap: 3, paddingBlock: 10, paddingInline: 14 },
  socialDomain: { fontSize: 12, color: '#536471' },
  socialTitle: { fontSize: 15, fontWeight: 700, color: '#0f1419' },
  socialDesc: { fontSize: 14, color: '#536471' },

  codeWrap: { position: 'relative' },
  copy: { position: 'absolute', top: 10, right: 10 },
  code: {
    margin: 0,
    maxHeight: 420,
    overflow: 'auto',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.bgNight,
    color: '#f9a8d4',
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },

  ring: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 84, height: 84, borderRadius: 999 },
  ringInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 68, height: 68, borderRadius: 999, backgroundColor: colors.surfaceCard },
  ringScore: { fontFamily: fonts.mono, fontSize: 22, fontWeight: 700, lineHeight: 1 },
  ringGrade: { fontSize: 10, fontWeight: 700, color: colors.textSecondary },
});

const checkTone = stylex.create({
  pass: { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.35)' },
  warn: { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.35)' },
  fail: { backgroundColor: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.35)' },
});
const iconTone = stylex.create({
  pass: { backgroundColor: colors.green },
  warn: { backgroundColor: colors.amber },
  fail: { backgroundColor: colors.red },
});
const barTone = stylex.create({
  pass: { backgroundColor: colors.green },
  warn: { backgroundColor: colors.amber },
  fail: { backgroundColor: colors.red },
});
const textTone = stylex.create({
  pass: { color: colors.textGreen },
  warn: { color: colors.textAmber },
  fail: { color: colors.red },
});
