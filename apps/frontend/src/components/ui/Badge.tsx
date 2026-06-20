'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — small status indicator.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-3 text-secondary-c border border-white/5',
        gold: 'bg-gold-soft text-gold-300 border border-gold-soft',
        success: 'bg-success/15 text-success border border-success/25',
        warning: 'bg-warning/15 text-warning border border-warning/25',
        danger: 'bg-danger/15 text-danger border border-danger/25',
        info: 'bg-info/15 text-info border border-info/25',
        outline: 'border border-white/10 text-secondary-c',
      },
      size: {
        sm: 'text-[9px] px-1.5 py-0.5',
        md: 'text-[10px] px-2 py-0.5',
        lg: 'text-xs px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
