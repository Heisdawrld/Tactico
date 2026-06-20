'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Live Feed Bar — Bloomberg-style ticker at the bottom of the screen.
 *
 * Shows scrolling feed of live scores, transfers, news headlines.
 * 36px tall, fixed to bottom on desktop (above right panel), hidden on mobile.
 *
 * Loops infinitely. Pauses on hover.
 */

type TickerItem = {
  id: string;
  category: 'SCORE' | 'TRANSFER' | 'NEWS' | 'STAT' | 'INJURY';
  text: string;
  tone?: 'gold' | 'success' | 'danger' | 'warning' | 'neutral';
};

const INITIAL_TICKER: TickerItem[] = [
  { id: '1', category: 'SCORE', text: 'MCI 3-1 ARS · FT', tone: 'gold' },
  { id: '2', category: 'TRANSFER', text: 'Mbappé → Real Madrid · €180M', tone: 'neutral' },
  { id: '3', category: 'STAT', text: 'Haaland · 28 goals · Premier League top scorer', tone: 'success' },
  { id: '4', category: 'NEWS', text: 'Champions League QF draw: Real vs Bayern, City vs PSG', tone: 'neutral' },
  { id: '5', category: 'INJURY', text: 'Salah · hamstring · 3 weeks out', tone: 'danger' },
  { id: '6', category: 'SCORE', text: 'BAR 2-0 SEV · FT', tone: 'gold' },
  { id: '7', category: 'TRANSFER', text: 'Vinicius Jr. → Bayern? · Rumor', tone: 'warning' },
  { id: '8', category: 'STAT', text: 'Bellingham · 21 goals · best midfielder season', tone: 'success' },
  { id: '9', category: 'SCORE', text: 'BAY 4-0 DOR · FT', tone: 'gold' },
  { id: '10', category: 'NEWS', text: 'Premier League MD28 fixtures released', tone: 'neutral' },
];

const TONE_COLORS: Record<TickerItem['category'], string> = {
  SCORE: 'text-gold-300',
  TRANSFER: 'text-info',
  NEWS: 'text-tertiary-c',
  STAT: 'text-success',
  INJURY: 'text-danger',
};

export function LiveFeedBar() {
  const [items, setItems] = useState<TickerItem[]>(INITIAL_TICKER);

  // Refresh every 5 minutes (placeholder — real impl would use Socket.io)
  useEffect(() => {
    const id = setInterval(() => {
      // Would fetch from /api/ticker here
    }, 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  // Duplicate items so the ticker scrolls seamlessly
  const doubled = [...items, ...items];

  return (
    <div
      className="
        hidden md:flex items-center
        h-[var(--livefeed-height)]
        glass border-t border-white/5
        shrink-0 z-sticky
      "
    >
      {/* LIVE indicator */}
      <div className="flex items-center gap-1.5 px-3 h-full border-r border-white/5 bg-danger/5 shrink-0">
        <span className="live-dot !w-1.5 !h-1.5" />
        <span className="text-[10px] font-bold tracking-widest text-danger font-mono">LIVE</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 ticker-wrap">
        <div className="ticker-content">
          {doubled.map((item, idx) => (
            <span
              key={`${item.id}-${idx}`}
              className="inline-flex items-center gap-2 px-4 text-[11px] font-mono"
            >
              <span className={cn('font-bold tracking-wider', TONE_COLORS[item.category])}>
                {item.category}
              </span>
              <span className="text-secondary-c">{item.text}</span>
              <span className="text-quaternary-c">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Right-side clock */}
      <div className="hidden lg:flex items-center gap-2 px-3 h-full border-l border-white/5 shrink-0">
        <span className="text-[10px] text-tertiary-c font-mono">UPDATED</span>
        <Clock />
      </div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="text-[11px] font-mono text-gold-300 tabular-nums">{time}</span>;
}
