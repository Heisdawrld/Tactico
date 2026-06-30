'use client';

import { motion } from 'framer-motion';
import { Button } from './Button';
import { LayoutDashboard, Users, Calendar, Settings, AlertCircle } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  showHomeButton?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="w-12 h-12" />,
  squad: <Users className="w-12 h-12" />,
  matches: <Calendar className="w-12 h-12" />,
  settings: <Settings className="w-12 h-12" />,
  error: <AlertCircle className="w-12 h-12" />,
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
  showHomeButton = true,
}: EmptyStateProps) {
  const Icon = icon || iconMap.dashboard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center p-8"
    >
      <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <span className="text-muted-foreground">{Icon}</span>
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        {onAction && actionLabel && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        
        {actionHref && actionLabel && (
          <Button asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        )}

        {showHomeButton && (
          <Button variant="outline" asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function NoClubSelected() {
  return (
    <EmptyState
      title="No Club Selected"
      description="Please select a club to start managing"
      icon={<Users className="w-12 h-12" />}
      actionLabel="Select Club"
      actionHref="/start"
      showHomeButton={false}
    />
  );
}

export function NoDataAvailable({ type }: { type?: string }) {
  return (
    <EmptyState
      title="No Data Available"
      description={`No ${type || 'data'} found. Please check your connection or try again later.`}
      icon={<AlertCircle className="w-12 h-12" />}
      onAction={() => window.location.reload()}
      actionLabel="Reload"
    />
  );
}
