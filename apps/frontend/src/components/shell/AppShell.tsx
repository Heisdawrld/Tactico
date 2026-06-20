'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { LeftRail } from './LeftRail';
import { TopBar } from './TopBar';
import { RightPanel } from './RightPanel';
import { MobileTabBar } from './MobileTabBar';
import { LiveFeedBar } from './LiveFeedBar';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { useAppStore } from '@/lib/store';
import { useAudioEngine } from '@/lib/audio';
import { SHORTCUT_TO_NAV } from '@/lib/navigation';
import { NAV_ITEMS } from '@/lib/navigation';

/**
 * AppShell — the Hybrid Command Center layout.
 *
 * Desktop (>=lg, 1024px+):
 *   ┌─────────────────────────────────────────────────┐
 *   │ │ TopBar                                  │ [▶] │   ← 56px
 *   │ │┌──────────────────────────────────────┐ │     │
 *   │ ││                                      │ │     │
 *   │L││         Main Content                 │ │Right│   ← flex-1
 *   │R││         (scrollable)                 │ │Panel│
 *   │a││                                      │ │340px│
 *   │i││                                      │ │     │
 *   │l│└──────────────────────────────────────┘ │     │
 *   │ │ LiveFeedBar (Bloomberg ticker)         │     │   ← 36px
 *   └─────────────────────────────────────────┘
 *
 * Tablet (md, 768px+):
 *   - Same as desktop but right panel hidden by default
 *
 * Mobile (<md):
 *   - Left rail hidden, MobileTabBar at bottom (64px)
 *   - TopBar simplified (no finance snapshot, no right panel toggle)
 */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const expanded = useAppStore((s) => s.leftRailExpanded);

  // Initialize the audio engine (subscribes to store + Howler)
  useAudioEngine();

  // Global keyboard shortcuts (g H = Dashboard, g S = Squad, etc.)
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const onKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

      // Cmd/Ctrl+K opens search (future)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // TODO: open command palette
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Single-key shortcuts: H, S, T, R, M, L, X, C, F, P
      if (key in SHORTCUT_TO_NAV && now - lastKeyTime > 500) {
        const section = SHORTCUT_TO_NAV[key];
        const item = NAV_ITEMS.find((i) => i.id === section);
        if (item) {
          router.push(item.href);
        }
      }

      lastKey = key;
      lastKeyTime = now;
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  // Skip the shell on splash/start page
  const isStartPage = pathname === '/' || pathname === '/start';

  if (isStartPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base safe-area-all relative">
      {/* Cinematic animated background — all pages inherit this */}
      <AnimatedBackground variant={pathname.includes('match-simulation') ? 'matchday' : 'default'} />

      {/* Left rail — fixed */}
      <LeftRail />

      {/* Main column — flex-1, offset by rail width */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-[margin] duration-300 ease-premium md:ml-[72px] relative z-10"
        style={{ marginLeft: 'var(--nav-rail-width)' }}
      >
        <TopBar />

        <div className="flex flex-1 min-h-0">
          {/* Main content area */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-full page-mobile"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Right panel — only on desktop */}
          <RightPanel />
        </div>

        {/* Bloomberg ticker — hidden on mobile */}
        <div className="livefeed-bar hidden md:block">
          <LiveFeedBar />
        </div>
      </div>

      {/* Mobile tab bar */}
      <MobileTabBar />

      {/* Mobile bottom-padding spacer so content isn't hidden behind tab bar */}
      <div className="md:hidden h-[var(--mobile-tabbar-height)] shrink-0 safe-area-bottom" />
    </div>
  );
}
