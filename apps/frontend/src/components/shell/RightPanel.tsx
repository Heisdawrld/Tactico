'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Newspaper, ArrowLeftRight, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

type FeedItem = {
  id: string;
  type: 'transfer' | 'result' | 'injury' | 'news' | 'rumor';
  title: string;
  subtitle: string;
  time: string;
  trend?: 'up' | 'down';
};

// Initial placeholder feed items — will be replaced by live data later
const INITIAL_FEED: FeedItem[] = [
  {
    id: '1',
    type: 'transfer',
    title: 'Mbappé → Real Madrid',
    subtitle: '€180M fee agreed, 5-year contract',
    time: '2m ago',
    trend: 'up',
  },
  {
    id: '2',
    type: 'result',
    title: 'Man City 3-1 Arsenal',
    subtitle: 'Haaland brace keeps title race alive',
    time: '14m ago',
  },
  {
    id: '3',
    type: 'injury',
    title: 'Salah ruled out 3 weeks',
    subtitle: 'Hamstring strain in training',
    time: '32m ago',
    trend: 'down',
  },
  {
    id: '4',
    type: 'news',
    title: 'Premier League fixtures updated',
    subtitle: 'Matchday 28 schedule released',
    time: '1h ago',
  },
  {
    id: '5',
    type: 'rumor',
    title: 'Bayern monitoring Vinicius Jr.',
    subtitle: 'Release clause €1B, per reports',
    time: '2h ago',
  },
  {
    id: '6',
    type: 'result',
    title: 'Barcelona 2-0 Sevilla',
    subtitle: 'Lewandowski scores 25th of season',
    time: '3h ago',
  },
];

/**
 * Right Panel — collapsible live feed.
 *
 * Shows:
 * - "Live Feed" header with LIVE indicator
 * - Filterable feed items (transfers, results, news, etc.)
 * - Mini league table preview
 * - Top scorer ticker
 *
 * 340px wide on desktop. Hidden on mobile/tablet.
 */
export function RightPanel() {
  const open = useAppStore((s) => s.rightPanelOpen);
  const [filter, setFilter] = useState<'all' | 'transfer' | 'result' | 'news'>('all');
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);

  // Refresh feed every 60s (placeholder — real impl would use Socket.io)
  useEffect(() => {
    const id = setInterval(() => {
      // Would fetch from /api/feed here
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = filter === 'all' ? feed : feed.filter((i) => i.type === filter);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="
            hidden lg:flex flex-col shrink-0
            glass border-l border-white/5
            overflow-hidden
          "
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary-c">
                Live Feed
              </span>
            </div>
            <span className="text-[10px] text-tertiary-c font-mono">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Filter pills */}
          <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5 overflow-x-auto no-scrollbar">
            {(['all', 'transfer', 'result', 'news'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap',
                  filter === f
                    ? 'bg-gold-soft text-gold-300 border border-gold-soft'
                    : 'text-tertiary-c hover:text-primary-c hover:bg-white/5'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Feed list */}
          <div className="flex-1 overflow-y-auto scroll-region">
            <AnimatePresence initial={false}>
              {filtered.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="feed-row cursor-pointer"
                >
                  <FeedIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-primary-c text-xs text-truncate-1">{item.title}</span>
                      {item.trend === 'up' && <TrendingUp className="w-3 h-3 text-success shrink-0" />}
                      {item.trend === 'down' && <TrendingDown className="w-3 h-3 text-danger shrink-0" />}
                    </div>
                    <div className="text-[10px] text-tertiary-c text-truncate-1 mt-0.5">{item.subtitle}</div>
                  </div>
                  <span className="text-[9px] text-quaternary-c font-mono shrink-0">{item.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Mini league table */}
          <div className="shrink-0 border-t border-white/5 p-3">
            <div className="section-header !mb-2 !text-[10px]">
              <Trophy className="w-3 h-3 !text-gold-400" />
              Premier League
            </div>
            <div className="space-y-0.5">
              {[
                { pos: 1, name: 'Man City', pts: 78, gd: '+54' },
                { pos: 2, name: 'Arsenal', pts: 75, gd: '+42' },
                { pos: 3, name: 'Liverpool', pts: 71, gd: '+38' },
                { pos: 4, name: 'Aston Villa', pts: 64, gd: '+18' },
              ].map((row) => (
                <div
                  key={row.pos}
                  className="flex items-center gap-2 px-1.5 py-1 text-[11px] hover:bg-white/5 rounded-sm transition-colors"
                >
                  <span
                    className={cn(
                      'w-4 text-center font-mono font-bold',
                      row.pos <= 4 ? 'text-gold-300' : 'text-tertiary-c'
                    )}
                  >
                    {row.pos}
                  </span>
                  <span className="flex-1 text-primary-c text-truncate-1">{row.name}</span>
                  <span className="text-tertiary-c font-mono tabular-nums">{row.gd}</span>
                  <span className="text-primary-c font-mono font-semibold tabular-nums w-6 text-right">{row.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function FeedIcon({ type }: { type: FeedItem['type'] }) {
  const map = {
    transfer: { icon: ArrowLeftRight, color: 'text-info' },
    result: { icon: Trophy, color: 'text-gold-300' },
    injury: { icon: TrendingDown, color: 'text-danger' },
    news: { icon: Newspaper, color: 'text-tertiary-c' },
    rumor: { icon: Newspaper, color: 'text-warning' },
  };
  const { icon: Icon, color } = map[type];
  return (
    <div className="w-7 h-7 rounded-md bg-surface-3 flex items-center justify-center shrink-0">
      <Icon className={cn('w-3.5 h-3.5', color)} />
    </div>
  );
}
