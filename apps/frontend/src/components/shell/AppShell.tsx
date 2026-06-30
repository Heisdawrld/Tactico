'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LeftRail } from './LeftRail';
import { TopBar } from './TopBar';
import { RightPanel } from './RightPanel';
import { MobileTabBar } from './MobileTabBar';
import { LiveFeedBar } from './LiveFeedBar';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { useAppStore } from '@/lib/store';
import { useAudioEngine } from '@/lib/audio';
import { SHORTCUT_TO_NAV, NAV_ITEMS } from '@/lib/navigation';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { Loading } from '@/components/ui/Loading';

/**
 * Breadcrumb item type
 */
interface BreadcrumbItem {
  name: string;
  href: string;
}

/**
 * Generate breadcrumbs based on current pathname
 */
function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  return useMemo(() => {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always have Home
    breadcrumbs.push({ name: 'Dashboard', href: '/dashboard' });

    // Map paths to breadcrumb names
    const pathToName: Record<string, string> = {
      '/squad': 'Squad',
      '/tactics': 'Tactics',
      '/training': 'Training',
      '/matches': 'Matches',
      '/match-simulation': 'Live Match',
      '/transfers': 'Transfers',
      '/career': 'Career',
      '/finances': 'Finances',
      '/press': 'Press',
      '/settings': 'Settings',
    };

    // Check if current path has a name
    if (pathname in pathToName && pathname !== '/dashboard') {
      breadcrumbs.push({ name: pathToName[pathname], href: pathname });
    }

    return breadcrumbs;
  }, [pathname]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = useBreadcrumbs(pathname);

  useAudioEngine();

  useEffect(() => {
    useAppStore.getState().setHasHydrated(true);
  }, []);

  // Enhanced keyboard navigation with better conflict handling
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't trigger shortcuts when typing in inputs
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      // Allow browser shortcuts (Ctrl+K, Ctrl+F, etc.)
      if (e.metaKey || e.ctrlKey) {
        // Only prevent default for our specific shortcuts
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
        }
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Rate limit shortcuts to prevent accidental triggers
      if (key in SHORTCUT_TO_NAV && now - lastKeyTime > 500) {
        const section = SHORTCUT_TO_NAV[key];
        const item = NAV_ITEMS.find((i) => i.id === section);
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
      }

      // Escape key goes back
      if (key === 'escape') {
        router.back();
      }

      lastKey = key;
      lastKeyTime = now;
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const isStartPage = pathname === '/' || pathname === '/start';
  const isAuthPage = pathname.startsWith('/auth');

  // For start and auth pages, don't show the shell
  if (isStartPage || isAuthPage) {
    return (
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base safe-area-all relative">
      <AnimatedBackground variant={pathname.includes('match-simulation') ? 'matchday' : 'default'} />

      {/* Left Navigation Rail */}
      <LeftRail breadcrumbs={breadcrumbs} />

      {/* Main Content Area */}
      <div
        className="flex flex-col flex-1 min-w-0 md:ml-[72px] relative z-10"
        style={{ marginLeft: 'var(--nav-rail-width)' }}
      >
        {/* Top Bar with Breadcrumb */}
        <TopBar breadcrumbs={breadcrumbs} />

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 relative z-10">
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative z-10">
            <ErrorBoundary>
              <Suspense fallback={<Loading fullPage message="Loading..." />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </main>

          {/* Right Panel */}
          <RightPanel />
        </div>

        {/* Live Feed Bar (Desktop only) */}
        <div className="livefeed-bar hidden md:block">
          <LiveFeedBar />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileTabBar />

      {/* Spacer for mobile tab bar */}
      <div className="md:hidden h-[var(--mobile-tabbar-height)] shrink-0 safe-area-bottom" />
    </div>
  );
}
