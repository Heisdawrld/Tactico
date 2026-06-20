'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MOBILE_NAV_ITEMS } from '@/lib/navigation';
import { playSfx } from '@/lib/audio';
import { cn } from '@/lib/utils';

/**
 * Mobile Tab Bar — bottom navigation for mobile/PWA.
 *
 * Shows 5 most-used sections as tabs with icons + labels.
 * Active tab gets gold accent + indicator dot.
 *
 * 64px tall, fixed to bottom, glassmorphic.
 */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="
        mobile-tabbar-compact
        md:hidden fixed bottom-0 left-0 right-0 z-fixed
        h-[var(--mobile-tabbar-height)]
        glass-heavy border-t border-white/5
        flex items-stretch
        safe-area-bottom
      "
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => playSfx('tab-switch')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors',
              isActive ? 'text-gold-300' : 'text-tertiary-c active:text-primary-c'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="mobile-active-indicator"
                className="absolute top-0 w-8 h-0.5 rounded-b bg-gradient-to-r from-gold-200 to-gold-500"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <div className="relative">
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {item.badge === 'live' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
              )}
            </div>
            <span
              className={cn(
                'text-[9px] font-semibold uppercase tracking-wider',
                !isActive && 'opacity-70'
              )}
            >
              {item.shortLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
