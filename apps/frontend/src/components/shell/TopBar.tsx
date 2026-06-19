'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { playSfx } from '@/lib/audio';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ChevronRight,
  Bell,
  Volume2,
  VolumeX,
  Search,
  PanelRightClose,
  PanelRightOpen,
  Calendar,
  Wallet,
} from 'lucide-react';

/**
 * TopBar — contextual header.
 *
 * Layout (left → right):
 *   [breadcrumb] · [club crest + name] · [season · week] · [balance · wage · transfer]
 *                          [search] [audio] [bell] [right-panel toggle]
 *
 * On mobile: collapses to [club crest + name] · [audio] [bell].
 */
export function TopBar() {
  const currentSeason = useAppStore((s) => s.currentSeason);
  const currentWeek = useAppStore((s) => s.currentWeek);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const toggleAudio = useAppStore((s) => s.toggleAudio);
  const rightPanelOpen = useAppStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useAppStore((s) => s.toggleRightPanel);
  const selectedClubId = useAppStore((s) => s.selectedClubId);

  const [club, setClub] = useState<{ name: string; shortName: string; primaryColor: string } | null>(null);
  const [finances, setFinances] = useState<{ balance: number; wageBudget: number; transferBudget: number }>({
    balance: 0,
    wageBudget: 0,
    transferBudget: 0,
  });
  const [hasNotifications, setHasNotifications] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  // Load club + finances from /api/clubs
  useEffect(() => {
    if (!selectedClubId) return;
    fetch('/api/clubs')
      .then((r) => r.json())
      .then((clubs: any[]) => {
        const c = clubs.find((x) => x.id === selectedClubId);
        if (c) {
          setClub({
            name: c.name,
            shortName: c.shortName || c.name.slice(0, 3).toUpperCase(),
            primaryColor: c.homeKitColor || '#FFD700',
          });
          setFinances({
            balance: c.balance ?? 0,
            wageBudget: c.wageBudget ?? 0,
            transferBudget: c.transferBudget ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [selectedClubId]);

  // Live clock (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="
        sticky top-0 z-sticky
        h-[var(--topbar-height)]
        flex items-center gap-4 px-3 lg:px-5
        glass border-b border-white/5
      "
    >
      {/* ---------- LEFT: Breadcrumb + Club identity ---------- */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Club crest (circular, uses club primary color) */}
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-headline font-bold text-sm text-black shadow-md"
          style={{
            background: club
              ? `linear-gradient(135deg, ${club.primaryColor}, ${club.primaryColor}99)`
              : 'linear-gradient(135deg, var(--gold-300), var(--gold-500))',
          }}
        >
          {club?.shortName?.slice(0, 2) ?? 'TC'}
        </div>

        <div className="min-w-0 hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-semibold text-sm text-primary-c text-truncate-1">
              {club?.name ?? 'Select a Club'}
            </span>
            <ChevronRight className="w-3 h-3 text-tertiary-c" />
            <span className="text-xs text-tertiary-c">Season {currentSeason}</span>
          </div>
          <div className="text-[10px] text-tertiary-c font-mono tracking-wide mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              WEEK {currentWeek}
            </span>
            {now && (
              <>
                <span className="text-quaternary-c">·</span>
                <span>
                  {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------- CENTER: Finance snapshot (Bloomberg-dense) — desktop only ---------- */}
      <div className="hidden lg:flex items-center gap-1 px-2">
        <FinanceStat
          icon={<Wallet className="w-3 h-3" />}
          label="BAL"
          value={formatCurrency(finances.balance)}
          tone={finances.balance >= 0 ? 'neutral' : 'danger'}
        />
        <FinanceStat
          label="WAGE"
          value={formatCurrency(finances.wageBudget)}
          tone="neutral"
        />
        <FinanceStat
          label="TRF"
          value={formatCurrency(finances.transferBudget)}
          tone="gold"
        />
      </div>

      {/* ---------- RIGHT: Actions ---------- */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Search (desktop only) */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-3 hover:bg-surface-4 text-tertiary-c text-xs border border-white/5 transition-colors"
          onClick={() => playSfx('click')}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Search</span>
          <span className="kbd hidden lg:inline">⌘K</span>
        </button>

        {/* Audio toggle */}
        <button
          onClick={() => {
            toggleAudio();
            playSfx('click');
          }}
          className={cn(
            'relative p-2 rounded-md transition-colors',
            audioEnabled
              ? 'text-gold-300 bg-gold-soft'
              : 'text-tertiary-c hover:bg-white/5 hover:text-primary-c'
          )}
          title={audioEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {audioEnabled && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            playSfx('notification');
            setHasNotifications(false);
          }}
          className={cn(
            'relative p-2 rounded-md transition-colors',
            hasNotifications
              ? 'text-gold-300'
              : 'text-tertiary-c hover:bg-white/5 hover:text-primary-c'
          )}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {hasNotifications && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          )}
        </button>

        {/* Right panel toggle (desktop only) */}
        <button
          onClick={() => {
            toggleRightPanel();
            playSfx('click');
          }}
          className={cn(
            'hidden lg:flex p-2 rounded-md transition-colors',
            rightPanelOpen
              ? 'text-gold-300 bg-gold-soft'
              : 'text-tertiary-c hover:bg-white/5 hover:text-primary-c'
          )}
          title={rightPanelOpen ? 'Hide live feed' : 'Show live feed'}
        >
          {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}

/**
 * Compact finance stat for the top bar.
 */
function FinanceStat({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: 'neutral' | 'gold' | 'danger';
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2/50 border border-white/3">
      {icon && <span className="text-tertiary-c">{icon}</span>}
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-tertiary-c font-mono tracking-widest uppercase">{label}</span>
        <span
          className={cn(
            'text-xs font-mono font-semibold tabular-nums mt-0.5',
            tone === 'gold' && 'text-gold-300',
            tone === 'danger' && 'text-danger',
            tone === 'neutral' && 'text-primary-c'
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
