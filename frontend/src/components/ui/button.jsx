import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority';
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * CAMP buttons.
 *
 * - `solid` is the primary action (Create, Save): midnight navy in light,
 *   an off-white in dark. Keep it to one per view.
 * - `soft` is the default secondary action: a white surface on a hairline.
 * - `outline` is transparent on a hairline; `ghost` has no chrome.
 * - `muted` is the quiet "View all" style link button.
 * - `danger` is for the confirm step of a destructive action.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        solid: 'rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary-hover',
        soft: 'rounded-lg border border-border bg-elevated text-foreground shadow-[var(--shadow-card)] hover:border-card-edge-hover hover:bg-secondary',
        outline: 'rounded-lg border border-border bg-transparent text-foreground hover:bg-secondary',
        muted: 'rounded-lg bg-secondary text-subtle-foreground hover:text-foreground',
        ghost: 'rounded-lg text-subtle-foreground hover:bg-secondary hover:text-foreground',
        danger: 'rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-500/90',
      },
      size: {
        sm: 'h-8 gap-1.5 px-3',
        md: 'h-9 px-4',
        lg: 'h-10 px-5',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'soft',
      size: 'md',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  iconRight,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : 'button'
  const icon = iconRight
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}>
      <Slottable>{children}</Slottable>
      {icon ? (
        <span aria-hidden="true" className="-ml-1 inline-flex">
          {icon}
        </span>
      ) : null}
    </Comp>
  );
}

export { Button, buttonVariants }
