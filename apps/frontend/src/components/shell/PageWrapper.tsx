'use client';

import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { Loading, PageLoading } from '@/components/ui/Loading';
import { EmptyState, NoClubSelected } from '@/components/ui/EmptyState';
import { useClubReady, useSelectedClub } from '@/lib/useSelectedClub';

interface PageWrapperProps {
  children: ReactNode;
  requireClub?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * PageWrapper  Handles loading, error, and empty states for pages
 * 
 * Features:
 * - Error boundaries to catch and display errors
 * - Loading states while data is being fetched
 * - Empty states when no club is selected (if requireClub=true)
 * - Suspense for async components
 */
export function PageWrapper({
  children,
  requireClub = true,
  loadingMessage = 'Loading...',
  emptyTitle = 'No Club Selected',
  emptyDescription = 'Please select a club to start managing',
}: PageWrapperProps) {
  const { club, hydrated, loading } = useSelectedClub();
  const isReady = useClubReady();

  // Show loading state
  if (loading) {
    return <PageLoading message={loadingMessage} />;
  }

  // Show empty state if club is required but not selected
  if (requireClub && !isReady) {
    return <NoClubSelected />;
  }

  // Wrap with error boundary and suspense
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading message={loadingMessage} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Simple wrapper for pages that don't require a club
 */
export function SimplePageWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading message="Loading..." />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Wrapper for the start/onboarding pages (no club required)
 */
export function OnboardingWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
