'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { playSfx } from '@/lib/audio';

/**
 * Tactico Button — premium gaming button with 4 variants.
 * Auto-plays click SFX on press (if audio enabled).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] no-select',
  {
    variants: {
      variant: {
        // Gold gradient premium button
        gold: 'bg-gradient-to-br from-gold-300 to-gold-500 text-black shadow-[0_2px_8px_rgba(255,215,0,0.30),inset_0_1px_0_rgba(255,255,255,0.30)] hover:shadow-[0_4px_16px_rgba(255,215,0,0.50),inset_0_1px_0_rgba(255,255,255,0.40)] hover:-translate-y-px',
        // Surface-toned secondary button
        secondary: 'bg-surface-4 text-primary-c border border-white/8 hover:bg-surface-5 hover:border-white/14 hover:-translate-y-px',
        // Subtle ghost button
        ghost: 'text-secondary-c hover:bg-white/5 hover:text-primary-c',
        // Danger (destructive) button
        danger: 'bg-danger/15 text-danger border border-danger/25 hover:bg-danger/22 hover:border-danger/40',
        // Outline gold button
        outline: 'border border-gold-300/30 text-gold-300 hover:bg-gold-soft hover:border-gold-300/50',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
        'icon-lg': 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'gold',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Whether to play the click SFX on press. Default: true */
  silent?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, silent = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!silent) playSfx('click');
          onClick?.(e);
        }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
