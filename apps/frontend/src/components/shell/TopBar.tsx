'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { playSfx } from '@/lib/audio';
import { cn, formatCurrency } from '@/lib/utils';
import { getOfflineClub } from '@/lib/game-data';
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
  Home,
  Play,
} from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[];
}

function formatGameDate(value: string) {
  if (!value) return 'Pre-season';
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function phaseLabel(phase: string) {
  return phase.replaceAll('_', ' ');
}

/** Contextual Football Manager-style header with a persistent Continue action. */
export function TopBar({ breadcrumbs = [] }: TopBarProps) {
  const currentSeason = useAppStore((s) => s.currentSeason);
  const currentWeek = useAppStore((s) => s.currentWeek);
  const currentDate = useAppStore((s) => s.currentDate);
  const currentPhase = useAppStore((s) => s.currentPhase);
  const continueGame = useAppStore((s) => s.continueGame);
  const inbox = useAppStore((s) => s.inbox);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const toggleAudio = useAppStore((s) => s.toggleAudio);
  const rightPanelOpen = useAppStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useAppStore((s) => s.toggleRightPanel);
  const selectedClubId = useAppStore((s) => s.selectedClubId);

  const [now, setNow] = useState<Date | null>(null);

  const club = useMemo(() => {
    if (!selectedClubId) return null;
    const c = getOfflineClub(selectedClubId);
    return c ? { name: c.name, shortName: c.shortName, homeKitColor: c.homeKitColor } : null;
  }, [selectedClubId]);

  const finances = useMemo(() => {
    if (!selectedClubId) return { balance: 0, wageBudget: 0, transferBudget: 0 };
    const c = getOfflineClub(selectedClubId);
    return c
      ? { balance: c.balance, wageBudget: c.wageBudget, transferBudget: c.transferBudget }
      : { balance: 0, wageBudget: 0, transferBudget: 0 };
  }, [selectedClubId]);

  const importantMessages = inbox.filter((item) => item.priority === 'high').length;
  const isMatchday = currentPhase === 'matchday';

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-sticky h-[var(--topbar-height)] flex items-center gap-3 px-3 lg:px-5 glass border-b border-white/5">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {breadcrumbs.length > 0 && (
          <div className="hidden xl:flex items-center gap-1 text-xs text-tertiary-c">
            <Link href="/dashboard" className="p-1 rounded hover:bg-white/5 transition-colors" title="Go to Home">
              <Home className="w-3 h-3" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-primary-c font-medium">{crumb.name}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-primary-c transition-colors">{crumb.name}</Link>
                )}
              </span>
            ))}
          </div>
        )}

        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-headline font-bold text-sm text-black shadow-md"
          style={{
            background: club
              ? `linear-gradient(135deg, ${club.homeKitColor}, ${club.homeKitColor}99)`
              : 'linear-gradient(135deg, var(--gold-300), var(--gold-500))',
          }}
        >
          {club?.shortName?.slice(0, 2) ?? 'TC'}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-semibold text-sm text-primary-c text-truncate-1">
              {club?.name ?? 'Select a Club'}
            </span>
            <ChevronRight className="w-3 h-3 text-tertiary-c hidden sm:block" />
            <span className="text-xs text-tertiary-c hidden sm:block">Season {currentSeason}</span>
          </div>
          <div className="text-[10px] text-tertiary-c font-mono tracking-wide mt-0.5 flex items-center gap-2 uppercase">
            <span className="flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {formatGameDate(currentDate)}
            </span>
            <span className="hidden sm:inline">· Week {currentWeek}</span>
            <span className={cn('hidden md:inline', isMatchday && 'text-danger')}>· {phaseLabel(currentPhase)}</span>
          </div>
        </div>
      </div>

      <div className="hidden 2xl:flex items-center gap-1 px-2">
        <FinanceStat icon={<Wallet className="w-3 h-3" />} label="BAL" value={formatCurrency(finances.balance)} tone={finances.balance >= 0 ? 'neutral' : 'danger'} />
        <FinanceStat label="WAGE" value={formatCurrency(finances.wageBudget)} tone="neutral" />
        <FinanceStat label="TRF" value={formatCurrency(finances.transferBudget)} tone="gold" />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-3 hover:bg-surface-4 text-tertiary-c text-xs border border-white/5 transition-colors"
          onClick={() => playSfx('click')}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <span className="kbd">⌘K</span>
        </button>

        <button
          onClick={() => {
            toggleAudio();
            playSfx('click');
          }}
          className={cn(
            'relative p-2 rounded-md transition-colors',
            audioEnabled ? 'text-gold-300 bg-gold-soft' : 'text-tertiary-c hover:bg-white/5 hover:text-primary-c',
          )}
          title={audioEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <Link
          href="/inbox"
          onClick={() => playSfx('notification')}
          className={cn(
            'relative p-2 rounded-md transition-colors',
            importantMessages > 0 ? 'text-gold-300' : 'text-tertiary-c hover:bg-white/5 hover:text-primary-c',
          )}
          title="Inbox"
        >
          <Bell className="w-4 h-4" />
          {importantMessages > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center">
              {Math.min(importantMessages, 9)}
            </span>
          )}
        </Link>

        <button
          onClick={() => {
            toggleRightPanel();
            playSfx('click');
          }}
          className={cn(
            'hidden xl:flex p-2 rounded-md transition-colors',
            rightPanelOpen ? 'text-gold-300 bg-gold-soft' : 'text-tertiary-c hover:bg-white/5 hover:text-primary-c',
          )}
          title={rightPanelOpen ? 'Hide live feed' : 'Show live feed'}
        >
          {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            continueGame();
            playSfx('click');
          }}
          disabled={!selectedClubId}
          className={cn(
            'ml-1 inline-flex h-9 items-center gap-2 rounded-md px-3 sm:px-4 text-xs font-display font-bold uppercase tracking-wider transition-all',
            isMatchday
              ? 'bg-danger text-white shadow-lg shadow-danger/20 hover:brightness-110'
              : 'bg-gold-300 text-surface-base shadow-gold hover:bg-gold-200',
            !selectedClubId && 'cursor-not-allowed opacity-40',
          )}
          title={isMatchday ? 'Open matchday actions' : 'Advance the game by one day'}
        >
          <span className="hidden sm:inline">{isMatchday ? 'Matchday' : 'Continue'}</span>
          <Play className="h-3.5 w-3.5 fill-current" />
        </motion.button>
      </div>
    </header>
  );
}

function FinanceStat({ icon, label, value, tone = 'neutral' }: {
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
        <span className={cn(
          'text-xs font-mono font-semibold tabular-nums mt-0.5',
          tone === 'gold' && 'text-gold-300',
          tone === 'danger' && 'text-danger',
          tone === 'neutral' && 'text-primary-c',
        )}>
          {value}
        </span>
      </div>
    </div>
  );
}
