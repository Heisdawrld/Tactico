'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import type { Club } from '@/types/club';

/**
 * useSelectedClub — the definitive hydration-safe hook.
 *
 * Uses the standard Next.js "mounted" pattern:
 * 1. SSR + first client render: mounted=false → club=null → page returns null
 * 2. After useEffect: mounted=true → club from localStorage → page renders content
 *
 * This avoids BOTH:
 * - SSR crashes (club is null → return null → no crash)
 * - Hydration mismatches (SSR and first client render both return null)
 */
export function useSelectedClub(): { club: Club | null; hydrated: boolean } {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const club = useMemo(() => {
    if (!mounted) return null;
    if (!selectedClubId) return null;
    return getOfflineClub(selectedClubId) || OFFLINE_CLUBS[0];
  }, [selectedClubId, mounted]);

  return { club, hydrated: mounted };
}
