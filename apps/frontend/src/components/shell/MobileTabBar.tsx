'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS, MOBILE_NAV_ITEMS } from '@/lib/navigation';
import { playSfx } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { MoreHorizontal, X } from 'lucide-react';

/**
 * Mobile Tab Bar — bottom navigation for mobile/PWA.
 *
 * Shows 5 most-used sections as tabs + a "More" button that opens
 * a bottom sheet with ALL remaining tabs.
 *
 * 64px tall, fixed to bottom, glassmorphic.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // The "more" tabs = all tabs NOT in the mobile 5
  const moreItems = NAV_ITEMS.filter(
    (item) => !MOBILE_NAV_ITEMS.some((m) => m.id === item.id)
  );

  // Check if any "more" item is currently active
  const moreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <>
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

        {/* More button */}
        <button
          onClick={() => { setMoreOpen(true); playSfx('click'); }}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors',
            moreActive ? 'text-gold-300' : 'text-tertiary-c active:text-primary-c'
          )}
        >
          {moreActive && (
            <motion.div
              layoutId="mobile-active-indicator"
              className="absolute top-0 w-8 h-0.5 rounded-b bg-gradient-to-r from-gold-200 to-gold-500"
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <MoreHorizontal className="w-5 h-5" strokeWidth={moreActive ? 2.5 : 2} />
          <span className={cn('text-[9px] font-semibold uppercase tracking-wider', !moreActive && 'opacity-70')}>
            More
          </span>
        </button>
      </nav>

      {/* More sheet — bottom drawer with all remaining tabs */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-modal flex items-end"
            onClick={() => setMoreOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full glass-heavy rounded-t-2xl border-t border-white/8 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-xs font-mono uppercase tracking-widest text-tertiary-c font-bold">
                  All Sections
                </span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-md hover:bg-white/5 text-tertiary-c hover:text-primary-c"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of all tabs */}
              <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => { playSfx('tab-switch'); setMoreOpen(false); }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all',
                        isActive
                          ? 'bg-gold-soft border-gold-300 text-gold-300'
                          : 'bg-surface-2 border-white/5 text-tertiary-c hover:border-white/14 hover:text-primary-c'
                      )}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-center leading-tight">
                        {item.shortLabel}
                      </span>
                      {item.badge === 'live' && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
