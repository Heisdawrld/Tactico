'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getOfflineClub, OFFLINE_CLUBS } from '@/lib/game-data';
import type { Club } from '@/types/club';

/**
 * useSelectedClub  the definitive hydration-safe hook.
 *
 * Uses the standard Next.js "mounted" pattern:
 * 1. SSR + first client render: mounted=false  club=null  page returns null
 * 2. After useEffect: mounted=true  club from localStorage  page renders content
 *
 * This avoids BOTH:
 * - SSR crashes (club is null  return null  no crash)
 * - Hydration mismatches (SSR and first client render both return null)
 *
 * NEW: Added loading state for better UX
 */
export function useSelectedClub(): { club: Club | null; hydrated: boolean; loading: boolean } {
  const selectedClubId = useAppStore((s) => s.selectedClubId);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Small delay to prevent flash of loading state
    const timer = setTimeout(() => {
      setMounted(true);
      setLoading(false);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const club = useMemo(() => {
    if (!mounted) return null;
    if (!selectedClubId) return null;
    
    // Try to get from offline data
    const offlineClub = getOfflineClub(selectedClubId);
    if (offlineClub) return offlineClub;
    
    // Fallback to first club if selected club not found
    return OFFLINE_CLUBS[0];
  }, [selectedClubId, mounted]);

  return { club, hydrated: mounted, loading };
}

/**
 * Hook to check if user has selected a club and the app is ready
 */
export function useClubReady(): boolean {
  const { club, hydrated, loading } = useSelectedClub();
  return !loading && hydrated && club !== null;
}
