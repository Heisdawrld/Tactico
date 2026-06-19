'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card — premium surface container.
 * Two variants: default (subtle elevation) and elevated (higher elevation + lighter bg).
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'elevated' | 'glass';
    hover?: boolean;
  }
>(({ className, variant = 'default', hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border transition-all duration-300',
      variant === 'default' && 'bg-gradient-to-b from-surface-2 to-surface-3 border-white/5 shadow-card',
      variant === 'elevated' && 'bg-gradient-to-b from-surface-3 to-surface-4 border-white/8 shadow-md',
      variant === 'glass' && 'glass',
      hover && 'hover:border-gold-soft hover:shadow-card-hover hover:-translate-y-0.5',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between px-4 py-3 border-b border-white/5', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display font-semibold text-sm tracking-tight text-primary-c', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-tertiary-c mt-0.5', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center px-4 py-3 border-t border-white/5', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
