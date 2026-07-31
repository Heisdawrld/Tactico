'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Inbox,
  Newspaper,
  Shield,
  Users,
} from 'lucide-react';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { useAppStore, type InboxItem } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playSfx } from '@/lib/audio';

type InboxFilter = 'all' | InboxItem['category'];

const FILTERS: Array<{ id: InboxFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'match', label: 'Matches' },
  { id: 'club', label: 'Club' },
  { id: 'board', label: 'Board' },
  { id: 'media', label: 'Media' },
  { id: 'world', label: 'World' },
];

function categoryIcon(category: InboxItem['category']) {
  if (category === 'match') return CalendarDays;
  if (category === 'board') return Shield;
  if (category === 'media' || category === 'world') return Newspaper;
  return Users;
}

function formatGameDate(value: string) {
  if (!value) return 'Today';
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function InboxContent() {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const inbox = useAppStore((state) => state.inbox);
  const currentDate = useAppStore((state) => state.currentDate);
  const currentPhase = useAppStore((state) => state.currentPhase);

  const filteredItems = useMemo(
    () => inbox.filter((item) => filter === 'all' || item.category === filter),
    [filter, inbox],
  );

  const urgentCount = inbox.filter((item) => item.priority === 'high').length;

  return (
    <div className="min-h-full px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <section className="glass-heavy overflow-hidden rounded-xl border border-white/8">
          <div className="flex flex-col gap-4 border-b border-white/6 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-soft text-gold-300">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-primary-c">Inbox</h1>
                  {urgentCount > 0 && (
                    <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
                      {urgentCount} important
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-tertiary-c">
                  {formatGameDate(currentDate)} · {currentPhase.replaceAll('_', ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-tertiary-c">
              <BellRing className="h-4 w-4 text-gold-300" />
              Decisions and matchday actions appear here first.
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-white/6 px-3 py-2 no-scrollbar lg:px-5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setFilter(item.id);
                  playSfx('tab-switch');
                }}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  filter === item.id
                    ? 'bg-gold-soft text-gold-300'
                    : 'text-tertiary-c hover:bg-white/5 hover:text-primary-c',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-white/5">
            {filteredItems.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <Inbox className="mb-3 h-8 w-8 text-tertiary-c" />
                <h2 className="font-display font-semibold text-primary-c">No messages here</h2>
                <p className="mt-1 max-w-md text-sm text-tertiary-c">
                  Continue the game to receive staff reports, match briefings and board updates.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const Icon = categoryIcon(item.category);
                return (
                  <article
                    key={item.id}
                    className={cn(
                      'group grid gap-3 px-4 py-4 transition-colors hover:bg-white/[0.025] sm:grid-cols-[40px_minmax(0,1fr)_auto] lg:px-6',
                      item.priority === 'high' && 'bg-gold-[0.025]',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg bg-surface-3 text-tertiary-c',
                        item.priority === 'high' && 'bg-gold-soft text-gold-300',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-sm font-semibold text-primary-c sm:text-base">
                          {item.title}
                        </h2>
                        {item.priority === 'high' && <CircleDot className="h-3 w-3 text-danger" />}
                        <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-tertiary-c">
                          {item.category}
                        </span>
                      </div>
                      <p className="mt-1 max-w-4xl text-sm leading-6 text-secondary-c">{item.body}</p>
                      <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-tertiary-c">
                        {formatGameDate(item.createdAt)}
                      </p>
                    </div>

                    {item.actionPath && item.actionLabel && (
                      <Link
                        href={item.actionPath}
                        onClick={() => playSfx('click')}
                        className="inline-flex h-9 items-center justify-center gap-1.5 self-center rounded-md bg-gold-soft px-3 text-xs font-bold text-gold-300 transition-colors hover:bg-gold-300 hover:text-surface-base"
                      >
                        {item.actionLabel}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <PageWrapper requireClub loadingMessage="Opening inbox...">
      <InboxContent />
    </PageWrapper>
  );
}
