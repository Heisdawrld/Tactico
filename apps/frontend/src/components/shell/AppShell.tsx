'use client';

import { useEffect } from 'react';
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
import { SHORTCUT_TO_NAV } from '@/lib/navigation';
import { NAV_ITEMS } from '@/lib/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useAudioEngine();

  useEffect(() => {
    useAppStore.getState().setHasHydrated(true);
  }, []);

  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

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

  const isStartPage = pathname === '/' || pathname === '/start';

  if (isStartPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base safe-area-all relative">
      <AnimatedBackground variant={pathname.includes('match-simulation') ? 'matchday' : 'default'} />

      <LeftRail />

      <div
        className="flex flex-col flex-1 min-w-0 md:ml-[72px] relative z-10"
        style={{ marginLeft: 'var(--nav-rail-width)' }}
      >
        <TopBar />

        <div className="flex flex-1 min-h-0 relative z-10">
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative z-10">
            {children}
          </main>

          <RightPanel />
        </div>

        <div className="livefeed-bar hidden md:block">
          <LiveFeedBar />
        </div>
      </div>

      <MobileTabBar />

      <div className="md:hidden h-[var(--mobile-tabbar-height)] shrink-0 safe-area-bottom" />
    </div>
  );
}
