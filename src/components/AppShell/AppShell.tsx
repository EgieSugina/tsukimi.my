import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { useDevice } from '../../device/device';
import { ease, spring } from '../../motion/motion';
import { bp } from '../../tokens/breakpoints.stylex';
import { colors, fonts, gradients } from '../../tokens/tokens.stylex';
import { BottomNav } from '../BottomNav/BottomNav';
import { Icon } from '../Icon/Icon';
import { NavTab } from '../NavTab/NavTab';
import { Sidebar, type SidebarProps } from '../Sidebar/Sidebar';
import { TopBar, defaultNavItems, type TopBarProps } from '../TopBar/TopBar';

export interface AppShellProps {
  children: ReactNode;
  topBar?: TopBarProps;
  sidebar?: SidebarProps;
  /** Hide the left rail on laptop+ (e.g. the watch page). */
  hideSidebar?: boolean;
  xstyle?: stylex.StyleXStyles;
}

/**
 * Responsive page frame.
 * - laptop / pc / tv: sticky TopBar + 380px Sidebar + main column
 * - tablet: TopBar with hamburger → drawer (nav + sidebar)
 * - mobile: compact TopBar, drawer, and a bottom tab bar
 */
export function AppShell({ children, topBar, sidebar, hideSidebar, xstyle }: AppShellProps) {
  const { device, isHandheld } = useDevice();
  const [drawer, setDrawer] = useState(false);
  const navItems = topBar?.navItems ?? defaultNavItems;
  const [active, setActive] = useState(topBar?.activeNav ?? 'home');
  useEffect(() => setActive(topBar?.activeNav ?? 'home'), [topBar?.activeNav]);
  useEffect(() => {
    if (!isHandheld) setDrawer(false);
  }, [isHandheld]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  const navigate = (id: string) => {
    setActive(id);
    setDrawer(false);
    topBar?.onNavigate?.(id);
  };

  return (
    <div data-device={device} {...stylex.props(styles.page, xstyle)}>
      <TopBar {...topBar} activeNav={active} onNavigate={navigate} onMenu={() => setDrawer(true)} />
      <div {...stylex.props(styles.body)}>
        {!hideSidebar && !isHandheld && <Sidebar {...sidebar} />}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: ease.out, delay: 0.05 }}
          {...stylex.props(styles.main, device === 'mobile' && styles.mainWithBottomNav)}
        >
          {children}
        </motion.main>
      </div>

      {device === 'mobile' && <BottomNav items={[...navItems.filter((n) => n.id !== 'genres' && n.id !== 'categories')]} active={active} onNavigate={navigate} />}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              {...stylex.props(styles.scrim)}
            />
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={spring.soft}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.4, right: 0 }}
              onDragEnd={(_, i) => (i.offset.x < -80 || i.velocity.x < -400) && setDrawer(false)}
              {...stylex.props(styles.drawer)}
            >
              <div {...stylex.props(styles.drawerHead)}>
                <span {...stylex.props(styles.drawerTitle)}>Menu</span>
                <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} {...stylex.props(styles.close)}>
                  <Icon name="close" size={18} />
                </button>
              </div>
              <nav aria-label="Main" {...stylex.props(styles.drawerNav)}>
                {navItems.map((n) => (
                  <NavTab key={n.id} label={n.label} icon={n.icon} active={n.id === active} indicatorId="drawer-nav" onClick={() => navigate(n.id)} xstyle={styles.drawerTab} />
                ))}
              </nav>
              <Sidebar {...sidebar} xstyle={styles.drawerSidebar} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = stylex.create({
  page: { minHeight: '100vh', backgroundImage: gradients.page },
  body: { display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 64px)' },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: 24, [bp.mobile]: 18 },
    flexGrow: 1,
    minWidth: 0,
    paddingTop: { default: 24, [bp.mobile]: 14 },
    paddingInline: { default: 24, [bp.tablet]: 20, [bp.mobile]: 12 },
    paddingBottom: 56,
  },
  mainWithBottomNav: { paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' },
  scrim: { position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(2, 6, 23, 0.55)', backdropFilter: 'blur(2px)' },
  drawer: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 41,
    display: 'flex',
    flexDirection: 'column',
    width: 'min(380px, 88vw)',
    overflowY: 'auto',
    backgroundColor: colors.bgSidebar,
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.25)',
    fontFamily: fonts.body,
    touchAction: 'pan-y',
  },
  drawerHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingInline: 16 },
  drawerTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: 700, color: colors.textPrimary },
  close: {
    display: 'inline-flex',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
    color: colors.textPrimary,
    cursor: 'pointer',
  },
  drawerNav: { display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 12, paddingInline: 16 },
  drawerTab: { justifyContent: 'flex-start', width: '100%', paddingBlock: 12 },
  drawerSidebar: { width: '100%', borderRightWidth: 0, backgroundColor: 'transparent' },
});
