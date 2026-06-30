'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS } from '@/lib/navigation';
import { useAppStore } from '@/lib/store';
import { playSfx } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { TacticoLogo } from '@/components/ui/TacticoLogo';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface LeftRailProps {
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Left Rail  primary navigation.
 *
 * Behavior:
 * - Desktop (>=lg): 72px collapsed rail. On hover, expands to 220px showing labels.
 * - Tablet (md): Always expanded 220px.
 * - Mobile (<md): Hidden  bottom tab bar takes over.
 *
 * Active item gets a gold accent + glow.
 */
export function LeftRail({ breadcrumbs = [] }: LeftRailProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const setLeftRailExpanded = useAppStore((s) => s.setLeftRailExpanded);
  const expanded = useAppStore((s) => s.leftRailExpanded);

  // Sync expanded state for other components to read
  useEffect(() => {
    setLeftRailExpanded(hovered);
  }, [hovered, setLeftRailExpanded]);

  return (
    <motion.aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ width: expanded ? 220 : 72 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="
        hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-fixed
        glass-heavy border-r border-white/5
        no-select
      "
      style={{ width: 72 }}
    >
      {/* Brand / Logo */}
      <div className="flex items-center h-[var(--topbar-height)] px-4 border-b border-white/5 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-gold-300 hover:text-gold-200 transition-colors"
          onClick={() => playSfx('click')}
        >
          <TacticoLogo size={36} variant="mark" />
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="font-headline text-lg font-bold tracking-tight gradient-text-premium leading-none">
                  TACTICO
                </div>
                <div className="text-[10px] text-tertiary-c font-mono tracking-widest mt-0.5">
                  FOOTBALL INTEL
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => playSfx('tab-switch')}
              className={cn(
                'group relative flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-200',
                'text-sm font-medium',
                isActive
                  ? 'bg-gold-soft text-gold-300 shadow-gold'
                  : 'text-secondary-c hover:bg-white/5 hover:text-primary-c'
              )}
              title={item.label}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-gradient-to-b from-gold-200 to-gold-500"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform',
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                  >
                    <span>{item.label}</span>
                    {item.badge === 'live' && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-danger-soft text-danger text-[9px] font-bold tracking-wider">
                        <span className="live-dot !w-1.5 !h-1.5" /> LIVE
                      </span>
                    )}
                    {item.badge === 'new' && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-gold-soft text-gold-300 text-[9px] font-bold tracking-wider border border-gold-soft">
                        NEW
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyboard shortcut tooltip when collapsed */}
              {!expanded && (
                <div className="absolute left-full ml-3 px-2 py-1 rounded-md glass-heavy text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-tooltip">
                  <span className="font-medium">{item.label}</span>
                  <span className="kbd ml-2">{item.shortcut}</span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer  version + status */}
      <div className="shrink-0 px-3 py-3 border-t border-white/5">
        <div className={cn('flex items-center gap-2', !expanded && 'justify-center')}>
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-tertiary-c font-mono tracking-widest whitespace-nowrap"
              >
                v0.4.0 B7 ONLINE
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
