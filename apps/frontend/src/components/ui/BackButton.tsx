'use client';

import { useRouter } from 'next/navigation';
import { Button, ButtonProps } from './Button';
import { ChevronLeft, ArrowLeft } from 'lucide-react';

export interface BackButtonProps extends ButtonProps {
  to?: string;
  label?: string;
  showOnMobile?: boolean;
}

/**
 * BackButton - Consistent back navigation across the app
 * 
 * Features:
 * - Uses browser history by default
 * - Can specify a custom `to` path
 * - Responsive (hidden on mobile by default)
 * - Consistent styling with other buttons
 */
export function BackButton({
  to,
  label = 'Back',
  showOnMobile = false,
  className,
  variant = 'ghost',
  size = 'sm',
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (to) {
      router.push(to);
    } else {
      router.back();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={cn(
        'flex items-center gap-2',
        !showOnMobile && 'hidden sm:flex',
        className
      )}
      {...props}
    >
      <ChevronLeft className="w-4 h-4" />
      {label && <span>{label}</span>}
    </Button>
  );
}

/**
 * BackButton that always shows (even on mobile)
 */
export function AlwaysBackButton({ to, label = 'Back', ...props }: Omit<BackButtonProps, 'showOnMobile'>) {
  return <BackButton to={to} label={label} showOnMobile={true} {...props} />;
}

/**
 * CloseButton - For modals/dialogs
 */
export function CloseButton({ onClick, label = 'Close', ...props }: Omit<BackButtonProps, 'to' | 'showOnMobile'> & { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="flex items-center gap-2"
      {...props}
    >
      <ArrowLeft className="w-4 h-4" />
      {label && <span>{label}</span>}
    </Button>
  );
}

// Import cn from utils
import { cn } from '@/lib/utils';
