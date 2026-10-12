import { MotionConfig, motion, type Transition, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';

/**
 * Shared motion language for the whole UI (built on `motion`, ex-Framer Motion).
 * Keep durations short and springs well-damped so the UI feels smooth, not bouncy.
 */

export const spring = {
  /** Buttons, chips, tabs — quick and crisp. */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  /** Cards, panels — soft settle. */
  soft: { type: 'spring', stiffness: 260, damping: 30 },
  /** Shared-layout indicators (active tab pill). */
  layout: { type: 'spring', stiffness: 420, damping: 36 },
} satisfies Record<string, Transition>;

export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const duration = { fast: 0.15, base: 0.24, slow: 0.4 };

/** Hover / press feedback for interactive controls. */
export const press = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.96 },
  transition: spring.snappy,
} as const;

/** Hover lift for cards / posters. */
export const lift = {
  whileHover: { y: -4 },
  whileTap: { scale: 0.985 },
  transition: spring.soft,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
  exit: { opacity: 0, y: 8, transition: { duration: duration.fast } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const pop: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 6 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.96, y: 4, transition: { duration: duration.fast } },
};

export const staggerContainer = (stagger = 0.05, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export type ReducedMotionMode = 'user' | 'always' | 'never';

/**
 * Wrap the app once. `user` (default) honours the OS "reduce motion" setting,
 * `never` always animates (handy for design review), `always` disables movement.
 */
export function MotionProvider({ children, reducedMotion = 'user' }: { children: ReactNode; reducedMotion?: ReducedMotionMode }) {
  return <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>;
}

type DivProps = { children?: ReactNode; xstyle?: stylex.StyleXStyles; as?: 'div' | 'section' | 'ul' | 'ol' | 'li' };

/** Fades/slides content in the first time it scrolls into view. */
export function Reveal({ children, xstyle, delay = 0, as = 'div' }: DivProps & { delay?: number }) {
  const M = motion[as];
  return (
    <M
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ delay }}
      {...stylex.props(xstyle)}
    >
      {children}
    </M>
  );
}

/** Container that staggers its <StaggerItem> children in when visible. */
export function Stagger({ children, xstyle, stagger = 0.05, as = 'div' }: DivProps & { stagger?: number }) {
  const M = motion[as];
  return (
    <M variants={staggerContainer(stagger)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -40px 0px' }} {...stylex.props(xstyle)}>
      {children}
    </M>
  );
}

export function StaggerItem({ children, xstyle, as = 'div' }: DivProps) {
  const M = motion[as];
  return (
    <M variants={fadeUp} {...stylex.props(xstyle)}>
      {children}
    </M>
  );
}
