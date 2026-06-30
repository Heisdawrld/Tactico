'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function Loading({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </motion.div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen">
      <Loading message={message} size="lg" />
    </div>
  );
}

export function SuspenseLoading() {
  return <Loading message="Loading data..." fullPage />;
}
